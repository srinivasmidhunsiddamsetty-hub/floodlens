# FloodLens: handoff for coding agents

Read this file in full before you change anything. It holds the project's rules, the owner's working preferences and the release routine. Claude Code built versions v0.1 to v0.32 with the owner. The owner's preferences listed here are corrections they made more than once, so follow them closely.

---

## 1. What this is

FloodLens is a portfolio web app by a product designer. It shows real NOAA sea-level-rise inundation data for the City of Miami Beach, Florida, on a 3D map. The levels run from today's high tide (MHHW) to +5 ft, in 1 ft steps.

- **Live site:** https://floodlens-five.vercel.app
  - Note: floodlens.vercel.app is a different project that belongs to someone else.
- **Repo:** https://github.com/srinivasmidhunsiddamsetty-hub/floodlens (public). The remote is `origin` and the branch is `main`.
- **Current version:** v0.34 (tag `v0.34`): changes from the review feedback on v0.33.
- **Test status at handoff:**
  - 108 unit and component tests in 12 files pass.
  - 19 end-to-end tests pass, all at 1440×900.
  - There is also 1 screenshot spec. It runs only with `SCREENSHOTS=1`.

---

## 2. Hard rules (never break these)

1. **Never invent data.** Do not make up flood extents, risk levels, building exposure counts, depths, usability metrics or research results. Every number on screen must come from `public/data/noaa/` or from the OpenStreetMap data in the basemap tiles. If the data is missing, show nothing rather than an estimate.
2. **No paid services.**
   - No paid subscriptions, Mapbox paid services, ArcGIS Pro, paid map tiles, or any API that needs a credit card.
   - The basemap is the free OpenFreeMap instance, with no API key.
3. **Keep the required attribution in the map credit.**
   - Required: © OpenStreetMap (ODbL) and © OpenMapTiles.
   - Also kept: OpenFreeMap (as a courtesy), "Flood data: NOAA" and "Boundary: US Census".
   - The credit can collapse into an (i), but it must never be removed.
4. **Never imply endorsement.** Nothing may suggest that NOAA, Esri, OpenFreeMap, OpenMapTiles, OSM or the City of Miami Beach sponsors or endorses FloodLens.
5. **No destructive operations outside this project folder.**
6. **Credentials belong to the owner.** Never type passwords, 2FA codes, email verification codes or tokens. GitHub token edits and Vercel deploys sometimes ask for email re-auth; the owner enters those codes.

---

## 3. How the owner wants changes made

- **Change only what was asked ("be mindful").** Do not tidy or restyle nearby things. Unrequested changes have been reverted before, for example greyed-out text and copy taken from a mockup.
- **A supplied mockup is a reference, not something to copy exactly.** Take its layout and emphasis. Keep FloodLens's agreed wording.
- **Ask before making subjective changes.** For anything visual or taste-based ("make it premium", sizes, colours, spacing):
  1. Render the options side by side.
  2. Show them to the owner.
  3. Let the owner choose before you edit the real code.
  4. Give a recommendation, but don't decide alone.
- **When the owner asks "is this needed?" or "what do you think?",** give a straight opinion with the reason, then wait for their decision.
- **Version every iteration.** See §8 for the steps.
- Explain things in plain words. The owner is a designer, not a GIS specialist.

---

## 4. Copy rules (see `docs/UX_WRITING.md`)

- **Never say "safe", "dry" or "will flood".** NOAA's layers are screening-level. They don't model storms, rain or groundwater.
- **Card answer, when water reaches the place:** "Water reaches at" + "+2 ft". At level 0 the answer is "Today".
- **Card answer, when no mapped level reaches it (v0.30):** "Up to +5 ft" + "Doesn't reach it". The label keeps the +5 ft limit so the answer never claims more than the data shows.
- **Low spot row:** "Yes, from +N ft" or "No". There is no area caption. It was removed in v0.31 because it was a bug: it showed the area of the whole low-spot polygon, not the building's part.
- **Units:**
  - Building areas are always in m², never km².
  - City-scale areas switch between km² and acres; the choice is remembered in the browser.
- **Style:**
  - Sentence case.
  - Short labels.
  - No full stop after a single phrase.
  - One name for each thing: sea level, high tide, "+2 ft", low spots, city limits.
