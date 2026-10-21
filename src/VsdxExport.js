/**
 * Export mxFile as Vsdx file
 */
function VsdxExport(editorUi)
{
	var that = this;
	
	var vsdxCanvas = new mxVsdxCanvas2D();
	
	var idsMap = {};
	var idsCounter = 1;

	/**
	 * Fill the required files in vsdx format which are constants in our exporter
	 * @param zip JSZip of vsdx file
	 * @param pageCount The number of pages in the mxFile
	 */
	function createVsdxSkeleton(zip, pageCount)
	{
		var files = {
			"[Content_Types].xml": "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns='http://schemas.openxmlformats.org/package/2006/content-types'><Default Extension='png' ContentType='image/png'/><Default Extension='jpg' ContentType='image/jpeg'/><Default Extension='jpeg' ContentType='image/jpeg'/><Default Extension='svg' ContentType='image/svg+xml'/><Default Extension='bmp' ContentType='image/bmp'/><Default Extension='gif' ContentType='image/gif'/><Default Extension='emf' ContentType='image/x-emf' /><Default Extension='rels' ContentType='application/vnd.openxmlformats-package.relationships+xml' /><Default Extension='xml' ContentType='application/xml' /><Override PartName='/docProps/app.xml' ContentType='application/vnd.openxmlformats-officedocument.extended-properties+xml' /><Override PartName='/docProps/core.xml' ContentType='application/vnd.openxmlformats-package.core-properties+xml' /><Override PartName='/docProps/custom.xml' ContentType='application/vnd.openxmlformats-officedocument.custom-properties+xml' /><Override PartName='/visio/document.xml' ContentType='application/vnd.ms-visio.drawing.main+xml' /><Override PartName='/visio/masters/masters.xml' ContentType='application/vnd.ms-visio.masters+xml' /><Override PartName='/visio/masters/master1.xml' ContentType='application/vnd.ms-visio.master+xml'/><Override PartName='/visio/pages/page1.xml' ContentType='application/vnd.ms-visio.page+xml' /><Override PartName='/visio/pages/pages.xml' ContentType='application/vnd.ms-visio.pages+xml' /><Override PartName='/visio/windows.xml' ContentType='application/vnd.ms-visio.windows+xml' /></Types>",
			"_rels/.rels" : "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'><Relationship Id='rId1' Type='http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties' Target='docProps/core.xml' /><Relationship Id='rId2' Type='http://schemas.microsoft.com/visio/2010/relationships/document' Target='visio/document.xml' /><Relationship Id='rId3' Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties' Target='docProps/custom.xml' /><Relationship Id='rId4' Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties' Target='docProps/app.xml' /></Relationships>",
			"docProps/app.xml" :  "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Properties xmlns='http://schemas.openxmlformats.org/officeDocument/2006/extended-properties' xmlns:vt='http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes'><Application>Microsoft Visio</Application><AppVersion>15.0000</AppVersion><Template /><Manager /><Company /><HyperlinkBase /></Properties>",
			"docProps/core.xml" : "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><cp:coreProperties xmlns:cp='http://schemas.openxmlformats.org/package/2006/metadata/core-properties' xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:dcterms='http://purl.org/dc/terms/' xmlns:dcmitype='http://purl.org/dc/dcmitype/' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'><dc:title /><dc:subject /><dc:creator /><cp:keywords /><dc:description /><cp:category /><dc:language>en-US</dc:language></cp:coreProperties>",
			"docProps/custom.xml" : "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Properties xmlns='http://schemas.openxmlformats.org/officeDocument/2006/custom-properties' xmlns:vt='http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes' />",
			"visio/document.xml": "<?xml version='1.0' encoding='utf-8' ?><VisioDocument xmlns='http://schemas.microsoft.com/office/visio/2012/main' xmlns:r='http://schemas.openxmlformats.org/officeDocument/2006/relationships' xml:space='preserve'><DocumentSettings TopPage='0' DefaultTextStyle='3' DefaultLineStyle='3' DefaultFillStyle='3' DefaultGuideStyle='4'><GlueSettings>9</GlueSettings><SnapSettings>65847</SnapSettings><SnapExtensions>34</SnapExtensions><SnapAngles/><DynamicGridEnabled>1</DynamicGridEnabled><ProtectStyles>0</ProtectStyles><ProtectShapes>0</ProtectShapes><ProtectMasters>0</ProtectMasters><ProtectBkgnds>0</ProtectBkgnds></DocumentSettings><Colors><ColorEntry IX='24' RGB='#000000'/><ColorEntry IX='25' RGB='#FFFFFF'/><ColorEntry IX='26' RGB='#FF0000'/><ColorEntry IX='27' RGB='#00FF00'/><ColorEntry IX='28' RGB='#0000FF'/><ColorEntry IX='30' RGB='#FF00FF'/><ColorEntry IX='31' RGB='#00FFFF'/><ColorEntry IX='32' RGB='#800000'/><ColorEntry IX='33' RGB='#008000'/><ColorEntry IX='34' RGB='#000080'/><ColorEntry IX='35' RGB='#808000'/><ColorEntry IX='36' RGB='#800080'/><ColorEntry IX='37' RGB='#008080'/><ColorEntry IX='38' RGB='#C0C0C0'/><ColorEntry IX='39' RGB='#E6E6E6'/><ColorEntry IX='40' RGB='#CDCDCD'/><ColorEntry IX='41' RGB='#B3B3B3'/><ColorEntry IX='42' RGB='#9A9A9A'/><ColorEntry IX='43' RGB='#808080'/><ColorEntry IX='44' RGB='#666666'/><ColorEntry IX='45' RGB='#4D4D4D'/><ColorEntry IX='46' RGB='#333333'/><ColorEntry IX='47' RGB='#1A1A1A'/><ColorEntry IX='48' RGB='#7F7F7F'/><ColorEntry IX='49' RGB='#99004D'/><ColorEntry IX='50' RGB='#FF0080'/><ColorEntry IX='51' RGB='#CC0066'/></Colors><FaceNames><FaceName NameU='Calibri' UnicodeRanges='-536859905 -1073732485 9 0' CharSets='536871423 0' Panose='2 15 5 2 2 2 4 3 2 4' Flags='325'/></FaceNames><StyleSheets><StyleSheet ID='0' NameU='No Style' IsCustomNameU='1' Name='No Style' IsCustomName='1'><Cell N='EnableLineProps' V='1'/><Cell N='EnableFillProps' V='1'/><Cell N='EnableTextProps' V='1'/><Cell N='HideForApply' V='0'/><Cell N='LineWeight' V='0.01041666666666667'/><Cell N='LineColor' V='0'/><Cell N='LinePattern' V='1'/><Cell N='Rounding' V='0'/><Cell N='EndArrowSize' V='2'/><Cell N='BeginArrow' V='0'/><Cell N='EndArrow' V='0'/><Cell N='LineCap' V='0'/><Cell N='BeginArrowSize' V='2'/><Cell N='LineColorTrans' V='0'/><Cell N='CompoundType' V='0'/><Cell N='FillForegnd' V='1'/><Cell N='FillBkgnd' V='0'/><Cell N='FillPattern' V='1'/><Cell N='ShdwForegnd' V='0'/><Cell N='ShdwPattern' V='0'/><Cell N='FillForegndTrans' V='0'/><Cell N='FillBkgndTrans' V='0'/><Cell N='ShdwForegndTrans' V='0'/><Cell N='ShapeShdwType' V='0'/><Cell N='ShapeShdwOffsetX' V='0'/><Cell N='ShapeShdwOffsetY' V='0'/><Cell N='ShapeShdwObliqueAngle' V='0'/><Cell N='ShapeShdwScaleFactor' V='1'/><Cell N='ShapeShdwBlur' V='0'/><Cell N='ShapeShdwShow' V='0'/><Cell N='LeftMargin' V='0'/><Cell N='RightMargin' V='0'/><Cell N='TopMargin' V='0'/><Cell N='BottomMargin' V='0'/><Cell N='VerticalAlign' V='1'/><Cell N='TextBkgnd' V='0'/><Cell N='DefaultTabStop' V='0.5'/><Cell N='TextDirection' V='0'/><Cell N='TextBkgndTrans' V='0'/><Cell N='LockWidth' V='0'/><Cell N='LockHeight' V='0'/><Cell N='LockMoveX' V='0'/><Cell N='LockMoveY' V='0'/><Cell N='LockAspect' V='0'/><Cell N='LockDelete' V='0'/><Cell N='LockBegin' V='0'/><Cell N='LockEnd' V='0'/><Cell N='LockRotate' V='0'/><Cell N='LockCrop' V='0'/><Cell N='LockVtxEdit' V='0'/><Cell N='LockTextEdit' V='0'/><Cell N='LockFormat' V='0'/><Cell N='LockGroup' V='0'/><Cell N='LockCalcWH' V='0'/><Cell N='LockSelect' V='0'/><Cell N='LockCustProp' V='0'/><Cell N='LockFromGroupFormat' V='0'/><Cell N='LockThemeColors' V='0'/><Cell N='LockThemeEffects' V='0'/><Cell N='LockThemeConnectors' V='0'/><Cell N='LockThemeFonts' V='0'/><Cell N='LockThemeIndex' V='0'/><Cell N='LockReplace' V='0'/><Cell N='LockVariation' V='0'/><Cell N='NoObjHandles' V='0'/><Cell N='NonPrinting' V='0'/><Cell N='NoCtlHandles' V='0'/><Cell N='NoAlignBox' V='0'/><Cell N='UpdateAlignBox' V='0'/><Cell N='HideText' V='0'/><Cell N='DynFeedback' V='0'/><Cell N='GlueType' V='0'/><Cell N='WalkPreference' V='0'/><Cell N='BegTrigger' V='0' F='No Formula'/><Cell N='EndTrigger' V='0' F='No Formula'/><Cell N='ObjType' V='0'/><Cell N='Comment' V=''/><Cell N='IsDropSource' V='0'/><Cell N='NoLiveDynamics' V='0'/><Cell N='LocalizeMerge' V='0'/><Cell N='NoProofing' V='0'/><Cell N='Calendar' V='0'/><Cell N='LangID' V='en-US'/><Cell N='ShapeKeywords' V=''/><Cell N='DropOnPageScale' V='1'/><Cell N='TheData' V='0' F='No Formula'/><Cell N='TheText' V='0' F='No Formula'/><Cell N='EventDblClick' V='0' F='No Formula'/><Cell N='EventXFMod' V='0' F='No Formula'/><Cell N='EventDrop' V='0' F='No Formula'/><Cell N='EventMultiDrop' V='0' F='No Formula'/><Cell N='HelpTopic' V=''/><Cell N='Copyright' V=''/><Cell N='LayerMember' V=''/><Cell N='XRulerDensity' V='32'/><Cell N='YRulerDensity' V='32'/><Cell N='XRulerOrigin' V='0'/><Cell N='YRulerOrigin' V='0'/><Cell N='XGridDensity' V='8'/><Cell N='YGridDensity' V='8'/><Cell N='XGridSpacing' V='0'/><Cell N='YGridSpacing' V='0'/><Cell N='XGridOrigin' V='0'/><Cell N='YGridOrigin' V='0'/><Cell N='Gamma' V='1'/><Cell N='Contrast' V='0.5'/><Cell N='Brightness' V='0.5'/><Cell N='Sharpen' V='0'/><Cell N='Blur' V='0'/><Cell N='Denoise' V='0'/><Cell N='Transparency' V='0'/><Cell N='SelectMode' V='1'/><Cell N='DisplayMode' V='2'/><Cell N='IsDropTarget' V='0'/><Cell N='IsSnapTarget' V='1'/><Cell N='IsTextEditTarget' V='1'/><Cell N='DontMoveChildren' V='0'/><Cell N='ShapePermeableX' V='0'/><Cell N='ShapePermeableY' V='0'/><Cell N='ShapePermeablePlace' V='0'/><Cell N='Relationships' V='0'/><Cell N='ShapeFixedCode' V='0'/><Cell N='ShapePlowCode' V='0'/><Cell N='ShapeRouteStyle' V='0'/><Cell N='ShapePlaceStyle' V='0'/><Cell N='ConFixedCode' V='0'/><Cell N='ConLineJumpCode' V='0'/><Cell N='ConLineJumpStyle' V='0'/><Cell N='ConLineJumpDirX' V='0'/><Cell N='ConLineJumpDirY' V='0'/><Cell N='ShapePlaceFlip' V='0'/><Cell N='ConLineRouteExt' V='0'/><Cell N='ShapeSplit' V='0'/><Cell N='ShapeSplittable' V='0'/><Cell N='DisplayLevel' V='0'/><Cell N='ResizePage' V='0'/><Cell N='EnableGrid' V='0'/><Cell N='DynamicsOff' V='0'/><Cell N='CtrlAsInput' V='0'/><Cell N='AvoidPageBreaks' V='0'/><Cell N='PlaceStyle' V='0'/><Cell N='RouteStyle' V='0'/><Cell N='PlaceDepth' V='0'/><Cell N='PlowCode' V='0'/><Cell N='LineJumpCode' V='1'/><Cell N='LineJumpStyle' V='0'/><Cell N='PageLineJumpDirX' V='0'/><Cell N='PageLineJumpDirY' V='0'/><Cell N='LineToNodeX' V='0.125'/><Cell N='LineToNodeY' V='0.125'/><Cell N='BlockSizeX' V='0.25'/><Cell N='BlockSizeY' V='0.25'/><Cell N='AvenueSizeX' V='0.375'/><Cell N='AvenueSizeY' V='0.375'/><Cell N='LineToLineX' V='0.125'/><Cell N='LineToLineY' V='0.125'/><Cell N='LineJumpFactorX' V='0.66666666666667'/><Cell N='LineJumpFactorY' V='0.66666666666667'/><Cell N='LineAdjustFrom' V='0'/><Cell N='LineAdjustTo' V='0'/><Cell N='PlaceFlip' V='0'/><Cell N='LineRouteExt' V='0'/><Cell N='PageShapeSplit' V='0'/><Cell N='PageLeftMargin' V='0.25'/><Cell N='PageRightMargin' V='0.25'/><Cell N='PageTopMargin' V='0.25'/><Cell N='PageBottomMargin' V='0.25'/><Cell N='ScaleX' V='1'/><Cell N='ScaleY' V='1'/><Cell N='PagesX' V='1'/><Cell N='PagesY' V='1'/><Cell N='CenterX' V='0'/><Cell N='CenterY' V='0'/><Cell N='OnPage' V='0'/><Cell N='PrintGrid' V='0'/><Cell N='PrintPageOrientation' V='1'/><Cell N='PaperKind' V='1'/><Cell N='PaperSource' V='7'/><Cell N='QuickStyleLineColor' V='100'/><Cell N='QuickStyleFillColor' V='100'/><Cell N='QuickStyleShadowColor' V='100'/><Cell N='QuickStyleFontColor' V='100'/><Cell N='QuickStyleLineMatrix' V='100'/><Cell N='QuickStyleFillMatrix' V='100'/><Cell N='QuickStyleEffectsMatrix' V='100'/><Cell N='QuickStyleFontMatrix' V='100'/><Cell N='QuickStyleType' V='0'/><Cell N='QuickStyleVariation' V='0'/><Cell N='LineGradientDir' V='0'/><Cell N='LineGradientAngle' V='1.5707963267949'/><Cell N='FillGradientDir' V='0'/><Cell N='FillGradientAngle' V='1.5707963267949'/><Cell N='LineGradientEnabled' V='0'/><Cell N='FillGradientEnabled' V='0'/><Cell N='RotateGradientWithShape' V='1'/><Cell N='UseGroupGradient' V='0'/><Cell N='BevelTopType' V='0'/><Cell N='BevelTopWidth' V='0'/><Cell N='BevelTopHeight' V='0'/><Cell N='BevelBottomType' V='0'/><Cell N='BevelBottomWidth' V='0'/><Cell N='BevelBottomHeight' V='0'/><Cell N='BevelDepthColor' V='1'/><Cell N='BevelDepthSize' V='0'/><Cell N='BevelContourColor' V='0'/><Cell N='BevelContourSize' V='0'/><Cell N='BevelMaterialType' V='0'/><Cell N='BevelLightingType' V='0'/><Cell N='BevelLightingAngle' V='0'/><Cell N='RotationXAngle' V='0'/><Cell N='RotationYAngle' V='0'/><Cell N='RotationZAngle' V='0'/><Cell N='RotationType' V='0'/><Cell N='Perspective' V='0'/><Cell N='DistanceFromGround' V='0'/><Cell N='KeepTextFlat' V='0'/><Cell N='ReflectionTrans' V='0'/><Cell N='ReflectionSize' V='0'/><Cell N='ReflectionDist' V='0'/><Cell N='ReflectionBlur' V='0'/><Cell N='GlowColor' V='1'/><Cell N='GlowColorTrans' V='0'/><Cell N='GlowSize' V='0'/><Cell N='SoftEdgesSize' V='0'/><Cell N='SketchSeed' V='0'/><Cell N='SketchEnabled' V='0'/><Cell N='SketchAmount' V='5'/><Cell N='SketchLineWeight' V='0.04166666666666666' U='PT'/><Cell N='SketchLineChange' V='0.14'/><Cell N='SketchFillChange' V='0.1'/><Cell N='ColorSchemeIndex' V='0'/><Cell N='EffectSchemeIndex' V='0'/><Cell N='ConnectorSchemeIndex' V='0'/><Cell N='FontSchemeIndex' V='0'/><Cell N='ThemeIndex' V='0'/><Cell N='VariationColorIndex' V='0'/><Cell N='VariationStyleIndex' V='0'/><Cell N='EmbellishmentIndex' V='0'/><Cell N='ReplaceLockShapeData' V='0'/><Cell N='ReplaceLockText' V='0'/><Cell N='ReplaceLockFormat' V='0'/><Cell N='ReplaceCopyCells' V='0' U='BOOL' F='No Formula'/><Cell N='PageWidth' V='0' F='No Formula'/><Cell N='PageHeight' V='0' F='No Formula'/><Cell N='ShdwOffsetX' V='0' F='No Formula'/><Cell N='ShdwOffsetY' V='0' F='No Formula'/><Cell N='PageScale' V='0' U='IN_F' F='No Formula'/><Cell N='DrawingScale' V='0' U='IN_F' F='No Formula'/><Cell N='DrawingSizeType' V='0' F='No Formula'/><Cell N='DrawingScaleType' V='0' F='No Formula'/><Cell N='InhibitSnap' V='0' F='No Formula'/><Cell N='PageLockReplace' V='0' U='BOOL' F='No Formula'/><Cell N='PageLockDuplicate' V='0' U='BOOL' F='No Formula'/><Cell N='UIVisibility' V='0' F='No Formula'/><Cell N='ShdwType' V='0' F='No Formula'/><Cell N='ShdwObliqueAngle' V='0' F='No Formula'/><Cell N='ShdwScaleFactor' V='0' F='No Formula'/><Cell N='DrawingResizeType' V='0' F='No Formula'/><Section N='Character'><Row IX='0'><Cell N='Font' V='Calibri'/><Cell N='Color' V='0'/><Cell N='Style' V='0'/><Cell N='Case' V='0'/><Cell N='Pos' V='0'/><Cell N='FontScale' V='1'/><Cell N='Size' V='0.1666666666666667'/><Cell N='DblUnderline' V='0'/><Cell N='Overline' V='0'/><Cell N='Strikethru' V='0'/><Cell N='DoubleStrikethrough' V='0'/><Cell N='Letterspace' V='0'/><Cell N='ColorTrans' V='0'/><Cell N='AsianFont' V='0'/><Cell N='ComplexScriptFont' V='0'/><Cell N='ComplexScriptSize' V='-1'/><Cell N='LangID' V='en-US'/></Row></Section><Section N='Paragraph'><Row IX='0'><Cell N='IndFirst' V='0'/><Cell N='IndLeft' V='0'/><Cell N='IndRight' V='0'/><Cell N='SpLine' V='-1.2'/><Cell N='SpBefore' V='0'/><Cell N='SpAfter' V='0'/><Cell N='HorzAlign' V='1'/><Cell N='Bullet' V='0'/><Cell N='BulletStr' V=''/><Cell N='BulletFont' V='0'/><Cell N='BulletFontSize' V='-1'/><Cell N='TextPosAfterBullet' V='0'/><Cell N='Flags' V='0'/></Row></Section><Section N='Tabs'><Row IX='0'/></Section><Section N='LineGradient'><Row IX='0'><Cell N='GradientStopColor' V='1'/><Cell N='GradientStopColorTrans' V='0'/><Cell N='GradientStopPosition' V='0'/></Row></Section><Section N='FillGradient'><Row IX='0'><Cell N='GradientStopColor' V='1'/><Cell N='GradientStopColorTrans' V='0'/><Cell N='GradientStopPosition' V='0'/></Row></Section></StyleSheet><StyleSheet ID='1' NameU='Text Only' IsCustomNameU='1' Name='Text Only' IsCustomName='1' LineStyle='3' FillStyle='3' TextStyle='3'><Cell N='EnableLineProps' V='1'/><Cell N='EnableFillProps' V='1'/><Cell N='EnableTextProps' V='1'/><Cell N='HideForApply' V='0'/><Cell N='LineWeight' V='Themed' F='Inh'/><Cell N='LineColor' V='Themed' F='Inh'/><Cell N='LinePattern' V='Themed' F='Inh'/><Cell N='Rounding' V='Themed' F='Inh'/><Cell N='EndArrowSize' V='2' F='Inh'/><Cell N='BeginArrow' V='0' F='Inh'/><Cell N='EndArrow' V='0' F='Inh'/><Cell N='LineCap' V='Themed' F='Inh'/><Cell N='BeginArrowSize' V='2' F='Inh'/><Cell N='LineColorTrans' V='Themed' F='Inh'/><Cell N='CompoundType' V='Themed' F='Inh'/><Cell N='FillForegnd' V='Themed' F='Inh'/><Cell N='FillBkgnd' V='Themed' F='Inh'/><Cell N='FillPattern' V='Themed' F='Inh'/><Cell N='ShdwForegnd' V='Themed' F='Inh'/><Cell N='ShdwPattern' V='Themed' F='Inh'/><Cell N='FillForegndTrans' V='Themed' F='Inh'/><Cell N='FillBkgndTrans' V='Themed' F='Inh'/><Cell N='ShdwForegndTrans' V='Themed' F='Inh'/><Cell N='ShapeShdwType' V='Themed' F='Inh'/><Cell N='ShapeShdwOffsetX' V='Themed' F='Inh'/><Cell N='ShapeShdwOffsetY' V='Themed' F='Inh'/><Cell N='ShapeShdwObliqueAngle' V='Themed' F='Inh'/><Cell N='ShapeShdwScaleFactor' V='Themed' F='Inh'/><Cell N='ShapeShdwBlur' V='Themed' F='Inh'/><Cell N='ShapeShdwShow' V='0' F='Inh'/><Cell N='LeftMargin' V='0'/><Cell N='RightMargin' V='0'/><Cell N='TopMargin' V='0'/><Cell N='BottomMargin' V='0'/><Cell N='VerticalAlign' V='0'/><Cell N='TextBkgnd' V='0'/><Cell N='DefaultTabStop' V='0.5' F='Inh'/><Cell N='TextDirection' V='0' F='Inh'/><Cell N='TextBkgndTrans' V='0' F='Inh'/><Cell N='LineGradientDir' V='Themed' F='Inh'/><Cell N='LineGradientAngle' V='Themed' F='Inh'/><Cell N='FillGradientDir' V='Themed' F='Inh'/><Cell N='FillGradientAngle' V='Themed' F='Inh'/><Cell N='LineGradientEnabled' V='Themed' F='Inh'/><Cell N='FillGradientEnabled' V='Themed' F='Inh'/><Cell N='RotateGradientWithShape' V='Themed' F='Inh'/><Cell N='UseGroupGradient' V='Themed' F='Inh'/><Section N='Paragraph'><Row IX='0'><Cell N='IndFirst' V='0' F='Inh'/><Cell N='IndLeft' V='0' F='Inh'/><Cell N='IndRight' V='0' F='Inh'/><Cell N='SpLine' V='-1.2' F='Inh'/><Cell N='SpBefore' V='0' F='Inh'/><Cell N='SpAfter' V='0' F='Inh'/><Cell N='HorzAlign' V='0'/><Cell N='Bullet' V='0' F='Inh'/><Cell N='BulletStr' V='' F='Inh'/><Cell N='BulletFont' V='0' F='Inh'/><Cell N='BulletFontSize' V='-1' F='Inh'/><Cell N='TextPosAfterBullet' V='0' F='Inh'/><Cell N='Flags' V='0' F='Inh'/></Row></Section></StyleSheet><StyleSheet ID='2' NameU='None' IsCustomNameU='1' Name='None' IsCustomName='1' LineStyle='3' FillStyle='3' TextStyle='3'><Cell N='EnableLineProps' V='1'/><Cell N='EnableFillProps' V='1'/><Cell N='EnableTextProps' V='1'/><Cell N='HideForApply' V='0'/><Cell N='LineWeight' V='Themed' F='Inh'/><Cell N='LineColor' V='Themed' F='Inh'/><Cell N='LinePattern' V='0'/><Cell N='Rounding' V='Themed' F='Inh'/><Cell N='EndArrowSize' V='2' F='Inh'/><Cell N='BeginArrow' V='0' F='Inh'/><Cell N='EndArrow' V='0' F='Inh'/><Cell N='LineCap' V='Themed' F='Inh'/><Cell N='BeginArrowSize' V='2' F='Inh'/><Cell N='LineColorTrans' V='Themed' F='Inh'/><Cell N='CompoundType' V='Themed' F='Inh'/><Cell N='FillForegnd' V='Themed' F='Inh'/><Cell N='FillBkgnd' V='Themed' F='Inh'/><Cell N='FillPattern' V='0'/><Cell N='ShdwForegnd' V='Themed' F='Inh'/><Cell N='ShdwPattern' V='Themed' F='Inh'/><Cell N='FillForegndTrans' V='Themed' F='Inh'/><Cell N='FillBkgndTrans' V='Themed' F='Inh'/><Cell N='ShdwForegndTrans' V='Themed' F='Inh'/><Cell N='ShapeShdwType' V='Themed' F='Inh'/><Cell N='ShapeShdwOffsetX' V='Themed' F='Inh'/><Cell N='ShapeShdwOffsetY' V='Themed' F='Inh'/><Cell N='ShapeShdwObliqueAngle' V='Themed' F='Inh'/><Cell N='ShapeShdwScaleFactor' V='Themed' F='Inh'/><Cell N='ShapeShdwBlur' V='Themed' F='Inh'/><Cell N='ShapeShdwShow' V='0' F='Inh'/><Cell N='LineGradientDir' V='Themed' F='Inh'/><Cell N='LineGradientAngle' V='Themed' F='Inh'/><Cell N='FillGradientDir' V='Themed' F='Inh'/><Cell N='FillGradientAngle' V='Themed' F='Inh'/><Cell N='LineGradientEnabled' V='0'/><Cell N='FillGradientEnabled' V='0'/><Cell N='RotateGradientWithShape' V='Themed' F='Inh'/><Cell N='UseGroupGradient' V='Themed' F='Inh'/><Cell N='QuickStyleLineColor' V='100' F='Inh'/><Cell N='QuickStyleFillColor' V='100' F='Inh'/><Cell N='QuickStyleShadowColor' V='100' F='Inh'/><Cell N='QuickStyleFontColor' V='100' F='Inh'/><Cell N='QuickStyleLineMatrix' V='100' F='Inh'/><Cell N='QuickStyleFillMatrix' V='100' F='Inh'/><Cell N='QuickStyleEffectsMatrix' V='0' F='GUARD(0)'/><Cell N='QuickStyleFontMatrix' V='100' F='Inh'/><Cell N='QuickStyleType' V='0' F='Inh'/><Cell N='QuickStyleVariation' V='2'/></StyleSheet><StyleSheet ID='3' NameU='Normal' IsCustomNameU='1' Name='Normal' IsCustomName='1' LineStyle='6' FillStyle='6' TextStyle='6'><Cell N='EnableLineProps' V='1'/><Cell N='EnableFillProps' V='1'/><Cell N='EnableTextProps' V='1'/><Cell N='HideForApply' V='0'/><Cell N='LeftMargin' V='0.05555555555555555' U='PT'/><Cell N='RightMargin' V='0.05555555555555555' U='PT'/><Cell N='TopMargin' V='0.05555555555555555' U='PT'/><Cell N='BottomMargin' V='0.05555555555555555' U='PT'/><Cell N='VerticalAlign' V='1' F='Inh'/><Cell N='TextBkgnd' V='0' F='Inh'/><Cell N='DefaultTabStop' V='0.5' F='Inh'/><Cell N='TextDirection' V='0' F='Inh'/><Cell N='TextBkgndTrans' V='0' F='Inh'/></StyleSheet><StyleSheet ID='4' NameU='Guide' IsCustomNameU='1' Name='Guide' IsCustomName='1' LineStyle='3' FillStyle='3' TextStyle='3'><Cell N='EnableLineProps' V='1'/><Cell N='EnableFillProps' V='1'/><Cell N='EnableTextProps' V='1'/><Cell N='HideForApply' V='0'/><Cell N='LineWeight' V='0' U='PT'/><Cell N='LineColor' V='#7f7f7f'/><Cell N='LinePattern' V='23'/><Cell N='Rounding' V='Themed' F='Inh'/><Cell N='EndArrowSize' V='2' F='Inh'/><Cell N='BeginArrow' V='0' F='Inh'/><Cell N='EndArrow' V='0' F='Inh'/><Cell N='LineCap' V='Themed' F='Inh'/><Cell N='BeginArrowSize' V='2' F='Inh'/><Cell N='LineColorTrans' V='Themed' F='Inh'/><Cell N='CompoundType' V='Themed' F='Inh'/><Cell N='FillForegnd' V='Themed' F='Inh'/><Cell N='FillBkgnd' V='Themed' F='Inh'/><Cell N='FillPattern' V='0'/><Cell N='ShdwForegnd' V='Themed' F='Inh'/><Cell N='ShdwPattern' V='Themed' F='Inh'/><Cell N='FillForegndTrans' V='Themed' F='Inh'/><Cell N='FillBkgndTrans' V='Themed' F='Inh'/><Cell N='ShdwForegndTrans' V='Themed' F='Inh'/><Cell N='ShapeShdwType' V='Themed' F='Inh'/><Cell N='ShapeShdwOffsetX' V='Themed' F='Inh'/><Cell N='ShapeShdwOffsetY' V='Themed' F='Inh'/><Cell N='ShapeShdwObliqueAngle' V='Themed' F='Inh'/><Cell N='ShapeShdwScaleFactor' V='Themed' F='Inh'/><Cell N='ShapeShdwBlur' V='Themed' F='Inh'/><Cell N='ShapeShdwShow' V='0' F='Inh'/><Cell N='LineGradientDir' V='Themed' F='Inh'/><Cell N='LineGradientAngle' V='Themed' F='Inh'/><Cell N='FillGradientDir' V='Themed' F='Inh'/><Cell N='FillGradientAngle' V='Themed' F='Inh'/><Cell N='LineGradientEnabled' V='0'/><Cell N='FillGradientEnabled' V='0'/><Cell N='RotateGradientWithShape' V='Themed' F='Inh'/><Cell N='UseGroupGradient' V='Themed' F='Inh'/><Cell N='LeftMargin' V='0.05555555555555555' U='PT' F='Inh'/><Cell N='RightMargin' V='0.05555555555555555' U='PT' F='Inh'/><Cell N='TopMargin' V='0'/><Cell N='BottomMargin' V='0'/><Cell N='VerticalAlign' V='2'/><Cell N='TextBkgnd' V='0' F='Inh'/><Cell N='DefaultTabStop' V='0.5' F='Inh'/><Cell N='TextDirection' V='0' F='Inh'/><Cell N='TextBkgndTrans' V='0' F='Inh'/><Cell N='NoObjHandles' V='0' F='Inh'/><Cell N='NonPrinting' V='1'/><Cell N='NoCtlHandles' V='0' F='Inh'/><Cell N='NoAlignBox' V='0' F='Inh'/><Cell N='UpdateAlignBox' V='0' F='Inh'/><Cell N='HideText' V='0' F='Inh'/><Cell N='DynFeedback' V='0' F='Inh'/><Cell N='GlueType' V='0' F='Inh'/><Cell N='WalkPreference' V='0' F='Inh'/><Cell N='BegTrigger' V='0' F='No Formula'/><Cell N='EndTrigger' V='0' F='No Formula'/><Cell N='ObjType' V='0' F='Inh'/><Cell N='Comment' V='' F='Inh'/><Cell N='IsDropSource' V='0' F='Inh'/><Cell N='NoLiveDynamics' V='0' F='Inh'/><Cell N='LocalizeMerge' V='0' F='Inh'/><Cell N='NoProofing' V='0' F='Inh'/><Cell N='Calendar' V='0' F='Inh'/><Cell N='LangID' V='en-US' F='Inh'/><Cell N='ShapeKeywords' V='' F='Inh'/><Cell N='DropOnPageScale' V='1' F='Inh'/><Cell N='ShapePermeableX' V='1'/><Cell N='ShapePermeableY' V='1'/><Cell N='ShapePermeablePlace' V='1'/><Cell N='Relationships' V='0' F='Inh'/><Cell N='ShapeFixedCode' V='0' F='Inh'/><Cell N='ShapePlowCode' V='0' F='Inh'/><Cell N='ShapeRouteStyle' V='0' F='Inh'/><Cell N='ShapePlaceStyle' V='0' F='Inh'/><Cell N='ConFixedCode' V='0' F='Inh'/><Cell N='ConLineJumpCode' V='0' F='Inh'/><Cell N='ConLineJumpStyle' V='0' F='Inh'/><Cell N='ConLineJumpDirX' V='0' F='Inh'/><Cell N='ConLineJumpDirY' V='0' F='Inh'/><Cell N='ShapePlaceFlip' V='0' F='Inh'/><Cell N='ConLineRouteExt' V='0' F='Inh'/><Cell N='ShapeSplit' V='0' F='Inh'/><Cell N='ShapeSplittable' V='0' F='Inh'/><Cell N='DisplayLevel' V='0' F='Inh'/><Section N='Character'><Row IX='0'><Cell N='Font' V='Themed' F='Inh'/><Cell N='Color' V='4'/><Cell N='Style' V='Themed' F='Inh'/><Cell N='Case' V='0' F='Inh'/><Cell N='Pos' V='0' F='Inh'/><Cell N='FontScale' V='1' F='Inh'/><Cell N='Size' V='0.125'/><Cell N='DblUnderline' V='0' F='Inh'/><Cell N='Overline' V='0' F='Inh'/><Cell N='Strikethru' V='0' F='Inh'/><Cell N='DoubleStrikethrough' V='0' F='Inh'/><Cell N='Letterspace' V='0' F='Inh'/><Cell N='ColorTrans' V='0' F='Inh'/><Cell N='AsianFont' V='Themed' F='Inh'/><Cell N='ComplexScriptFont' V='Themed' F='Inh'/><Cell N='ComplexScriptSize' V='-1' F='Inh'/><Cell N='LangID' V='en-US' F='Inh'/></Row></Section></StyleSheet><StyleSheet ID='6' NameU='Theme' IsCustomNameU='1' Name='Theme' IsCustomName='1' LineStyle='0' FillStyle='0' TextStyle='0'><Cell N='EnableLineProps' V='1'/><Cell N='EnableFillProps' V='1'/><Cell N='EnableTextProps' V='1'/><Cell N='HideForApply' V='0'/><Cell N='LineWeight' V='Themed' F='THEMEVAL()'/><Cell N='LineColor' V='Themed' F='THEMEVAL()'/><Cell N='LinePattern' V='Themed' F='THEMEVAL()'/><Cell N='Rounding' V='Themed' F='THEMEVAL()'/><Cell N='EndArrowSize' V='2' F='Inh'/><Cell N='BeginArrow' V='0' F='Inh'/><Cell N='EndArrow' V='0' F='Inh'/><Cell N='LineCap' V='Themed' F='THEMEVAL()'/><Cell N='BeginArrowSize' V='2' F='Inh'/><Cell N='LineColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='CompoundType' V='Themed' F='THEMEVAL()'/><Cell N='FillForegnd' V='Themed' F='THEMEVAL()'/><Cell N='FillBkgnd' V='Themed' F='THEMEVAL()'/><Cell N='FillPattern' V='Themed' F='THEMEVAL()'/><Cell N='ShdwForegnd' V='Themed' F='THEMEVAL()'/><Cell N='ShdwPattern' V='Themed' F='THEMEVAL()'/><Cell N='FillForegndTrans' V='Themed' F='THEMEVAL()'/><Cell N='FillBkgndTrans' V='Themed' F='THEMEVAL()'/><Cell N='ShdwForegndTrans' V='Themed' F='THEMEVAL()'/><Cell N='ShapeShdwType' V='Themed' F='THEMEVAL()'/><Cell N='ShapeShdwOffsetX' V='Themed' F='THEMEVAL()'/><Cell N='ShapeShdwOffsetY' V='Themed' F='THEMEVAL()'/><Cell N='ShapeShdwObliqueAngle' V='Themed' F='THEMEVAL()'/><Cell N='ShapeShdwScaleFactor' V='Themed' F='THEMEVAL()'/><Cell N='ShapeShdwBlur' V='Themed' F='THEMEVAL()'/><Cell N='ShapeShdwShow' V='0' F='Inh'/><Cell N='LineGradientDir' V='Themed' F='THEMEVAL()'/><Cell N='LineGradientAngle' V='Themed' F='THEMEVAL()'/><Cell N='FillGradientDir' V='Themed' F='THEMEVAL()'/><Cell N='FillGradientAngle' V='Themed' F='THEMEVAL()'/><Cell N='LineGradientEnabled' V='Themed' F='THEMEVAL()'/><Cell N='FillGradientEnabled' V='Themed' F='THEMEVAL()'/><Cell N='RotateGradientWithShape' V='Themed' F='THEMEVAL()'/><Cell N='UseGroupGradient' V='Themed' F='THEMEVAL()'/><Cell N='BevelTopType' V='Themed' F='THEMEVAL()'/><Cell N='BevelTopWidth' V='Themed' F='THEMEVAL()'/><Cell N='BevelTopHeight' V='Themed' F='THEMEVAL()'/><Cell N='BevelBottomType' V='0' F='Inh'/><Cell N='BevelBottomWidth' V='0' F='Inh'/><Cell N='BevelBottomHeight' V='0' F='Inh'/><Cell N='BevelDepthColor' V='1' F='Inh'/><Cell N='BevelDepthSize' V='0' F='Inh'/><Cell N='BevelContourColor' V='Themed' F='THEMEVAL()'/><Cell N='BevelContourSize' V='Themed' F='THEMEVAL()'/><Cell N='BevelMaterialType' V='Themed' F='THEMEVAL()'/><Cell N='BevelLightingType' V='Themed' F='THEMEVAL()'/><Cell N='BevelLightingAngle' V='Themed' F='THEMEVAL()'/><Cell N='ReflectionTrans' V='Themed' F='THEMEVAL()'/><Cell N='ReflectionSize' V='Themed' F='THEMEVAL()'/><Cell N='ReflectionDist' V='Themed' F='THEMEVAL()'/><Cell N='ReflectionBlur' V='Themed' F='THEMEVAL()'/><Cell N='GlowColor' V='Themed' F='THEMEVAL()'/><Cell N='GlowColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GlowSize' V='Themed' F='THEMEVAL()'/><Cell N='SoftEdgesSize' V='Themed' F='THEMEVAL()'/><Cell N='SketchSeed' V='0' F='Inh'/><Cell N='SketchEnabled' V='Themed' F='THEMEVAL()'/><Cell N='SketchAmount' V='Themed' F='THEMEVAL()'/><Cell N='SketchLineWeight' V='Themed' F='THEMEVAL()'/><Cell N='SketchLineChange' V='Themed' F='THEMEVAL()'/><Cell N='SketchFillChange' V='Themed' F='THEMEVAL()'/><Cell N='QuickStyleLineColor' V='100'/><Cell N='QuickStyleFillColor' V='100'/><Cell N='QuickStyleShadowColor' V='100'/><Cell N='QuickStyleFontColor' V='100'/><Cell N='QuickStyleLineMatrix' V='100'/><Cell N='QuickStyleFillMatrix' V='100'/><Cell N='QuickStyleEffectsMatrix' V='100'/><Cell N='QuickStyleFontMatrix' V='100'/><Cell N='QuickStyleType' V='0' F='Inh'/><Cell N='QuickStyleVariation' V='0' F='Inh'/><Cell N='ColorSchemeIndex' V='65534'/><Cell N='EffectSchemeIndex' V='65534'/><Cell N='ConnectorSchemeIndex' V='65534'/><Cell N='FontSchemeIndex' V='65534'/><Cell N='ThemeIndex' V='65534'/><Cell N='VariationColorIndex' V='65534'/><Cell N='VariationStyleIndex' V='65534'/><Cell N='EmbellishmentIndex' V='65534'/><Section N='Character'><Row IX='0'><Cell N='Font' V='Themed' F='THEMEVAL()'/><Cell N='Color' V='Themed' F='THEMEVAL()'/><Cell N='Style' V='Themed' F='THEMEVAL()'/><Cell N='Case' V='0' F='Inh'/><Cell N='Pos' V='0' F='Inh'/><Cell N='FontScale' V='1' F='Inh'/><Cell N='Size' V='0.1666666666666667' F='Inh'/><Cell N='DblUnderline' V='0' F='Inh'/><Cell N='Overline' V='0' F='Inh'/><Cell N='Strikethru' V='0' F='Inh'/><Cell N='DoubleStrikethrough' V='0' F='Inh'/><Cell N='Letterspace' V='0' F='Inh'/><Cell N='ColorTrans' V='0' F='Inh'/><Cell N='AsianFont' V='Themed' F='THEMEVAL()'/><Cell N='ComplexScriptFont' V='Themed' F='THEMEVAL()'/><Cell N='ComplexScriptSize' V='-1' F='Inh'/><Cell N='LangID' V='en-US' F='Inh'/></Row></Section><Section N='FillGradient'><Row IX='0'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='1'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='2'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='3'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='4'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='5'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='6'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='7'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='8'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='9'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row></Section><Section N='LineGradient'><Row IX='0'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='1'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='2'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='3'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='4'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='5'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='6'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='7'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='8'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row><Row IX='9'><Cell N='GradientStopColor' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopColorTrans' V='Themed' F='THEMEVAL()'/><Cell N='GradientStopPosition' V='Themed' F='THEMEVAL()'/></Row></Section></StyleSheet><StyleSheet ID='7' NameU='Connector' IsCustomNameU='1' Name='Connector' IsCustomName='1' LineStyle='3' FillStyle='3' TextStyle='3'><Cell N='EnableLineProps' V='1'/><Cell N='EnableFillProps' V='1'/><Cell N='EnableTextProps' V='1'/><Cell N='HideForApply' V='0'/><Cell N='LeftMargin' V='0.05555555555555555' U='PT' F='Inh'/><Cell N='RightMargin' V='0.05555555555555555' U='PT' F='Inh'/><Cell N='TopMargin' V='0.05555555555555555' U='PT' F='Inh'/><Cell N='BottomMargin' V='0.05555555555555555' U='PT' F='Inh'/><Cell N='VerticalAlign' V='1' F='Inh'/><Cell N='TextBkgnd' V='#ffffff' F='THEMEGUARD(THEMEVAL(\"BackgroundColor\")+1)'/><Cell N='DefaultTabStop' V='0.5' F='Inh'/><Cell N='TextDirection' V='0' F='Inh'/><Cell N='TextBkgndTrans' V='0' F='Inh'/><Cell N='NoObjHandles' V='0' F='Inh'/><Cell N='NonPrinting' V='0' F='Inh'/><Cell N='NoCtlHandles' V='0' F='Inh'/><Cell N='NoAlignBox' V='0' F='Inh'/><Cell N='UpdateAlignBox' V='0' F='Inh'/><Cell N='HideText' V='0' F='Inh'/><Cell N='DynFeedback' V='0' F='Inh'/><Cell N='GlueType' V='0' F='Inh'/><Cell N='WalkPreference' V='0' F='Inh'/><Cell N='BegTrigger' V='0' F='No Formula'/><Cell N='EndTrigger' V='0' F='No Formula'/><Cell N='ObjType' V='0' F='Inh'/><Cell N='Comment' V='' F='Inh'/><Cell N='IsDropSource' V='0' F='Inh'/><Cell N='NoLiveDynamics' V='0' F='Inh'/><Cell N='LocalizeMerge' V='0' F='Inh'/><Cell N='NoProofing' V='0' F='Inh'/><Cell N='Calendar' V='0' F='Inh'/><Cell N='LangID' V='en-US' F='Inh'/><Cell N='ShapeKeywords' V='' F='Inh'/><Cell N='DropOnPageScale' V='1' F='Inh'/><Cell N='QuickStyleLineColor' V='100'/><Cell N='QuickStyleFillColor' V='100'/><Cell N='QuickStyleShadowColor' V='100'/><Cell N='QuickStyleFontColor' V='100'/><Cell N='QuickStyleLineMatrix' V='1'/><Cell N='QuickStyleFillMatrix' V='1'/><Cell N='QuickStyleEffectsMatrix' V='1'/><Cell N='QuickStyleFontMatrix' V='1'/><Cell N='QuickStyleType' V='0'/><Cell N='QuickStyleVariation' V='0'/><Cell N='LineWeight' V='Themed' F='Inh'/><Cell N='LineColor' V='Themed' F='Inh'/><Cell N='LinePattern' V='Themed' F='Inh'/><Cell N='Rounding' V='Themed' F='Inh'/><Cell N='EndArrowSize' V='Themed' F='THEMEVAL()'/><Cell N='BeginArrow' V='Themed' F='THEMEVAL()'/><Cell N='EndArrow' V='Themed' F='THEMEVAL()'/><Cell N='LineCap' V='Themed' F='Inh'/><Cell N='BeginArrowSize' V='Themed' F='THEMEVAL()'/><Cell N='LineColorTrans' V='Themed' F='Inh'/><Cell N='CompoundType' V='Themed' F='Inh'/><Section N='Character'><Row IX='0'><Cell N='Font' V='Themed' F='Inh'/><Cell N='Color' V='Themed' F='Inh'/><Cell N='Style' V='Themed' F='Inh'/><Cell N='Case' V='0' F='Inh'/><Cell N='Pos' V='0' F='Inh'/><Cell N='FontScale' V='1' F='Inh'/><Cell N='Size' V='0.1111111111111111'/><Cell N='DblUnderline' V='0' F='Inh'/><Cell N='Overline' V='0' F='Inh'/><Cell N='Strikethru' V='0' F='Inh'/><Cell N='DoubleStrikethrough' V='0' F='Inh'/><Cell N='Letterspace' V='0' F='Inh'/><Cell N='ColorTrans' V='0' F='Inh'/><Cell N='AsianFont' V='Themed' F='Inh'/><Cell N='ComplexScriptFont' V='Themed' F='Inh'/><Cell N='ComplexScriptSize' V='-1' F='Inh'/><Cell N='LangID' V='en-US' F='Inh'/></Row></Section></StyleSheet></StyleSheets><DocumentSheet NameU='TheDoc' IsCustomNameU='1' Name='TheDoc' IsCustomName='1' LineStyle='0' FillStyle='0' TextStyle='0'><Cell N='OutputFormat' V='0'/><Cell N='LockPreview' V='0'/><Cell N='AddMarkup' V='0'/><Cell N='ViewMarkup' V='0'/><Cell N='DocLockReplace' V='0' U='BOOL'/><Cell N='NoCoauth' V='0' U='BOOL'/><Cell N='DocLockDuplicatePage' V='0' U='BOOL'/><Cell N='PreviewQuality' V='0'/><Cell N='PreviewScope' V='0'/><Cell N='DocLangID' V='en-US'/><Section N='User'><Row N='msvNoAutoConnect'><Cell N='Value' V='1'/><Cell N='Prompt' V='' F='No Formula'/></Row></Section></DocumentSheet></VisioDocument>",
			"visio/windows.xml" : "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Windows ClientWidth='0' ClientHeight='0' xmlns='http://schemas.microsoft.com/office/visio/2012/main' xmlns:r='http://schemas.openxmlformats.org/officeDocument/2006/relationships' xml:space='preserve' />",
			"visio/_rels/document.xml.rels" : "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns='http://schemas.openxmlformats.org/package/2006/relationships'><Relationship Id='rId1' Type='http://schemas.microsoft.com/visio/2010/relationships/masters' Target='masters/masters.xml' /><Relationship Id='rId2' Type='http://schemas.microsoft.com/visio/2010/relationships/pages' Target='pages/pages.xml' /><Relationship Id='rId3' Type='http://schemas.microsoft.com/visio/2010/relationships/windows' Target='windows.xml' /></Relationships>",
			"visio/masters/_rels/masters.xml.rels" : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/master" Target="master1.xml"/></Relationships>',
			"visio/masters/masters.xml" : "<?xml version='1.0' encoding='utf-8' ?><Masters xmlns='http://schemas.microsoft.com/office/visio/2012/main' xmlns:r='http://schemas.openxmlformats.org/officeDocument/2006/relationships' xml:space='preserve'><Master ID='4' NameU='Dynamic connector' IsCustomNameU='1' Name='Dynamic connector' IsCustomName='1' Prompt='This connector automatically routes between the shapes it connects.' IconSize='1' AlignName='2' MatchByName='1' IconUpdate='0' UniqueID='{002A9108-0000-0000-8E40-00608CF305B2}' BaseID='{F7290A45-E3AD-11D2-AE4F-006008C9F5A9}' PatternFlags='0' Hidden='0' MasterType='0'><PageSheet LineStyle='0' FillStyle='0' TextStyle='0'><Cell N='PageWidth' V='3'/><Cell N='PageHeight' V='3'/><Cell N='ShdwOffsetX' V='0.125'/><Cell N='ShdwOffsetY' V='-0.125'/><Cell N='PageScale' V='1' U='IN_F'/><Cell N='DrawingScale' V='1' U='IN_F'/><Cell N='DrawingSizeType' V='4'/><Cell N='DrawingScaleType' V='0'/><Cell N='InhibitSnap' V='0'/><Cell N='PageLockReplace' V='0' U='BOOL'/><Cell N='PageLockDuplicate' V='0' U='BOOL'/><Cell N='UIVisibility' V='0'/><Cell N='ShdwType' V='0'/><Cell N='ShdwObliqueAngle' V='0'/><Cell N='ShdwScaleFactor' V='1'/><Cell N='DrawingResizeType' V='0'/><Section N='Layer'><Row IX='0'><Cell N='Name' V='Connector'/><Cell N='Color' V='255'/><Cell N='Status' V='0'/><Cell N='Visible' V='1'/><Cell N='Print' V='1'/><Cell N='Active' V='0'/><Cell N='Lock' V='0'/><Cell N='Snap' V='1'/><Cell N='Glue' V='1'/><Cell N='NameUniv' V='Connector'/><Cell N='ColorTrans' V='0'/></Row></Section></PageSheet><Rel r:id='rId1'/></Master></Masters>",
			"visio/masters/master1.xml" : "<?xml version='1.0' encoding='utf-8' ?><MasterContents xmlns='http://schemas.microsoft.com/office/visio/2012/main' xmlns:r='http://schemas.openxmlformats.org/officeDocument/2006/relationships' xml:space='preserve'><Shapes><Shape ID='5' OriginalID='0' Type='Shape' LineStyle='7' FillStyle='7' TextStyle='7'><Cell N='PinX' V='1.5' F='GUARD((BeginX+EndX)/2)'/><Cell N='PinY' V='1.5' F='GUARD((BeginY+EndY)/2)'/><Cell N='Width' V='1' F='GUARD(EndX-BeginX)'/><Cell N='Height' V='-1' F='GUARD(EndY-BeginY)'/><Cell N='LocPinX' V='0.5' F='GUARD(Width*0.5)'/><Cell N='LocPinY' V='-0.5' F='GUARD(Height*0.5)'/><Cell N='Angle' V='0' F='GUARD(0DA)'/><Cell N='FlipX' V='0' F='GUARD(FALSE)'/><Cell N='FlipY' V='0' F='GUARD(FALSE)'/><Cell N='ResizeMode' V='0'/><Cell N='BeginX' V='1'/><Cell N='BeginY' V='2'/><Cell N='EndX' V='2'/><Cell N='EndY' V='1'/><Cell N='TxtPinX' V='0' F='SETATREF(Controls.TextPosition)'/><Cell N='TxtPinY' V='-1' F='SETATREF(Controls.TextPosition.Y)'/><Cell N='TxtWidth' V='0.5555555555555556' F='MAX(TEXTWIDTH(TheText),5*Char.Size)'/><Cell N='TxtHeight' V='0.2444444444444444' F='TEXTHEIGHT(TheText,TxtWidth)'/><Cell N='TxtLocPinX' V='0.2777777777777778' F='TxtWidth*0.5'/><Cell N='TxtLocPinY' V='0.1222222222222222' F='TxtHeight*0.5'/><Cell N='TxtAngle' V='0'/><Cell N='LockHeight' V='1'/><Cell N='LockCalcWH' V='1'/><Cell N='HelpTopic' V='Vis_SE.chm!#20000'/><Cell N='Copyright' V='Copyright 2001 Microsoft Corporation.  All rights reserved.'/><Cell N='NoAlignBox' V='1'/><Cell N='DynFeedback' V='2'/><Cell N='GlueType' V='2'/><Cell N='ObjType' V='2'/><Cell N='NoLiveDynamics' V='1'/><Cell N='ShapeSplittable' V='1'/><Cell N='LayerMember' V='0'/><Section N='Control'><Row N='TextPosition'><Cell N='X' V='0'/><Cell N='Y' V='-1'/><Cell N='XDyn' V='0' F='Controls.TextPosition'/><Cell N='YDyn' V='-1' F='Controls.TextPosition.Y'/><Cell N='XCon' V='5' F='IF(OR(STRSAME(SHAPETEXT(TheText),\"\"),HideText),5,0)'/><Cell N='YCon' V='0'/><Cell N='CanGlue' V='0'/><Cell N='Prompt' V='Reposition Text'/></Row></Section><Section N='Geometry' IX='0'><Cell N='NoFill' V='1'/><Cell N='NoLine' V='0'/><Cell N='NoShow' V='0'/><Cell N='NoSnap' V='0'/><Cell N='NoQuickDrag' V='0'/><Row T='MoveTo' IX='1'><Cell N='X' V='0'/><Cell N='Y' V='0'/></Row><Row T='LineTo' IX='2'><Cell N='X' V='0'/><Cell N='Y' V='-1'/></Row></Section></Shape></Shapes></MasterContents>"
		};
		  
		for (var id in files) 
		{
			if (pageCount > 1 && id == that.CONTENT_TYPES_XML) 
			{
				//Add the remaining pages
				var doc = mxUtils.parseXml(files[id]);
				var root = doc.documentElement;
				
				var children = root.childNodes;
				var page1 = null;
		
				for (var i = 0; i < children.length; i++)
				{
					var child = children[i];
					if (child.nodeType == 1 && "/visio/pages/page1.xml" == child.getAttribute(that.PART_NAME))
					{
						page1 = child;
					}
				}
				
				if (page1 != null)
				{
					for (var i = 2; i <= pageCount; i++)
					{
						var newPage = page1.cloneNode(true);
						newPage.setAttribute(that.PART_NAME, "/visio/pages/page" + i + ".xml");
						root.appendChild(newPage);
					}
				}
			    	
		    	writeXmlDoc2Zip(zip, id, doc, true);
		    }
		    else 
		    {
			    zip.file(id, files[id]);
		    }
	    }
	};
	
	function createElt(doc, ns, name)
	{
		return (doc.createElementNS != null) ? doc.createElementNS(ns, name) : doc.createElement(name);
	};

	function getCellVsdxId(cellId)
	{
		var vsdxId = idsMap[cellId];
		
		if (vsdxId == null)
		{
			vsdxId = idsCounter++;
			idsMap[cellId] = vsdxId;
		}
		return vsdxId;
	};
	
	function getGraphAttributes(graph) 
	{
		var attr = {
			pageScale: 1,
			pageWidth: (graph.pageFormat != null) ? graph.pageFormat.width : 850,
			pageHeight: (graph.pageFormat != null) ? graph.pageFormat.height : 1100
		};
		
		try
		{
			// Computes the horizontal and vertical page count
			var bounds = graph.getGraphBounds().clone();
			var sc = graph.view.scale;
			var tr = graph.view.translate;

			var x0 = Math.round(bounds.x / sc) - tr.x;
			var y0 = Math.round(bounds.y / sc) - tr.y;
			
			// Store the available page area
			var availableWidth = graph.pageFormat.width;
			var availableHeight = graph.pageFormat.height;

			if (x0 < 0) 
			{
				x0 += Math.ceil((tr.x - bounds.x / sc) / availableWidth) * availableWidth;
			}

			if (y0 < 0) 
			{
				y0 += Math.ceil((tr.y - bounds.y / sc) / availableHeight) * availableHeight;
			}

			var hpages = Math.max(1, Math.ceil((bounds.width / sc  + x0) / availableWidth));
			var vpages = Math.max(1, Math.ceil((bounds.height / sc + y0) / availableHeight));
			
			attr['gridEnabled'] = graph.gridEnabled;
			attr['gridSize'] = graph.gridSize;
			attr['guidesEnabled'] = (graph.graphHandler != null) ? graph.graphHandler.guidesEnabled : true;
			attr['pageVisible'] = graph.pageVisible;
			attr['pageScale'] = graph.pageScale || 1;
			attr['pageWidth'] = graph.pageFormat.width * hpages;
			attr['pageHeight'] = graph.pageFormat.height * vpages;
			attr['backgroundClr'] = graph.background;
			attr['mathEnabled'] = graph.mathEnabled;
			attr['shadowVisible'] = graph.shadowVisible;
		}
		catch(e)
		{
			//nothing
		}
		return attr;
	};

	function createCellElemScaled(name, val, xmlDoc, formula)
	{
		return createCellElem(name, val / that.CONVERSION_FACTOR, xmlDoc, formula);
	};

	function createCellElem(name, val, xmlDoc, formula)
	{
		var cell = createElt(xmlDoc, that.XMLNS, "Cell");
		cell.setAttribute("N", name);
		cell.setAttribute("V", val);
		
		if (formula) cell.setAttribute("F", formula);
		
		return cell;
	};

	function createRow(type, index, x, y, xmlDoc, xF, yF) 
	{
		var row = createElt(xmlDoc, that.XMLNS, "Row");
		row.setAttribute("T", type);
		row.setAttribute("IX", index);
		row.appendChild(createCellElemScaled("X", x, xmlDoc, xF));
		row.appendChild(createCellElemScaled("Y", y, xmlDoc, yF));
		return row;
	};
	
	function getStyleColor(color, defaultColor)
	{
		if (color == null || color === "" || color === "none" || color === mxConstants.NONE)
		{
			return null;
		}

		if (color === "default")
		{
			return defaultColor || null;
		}

		if (typeof mxUtils !== "undefined" && mxUtils.isLightDarkColor && mxUtils.isLightDarkColor(color))
		{
			color = mxUtils.parseLightDarkColor(color).light;
		}

		var hex = (typeof mxUtils !== "undefined" && mxUtils.rgba2hex) ? mxUtils.rgba2hex(color) : color;

		if (hex == null || hex === "none" || hex === "default")
		{
			return defaultColor || null;
		}

		hex = String(hex).trim();

		// Expand shorthand #rgb to #rrggbb
		if (/^#[0-9a-fA-F]{3}$/.test(hex))
		{
			hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
		}

		if (/^#[0-9a-fA-F]{6}$/.test(hex))
		{
			return hex.toLowerCase();
		}

		return defaultColor || null;
	}

	function hexToRgbFormula(hex)
	{
		if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex))
		{
			return null;
		}
		var r = parseInt(hex.substring(1, 3), 16);
		var g = parseInt(hex.substring(3, 5), 16);
		var b = parseInt(hex.substring(5, 7), 16);
		return "RGB(" + r + "," + g + "," + b + ")";
	}

	function computeArcRadius(state, w, h, isEdge)
	{
		if (isEdge)
		{
			var lineArc = parseFloat(mxUtils.getValue(state.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE || 20));
			return lineArc / 2;
		}

		if (mxUtils.getValue(state.style, "absoluteArcSize", "0") == "1")
		{
			var absArc = parseFloat(mxUtils.getValue(state.style, mxConstants.STYLE_ARCSIZE, mxConstants.LINE_ARCSIZE || 20));
			return Math.min(w / 2, Math.min(h / 2, absArc / 2));
		}

		var f = parseFloat(mxUtils.getValue(state.style, mxConstants.STYLE_ARCSIZE, (mxConstants.RECTANGLE_ROUNDING_FACTOR || 0.15) * 100)) / 100;
		return Math.min(w * f, h * f);
	}

	function applyMxCellStyle(state, shape, xmlDoc, isEdge)
	{
		var fillClr = getStyleColor(state.style[mxConstants.STYLE_FILLCOLOR], "#ffffff");
		var hasGradient = false;
		
		if (isEdge || !fillClr)
		{
			shape.appendChild(createCellElem("FillPattern", 0, xmlDoc));
		}
		else
		{
			shape.appendChild(createCellElem("FillForegnd", fillClr, xmlDoc));
			var gradClr = getStyleColor(state.style[mxConstants.STYLE_GRADIENTCOLOR], "#ffffff");

			if (gradClr)
			{
				hasGradient = true;
				shape.appendChild(createCellElem("FillBkgnd", gradClr, xmlDoc));
				
				var gradDir = state.style[mxConstants.STYLE_GRADIENT_DIRECTION];
				var dir = 28; // North-to-South default
				
				if (gradDir)
				{
					switch(gradDir)
					{
						case mxConstants.DIRECTION_EAST:
							dir = 25;
						break;
						case mxConstants.DIRECTION_WEST:
							dir = 27;
						break;
						case mxConstants.DIRECTION_NORTH:
							dir = 30;
						break;
					}
				}
				shape.appendChild(createCellElem("FillPattern", dir, xmlDoc));
			}
			else
			{
				shape.appendChild(createCellElem("FillPattern", 1, xmlDoc));
			}
		}

		var strokeClr = getStyleColor(state.style[mxConstants.STYLE_STROKECOLOR], "#000000");
		
		if (!strokeClr)
		{
			shape.appendChild(createCellElem("LinePattern", 0, xmlDoc));
		}
		else
		{
			shape.appendChild(createCellElem("LineColor", strokeClr, xmlDoc));
		}

		var strokeW = state.style[mxConstants.STYLE_STROKEWIDTH];
		if (strokeW != null) shape.appendChild(createCellElemScaled("LineWeight", parseFloat(strokeW), xmlDoc));
		
		var opacity = state.style[mxConstants.STYLE_OPACITY];
		var fillOpaq = state.style[mxConstants.STYLE_FILL_OPACITY];
		var strkOpaq = state.style[mxConstants.STYLE_STROKE_OPACITY];
		
		if (opacity != null)
		{
			if (fillOpaq == null) fillOpaq = opacity;
			if (strkOpaq == null) strkOpaq = opacity;
		}
			
		if (fillOpaq != null)
		{
			var fillTrans = Math.max(0, Math.min(1, 1 - parseFloat(fillOpaq) / 100.0));
			shape.appendChild(createCellElem("FillForegndTrans", fillTrans, xmlDoc));
			if (hasGradient)
			{
				shape.appendChild(createCellElem("FillBkgndTrans", fillTrans, xmlDoc));
			}
		}
		if (strkOpaq != null)
		{
			var strkTrans = Math.max(0, Math.min(1, 1 - parseFloat(strkOpaq) / 100.0));
			shape.appendChild(createCellElem("LineColorTrans", strkTrans, xmlDoc));
		}
		
		var isDashed = state.style[mxConstants.STYLE_DASHED];
		
		if (isDashed == 1 && strokeClr) 
		{
			var dashPatrn = state.style[mxConstants.STYLE_DASH_PATTERN];
			var pattern = 9;
				
			if (dashPatrn)
			{
				switch(String(dashPatrn).trim()) 
				{
					case "1 1":
						pattern = 10; 
					break;
					case "1 2":
						pattern = 3; 
					break;
					case "1 3":
					case "1 4":
						pattern = 17; 
					break;
					case "4 4":
						pattern = 9;
					break;
					case "8 8":
					case "12 12":
						pattern = 2;
					break;
					case "8 4 1 4":
						pattern = 4;
					break;
					case "8 4 1 4 1 4":
						pattern = 5;
					break;
				} 
			}
			
			shape.appendChild(createCellElem("LinePattern", pattern, xmlDoc));
		}
		
		var hasShadow = state.style[mxConstants.STYLE_SHADOW];
		
		if (hasShadow == 1)
		{
			shape.appendChild(createCellElem("ShdwPattern", 1, xmlDoc));
			shape.appendChild(createCellElem("ShdwForegnd", '#000000', xmlDoc));
			shape.appendChild(createCellElem("ShdwForegndTrans", 0.6, xmlDoc));
			shape.appendChild(createCellElem("ShapeShdwType", 1, xmlDoc));
			shape.appendChild(createCellElem("ShapeShdwOffsetX", '0.02946278254943948', xmlDoc));
			shape.appendChild(createCellElem("ShapeShdwOffsetY", '-0.02946278254943948', xmlDoc));
			shape.appendChild(createCellElem("ShapeShdwScaleFactor", '1', xmlDoc));
			shape.appendChild(createCellElem("ShapeShdwBlur", '0.05555555555555555', xmlDoc));
			shape.appendChild(createCellElem("ShapeShdwShow", 2, xmlDoc));
		}

		// Use state.shape flip properties if available (accounts for direction=north|south flip swapping and stencilFlipH/V)
		var flipX = (state.shape != null && state.shape.flipH != null) ? (state.shape.flipH ? 1 : 0) : (state.style[mxConstants.STYLE_FLIPH] == 1 ? 1 : 0);
		if (flipX == 1) shape.appendChild(createCellElem("FlipX", 1, xmlDoc));

		var flipY = (state.shape != null && state.shape.flipV != null) ? (state.shape.flipV ? 1 : 0) : (state.style[mxConstants.STYLE_FLIPV] == 1 ? 1 : 0);
		if (flipY == 1) shape.appendChild(createCellElem("FlipY", 1, xmlDoc));

		var rounded = state.style[mxConstants.STYLE_ROUNDED];
		if (rounded == 1)
		{
			var w = (state.cell && state.cell.geometry) ? state.cell.geometry.width : 0;
			var h = (state.cell && state.cell.geometry) ? state.cell.geometry.height : 0;
			var arcRadius = computeArcRadius(state, w, h, isEdge);
			if (arcRadius > 0)
			{
				shape.appendChild(createCellElemScaled("Rounding", arcRadius, xmlDoc));
			}
		}

		// Visio requires RGB(r,g,b) formula on TextBkgnd (otherwise V is treated as a 1-based palette index where 0 = transparent)
		var lbkgnd = getStyleColor(state.style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR], "#ffffff");
		if (lbkgnd)
		{
			shape.appendChild(createCellElem("TextBkgnd", lbkgnd, xmlDoc, hexToRgbFormula(lbkgnd)));
			shape.appendChild(createCellElem("TextBkgndTrans", 0, xmlDoc));
		}
	};

	function createShape(id, geo, layerIndex, xmlDoc, parentHeight, isChild)
	{
		var shape = createElt(xmlDoc, that.XMLNS, "Shape");
		
		shape.setAttribute("ID", id);
		shape.setAttribute("NameU", "Shape" + id);
		shape.setAttribute("LineStyle", "0");
		shape.setAttribute("FillStyle", "0");
		shape.setAttribute("TextStyle", "0");
		
		var hw = geo.width/2, hh = geo.height/2;
		
		shape.appendChild(createCellElemScaled("PinX", geo.x + hw + (isChild? 0 : vsdxCanvas.shiftX), xmlDoc));
		shape.appendChild(createCellElemScaled("PinY", parentHeight - geo.y - hh - (isChild? 0 : vsdxCanvas.shiftY), xmlDoc));
		shape.appendChild(createCellElemScaled("Width", geo.width, xmlDoc));
		shape.appendChild(createCellElemScaled("Height", geo.height, xmlDoc));
		shape.appendChild(createCellElemScaled("LocPinX", hw, xmlDoc));
		shape.appendChild(createCellElemScaled("LocPinY", hh, xmlDoc));
		shape.appendChild(createCellElem("LayerMember", layerIndex + "", xmlDoc));
		
		return shape;
	};

	function getArrowType(arrow, isFilled)
	{
		isFilled = (isFilled == null || isFilled == 1 || isFilled === "1" || isFilled === true) ? "1" : "0";
		arrow = arrow == null ? "none" : arrow;
		var key = arrow + "|" + isFilled;
		var type = that.ARROWS_MAP[key];
		if (type != null)
			return type;
		else
			return 1;
	};
	
	function getArrowSize(size)
	{
		if (size == null) return 2;
		size = parseFloat(size);
		
		if (size <= 2)
			return 0;
		else if (size <= 3)
			return 1;
		else if (size <= 5)
			return 2;
		else if (size <= 7)
			return 3;
		else if (size <= 9)
			return 4;
		else if (size <= 22)
			return 5;
		else
			return 6;
	};

	function createEdge(cell, layerIndex, graph, xmlDoc, parentHeight, isChild, connInfoMap)
	{
		var state = graph.view.getState(cell, true);
		
		if (state == null || state.absolutePoints == null || state.absolutePoints.length < 2)
		{
			return null;
		}
		
		var shape = createElt(xmlDoc, that.XMLNS, "Shape");
		var vsdxId = getCellVsdxId(cell.id);
		shape.setAttribute("ID", vsdxId);
		shape.setAttribute("NameU", "Dynamic connector." + vsdxId);
		shape.setAttribute("Name", "Dynamic connector." + vsdxId);
		shape.setAttribute("Type", "Shape");
		shape.setAttribute("Master", "4"); //Dynamic Connector Master
			
		var s = vsdxCanvas.state;
		var points = state.absolutePoints;
		
		// Convert a view point (from state.absolutePoints) into parent-local coordinates:
		// x_local is measured from left of parent (or page + shiftX);
		// y_local is measured from top of parent (or page + shiftY).
		var toParentPoint = function(p)
		{
			var lx = p.x * s.scale + s.dx + (isChild ? 0 : vsdxCanvas.shiftX);
			var ly = p.y * s.scale + s.dy + (isChild ? 0 : vsdxCanvas.shiftY);
			return {
				x: lx,
				y: ly,
				visioX: lx,
				visioY: parentHeight - ly
			};
		};

		var pts = [];
		for (var i = 0; i < points.length; i++)
		{
			if (points[i] != null)
			{
				pts.push(toParentPoint(points[i]));
			}
		}

		if (pts.length < 2)
		{
			return null;
		}

		var pStart = pts[0];
		var pEnd = pts[pts.length - 1];

		var width1D = pEnd.visioX - pStart.visioX;
		var height1D = pEnd.visioY - pStart.visioY;
		var pinX = (pStart.visioX + pEnd.visioX) / 2;
		var pinY = (pStart.visioY + pEnd.visioY) / 2;
		var locPinX = width1D * 0.5;
		var locPinY = height1D * 0.5;

		// Preserve Master 4 1D formulas so moving connected shapes in Visio dynamically updates PinX/PinY/Width/Height
		shape.appendChild(createCellElemScaled("PinX", pinX, xmlDoc, "GUARD((BeginX+EndX)/2)"));
		shape.appendChild(createCellElemScaled("PinY", pinY, xmlDoc, "GUARD((BeginY+EndY)/2)"));
		shape.appendChild(createCellElemScaled("Width", width1D, xmlDoc, "GUARD(EndX-BeginX)"));
		shape.appendChild(createCellElemScaled("Height", height1D, xmlDoc, "GUARD(EndY-BeginY)"));
		shape.appendChild(createCellElemScaled("LocPinX", locPinX, xmlDoc, "GUARD(Width*0.5)"));
		shape.appendChild(createCellElemScaled("LocPinY", locPinY, xmlDoc, "GUARD(Height*0.5)"));

		// Check if source/target have explicit connection point formulas registered
		var connInfo = (connInfoMap != null) ? connInfoMap[cell.id] : null;
		var beginXF = (connInfo && connInfo.beginXF) ? connInfo.beginXF : "_WALKGLUE(BegTrigger,EndTrigger,WalkPreference)";
		var beginYF = (connInfo && connInfo.beginYF) ? connInfo.beginYF : "_WALKGLUE(BegTrigger,EndTrigger,WalkPreference)";
		var endXF = (connInfo && connInfo.endXF) ? connInfo.endXF : "_WALKGLUE(EndTrigger,BegTrigger,WalkPreference)";
		var endYF = (connInfo && connInfo.endYF) ? connInfo.endYF : "_WALKGLUE(EndTrigger,BegTrigger,WalkPreference)";

		shape.appendChild(createCellElemScaled("BeginX", pStart.visioX, xmlDoc, beginXF));
		shape.appendChild(createCellElemScaled("BeginY", pStart.visioY, xmlDoc, beginYF));
		shape.appendChild(createCellElemScaled("EndX", pEnd.visioX, xmlDoc, endXF));
		shape.appendChild(createCellElemScaled("EndY", pEnd.visioY, xmlDoc, endYF));

		// Formula is used to make the edge dynamic (specify source id and target id)
		shape.appendChild(createCellElem("BegTrigger", "2", xmlDoc, cell.source ? "_XFTRIGGER(Sheet." + getCellVsdxId(cell.source.id) + "!EventXFMod)" : null));
		shape.appendChild(createCellElem("EndTrigger", "2", xmlDoc, cell.target ? "_XFTRIGGER(Sheet." + getCellVsdxId(cell.target.id) + "!EventXFMod)" : null));
		shape.appendChild(createCellElem("ConFixedCode", "6", xmlDoc));
		shape.appendChild(createCellElem("LayerMember", layerIndex + "", xmlDoc));

		applyMxCellStyle(state, shape, xmlDoc, true);
		
		// Edge special styles (arrows)
		var startFill = state.style[mxConstants.STYLE_STARTFILL];
		var startArrow = state.style[mxConstants.STYLE_STARTARROW];
		var startSize = state.style[mxConstants.STYLE_STARTSIZE];
		
		var sType = getArrowType(startArrow, startFill);
		shape.appendChild(createCellElem("BeginArrow", sType, xmlDoc));
		shape.appendChild(createCellElem("BeginArrowSize", getArrowSize(startSize), xmlDoc));
		
		var endFill = state.style[mxConstants.STYLE_ENDFILL];
		var endArrow = state.style[mxConstants.STYLE_ENDARROW];
		var endSize = state.style[mxConstants.STYLE_ENDSIZE];
		
		var eType = getArrowType(endArrow, endFill);
		shape.appendChild(createCellElem("EndArrow", eType, xmlDoc));
		shape.appendChild(createCellElem("EndArrowSize", getArrowSize(endSize), xmlDoc));

		// Set up 1D edge reference frame for mxVsdxCanvas2D (where local (0,0) in Visio is at (BeginX, BeginY))
		var edgeGeo = {
			x: pStart.x - (isChild ? 0 : vsdxCanvas.shiftX),
			y: pStart.y - (isChild ? 0 : vsdxCanvas.shiftY),
			width: width1D,
			height: height1D,
			isEdge: true
		};
		vsdxCanvas.newEdge(shape, state, xmlDoc, edgeGeo);
		
		// Draw text first to have its shape cell elements before visio geo
		if (state.text != null && state.text.checkBounds())
		{
			vsdxCanvas.save();
			state.text.paint(vsdxCanvas);
			vsdxCanvas.restore();
		}
		
		var geoSec = createElt(xmlDoc, that.XMLNS, "Section");
		geoSec.setAttribute("N", "Geometry");
		geoSec.setAttribute("IX", "0");

		var isCurved = state.style[mxConstants.STYLE_CURVED] == 1;

		var makePropFormula = function(relVal, totalSpan, dimName)
		{
			if (Math.abs(totalSpan) > 1e-6)
			{
				var ratio = +(relVal / totalSpan).toFixed(6);
				return dimName + "*" + ratio;
			}
			return null;
		};

		if (isCurved && pts.length > 2)
		{
			var p0RelX = 0, p0RelY = 0;
			geoSec.appendChild(createRow("MoveTo", 1, p0RelX, p0RelY, xmlDoc, "Width*0", "Height*0"));
			var rowIdx = 2;

			for (var i = 1; i < pts.length - 1; i++)
			{
				var ctrlX = pts[i].visioX - pStart.visioX;
				var ctrlY = pts[i].visioY - pStart.visioY;
				var nextX = (i < pts.length - 2) ? ((pts[i].visioX + pts[i + 1].visioX) / 2 - pStart.visioX) : (pEnd.visioX - pStart.visioX);
				var nextY = (i < pts.length - 2) ? ((pts[i].visioY + pts[i + 1].visioY) / 2 - pStart.visioY) : (pEnd.visioY - pStart.visioY);

				var qRow = createRow("QuadBezTo", rowIdx++, nextX, nextY, xmlDoc,
					makePropFormula(nextX, width1D, "Width"),
					makePropFormula(nextY, height1D, "Height"));
				qRow.appendChild(createCellElemScaled("A", ctrlX, xmlDoc, makePropFormula(ctrlX, width1D, "Width")));
				qRow.appendChild(createCellElemScaled("B", ctrlY, xmlDoc, makePropFormula(ctrlY, height1D, "Height")));
				geoSec.appendChild(qRow);
			}
		}
		else
		{
			for (var i = 0; i < pts.length; i++)
			{
				var relX = pts[i].visioX - pStart.visioX;
				var relY = pts[i].visioY - pStart.visioY;
				var xF = (i === 0) ? "Width*0" : ((i === pts.length - 1) ? "Width*1" : makePropFormula(relX, width1D, "Width"));
				var yF = (i === 0) ? "Height*0" : ((i === pts.length - 1) ? "Height*1" : makePropFormula(relY, height1D, "Height"));
				geoSec.appendChild(createRow(i == 0 ? "MoveTo" : "LineTo", (i + 1), relX, relY, xmlDoc, xF, yF));
			}
		}
		
		geoSec.appendChild(createCellElem("NoFill", "1", xmlDoc));
		geoSec.appendChild(createCellElem("NoLine", "0", xmlDoc));
		shape.appendChild(geoSec);
		
		return shape;
	};
	
	function convertMxCell2Shape(cell, layerIndex, graph, xmlDoc, parentHeight, parentGeo, isChild, shapeMap, connInfoMap)
	{
		var geo = cell.geometry, origGeo = geo;
		
		if (geo != null)
		{
		  try
		  {
			// Fix relative geo coordinates without corrupting original geometry
			if (geo.relative && parentGeo)
			{
				origGeo = geo.clone();
				geo = geo.clone();
				geo.x *= parentGeo.width;
				geo.y *= parentGeo.height;
				
				if (cell.vertex && geo.offset != null)
				{
					geo.x += geo.offset.x;
					geo.y += geo.offset.y;
				}
				
				geo.relative = 0;
				cell.geometry = geo;
			}
			
			var vsdxId = getCellVsdxId(cell.id);
			
			if (!cell.treatAsSingle && cell.getChildCount() > 0) // Group 
			{
				// Allocate a distinct, collision-free ID for the inner group visual shape while keeping vsdxId for the outer Group Shape (so edges connecting to the group bind to the Group Shape ID)
				var shape = createShape(vsdxId, geo, layerIndex, xmlDoc, parentHeight, isChild);
				shape.setAttribute("Type", "Group");
				if (shapeMap != null)
				{
					shapeMap[cell.id] = shape;
				}
				
				// Create group shapes container
				var gShapes = createElt(xmlDoc, that.XMLNS, "Shapes");

				// Translate the canvas using the group coordinates
				vsdxCanvas.save();
				vsdxCanvas.translate(-geo.x, -geo.y);

				// Draw the actual group background shape as a child at (0,0)
				var newGeo = geo.clone();
				newGeo.x = 0;
				newGeo.y = 0;
				var innerBgId = cell.id + "__group_bg__";
				var origId = cell.id;
				cell.id = innerBgId;
				cell.geometry = newGeo;
				cell.treatAsSingle = true;
				var subShape = convertMxCell2Shape(cell, layerIndex, graph, xmlDoc, geo.height, geo, true, null, connInfoMap);
				delete cell.treatAsSingle;
				cell.id = origId;
				cell.geometry = geo;
				
				if (subShape != null)
				{
					gShapes.appendChild(subShape);
				}
				
				// Add group children
				for (var i = 0; i < cell.getChildCount(); i++)
				{
					var child = cell.children[i];
					var childShape = convertMxCell2Shape(child, layerIndex, graph, xmlDoc, geo.height, geo, true, shapeMap, connInfoMap);
					
					if (childShape != null)
					{
						gShapes.appendChild(childShape);
					}
				}
				
				shape.appendChild(gShapes);
				
				// Restore the canvas to before group translation
				vsdxCanvas.restore();
				
				return shape;
			}
			else if (cell.vertex)
			{
				var state = graph.view.getState(cell, true);
				var shapeGeo = geo;

				// When direction=north or direction=south, mxShape.isPaintBoundsInverted() is true:
				// mxShape swaps width & height and rotates by 90/-90 deg around the center.
				if (state != null && state.shape != null && state.shape.isPaintBoundsInverted && state.shape.isPaintBoundsInverted())
				{
					var t = (geo.width - geo.height) / 2;
					shapeGeo = geo.clone();
					shapeGeo.x += t;
					shapeGeo.y -= t;
					shapeGeo.width = geo.height;
					shapeGeo.height = geo.width;
				}

				var shape = createShape(vsdxId, shapeGeo, layerIndex, xmlDoc, parentHeight, isChild);
				if (shapeMap != null)
				{
					shapeMap[cell.id] = shape;
				}

				if (state != null)
				{
					applyMxCellStyle(state, shape, xmlDoc, false);
					vsdxCanvas.newShape(shape, state, xmlDoc, shapeGeo);

					// Draw text first to have its shape cell elements before visio geo
					if (state.text != null && state.text.checkBounds())
					{
						vsdxCanvas.save();
						state.text.paint(vsdxCanvas);
						vsdxCanvas.restore();
					}
					if (state.shape != null && state.shape.checkBounds())
					{
						vsdxCanvas.save();
						state.shape.paint(vsdxCanvas);
						vsdxCanvas.restore();
					}
					
					vsdxCanvas.endShape();
					shape.setAttribute("Type", vsdxCanvas.getShapeType());
				}

				return shape;
			}
			else
			{
				return createEdge(cell, layerIndex, graph, xmlDoc, parentHeight, isChild, connInfoMap);
			}
		  }
		  finally
		  {
			cell.geometry = origGeo;	
		  }
		}
		else
		{
			return null;
		}
	};

	function buildConnectionsInfo(model, graph)
	{
		var connInfoMap = {};
		var vertexConns = {}; // cellId -> array of { xRatio, yRatio, dx, dy }

		var registerConnPoint = function(targetCell, xRatio, yRatio, dx, dy)
		{
			var cid = targetCell.id;
			if (!vertexConns[cid])
			{
				vertexConns[cid] = [];
			}
			var list = vertexConns[cid];
			for (var i = 0; i < list.length; i++)
			{
				if (Math.abs(list[i].xRatio - xRatio) < 1e-4 &&
					Math.abs(list[i].yRatio - yRatio) < 1e-4 &&
					Math.abs(list[i].dx - dx) < 1e-4 &&
					Math.abs(list[i].dy - dy) < 1e-4)
				{
					return i + 1; // 1-based Connections.X{n} index in Visio
				}
			}
			list.push({ xRatio: xRatio, yRatio: yRatio, dx: dx, dy: dy });
			return list.length;
		};

		for (var id in model.cells)
		{
			var cell = model.cells[id];
			if (cell != null && cell.edge)
			{
				var state = graph.view.getState(cell, true);
				if (state == null || state.style == null) continue;

				var info = {};
				if (cell.source != null && state.style[mxConstants.STYLE_EXIT_X] != null && state.style[mxConstants.STYLE_EXIT_Y] != null)
				{
					var ex = parseFloat(state.style[mxConstants.STYLE_EXIT_X]);
					var ey = parseFloat(state.style[mxConstants.STYLE_EXIT_Y]);
					var edx = parseFloat(state.style[mxConstants.STYLE_EXIT_DX] || 0);
					var edy = parseFloat(state.style[mxConstants.STYLE_EXIT_DY] || 0);
					if (!isNaN(ex) && !isNaN(ey))
					{
						var cIdx = registerConnPoint(cell.source, ex, 1 - ey, edx, -edy);
						var srcVsdxId = getCellVsdxId(cell.source.id);
						info.fromPart = cIdx;
						info.toCellBegin = "Connections.X" + cIdx;
						info.beginXF = "PAR(PNT(Sheet." + srcVsdxId + "!Connections.X" + cIdx + ",Sheet." + srcVsdxId + "!Connections.Y" + cIdx + "))";
						info.beginYF = "PAR(PNT(Sheet." + srcVsdxId + "!Connections.X" + cIdx + ",Sheet." + srcVsdxId + "!Connections.Y" + cIdx + "))";
					}
				}

				if (cell.target != null && state.style[mxConstants.STYLE_ENTRY_X] != null && state.style[mxConstants.STYLE_ENTRY_Y] != null)
				{
					var nx = parseFloat(state.style[mxConstants.STYLE_ENTRY_X]);
					var ny = parseFloat(state.style[mxConstants.STYLE_ENTRY_Y]);
					var ndx = parseFloat(state.style[mxConstants.STYLE_ENTRY_DX] || 0);
					var ndy = parseFloat(state.style[mxConstants.STYLE_ENTRY_DY] || 0);
					if (!isNaN(nx) && !isNaN(ny))
					{
						var cIdx = registerConnPoint(cell.target, nx, 1 - ny, ndx, -ndy);
						var tgtVsdxId = getCellVsdxId(cell.target.id);
						info.toPart = cIdx;
						info.toCellEnd = "Connections.X" + cIdx;
						info.endXF = "PAR(PNT(Sheet." + tgtVsdxId + "!Connections.X" + cIdx + ",Sheet." + tgtVsdxId + "!Connections.Y" + cIdx + "))";
						info.endYF = "PAR(PNT(Sheet." + tgtVsdxId + "!Connections.X" + cIdx + ",Sheet." + tgtVsdxId + "!Connections.Y" + cIdx + "))";
					}
				}

				connInfoMap[cell.id] = info;
			}
		}

		return {
			connInfoMap: connInfoMap,
			vertexConns: vertexConns
		};
	}

	function appendConnectionSections(vertexConns, shapeMap, model, xmlDoc)
	{
		for (var cellId in vertexConns)
		{
			var shape = shapeMap[cellId];
			var cell = model.cells[cellId];
			if (shape == null || cell == null || cell.geometry == null) continue;

			var conns = vertexConns[cellId];
			if (!conns || conns.length === 0) continue;

			var connSec = createElt(xmlDoc, that.XMLNS, "Section");
			connSec.setAttribute("N", "Connection");

			var gw = cell.geometry.width;
			var gh = cell.geometry.height;

			for (var i = 0; i < conns.length; i++)
			{
				var c = conns[i];
				var row = createElt(xmlDoc, that.XMLNS, "Row");
				row.setAttribute("IX", i + "");

				var xVal = gw * c.xRatio + c.dx;
				var yVal = gh * c.yRatio + c.dy;
				var xF = "Width*" + (+c.xRatio.toFixed(6)) + (c.dx ? ("+" + (c.dx / that.CONVERSION_FACTOR)) : "");
				var yF = "Height*" + (+c.yRatio.toFixed(6)) + (c.dy ? ("+" + (c.dy / that.CONVERSION_FACTOR)) : "");

				row.appendChild(createCellElemScaled("X", xVal, xmlDoc, xF));
				row.appendChild(createCellElemScaled("Y", yVal, xmlDoc, yF));
				row.appendChild(createCellElem("DirX", "0", xmlDoc));
				row.appendChild(createCellElem("DirY", "0", xmlDoc));
				row.appendChild(createCellElem("Type", "0", xmlDoc));
				row.appendChild(createCellElem("AutoGen", "0", xmlDoc));
				connSec.appendChild(row);
			}

			// Insert Connection section before Shapes (if Group) or at end of Shape
			var childShapes = null;
			for (var j = 0; j < shape.childNodes.length; j++)
			{
				if (shape.childNodes[j].nodeName === "Shapes")
				{
					childShapes = shape.childNodes[j];
					break;
				}
			}
			if (childShapes != null)
			{
				shape.insertBefore(connSec, childShapes);
			}
			else
			{
				shape.appendChild(connSec);
			}
		}
	}
	
	function convertMxModel2Page(graph, modelAttrib)
	{
        var xmlDoc = mxUtils.createXmlDocument();

        var root = createElt(xmlDoc, that.XMLNS, "PageContents");
        
        root.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', that.XMLNS);
        root.setAttributeNS('http://www.w3.org/2000/xmlns/', "xmlns:r", that.XMLNS_R);
        root.setAttribute("xml:space", that.XML_SPACE);
        
        var shapes = createElt(xmlDoc, that.XMLNS, "Shapes");
        root.appendChild(shapes);

        var model = graph.model;
        
		var t = graph.view.translate;
		var s = graph.view.scale;
		var bounds = graph.getGraphBounds();

		vsdxCanvas.shiftX = 0; vsdxCanvas.shiftY = 0;
		//-ve pages
		if (bounds.x / s < t.x) 
		{
			vsdxCanvas.shiftX = Math.ceil((t.x - bounds.x / s) / graph.pageFormat.width) * graph.pageFormat.width;
		}
		if (bounds.y / s < t.y) 
		{
			vsdxCanvas.shiftY = Math.ceil((t.y - bounds.y / s) / graph.pageFormat.height) * graph.pageFormat.height;
		}
		
		vsdxCanvas.save();
		vsdxCanvas.translate(-t.x, -t.y);
		vsdxCanvas.scale(1 / s);
		vsdxCanvas.newPage();
		
		var layers = graph.model.getChildCells(graph.model.root);
		var layerIdsMaps = {};
		var visibleIdx = 0;
		
		for (var k = 0; k < layers.length; k++)
		{
			if (layers[k].visible !== false)
			{
				layerIdsMaps[layers[k].id] = visibleIdx++;
			}
		}

		var connData = buildConnectionsInfo(model, graph);
		var shapeMap = {};
		
		for (var id in model.cells) 
		{
			var cell = model.cells[id];
			// Top-most cells on visible layers
			var layerIndex = (cell.parent != null) ? layerIdsMaps[cell.parent.id] : null;
			
			if (layerIndex != null)
			{
				var shape = convertMxCell2Shape(cell, layerIndex, graph, xmlDoc, modelAttrib.pageHeight, null, false, shapeMap, connData.connInfoMap);
				
				if (shape != null)
					shapes.appendChild(shape);
			}
		}

		appendConnectionSections(connData.vertexConns, shapeMap, model, xmlDoc);
		
        var connects = createElt(xmlDoc, that.XMLNS, "Connects");
        root.appendChild(connects);

        // Second pass to add edges (connections)
		for (var id in model.cells) 
		{
			var cell = model.cells[id];

			if (cell.edge)
			{
				var info = connData.connInfoMap[cell.id] || {};

				if (cell.source)
				{
					var connect = createElt(xmlDoc, that.XMLNS, "Connect");
					connect.setAttribute("FromSheet", getCellVsdxId(cell.id));
					connect.setAttribute("FromCell", "BeginX");
					connect.setAttribute("FromPart", "9");
					connect.setAttribute("ToSheet", getCellVsdxId(cell.source.id));
					connect.setAttribute("ToCell", info.toCellBegin || "PinX");
					connect.setAttribute("ToPart", info.fromPart != null ? (100 + info.fromPart - 1) + "" : "3");
					connects.appendChild(connect);
				}
				
				if (cell.target)
				{
					var connect = createElt(xmlDoc, that.XMLNS, "Connect");
					connect.setAttribute("FromSheet", getCellVsdxId(cell.id));
					connect.setAttribute("FromCell", "EndX");
					connect.setAttribute("FromPart", "12");
					connect.setAttribute("ToSheet", getCellVsdxId(cell.target.id));
					connect.setAttribute("ToCell", info.toCellEnd || "PinX");
					connect.setAttribute("ToPart", info.toPart != null ? (100 + info.toPart - 1) + "" : "3");
					connects.appendChild(connect);
				}
			}
		}

		xmlDoc.appendChild(root);

		vsdxCanvas.restore();

		return xmlDoc;
	};

	function writeXmlDoc2Zip(zip, name, xmlDoc, noHeader)
	{
		zip.file(name, (noHeader? "" : "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>") + mxUtils.getXml(xmlDoc, '\n'));
	};
	
	function addPagesXML(zip, pagesList) 
	{
		var pagesXmlDoc = mxUtils.createXmlDocument();
		var pagesRelsXmlDoc = mxUtils.createXmlDocument();
	
		var pagesRoot = createElt(pagesXmlDoc, that.XMLNS, "Pages");
		pagesRoot.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', that.XMLNS);
		pagesRoot.setAttributeNS('http://www.w3.org/2000/xmlns/', "xmlns:r", that.XMLNS_R);
		pagesRoot.setAttribute("xml:space", that.XML_SPACE);

		var pagesRelsRoot = createElt(pagesRelsXmlDoc, that.RELS_XMLNS, "Relationships");
		
		for (var idx = 0; idx < pagesList.length; idx++) 
		{
			var i = idx + 1;
			var pageItem = pagesList[idx];
			var name = pageItem.name;
			var pageName = "page" + i + ".xml";
			
			var pageE = createElt(pagesXmlDoc, that.XMLNS, "Page");
			pageE.setAttribute("ID", idx + "");
			pageE.setAttribute("NameU", name);
			pageE.setAttribute("Name", name);
		
			var pageSheet = createElt(pagesXmlDoc, that.XMLNS, "PageSheet");
			var modelAttr = pageItem.modelAttr;
			
			pageSheet.appendChild(createCellElemScaled("PageWidth", modelAttr['pageWidth'], pagesXmlDoc));
			pageSheet.appendChild(createCellElemScaled("PageHeight", modelAttr['pageHeight'], pagesXmlDoc));
			pageSheet.appendChild(createCellElem("PageScale", modelAttr['pageScale'], pagesXmlDoc));
			pageSheet.appendChild(createCellElem("DrawingScale", 1, pagesXmlDoc));
		
			var relE = createElt(pagesXmlDoc, that.XMLNS, "Rel");
			relE.setAttributeNS(that.XMLNS_R, "r:id", "rId" + i);

			// Add Layers
			var layerSec = createElt(pagesXmlDoc, that.XMLNS, "Section");
			layerSec.setAttribute("N", "Layer");

			var layers = pageItem.layers;
			
			for (var k = 0; k < layers.length; k++)
			{
				var layerRow = createElt(pagesXmlDoc, that.XMLNS, "Row");
				layerRow.setAttribute("IX", k + "");
	
				layerSec.appendChild(layerRow);
				
				layerRow.appendChild(createCellElem("Name", layers[k].name, pagesXmlDoc));
				layerRow.appendChild(createCellElem("Color", '255', pagesXmlDoc));
				layerRow.appendChild(createCellElem("Status", '0', pagesXmlDoc));
				layerRow.appendChild(createCellElem("Visible", layers[k].visible? '1' : '0', pagesXmlDoc));
				layerRow.appendChild(createCellElem("Print", '1', pagesXmlDoc));
				layerRow.appendChild(createCellElem("Active", '0', pagesXmlDoc));
				layerRow.appendChild(createCellElem("Lock", layers[k].locked? '1' : '0', pagesXmlDoc));
				layerRow.appendChild(createCellElem("Snap", '1', pagesXmlDoc));
				layerRow.appendChild(createCellElem("Glue", '1', pagesXmlDoc));
				layerRow.appendChild(createCellElem("NameUniv", layers[k].name, pagesXmlDoc));
				layerRow.appendChild(createCellElem("ColorTrans", '0', pagesXmlDoc));
			}
			
			pageSheet.appendChild(layerSec);
			
			pageE.appendChild(pageSheet);
			pageE.appendChild(relE);
			pagesRoot.appendChild(pageE);
			
			var relationship = createElt(pagesRelsXmlDoc, that.RELS_XMLNS, "Relationship");
			relationship.setAttribute("Id", "rId" + i);
			relationship.setAttribute("Type", that.PAGES_TYPE);
			relationship.setAttribute("Target", pageName);
			pagesRelsRoot.appendChild(relationship);
			
			// Write the page doc
			writeXmlDoc2Zip(zip, that.VISIO_PAGES + pageName, pageItem.xmlDoc);
		}
		
		pagesXmlDoc.appendChild(pagesRoot);
		pagesRelsXmlDoc.appendChild(pagesRelsRoot);
		writeXmlDoc2Zip(zip, that.VISIO_PAGES + "pages.xml", pagesXmlDoc);
		writeXmlDoc2Zip(zip, that.VISIO_PAGES + "_rels/pages.xml.rels", pagesRelsXmlDoc);
	}

	function addImagesRels(zip, pIndex)
	{
		// Create a new page rels file
		var fId = that.VISIO_PAGES_RELS + "page" + pIndex + ".xml.rels";
		var pageRelDoc = mxUtils.createXmlDocument();

		var relationships = createElt(pageRelDoc, that.RELS_XMLNS, "Relationships");

		// Add master relationship (rId1)
		var relationship = createElt(pageRelDoc, that.RELS_XMLNS, "Relationship");
        relationship.setAttribute("Type", "http://schemas.microsoft.com/visio/2010/relationships/master");
        relationship.setAttribute("Id", "rId1");
        relationship.setAttribute("Target", "../masters/master1.xml");
        relationships.appendChild(relationship);
		
		var imgs = vsdxCanvas.images;

		// Create rels of image files
		if (imgs.length > 0)
		{
    		for (var i = 0; i < imgs.length; i++)
			{
    			var imgRel = createElt(pageRelDoc, that.RELS_XMLNS, "Relationship");
    	        imgRel.setAttribute("Type", that.XMLNS_R + "/image");
    	        imgRel.setAttribute("Id", "rId" + (i + 2));
    	        imgRel.setAttribute("Target", "../media/" + imgs[i]);
    	        
    	        relationships.appendChild(imgRel);
			}
    	}
		pageRelDoc.appendChild(relationships);
    	writeXmlDoc2Zip(zip, fId, pageRelDoc);
	};

	/**
	 * Convert current Editor UI pages into a vsdx file
	 * @return true if successful, false otherwise 
	 */
	this.exportCurrentDiagrams = function (currentPageOnly)
	{
		try 
		{
			var spinTarget = (typeof document !== 'undefined') ? document.body : null;
			if (!editorUi.spinner || editorUi.spinner.spin(spinTarget, mxResources.get('exporting')))
			{
				var zip = new JSZip();
			    
				// Init class global variables
				vsdxCanvas.init(zip);
				idsMap = {};
				idsCounter = 1;
				
				var pagesList = [];
				var usedPageNames = {};
				var pagesCount = (editorUi.pages != null && !currentPageOnly) ? editorUi.pages.length : 1;
				
				function getUniquePageName(rawName, pIdx)
				{
					var base = rawName || ("Page-" + pIdx);
					var candidate = base;
					var suffix = 2;
					while (usedPageNames[candidate])
					{
						candidate = base + " (" + (suffix++) + ")";
					}
					usedPageNames[candidate] = true;
					return candidate;
				};

				function collectLayers(graph)
				{
					var layers = graph.model.getChildCells(graph.model.root);
					var result = [];
					
					for (var k = 0; k < layers.length; k++)
					{
						if (layers[k].visible !== false)
						{
							result.push({
								name: layers[k].value || 'Background',
								visible: true,
								locked: layers[k].style && layers[k].style.indexOf('locked=1') >= 0 
							});
						}
					}
					return result;
				};
				
				if (editorUi.pages != null) 
				{
					function exportPage(page, pIndex)
					{
						var diagramName = getUniquePageName(page.getName(), pIndex);
						var graph = editorUi.editor.graph;
						var modelAttrib = getGraphAttributes(graph);
						var pageXmlDoc = convertMxModel2Page(graph, modelAttrib);
						var layers = collectLayers(graph);
						addImagesRels(zip, pIndex);
						pagesList.push({
							name: diagramName,
							xmlDoc: pageXmlDoc,
							layers: layers,
							modelAttr: modelAttrib
						});
					};
					
					var selectedCells = editorUi.editor.graph.getSelectionCells();
					var currentPage = editorUi.currentPage;
					
					if (currentPageOnly)
					{
						exportPage(currentPage, 1);
					}
					else
					{
						for (var i = 0; i < editorUi.pages.length; i++)
						{
							var page = editorUi.pages[i];
							
							if (editorUi.currentPage != page)
							{
								editorUi.selectPage(page, true);
							}
							
							exportPage(page, i + 1);
						}
						
						if (currentPage != editorUi.currentPage)
						{
							editorUi.selectPage(currentPage, true);
						}
						
						editorUi.editor.graph.setSelectionCells(selectedCells);
					}
				}
				else
				{
					var graph = editorUi.editor.graph;
					var modelAttrib = getGraphAttributes(graph);
					var diagramName = getUniquePageName("Page1", 1);
					var pageXmlDoc = convertMxModel2Page(graph, modelAttrib);
					var layers = collectLayers(graph);
					addImagesRels(zip, 1);
					pagesList.push({
						name: diagramName,
						xmlDoc: pageXmlDoc,
						layers: layers,
						modelAttr: modelAttrib
					});
				}
				
				createVsdxSkeleton(zip, pagesCount);
				addPagesXML(zip, pagesList);

				var createZipFile = function() 
				{
					zip.generateAsync({type:"base64"}).then(
						function(content) 
						{
							editorUi.spinner.stop();
							var basename = editorUi.getBaseFilename();
						    editorUi.saveData(basename + ".vsdx", 'vsdx', content,
						    	'application/vnd.visio2013', true);
						}
					);
				};
				
				if (vsdxCanvas.filesLoading > 0)
				{
					// Wait until all media files are loaded
					vsdxCanvas.onFilesLoaded = createZipFile;
				}
				else
				{
					createZipFile();
				}
			}
			
			return true;
		}
		catch(e) 
		{
			console.log(e);
			editorUi.spinner.stop();
			return false;
		}
	};	
}

