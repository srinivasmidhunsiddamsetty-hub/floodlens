# Design decisions

A log of the product, visual and engineering choices in FloodLens and why each was made. The case-study framing is in [../CASE_STUDY_NOTES.md](../CASE_STUDY_NOTES.md).

## Layout

- **Three docked regions on desktop.** The left panel is 280 px. The Insights pane is resizable: drag its left edge or focus the divider and use the arrow keys (Shift for bigger steps, Home/End for the limits, double-click to reset). It stays between 300 px (the chart and card stay readable) and 560 px, and never squeezes the map below about 420 px. The width is remembered in the browser. Both side panels collapse with edge tabs.
- **Below 1024 px** the controls become a left drawer with a scrim (inert when closed). The insights become a bottom sheet with a 64 px peek showing the scenario and headline number. Selecting a location opens the sheet automatically.
- **The legend floats over the map** (bottom-left) and lists only what is currently drawn.

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
- **Map controls live in the map** (top-right): zoom, compass / show all of Miami Beach, then 2D/3D. The full-extent control uses a frame (focus) icon, not a house: it fits the whole city into view rather than going "home".
- **Area chips** (top-left) fly to South Beach, Mid-Beach and North Beach and keep 2D/3D. They're flat (white, 1 px border, no shadow or tint). The chip you pick turns accent blue with a 2 px border straight away, not when the camera arrives; panning by hand hands the highlight back to "nearest area when zoomed in" (by distance to its bookmark, since the areas have no official boundary). A 16 px map gutter is shared with the map controls and legend.
- **Bottom edge:** attribution runs along the very bottom with the scale bar above it on the right, and the legend sits above both on the left, so the three never overlap. Below 1024 px the controls lift above the insights sheet.
- **The opening view fits the city** to the viewport in Web Mercator (tilted 40°, looking north-north-west), accounting for the mobile bottom sheet. Camera controls act on the map, so they belong on it (ArcGIS, komoot, Google Maps). The header keeps only app-level actions (about, sources).
- **Selection highlight** is drawn 0.4 m wider and 0.6 m taller than the clicked building. Coincident faces z-fight (flicker) while zooming.
- **3D picking** follows the view ray through candidate building volumes (`src/lib/buildingPick.ts`), because a roof click unprojects to the ground behind the building.

## Copy

The voice, rules and a before/after table are in [UX_WRITING.md](UX_WRITING.md): plain, calm, honest, brief and human. FloodLens never says a place is "safe" or "will flood".

## Chart

- **A plain one-line title: "Land underwater by sea level"** (v0.13), styled like the "Land underwater" tile's header. v0.8–v0.12 used a computed finding as the title ("The biggest jump comes at +3 ft") plus a subtitle; in review that was more text than the tile needed. The unit is set by the toggle in the tile above, and screen readers hear it as part of the chart's name.
- **Selection rings the bar, not the column.** The selected level gets a 2 px accent ring with a 2 px gap, matching the selected area chip, plus an accent axis label. A column-wide box reads like a card or a focus box and hides which mark is chosen; a ring on the mark ties the state to the data. Near-zero bars (today, +1 ft) still show a small capsule on the baseline, and the hit target stays the full column so they're easy to click.
- **No fading for levels above the slider**, in the chart, the breakdown or (since v0.18) the map legend, which used to fade them and say "not shown". The numbers hold whatever the slider shows, and faded bars and rows read as disabled. Hovering a band still fades the others, to spotlight it.
- **One unit at a time.** A km² / acres switch at the top of the section sets the unit for the headline, chart (axis, labels, tooltips, subtitle, screen-reader table) and breakdown. It's a segmented control in the Calcite "solid" style: the chosen unit is filled with the accent. It's a radio group, so it's one Tab stop and the arrow keys switch units. The choice is remembered in the browser, and km² is the default.
- **Low spots follow the map.** While the Low spots layer is on, a "Low spots at +N ft" row sits under the breakdown, behind a divider, with the map's purple hatch, and says they're cut off from the sea and not counted above. With the layer off (the default), the row is hidden. v0.9 showed it always; in review it was clutter for something most people leave off.
- **Rounded bar tops (v0.20).** Each bar's top corners are rounded by 4 px (less for near-zero bars, so they don't vanish). The segments are clipped by a rounded rectangle that runs below the baseline, so the bottom stays square.
- **One tile for the area figures (v0.14).** The summary and the chart share the km² / acres switch, so they share a tile: the figures at the chosen level, a hairline, then the chart and one row with what the selected foot adds (v0.19; it listed every foot before). The chart already shows every level, the map legend explains the colours, and hovering a bar segment gives any foot's increment, so a single row is enough. v0.12–v0.13 used two tiles. The tile has a border and no shadow, so the selected-place card above stays the one floating element.
- **The panel fits without scrolling.** The building card and the area tile fit at 1440×900 with a place selected, in every state (checked by an end-to-end test).
- **"What this map can and can't tell you" is a pinned footer** (v0.13). It always sits at the bottom edge of the panel, whatever is above it. Before, it was the last item in the scrolling content, so it rose up the panel whenever the content got shorter. There's no visible "Insights" title (v0.11): the card and block headers say what the panel is, and screen readers still get the heading. The summary and the chart are two blocks: full-bleed sections divided by hairlines, each with a small accent icon and a header, like Calcite's Block. They aren't cards, so they don't compete with the selected-place card above them.
  - **Block 1, "Land underwater":** two figures side by side, the area at the chosen level and the share of the city's land, plus the unit switch.
  - **Block 2, the chart:** the chart and the per-foot breakdown.
  - The "What this map can and can't tell you" link stays at the bottom, as the contextual way into the limitations (v0.10 removed it; v0.11 brought it back).
