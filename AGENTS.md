# FloodLens: handoff for coding agents

Read this file in full before you change anything. It holds the project's rules, the owner's working preferences and the release routine. Claude Code built versions v0.1 to v0.32 with the owner. The owner's preferences listed here are corrections they made more than once, so follow them closely.

---

## 1. What this is

FloodLens is a portfolio web app by a product designer. It shows real NOAA sea-level-rise inundation data for the City of Miami Beach, Florida, on a 3D map. The levels run from today's high tide (MHHW) to +5 ft, in 1 ft steps.

- **Live site:** https://floodlens-five.vercel.app
  - Note: floodlens.vercel.app is a different project that belongs to someone else.
- **Repo:** https://github.com/srinivasmidhunsiddamsetty-hub/floodlens (public). The remote is `origin` and the branch is `main`.
- **Current version:** v0.52 (tag `v0.52`): the share figure centred in its box; the place card's water flows in over 1.8 s.
- **Test status at handoff:**
  - 110 unit and component tests in 13 files pass.
  - 20 end-to-end tests pass, at 1440×900 (some also check shorter windows, 650–800 px).
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
- **Card answer, when water reaches the place:** "Water reaches at" + "+2 ft". At level 0 the answer is "0 ft" (v0.40; "Today" before). Today's level is "0 ft" everywhere.
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
  - Accent: navy `#1e3a5f` (v0.50; `#0069b0` before), strong `#152a46`, tint `#e7edf5`. Solid accent fills use `.fill-accent` (soft shade, top highlight, light navy hairline; no dark ring or glow since v0.51), not a flat `bg-accent`. The chosen area chip uses `.fill-accent-frost` (frosted navy, white hairline, neutral shadow). Switches that are off: light hairline, grey knob `#7d8796`.
  - Selection colour: green `#3ee67e`, outline `#15803d` (v0.46, the owner's colour; vermilion before, charcoal in v0.38–v0.41). The card's place tile uses `#15803d` on `#e9fbf0`.
- **No blue numbers.** Blue is only for links and selection. Numbers use `text-fg`.
- **Cards:** `.card` has 16 px corners, a white background, and a soft ring plus shadow (`--shadow-card`). The left panel's cards sit on the grey canvas; the Insights cards float over the map (v0.34).
- **Glass:** `.glass` is 88% white with a blur. It is used only for things that float over the map (area chips, map controls and the vertical colour scale). It falls back to solid when the user prefers reduced transparency.
- **Legend (v0.34, v0.35):** a slim vertical colour scale, bottom left, shown **only with Per foot colours**: only the sea-level colours, today at the bottom, the chosen level in bold. No low-spot row. It takes the pointer, so the map's cursor and hover labels don't show through it. It is a **static key**: nothing in it may be clickable (v0.28). (The chart that spotlighted levels was removed in v0.36.)
- **Colour modes (v0.34):** an "Overall / Per foot" pill toggle beside the "Sea level" title (v0.47; "Total / By level" in v0.41–v0.46). It's "per foot", never "per feet", with no label or caption, remembered per browser (`floodlens.colorMode`). In code the modes are still `'simple'` and `'detailed'`. Total (the default) is one blue, `SIMPLE_COLOR` `#3d84e6`. Per foot uses `BAND_COLORS`, edged with `BAND_EDGE` (a faint white line). Everything that shows flood colour takes the mode: map, slider track, Flooding swatch, legend.
- **Per foot ramp (v0.41):** matplotlib's Plasma (`#f0f921 #fca636 #e16462 #b12a90 #6a00a8 #0d0887`, 0 ft to +5 ft), the owner's pick from rendered options: a different colour per level, easy to tell apart. Worst neighbouring pair OKLab ΔE 15.1 (deuteranopia 9.0, protanopia 6.2). +4 ft is close to the low-spot purple; the hatch keeps them apart. v0.40 used the owner's yellow → orange swatches (ΔE 3.9). Fill opacity stays 85% (the owner's range is 85–95%). Don't change it without the owner.

- **Surfaces inside cards (v0.49):** `.surface-navy` in `index.css`: solid deep navy `#1e3a5f`, a faint radial glow, 4.5% grain, a 1 px semi-transparent hairline with a top highlight, layered soft shadows; white text. Used by the sea-level figure boxes and the place card's answer and facts boxes. Content inside must be light: `Segmented`/`AreaUnitToggle` take `onDark`, and `LevelTrack` uses white labels, baseline and marker. The owner's premium rules for solid colour: subtle hairline, layered diffused shadows, faint grain or glow, no loud gradients. Before: "Soft light" (v0.42–v0.48); a pale blue gradient was rejected as a cliché.
- **Premium finish everywhere (v0.50):** the owner's rule (hairline, layered diffused shadows, faint grain or glow, never loud gradients) applies to every surface. In `index.css`: `--shadow-card` and `--shadow-glass` carry a white top highlight; `.canvas-grain` (3% grain) on the left panel's canvas; `.track-inset` for pill tracks and switches that are off; `.chip-soft` for level chips; `.tile-soft` for icon tiles. **The map stays flat:** its colours are data, so no glow, grain or shading on flood layers (the owner also declined map lighting in v0.25).

