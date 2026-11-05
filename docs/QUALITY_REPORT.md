# Quality report

Status as of 27 Oct 2026 (v0.3). Every "passed" below was actually executed in this environment (macOS, Node 24, Chrome).

## Implemented

**Phase 1: functional foundation**
- React 19 + TypeScript + Vite 7 + Tailwind 4 project; static build with relative paths.
- MapLibre GL JS 5 map on OpenFreeMap Positron (verified free, keyless, attribution kept), restyled at runtime into a light geographic palette with self-hosted Roboto label glyphs; the interface uses Satoshi (Fontshare).
- 3D building extrusions from OpenMapTiles `render_height`; footprints in 2D.
- Discrete scenario control (today, then every foot up to +5 ft above MHHW; up to +3 ft before v0.17).
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
- A one-column card (when water reaches it, height, footprint, low spot) with a level track of pins on rising water, chips restored, the bottom "What this map can and can't tell you" link restored, and no visible Insights title; fits at 1440×850 in every state (v0.11).
- The first-reached answer back as the card's large lead, over a level track with "Not reached / First reached / Reached" pins and water that stops at the first level that reaches the place; summary and chart on tiles; coordinate copy button; distance to street removed; fits at 1440×900 (v0.12).
- The card answer back to v0.11's wording ("When water reaches it · At +3 ft"), status labels and copy button dropped, height and footprint always listed, a one-line chart title, and the bottom link pinned to the panel's bottom edge (v0.13).
- One tile for the summary and chart (they share the unit switch), "Water reaches at · +3 ft" in smaller black type, and no blue numbers anywhere (v0.14).
- Sea levels extended from +3 to +5 ft with NOAA's own +4 and +5 ft layers, and a six-step blue ramp (v0.17).
- The legend shows every level in its true colour, with no "not shown" label (v0.18).
- Only the selected level's "adds" row is listed under the chart, not all five (v0.19).
- Vermilion selection colour, the two figures on stat tiles, a grey canvas behind both panels, the left panel in tiles, and rounded bar tops (v0.20).
- The sea-level (i) note cut to two lines, so the left panel no longer scrolls when it's open, even at 1440×800 (v0.21).
- The note rewritten without "steps", and the circles removed from the card's level track (v0.22).
- The level track's labels down to 10 px (v0.23).
- The chart's x-axis labels down to 10 px, matching the track (v0.24).
- Building areas always in m²; soft-shadow cards, frosted map controls and bolder type, with text on glass checked at 4.5:1 or better over the darkest flood blue (v0.25).
- The earlier solid legend back, the bottom link removed, bold card and tile titles, card facts at 16 px (labels) and 20 px (values), and no chart-title icon (v0.26).
- Insights cards floating over a padded map at 380 px, solid area chips that toggle back to the whole city, and card labels (including "Water reaches at") at 14 px medium (v0.27).
- A static legend: the levels are a plain key, not hover buttons (v0.28).
- A shorter map credit in a fixed order that folds into an (i) after the first drag, within the OSMF attribution guidelines (v0.29).
- "Up to +5 ft · Doesn't reach it" for places none of the mapped levels reach (v0.30).
- The low-spot area caption removed: it showed the whole low-spot polygon's area, not the building's part (a bug since v0.2) (v0.31).
- The Insights cards docked in a panel again, matching the left side; the floating layout's map padding removed (v0.32).
- Desktop and laptop only: one layout, for screens 1024 px wide and up (v0.33).
- From review feedback: Simple and Detailed colour modes with a clearer Detailed ramp, an upright sea-level slider and "Step up to +5 ft", zoom and 3D rotate and tilt buttons at the bottom of the map, an "Entire Miami Beach" button with a tooltip, a vertical colour scale for the legend, the Insights cards floating over the map again, and a spot card without Height and Footprint (v0.34).
- From the owner's review of v0.34: no play or (i) button, a Single / Layered toggle beside the Sea level title, a left panel that fits without scrolling in windows down to about 650 px tall, the legend only with Layered colours and without low spots, the owner's layered colours, and the map controls in one bottom-right column with a dial to turn and tilt (v0.35).
- From the owner's spec: the land underwater moved beside the slider (Single: the total so far; Layered: only what the level adds, as the difference of neighbouring totals), Insights holds only the selection, the chart and its spotlight removed, the low-spot area under its switch, 2D over 3D again, and zoom clear of the scale bar (v0.36).
- From the owner's notes: new Layered colours with a faint white edge round each level, "Overview / Layered" and "Underwater" / "Newly underwater at +2 ft", a unit menu right after the number, Insights fixed at 380 px with no close tab, all map controls in one corner column without the dial, and icons in tinted tiles with water drops for Low spot (v0.37).
- From the owner's notes on v0.37: a warm Individual ramp (pale yellow → red-brown) with a charcoal selection, "Total / Individual", "Total area covered" / "New area covered", the share as large as the area, both units with no control, zeros instead of "None yet", clickable level chips, the map controls at the screen's right edge under the Insights card (two columns on short windows), Insights at 360 px, and a hollow low-spot icon (v0.38).
- The area and share in soft tinted boxes, centred; a km² / acres switch under the number again; square centred level chips; the left panel tightening on short windows (v0.39).
- The owner's yellow → orange swatches for the Individual colours, "0 ft" in place of "Today", rounded level chips, and frame corners for Entire Miami Beach (v0.40).
- Plasma for the By level colours (closest levels ΔE 15.1), "Total / By level", pill chips, figure boxes styled like the answer box with more room and equal heights, and semibold card values (v0.41).
- A "Soft light" surface for the figure, answer and facts boxes; the place facts grouped in one box; a vermilion selection again; a folded-map icon; a 300 px left panel (v0.42).
- The two sea-level figures at 28 px in boxes with a 1.5 px hairline, the scale extended to keep them equal (v0.43).
- Fix: the figures stay 28 px on laptop windows; they compact only at 725 px tall or less, and only to 24 px; a test checks the size at 900–650 px (v0.44).
- The two sea-level figures at 30 px, measured at every window height from 900 to 650 px (v0.45).
- The selected building and spot ring in green `#3ee67e`, with the card's place tile to match (v0.46).
- "Overall / Per foot", pill toggles, and the map controls as one toolbar that stays one column at every height (v0.47).
- The outside-the-city message shortened to one sentence (v0.48).
- Premium navy boxes (glow, grain, hairline, layered shadows) for the sea-level figures and the place card's answer and facts (v0.49).
- Navy brand colour `#1e3a5f` and the same premium finish on accent fills, cards, controls, chips and tiles; the map stays flat (v0.50).
- Lighter switches, chosen chip and pills (no dark ring or navy glow); the place card's water flows in once, without the draggable-looking dot (v0.51).
- Share figure centred in its box; the water flows in over 1.8 s (v0.52).
- The "Click any building" prompt only until the first click; the share 4 px below the middle (v0.53).
- A legend that minimises to a square of its colours (remembered), with no highlighted level and the title "Water reaches at" (v0.54).
- "About the data" and "Sources" brought up to date: both colour modes, how the sea-level figures are computed, the place card, and D3's current use (v0.55).
- Fix: the "Click any building" prompt shows each time FloodLens is opened, until the first pick (v0.56).
- Sea level card from the owner's mockup: light-blue boxes, left-aligned navy figures, plain level labels, a shorter card that still fits without scrolling down to 650 px windows (v0.57).
- Sea level figures centred again, with a soft-glow finish and a smaller km² / acres toggle (v0.58).
- The place card's navy boxes a step lighter, `#2b4c78` (v0.59).
- The Sea level card on the 4 px grid, 288 px tall, with the owner's box paddings; an end-to-end test measures them (v0.60).
- One colour for the place card's icons, the place still green (v0.61).
- The "See it at +N ft" link removed; the answer box shortened from 277 × 140 to 277 × 104 px, with the answer on the label's row and text sizes unchanged (v0.15).
- The answer box shortened again, to 277 × 92 px (v0.16).
- Legend, About the data dialog, Data sources dialog (provenance, steps, validation table, file list).

