# Design decisions

A log of the product, visual and engineering choices in FloodLens and why each was made. The case-study framing is in [../CASE_STUDY_NOTES.md](../CASE_STUDY_NOTES.md).

## Layout

- **Desktop: a docked left panel, and Insights cards floating over the map (v0.34).** The left panel is 280 px. The two Insights cards sit over the right of the map with no panel behind them, so the map runs under them and feels less boxed in (review feedback #10). The camera is padded by the cards' width, so the city view, the area chips and "the middle of the map" use the part the cards don't cover; the scale bar and credit stay left of them. History: the cards floated in v0.27–v0.31, were docked on a grey panel to match the left in v0.32–v0.33, and float again from v0.34. Whether the left panel should float too is still open. The Insights width defaults to 380 px (v0.27; 344 before), measured so long titles ("Building near Pennsylvania Avenue", about 364 px) and "Not up to +5 ft" stay on one line. It's resizable: drag its left edge or focus the divider and use the arrow keys (Shift for bigger steps, Home/End for the limits, double-click to reset). It stays between 300 px (the chart and card stay readable) and 560 px, and never squeezes the map below about 420 px. The width is remembered in the browser. Both side panels collapse with edge tabs.
- **Insights is only about what you pick on the map (v0.36).** The right side holds the selected building or spot's card, or a short "Click any building" prompt. The city-wide "Land underwater" card moved to the Sea level card as two figures (owner's spec): one side for the sea level and what it covers, one for the place you picked.
- **Desktop and laptop only (v0.33). FloodLens is made for screens 1024 px wide and up: a map with a panel on each side needs the room. A narrower window scrolls sideways rather than squeezing the map.
- **The legend is a slim vertical colour scale** (bottom-left, v0.34), like the keys in Google Maps: only the sea-level colours, today at the bottom and the top level at the top, with the chosen level in bold. Every level keeps its true colour (v0.18). It shows only with Layered colours (v0.35): with one colour there's nothing to decode. Low spots have no row (v0.35; their switch in "On the map" shows the swatch). It takes the pointer (v0.35), so the map's hand cursor and hover labels don't show through it. The other keys (water, building, selected, city limits) went: the switches in "On the map" already show those swatches, and the box sat in the way (feedback #5). It's a plain key (v0.28): from v0.3 to v0.27 each level was a hover button that spotlighted its band, but the rows looked selectable, did nothing on click, and levels above the slider didn't respond. Spotlighting moved to the chart and its "adds" row, and went with them in v0.36.

## Map composition (`src/lib/mapStyle.ts`, `src/lib/mapLayers.ts`)

Layer stack from bottom to top:

```
background → land cover / land use → [NOAA extent · comparison · low-lying] → water → roads
→ outside-study mask · study boundary → buildings (extruded or footprints) → labels → selection
```

