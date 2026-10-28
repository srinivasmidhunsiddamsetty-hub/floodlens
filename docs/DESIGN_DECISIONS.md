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

- **Title states the finding, subtitle the measure and place**, following the [ONS](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text) and [GOV.UK](https://brand.design-system.service.gov.uk/data/charts) chart guidance. The finding is computed (`chartTitle`): it names a level only when that foot adds more than half the land and at least twice any other foot.
- **Selection rings the bar, not the column.** The selected level gets a 2 px accent ring with a 2 px gap, matching the selected area chip, plus an accent axis label. A column-wide box reads like a card or a focus box and hides which mark is chosen; a ring on the mark ties the state to the data. Near-zero bars (today, +1 ft) still show a small capsule on the baseline, and the hit target stays the full column so they're easy to click.
- **No fading for levels above the slider.** The numbers hold whatever the slider shows, and faded bars and rows read as disabled. Hovering a band still fades the others, to spotlight it.
- **Mouse clicks don't focus bars.** The browser's focus outline is for keyboard users; a click selects without leaving it behind.

## Colour

The selected-place card draws water as one stream per foot in the same ramp colours as the map and chart, so a building first reached at +3 ft shows three streams rising to it. The card's level gauge uses the same colours, so it doubles as a legend.

| Role | Colour | Notes |
| --- | --- | --- |
| Basemap | land `#f1eee8`, parks `#d5e7c6`, water `#a8dcea`, roads white | Light "streets / topographic" palette in the spirit of ArcGIS basemaps. Water is a fresh light aqua: livelier than grey-blue, and greener in hue than the azure flood ramp so it stays distinct (OKLab ΔE 22 from the +1 ft band) |
| Flood bands ("first reached at") | today `#9ec5f4` · +1 `#5598e7` · +2 `#256abf` · +3 `#104281`, 85% | One blue hue, light → dark as the water rises: more water reads as darker. Evenly spaced steps (200/350/500/650) of a validated sequential blue scale, so lightness alone carries the order (greyscale and colour-vision safe). v0.6 tried a viridis-style ramp (lime → indigo) for more hue contrast; in review the blues read better as water, so v0.7 restored them |
| Buildings | sandstone `#f0e6d6` → `#e3d3bb` by height | A light, warm stone colour (a nod to Miami Beach's Art Deco stucco): the complementary hue to the blue ramp, so buildings read clearly on every band without the heaviness of grey |
| Low-lying (unconnected) | `#6b35aa`, diagonal hatch + dashed outline | Pattern carries the meaning without colour |
| Selection | orange `#ff7417` building / ring | A colour no data layer uses, so the selection is unmistakable; the card's icon tile repeats it to link card and map |
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