**Phase 3: polish and quality**
- Desktop and laptop layout: a docked left panel and floating Insights cards, for screens 1024 px wide and up.
- Accessibility: native and ARIA controls, focus rings, live regions, `<dialog>`, skip link, reduced motion, text alternatives.
- Loading, missing-manifest, missing-file and basemap-failure states (fallback style keeps NOAA overlays visible).
- Unit, component and end-to-end tests; screenshot generation; Netlify config; documentation.

## Verification performed

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | No errors |
| Unit and component tests | `npm test` | **14 files, 118 tests passed** |
| End-to-end (production build, Chrome) | `npm run test:e2e` | **21 passed** (at 1440×900, some also at 650–800 px tall); 1 screenshot spec skipped by default |
| Screenshot capture | `npm run screenshots` | 1 passed; images in `docs/screenshots/` |
| Production build | `npm run build` | Succeeds; JS ≈ 415 KB gzip (MapLibre 285 KB); data 26 MB raw across 19 files, lazy-loaded per state (the opening +2 ft view needs 2.4 MB raw, ≈ 0.26 MB gzip; the +3, +4 and +5 ft bands add 4.3, 6.1 and 4.8 MB raw and load only when the slider reaches them) |
| Data pipeline | `scripts/prepare_noaa_slr.py` | Ran end to end on the real 4.1 GB GeoPackage for 0–5 ft; all 5 neighbouring-band validations passed |
| Contrast (computed) | WCAG formula on design tokens | All text tokens ≥ 4.7:1 on every surface (accent blue 5.0–5.8:1); unselected switch border 3.5:1; map place labels 9.5:1, road labels 5.9:1 |

