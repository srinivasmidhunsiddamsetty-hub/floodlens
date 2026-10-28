# FloodLens

**See the coastline. Understand the exposure.**

FloodLens is an exploratory 3D map for comparing NOAA sea-level-rise inundation scenarios across the City of Miami Beach, Florida. It brings scenario selection, mapped inundation extents, the built environment, scenario comparison and plain-language data caveats together on one screen, so a resilience planner can screen geographic exposure without opening desktop GIS software.

> Independent product design and engineering portfolio concept. Not affiliated with, sponsored by, or endorsed by NOAA, Esri, OpenFreeMap, OpenMapTiles, OpenStreetMap or the City of Miami Beach.

![FloodLens overview — the City of Miami Beach at +2 ft](docs/screenshots/01-overview-2ft-3d.png)

| South Beach in 3D with a building selected | +3 ft, spotlighting what +2 ft adds |
| --- | --- |
| ![Building card](docs/screenshots/08-south-beach-building-card.png) | ![Flood bands](docs/screenshots/02-bands-3ft-spotlight-2ft.png) |

Version history with screenshots of each iteration: [CHANGELOG.md](CHANGELOG.md).

---

## Features

- **Real NOAA data.** Ocean-connected inundation polygons from the NOAA Office for Coastal Management Sea Level Rise Viewer data (FL_SE GeoPackage) for 0 ft (current MHHW), +1 ft, +2 ft and +3 ft, clipped to the City of Miami Beach boundary (US Census Bureau TIGER/Line; 39.4 km² including Biscayne Bay waters inside city limits). Nothing is simulated.
- **3D map (MapLibre GL JS).** A light, ArcGIS-style geographic basemap (OpenFreeMap Positron, restyled) with Roboto labels. Buildings are extruded from OpenStreetMap heights, and the overlay draws beneath basemap water so mapped inundation reads as "water reaching land".
- **Sea-level control.** A keyboard-operable slider (native range input) whose track is painted with the map's colour ramp, plus **Play the rise** to animate today → +3 ft. Levels swap in place, so the camera and app state are preserved.
- **Flood bands by water level.** Each area is coloured by the level at which NOAA's mapped extent first reaches it, in one blue hue that darkens as the water rises (lightest = today, darkest navy = +3 ft), so one map shows how flooding spreads. The bands come from validated polygon differences computed offline. Hover a level in the legend, chart or breakdown to spotlight it.
- **In-map controls.** Zoom, compass, **Show all of Miami Beach** (fits the whole city back into view) and 2D/3D sit together inside the map, ArcGIS-style. Tilting the map by hand keeps 2D/3D in sync.
- **Area bookmarks.** South Beach, Mid-Beach and North Beach chips fly the camera along the 12 km city, keeping the current 2D/3D mode. They only move the camera; no statistics are invented for these unofficial areas.
- **Insights.** A headline number (area flooded beyond today's high tide, in km² and acres, and as a share of the city's Census land area), a stacked D3 chart of growth per foot, and a breakdown of what each foot adds, with tooltips, keyboard focus and a screen-reader table.
- **Building and location inspection.** Click any building (3D-accurate picking) or place, or focus the map and press Enter. A card shows the first water level that reaches it (with an illustration of the water at that level), a level-by-level gauge, OSM height and footprint area, and whether it sits in a low-lying area. If the slider is below that level, one click shows it on the map. Esc clears it.
- **Optional low-lying areas.** Hydrologically unconnected low areas are processed as a separate purple-hatched layer and are never merged with ocean-connected extents.
- **Honest states.** Loading, missing-file and missing-manifest states are explicit. If data are unavailable, FloodLens shows nothing rather than an estimate.
- **Responsive and accessible.** Three columns on desktop. Below 1024 px the controls become a drawer and the insights a bottom sheet. Keyboard operable throughout, with visible focus, reduced-motion support and text alternatives.

## Tech stack

React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS 4 · MapLibre GL JS 5 · D3 7 · Turf 7 · Lucide icons.
Data pipeline: Python 3.9+ with Shapely 2, pyproj, pyogrio (bundled GDAL).
Tests: Vitest + Testing Library (unit and component), Playwright with the locally installed Chrome (end-to-end).

## Getting started

```bash
npm install
npm run dev            # http://localhost:5173
```