- **Voice:** plain, calm and honest. "We" means FloodLens.

---

## 5. Visual system

- **Font:** Satoshi, a variable font (300–900) loaded from Fontshare.
  - Weight 600 is a real semibold, but it reads as medium.
  - Use **700 when the owner says "bold"**.
  - Map labels stay in Roboto, because MapLibre needs SDF glyphs.
- **Tokens:** defined in `src/styles/index.css` under `@theme`. Map and chart colours are mirrored in `src/lib/theme.ts`, because MapLibre can't read CSS.
  - Canvas `#f1f3f6`, surface white.
  - Text: `fg #151515`, `fg-muted #474747`, `fg-subtle #6a6a6a`.
  - Accent `#0069b0`.
  - Selection colour: vermilion `#e8452c`.
- **No blue numbers.** Blue is only for links and selection. Numbers use `text-fg`.
- **Cards:** `.card` has 16 px corners, a white background, and a soft ring plus shadow (`--shadow-card`). The left panel's cards sit on the grey canvas; the Insights cards float over the map (v0.34).
- **Glass:** `.glass` is 88% white with a blur. It is used only for things that float over the map (area chips, map controls and the vertical colour scale). It falls back to solid when the user prefers reduced transparency.
- **Legend (v0.34):** a slim vertical colour scale, bottom left: only the sea-level colours, today at the bottom, the chosen level in bold, plus "Low spot" when that layer is on. It is a **static key**: nothing in it may be clickable (v0.28). Spotlighting a level is done from the chart bars and the chart's "adds" row.
- **Colour modes (v0.34):** "Colours: Simple / Detailed" in the Sea level card, remembered per browser (`floodlens.colorMode`). Simple (the default) is one blue, `SIMPLE_COLOR` `#3d84e6`. Detailed uses `BAND_COLORS`. Everything that shows flood colour takes the mode: map, slider track, chart, "adds" row, Flooding swatch, legend.
- **Detailed ramp (v0.34):** six steps (today to +5 ft), light to dark, turning from sky blue to indigo. It is measured for colour-blind readers (worst neighbouring pair OKLab ΔE 9.3, normal vision 10.1, drawn at 85% over the land). Don't change it without measuring.

**Insights card typography (as agreed):**

| Element | Style |
| --- | --- |
| Card title | 15 px, bold |
| "Land underwater" heading | bold |
| Labels (Height, Footprint, Low spot, "Water reaches at") | 14 px medium, sentence case, black (not grey) |
| Fact values | 20 px medium |
| The answer ("+2 ft") | 24 px bold |
| Stat numbers | 24 px bold |
| Chart x-axis labels | 10 px |

The chart title has no icon.

**Layout (v0.34): desktop and laptop only.**

- The left panel is docked on the grey canvas, 280 px wide.
- The Insights cards float over the right of the map with no panel behind them (v0.34, as in v0.27–v0.31). The column is 380 px by default, resizable from 300 to 560 px, and remembered per browser. The map's camera is padded by that width (`rightInset` in `MapView`).
- Edge tabs collapse each side.
- Map controls: 2D/3D and "Entire Miami Beach" (house icon) top right; in 3D a Rotate and Tilt panel, then the compass and zoom, bottom right. Every map button has a tooltip.
- The sea-level slider is upright: today at the bottom, +5 ft at the top. Its play button says "Step up to +5 ft".
- One layout, made for screens 1024 px wide and up. A narrower window scrolls sideways (`#root` has `min-width: 1024px`), and the viewport meta is `width=1280`. Don't add phone or tablet layouts; the owner removed them on purpose.
- The Insights panel must fit at 1440×900 without scrolling.
- The "What this map can and can't tell you" footer link was removed (v0.26). "About the data" stays in the top bar.

**Area chips:** South Beach, Mid-Beach and North Beach.

- A selected chip is filled solid with the accent colour.
- Clicking the selected chip again shows the whole city.

---

## 6. Architecture

**Stack:**

- React 19, TypeScript 5.9, Vite 7, Tailwind 4.
- MapLibre GL 5 (OpenFreeMap Positron, restyled), D3 7, Turf 7, Lucide icons.
- No backend. The site is static.
- `vite.config.ts` uses `base: './'`.

**Folders under `src/`:**

