// Extracted UI integration code for VSDX export from draw.io

// === From EditorUi.js (exportVisio method) ===
	EditorUi.prototype.exportVisio = function(currentPage)
	{
		if (this.spinner.spin(document.body, mxResources.get('loading')))
		{
			var onerror = mxUtils.bind(this, function(e)
			{
				this.loadingExtensions = false;
				this.handleError(e);
			});

			if (!this.vsdxExportEnabled())
			{
				onerror({message: mxResources.get('serviceUnavailableOrBlocked')});
				return;
			}

			this.createTimeout(null, mxUtils.bind(this, function(timeout)
			{
				var handleError = mxUtils.bind(this, function(e)
				{
					if (timeout.clear())
					{
						onerror(e);
					}
				});

				var delayed = mxUtils.bind(this, function()
				{
					this.loadingExtensions = false;

					if (timeout.clear())
					{
						if (typeof VsdxExport  !== 'undefined')
						{
							try
							{
								this.spinner.stop();
								var expSuccess = new VsdxExport(this).exportCurrentDiagrams(currentPage);
								
								if (!expSuccess)
								{
									handleError({message: mxResources.get('unknownError')});
								}
							}
							catch (e)
							{
								handleError(e);
							}
						}
						else
						{
							handleError({message: mxResources.get('serviceUnavailableOrBlocked')});
						}
					}
				});
				
				if (typeof VsdxExport === 'undefined' && !this.loadingExtensions && !this.isOffline(true))
				{
					this.loadingExtensions = true;
					mxscript(window.DRAWIO_SERVER_URL + 'js/extensions.min.js', delayed, null, null, null, handleError);
				}

// === From Menus.js (exportVsdx action definition) ===
		var exportVsdxAction = new Action('exportVsdx', function()
		{
			var noPages = editorUi.pages == null || editorUi.pages.length <= 1;
			
			if (noPages)
			{
				editorUi.exportVisio();
			}
			else
			{
				var div = document.createElement('div');
				div.style.whiteSpace = 'nowrap';

				var hd = document.createElement('h3');
				mxUtils.write(hd, mxResources.get('formatVsdx'));
				hd.style.cssText = 'width:100%;text-align:center;margin-top:0px;margin-bottom:4px';
				div.appendChild(hd);
				
				var pages = editorUi.addCheckbox(div, mxResources.get('allPages'), !noPages, noPages);
				pages.style.marginBottom = '16px';
				
				var dlg = new CustomDialog(editorUi, div, mxUtils.bind(this, function()
				{
					editorUi.exportVisio(!pages.checked);
				}), null, mxResources.get('export'));
				
				editorUi.showDialog(dlg.container, 300, 130, true, true);
			}
		});

		exportVsdxAction.getTitle = function()
		{
			return mxResources.get('formatVsdx') + ' (beta)...';
		};

		editorUi.actions.put('exportVsdx', exportVsdxAction);

		if (isLocalStorage && localStorage != null && urlParams['embed'] != '1')

// === From Menus.js (menu item insertion) ===

			if (editorUi.vsdxExportEnabled() && !mxClient.IS_IE &&
				(typeof(VsdxExport) !== 'undefined' || !editorUi.isOffline()))
			{
				this.addMenuItems(menu, ['exportVsdx'], parent);
			}

			this.addMenuItems(menu, ['-', 'exportHtml', 'exportXml', 'exportUrl'], parent);