The processed data in `public/data/noaa/` are committed, so the app runs without the data pipeline.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript only |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright; builds and serves `dist/` automatically; needs Google Chrome installed) |
| `npm run screenshots` | Regenerate `docs/screenshots/` |
| `npm run data:prepare` | Re-run the NOAA data pipeline (see below) |

### Re-creating the data

```bash
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install -r scripts/requirements.txt
scripts/.venv/bin/python scripts/prepare_noaa_slr.py --cache-dir ~/.cache/floodlens
```

The script downloads `FL_SE_slr_data_dist.zip` (977 MB; resumable, cached) and extracts the 4.1 GB GeoPackage, plus the Census TIGER/Line Florida places file (7 MB) for the city boundary. It then reads only the features that intersect the study area, so processing takes about a minute. Use `--gpkg /path/to/FL_SE_slr_final_dist.gpkg` to skip the download. Keep the cache outside synced folders such as iCloud Documents. See [DATA_SOURCES.md](DATA_SOURCES.md) for every step.

## Project structure

```
src/
  components/
    map/          MapView (MapLibre lifecycle, layers, interactions), MapControls, AreaBookmarks, MapLegend, MapStatus
    controls/     ControlPanel, ScenarioSelector
    insights/     InsightPanel, InspectionCard, FloodIllustration
    charts/       ScenarioAreaChart (D3)
    dialogs/      AboutDataDialog, DataSourcesDialog
    layout/       TopBar, BrandMark
    ui/           Switch, Segmented, Dialog, Swatch
  hooks/          useManifest, useCollection, useMapData, useInspection, useMediaQuery
  lib/            manifest parsing, GeoJSON loading, geo maths, map style + layers, formatting, theme
  state/          reducer + context (scenario, layers, view mode, comparison, selection)
  types/          data-manifest types
scripts/          prepare_noaa_slr.py (+ requirements.txt)
public/data/noaa/ processed GeoJSON + manifest.json
tests/e2e/        Playwright specs
docs/             design decisions, limitations, quality report, screenshots
```

Rendering and geography are kept apart from the UI. `lib/` holds pure functions with unit tests, MapView owns every MapLibre call, and the panels read a single typed reducer.

## Data and limitations, in brief

- Scenarios are **water levels above Mean Higher High Water (MHHW)**, not dates or forecasts.
- NOAA describes the data as a **screening-level** tool. They show the scale, not the exact location, of potential inundation, and do not model storm surge, erosion, subsidence or future construction.
- Extent polygons carry **no depth information**, and FloodLens shows none.
- "Within the mapped extent" is **not** a statement that a property or building will flood.
- Building heights come from OpenStreetMap through OpenMapTiles. Some are estimates.
- Data are processed **only** inside the City of Miami Beach boundary. The map dims everything outside it.

Full detail: [DATA_SOURCES.md](DATA_SOURCES.md) · [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

## Deployment

FloodLens is a static site with no backend or API keys.

```bash
npm run build      # outputs dist/
```

Upload `dist/` to any static host. Asset paths are relative (`base: './'`), so it also works from a sub-path such as GitHub Pages project sites. A `netlify.toml` is included. For other hosts, serve `dist/` with gzip/brotli enabled, because the GeoJSON compresses about 5×.

Basemap tiles come from the public OpenFreeMap instance (free, no key, attribution required and kept in the map). For high-traffic deployments, consider self-hosting the tiles; OpenFreeMap publishes weekly planet downloads.

## Attribution

Inundation data: NOAA Office for Coastal Management, Sea Level Rise Viewer (coast.noaa.gov/slr).
City boundary: US Census Bureau, TIGER/Line Shapefiles (public domain).
Basemap: OpenFreeMap © OpenMapTiles, data © OpenStreetMap contributors.

## Documentation

- [DATA_SOURCES.md](DATA_SOURCES.md): provenance, CRS, clipping, scenario definitions, transformation steps
- [CASE_STUDY_NOTES.md](CASE_STUDY_NOTES.md): portfolio case-study material
- [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md): interaction, visual and technical decisions
- [docs/LIMITATIONS.md](docs/LIMITATIONS.md): what FloodLens can and cannot tell you
- [docs/QUALITY_REPORT.md](docs/QUALITY_REPORT.md): what was built, tested and deferred
- [CHANGELOG.md](CHANGELOG.md): numbered versions with screenshots of each iteration