VsdxExport.prototype.CONVERSION_FACTOR = 40 * 2.54; // screenCoordinatesPerCm (40) x CENTIMETERS_PER_INCHES (2.54)
VsdxExport.prototype.PAGES_TYPE = "http://schemas.microsoft.com/visio/2010/relationships/page";
VsdxExport.prototype.RELS_XMLNS = "http://schemas.openxmlformats.org/package/2006/relationships";
VsdxExport.prototype.XML_SPACE = "preserve";
VsdxExport.prototype.XMLNS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
VsdxExport.prototype.XMLNS = "http://schemas.microsoft.com/office/visio/2012/main";
VsdxExport.prototype.VISIO_PAGES = "visio/pages/";
VsdxExport.prototype.PREFEX = "com/mxgraph/io/vsdx/resources/export/";
VsdxExport.prototype.VSDX_ENC = "ISO-8859-1";
VsdxExport.prototype.PART_NAME = "PartName";
VsdxExport.prototype.CONTENT_TYPES_XML = "[Content_Types].xml";
VsdxExport.prototype.VISIO_PAGES_RELS = "visio/pages/_rels/";
VsdxExport.prototype.ARROWS_MAP = {
	"none|1": 0, "none|0": 0,
	"open|1": 1, "open|0": 1,
	"openThin|1": 1, "openThin|0": 1,
	"block|1": 4, "block|0": 14,
	"blockThin|1": 2, "blockThin|0": 15,
	"doubleBlock|1": 4, "doubleBlock|0": 14,
	"classic|1": 5, "classic|0": 17,
	"classicThin|1": 5, "classicThin|0": 17,
	"oval|1": 10, "oval|0": 20,
	"circle|1": 10, "circle|0": 20,
	"diamond|1": 11, "diamond|0": 22,
	"diamondThin|1": 11, "diamondThin|0": 22,
	"dash|1": 23, "dash|0": 23,
	"slash|1": 23, "slash|0": 23,
	"baseDash|1": 23, "baseDash|0": 23,
	"cross|1": 24, "cross|0": 24,
	"ERone|1": 24, "ERone|0": 24,
	"ERmandOne|1": 25, "ERmandOne|0": 25,
	"ERmany|1": 27, "ERmany|0": 27,
	"ERoneToMany|1": 28, "ERoneToMany|0": 28,
	"ERzeroToMany|1": 29, "ERzeroToMany|0": 29,
	"ERzeroToOne|1": 30, "ERzeroToOne|0": 30,
	"openAsync|1": 9, "openAsync|0": 9,
	"async|1": 9, "async|0": 9,
	"box|1": 8, "box|0": 8,
	"halfCircle|1": 41, "halfCircle|0": 41,
	"circlePlus|1": 42, "circlePlus|0": 42
};
