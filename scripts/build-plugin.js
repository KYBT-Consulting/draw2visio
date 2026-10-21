const fs = require('fs');
const path = require('path');

const vsdxExportCode = fs.readFileSync(path.join(__dirname, '../src/VsdxExport.js'), 'utf8');
const vsdxCanvasCode = fs.readFileSync(path.join(__dirname, '../src/mxVsdxCanvas2D.js'), 'utf8');

const pluginSource = `/**
 * draw2visio — VSDX Export Plugin for Latest draw.io (v26.x – v32.x+)
 *
 * Restores and upgrades "File -> Export as -> VSDX..." in draw.io Web and Desktop:
 * - Enables vsdxExportEnabled() across all draw.io environments (Web, Desktop, Docker)
 * - Lazy-loads JSZip on demand if not yet loaded in Web sessions
 * - Includes fixes for rich HTML text, character style bitmasks, paragraph alignment,
 *   multi-subpath geometry, 1D dynamic connectors, connection points, groups,
 *   rotated/directed shapes, label backgrounds, and single/multi-page export.
 */
(function() {
${vsdxExportCode}

${vsdxCanvasCode}

	// Expose globally for draw.io
	if (typeof window !== 'undefined')
	{
		window.VsdxExport = VsdxExport;
		window.mxVsdxCanvas2D = mxVsdxCanvas2D;
	}

	var enableFn = function()
	{
		return true;
	};

	var runExportVisio = function(currentPage)
	{
		var ui = this;
		if (currentPage == null)
		{
			currentPage = (ui.pages == null || ui.pages.length <= 1);
		}

		var onerror = function(e)
		{
			ui.loadingExtensions = false;
			if (ui.spinner) ui.spinner.stop();
			if (ui.handleError) ui.handleError(e || {message: mxResources.get('unknownError')});
		};

		var doExport = function()
		{
			ui.loadingExtensions = false;
			try
			{
				if (ui.spinner) ui.spinner.stop();
				var Exporter = (typeof window !== 'undefined' && window.VsdxExport) || VsdxExport;
				var expSuccess = new Exporter(ui).exportCurrentDiagrams(currentPage);
				if (!expSuccess)
				{
					onerror({message: mxResources.get('unknownError')});
				}
			}
			catch (e)
			{
				onerror(e);
			}
		};

		var baseUrl = (typeof window !== 'undefined' && window.DRAWIO_SERVER_URL) ? window.DRAWIO_SERVER_URL : '';
		if (baseUrl.length > 0 && baseUrl.charAt(baseUrl.length - 1) !== '/')
		{
			baseUrl += '/';
		}

		var fallbackExtensions = function()
		{
			mxscript(baseUrl + 'js/extensions.min.js', function()
			{
				if (typeof window !== 'undefined')
				{
					window.VsdxExport = VsdxExport;
					window.mxVsdxCanvas2D = mxVsdxCanvas2D;
				}
				doExport();
			}, null, null, null, onerror);
		};

		// In latest draw.io Web, JSZip may not be loaded until needed;
		// load js/jszip/jszip.min.js (or fallback to js/extensions.min.js) on demand.
		if (typeof JSZip === 'undefined' && typeof mxscript === 'function')
		{
			if (ui.spinner) ui.spinner.spin(document.body, mxResources.get('loading'));
			mxscript(baseUrl + 'js/jszip/jszip.min.js', function()
			{
				if (typeof JSZip !== 'undefined')
				{
					doExport();
				}
				else
				{
					fallbackExtensions();
				}
			}, null, null, null, fallbackExtensions);
		}
		else
		{
			doExport();
		}
	};

	// Immediately patch EditorUi.prototype so VSDX export is enabled even when loaded
	// via PostConfig.js after EditorUi/App initialization (where external plugins are disabled)
	if (typeof EditorUi !== 'undefined')
	{
		EditorUi.prototype.vsdxExportEnabled = enableFn;
		EditorUi.prototype.exportVisio = runExportVisio;
	}

	// Register in built-in plugin registry if App is present
	if (typeof App !== 'undefined')
	{
		if (App.pluginRegistry != null)
		{
			App.pluginRegistry['vsdx'] = 'plugins/vsdx.js';
		}
		if (App.publicPlugin != null && App.publicPlugin.indexOf && App.publicPlugin.indexOf('vsdx') === -1)
		{
			App.publicPlugin.push('vsdx');
		}
	}

	if (typeof Draw !== 'undefined' && Draw.loadPlugin)
	{
		Draw.loadPlugin(function(editorUi)
		{
			if (typeof EditorUi !== 'undefined')
			{
				EditorUi.prototype.vsdxExportEnabled = enableFn;
				EditorUi.prototype.exportVisio = runExportVisio;
			}
			editorUi.vsdxExportEnabled = enableFn;
			editorUi.exportVisio = runExportVisio.bind(editorUi);

			var exportVsdxAction = editorUi.actions.addAction('exportVsdx', function()
			{
				var noPages = editorUi.pages == null || editorUi.pages.length <= 1;
				
				if (noPages)
				{
					editorUi.exportVisio(true);
				}
				else
				{
					var div = document.createElement('div');
					div.style.whiteSpace = 'nowrap';

					var hd = document.createElement('h3');
					mxUtils.write(hd, mxResources.get('formatVsdx', null, 'VSDX'));
					hd.style.cssText = 'width:100%;text-align:center;margin-top:0px;margin-bottom:4px';
					div.appendChild(hd);

					var section = document.createElement('div');
					section.className = 'geDialogSection';
					
					var pages = editorUi.addCheckbox(section, mxResources.get('allPages', null, 'All Pages'), !noPages, noPages);
					pages.style.marginBottom = '16px';
					div.appendChild(section);
					
					var dlg = new CustomDialog(editorUi, div, function()
					{
						editorUi.exportVisio(!pages.checked);
					}, null, mxResources.get('export', null, 'Export'));
					
					editorUi.showDialog(dlg.container, 300, 146, true, true);
				}
			});

			if (exportVsdxAction != null)
			{
				exportVsdxAction.getTitle = function()
				{
					return mxResources.get('formatVsdx', null, 'VSDX') + '...';
				};
			}

			// In latest draw.io (v32.x), Menus.js still adds 'exportVsdx' inside 'exportAs'
			// whenever editorUi.vsdxExportEnabled() is true and VsdxExport is defined.
			// Wrap 'exportAs' as a forward-compatible fallback in case future versions remove that check,
			// ensuring 'exportVsdx' is added only once.
			var exportAsMenu = editorUi.menus != null ? editorUi.menus.get('exportAs') : null;
			if (exportAsMenu != null)
			{
				var oldFunct = exportAsMenu.funct;
				exportAsMenu.funct = function(menu, parent)
				{
					var addedVsdx = false;
					var origAddMenuItem = editorUi.menus.addMenuItem;
					var origAddMenuItems = editorUi.menus.addMenuItems;

					if (origAddMenuItem != null)
					{
						editorUi.menus.addMenuItem = function(m, key)
						{
							if (key === 'exportVsdx') addedVsdx = true;
							return origAddMenuItem.apply(this, arguments);
						};
					}

					if (origAddMenuItems != null)
					{
						editorUi.menus.addMenuItems = function(m, keys)
						{
							if (keys != null && keys.indexOf && keys.indexOf('exportVsdx') !== -1)
							{
								addedVsdx = true;
							}
							return origAddMenuItems.apply(this, arguments);
						};
					}

					try
					{
						oldFunct.apply(this, arguments);
					}
					finally
					{
						if (origAddMenuItem != null) editorUi.menus.addMenuItem = origAddMenuItem;
						if (origAddMenuItems != null) editorUi.menus.addMenuItems = origAddMenuItems;
					}

					if (!addedVsdx)
					{
						editorUi.menus.addMenuItems(menu, ['-', 'exportVsdx'], parent);
					}
				};
			}
		});
	}
})();
`;

const distDir = path.join(__dirname, '../dist');
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'visio-export-plugin.js'), pluginSource, 'utf8');
console.log('Built dist/visio-export-plugin.js');
