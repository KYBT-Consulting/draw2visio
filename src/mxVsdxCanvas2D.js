/**
 * Copyright (c) 2006-2017, JGraph Holdings Ltd
 */
/**
 * Class: mxVsdxCanvas2D
 *
 * Constructor: mxVsdxCanvas2D
 *
 * Constructs a new abstract canvas.
 */
function mxVsdxCanvas2D()
{
	mxAbstractCanvas2D.call(this);
	this.pageIndex = 0;
};

/**
 * Extends mxAbstractCanvas2D
 */
mxUtils.extend(mxVsdxCanvas2D, mxAbstractCanvas2D);


/**
 * Variable: textEnabled
 * 
 * Specifies if text output should be enabled. Default is true.
 */
mxVsdxCanvas2D.prototype.textEnabled = true;

/**
 * Function: init
 *  
 * Initialize the canvas for a new vsdx file.
 */
mxVsdxCanvas2D.prototype.init = function (zip)
{
	this.filesLoading = 0;
	this.zip = zip;
};

/**
 * Function: onFilesLoaded
 *  
 * Called after all pending files have finished loading.
 */
mxVsdxCanvas2D.prototype.onFilesLoaded = function ()
{
	// hook for subclassers
};

/**
 * Function: createElt
 *  
 * Create a new XML element in the Visio namespace.
 */
mxVsdxCanvas2D.prototype.createElt = function (name)
{
	return (this.xmlDoc.createElementNS != null) ? this.xmlDoc.createElementNS(VsdxExport.prototype.XMLNS, name) :
		this.xmlDoc.createElement(name);
};


/**
 * Function: createGeoSec
 *  
 * Create a new Geometry section and track it in pendingGeoSecs so that
 * subsequent stroke()/fill()/fillAndStroke() calls apply NoFill/NoLine
 * to all subpaths in the current drawing operation.
 */
mxVsdxCanvas2D.prototype.createGeoSec = function ()
{
	var geoSec = this.createElt("Section");
	
	geoSec.setAttribute("N", "Geometry");
	geoSec.setAttribute("IX", this.geoIndex++);
	
	this.geoSec = geoSec;
	this.geoStepIndex = 1;
	this.lastX = 0;
	this.lastY = 0;
	this.lastMoveToX = 0;
	this.lastMoveToY = 0;

	if (this.pendingGeoSecs != null)
	{
		this.pendingGeoSecs.push(geoSec);
	}
};


/**
 * Function: newShape
 *  
 * Create a new shape.
 */
mxVsdxCanvas2D.prototype.newShape = function (shape, cellState, xmlDoc, shapeGeo)
{
	this.geoIndex = 0;
	this.shape = shape;
	this.cellState = cellState;
	this.xmGeo = shapeGeo || cellState.cell.geometry;
	this.xmlDoc = xmlDoc;
	this.geoSec = null;
	this.pendingGeoSecs = [];
	this.shapeImg = null;
	this.shapeType = "Shape";
	
	this.createGeoSec();
};


/**
 * Function: newEdge
 *  
 * Create a new edge.
 */
mxVsdxCanvas2D.prototype.newEdge = function (shape, cellState, xmlDoc, edgeGeo)
{
	this.shape = shape;
	this.cellState = cellState;
	this.xmGeo = edgeGeo || cellState.cellBounds;
	this.xmlDoc = xmlDoc;
};

/**
 * Function: endShape
 *  
 * End current shape and flush any remaining non-empty geometry sections.
 */
mxVsdxCanvas2D.prototype.endShape = function ()
{
	if (this.pendingGeoSecs != null)
	{
		for (var i = 0; i < this.pendingGeoSecs.length; i++)
		{
			var sec = this.pendingGeoSecs[i];
			if (sec.childNodes.length > 0 && sec.parentNode == null)
			{
				this.shape.appendChild(sec);
			}
		}
		this.pendingGeoSecs = [];
	}

	if (this.shapeImg != null)
	{
		this.addForeignData(this.shapeImg.type, this.shapeImg.id);
	}
};


/**
 * Function: newPage
 *  
 * Start a new page.
 */
mxVsdxCanvas2D.prototype.newPage = function ()
{
	this.images = [];
	this.imageMap = {};
	this.pageIndex++;
};

/**
 * Function: getShapeType
 *  
 * Return the Visio shape type ("Shape" or "Foreign").
 */
mxVsdxCanvas2D.prototype.getShapeType = function ()
{
	return this.shapeType;
};

/**
 * Function: getShapeGeo
 *  
 * Return the current geo section.
 */
mxVsdxCanvas2D.prototype.getShapeGeo = function ()
{
	return this.geoSec;
};

/**
 * Function: createCellElemScaled
 * 
 * Creates a cell element and scales the value to inches.
 */
mxVsdxCanvas2D.prototype.createCellElemScaled = function (name, val, formula)
{
	return this.createCellElem(name, val / VsdxExport.prototype.CONVERSION_FACTOR, formula);
};

/**
 * Function: createCellElem
 * 
 * Creates a cell element.
 */
mxVsdxCanvas2D.prototype.createCellElem = function (name, val, formula)
{
	var cell = this.createElt("Cell");
	cell.setAttribute("N", name);
	cell.setAttribute("V", val);
	
	if (formula) cell.setAttribute("F", formula);

	return cell;
};

mxVsdxCanvas2D.prototype.createRowScaled = function(type, index, x, y, a, b, c, d, xF, yF, aF, bF, cF, dF) 
{
	return this.createRowRel(type, index, x / VsdxExport.prototype.CONVERSION_FACTOR, y / VsdxExport.prototype.CONVERSION_FACTOR,
			a / VsdxExport.prototype.CONVERSION_FACTOR, b / VsdxExport.prototype.CONVERSION_FACTOR,
			c / VsdxExport.prototype.CONVERSION_FACTOR, d / VsdxExport.prototype.CONVERSION_FACTOR,
			xF, yF, aF, bF, cF, dF);
};

mxVsdxCanvas2D.prototype.createRowRel = function(type, index, x, y, a, b, c, d, xF, yF, aF, bF, cF, dF) 
{
	var row = this.createElt("Row");
	row.setAttribute("T", type);
	row.setAttribute("IX", index);
	row.appendChild(this.createCellElem("X", x, xF));
	row.appendChild(this.createCellElem("Y", y, yF));
	
	if (a != null && isFinite(a)) row.appendChild(this.createCellElem("A", a, aF));
	if (b != null && isFinite(b)) row.appendChild(this.createCellElem("B", b, bF));
	if (c != null && isFinite(c)) row.appendChild(this.createCellElem("C", c, cF));
	if (d != null && isFinite(d)) row.appendChild(this.createCellElem("D", d, dF));
	
	return row;
};


/**
 * Function: begin
 * 
 * Extends superclass to create path.
 */
mxVsdxCanvas2D.prototype.begin = function()
{
	if (this.geoStepIndex > 1) this.createGeoSec();
};

/**
 * Function: rect
 * 
 * Creates a proportional rectangle path in the current Geometry section.
 */