```
src/
  App.tsx                     layout: top bar, docked left panel, map with the Insights cards floating over its right side
  state/reducer.ts            single typed reducer: scenarioFt, layers, viewMode, selection, dialog, panels, areaUnit, colorMode
  components/map/MapView.tsx  owns every MapLibre call: style, layers, picking, camera, credit, chips, controls
  components/map/             MapControls, AreaBookmarks (chips), MapLegend (static vertical colour scale), MapStatus
  components/insights/        InsightPanel (headline tile + chart), InspectionCard (selected place), LevelTrack
  components/charts/          ScenarioAreaChart (D3 stacked bars, tooltips, screen-reader table)
  components/controls/        ControlPanel (with the Colours switch), ScenarioSelector (upright slider + "Step up to +5 ft")
  components/dialogs/         AboutDataDialog, DataSourcesDialog
  hooks/                      useManifest, useCollection, useMapData, useInspection(selection, manifest), usePanelWidth, useMediaQuery (reduced motion)
  lib/                        pure, unit-tested: format, geo, manifest, mapStyle, mapLayers, buildingPick, theme, constants
public/data/noaa/             processed GeoJSON + manifest.json (committed; about 26 MB)
scripts/prepare_noaa_slr.py   offline data pipeline (Python, Shapely, pyproj, pyogrio)
tests/e2e/                    Playwright: app.spec, screenshots.spec
```

**Mechanics that are easy to break:**

- **Map credit** (`MapView.tsx` and `lib/mapStyle.ts`):
  - `transformBasemapStyle` blanks every source's own `attribution`.
  - The credit line is a single `customAttribution` string with `compact: true`, built from `BASEMAP_CREDIT` plus the NOAA and Census links.
  - Two MapLibre behaviours make this setup necessary: MapLibre sorts credits by length, and a TileJSON's attribution overrides the source's. Without blanking, the credits come out in the wrong order or duplicated.
- **Chip "show all" state:** `MapView.tsx` uses the sentinel `SHOW_ALL = 'all'`.
  - The camera-reset effect sets it.
  - `moveend` clears it.
  - While it is set, no chip is lit as the camera zooms out.
- **Floating Insights:** `MapView` pads the camera by `rightInset`, and `overviewCamera` subtracts it from the width. Chips, controls and status sit in an overlay that stops at the cards; `.maplibregl-ctrl-bottom-right` uses `--map-inset-right`. The collapse tab must stay below the resize handle (z-10), or it blocks the handle.
- **Inspection:** `useInspection` does not depend on the slider. It checks every level, so the slider must not re-run it.
- **Flood bands:** the `diff_Nft_Mft.geojson` files are differences between neighbouring levels, computed and validated offline (see `manifest.processing.validation`). Low-lying areas (`low_*.geojson`) are a separate layer and are never merged with the ocean-connected extents.

**Data docs:**

- `DATA_SOURCES.md` covers provenance, coordinate systems, clipping and the pipeline steps.
- `docs/LIMITATIONS.md` explains what the data can't say.

---

## 7. Commands

```bash
npm install
npm run dev              # Vite dev server (the owner uses http://localhost:5173)
npm run typecheck
npm test                 # Vitest: 108 tests
npm run test:e2e         # Playwright on the production build, port 4179, system Google Chrome
npm run screenshots      # regenerates docs/screenshots/ 01–04 and 08–10 (SCREENSHOT_DIR overrides the folder)
npm run build            # tsc -b && vite build → dist/
```

- `.claude/launch.json` defines dev servers on ports 5173 and 5179.
- The e2e tests use the locally installed Chrome (`channel: 'chrome'`) with SwiftShader WebGL. No Playwright browser download is needed.
- `tests/e2e/screenshots.spec.ts` clicks fixed map coordinates, such as (622, 470) and (858, 346). If the layout or panel widths change, check that those clicks still land on buildings.
- The shell is zsh on macOS:
  - Quote globs (`--include='*.ts'`).
  - Use `${var}` inside strings.
- `rg` and `gh` may be missing; `brew` is not installed.

---

## 8. Release routine for each version

Each change the owner accepts becomes the next version, v0.33 and so on.