What the E2E suite covers: initial load with no console errors or failed requests; the NOAA figure beside the slider, and none in Insights; attribution present; keyboard slider (Arrow, Home, End) loading the next band without a page reload; the left panel fitting without scrolling at 900 and 650 px tall, with no play or (i) button and the colour toggle in the Sea level title row; Overall showing all the area covered and Per foot only what the level adds, with the share, at today (zeros, never blank) and +1, +2 and +3 ft; clicking a level chip; the km² / acres switch changing the figures and the low-spot line, remembered after a reload; the low-spot area under its switch only while that layer is on; in-map 2D/3D (pitch read from the control stack) and "Entire Miami Beach" restoring the 3D city view, with no duplicate reset buttons; every map control in one toolbar at the screen's right edge under the Insights card, one column at every height, with turn and tilt only in 3D and folded into one button on short windows; Overall and Per foot colour modes, with the legend only in Per foot, remembered after a reload; area bookmarks flying the camera and keeping 2D/3D; area chips' "you are here" state; Insights at a fixed 360 px with no resize or close control; the city-limits toggle; keyboard inspection (Enter on the map) with a pin for each of the 6 levels; clearing with Esc and with the × button; low-lying layer, and the vertical colour scale following the flooding layer, with no low-spot row; dialogs (content, Esc, close button); a missing manifest (no numbers shown); a missing band file (explicit warning).

Geographic calculations are verified by `src/lib/dataIntegrity.test.ts`. Turf areas match the manifest's ellipsoidal areas within 0.5% for all 10 extent and difference files. Difference area ≈ change in totals within 1%. Areas grow monotonically. All coordinates fall inside the study area. A point inside the +1 → +2 ft added extent is outside the 1 ft extent and inside the 2 ft extent.

## Not verified

- Browsers other than Chrome (Safari and Firefox not run).
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