- **Mouse clicks don't focus bars.** The browser's focus outline is for keyboard users; a click selects without leaving it behind.

## Colour

The selected-place card leads with the answer, emphasised, in a light-blue block. The layout takes cues from a reference the designer supplied, but the wording stays FloodLens's own:
- **Answer:** "WATER REACHES AT" on the left and **+3 ft** (24 px, black) on the right of the same row (v0.15), like the facts below it. The other answers are "Today" and "Not up to +5 ft"; the last is too wide for the row, so it wraps under the label. No number in the panel is blue: blue is kept for links and selection outlines.
- **Box size:** the box is 277 × 90 px in the default 344 px pane (v0.23; 92 px in v0.16–v0.22); it was 277 × 140 px in v0.14 and 277 × 104 px in v0.15. The rows from top to bottom: 8 px padding, the 32 px answer row, a 4 px gap, the 18 px water band, a 6 px gap, 16 px pin labels and 6 px padding. The 6 px above the pin labels can't shrink further: the larger blue pin would run into its label.
- **Level track:** below the answer (see below).
- **Facts:** Height, Footprint and Low spot follow in one column. Height and footprint always show, with "—" when the click isn't on a building (v0.13); before, those rows disappeared for open ground and water.
- **Position:** a chip with the position. The distance to the street was dropped in v0.12: the title already names the street, and the distance says nothing about water.

The **level track** works like this:
- **Labels:** each sea level is labelled along a baseline in 10 px type, with no circles (v0.22–v0.23). The first level that reaches the place has a bold label.
- **Water:** a light-blue band rises in a gentle S from the left and stops at the first level that reaches the place. A dashed line, topped by a small dot, drops from its surface to the baseline at that level. When no level reaches the place, the water runs to the end with no marker.
- **Schematic:** the shape is not a depth, so it's hidden from screen readers; the pins are a list that says, for each level, whether water reaches the place.

v0.4–v0.10 drew a house on rising streams of water instead. v0.11 put the answer in a row with a simpler pin track. v0.12 made it the large lead again. v0.13 kept that layout but went back to v0.11's wording and dropped the details lifted straight from the reference (status labels under every pin, a supporting sentence and a copy button).