mxVsdxCanvas2D.prototype.rect = function(x, y, w, h)
{
	if (this.geoStepIndex > 1) this.createGeoSec();
	
	var s = this.state;
	w = w * s.scale;
	h = h * s.scale;

	var geo = this.xmGeo;
	var gw = (geo.width || 1) * s.scale;
	var gh = (geo.height || 1) * s.scale;
	x = ((x - geo.x + s.dx) * s.scale);
	y = ((geo.height - y + geo.y - s.dy) * s.scale);
	
	this.geoSec.appendChild(this.createRowRel("RelMoveTo", this.geoStepIndex++, x / gw, y / gh));
	this.geoSec.appendChild(this.createRowRel("RelLineTo", this.geoStepIndex++, (x + w) / gw, y / gh));
	this.geoSec.appendChild(this.createRowRel("RelLineTo", this.geoStepIndex++, (x + w) / gw, (y - h) / gh));
	this.geoSec.appendChild(this.createRowRel("RelLineTo", this.geoStepIndex++, x / gw, (y - h) / gh));
	this.geoSec.appendChild(this.createRowRel("RelLineTo", this.geoStepIndex++, x / gw, y / gh));
};

/**
 * Function: roundrect
 * 
 * Creates a rounded rectangle path and sets Rounding on the shape.
 */
mxVsdxCanvas2D.prototype.roundrect = function(x, y, w, h, dx, dy)
{
	this.rect(x, y, w, h);
	var r = Math.min(dx || 0, dy != null ? dy : (dx || 0)) * this.state.scale;
	if (r > 0)
	{
		this.shape.appendChild(this.createCellElemScaled("Rounding", r));
	}
};

/**
 * Function: ellipse
 * 
 * Creates a proportional Ellipse row in the current Geometry section.
 */
mxVsdxCanvas2D.prototype.ellipse = function(x, y, w, h)
{
	if (this.geoStepIndex > 1) this.createGeoSec();
	
	var s = this.state;
	w = w * s.scale;
	h = h * s.scale;
	
	var geo = this.xmGeo;
	var gh = (geo.height || 1) * s.scale;
	var gw = (geo.width || 1) * s.scale;
	x = (x - geo.x + s.dx) * s.scale;
	y = gh + (-y + geo.y - s.dy) * s.scale;

	var xWr = (x + w/2) / gw;
	var yHr = (y - h/2) / gh;
	var aWr = x / gw;
	var bHr = (y - h/2) / gh;
	var cWr = (x + w/2) / gw;
	var dHr = y / gh;
	
	this.geoSec.appendChild(this.createRowScaled("Ellipse", this.geoStepIndex++, x + w/2, y - h/2, x, y - h/2, x + w/2, y,
		"Width*" + xWr, "Height*" + yHr, "Width*" + aWr, "Height*" + bHr, "Width*" + cWr, "Height*" + dHr));
};

/**
 * Function: moveTo
 * 
 * Moves the current path to the given point.
 */
mxVsdxCanvas2D.prototype.moveTo = function(x, y)
{
	if (this.geoStepIndex > 1) this.createGeoSec();
	
	this.lastMoveToX = x;
	this.lastMoveToY = y;
	this.lastX = x;
	this.lastY = y;	

	var geo = this.xmGeo;
	var s = this.state;
	x = (x - geo.x + s.dx) * s.scale;
	y = (geo.height - y + geo.y - s.dy) * s.scale;
	var h = (geo.height || 1) * s.scale;
	var w = (geo.width || 1) * s.scale;

	this.geoSec.appendChild(this.createRowRel("RelMoveTo", this.geoStepIndex++, x / w, y / h));
};

/**
 * Function: lineTo
 * 
 * Draws a line to the given coordinates.
 */
mxVsdxCanvas2D.prototype.lineTo = function(x, y)
{
	this.lastX = x;
	this.lastY = y;	

	var geo = this.xmGeo;
	var s = this.state;
	x = (x - geo.x + s.dx) * s.scale;
	y = (geo.height - y + geo.y - s.dy) * s.scale;
	var h = (geo.height || 1) * s.scale;
	var w = (geo.width || 1) * s.scale;

	this.geoSec.appendChild(this.createRowRel("RelLineTo", this.geoStepIndex++, x / w, y / h));
};

/**
 * Function: quadTo
 * 
 * Adds a quadratic curve to the current path.
 */
mxVsdxCanvas2D.prototype.quadTo = function(x1, y1, x2, y2)
{
	this.lastX = x2;
	this.lastY = y2;	

	var s = this.state;
	var geo = this.xmGeo;

	var h = (geo.height || 1) * s.scale;
	var w = (geo.width || 1) * s.scale;

	x1 = (x1 - geo.x + s.dx) * s.scale;
	y1 = (geo.height - y1 + geo.y - s.dy) * s.scale;

	x2 = (x2 - geo.x + s.dx) * s.scale;
	y2 = (geo.height - y2 + geo.y - s.dy) * s.scale;

	x1 = x1 / w;
	y1 = y1 / h;
	x2 = x2 / w;
	y2 = y2 / h;

	this.geoSec.appendChild(this.createRowRel("RelQuadBezTo", this.geoStepIndex++, x2, y2, x1, y1));
};

/**
 * Function: curveTo
 * 
 * Adds a bezier curve to the current path.
 */
mxVsdxCanvas2D.prototype.curveTo = function(x1, y1, x2, y2, x3, y3)
{
	this.lastX = x3;
	this.lastY = y3;	

	var s = this.state;
	var geo = this.xmGeo;

	var h = (geo.height || 1) * s.scale;
	var w = (geo.width || 1) * s.scale;

	x1 = (x1 - geo.x + s.dx) * s.scale;
	y1 = (geo.height - y1 + geo.y - s.dy) * s.scale;

	x2 = (x2 - geo.x + s.dx) * s.scale;
	y2 = (geo.height - y2 + geo.y - s.dy) * s.scale;

	x3 = (x3 - geo.x + s.dx) * s.scale;
	y3 = (geo.height - y3 + geo.y - s.dy) * s.scale;

	x1 = x1 / w;
	y1 = y1 / h;
	x2 = x2 / w;
	y2 = y2 / h;
	x3 = x3 / w;
	y3 = y3 / h;

	this.geoSec.appendChild(this.createRowRel("RelCubBezTo", this.geoStepIndex++, x3, y3, x1, y1, x2, y2));
};

/**
 * Function: close
 * 
 * Closes the current path.
 */
mxVsdxCanvas2D.prototype.close = function()
{
	// Closing with a line if last point != last MoveTo point
	if (this.lastMoveToX != this.lastX || this.lastMoveToY != this.lastY)
		this.lineTo(this.lastMoveToX, this.lastMoveToY);
};

/**
 * Function: addForeignData
 * 
 * Add ForeignData to current shape using image relationship index.
 */
