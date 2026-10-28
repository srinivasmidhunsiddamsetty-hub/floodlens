# Design decisions

A log of the product, visual and engineering choices in FloodLens and why each was made. The case-study framing is in [../CASE_STUDY_NOTES.md](../CASE_STUDY_NOTES.md).

## Layout

- **Three docked regions on desktop** (left 288–304 px, right 320–340 px). Both side panels collapse with edge tabs, giving the map the full width when users want it.
- **Below 1024 px** the controls become a left drawer with a scrim (inert when closed). The insights become a bottom sheet with a 64 px peek showing the scenario and headline number. Selecting a location opens the sheet automatically.
- **The legend floats over the map** (bottom-left) and lists only what is currently drawn.

## Map composition (`src/lib/mapStyle.ts`, `src/lib/mapLayers.ts`)

Layer stack from bottom to top:

```
background → land cover / land use → [NOAA extent · comparison · low-lying] → water → roads
→ outside-study mask · study boundary → buildings (extruded or footprints) → labels → selection
```

- NOAA overlays sit **beneath basemap water**. Ocean and bay therefore stay "water", and blue appears where NOAA's extent reaches land. The data are unchanged.
- The **outside-study mask** dims everything beyond the processed rectangle, so "no data" is never read as "no flooding".
- **Buildings:** extrusions in 3D, translucent footprints and outlines in 2D, so overlays under buildings stay visible from above.
- **Labels** stay above every overlay and use a white halo for legibility on the blue bands.
- **Map controls live in the map** (top-right): zoom, compass/Home, then 2D/3D. Camera controls act on the map, so they belong on it (ArcGIS, komoot, Google Maps). The header keeps only app-level actions (about, sources).
- **Selection highlight** is drawn 0.4 m wider and 0.6 m taller than the clicked building. Coincident faces z-fight (flicker) while zooming.
- **3D picking** follows the view ray through candidate building volumes (`src/lib/buildingPick.ts`), because a roof click unprojects to the ground behind the building.

## Colour

| Role | Colour | Notes |
| --- | --- | --- |
| Basemap | land `#f1eee8`, parks `#d5e7c6`, water `#a9cbe8`, roads white | Light "streets / topographic" palette in the spirit of ArcGIS basemaps; low saturation so data overlays lead |
| Flood bands ("first reached at") | today `#14307a` · +1 `#1f5fd0` · +2 `#3a97e8` · +3 `#4cc9d6`, 85% | Sequential ramp: darker = reached at a lower level (most exposed, deepest later). Lightness carries the order, so it works in greyscale. The hue drifts to aqua so the lightest band never matches the pale water `#b3cde3` |
| Buildings | taupe `#b4ada3` → `#8f877c` by height | Darker than land and a different hue from water, so buildings separate cleanly from flood colour |
| Low-lying (unconnected) | `#6b35aa`, diagonal hatch + dashed outline | Pattern carries the meaning without colour |
| Selection | orange `#ff8a1f` building / ring | A colour no data layer uses, so the selection is unmistakable |
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