**Card typography (as agreed):**

| Element | Style |
| --- | --- |
| Card title | 15 px, bold |
| Labels (Height, Footprint, Low spot, "Water reaches at") | 14 px medium, sentence case, black (not grey) |
| Fact values | 20 px semibold (v0.41; medium before) |
| The answer ("+2 ft") | 24 px bold |
| Sea level figure labels: "Total area covered" / "New area covered", "Share of city land" (v0.38) | 12 px medium, black, one line |
| Sea level figures: the area and the share (equal weight) | 30 px bold (v0.45; 28 px in v0.43–v0.44; 24 px only on windows ≤ 725 px tall), white, centred in a premium navy box (`.surface-navy`, v0.49), boxes equal height; 8 px label → number, 10 px number → switch; 20 px on short windows |
| Level chips on the slider | 12 px, centred pills (v0.41); light fill at rest, the chosen one accent-tinted and bold |
| Toggles (Overall / Per foot, km² / acres) | pills (v0.47), the chosen option filled with the accent |
| Icon tiles (v0.37) | 36 px for the place, 20 px for the coordinates, 28 px for each fact; pale tint behind the icon colour |

**Layout (v0.35): desktop and laptop only.**

- The left panel is docked on the grey canvas, 300 px wide (v0.42; 280 before).
- The Insights card floats over the right of the map with no panel behind it (v0.34, as in v0.27–v0.31). It is a fixed 360 px wide (v0.38; 380 in v0.37; no resize handle, no close tab: the owner wants it simply wide enough). The map's camera is padded by that width (`rightInset` in `MapView`).
- The left panel collapses with its edge tab; Insights is always shown.
- Insights (v0.36) holds only the selected building or spot's card, or the "Click any building" prompt. No city-wide figures there: the owner wants the right side to be only about the selection.
- Sea level card (v0.36–v0.39): no big "+2 ft". The slider (up to 254 px tall) has clickable pill chips with centred names; today's is "0 ft". Beside it, two figures of equal weight, each centred in a premium navy box (`.surface-navy`, white text; v0.49), equal heights, 8 px apart: "Total area covered" (Total) or "New area covered" (By level), with a km² / acres switch under the number (one unit at a time, styled like Total / By level, remembered as `floodlens.areaUnit`), and "Share of city land" as a %. Today reads 0 and 0%. **Never leave a figure blank.** The low-spot area ("0.94 km² at +2 ft", in the chosen unit) sits under the Low spots switch while that layer is on.
- Short windows use two Tailwind variants (`@custom-variant` in `index.css`): `short` (800 px tall or less) tightens the card padding and layer rows; `tiny` (725 px or less) also compacts the figure boxes, never below 24 px numbers. **Check the figure size on a ~760 px window after any change here**: v0.43 shrank them to 20 px on ordinary laptops. `--fl-panel-rest` on the panel feeds the slider height (see `ScenarioSelector`).
- Map controls (v0.47): **one toolbar** (`role="toolbar"`, "Map controls") at the **screen's right edge, under the Insights card**, 16 px from the right and bottom, with thin rules between groups: 2D over 3D | "Entire Miami Beach" (folded-map icon) | in 3D turn and tilt | compass | zoom. All plain 32 px buttons; no dial (the owner disliked it). The compass stays: the city view starts turned. At ≤ 800 px window height the four arrows fold into a "Turn and tilt" button that opens them beside it (Escape is caught first, so it doesn't also close the place card); at ≤ 725 px the buttons are 28 px. Never two columns: the owner found that scattered. The scale bar and credit sit at the bottom right of the visible map. Every map button has a tooltip that opens left of the column.
- The sea-level slider is upright: today at the bottom, +5 ft at the top. No play button and no (i) (both removed in v0.35).
- The left panel must fit without scrolling in windows down to about 650 px tall (v0.35). The slider shrinks from 168 to 116 px on short windows to make room (`TRACK_H` in `ScenarioSelector`).
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
  state/reducer.ts            single typed reducer: scenarioFt, layers, viewMode, selection, dialog, panels (left only), areaUnit, colorMode
  components/map/MapView.tsx  owns every MapLibre call: style, layers, picking, camera, credit, chips, controls
  components/map/             MapControls, AreaBookmarks (chips), MapLegend (static vertical colour scale), MapStatus
  components/insights/        InsightPanel (selection card or prompt), InspectionCard (selected place), LevelTrack (D3)
  components/controls/        ControlPanel (Overall / Per foot toggle in the Sea level title), ScenarioSelector (upright slider), SubmergedArea (the figures beside it)
  components/dialogs/         AboutDataDialog, DataSourcesDialog
  hooks/                      useManifest, useCollection, useMapData, useInspection(selection, manifest), useMediaQuery (reduced motion)
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
- **Floating Insights:** `MapView` pads the camera by `rightInset`, and `overviewCamera` subtracts it from the width. Chips, controls and status sit in an overlay that stops at the cards; `.maplibregl-ctrl-bottom-right` uses `--map-inset-right`. The map controls are outside that overlay, at the screen's right edge (v0.38).
- **Sea level figures:** Overall shows `beyondBaselineM2` at the level; Per foot shows the difference from the level below (`submergedM2` in `lib/manifest.ts`), never the diff polygons' `areaM2`, so the parts sum to the total. Both shares divide by `censusLandM2`.
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
npm test                 # Vitest: 110 tests
npm run test:e2e         # Playwright on the production build, port 4179, system Google Chrome
npm run screenshots      # regenerates docs/screenshots/ 01–04 and 08–10 (02 Per foot colours at +5 ft, 10 today's zeros) (SCREENSHOT_DIR overrides the folder)
npm run build            # tsc -b && vite build → dist/
```

- `.claude/launch.json` defines dev servers on ports 5173 and 5179.
- The e2e tests use the locally installed Chrome (`channel: 'chrome'`) with SwiftShader WebGL. No Playwright browser download is needed.
- `tests/e2e/screenshots.spec.ts` clicks fixed map coordinates, such as (632, 470) and (878, 346) since the 300 px left panel (v0.42). If the layout or panel widths change, check that those clicks still land on buildings.
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
| v0.35 | Owner's pass: no play or (i) button; "Single / Layered" beside Sea level; left panel fits without scrolling; legend only in Layered, no low spot, takes the pointer; owner's layered colours; one bottom-right control column with a turn-and-tilt dial |
| v0.36 | Land underwater beside the slider (Single: total; Layered: added, as the difference of totals); Insights only for the selection; chart removed; low-spot area under its switch; 2D over 3D; zoom clear of the scale bar |
| v0.37 | Owner's colours with a faint white edge; "Overview / Layered" and "Underwater" / "Newly underwater at +2 ft"; unit menu after the number; Insights fixed at 380 px, no close tab; controls in one corner column without the dial; icons in tinted tiles, water drops for Low spot |
| v0.38 | Warm Individual ramp (yellow → red-brown) and charcoal selection; "Total / Individual", "Total area covered" / "New area covered"; both units shown, share at equal weight, 0 at today; clickable level chips; controls at the screen's right edge under the card; Insights 360 px; hollow low-spot icon |
| v0.39 | Area and share in soft tinted boxes, centred, 6 px apart; km² / acres switch under the number (one unit at a time again); square centred level chips; the panel tightens on short windows |
| v0.40 | The owner's yellow → orange swatches for Individual; "0 ft" instead of "Today"; level chips with 6 px corners; frame corners instead of the house; compass kept |
| v0.41 | Plasma for the By level colours; "Total / By level"; pill chips; figure boxes styled like the answer box, equal height, roomier, with a taller slider; semibold card values |
| v0.42 | "Soft light" surface for the figure boxes and the place card's answer and facts (facts now grouped in one box); vermilion selection again; folded-map icon; left panel 300 px |
| v0.43 | The two sea-level figures at 28 px (from 24) in boxes with a 1.5 px hairline; slider up to 250 px so the boxes stay equal |
| v0.44 | Fix: the figures stay 28 px on laptop windows (v0.43 compacted them to 20 px at ≤ 770 px); compaction only at ≤ 725 px and only to 24 px; panel tightening from 800 px keeps the boxes equal |
| v0.45 | The two sea-level figures at 30 px (the owner's call); slider up to 254 px so the boxes stay equal |
| v0.46 | Selected building green `#3ee67e` (outline `#15803d`); the card's place tile and the spot ring follow it |
| v0.47 | "Overall / Per foot" (was Total / By level); both toggles as pills; the map controls as one toolbar with dividers, turn and tilt folding into one button on short windows |
| v0.48 | Outside-the-city card reads just "This spot is outside Miami Beach." |
| v0.49 | Premium navy surface (glow, grain, hairline, layered shadows) for the sea-level figures and the place card's answer and facts; white text and light switch and track inside |
| v0.50 | Navy brand colour `#1e3a5f` (accent, logo, links, focus); `.fill-accent` for solid accent fills; the same premium finish on cards, controls, canvas, chips and tiles; the map left flat |
| v0.51 | Switches without the dark outline (grey knob when off); frosted navy chosen chip without the navy glow; pills matched; the place card's water flows in once and has no dot (it looked draggable); canvas grain fixed |
| v0.52 | The share's number centred in its box (label resting on it); the water flow-in slowed to 1.8 s |

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

- A wider typography and visual-hierarchy pass (#12, #14).
- Whether the left panel should float too, now that the Insights cards do.
- Whether the upright slider and the vertical colour scale should become one control.