mxVsdxCanvas2D.prototype.addForeignData = function(type, index) 
{
	var foreignData = this.createElt("ForeignData");
	foreignData.setAttribute("ForeignType", "Bitmap");
	
	type = String(type || "png").toUpperCase();
	if (type === "JPG") type = "JPEG";
	
	if (type != "BMP")
		foreignData.setAttribute("CompressionType", type);
	
	var rel = this.createElt("Rel");
	rel.setAttribute("r:id", "rId" + index);
	
	foreignData.appendChild(rel);
	this.shape.appendChild(foreignData);
	this.shapeType = "Foreign";
};


mxVsdxCanvas2D.prototype.convertSvg2Png = function(svgData, w, h, isBase64, callback)
{
	var that = this;
	this.filesLoading++;
	try
	{
		var canvas = document.createElement("canvas");
		var ctx = canvas.getContext("2d");
		
		if (!isBase64)
		{
			if (typeof svgData !== "string")
			{
				svgData = String.fromCharCode.apply(null, new Uint8Array(svgData));
			}
			svgData = ((window.btoa) ? btoa(svgData) : Base64.encode(svgData, true));
		}
		
		var svgUrl = "data:image/svg+xml;base64," + svgData;  
			
	    var img = new Image();
	
		img.onload = function () {
			canvas.width = Math.max(this.width, w);
			canvas.height = Math.max(this.height, h);
			
		    ctx.drawImage(this, 0, 0, canvas.width, canvas.height);     
		    
		    try
		    {
		    	callback(canvas.toDataURL("image/png"));
		    }
		    catch(e){}

		    that.filesLoading--;
	    	
		    if (that.filesLoading == 0)
	    	{
	    		that.onFilesLoaded();
	    	}
		};
		
		img.onerror = function () {
			console.log("SVG2PNG conversion failed");

			try
		    {
		    	callback(svgData);
		    }
		    catch(e){}

		    that.filesLoading--;
		    
	    	if (that.filesLoading == 0)
	    	{
	    		that.onFilesLoaded();
	    	}
		};
		
		img.src = svgUrl;
	}
	catch(e)
	{
		console.log("SVG2PNG conversion failed" + e.message);
		
		try
		{
			callback(svgData);
	    }
	    catch(err){}

		this.filesLoading--;

		if (that.filesLoading == 0)
    	{
    		that.onFilesLoaded();
    	}
	}
};


/**
 * Function: image
 * 
 * Add image to vsdx file as a media (Foreign Object), reusing duplicate images on the same page.
 */
mxVsdxCanvas2D.prototype.image = function(x, y, w, h, src, aspect, flipH, flipV)
{
	var that = this;
	var s = this.state;
	w = w * s.scale;
	h = h * s.scale;
	
	if (this.imageMap == null)
	{
		this.imageMap = {};
	}

	var cachedImg = this.imageMap[src];
	if (cachedImg != null)
	{
		this.shapeImg = { type: cachedImg.type, id: cachedImg.id };
	}
	else
	{
		var imgIndex = this.images.length + 1;
		var imgName = this.pageIndex + "_image" + imgIndex + "."; 
		var type = "png";

		if (src.indexOf("data:") == 0)
		{
			var p = src.indexOf("base64,");
			if (p > 0)
			{
				var base64 = src.substring(p + 7);
				type = src.substring(11, p - 1); // after "data:image/"
				if (type.indexOf("svg") == 0)
				{
					type = "png";
					imgName += type;
					if (typeof document !== "undefined" && document.createElement && typeof Image !== "undefined")
					{
						this.convertSvg2Png(base64, w, h, true, function(pngData) {
							var dIdx = pngData.indexOf("base64,");
							that.zip.file("visio/media/" + imgName, dIdx >= 0 ? pngData.substring(dIdx + 7) : pngData, {base64: true});
						});
					}
					else
					{
						this.zip.file("visio/media/" + imgName, base64, {base64: true});
					}
				}
				else
				{
					if (type.indexOf(";") > 0) type = type.substring(0, type.indexOf(";"));
					imgName += type;
					this.zip.file("visio/media/" + imgName, base64, {base64: true});
				}
			}
			else
			{
				var commaIdx = src.indexOf(",");
				var rawData = commaIdx >= 0 ? decodeURIComponent(src.substring(commaIdx + 1)) : "";
				type = "png";
				imgName += type;
				if (typeof document !== "undefined" && document.createElement && typeof Image !== "undefined")
				{
					this.convertSvg2Png(rawData, w, h, false, function(pngData) {
						var dIdx = pngData.indexOf("base64,");
						that.zip.file("visio/media/" + imgName, dIdx >= 0 ? pngData.substring(dIdx + 7) : pngData, {base64: true});
					});
				}
				else
				{
					this.zip.file("visio/media/" + imgName, rawData);
				}
			}
		}
		else if (typeof window !== "undefined" && window.XMLHttpRequest)
		{
			var convertedSrc = (this.converter != null) ? this.converter.convert(src) : src;
			this.filesLoading++;
			
			var cleanUrl = convertedSrc.split("?")[0].split("#")[0];
			var p = cleanUrl.lastIndexOf(".");
			type = (p >= 0) ? cleanUrl.substring(p + 1).toLowerCase() : "png";
			
			var convertSvg = false;
			if (type.indexOf("svg") == 0) 
			{
				type = "png";
				convertSvg = true;
			}

			imgName += type;

			var xhr = new XMLHttpRequest();
			xhr.open('GET', convertedSrc, true);
			xhr.responseType = 'arraybuffer';
			xhr.onreadystatechange = function(e) 
			{
			    if (this.readyState == 4) 
			    {
			    	if (this.status == 200)
		    		{
			    		if (convertSvg)
		    			{
			    			that.convertSvg2Png(this.response, w, h, false, function(pngData) {
			    				var dIdx = pngData.indexOf("base64,");
			    				that.zip.file("visio/media/" + imgName, dIdx >= 0 ? pngData.substring(dIdx + 7) : pngData, {base64: true});
			    			});
			    		}
			    		else
			    		{
			    			that.zip.file("visio/media/" + imgName, this.response);
			    		}
		    		}
			    	
			    	that.filesLoading--;
			    	
			    	if (that.filesLoading == 0)
			    	{
			    		that.onFilesLoaded();
			    	}
			    }
			};
			xhr.send();
		}

		this.images.push(imgName);
		// Add 1 to the id as rId1 is reserved for the edges master
		var rIdNum = this.images.length + 1;
		this.shapeImg = { type: type, id: rIdNum };
		this.imageMap[src] = { name: imgName, type: type, id: rIdNum };
	}

	aspect = (aspect != null) ? aspect : true;
	flipH = (flipH != null) ? flipH : false;
	flipV = (flipV != null) ? flipV : false;

	if (flipH) this.shape.appendChild(this.createCellElem("FlipX", 1));
	if (flipV) this.shape.appendChild(this.createCellElem("FlipY", 1));

	var geo = this.xmGeo;
	x = (x - geo.x + s.dx) * s.scale;
	y = (geo.height - y + geo.y - s.dy) * s.scale;

	this.shape.appendChild(this.createCellElemScaled("ImgOffsetX", x));
	this.shape.appendChild(this.createCellElemScaled("ImgOffsetY", y - h));
	this.shape.appendChild(this.createCellElemScaled("ImgWidth", w));
	this.shape.appendChild(this.createCellElemScaled("ImgHeight", h));
};

