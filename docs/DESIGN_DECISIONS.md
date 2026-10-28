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
- **Area chips** (top-left) fly to South Beach, Mid-Beach and North Beach and keep 2D/3D. When zoomed in, the nearest area's chip is highlighted (by distance to its bookmark, not a boundary, since none is official). v0.5 tried a locator mini-map here; the chips read more clearly, so v0.6 returned to them with roomier padding and a 16 px map gutter shared with the map controls and legend.
- **Bottom edge:** attribution runs along the very bottom with the scale bar above it on the right, and the legend sits above both on the left, so the three never overlap. Below 1024 px the controls lift above the insights sheet.
- **The opening view fits the city** to the viewport in Web Mercator (tilted 40°, looking north-north-west), accounting for the mobile bottom sheet. Camera controls act on the map, so they belong on it (ArcGIS, komoot, Google Maps). The header keeps only app-level actions (about, sources).
- **Selection highlight** is drawn 0.4 m wider and 0.6 m taller than the clicked building. Coincident faces z-fight (flicker) while zooming.
- **3D picking** follows the view ray through candidate building volumes (`src/lib/buildingPick.ts`), because a roof click unprojects to the ground behind the building.

## Colour

The selected-place card draws water as one stream per foot in the same ramp colours as the map and chart, so a building first reached at +3 ft shows three streams rising to it. The card's level gauge uses the same colours, so it doubles as a legend.

| Role | Colour | Notes |
| --- | --- | --- |
| Basemap | land `#f1eee8`, parks `#d5e7c6`, water `#a8dcea`, roads white | Light "streets / topographic" palette in the spirit of ArcGIS basemaps. Water is a fresh light aqua: livelier than grey-blue, and greener in hue than the azure flood ramp so it stays distinct (OKLab ΔE 22 from the +1 ft band) |
| Flood bands ("first reached at") | today `#bddf26` · +1 `#36b874` · +2 `#108b9b` · +3 `#3f4aa0`, 85% | Multi-hue sequential after matplotlib's viridis: lime → green → teal → indigo, darker as the water rises. Lightness carries the order (greyscale-safe); the hue change separates neighbouring levels better than v0.4–v0.5's single blue (worst adjacent OKLab ΔE 16.5 vs 14.4, colour-vision checks pass). Teal and green are a little more saturated than viridis so they don't read grey. Today's lime is light against land, but it sits mostly under water and is always labelled |
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

Roboto everywhere. The UI uses Roboto Variable (self-hosted through `@fontsource-variable/roboto`, no external font request). Map labels use Roboto Regular, Medium and Italic SDF glyphs self-hosted in `public/fonts/`, because OpenFreeMap only serves Noto Sans glyphs.

Type scale (classes in `src/styles/index.css`): `t-display` 36/500 (sea level) · `t-metric` 28/500 (headline number) · `t-title` 16/500 (panel titles) · `t-heading` 14/500 · `t-label` 13/500 · `t-body` 13/400 · `t-caption` 12/400 · `t-overline` 11/500 uppercase. Tabular numerals for all quantities.

## Engineering

- **State:** one reducer (`src/state/reducer.ts`) covers scenario, comparison, layers, view mode, selection, dialogs, panels and camera tokens. Transitions are pure and unit-tested. For example, picking a scenario equal to the comparison partner re-selects a valid partner.
- **Data loading:** the manifest is fetched and validated once, then `useCollection` lazy-loads each GeoJSON. It keeps the previous data visible while the next file loads and caches files per session. Failures are surfaced, never hidden.
- **MapView** is the only module that calls MapLibre. Long-lived event handlers read from a `live` ref, so React state changes never re-bind them.
- **Geometry:** offline in Python/GEOS (clip, repair, difference, simplify, geodesic area). In the browser, Turf handles only point-in-polygon and footprint intersection for inspection.
- **Basemap resilience:** if the style fetch fails, a plain fallback style still renders NOAA overlays, with a visible warning.
