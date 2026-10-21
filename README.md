# draw2visio

Extracted, restored, and fixed Microsoft Visio (`.vsdx`) export engine from [draw.io](https://github.com/jgraph/drawio).

## Background

Native export to `.vsdx` format was removed from draw.io following release `v26.0.16` (see [jgraph/drawio#4942](https://github.com/jgraph/drawio/issues/4942)), with the maintainers citing the maintenance burden of the Visio OpenXML file format. 

While the exporter was minified into `extensions.min.js` and `app.min.js` in older releases, the full unminified source files were briefly checked into the draw.io source tree in commit `947271f1` (Release 28.2.0) before being removed in commits `f61234f5` and `2e967be4`.

This repository preserves the original source code and fixes the major quality and corruption bugs that affected the original `(beta)` exporter.

---

## Repository Structure

| File | Description |
| :--- | :--- |
| [`src/VsdxExport.js`](./src/VsdxExport.js) | Main export controller. Manages VSDX packaging (JSZip), OpenXML skeleton creation, pages, layers, relationship files (`_rels`), styles, masters, connection points, and download trigger. |
| [`src/mxVsdxCanvas2D.js`](./src/mxVsdxCanvas2D.js) | Canvas implementation extending `mxAbstractCanvas2D`. Intercepts drawing primitives (`rect`, `roundrect`, `ellipse`, `curveTo`, `text`, `image`, `fill`, `stroke`) and translates them into Visio OpenXML geometry and text sections. |
| [`src/ui-integration.js`](./src/ui-integration.js) | Reference integration hooks from `EditorUi.js` and `Menus.js` showing how draw.io originally triggered the export action. |
| [`dist/visio-export-plugin.js`](./dist/visio-export-plugin.js) | Drop-in draw.io bundle that restores **File > Export as > VSDX...** in draw.io Desktop and Web with all fixes applied. |
| [`scripts/build-plugin.js`](./scripts/build-plugin.js) | Builds `dist/visio-export-plugin.js` from `src/VsdxExport.js` and `src/mxVsdxCanvas2D.js`. |
| [`scripts/patch-desktop-asar.js`](./scripts/patch-desktop-asar.js) | Installs the fixed VSDX exporter directly into draw.io Desktop's `app.asar` (since external `--enable-plugins` support was removed in recent draw.io Desktop releases). |
| [`test/test-exporter.js`](./test/test-exporter.js) | Automated test suite validating rich HTML text, geometry subpaths, 1D connectors, connection ports, groups, rotated shapes, and multi-page packaging. |

---

## Bugs Fixed in This Version

1. **Single-Page Export Corruption (`pageNaN.xml.rels`)**:
   - In `exportCurrentDiagrams(currentPageOnly)`, exporting a single page from a multi-page diagram referenced an uninitialized loop variable `i` (`i + 1 === NaN`), writing `visio/pages/_rels/pageNaN.xml.rels` and declaring non-existent pages in `[Content_Types].xml`.
   - Duplicate page tab names also overwrote each other in the `pages` map. Both are now fixed.

2. **1D Dynamic Connector Detachment & Group Edge Offset**:
   - `createEdge` previously wrote static values for `PinX`, `PinY`, `Width`, `Height`, `LocPinX`, and `LocPinY` without their Master 4 `GUARD(...)` formulas, causing connectors to freeze and detach whenever connected shapes were moved in Visio.
   - Edges inside groups/swimlanes mixed page-level `state.cellBounds` for `PinX`/`PinY` with group-local coordinates for `BeginX`/`BeginY`.
   - Connectors now preserve `GUARD((BeginX+EndX)/2)` / `GUARD(EndX-BeginX)` formulas, express geometry rows in the 1D connector coordinate frame with proportional `Width*...` / `Height*...` formulas, and support `curved=1` edges.

3. **Connection Points (`exitX`/`exitY`, `entryX`/`entryY`) & Group Connections**:
   - Explicit anchor points on edges now generate `<Section N="Connection">` rows on target shapes and bind `BeginX`/`EndX` and `<Connect>` elements to `Connections.X{n}` instead of snapping to the center of the shape.
   - Group outer `<Shape>` elements now retain the primary cell VSDX ID so edges connected to a group bind to the group rather than a colliding `id + "10000"` string.

4. **Rich HTML Text, Character Bitmasks, Paragraph Alignment & Whitespace**:
   - Fixed Character `Style` bitmask bug where bold used `0x11` (17) instead of `0x01` (1) and italic used `0x22` (34) instead of `0x02` (2), and added `<Cell N="Strikethru" V="1"/>` and `<Cell N="Pos" V="1|2"/>` (superscript/subscript).
   - Fixed commented-out `<pp IX="..."/>` and `pIndex++` in `mxVsdxCanvas2D.prototype.text`, which previously emitted duplicate `<Row IX="0">` elements in `<Section N="Paragraph">`.
   - Replaced fragile `this.cellState.text.node.getElementsByTagName('div')[1]` + `window.getComputedStyle` logic (which failed on unrendered pages and failed to detect `font-weight: 700` as bold) with a direct HTML/CSS tree parser.
   - Added missing `xml:space="preserve"` on `<PageContents>` so Visio does not strip spaces between adjacent `<cp/>` text runs.

5. **Text Alignment, Vertical Alignment & Rotated/External Labels**:
   - Added `<Cell N="VerticalAlign" V="0|1|2"/>` on shapes (previously omitted, forcing all labels to vertically center).
   - Fixed `TxtPinX`, `TxtPinY`, `TxtLocPinX`, and `TxtLocPinY` calculation across `left`/`center`/`right` and `top`/`middle`/`bottom` alignments, rotated shapes, `direction=north|south|west` shapes, external labels (`labelPosition` / `verticalLabelPosition`), and 1D edge labels.

6. **Label Background Color (`TextBkgnd`)**:
   - Fixed `//TODO for some reason, visio doesn't show the label (text) background color!` by writing the required `F="RGB(r,g,b)"` formula and `TextBkgndTrans=0` on `TextBkgnd` (without `RGB(...)`, Visio treats `TextBkgnd` as a 1-based palette index).

7. **Multi-Subpath Geometry & Proportional Rectangles**:
   - Shapes calling `moveTo` multiple times before `stroke()` / `fill()` / `fillAndStroke()` previously left earlier `<Section N="Geometry">` elements without `NoFill` and `NoLine` cells, causing open line subpaths to be filled in Visio. All pending geometry sections in a draw operation now receive `NoFill` and `NoLine`.
   - Converted `rect()` from static `MoveTo`/`LineTo` to proportional `RelMoveTo`/`RelLineTo` so rectangles scale properly when resized in Visio.
   - Fixed `direction=north|south` (`isPaintBoundsInverted`) aspect-ratio distortion by using directed bounds for shape `Width`/`Height` and canvas coordinate normalization.

8. **Rounding, Dash Patterns, Arrows, Colors & Images**:
   - Fixed `Rounding` calculation to use draw.io's `getArcSize` formula (and `arcSize / 2` on `rounded=1` edges instead of `edge.geometry.width * 0.1` which was `0`).
   - Added support for `fillColor=default`, `strokeColor=default`, `fontColor=default`, `light-dark(...)`, and 3-digit `#rgb` hex colors.
   - Added missing arrow types (`diamondThin`, `classicThin`, `openThin`, `async`, `circle`, `box`, `cross`, `circlePlus`, `halfCircle`, `doubleBlock`).
   - Added per-page image deduplication (`this.imageMap`) and support for non-base64 SVG data URIs.

---

## Installing in draw.io Desktop (`v32.x+`)

Recent versions of draw.io Desktop removed external plugin loading (`--enable-plugins` is ignored and `isPluginsEnabled` is hardcoded to `false` in `electron.js`). Use [`scripts/patch-desktop-asar.js`](./scripts/patch-desktop-asar.js) to inject the fixed exporter directly into draw.io Desktop's `app.asar` (`PostConfig.js` and `plugins/vsdx.js`):

```bash
# Patch draw.io Desktop (automatically backs up /opt/drawio/resources/app.asar.bak)
sudo "$(which node)" scripts/patch-desktop-asar.js

# To restore the original unpatched app.asar:
sudo "$(which node)" scripts/patch-desktop-asar.js --restore
```

After patching, launch draw.io Desktop normally (no flags required) and use **File → Export as → VSDX...**.

## Testing & Building

```bash
# Run the automated test suite
node test/test-exporter.js

# Rebuild the draw.io bundle (dist/visio-export-plugin.js)
node scripts/build-plugin.js
```