/**
 * Helper to normalize CSS/HTML colors to #rrggbb for Visio Character cells.
 */
mxVsdxCanvas2D.prototype.normalizeColor = function(color, defaultColor)
{
	if (!color || color === "none" || color === "inherit" || color === "initial" || color === "transparent")
	{
		return defaultColor || null;
	}
	if (color === "default")
	{
		return defaultColor || "#000000";
	}
	if (typeof mxUtils !== "undefined" && mxUtils.isLightDarkColor && mxUtils.isLightDarkColor(color))
	{
		color = mxUtils.parseLightDarkColor(color).light;
	}
	var hex = (typeof mxUtils !== "undefined" && mxUtils.rgba2hex) ? mxUtils.rgba2hex(color) : color;
	if (!hex || hex === "none" || hex === "default")
	{
		return defaultColor || null;
	}
	hex = String(hex).trim();
	if (/^#[0-9a-fA-F]{3}$/.test(hex))
	{
		hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
	}
	if (/^#[0-9a-fA-F]{6}$/.test(hex))
	{
		return hex.toLowerCase();
	}
	return defaultColor || null;
};

/**
 * Helper to parse inline style string into a key-value map.
 */
mxVsdxCanvas2D.prototype.parseInlineStyle = function(styleAttr)
{
	var map = {};
	if (!styleAttr) return map;
	var parts = String(styleAttr).split(";");
	for (var i = 0; i < parts.length; i++)
	{
		var kv = parts[i].split(":");
		if (kv.length >= 2)
		{
			var k = kv[0].trim().toLowerCase();
			var v = kv.slice(1).join(":").trim();
			if (k && v) map[k] = v;
		}
	}
	return map;
};

/**
 * Helper to parse HTML or plain text into an array of paragraphs,
 * where each paragraph is { align, bullet, runs: [ { text, fontColor, fontSize, fontFamily, bold, italic, underline, strikethrough, pos } ] }.
 */
mxVsdxCanvas2D.prototype.parseTextParagraphs = function(str, format, baseStyle)
{
	var that = this;
	var paragraphs = [];
	var currentPara = {
		align: baseStyle.align,
		bullet: 0,
		runs: []
	};

	var flushParagraph = function(nextAlign, nextBullet)
	{
		paragraphs.push(currentPara);
		currentPara = {
			align: nextAlign != null ? nextAlign : baseStyle.align,
			bullet: nextBullet != null ? nextBullet : 0,
			runs: []
		};
	};

	var addRun = function(txt, style)
	{
		if (txt == null || txt === "") return;
		var parts = String(txt).split("\n");
		for (var i = 0; i < parts.length; i++)
		{
			if (i > 0)
			{
				flushParagraph(style.align, style.bullet);
			}
			if (parts[i].length > 0)
			{
				currentPara.runs.push({
					text: parts[i],
					fontColor: style.fontColor,
					fontSize: style.fontSize,
					fontFamily: style.fontFamily,
					bold: !!style.bold,
					italic: !!style.italic,
					underline: !!style.underline,
					strikethrough: !!style.strikethrough,
					pos: style.pos || 0
				});
			}
		}
	};

	if (format !== "html")
	{
		addRun(String(str), baseStyle);
		paragraphs.push(currentPara);
		return paragraphs;
	}

	var htmlStr = String(str);
	if (mxUtils.getValue(this.cellState.style, 'nl2Br', '1') != '0')
	{
		htmlStr = htmlStr.replace(/\r\n/g, '\n').replace(/\n/g, '<br/>');
	}
	if (typeof Graph !== "undefined" && Graph.sanitizeHtml)
	{
		htmlStr = Graph.sanitizeHtml(htmlStr);
	}

	var container = null;
	if (typeof document !== "undefined" && document.createElement)
	{
		if (this.html2txtDiv == null)
		{
			this.html2txtDiv = document.createElement("div");
		}
		this.html2txtDiv.innerHTML = htmlStr;
		container = this.html2txtDiv;
	}
	else
	{
		// Fallback XML/HTML parser for headless environments without document.createElement("div")
		try
		{
			var wrapped = "<div>" + htmlStr.replace(/<br\s*>/gi, "<br/>").replace(/<hr\s*>/gi, "<hr/>") + "</div>";
			container = mxUtils.parseXml(wrapped).documentElement;
		}
		catch (e)
		{
			var stripped = htmlStr.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(div|p|li|h[1-6]|tr)>/gi, "\n").replace(/<[^>]+>/g, "");
			addRun(stripped, baseStyle);
			paragraphs.push(currentPara);
			return paragraphs;
		}
	}

	var htmlFontSizeMap = { "1": 8, "2": 10, "3": 12, "4": 14, "5": 18, "6": 24, "7": 36 };
	var blockTags = { "DIV": 1, "P": 1, "H1": 1, "H2": 1, "H3": 1, "H4": 1, "H5": 1, "H6": 1, "LI": 1, "UL": 1, "OL": 1, "BLOCKQUOTE": 1, "TR": 1, "TABLE": 1 };

	var walkNodes = function(nodes, pStyle)
	{
		var olCounter = 1;
		for (var i = 0; i < nodes.length; i++)
		{
			var node = nodes[i];
			if (node.nodeType === 3) // Text node
			{
				var txt = node.nodeValue || node.textContent || "";
				if (txt.length > 0)
				{
					addRun(txt, pStyle);
				}
			}
			else if (node.nodeType === 1) // Element node
			{
				var tag = (node.nodeName || node.tagName || "").toUpperCase();
				if (tag === "BR")
				{
					flushParagraph(pStyle.align, pStyle.bullet);
					continue;
				}

				var inlineMap = that.parseInlineStyle(node.getAttribute ? node.getAttribute("style") : "");
				var cStyle = {
					fontColor: pStyle.fontColor,
					fontSize: pStyle.fontSize,
					fontFamily: pStyle.fontFamily,
					align: pStyle.align,
					bold: pStyle.bold,
					italic: pStyle.italic,
					underline: pStyle.underline,
					strikethrough: pStyle.strikethrough,
					pos: pStyle.pos,
					bullet: pStyle.bullet,
					inOL: pStyle.inOL
				};

				// Tag-based styling
				if (tag === "B" || tag === "STRONG" || /^H[1-6]$/.test(tag)) cStyle.bold = true;
				if (tag === "I" || tag === "EM") cStyle.italic = true;
				if (tag === "U" || tag === "INS") cStyle.underline = true;
				if (tag === "S" || tag === "STRIKE" || tag === "DEL") cStyle.strikethrough = true;
				if (tag === "SUP") cStyle.pos = 1;
				if (tag === "SUB") cStyle.pos = 2;

				if (tag === "FONT" && node.getAttribute)
				{
					var fc = node.getAttribute("color");
					if (fc) cStyle.fontColor = that.normalizeColor(fc, cStyle.fontColor);
					var ff = node.getAttribute("face");
					if (ff) cStyle.fontFamily = ff.replace(/['"]/g, "");
					var fs = node.getAttribute("size");
					if (fs && htmlFontSizeMap[fs]) cStyle.fontSize = htmlFontSizeMap[fs];
				}

				// Inline CSS overrides
				if (inlineMap["font-weight"])
				{
					var fw = inlineMap["font-weight"].toLowerCase();
					cStyle.bold = (fw === "bold" || fw === "bolder" || parseInt(fw, 10) >= 600);
				}
				if (inlineMap["font-style"])
				{
					var fst = inlineMap["font-style"].toLowerCase();
					cStyle.italic = (fst === "italic" || fst === "oblique");
				}
				var tdec = (inlineMap["text-decoration"] || inlineMap["text-decoration-line"] || "").toLowerCase();
				if (tdec)
				{
					if (tdec.indexOf("underline") >= 0) cStyle.underline = true;
					if (tdec.indexOf("line-through") >= 0) cStyle.strikethrough = true;
					if (tdec === "none")
					{
						cStyle.underline = false;
						cStyle.strikethrough = false;
					}
				}
				if (inlineMap["color"])
				{
					cStyle.fontColor = that.normalizeColor(inlineMap["color"], cStyle.fontColor);
				}
				if (inlineMap["font-family"])
				{
					cStyle.fontFamily = inlineMap["font-family"].replace(/['"]/g, "").split(",")[0].trim();
				}
				if (inlineMap["font-size"])
				{
					var rawFs = inlineMap["font-size"].toLowerCase();
					var numFs = parseFloat(rawFs);
					if (!isNaN(numFs) && numFs > 0)
					{
						if (rawFs.indexOf("em") > 0) cStyle.fontSize = (pStyle.fontSize || 12) * numFs;
						else if (rawFs.indexOf("%") > 0) cStyle.fontSize = (pStyle.fontSize || 12) * (numFs / 100);
						else cStyle.fontSize = numFs;
					}
				}

				var alignAttr = inlineMap["text-align"] || (node.getAttribute ? node.getAttribute("align") : null);
				if (alignAttr)
				{
					cStyle.align = alignAttr.toLowerCase().trim();
				}

				var isBlock = !!blockTags[tag] || inlineMap["display"] === "block";

				if (tag === "UL")
				{
					cStyle.bullet = 1;
					cStyle.inOL = false;
					if (!alignAttr) cStyle.align = "left";
				}
				else if (tag === "OL")
				{
					cStyle.bullet = 0;
					cStyle.inOL = true;
					if (!alignAttr) cStyle.align = "left";
				}

				if (isBlock && currentPara.runs.length > 0)
				{
					flushParagraph(cStyle.align, cStyle.bullet);
				}
				else if (isBlock)
				{
					currentPara.align = cStyle.align;
					currentPara.bullet = cStyle.bullet;
				}

				if (tag === "LI" && cStyle.inOL)
				{
					addRun((olCounter++) + ". ", cStyle);
				}

				if (node.childNodes && node.childNodes.length > 0)
				{
					// Special case: <div><br></div> represents an explicit blank line
					if (isBlock && node.childNodes.length === 1 &&
						node.childNodes[0].nodeType === 1 &&
						(node.childNodes[0].nodeName || "").toUpperCase() === "BR")
					{
						flushParagraph(pStyle.align, pStyle.bullet);
					}
					else
					{
						walkNodes(node.childNodes, cStyle);
					}
				}

				if (isBlock && currentPara.runs.length > 0)
				{
					flushParagraph(pStyle.align, pStyle.bullet);
				}
			}
		}
	};

	walkNodes(container.childNodes, baseStyle);

	if (currentPara.runs.length > 0 || paragraphs.length === 0)
	{
		paragraphs.push(currentPara);
	}

	return paragraphs;
};

/**
 * Function: text
 * 
 * Paints the given text into Visio Character, Paragraph, and Text elements.
 */
mxVsdxCanvas2D.prototype.text = function(x, y, w, h, str, align, valign, wrap, format, overflow, clip, rotation, dir)
{
	var that = this;
	if (this.textEnabled && str != null)
	{
		if (mxUtils.isNode(str))
		{
			str = mxUtils.getOuterHtml(str);
		}

		var cellStyle = (this.cellState != null && this.cellState.style != null) ? this.cellState.style : {};
		var baseFontSize = parseFloat(mxUtils.getValue(cellStyle, mxConstants.STYLE_FONTSIZE, mxConstants.DEFAULT_FONTSIZE || 12));
		var baseFontFamily = mxUtils.getValue(cellStyle, mxConstants.STYLE_FONTFAMILY, mxConstants.DEFAULT_FONTFAMILY || "Calibri");
		var baseFontColor = this.normalizeColor(mxUtils.getValue(cellStyle, mxConstants.STYLE_FONTCOLOR, "#000000"), "#000000");
		var baseFontStyle = parseInt(mxUtils.getValue(cellStyle, mxConstants.STYLE_FONTSTYLE, 0), 10) || 0;
		var baseAlign = align || mxUtils.getValue(cellStyle, mxConstants.STYLE_ALIGN, "center");
		var baseValign = valign || mxUtils.getValue(cellStyle, mxConstants.STYLE_VERTICAL_ALIGN, "middle");

		var baseStyle = {
			fontColor: baseFontColor,
			fontSize: baseFontSize,
			fontFamily: baseFontFamily,
			align: baseAlign,
			bold: (baseFontStyle & 1) !== 0,
			italic: (baseFontStyle & 2) !== 0,
			underline: (baseFontStyle & 4) !== 0,
			strikethrough: (baseFontStyle & 8) !== 0,
			pos: 0,
			bullet: 0
		};

		var paragraphs = this.parseTextParagraphs(str, format, baseStyle);

		var s = this.state;
		var geo = this.xmGeo;

		var scaledW = w * s.scale;
		var scaledH = h * s.scale;

		var charSect = this.createElt("Section");
		charSect.setAttribute('N', 'Character');

		var pSect = this.createElt("Section");
		pSect.setAttribute('N', 'Paragraph');

		var textEl = this.createElt("Text");

		var charIndex = 0;
		var pIndex = 0;
		var calcW = 0, calcH = 0;

		var isEdge = (geo != null && geo.isEdge) ||
			(this.cellState != null && this.cellState.view != null && this.cellState.view.graph != null &&
			 this.cellState.view.graph.getModel().isEdge(this.cellState.cell));

		var hpos = mxUtils.getValue(cellStyle, mxConstants.STYLE_LABEL_POSITION, mxConstants.ALIGN_CENTER);
		var vpos = mxUtils.getValue(cellStyle, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_MIDDLE);
		var isExternalLabel = !isEdge && (hpos !== mxConstants.ALIGN_CENTER || vpos !== mxConstants.ALIGN_MIDDLE);
		var hasExplicitLabelWidth = cellStyle[mxConstants.STYLE_LABEL_WIDTH] != null;
		var wrapToWidth = !!(wrap && scaledW > 0 && !isEdge && (!isExternalLabel || hasExplicitLabelWidth));

		var rawLineHeight = parseFloat(mxUtils.getValue(cellStyle, 'lineHeight', '1.2'));
		var spLineVal = (!isNaN(rawLineHeight) && rawLineHeight > 0) ? (-rawLineHeight) + "" : "-1.2";

		var mapHorzAlign = function(a)
		{
			switch (a)
			{
				case 'left':
				case 'start':
					return (dir === 'rtl' && a === 'start') ? 2 : 0;
				case 'right':
				case 'end':
					return (dir === 'rtl' && a === 'end') ? 0 : 2;
				case 'justify':
					return 3;
				case 'center':
				default:
					return 1;
			}
		};

		var lastHorzAlign = null;
		var lastBullet = null;

		for (var pIdx = 0; pIdx < paragraphs.length; pIdx++)
		{
			var para = paragraphs[pIdx];
			var isLastPara = (pIdx === paragraphs.length - 1);
			var horzAlignVal = mapHorzAlign(para.align);
			var bulletVal = para.bullet ? "1" : "0";

			// Emit a new Paragraph Row and <pp/> when paragraph formatting changes (or on first paragraph).
			// Every Paragraph Row must include SpLine (e.g. -1.2) because Visio's StyleSheet only defines
			// Row IX=0; omitting SpLine on Row IX>=1 causes Visio to default SpLine to 0 (lines overlap).
			if (pIdx === 0 || horzAlignVal !== lastHorzAlign || bulletVal !== lastBullet)
			{
				var pRow = this.createElt("Row");
				pRow.setAttribute('IX', pIndex);
				pRow.appendChild(this.createCellElem("IndFirst", "0"));
				pRow.appendChild(this.createCellElem("IndLeft", "0"));
				pRow.appendChild(this.createCellElem("IndRight", "0"));
				pRow.appendChild(this.createCellElem("SpLine", spLineVal));
				pRow.appendChild(this.createCellElem("SpBefore", "0"));
				pRow.appendChild(this.createCellElem("SpAfter", "0"));
				pRow.appendChild(this.createCellElem("HorzAlign", horzAlignVal));
				pRow.appendChild(this.createCellElem("Bullet", bulletVal));
				pRow.appendChild(this.createCellElem("BulletStr", ""));
				pRow.appendChild(this.createCellElem("BulletFont", "0"));
				pRow.appendChild(this.createCellElem("BulletFontSize", "-1"));
				pRow.appendChild(this.createCellElem("TextPosAfterBullet", "0"));
				pRow.appendChild(this.createCellElem("Flags", (dir === "rtl") ? "1" : "0"));
				pSect.appendChild(pRow);

				var pp = this.createElt("pp");
				pp.setAttribute('IX', pIndex++);
				textEl.appendChild(pp);

				lastHorzAlign = horzAlignVal;
				lastBullet = bulletVal;
			}

			var paraW = 0;
			var paraH = 0;

			if (para.runs.length === 0)
			{
				// Empty line
				var emptySize = (typeof mxUtils !== "undefined" && mxUtils.getSizeForString) ?
					mxUtils.getSizeForString(" ", baseFontSize, baseFontFamily) :
					{ width: baseFontSize * 0.5, height: baseFontSize * 1.2 };
				paraH = emptySize.height;
				if (!isLastPara)
				{
					textEl.appendChild(this.xmlDoc.createTextNode("\n"));
				}
			}
			else
			{
				for (var rIdx = 0; rIdx < para.runs.length; rIdx++)
				{
					var run = para.runs[rIdx];
					var isLastRunInPara = (rIdx === para.runs.length - 1);
					var rFontSize = run.fontSize || baseFontSize;
					var rFontFamily = run.fontFamily || baseFontFamily;
					var rFontStyle = (run.bold ? 1 : 0) | (run.italic ? 2 : 0) | (run.underline ? 4 : 0);

					// Preserve leading/trailing spaces during HTML width measurement
					var measureText = String(run.text).replace(/^ +| +$/g, function(m)
					{
						return new Array(m.length + 1).join("\u00a0");
					});

					var strRect = (typeof mxUtils !== "undefined" && mxUtils.getSizeForString) ?
						mxUtils.getSizeForString(measureText, rFontSize, rFontFamily, null, rFontStyle) :
						{ width: run.text.length * rFontSize * (run.bold ? 0.68 : 0.6), height: rFontSize * 1.25 };

					if (wrapToWidth && (paraW + strRect.width) > scaledW && typeof mxUtils !== "undefined" && mxUtils.getSizeForString)
					{
						strRect = mxUtils.getSizeForString(measureText, rFontSize, rFontFamily, scaledW, rFontStyle);
					}

					paraW += strRect.width;
					paraH = Math.max(paraH, strRect.height);

					var charRow = this.createElt("Row");
					charRow.setAttribute('IX', charIndex);

					if (run.fontColor)
					{
						charRow.appendChild(this.createCellElem("Color", this.normalizeColor(run.fontColor, "#000000")));
					}
					if (rFontSize)
					{
						// 0.97 factor prevents slight font metric overflow in Visio
						charRow.appendChild(this.createCellElemScaled("Size", rFontSize * 0.97));
					}
					if (rFontFamily)
					{
						charRow.appendChild(this.createCellElem("Font", rFontFamily));
					}

					// Visio Character Style bitmask:
					// 0x01 = Bold, 0x02 = Italic, 0x04 = Underline, 0x08 = Small caps
					var styleBits = 0;
					if (run.bold) styleBits |= 0x01;
					if (run.italic) styleBits |= 0x02;
					if (run.underline) styleBits |= 0x04;

					charRow.appendChild(this.createCellElem("Style", styleBits));
					charRow.appendChild(this.createCellElem("Strikethru", run.strikethrough ? "1" : "0"));
					charRow.appendChild(this.createCellElem("Case", "0"));
					charRow.appendChild(this.createCellElem("Pos", (run.pos || 0) + ""));
					charRow.appendChild(this.createCellElem("FontScale", "1"));
					charRow.appendChild(this.createCellElem("Letterspace", "0"));

					charSect.appendChild(charRow);

					var cp = this.createElt("cp");
					cp.setAttribute('IX', charIndex++);
					textEl.appendChild(cp);

					var outTxt = run.text + (isLastRunInPara && !isLastPara ? "\n" : "");
					textEl.appendChild(this.xmlDoc.createTextNode(outTxt));
				}
			}

			calcW = wrapToWidth ? Math.min(Math.max(calcW, paraW), scaledW) : Math.max(calcW, paraW);
			calcH += paraH;
		}

		// Also consult draw.io's actual rendered DOM text boundingBox when available
		if (this.cellState != null && this.cellState.text != null)
		{
			var tShape = this.cellState.text;
			var tbb = tShape.unrotatedBoundingBox || tShape.boundingBox;
			var viewScale = (this.cellState.view != null && this.cellState.view.scale) ? this.cellState.view.scale : 1;
			if (tbb != null && tbb.width > 0 && tbb.height > 0 && (tShape.getTextRotation == null || !tShape.getTextRotation() || tShape.unrotatedBoundingBox != null))
			{
				var domW = (tbb.width / viewScale) * s.scale;
				var domH = (tbb.height / viewScale) * s.scale;
				calcW = wrapToWidth ? Math.min(Math.max(calcW, domW), scaledW) : Math.max(calcW, domW);
				calcH = Math.max(calcH, domH);
			}
		}

		// Set VerticalAlign on shape (0 = Top, 1 = Middle, 2 = Bottom)
		var visioValign = 1;
		if (baseValign === "top") visioValign = 0;
		else if (baseValign === "bottom") visioValign = 2;
		this.shape.appendChild(this.createCellElem("VerticalAlign", visioValign));

		if (isEdge)
		{
			// 1D connector label positioning:
			// Zero out default 4pt margins from StyleSheet so tight labels do not wrap prematurely,
			// and include Visio's TEXTWIDTH/TEXTHEIGHT formulas so the text area grows to fit.
			this.shape.appendChild(this.createCellElem("LeftMargin", "0"));
			this.shape.appendChild(this.createCellElem("RightMargin", "0"));
			this.shape.appendChild(this.createCellElem("TopMargin", "0"));
			this.shape.appendChild(this.createCellElem("BottomMargin", "0"));

			var boxW = Math.max(scaledW, calcW * 1.25 + baseFontSize, baseFontSize * 2);
			var boxH = Math.max(scaledH, calcH * 1.2 + baseFontSize * 0.5, baseFontSize * 1.5);

			var lx = (x - geo.x + s.dx) * s.scale;
			var ly = -(y - geo.y + s.dy) * s.scale;

			if (baseAlign === "left") lx += boxW / 2;
			else if (baseAlign === "right") lx -= boxW / 2;

			if (baseValign === "top") ly -= boxH / 2;
			else if (baseValign === "bottom") ly += boxH / 2;

			var txtPinXF = (Math.abs(geo.width) > 1e-6) ? ("Width*" + (+(lx / geo.width).toFixed(6))) : null;
			var txtPinYF = (Math.abs(geo.height) > 1e-6) ? ("Height*" + (+(ly / geo.height).toFixed(6))) : null;

			this.shape.appendChild(this.createCellElemScaled("TxtPinX", lx, txtPinXF));
			this.shape.appendChild(this.createCellElemScaled("TxtPinY", ly, txtPinYF));
			this.shape.appendChild(this.createCellElemScaled("TxtWidth", boxW, "MAX(TEXTWIDTH(TheText),5*Char.Size)"));
			this.shape.appendChild(this.createCellElemScaled("TxtHeight", boxH, "TEXTHEIGHT(TheText,TxtWidth)"));
			this.shape.appendChild(this.createCellElemScaled("TxtLocPinX", boxW / 2, "TxtWidth*0.5"));
			this.shape.appendChild(this.createCellElemScaled("TxtLocPinY", boxH / 2, "TxtHeight*0.5"));

			if (rotation != null && rotation != 0)
			{
				this.shape.appendChild(this.createCellElem("TxtAngle", (360 - rotation) * Math.PI / 180));
			}
		}
		else
		{
			// 2D vertex label positioning:
			var scaledGeoW = geo.width * s.scale;
			var scaledGeoH = geo.height * s.scale;

			var paddedCalcW = calcW * 1.25 + baseFontSize;
			var paddedCalcH = calcH * 1.2 + baseFontSize * 0.5;

			var boxW = isExternalLabel ?
				(hasExplicitLabelWidth ? Math.max(scaledW, baseFontSize) : Math.max(paddedCalcW, baseFontSize * 2)) :
				(wrapToWidth ? Math.max(scaledW, baseFontSize) : Math.max(scaledW, paddedCalcW));
			var boxH = isExternalLabel ?
				Math.max(paddedCalcH, baseFontSize * 1.5) :
				Math.max(scaledH, paddedCalcH);

			// Shape rotation (includes direction=north|south|west rotation if state.shape is present)
			var shapeRot = (this.cellState != null && this.cellState.shape != null && this.cellState.shape.getShapeRotation) ?
				(this.cellState.shape.getShapeRotation() || 0) :
				parseFloat(mxUtils.getValue(cellStyle, mxConstants.STYLE_ROTATION, '0'));
			var textRot = (rotation != null) ? parseFloat(rotation) : 0;

			// In mxCellRenderer.rotateLabelBounds, (x, y) was rotated around the shape center by textRot.
			// Undo textRot around the shape center to recover the unrotated anchor (ux, uy):
			var cellCenterX = (geo.x - s.dx) + geo.width / 2;
			var cellCenterY = (geo.y - s.dy) + geo.height / 2;

			var ux = x;
			var uy = y;
			if (textRot !== 0)
			{
				var rad = -textRot * Math.PI / 180;
				var cos = Math.cos(rad);
				var sin = Math.sin(rad);
				var dx0 = x - cellCenterX;
				var dy0 = y - cellCenterY;
				ux = cellCenterX + dx0 * cos - dy0 * sin;
				uy = cellCenterY + dx0 * sin + dy0 * cos;
			}

			var deltaRot = textRot - shapeRot;

			// When the label is an unrotated internal label that fits within the shape bounds,
			// use the full shape box (Width*0.5, Height*0.5, Width*1, Height*1) and express the
			// label inset via LeftMargin/RightMargin/TopMargin/BottomMargin. This keeps the label
			// attached to the shape itself in both Visio and draw.io VSDX import.
			var useInternalFullBox = !isExternalLabel && deltaRot === 0 &&
				scaledGeoW > 0 && scaledGeoH > 0 &&
				boxW <= scaledGeoW * 1.05 && boxH <= scaledGeoH * 1.05;

			if (useInternalFullBox)
			{
				var relX = (ux - (geo.x - s.dx)) * s.scale;
				var relY = (uy - (geo.y - s.dy)) * s.scale;

				var leftM = 0, rightM = 0, topM = 0, bottomM = 0;
				if (baseAlign === "left")
				{
					leftM = Math.max(0, relX);
					rightM = Math.max(0, scaledGeoW - leftM - scaledW);
				}
				else if (baseAlign === "right")
				{
					rightM = Math.max(0, scaledGeoW - relX);
					leftM = Math.max(0, scaledGeoW - rightM - scaledW);
				}
				else
				{
					leftM = rightM = Math.max(0, (scaledGeoW - scaledW) / 2);
				}

				if (baseValign === "top")
				{
					topM = Math.max(0, relY);
					bottomM = Math.max(0, scaledGeoH - topM - scaledH);
				}
				else if (baseValign === "bottom")
				{
					bottomM = Math.max(0, scaledGeoH - relY);
					topM = Math.max(0, scaledGeoH - bottomM - scaledH);
				}
				else
				{
					topM = bottomM = Math.max(0, (scaledGeoH - scaledH) / 2);
				}

				this.shape.appendChild(this.createCellElemScaled("LeftMargin", leftM));
				this.shape.appendChild(this.createCellElemScaled("RightMargin", rightM));
				this.shape.appendChild(this.createCellElemScaled("TopMargin", topM));
				this.shape.appendChild(this.createCellElemScaled("BottomMargin", bottomM));

				this.shape.appendChild(this.createCellElemScaled("TxtPinX", scaledGeoW * 0.5, "Width*0.5"));
				this.shape.appendChild(this.createCellElemScaled("TxtPinY", scaledGeoH * 0.5, "Height*0.5"));
				this.shape.appendChild(this.createCellElemScaled("TxtWidth", scaledGeoW, "Width*1"));
				this.shape.appendChild(this.createCellElemScaled("TxtHeight", scaledGeoH, "Height*1"));
				this.shape.appendChild(this.createCellElemScaled("TxtLocPinX", scaledGeoW * 0.5, "TxtWidth*0.5"));
				this.shape.appendChild(this.createCellElemScaled("TxtLocPinY", scaledGeoH * 0.5, "TxtHeight*0.5"));
			}
			else
			{
				// Displaced/external label or rotated/overflowing label:
				// Zero out margins so the text box size is not shrunk by StyleSheet margins,
				// and emit Width*/Height* formulas so Visio & draw.io recognize the displaced text box
				// and let it grow to fit the text.
				this.shape.appendChild(this.createCellElem("LeftMargin", "0"));
				this.shape.appendChild(this.createCellElem("RightMargin", "0"));
				this.shape.appendChild(this.createCellElem("TopMargin", "0"));
				this.shape.appendChild(this.createCellElem("BottomMargin", "0"));

				var boxCenterX = ux;
				if (baseAlign === "left") boxCenterX += (boxW / s.scale) / 2;
				else if (baseAlign === "right") boxCenterX -= (boxW / s.scale) / 2;

				var boxCenterY = uy;
				if (baseValign === "top") boxCenterY += (boxH / s.scale) / 2;
				else if (baseValign === "bottom") boxCenterY -= (boxH / s.scale) / 2;

				if (deltaRot !== 0)
				{
					var dRad = deltaRot * Math.PI / 180;
					var dCos = Math.cos(dRad);
					var dSin = Math.sin(dRad);
					var dcx = boxCenterX - cellCenterX;
					var dcy = boxCenterY - cellCenterY;
					boxCenterX = cellCenterX + dcx * dCos - dcy * dSin;
					boxCenterY = cellCenterY + dcy * dCos + dcx * dSin;
				}

				var localPinX = (boxCenterX - geo.x + s.dx) * s.scale;
				var localPinY = (geo.height - boxCenterY + geo.y - s.dy) * s.scale;

				var pinXF = (scaledGeoW > 1e-6) ? ("Width*" + (+(localPinX / scaledGeoW).toFixed(6))) : null;
				var pinYF = (scaledGeoH > 1e-6) ? ("Height*" + (+(localPinY / scaledGeoH).toFixed(6))) : null;
				var txtWF = wrapToWidth && scaledGeoW > 1e-6 ?
					("Width*" + (+(boxW / scaledGeoW).toFixed(6))) :
					"Width*0+MAX(TEXTWIDTH(TheText),5*Char.Size)";
				var txtHF = "Height*0+TEXTHEIGHT(TheText,TxtWidth)";

				this.shape.appendChild(this.createCellElemScaled("TxtPinX", localPinX, pinXF));
				this.shape.appendChild(this.createCellElemScaled("TxtPinY", localPinY, pinYF));
				this.shape.appendChild(this.createCellElemScaled("TxtWidth", boxW, txtWF));
				this.shape.appendChild(this.createCellElemScaled("TxtHeight", boxH, txtHF));
				this.shape.appendChild(this.createCellElemScaled("TxtLocPinX", boxW / 2, "TxtWidth*0.5"));
				this.shape.appendChild(this.createCellElemScaled("TxtLocPinY", boxH / 2, "TxtHeight*0.5"));

				if (deltaRot !== 0)
				{
					var normAngle = ((360 - deltaRot) % 360 + 360) % 360;
					this.shape.appendChild(this.createCellElem("TxtAngle", normAngle * Math.PI / 180));
				}
			}
		}

		this.shape.appendChild(charSect);
		this.shape.appendChild(pSect);
		this.shape.appendChild(textEl);
	}
};

/**
 * Function: rotate
 * 
 * Sets the rotation of the canvas. Note that rotation cannot be concatenated.
 */
mxVsdxCanvas2D.prototype.rotate = function(theta, flipH, flipV, cx, cy)
{
	// Vsdx has flipX/Y support separate from rotation
	if (theta != 0)
	{
		var s = this.state;
		cx += s.dx;
		cy += s.dy;
	
		cx *= s.scale;
		cy *= s.scale;

		this.shape.appendChild(this.createCellElem("Angle", (360 - theta) * Math.PI / 180));
		
		s.rotation = s.rotation + theta;
		s.rotationCx = cx;
		s.rotationCy = cy;
	}
};

/**
 * Helper to apply NoFill/NoLine to all pending Geometry sections in the current path
 * and append them to the shape.
 */
mxVsdxCanvas2D.prototype.finishPendingGeos = function(noFill, noLine)
{
	var sections = (this.pendingGeoSecs != null && this.pendingGeoSecs.length > 0) ?
		this.pendingGeoSecs : (this.geoSec != null ? [this.geoSec] : []);

	for (var i = 0; i < sections.length; i++)
	{
		var sec = sections[i];
		if (sec.childNodes.length > 0)
		{
			sec.appendChild(this.createCellElem("NoFill", noFill));
			sec.appendChild(this.createCellElem("NoLine", noLine));
			if (sec.parentNode == null)
			{
				this.shape.appendChild(sec);
			}
		}
	}

	this.pendingGeoSecs = [];
};

/**
 * Function: stroke
 * 
 * Paints the outline of the current drawing buffer.
 */
mxVsdxCanvas2D.prototype.stroke = function()
{
	var noLine = (this.state != null && (this.state.strokeColor === null || this.state.strokeColor === "none")) ? "1" : "0";
	this.finishPendingGeos("1", noLine);
};

/**
 * Function: fill
 * 
 * Fills the current drawing buffer.
 */
mxVsdxCanvas2D.prototype.fill = function()
{
	var noFill = (this.state != null && (this.state.fillColor === null || this.state.fillColor === "none")) ? "1" : "0";
	this.finishPendingGeos(noFill, "1");
};

/**
 * Function: fillAndStroke
 * 
 * Fills the current drawing buffer and its outline.
 */
mxVsdxCanvas2D.prototype.fillAndStroke = function()
{
	var noFill = (this.state != null && (this.state.fillColor === null || this.state.fillColor === "none")) ? "1" : "0";
	var noLine = (this.state != null && (this.state.strokeColor === null || this.state.strokeColor === "none")) ? "1" : "0";
	this.finishPendingGeos(noFill, noLine);
};