| Role | Colour | Notes |
| --- | --- | --- |
| Basemap | land `#f1eee8`, parks `#d5e7c6`, water `#a8dcea`, roads white | Light "streets / topographic" palette in the spirit of ArcGIS basemaps. Water is a fresh light aqua: livelier than grey-blue, and greener in hue than the azure flood ramp so it stays distinct (OKLab ΔE 22 from the +1 ft band) |
| Flood bands ("first reached at") | today `#9ec5f4` · +1 `#67a3ea` · +2 `#3d80d2` · +3 `#1f5fae` · +4 `#104180` · +5 `#022555`, 85% | One blue hue, light → dark as the water rises: more water reads as darker. Six steps (v0.17) evenly spaced in OKLab lightness (0.81 → 0.27) from the same light blue to a dark navy, so lightness alone carries the order (greyscale and colour-vision safe; worst neighbouring pair ΔE 10.5 for deuteranopia). Keeping the v0.7 four shades and adding two darker ones would have ended near black. v0.6 tried a viridis-style ramp (lime → indigo); in review the blues read better as water |
| Buildings | sandstone `#f0e6d6` → `#e3d3bb` by height | A light, warm stone colour (a nod to Miami Beach's Art Deco stucco): the complementary hue to the blue ramp, so buildings read clearly on every band without the heaviness of grey |
| Low-lying (unconnected) | `#6b35aa`, diagonal hatch + dashed outline | Pattern carries the meaning without colour |
| Selection | vermilion `#e8452c` building / ring, outline `#9e2410` | A colour no data layer uses, so the selection is unmistakable; the card's icon repeats it to link card and map. Chosen in v0.20 from four measured options: its worst-case OKLab ΔE against every map colour (water, all six flood blues, buildings, land, parks, low spots, roads) is 21 for normal and colour-blind vision. Orange, before, was 18; magenta collapsed to 8 against the +3 ft blue for protanopia |
| Panels | canvas `#f3f3f3`, white tiles with a `#e0e0e0` border, stat tiles `#f3f6fa` | Both side panels sit on a light grey canvas so their contents read as cards (v0.20). The two figures in the area tile each get a soft filled stat tile with no border, so the borders don't nest |
| Study area | dashed `#3d4655`; outside washed with 50% white | Reads as a boundary, not data |
| UI accent | `#0069b0` (Esri/Calcite-style blue) | Interaction, focus, selected states; 5.0–5.8:1 on all surfaces |
| UI surfaces | white panels, `#f3f3f3` canvas, `#e0e0e0` borders | Calcite-like light chrome |

Map and UI colours live in `src/lib/theme.ts` and the CSS tokens in `src/styles/index.css`. Legend swatches render from the same values.

## Motion

- The scenario swap fades the overlay in over 450 ms from 12% opacity. The comparison overlay has no animation.
- 2D/3D uses `easeTo` (900 ms); reset uses `flyTo` (1.4 s).
- `prefers-reduced-motion` turns these into instant `jumpTo` / `setData` updates, disables chart transitions and collapses CSS animations.

## Typography

**Satoshi** for the interface (since v0.7): a geometric sans by Indian Type Foundry with a friendlier, more contemporary feel than Roboto, with tabular figures and every symbol FloodLens uses (≈, ², °, →). It's free under the ITF Free Font License, which allows use on your own site but not redistributing the files (for example in a public repository) or converting them. So the app loads it from Fontshare, ITF's official web-font service, and the font files never enter this repo. If Fontshare can't be reached, the UI falls back to the system sans.

Map labels stay in **Roboto** (Regular, Medium and Italic SDF glyphs self-hosted in `public/fonts/`, because OpenFreeMap only serves Noto Sans). MapLibre needs fonts converted to SDF glyph files, and Satoshi's licence doesn't allow format conversion. Roboto's open shapes also hold up better at 10–12 px over a busy map.

Type scale (classes in `src/styles/index.css`): `t-display` 36/500 (sea level) · `t-metric` 28/500 (headline number) · `t-title` 16/500 (panel titles) · `t-heading` 14/500 · `t-label` 13/500 · `t-body` 13/400 · `t-caption` 12/400 · `t-overline` 11/500 uppercase. Tabular numerals for all quantities.

## Engineering

- **State:** one reducer (`src/state/reducer.ts`) covers scenario, comparison, layers, view mode, selection, dialogs, panels and camera tokens. Transitions are pure and unit-tested. For example, picking a scenario equal to the comparison partner re-selects a valid partner.
- **Data loading:** the manifest is fetched and validated once, then `useCollection` lazy-loads each GeoJSON. It keeps the previous data visible while the next file loads and caches files per session. Failures are surfaced, never hidden.
- **MapView** is the only module that calls MapLibre. Long-lived event handlers read from a `live` ref, so React state changes never re-bind them.
- **Geometry:** offline in Python/GEOS (clip, repair, difference, simplify, geodesic area). In the browser, Turf handles only point-in-polygon and footprint intersection for inspection.
- **Basemap resilience:** if the style fetch fails, a plain fallback style still renders NOAA overlays, with a visible warning.
