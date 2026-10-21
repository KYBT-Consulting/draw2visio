const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Minimal DOM / XML / mxGraph mock environment to test VsdxExport & mxVsdxCanvas2D in Node.js
class XmlNode {
	constructor(nodeType, nodeName, nodeValue = null) {
		this.nodeType = nodeType; // 1 = Element, 3 = Text, 9 = Document
		this.nodeName = nodeName;
		this.tagName = nodeName;
		this.nodeValue = nodeValue;
		this.attributes = {};
		this.childNodes = [];
		this.parentNode = null;
	}
	get textContent() {
		if (this.nodeType === 3) return this.nodeValue || '';
		return this.childNodes.map(c => c.textContent).join('');
	}
	get documentElement() {
		return this.childNodes.find(c => c.nodeType === 1) || null;
	}
	get children() {
		return this.childNodes.filter(c => c.nodeType === 1);
	}
	setAttribute(k, v) {
		this.attributes[k] = String(v);
	}
	setAttributeNS(ns, k, v) {
		this.attributes[k] = String(v);
	}
	getAttribute(k) {
		return this.attributes.hasOwnProperty(k) ? this.attributes[k] : null;
	}
	appendChild(child) {
		if (child.parentNode) {
			const idx = child.parentNode.childNodes.indexOf(child);
			if (idx >= 0) child.parentNode.childNodes.splice(idx, 1);
		}
		child.parentNode = this;
		this.childNodes.push(child);
		return child;
	}
	insertBefore(newNode, refNode) {
		if (newNode.parentNode) {
			const idx = newNode.parentNode.childNodes.indexOf(newNode);
			if (idx >= 0) newNode.parentNode.childNodes.splice(idx, 1);
		}
		newNode.parentNode = this;
		const refIdx = this.childNodes.indexOf(refNode);
		if (refIdx >= 0) {
			this.childNodes.splice(refIdx, 0, newNode);
		} else {
			this.childNodes.push(newNode);
		}
		return newNode;
	}
	cloneNode(deep = true) {
		const copy = new XmlNode(this.nodeType, this.nodeName, this.nodeValue);
		copy.attributes = Object.assign({}, this.attributes);
		if (deep) {
			for (const ch of this.childNodes) {
				copy.appendChild(ch.cloneNode(true));
			}
		}
		return copy;
	}
	createElement(name) {
		return new XmlNode(1, name);
	}
	createElementNS(ns, name) {
		return new XmlNode(1, name);
	}
	createTextNode(txt) {
		return new XmlNode(3, '#text', String(txt));
	}
	serialize() {
		if (this.nodeType === 9) {
			return this.childNodes.map(c => c.serialize()).join('');
		}
		if (this.nodeType === 3) {
			return String(this.nodeValue)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		}
		const attrs = Object.entries(this.attributes)
			.map(([k, v]) => `${k}="${String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
			.join(' ');
		const open = attrs ? `<${this.nodeName} ${attrs}` : `<${this.nodeName}`;
		if (this.childNodes.length === 0) {
			return `${open}/>`;
		}
		return `${open}>${this.childNodes.map(c => c.serialize()).join('')}</${this.nodeName}>`;
	}
}

function parseSimpleXml(xmlStr) {
	const doc = new XmlNode(9, '#document');
	// Strip XML declaration
	const body = xmlStr.replace(/<\?xml[^?]*\?>/gi, '').trim();
	const stack = [doc];
	const tokenRegex = /<(\/?)([a-zA-Z0-9_:-]+)([^>]*?)(\/?)>|([^<]+)/g;
	let match;
	while ((match = tokenRegex.exec(body)) !== null) {
		if (match[5] !== undefined) {
			const txt = match[5]
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&apos;/g, "'")
				.replace(/&amp;/g, '&');
			stack[stack.length - 1].appendChild(new XmlNode(3, '#text', txt));
		} else {
			const isClosing = match[1] === '/';
			const tagName = match[2];
			const attrStr = match[3] || '';
			const isSelfClosing = match[4] === '/' || tagName.toUpperCase() === 'BR' || tagName.toUpperCase() === 'HR';
			if (isClosing) {
				if (stack.length > 1) stack.pop();
			} else {
				const el = new XmlNode(1, tagName);
				const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
				let am;
				while ((am = attrRegex.exec(attrStr)) !== null) {
					el.setAttribute(am[1], am[2] !== undefined ? am[2] : am[3]);
				}
				stack[stack.length - 1].appendChild(el);
				if (!isSelfClosing) {
					stack.push(el);
				}
			}
		}
	}
	return doc;
}

class MockJSZip {
	constructor() {
		this.files = {};
	}
	file(name, content, opts) {
		this.files[name] = { content, opts };
	}
	generateAsync(opts) {
		return Promise.resolve('MOCK_BASE64_ZIP');
	}
}

function mxAbstractCanvas2D() {
	this.Reset();
}
mxAbstractCanvas2D.prototype.Reset = function() {
	this.state = {
		dx: 0,
		dy: 0,
		scale: 1,
		alpha: 1,
		fillAlpha: 1,
		strokeAlpha: 1,
		fillColor: '#ffffff',
		strokeColor: '#000000',
		strokeWidth: 1,
		dashed: false,
		dashPattern: '3 3',
		shadow: false,
		rotation: 0,
		rotationCx: 0,
		rotationCy: 0,
		fontColor: '#000000',
		fontSize: 12,
		fontFamily: 'Calibri',
		fontStyle: 0
	};
	this.states = [];
};
mxAbstractCanvas2D.prototype.save = function() {
	this.states.push(Object.assign({}, this.state));
};
mxAbstractCanvas2D.prototype.restore = function() {
	if (this.states.length > 0) {
		this.state = this.states.pop();
	}
};
mxAbstractCanvas2D.prototype.translate = function(dx, dy) {
	this.state.dx += dx;
	this.state.dy += dy;
};
mxAbstractCanvas2D.prototype.scale = function(s) {
	this.state.scale *= s;
};
mxAbstractCanvas2D.prototype.setFillColor = function(c) {
	this.state.fillColor = c;
};
mxAbstractCanvas2D.prototype.setStrokeColor = function(c) {
	this.state.strokeColor = c;
};

const mxConstants = {
	NONE: 'none',
	STYLE_FILLCOLOR: 'fillColor',
	STYLE_GRADIENTCOLOR: 'gradientColor',
	STYLE_GRADIENT_DIRECTION: 'gradientDirection',
	STYLE_STROKECOLOR: 'strokeColor',
	STYLE_STROKEWIDTH: 'strokeWidth',
	STYLE_OPACITY: 'opacity',
	STYLE_FILL_OPACITY: 'fillOpacity',
	STYLE_STROKE_OPACITY: 'strokeOpacity',
	STYLE_DASHED: 'dashed',
	STYLE_DASH_PATTERN: 'dashPattern',
	STYLE_SHADOW: 'shadow',
	STYLE_FLIPH: 'flipH',
	STYLE_FLIPV: 'flipV',
	STYLE_ROUNDED: 'rounded',
	STYLE_CURVED: 'curved',
	STYLE_ARCSIZE: 'arcSize',
	STYLE_LABEL_BACKGROUNDCOLOR: 'labelBackgroundColor',
	STYLE_STARTFILL: 'startFill',
	STYLE_STARTARROW: 'startArrow',
	STYLE_STARTSIZE: 'startSize',
	STYLE_ENDFILL: 'endFill',
	STYLE_ENDARROW: 'endArrow',
	STYLE_ENDSIZE: 'endSize',
	STYLE_FONTSIZE: 'fontSize',
	STYLE_FONTFAMILY: 'fontFamily',
	STYLE_FONTCOLOR: 'fontColor',
	STYLE_FONTSTYLE: 'fontStyle',
	STYLE_ALIGN: 'align',
	STYLE_VERTICAL_ALIGN: 'verticalAlign',
	STYLE_LABEL_POSITION: 'labelPosition',
	STYLE_VERTICAL_LABEL_POSITION: 'verticalLabelPosition',
	STYLE_ROTATION: 'rotation',
	STYLE_EXIT_X: 'exitX',
	STYLE_EXIT_Y: 'exitY',
	STYLE_EXIT_DX: 'exitDx',
	STYLE_EXIT_DY: 'exitDy',
	STYLE_ENTRY_X: 'entryX',
	STYLE_ENTRY_Y: 'entryY',
	STYLE_ENTRY_DX: 'entryDx',
	STYLE_ENTRY_DY: 'entryDy',
	DIRECTION_EAST: 'east',
	DIRECTION_WEST: 'west',
	DIRECTION_NORTH: 'north',
	DIRECTION_SOUTH: 'south',
	ALIGN_LEFT: 'left',
	ALIGN_CENTER: 'center',
	ALIGN_RIGHT: 'right',
	ALIGN_TOP: 'top',
	ALIGN_MIDDLE: 'middle',
	ALIGN_BOTTOM: 'bottom',
	DEFAULT_FONTSIZE: 12,
	DEFAULT_FONTFAMILY: 'Calibri',
	LINE_ARCSIZE: 20,
	RECTANGLE_ROUNDING_FACTOR: 0.15
};

const mxUtils = {
	extend: function(ctor, superCtor) {
		const F = function() {};
		F.prototype = superCtor.prototype;
		ctor.prototype = new F();
		ctor.prototype.constructor = ctor;
	},
	createXmlDocument: function() {
		return new XmlNode(9, '#document');
	},
	parseXml: function(str) {
		return parseSimpleXml(str);
	},
	getXml: function(doc) {
		return doc.serialize();
	},
	getValue: function(dict, key, def) {
		return (dict != null && dict[key] != null) ? dict[key] : def;
	},
	isNode: function(obj) {
		return obj != null && typeof obj.nodeType === 'number';
	},
	isLightDarkColor: function(c) {
		return typeof c === 'string' && c.indexOf('light-dark(') === 0;
	},
	parseLightDarkColor: function(c) {
		const m = c.match(/light-dark\(([^,]+),([^)]+)\)/);
		return { light: m ? m[1].trim() : '#000000', dark: m ? m[2].trim() : '#ffffff' };
	},
	rgba2hex: function(c) {
		if (!c || c === 'none' || c === 'default') return c;
		if (c.startsWith('rgb')) {
			const nums = c.match(/\d+/g);
			if (nums && nums.length >= 3) {
				return '#' + nums.slice(0, 3).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('');
			}
		}
		return c;
	},
	getSizeForString: function(txt, fontSize = 12) {
		const lines = String(txt).split('\n');
		const maxLen = Math.max(...lines.map(l => l.length), 1);
		return {
			width: maxLen * fontSize * 0.6,
			height: lines.length * fontSize * 1.2
		};
	}
};

const sandbox = {
	mxAbstractCanvas2D,
	mxConstants,
	mxUtils,
	mxResources: { get: k => k },
	JSZip: MockJSZip,
	console
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/VsdxExport.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/mxVsdxCanvas2D.js'), 'utf8'), sandbox);

// Helper to find cells inside a Shape or Row element
function getCellMap(el) {
	const map = {};
	for (const ch of el.children) {
		if (ch.nodeName === 'Cell') {
			map[ch.getAttribute('N')] = {
				V: ch.getAttribute('V'),
				F: ch.getAttribute('F')
			};
		}
	}
	return map;
}

console.log('Running VsdxExport & mxVsdxCanvas2D test suite...');

// ============================================================================
// TEST 1: Rich HTML Text, Character Bitmask, Paragraph <pp/>, & Whitespace
// ============================================================================
{
	const canvas = new sandbox.mxVsdxCanvas2D();
	const doc = mxUtils.createXmlDocument();
	const shape = doc.createElement('Shape');
	const geo = { x: 100, y: 50, width: 200, height: 100, clone() { return Object.assign({}, this); } };
	const cellState = {
		cell: { id: 'v1', vertex: true, geometry: geo },
		style: { fontSize: 12, fontFamily: 'Arial', fontColor: 'default', align: 'left', verticalAlign: 'top' },
		view: { graph: { getModel: () => ({ isEdge: () => false }) } }
	};
	canvas.newShape(shape, cellState, doc, geo);

	const html = '<div style="text-align: left">Hello <b style="font-weight: 700; color: rgb(255, 0, 0)">Bold</b> and <i><s>Strike</s></i></div><div style="text-align: right">Right line</div><ul><li>Bullet item</li></ul>';
	canvas.text(100, 50, 200, 100, html, 'left', 'top', true, 'html', null, false, 0, 'ltr');

	const charSec = shape.children.find(c => c.nodeName === 'Section' && c.getAttribute('N') === 'Character');
	const paraSec = shape.children.find(c => c.nodeName === 'Section' && c.getAttribute('N') === 'Paragraph');
	const textEl = shape.children.find(c => c.nodeName === 'Text');
	const shapeCells = getCellMap(shape);

	assert(charSec, 'Character section must exist');
	assert(paraSec, 'Paragraph section must exist');
	assert(textEl, 'Text element must exist');

	// Verify VerticalAlign is set to 0 (top)
	assert.strictEqual(shapeCells.VerticalAlign.V, '0', 'VerticalAlign should be 0 for valign=top');

	// Verify Character rows and bitmask (0x01 for bold, 0x02 for italic, Strikethru=1)
	const charRows = charSec.children;
	assert(charRows.length >= 4, 'Should have character rows for runs');
	const boldCells = getCellMap(charRows[1]);
	assert.strictEqual(boldCells.Style.V, '1', 'Bold style bitmask must be 1 (0x01), not 17 (0x11)');
	assert.strictEqual(boldCells.Color.V, '#ff0000', 'RGB color must be converted to #ff0000');

	const strikeCells = getCellMap(charRows[3]);
	assert.strictEqual(strikeCells.Style.V, '2', 'Italic style bitmask must be 2 (0x02), not 34 (0x22)');
	assert.strictEqual(strikeCells.Strikethru.V, '1', 'Strikethru cell must be 1 for <s> tag');

	// Verify Paragraph rows have distinct incrementing IX, SpLine=-1.2 on all rows, and matching <pp IX="..."/>
	const paraRows = paraSec.children;
	assert.strictEqual(paraRows.length, 3, 'Should have 3 Paragraph rows');
	assert.strictEqual(paraRows[0].getAttribute('IX'), '0');
	assert.strictEqual(paraRows[1].getAttribute('IX'), '1');
	assert.strictEqual(paraRows[2].getAttribute('IX'), '2');
	assert.strictEqual(getCellMap(paraRows[0]).HorzAlign.V, '0', 'First paragraph should be left-aligned (0)');
	assert.strictEqual(getCellMap(paraRows[0]).SpLine.V, '-1.2', 'First paragraph row must set SpLine=-1.2');
	assert.strictEqual(getCellMap(paraRows[1]).HorzAlign.V, '2', 'Second paragraph should be right-aligned (2)');
	assert.strictEqual(getCellMap(paraRows[1]).SpLine.V, '-1.2', 'Subsequent paragraph rows (IX>=1) must explicitly set SpLine=-1.2 so lines do not overlap');
	assert.strictEqual(getCellMap(paraRows[2]).Bullet.V, '1', 'Third paragraph (UL/LI) should have Bullet=1');
	assert.strictEqual(getCellMap(paraRows[2]).SpLine.V, '-1.2', 'Bullet paragraph row must set SpLine=-1.2');

	const ppNodes = textEl.children.filter(c => c.nodeName === 'pp');
	assert.strictEqual(ppNodes.length, 3, 'Text element should contain 3 <pp/> elements');
	assert.strictEqual(ppNodes[0].getAttribute('IX'), '0');
	assert.strictEqual(ppNodes[1].getAttribute('IX'), '1');
	assert.strictEqual(ppNodes[2].getAttribute('IX'), '2');

	// Verify text content has no trailing newline at the very end
	assert.strictEqual(textEl.textContent, 'Hello Bold and Strike\nRight line\nBullet item');

	// Verify displaced/external label on a small icon shape uses auto-expanding TEXTWIDTH/TEXTHEIGHT formulas and 0 margins
	const iconShape = doc.createElement('Shape');
	const iconGeo = { x: 0, y: 0, width: 30, height: 30, clone() { return Object.assign({}, this); } };
	const iconState = {
		cell: { id: 'icon1', vertex: true, geometry: iconGeo },
		style: { labelPosition: 'center', verticalLabelPosition: 'bottom', align: 'center', verticalAlign: 'top', whiteSpace: 'wrap' }
	};
	canvas.newShape(iconShape, iconState, doc, iconGeo);
	canvas.text(15, 35, 0, 0, '<div><b>Application Gateway v2</b></div><div>WAF_v2 | Autoscaling</div>', 'center', 'top', true, 'html', null, false, 0, 'ltr');
	const iconCells = getCellMap(iconShape);
	assert(iconCells.TxtWidth.F && iconCells.TxtWidth.F.startsWith('Width*') && iconCells.TxtWidth.F.includes('TEXTWIDTH(TheText)'), 'Displaced label TxtWidth should have Width*...+TEXTWIDTH(TheText) formula');
	assert(iconCells.TxtHeight.F && iconCells.TxtHeight.F.startsWith('Height*') && iconCells.TxtHeight.F.includes('TEXTHEIGHT(TheText,TxtWidth)'), 'Displaced label TxtHeight should have Height*...+TEXTHEIGHT(TheText,TxtWidth) formula');
	assert.strictEqual(iconCells.LeftMargin.V, '0', 'Displaced label LeftMargin should be 0');
	assert.strictEqual(iconCells.RightMargin.V, '0', 'Displaced label RightMargin should be 0');
	const iconParaSec = iconShape.children.find(c => c.nodeName === 'Section' && c.getAttribute('N') === 'Paragraph');
	assert.strictEqual(iconParaSec.children.length, 1, 'Consecutive lines with identical alignment/bullet should share a single Paragraph Row');

	console.log('  ✓ Test 1 passed: Rich HTML text, bitmasks, paragraphs, SpLine=-1.2, auto-sizing TxtWidth/TxtHeight');
}

// ============================================================================
// TEST 2: Multi-Subpath Geometry & Proportional Rectangles
// ============================================================================
{
	const canvas = new sandbox.mxVsdxCanvas2D();
	const doc = mxUtils.createXmlDocument();
	const shape = doc.createElement('Shape');
	const geo = { x: 0, y: 0, width: 100, height: 50, clone() { return Object.assign({}, this); } };
	const cellState = { cell: { id: 'v2', vertex: true, geometry: geo }, style: {} };

	canvas.newShape(shape, cellState, doc, geo);
	// Draw a rectangle and fillAndStroke
	canvas.rect(0, 0, 100, 50);
	canvas.fillAndStroke();

	// Now draw two separate line subpaths before calling stroke()
	canvas.begin();
	canvas.moveTo(10, 10);
	canvas.lineTo(90, 10);
	canvas.moveTo(10, 40);
	canvas.lineTo(90, 40);
	canvas.stroke();
	canvas.endShape();

	const geoSecs = shape.children.filter(c => c.nodeName === 'Section' && c.getAttribute('N') === 'Geometry');
	assert.strictEqual(geoSecs.length, 3, 'Should have 3 Geometry sections (1 rect + 2 line subpaths)');

	// Rect should use RelMoveTo / RelLineTo (normalized 0..1)
	const rectRows = geoSecs[0].children.filter(c => c.nodeName === 'Row');
	assert.strictEqual(rectRows[0].getAttribute('T'), 'RelMoveTo');
	assert.strictEqual(rectRows[1].getAttribute('T'), 'RelLineTo');

	// Both line subpaths must have NoFill=1 and NoLine=0
	const sub1Cells = getCellMap(geoSecs[1]);
	const sub2Cells = getCellMap(geoSecs[2]);
	assert.strictEqual(sub1Cells.NoFill.V, '1', 'First subpath before stroke() must get NoFill=1');
	assert.strictEqual(sub1Cells.NoLine.V, '0', 'First subpath before stroke() must get NoLine=0');
	assert.strictEqual(sub2Cells.NoFill.V, '1', 'Second subpath before stroke() must get NoFill=1');
	assert.strictEqual(sub2Cells.NoLine.V, '0', 'Second subpath before stroke() must get NoLine=0');
	console.log('  ✓ Test 2 passed: Multi-subpath Geometry NoFill/NoLine & proportional RelMoveTo/RelLineTo');
}

// ============================================================================
// TEST 3: Full End-to-End Export (Single-page vs Multi-page, Group, Edge, Ports)
// ============================================================================
{
	let savedFile = null;

	const rootCell = { id: '0', children: [] };
	const layer0 = { id: '1', parent: rootCell, value: 'Main Layer', visible: true, children: [] };
	const hiddenLayer = { id: '2', parent: rootCell, value: 'Hidden Layer', visible: false, children: [] };
	rootCell.children = [layer0, hiddenLayer];

	const makeGeo = (x, y, width, height) => ({
		x, y, width, height, relative: 0,
		clone() { return makeGeo(this.x, this.y, this.width, this.height); }
	});

	// Vertex 1 with direction=north (inverted paint bounds) and labelBackgroundColor
	const v1 = {
		id: 'v1',
		parent: layer0,
		vertex: true,
		geometry: makeGeo(100, 100, 120, 60),
		getChildCount: () => 0
	};

	// Group cell containing a child vertex and an internal edge
	const grp = {
		id: 'grp1',
		parent: layer0,
		vertex: true,
		geometry: makeGeo(300, 100, 200, 150),
		children: [],
		getChildCount() { return this.children.length; }
	};
	const gChild1 = {
		id: 'gc1',
		parent: grp,
		vertex: true,
		geometry: makeGeo(20, 30, 60, 40),
		getChildCount: () => 0
	};
	const gChild2 = {
		id: 'gc2',
		parent: grp,
		vertex: true,
		geometry: makeGeo(120, 80, 60, 40),
		getChildCount: () => 0
	};
	const gEdge = {
		id: 'ge1',
		parent: grp,
		edge: true,
		source: gChild1,
		target: gChild2,
		geometry: makeGeo(0, 0, 0, 0),
		getChildCount: () => 0
	};
	grp.children = [gChild1, gChild2, gEdge];

	// Top-level edge from v1 to grp with exitX/exitY, entryX/entryY, rounded=1, diamondThin arrow
	const edge1 = {
		id: 'e1',
		parent: layer0,
		edge: true,
		source: v1,
		target: grp,
		geometry: makeGeo(0, 0, 0, 0),
		getChildCount: () => 0
	};

	// Hidden cell on invisible layer (should NOT be exported)
	const hiddenCell = {
		id: 'h1',
		parent: hiddenLayer,
		vertex: true,
		geometry: makeGeo(10, 10, 50, 50),
		getChildCount: () => 0
	};

	const cells = {
		'0': rootCell,
		'1': layer0,
		'2': hiddenLayer,
		'v1': v1,
		'grp1': grp,
		'gc1': gChild1,
		'gc2': gChild2,
		'ge1': gEdge,
		'e1': edge1,
		'h1': hiddenCell
	};

	const states = {
		'v1': {
			cell: v1,
			style: {
				fillColor: 'default',
				strokeColor: '#336699',
				rounded: 1,
				labelBackgroundColor: '#ffff00',
				direction: 'north'
			},
			shape: {
				flipH: false,
				flipV: false,
				isPaintBoundsInverted: () => true,
				getShapeRotation: () => 270,
				checkBounds: () => true,
				paint(c) {
					// Simulates mxShape.paint with inverted bounds (w=60, h=120, x=130, y=70)
					c.rotate(270, false, false, 160, 130);
					c.rect(130, 70, 60, 120);
					c.fillAndStroke();
				}
			},
			text: {
				checkBounds: () => true,
				paint(c) {
					c.text(160, 130, 120, 60, 'Rotated Dir', 'center', 'middle', true, '', null, false, 0, 'ltr');
				}
			}
		},
		'grp1': {
			cell: grp,
			style: { fillColor: '#f5f5f5', strokeColor: '#666666', dashed: 1, dashPattern: '8 8' },
			shape: {
				flipH: false,
				flipV: false,
				isPaintBoundsInverted: () => false,
				checkBounds: () => true,
				paint(c) {
					c.rect(300, 100, 200, 150);
					c.fillAndStroke();
				}
			}
		},
		'gc1': {
			cell: gChild1,
			style: { fillColor: '#dae8fc', strokeColor: '#6c8ebf' },
			shape: {
				isPaintBoundsInverted: () => false,
				checkBounds: () => true,
				paint(c) {
					c.rect(320, 130, 60, 40);
					c.fillAndStroke();
				}
			}
		},
		'gc2': {
			cell: gChild2,
			style: { fillColor: '#d5e8d4', strokeColor: '#82b366' },
			shape: {
				isPaintBoundsInverted: () => false,
				checkBounds: () => true,
				paint(c) {
					c.rect(420, 180, 60, 40);
					c.fillAndStroke();
				}
			}
		},
		'ge1': {
			cell: gEdge,
			style: { strokeColor: '#000000', endArrow: 'classic', endFill: 1 },
			absolutePoints: [
				{ x: 380, y: 150 },
				{ x: 420, y: 200 }
			]
		},
		'e1': {
			cell: edge1,
			style: {
				strokeColor: '#000000',
				rounded: 1,
				arcSize: 20,
				startArrow: 'diamondThin',
				startFill: 0,
				endArrow: 'blockThin',
				endFill: 1,
				exitX: 1,
				exitY: 0.5,
				entryX: 0,
				entryY: 0.5
			},
			absolutePoints: [
				{ x: 220, y: 130 },
				{ x: 260, y: 130 },
				{ x: 260, y: 175 },
				{ x: 300, y: 175 }
			],
			text: {
				checkBounds: () => true,
				paint(c) {
					c.text(260, 152.5, 0, 0, 'Edge Label', 'center', 'middle', false, '', null, false, 0, 'ltr');
				}
			}
		}
	};

	const mockGraph = {
		pageFormat: { width: 850, height: 1100 },
		pageScale: 1,
		gridEnabled: true,
		gridSize: 10,
		view: {
			scale: 1,
			translate: { x: 0, y: 0 },
			getState(cell) {
				return states[cell.id] || states[cell.id.replace('__group_bg__', '')] || null;
			}
		},
		model: {
			root: rootCell,
			cells,
			getChildCells(parent) {
				return parent.children || [];
			},
			isEdge(cell) {
				return !!(cell && cell.edge);
			}
		},
		getGraphBounds() {
			return { x: 100, y: 100, width: 400, height: 150, clone() { return Object.assign({}, this); } };
		},
		getSelectionCells: () => [],
		setSelectionCells: () => {}
	};

	const page1 = { getName: () => 'Overview' };
	const page2 = { getName: () => 'Overview' }; // Duplicate name to test deduplication

	let lastZip = null;
	const origJSZip = sandbox.JSZip;
	sandbox.JSZip = function() {
		lastZip = new origJSZip();
		return lastZip;
	};

	const mockEditorUi = {
		spinner: { spin: () => true, stop: () => {} },
		pages: [page1, page2],
		currentPage: page1,
		selectPage(p) { this.currentPage = p; },
		editor: { graph: mockGraph },
		getBaseFilename: () => 'test-diagram',
		saveData(filename, format, data, mime, base64) {
			savedFile = { filename, format, data, mime, base64 };
		}
	};

	// 3A: Test currentPageOnly = true on a multi-page document
	const exporter = new sandbox.VsdxExport(mockEditorUi);
	const okSingle = exporter.exportCurrentDiagrams(true);
	assert.strictEqual(okSingle, true, 'Single-page export must succeed');
	assert(lastZip.files['visio/pages/_rels/page1.xml.rels'], 'page1.xml.rels must exist (not pageNaN.xml.rels!)');
	assert(!lastZip.files['visio/pages/_rels/pageNaN.xml.rels'], 'pageNaN.xml.rels must NOT exist');
	assert(!lastZip.files['visio/pages/page2.xml'], 'page2.xml must NOT exist when currentPageOnly=true');
	const ctSingle = lastZip.files['[Content_Types].xml'].content;
	assert(!ctSingle.includes('/visio/pages/page2.xml'), '[Content_Types].xml must not reference page2 when currentPageOnly=true');

	// Inspect page1.xml from single-page export
	const page1Xml = lastZip.files['visio/pages/page1.xml'].content;
	assert(page1Xml.includes('xml:space="preserve"'), 'PageContents must include xml:space="preserve"');

	const page1Doc = parseSimpleXml(page1Xml);
	const shapesEl = page1Doc.documentElement.children.find(c => c.nodeName === 'Shapes');
	const connectsEl = page1Doc.documentElement.children.find(c => c.nodeName === 'Connects');
	const topShapes = shapesEl.children;

	// Hidden cell 'h1' on invisible layer must not be exported
	assert.strictEqual(topShapes.length, 3, 'Should have 3 top-level shapes (v1, grp1, e1) and no hidden layer shapes');

	// Verify v1: direction=north inverted bounds (Width=60, Height=120), TextBkgnd RGB formula, fillColor=default -> #ffffff
	const v1Shape = topShapes[0];
	const v1Cells = getCellMap(v1Shape);
	const CF = sandbox.VsdxExport.prototype.CONVERSION_FACTOR;
	assert(Math.abs(parseFloat(v1Cells.Width.V) - (60 / CF)) < 1e-4, 'v1 Width should be swapped to 60/CF for direction=north');
	assert(Math.abs(parseFloat(v1Cells.Height.V) - (120 / CF)) < 1e-4, 'v1 Height should be swapped to 120/CF for direction=north');
	assert.strictEqual(v1Cells.FillForegnd.V, '#ffffff', 'fillColor=default should resolve to #ffffff');
	assert.strictEqual(v1Cells.TextBkgnd.V, '#ffff00', 'TextBkgnd value should be #ffff00');
	assert.strictEqual(v1Cells.TextBkgnd.F, 'RGB(255,255,0)', 'TextBkgnd must have RGB(255,255,0) formula');
	const v1ConnSec = v1Shape.children.find(c => c.nodeName === 'Section' && c.getAttribute('N') === 'Connection');
	assert(v1ConnSec, 'v1 should have a Connection section for exitX/exitY');

	// Verify group shape and internal edge coordinates
	const grpShape = topShapes[1];
	assert.strictEqual(grpShape.getAttribute('Type'), 'Group');
	const grpChildShapes = grpShape.children.find(c => c.nodeName === 'Shapes').children;
	assert.strictEqual(grpChildShapes.length, 4, 'Group should have background shape + 2 child vertices + 1 internal edge');
	const internalEdgeShape = grpChildShapes[3];
	const internalEdgeCells = getCellMap(internalEdgeShape);
	assert.strictEqual(internalEdgeCells.PinX.F, 'GUARD((BeginX+EndX)/2)', 'Edge PinX must preserve GUARD formula');
	assert.strictEqual(internalEdgeCells.Width.F, 'GUARD(EndX-BeginX)', 'Edge Width must preserve GUARD formula');
	// Internal edge starts at (380, 150) which in group-local (group at 300, 100, height 150) is BeginX = 80, BeginY = 150 - 50 = 100
	assert(Math.abs(parseFloat(internalEdgeCells.BeginX.V) - (80 / CF)) < 1e-4, 'Internal group edge BeginX must be group-relative (80/CF)');
	assert(Math.abs(parseFloat(internalEdgeCells.BeginY.V) - (100 / CF)) < 1e-4, 'Internal group edge BeginY must be group-relative (100/CF)');

	// Verify top-level edge e1: diamondThin arrow (22), blockThin arrow (2), rounded=1 (10/CF), connection formulas
	const e1Shape = topShapes[2];
	const e1Cells = getCellMap(e1Shape);
	assert.strictEqual(e1Cells.BeginArrow.V, '22', 'unfilled diamondThin must map to Visio arrow 22');
	assert.strictEqual(e1Cells.EndArrow.V, '2', 'filled blockThin must map to Visio arrow 2');
	assert(Math.abs(parseFloat(e1Cells.Rounding.V) - (10 / CF)) < 1e-4, 'Edge with rounded=1 should have Rounding = 10/CF');
	assert(e1Cells.BeginX.F.includes('Connections.X1'), 'Edge BeginX formula should bind to source Connections.X1');
	assert(e1Cells.EndX.F.includes('Connections.X1'), 'Edge EndX formula should bind to target group Connections.X1');

	// Verify Connects section binds e1 to v1 and grp1 (with ToCell="Connections.X1")
	const connects = connectsEl.children;
	assert.strictEqual(connects.length, 4, 'Should have 4 Connect entries (2 for e1, 2 for ge1)');
	const e1Connects = connects.filter(c => c.getAttribute('FromSheet') === e1Shape.getAttribute('ID'));
	assert.strictEqual(e1Connects[0].getAttribute('ToSheet'), v1Shape.getAttribute('ID'));
	assert.strictEqual(e1Connects[0].getAttribute('ToCell'), 'Connections.X1');
	assert.strictEqual(e1Connects[1].getAttribute('ToSheet'), grpShape.getAttribute('ID'), 'Edge to group must connect to outer Group ID');
	assert.strictEqual(e1Connects[1].getAttribute('ToCell'), 'Connections.X1');

	// 3B: Test multi-page export with duplicate page names
	const okMulti = exporter.exportCurrentDiagrams(false);
	assert.strictEqual(okMulti, true, 'Multi-page export must succeed');
	assert(lastZip.files['visio/pages/page1.xml'], 'page1.xml must exist');
	assert(lastZip.files['visio/pages/page2.xml'], 'page2.xml must exist');
	const pagesXml = lastZip.files['visio/pages/pages.xml'].content;
	assert(pagesXml.includes('NameU="Overview"'), 'First page should be named Overview');
	assert(pagesXml.includes('NameU="Overview (2)"'), 'Second page with duplicate name should be disambiguated to Overview (2)');

	console.log('  ✓ Test 3 passed: End-to-end single/multi-page export, groups, 1D connectors, ports, arrows, direction=north');
}

// ============================================================================
// TEST 4: Plugin Bundle Verification (latest draw.io v32.5.5+ compatibility)
// ============================================================================
{
	const pluginPath = path.join(__dirname, '..', 'dist', 'visio-export-plugin.js');
	assert(fs.existsSync(pluginPath), 'dist/visio-export-plugin.js must exist');
	const pluginCode = fs.readFileSync(pluginPath, 'utf8');

	let registeredCallback = null;
	let loadedScripts = [];

	function MockEditorUi() {}
	MockEditorUi.prototype.vsdxExportEnabled = function() { return false; };

	const pluginSandbox = {
		window: null,
		Draw: {
			loadPlugin(fn) {
				registeredCallback = fn;
			}
		},
		EditorUi: MockEditorUi,
		mxUtils: sandbox.mxUtils,
		mxAbstractCanvas2D: sandbox.mxAbstractCanvas2D,
		mxCanvas2D: sandbox.mxCanvas2D,
		mxPoint: sandbox.mxPoint,
		mxRectangle: sandbox.mxRectangle,
		mxConstants: sandbox.mxConstants,
		mxCellState: sandbox.mxCellState,
		mxCell: sandbox.mxCell,
		mxResources: {
			resources: {},
			parse(str) {
				str.split('\n').forEach(line => {
					const idx = line.indexOf('=');
					if (idx > 0) this.resources[line.slice(0, idx)] = line.slice(idx + 1);
				});
			},
			get(key) { return this.resources[key] || null; }
		},
		mxscript(url, onload) {
			loadedScripts.push(url);
			// Simulate JSZip becoming available after lazy load
			pluginSandbox.JSZip = sandbox.JSZip;
			if (onload) onload();
		},
		JS_PATH: 'js'
	};
	pluginSandbox.window = pluginSandbox;
	vm.createContext(pluginSandbox);
	vm.runInContext(pluginCode, pluginSandbox);

	assert(typeof registeredCallback === 'function', 'Plugin must call Draw.loadPlugin(fn)');
	assert(typeof pluginSandbox.VsdxExport === 'function', 'Plugin must expose VsdxExport globally');
	assert(typeof pluginSandbox.mxVsdxCanvas2D === 'function', 'Plugin must expose mxVsdxCanvas2D globally');

	// Simulate latest draw.io v32.5.5 Menus.js where exportAs adds 'exportVsdx' if vsdxExportEnabled() is true
	const addedMenuItems = [];
	const mockUi = new MockEditorUi();
	mockUi.actions = {
		actions: {},
		addAction(name, fn) {
			this.actions[name] = { funct: fn };
		},
		get(name) {
			return this.actions[name] || null;
		}
	};
	mockUi.menus = {
		menus: {
			exportAs: {
				funct(menu, parent) {
					if (mockUi.vsdxExportEnabled() && typeof pluginSandbox.VsdxExport !== 'undefined') {
						mockUi.menus.addMenuItems(menu, ['exportVsdx'], parent);
					}
					mockUi.menus.addMenuItems(menu, ['-', 'exportXml'], parent);
				}
			}
		},
		get(name) { return this.menus[name] || null; },
		addMenuItems(menu, items) {
			addedMenuItems.push(...items);
		}
	};

	registeredCallback(mockUi);

	assert.strictEqual(mockUi.vsdxExportEnabled(), true, 'Plugin must set vsdxExportEnabled() to true');
	assert(mockUi.actions.get('exportVsdx'), 'Plugin must register exportVsdx action');

	// Trigger exportAs menu and ensure 'exportVsdx' is only added ONCE (not duplicated!)
	mockUi.menus.get('exportAs').funct({}, null);
	const vsdxCount = addedMenuItems.filter(i => i === 'exportVsdx').length;
	assert.strictEqual(vsdxCount, 1, 'exportVsdx must appear exactly once in exportAs menu');

	// Verify lazy JSZip loading in online web mode when JSZip is initially undefined
	delete pluginSandbox.JSZip;
	let exportCalled = false;
	pluginSandbox.VsdxExport = function() {
		this.exportCurrentDiagrams = function() {
			exportCalled = true;
			return true;
		};
	};
	mockUi.pages = [{ getName: () => 'Page 1' }];
	mockUi.exportVisio(true);
	assert.strictEqual(loadedScripts[0], 'js/jszip/jszip.min.js', 'Plugin must lazy-load js/jszip/jszip.min.js when JSZip is undefined');
	assert.strictEqual(exportCalled, true, 'exportCurrentDiagrams must be called after JSZip loads');

	console.log('  ✓ Test 4 passed: Plugin bundle verified for draw.io v32.5.5+ (Draw.loadPlugin, deduplicated menu, lazy JSZip)');
}

console.log('All tests passed successfully!');