1. Make the change. Add or update tests, especially `InspectionCard.test.tsx`, `MapLegend.test.tsx`, `format.test.ts` and `tests/e2e/app.spec.ts`.
2. Run `npm run typecheck && npm test && npm run test:e2e`. All of them must pass.
3. Run `npm run screenshots`, then copy `docs/screenshots/*` to `docs/versions/v0.NN/`.
4. Update `CHANGELOG.md`:
   - Add a row to the version table.
   - Add a `## v0.NN: <theme> (<d Mon yyyy>)` section that says what changed and why, and gives the test counts.
5. Update other docs only where the change touches them:
   - `docs/DESIGN_DECISIONS.md` for layout, colour, type or engineering choices.
   - `docs/UX_WRITING.md` for copy changes. Add a before/after table.
   - `docs/QUALITY_REPORT.md` for test counts.
   - `README.md` if it now describes something wrong.
6. Commit with the message `v0.NN: <theme>` and a short body. Create a **lightweight** tag `v0.NN`, like the existing tags.
7. Push only when the owner asks: `git push origin main && git push origin v0.NN`.
   - Pushing to `main` triggers an automatic Vercel deploy, which takes about 30 seconds.
   - Then load https://floodlens-five.vercel.app, confirm the new bundle is served, and check that the console has no errors.

---

## 9. Hosting

- **GitHub:**
  - Push over HTTPS. The credentials come from the macOS keychain (`credential.helper osxkeychain`).
  - The keychain holds a fine-grained token named "PAT", scoped to the repos Portfolio and floodlens with Contents read/write.
  - Never print, copy or change the token.
- **Vercel:**
  - Hobby plan. Project `floodlens`, team `srinivasmidhunsiddamsetty-hub-367495aa`.
  - Every push to `main` deploys automatically.
  - `vercel.json` sets the Vite build, `dist/` as the output, and cache headers: 1 day for `/data/*`, and immutable for `/assets/*`.
- `netlify.toml` is also in the repo. It is not used.

---

## 10. Recent history (full detail in `CHANGELOG.md`)

| Version | What changed |
| --- | --- |
| v0.24 | Chart x-axis labels at 10 px |
| v0.25 | Building areas in m²; "premium" pass: soft-shadow cards, glass chips and controls, bolder type. The owner declined map lighting and a navy header. |
| v0.26 | Solid legend back; footer link removed; bold card title and "Land underwater"; facts 20 px |
| v0.27 | Insights default 380 px; cards floated over the map (docked again in v0.32, floating again in v0.34); solid chips that toggle; 14 px medium black labels |
| v0.28 | Legend is a static key |
| v0.29 | Shorter credit that folds into an (i) on the first drag |
| v0.30 | Not-reached answer: "Up to +5 ft · Doesn't reach it" |
| v0.31 | Wrong low-spot area caption removed; inspection no longer depends on the slider |
| v0.32 | Insights docked in a grey panel again, matching the left (the owner wanted both sides consistent) |
| v0.33 | Desktop and laptop only: the phone and tablet layout and its tests removed |
| v0.34 | Review feedback: Simple/Detailed colour modes and a clearer Detailed ramp; upright slider and "Step up to +5 ft"; zoom, rotate and tilt at the bottom; "Entire Miami Beach" with a house icon; vertical colour scale for the legend; Insights cards float again; spot card without Height and Footprint |

---

## 11. Docs map

| File | What it holds |
| --- | --- |
| `README.md` | Overview, features, scripts, deployment, attribution |
| `CHANGELOG.md` | Every version with its screenshot folder |
| `CASE_STUDY_NOTES.md` | Portfolio case-study material. The usability-test plan has **not** been run; never report results from it. |
| `docs/DESIGN_DECISIONS.md` | Why each design choice was made |
| `docs/UX_WRITING.md` | Voice, rules, and before/after copy |
| `docs/LIMITATIONS.md` | What the data can and can't tell you |
| `docs/QUALITY_REPORT.md` | What was built, tested and deferred |
| `DATA_SOURCES.md` | Data provenance and pipeline |

## 12. Open items

From the v0.33 review feedback, still to decide with the owner (don't act without asking):

- Where "Land underwater" goes (#3, #11). It changes with the slider but not with clicks on the map, so it doesn't fit beside the selection card.
- A wider typography and visual-hierarchy pass (#12, #14).
- Whether the left panel should float too, now that the Insights cards do.
- Whether the upright slider and the vertical colour scale should become one control.