- NOAA overlays sit **beneath basemap water**. Ocean and bay therefore stay "water", and blue appears where NOAA's extent reaches land. The data are unchanged.
- The **outside-study mask** dims everything beyond the city limits, so "no data" is never read as "no flooding".
- **Buildings:** extrusions in 3D, translucent footprints and outlines in 2D, so overlays under buildings stay visible from above.
- **Labels** stay above every overlay and use a white halo for legibility on the blue bands.
- **The sea-level slider stands upright (v0.34):** today at the bottom and +5 ft at the top, so raising it reads as the sea rising (feedback #2). It's still a native range input (vertical writing mode, `aria-orientation="vertical"`), with the level names beside its stops and the big "+2 ft" to its right. v0.34's play button ("Step up to +5 ft") and the (i) note went in v0.35 at the owner's request: the caption "above today's high tide" says what the number means, and "About the data" explains the levels. The slider gives up height on short windows (168 px down to 116 px), so the left panel fits without scrolling in windows down to about 650 px tall, the browser window of a 1366 × 768 laptop (v0.35).
- **Two colour modes (v0.34), Single and Layered (v0.35):** a toggle beside the "Sea level" title (v0.35; in v0.34 a "Colours" row under the slider, named Simple and Detailed, with a caption for each). Single (the default) draws all the water at the chosen level in one blue; Layered gives the area each foot adds its own colour (feedback #9). The owner picked the names from four pairs. The map, the slider track, the chart, the "adds" row and the legend all follow the mode, and the browser remembers it.
- **The land underwater sits beside the slider (v0.36)**, where the big "+2 ft" was (the bold level name on the slider already says the level). It follows the Single / Layered toggle, so the figure always matches what the map's colours mark:
  - Single: "Total submerged area", everything underwater up to the level beyond today's high tide, and its share of the city's land.
  - Layered: "Additional submerged area", only what the level adds to the one below.
  - The added figure is the difference between neighbouring totals (`submergedM2` in `lib/manifest.ts`), not the area of the difference polygons the map draws, so the added figures sum exactly to the total. The two differ by under 1.3% (slivers dropped in processing).
  - Both shares divide by the city's Census land area. At today's high tide both say "None yet".
  - The km² / acres switch sits under the figure. The owner picked this layout over a figure beside every level, which needed an extra row and would have broken the no-scroll fit on short laptops.
  - The low-spot area sits under the Low spots switch while that layer is on ("232 acres at +2 ft"); it's cut off from the sea, so it isn't in the figures. On short windows the slider gives up 16 px for that line.
- **Map controls in one slim column, bottom right (v0.35). From the top: 2D/3D, "Entire Miami Beach", the compass, zoom, so the rest of the map stays clear (the owner found v0.34's controls got in the way: 2D/3D and the house sat top right, and a labelled "Rotate"/"Tilt" panel sat above the compass). In 3D the compass becomes a round dial: arrows above and below the needle tilt the view 10°, arrows either side turn it 30°, and clicking the needle faces north. Reviewers found that people didn't discover tilting and rotating, and some trackpads and mice can't do it (feedback #4, #8), so the moves stay as buttons; the dial says it with arrows instead of a labelled panel. Every map button shows its name in a tooltip on hover and keyboard focus, opening just left of the column so it never covers another button. 2D sits over 3D (v0.36; side by side in v0.35). The column starts 88 px up, 12 px clear of the scale bar (v0.36; at 68 px the zoom-out button covered the bar's top). The full-extent button uses a house again (feedback #6): v0.4 swapped the house for a frame icon because the button fits the city rather than going "home", but people didn't recognise the frame. The house is the usual map symbol for the default view (ArcGIS's Home button), and the tooltip still says what it does.
- **Area chips** (top-left) fly to South Beach, Mid-Beach and North Beach and keep 2D/3D. They're frosted glass (88% white, blurred map behind, a soft shadow; v0.25; flat white with a 1 px border before). The chip you pick fills with the accent straight away (v0.27; a 2 px outline before), not when the camera arrives. Clicking it again, or "Show all", goes back to the whole city with no chip lit; panning by hand hands the highlight back to "nearest area when zoomed in" (by distance to its bookmark, since the areas have no official boundary). A 16 px map gutter is shared with the map controls and legend.
- **Bottom edge:** attribution runs along the very bottom with the scale bar above it on the right, and the legend sits above both on the left, so the three never overlap. The credit is one short line in a fixed order, "© OpenStreetMap · © OpenMapTiles · OpenFreeMap | Flood data: NOAA | Boundary: US Census", and it folds into an (i) button on the first drag (v0.29), as the OSMF attribution guidelines allow; the (i) and the Data sources dialog keep the full credits findable.
- **The opening view fits the city** to the viewport in Web Mercator (tilted 40°, looking north-north-west). Camera controls act on the map, so they belong on it (ArcGIS, komoot, Google Maps). The header keeps only app-level actions (about, sources).
- **Selection highlight** is drawn 0.4 m wider and 0.6 m taller than the clicked building. Coincident faces z-fight (flicker) while zooming.
- **3D picking** follows the view ray through candidate building volumes (`src/lib/buildingPick.ts`), because a roof click unprojects to the ground behind the building.

## Copy

The voice, rules and a before/after table are in [UX_WRITING.md](UX_WRITING.md): plain, calm, honest, brief and human. FloodLens never says a place is "safe" or "will flood".

## Chart

*The chart, its tile and the "adds" row were removed in v0.36 (their figures moved beside the slider). The notes below are kept as history.*

- **A plain one-line title: "Land underwater by sea level"** (v0.13), in semibold with no icon (v0.26), a step below the bold "Land underwater" header. v0.8–v0.12 used a computed finding as the title ("The biggest jump comes at +3 ft") plus a subtitle; in review that was more text than the tile needed. The unit is set by the toggle in the tile above, and screen readers hear it as part of the chart's name.
- **Selection rings the bar, not the column.** The selected level gets a 2 px accent ring with a 2 px gap, matching the selected area chip, plus an accent axis label. A column-wide box reads like a card or a focus box and hides which mark is chosen; a ring on the mark ties the state to the data. Near-zero bars (today, +1 ft) still show a small capsule on the baseline, and the hit target stays the full column so they're easy to click.
- **No fading for levels above the slider**, in the chart, the breakdown or (since v0.18) the map legend, which used to fade them and say "not shown". The numbers hold whatever the slider shows, and faded bars and rows read as disabled. Hovering a band still fades the others, to spotlight it.
- **One unit at a time.** A km² / acres switch at the top of the section sets the unit for the headline, chart (axis, labels, tooltips, subtitle, screen-reader table) and breakdown. It's a segmented control in the Calcite "solid" style: the chosen unit is filled with the accent. It's a radio group, so it's one Tab stop and the arrow keys switch units. The choice is remembered in the browser, and km² is the default.
- **Low spots follow the map.** While the Low spots layer is on, a "Low spots at +N ft" row sits under the breakdown, behind a divider, with the map's purple hatch, and says they're cut off from the sea and not counted above. With the layer off (the default), the row is hidden. v0.9 showed it always; in review it was clutter for something most people leave off.
- **Rounded bar tops (v0.20).** Each bar's top corners are rounded by 4 px (less for near-zero bars, so they don't vanish). The segments are clipped by a rounded rectangle that runs below the baseline, so the bottom stays square.
- **Small level labels (v0.24).** The x-axis labels (Today, +1 ft … +5 ft) are 10 px, the same as the card's level track, with the selected level in bold. The y-axis numbers and the values above the bars stay at 11 px.
- **One tile for the area figures (v0.14).** The summary and the chart share the km² / acres switch, so they share a tile: the figures at the chosen level, a hairline, then the chart and one row with what the selected foot adds (v0.19; it listed every foot before). The chart already shows every level, the map legend explains the colours, and hovering a bar segment gives any foot's increment, so a single row is enough. v0.12–v0.13 used two tiles. The tile has a border and no shadow, so the selected-place card above stays the one floating element.
- **The panel fits without scrolling.** The building card and the area tile fit at 1440×900 with a place selected, in every state (checked by an end-to-end test).
- **No bottom link (v0.26).** "What this map can and can't tell you" was a pinned footer from v0.13 to v0.25; it was removed to give the content the space. "About the data" in the top bar opens the same dialog. There's no visible "Insights" title (v0.11): the card and block headers say what the panel is, and screen readers still get the heading. The summary and the chart are two blocks: full-bleed sections divided by hairlines, each with a small accent icon and a header, like Calcite's Block. They aren't cards, so they don't compete with the selected-place card above them.
  - **Block 1, "Land underwater":** two figures side by side, the area at the chosen level and the share of the city's land, plus the unit switch.
  - **Block 2, the chart:** the chart and the per-foot breakdown.
  - The "What this map can and can't tell you" link was at the bottom from v0.11 to v0.25 (v0.10 had removed it); v0.26 removed it again.
- **Mouse clicks don't focus bars.** The browser's focus outline is for keyboard users; a click selects without leaving it behind.

## Colour

The selected-place card leads with the answer, emphasised, in a light-blue block. The layout takes cues from a reference the designer supplied, but the wording stays FloodLens's own:
- **Answer:** "WATER REACHES AT" on the left and **+3 ft** (24 px, black) on the right of the same row (v0.15), like the facts below it. The other answers are "Today" and, when no mapped level reaches the place, "Up to +5 ft · Doesn't reach it" (v0.30; "Not up to +5 ft" before): the label carries the limit so the plain answer doesn't overclaim, and it fits on one line. No number in the panel is blue: blue is kept for links and selection outlines.
- **Box size:** the box is 316 × 90 px in the default 380 px pane (v0.27; 277 × 90 px at 344 px in v0.23–v0.26; 92 px tall in v0.16–v0.22); it was 277 × 140 px in v0.14 and 277 × 104 px in v0.15. The rows from top to bottom: 8 px padding, the 32 px answer row, a 4 px gap, the 18 px water band, a 6 px gap, 16 px pin labels and 6 px padding. The 6 px above the pin labels can't shrink further: the larger blue pin would run into its label.
- **Level track:** below the answer (see below).
- **Facts:** one column. A building lists Height, Footprint and Low spot; a spot or open water lists only Low spot (v0.34, feedback #13). From v0.13 to v0.33 Height and Footprint always showed, with "—" for a spot; reviewers found the empty rows confusing. Footprint has a plot-of-land icon and Low spot an arrow down to a line (v0.34): the old scan frame and mountain didn't say "ground area" or "below the water line".
- **Position:** a chip with the position. The distance to the street was dropped in v0.12: the title already names the street, and the distance says nothing about water.

The **level track** works like this:
- **Labels:** each sea level is labelled along a baseline in 10 px type, with no circles (v0.22–v0.23). The first level that reaches the place has a bold label.
- **Water:** a light-blue band rises in a gentle S from the left and stops at the first level that reaches the place. A dashed line, topped by a small dot, drops from its surface to the baseline at that level. When no level reaches the place, the water runs to the end with no marker.
- **Schematic:** the shape is not a depth, so it's hidden from screen readers; the pins are a list that says, for each level, whether water reaches the place.

v0.4–v0.10 drew a house on rising streams of water instead. v0.11 put the answer in a row with a simpler pin track. v0.12 made it the large lead again. v0.13 kept that layout but went back to v0.11's wording and dropped the details lifted straight from the reference (status labels under every pin, a supporting sentence and a copy button).

| Role | Colour | Notes |
| --- | --- | --- |
| Basemap | land `#f1eee8`, parks `#d5e7c6`, water `#a8dcea`, roads white | Light "streets / topographic" palette in the spirit of ArcGIS basemaps. Water is a fresh light aqua: livelier than grey-blue, and greener in hue than the azure flood ramp so it stays distinct (OKLab ΔE 22 from the +1 ft band) |
| Flood, Single colours (default, v0.34) | `#3d84e6`, 85% | One blue for all the water at the chosen level, spreading as the sea rises (feedback #9). At least OKLab ΔE 20 from water, parks, buildings, land and the selection, for normal and colour-blind vision |
| Flood bands, Layered colours ("first reached at") | today `#dceff5` · +1 `#a6d8ed` · +2 `#6db6db` · +3 `#338ec4` · +4 `#1766a1` · +5 `#083b75`, 85% (v0.35) | The owner's colours for +1 to +5 ft (v0.35); today is a lighter tint of the same blue. Light → dark as the water rises (more water reads as darker). Measured at 85% over the land, the closest neighbouring pair is ΔE 10.0 for normal vision and 9.1 for colour-blind vision (Machado 2009 simulation), about the same as v0.34's ramp. Known trade-offs: +1 ft is almost the basemap's water colour (ΔE 1), and today is close to the land (ΔE about 3); both bands are small (today covers no land in the city, +1 ft adds 0.038 km²). v0.34: sky blue through royal blue to indigo, `#80cffd` → `#1c0b4d` (ΔE 10.1 and 9.3), picked because reviewers couldn't tell the v0.17 blues apart (feedback #1). v0.17–v0.33: one blue hue, `#9ec5f4` → `#022555`. v0.6 tried a viridis-style ramp (lime → indigo); in review the blues read better as water |
| Buildings | sandstone `#f0e6d6` → `#e3d3bb` by height | A light, warm stone colour (a nod to Miami Beach's Art Deco stucco): the complementary hue to the blue ramp, so buildings read clearly on every band without the heaviness of grey |
| Low-lying (unconnected) | `#6b35aa`, diagonal hatch + dashed outline | Pattern carries the meaning without colour |
| Selection | vermilion `#e8452c` building / ring, outline `#9e2410` | A colour no data layer uses, so the selection is unmistakable; the card's icon repeats it to link card and map. Chosen in v0.20 from four measured options: its worst-case OKLab ΔE against every map colour (water, all six flood blues, buildings, land, parks, low spots, roads) is 21 for normal and colour-blind vision. Orange, before, was 18; magenta collapsed to 8 against the +3 ft blue for protanopia |
| Panels | canvas `#f1f3f6`, white cards with a faint ring and soft shadow (no border), stat tiles `#f3f6fa` | Both side panels sit on a light grey canvas so their contents read as cards (v0.20); the hard borders gave way to soft shadows in v0.25, for a calmer, more premium finish. The two figures in the area tile each get a soft filled stat tile with no border, so the borders don't nest |
| Study area | dashed `#3d4655`; outside washed with 50% white | Reads as a boundary, not data |
| UI accent | `#0069b0` (Esri/Calcite-style blue) | Interaction, focus, selected states; 5.0–5.8:1 on all surfaces |
| UI surfaces | white panels, `#f1f3f6` canvas, frosted glass for the area chips, map controls and the vertical colour scale (88% white; the old legend box was solid white, v0.26) | Calcite-like light chrome. On glass, secondary text is `#575757` so it keeps 4.5:1 over the darkest flood blue; *reduce transparency* makes it solid |

Map and UI colours live in `src/lib/theme.ts` and the CSS tokens in `src/styles/index.css`. Legend swatches render from the same values.

## Motion

- The scenario swap fades the overlay in over 450 ms from 12% opacity. The comparison overlay has no animation.
- 2D/3D uses `easeTo` (900 ms); reset uses `flyTo` (1.4 s).
- `prefers-reduced-motion` turns these into instant `jumpTo` / `setData` updates, disables chart transitions and collapses CSS animations.

## Typography

**Satoshi** for the interface (since v0.7): a geometric sans by Indian Type Foundry with a friendlier, more contemporary feel than Roboto, with tabular figures and every symbol FloodLens uses (≈, ², °, →). It's free under the ITF Free Font License, which allows use on your own site but not redistributing the files (for example in a public repository) or converting them. So the app loads it from Fontshare, ITF's official web-font service, and the font files never enter this repo. If Fontshare can't be reached, the UI falls back to the system sans.

Map labels stay in **Roboto** (Regular, Medium and Italic SDF glyphs self-hosted in `public/fonts/`, because OpenFreeMap only serves Noto Sans). MapLibre needs fonts converted to SDF glyph files, and Satoshi's licence doesn't allow format conversion. Roboto's open shapes also hold up better at 10–12 px over a busy map.

Type scale (classes in `src/styles/index.css`): `t-display` 36/700 (sea level) · `t-metric` 28/500 (headline number) · `t-title` 16/500 (the wordmark and panel titles are bold) · `t-heading` 14/700 · `t-label` 13/500 · `t-body` 13/400 · `t-caption` 12/400 · `t-overline` 10.5/700 uppercase, 0.09em tracking. Tabular numerals for all quantities.

**Bolder hierarchy (v0.25).** Titles and the key numbers (the sea level, the card's answer and the two figures) are bold with tighter tracking (−0.03em on large numbers), so the eye lands on them first. Body text stays regular, so bold keeps its meaning. Satoshi loads as a variable font (300–900), so semibold (600) is a real, lighter weight: the card's title and "Land underwater" moved from 600 to bold in v0.26, and the chart title stays at 600.

**Card facts.** The values are 20 px (v0.26). The labels (Height, Footprint, Low spot) are 14 px medium (v0.27; 16 px regular in v0.26), and "Water reaches at" matches them: sentence case, 14 px medium, black (v0.27; a grey uppercase overline before).

## Engineering

- **State:** one reducer (`src/state/reducer.ts`) covers scenario, comparison, layers, view mode, selection, dialogs, panels and camera tokens. Transitions are pure and unit-tested. For example, picking a scenario equal to the comparison partner re-selects a valid partner.
- **Data loading:** the manifest is fetched and validated once, then `useCollection` lazy-loads each GeoJSON. It keeps the previous data visible while the next file loads and caches files per session. Failures are surfaced, never hidden.
- **MapView** is the only module that calls MapLibre. Long-lived event handlers read from a `live` ref, so React state changes never re-bind them.
- **Geometry:** offline in Python/GEOS (clip, repair, difference, simplify, geodesic area). In the browser, Turf handles only point-in-polygon and footprint intersection for inspection.
- **Basemap resilience:** if the style fetch fails, a plain fallback style still renders NOAA overlays, with a visible warning.
