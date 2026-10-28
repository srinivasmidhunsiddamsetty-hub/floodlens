# Quality report

Status as of 27 Oct 2026 (v0.3). Every "passed" below was actually executed in this environment (macOS, Node 24, Chrome).

## Implemented

**Phase 1: functional foundation**
- React 19 + TypeScript + Vite 7 + Tailwind 4 project; static build with relative paths.
- MapLibre GL JS 5 map on OpenFreeMap Positron (verified free, keyless, attribution kept), restyled at runtime into a light geographic palette with self-hosted Roboto label glyphs; the interface uses Satoshi (Fontshare).
- 3D building extrusions from OpenMapTiles `render_height`; footprints in 2D.
- Discrete scenario control (0 / +1 / +2 / +3 ft above MHHW).
- **Real NOAA OCM data**: FL_SE GeoPackage, ocean-connected (`slr`) and low-lying (`low`) layers, clipped to the City of Miami Beach boundary (US Census TIGER/Line, 39.4 km²) by a reproducible pipeline.
- Overlay switching in place (GeoJSON `setData`), preserving the camera.

**Phase 2: spatial analysis and interaction**
- Geodesic area indicators computed by the pipeline and cross-checked in the browser.
- D3 bar chart (added extent beyond 0 ft), with highlight, tooltips, keyboard selection and a screen-reader table.
- Location and building inspection across all scenarios (point-in-polygon or footprint intersection), nearest OSM street and OSM height.
- 2D/3D toggle with animated pitch and bearing, kept in sync with manual tilting.
- Flood bands by water level (today / +1 / +2 / +3 ft) from validated, precomputed polygon differences, with spotlight on hover (v0.3; replaced the v0.2 compare mode).
- In-map camera controls (zoom, compass, Home, 2D/3D) and 3D-accurate building picking (v0.3).
- City-wide study area, area bookmarks, a "show all of Miami Beach" control, a single-hue flood ramp and an illustrated building card (v0.4).
- Stream-per-foot card illustration, city-limits toggle, aqua water and a non-overlapping map edge (v0.5).
- Viridis-style flood palette, area chips with a "you are here" state, and a resizable Insights pane (v0.6).
- Blue palette restored, flat chips with instant selection, a compact answer card, a human-voice copy pass (docs/UX_WRITING.md) and Satoshi as the interface font (v0.7).
- Clearer card answer when water doesn't reach a place, a data-driven chart title, a ring round the selected bar, and no faded "disabled" look for levels above the slider (v0.8).
- A km² / acres switch for the Insights section, remembered in the browser, and low spots always listed under the breakdown (v0.9).
- A compact building card and a two-block Insights layout (summary; chart and breakdown) that fits without scrolling at 1440×800 with a place selected; low spots listed only while their layer is on (v0.10).
- Legend, About the data dialog, Data sources dialog (provenance, steps, validation table, file list).

**Phase 3: polish and quality**
- Responsive layout: docked panels at 1024 px and wider; drawer plus bottom sheet below that.
- Accessibility: native and ARIA controls, focus rings, live regions, `<dialog>`, skip link, reduced motion, text alternatives.
- Loading, missing-manifest, missing-file and basemap-failure states (fallback style keeps NOAA overlays visible).
- Unit, component and end-to-end tests; screenshot generation; Netlify config; documentation.

## Verification performed

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | No errors |
| Unit and component tests | `npm test` | **12 files, 100 tests passed** |
| End-to-end (production build, Chrome) | `npm run test:e2e` | **17 passed** (16 desktop at 1440×900 or 1440×800, 1 mobile on Pixel 7 emulation); 2 screenshot specs skipped by default |
| Screenshot capture | `npm run screenshots` | 2 passed; images in `docs/screenshots/` |
| Production build | `npm run build` | Succeeds; JS ≈ 415 KB gzip (MapLibre 285 KB); data 20.8 MB raw across 16 files, lazy-loaded per state (the opening +2 ft view needs 2.4 MB raw, ≈ 0.26 MB gzip; the +3 ft band adds 4.3 MB raw, ≈ 0.48 MB gzip) |
| Data pipeline | `scripts/prepare_noaa_slr.py` | Ran end to end on the real 4.1 GB GeoPackage; all 6 difference validations passed |
| Contrast (computed) | WCAG formula on design tokens | All text tokens ≥ 4.7:1 on every surface (accent blue 5.0–5.8:1); unselected switch border 3.5:1; map place labels 9.5:1, road labels 5.9:1 |

What the E2E suite covers: initial load with no console errors or failed requests; NOAA headline figure; attribution present; keyboard slider (Arrow, Home, End) loading the next band without a page reload; Play the rise stepping to +3 ft and stopping; chart bars and breakdown rows selecting levels, with the data-driven chart title and no focus box left by a mouse click; the km² / acres switch changing every figure and being remembered after a reload; low spots listed with their layer off; in-map 2D/3D (pitch read from the control stack) and "Show all of Miami Beach" restoring the 3D city view, with no duplicate reset buttons; area bookmarks flying the camera and keeping 2D/3D; area chips' "you are here" state; resizing the Insights pane by drag and keyboard within its limits, with the width remembered; the city-limits toggle and legend; keyboard inspection (Enter on the map) with a 4-step ladder; clearing with Esc and with the × button; low-lying layer and collapsible legend; dialogs (content, Esc, close button); a missing manifest (no numbers shown); a missing band file (explicit warning); mobile drawer and bottom sheet with no horizontal overflow.

Geographic calculations are verified by `src/lib/dataIntegrity.test.ts`. Turf areas match the manifest's ellipsoidal areas within 0.5% for all 10 extent and difference files. Difference area ≈ change in totals within 1%. Areas grow monotonically. All coordinates fall inside the study area. A point inside the +1 → +2 ft added extent is outside the 1 ft extent and inside the 2 ft extent.

## Not verified

- Browsers other than Chrome (Safari and Firefox not run), and real phones or tablets (emulation only).
- Screen-reader walkthroughs (VoiceOver / NVDA) have not been performed. Semantics were built to spec, not user-tested.
- Performance on low-end hardware or GPUs. Tests used software WebGL (SwiftShader).
- No usability testing has been conducted. See the plan in `CASE_STUDY_NOTES.md`.

## Known limitations

See `docs/LIMITATIONS.md`. Summary: NOAA screening-level bathtub data (no surge, depth, erosion, subsidence or dates); one city-wide study area; approximate OSM building heights; vector-tile footprints may be merged or clipped at tile edges; the WebGL canvas is not exposed to assistive tech.

## Deliberately deferred

- **Swipe or split-map comparison.** Replaced by a robust overlay comparison with validated difference layers.
- **Building exposure counts.** These need an authoritative footprint dataset and a documented offline join.
- **Depth and mapping-confidence rasters.** Available from NOAA but out of MVP scope.
- **Half-foot scenarios and more study areas.** The pipeline supports them with small configuration changes.
- **URL-shareable state.**
