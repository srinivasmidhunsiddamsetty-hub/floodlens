# FloodLens: case study notes

Working notes for a future portfolio case study. Everything here describes design intent and what was built. **No user research or usability testing has been conducted yet**, and nothing below should be presented as research findings or measured outcomes.

---

## 1. Project overview

- **Product:** FloodLens, a Coastal Exposure Explorer
- **Tagline:** See the coastline. Understand the exposure.
- **Category:** Geospatial decision support · climate resilience · interactive 3D visualization
- **Scope:** Single-screen web app for the City of Miami Beach, FL (municipal boundary, US Census TIGER/Line), using real NOAA sea-level-rise inundation polygons for 0, +1, +2 and +3 ft above MHHW.
- **Role (self-initiated):** Product design (IA, interaction, visual, data-viz), front-end engineering (React/TypeScript/MapLibre/D3), GIS data preparation (Python/GEOS).
- **Timeframe:** 1–2 day MVP build.

## 2. Problem and design opportunity

Coastal planners can download authoritative inundation datasets, but making sense of them usually takes GIS expertise. Scenarios sit in separate layers or files, comparisons require manual overlay, and caveats sit in metadata documents away from the map.

**Opportunity:** combine scenario selection, comparison, the built environment and the data's limitations into one approachable spatial view that helps someone *screen* exposure and decide where to look more closely.

Questions the product is designed to help answer:
1. How does the mapped extent change between scenarios?
2. Where are the largest visible differences?
3. Which parts of the urban fabric overlap the mapped extent?
4. Can I compare quickly without switching maps?
5. What can and can't I conclude from this data?

## 3. Provisional target users

These are **assumption-based profiles**, not validated personas.

- **Primary: municipal resilience planner.** Compares potential inundation extents, identifies areas for further investigation, and communicates first observations to colleagues and stakeholders.
- **Secondary: urban designer / policy analyst.** Wants a clear visual overview without running desktop GIS.

Key assumptions to test: users understand "above MHHW" with a short explanation; "added extent" is a more useful headline than total area; 3D context helps more than it distracts.

## 4. Design goals

1. **Spatial context first.** The map takes most of the screen, and panels are collapsible.
2. **Progressive disclosure.** Scenario first, then comparison and layers, then inspection details, then full methodology in dialogs.
3. **Data with context.** Every number states what it measures and where it comes from.
4. **Compare without overwhelming.** At most two scenario states on the map at once.
5. **No GIS jargon required.** "Mapped inundation extent" rather than "slr polygon", "Low-lying, not ocean-connected" rather than "hydrologically unconnected".
6. **Premium but purposeful visuals.** No decoration that competes with geography.

## 5. Information architecture

```
Top bar ─ Brand · Location · [Data sources] [About the data] [Reset view]
├─ Left: Explore scenarios
│   ├─ Scenario (large readout + discrete slider + MHHW reference on demand)
│   ├─ Compare (toggle → "compare with" segmented control → colour key)
│   ├─ Map layers (inundation, low-lying, buildings, labels, study area)
│   └─ Display (2D/3D, reset camera, inspect centre, legend)
├─ Centre: Map (3D, legend, status / warnings, attribution)
└─ Right: Exposure insights
    ├─ Headline sentence (plain-language result)
    ├─ Indicators (beyond 0 ft, change from previous, total extent, low-lying)
    ├─ D3 chart (added extent by scenario; click/keyboard to select)
    ├─ Inspection card (selected location / building)
    └─ About these numbers → About the data dialog
```

Mobile: the left panel becomes a drawer. The right panel becomes a bottom sheet whose collapsed peek shows the headline number.

## 6. Key interaction decisions

| Decision | Rationale |
| --- | --- |
| **Discrete slider** (native `<input type=range>`) with tick shortcuts | Communicates an ordered water-level scale while preventing in-between values that NOAA did not map. The native control gives keyboard, touch and screen-reader behaviour for free. |
| **Scenario swap preserves the camera** | Users compare by toggling in place, so the view must not jump. |
| **Flood bands instead of a compare mode (v0.3)** | Colouring each area by the level that first reaches it shows every level's contribution on one map. The v0.2 compare toggle needed explaining; the bands don't. |
| **In-map camera controls (v0.3)** | Zoom, compass, Home and 2D/3D act on the map, so they live on it. This removed duplicate reset buttons. v0.4 swapped the house icon for a frame icon labelled "Show all of Miami Beach", which says what it does. |
| **Area bookmarks (v0.4)** | The study area grew to a 12.6 km-long city. Chips for South Beach, Mid-Beach and North Beach get from overview to street-level 3D in one click. |
| **Overlays beneath basemap water** | NOAA's 0 ft extent includes open water. Drawing it beneath the water layer makes blue appear only where water reaches land, which is the planner's question, without altering the data. |
| **Inspection probes all scenarios** | Answers "at what level does this place first fall inside the mapped extent?", which is more useful than a yes/no for the current scenario. |
| **Building clicks use the footprint**, not the click point | In 3D a roof click unprojects to the ground behind the building. Using the footprint is both more correct and more meaningful. |
| **"Inspect map center" button** | Keyboard and screen-reader alternative to clicking the canvas. |
| **2D switches buildings to footprints** | Flat-roofed extrusions in a top-down view hide the overlay beneath them. |

## 7. Data visualization decisions

- **Headline metric = extent beyond the 0 ft reference.** The total extent is dominated by existing open water inside city limits (19.7 of 39.4 km²), so it barely changes. The added extent (0.04 → 0.99 → 7.43 km²) shows the non-linear growth that matters. v0.4 adds acres and "equal to N% of the city's land area" (Census land area) so the number is relatable.
- **Bar chart, not a line.** Scenarios are discrete states, and a line would imply interpolation.
- **Chart title:** v0.8–v0.12 used a computed finding as the title plus a measure-and-place subtitle (ONS / GOV.UK guidance), such as "The biggest jump comes at +3 ft". v0.13 cut it to one plain line, "Land underwater by sea level", because the tile above already carries the measure. The selected level gets a ring round its bar, and every bar keeps full colour whatever the slider shows (v0.8).
- **Colour:** a light, ArcGIS-style geographic basemap (warm land, sage parks, pale-blue water, white roads) keeps the strongest colours for data. Saturated blue marks mapped inundation, clearly darker than the pale water; orange marks the added extent (a colour-vision-deficiency-safe pair); a purple hatch marks low-lying areas (readable without colour); and a blue ring with a white-outlined core marks the selection.
- **Typography:** Satoshi for the interface (v0.7, friendlier and more contemporary); Roboto for map labels, which need self-hosted SDF glyphs that Satoshi's licence doesn't allow creating.
- **Copy:** plain, calm and honest, never "safe" or "will flood". See [docs/UX_WRITING.md](docs/UX_WRITING.md).
- **Units:** one at a time, km² or acres, picked with a switch in the Insights panel and remembered in the browser (v0.9). Showing both side by side made every row harder to scan. "acres" is always spelled out, never "ac". Geodesic areas only.
- **Language:** "within the mapped extent", never "will flood". No depths, dates or probabilities.
- **Study area made visible:** a dashed boundary and a dimmed outside area, so clipped data aren't mistaken for "no flooding".

## 8. Technical decisions and constraints

- **Static, keyless deployment.** No backend. Processed GeoJSON (225 KB – 1.4 MB per layer) is lazy-loaded per state.
- **Offline geoprocessing.** Clipping, differencing and validation run in Python/GEOS, where they can be tested, rather than in the browser.
- **Free basemap.** OpenFreeMap restyled at runtime through a pure, unit-tested transform. A plain fallback keeps NOAA overlays usable if the basemap fails.
- **Data acquisition constraint.** The only vector source of ocean-connected extents is a 977 MB zip / 4.1 GB GeoPackage. The pipeline reads it through the spatial index and clips before repairing geometry. Repairing first did not finish within 10 minutes; clipping first takes under a second per layer.
- **Separation of concerns.** Pure `lib/` functions (tested), a single reducer for app state, and MapView as the only module that touches MapLibre.

## 9. Accessibility considerations

- Native range input and ARIA radio groups for scenario, comparison and 2D/3D controls, with arrow, Home and End keys.
- Switches use `role="switch"` with visible labels and descriptions.
- Visible blue focus rings, including on MapLibre controls.
- The D3 chart has keyboard-focusable bars, `aria-pressed`, and a hidden data table with every value.
- Live regions for loading, scenario changes and inspection results. Errors use `role="alert"`.
- Native `<dialog>` for focus containment and Esc to close. A skip link to the map.
- `prefers-reduced-motion` disables camera animation, chart transitions and fades.
- Tooltips only repeat information that is available elsewhere.
- Known gap: the WebGL canvas itself can't expose features to assistive tech. Inspection results are the text alternative.

## 10. Usability-testing plan (not yet run)

**Participants:** 5–6 people. Mix of municipal or regional planners, resilience consultants and urban-design students.

**Tasks:**
1. "What does +2 ft mean here?" (comprehension of MHHW framing)
2. "Which part of South Beach shows the largest added extent between +2 and +3 ft?" (comparison)
3. "Is the Flamingo Park area within the mapped extent at +1 ft? At +3 ft?" (inspection)
4. "Prepare one observation you would share with a colleague, including its caveat." (communication and limitations)
5. "Switch to a top-down view and back without losing your place." (navigation)

**Measures:** task success, time on task, errors, SEQ per task, SUS overall, and qualitative notes on terminology ("MHHW", "ocean-connected", "added extent") and trust.

**Hypotheses to check:** the headline sentence improves comprehension over numbers alone; overlay comparison beats side-by-side for spotting change; users don't over-interpret "within the mapped extent" as certainty.

## 10a. Iteration log

The product went through numbered versions, each tagged in git with screenshots (see [CHANGELOG.md](CHANGELOG.md)):

- **v0.1 → v0.2:** the dark "control-room" look read as decorative. Moved to a light, ArcGIS/Calcite-like UI with a geographic basemap and Roboto, to match the tools planners already use.
- **v0.2 → v0.3:** a design review found that one blue for every level hid *how* flooding spreads, that the compare toggle was hard to understand, that reset controls were duplicated, that building selection was unreliable in 3D, and that the panels lacked hierarchy. Fixes: flood bands, in-map controls, one headline number, a redesigned building card, a type scale, and ray-based 3D picking.
- **v0.3 → v0.4:** review feedback: the darker-for-lower ramp felt backwards, the buildings read as heavy grey, the Home icon didn't say what it did, "ac" was cryptic, and South Beach alone was too narrow. Fixes: a single-hue ramp that darkens as the water rises, sandstone buildings, a frame icon for "show all", acres spelled out, an illustrated building card modelled on a reference the designer supplied, area bookmarks, and the full City of Miami Beach boundary from the Census Bureau.
- **v0.4 → v0.5:** the card still carried text the answer didn't need (a caveat, "approx." next to "≈", a caption repeating the headline), the water looked dull, the legend ran into the credits and scale bar, "Go to" chips gave no sense of place, and the boundary toggle from v0.2 was missed. Fixes: a leaner card whose illustration shows one stream of water per foot, light-aqua water, a clean bottom edge, a city locator mini-map, and the city-limits layer toggle restored.
- **v0.5 → v0.6:** the locator mini-map was less clear than the chips it replaced, the all-blue ramp felt monotonous, and the Insights pane had a fixed width. Fixes: the chips are back with roomier padding and a "you are here" highlight, a viridis-style ramp (lime → indigo) that also separates neighbouring levels better, and a resizable Insights pane with limits.
- **v0.6 → v0.7:** the viridis colours didn't read as water, the chips had a shadow and only lit up after the camera arrived, the card's answer was oversized, and the wording sounded like a GIS report. Fixes: the blues are back; flat chips that highlight on click with a 2 px border; a compact answer block; a full copy pass in a plain, human voice (docs/UX_WRITING.md); and Satoshi as the interface font.
- **v0.7 → v0.8:** "Not by +3 ft" was unclear in design review, and its label said "Water reaches it" even when it didn't. Levels above the slider were faded and looked like a bug. Clicking a bar left a box round the whole column. "Newly underwater" and "Each foot adds more" didn't say what was measured. Fixes: label and answer read as one sentence ("Up to +3 ft · Water doesn't reach it"); full colour at every level; a ring round the selected bar; and chart titles that follow ONS/GOV.UK guidance, with the finding computed from the data.
- **v0.8 → v0.9:** showing km² and acres side by side made the Insights section busy, and the low-spots line only appeared when the Low spots map layer was on (off by default), so it looked removed. Fixes: a km² / acres switch, so every figure shows in one unit; and a "Low spots at +N ft" row under the breakdown, shown whatever the map layers are.
- **v0.9 → v0.10:** the building card took over half the panel, so the summary and chart sat below the fold, and the summary text felt scattered. Fixes:
  - A compact card, 576 → about 300 px.
  - Two clear blocks: "Land underwater" with two side-by-side figures, and the chart with its breakdown.
  - The redundant bottom link is gone, and low spots show only while their layer is on.
  - Everything now fits at 1440×800 with a place selected, and an end-to-end test checks it.
- **v0.10 → v0.11:** the facts strip and the plain-text position line felt cramped and unlike the earlier card, and the bottom link was missed. Fixes:
  - A one-column card: when water reaches it, height, footprint, low spot.
  - The chips are back.
  - A level track replaces the house illustration, modelled on the designer's reference: pins on rising water, with the first level that reaches the place in blue.
  - The bottom link is back.
  - The visible "Insights" title is dropped to make room.
  - It all fits at 1440×850 in every state, and at 800 unless a long street name and the "See it" line both show.
- **v0.11 → v0.12:** the designer supplied an annotated reference for the answer, and asked for the summary and chart on tiles instead of loose sections. Fixes:
  - "Water first reaches it / **at +3 ft**" leads the card again, over a level track where the water stops at the first level that reaches the place, and every pin says "Not reached", "First reached" or "Reached".
  - The facts stay in one column.
  - The summary and the chart each sit on a tile.
  - The distance to the street was dropped (the designer's call, which I agreed with), and a copy-coordinates button was added.
  - The bigger answer and the tiles cost height: everything now fits at 1440×900.
- **v0.12 → v0.13:** v0.12 followed the reference too literally. It replaced the agreed wording, added status labels under every pin, a supporting sentence and a copy button, and appeared to drop height and footprint (they were hidden for clicks that weren't on a building). Shortening the chart also let the bottom link drift up the panel. Fixes:
  - v0.11's wording, emphasised: "When water reaches it / **At +3 ft**".
  - The extras lifted from the reference are gone.
  - Height and footprint always show, with "—" when the click isn't on a building.
  - The chart title is one plain line.
  - The bottom link is a pinned footer.
  Lesson: take a reference's layout, not its words, and change only what was asked.
- **v0.13 → v0.14:** the summary and chart sat on separate tiles but used one unit switch, the answer label was wordier than needed, and blue numbers competed with links. Fixes:
  - One tile for both.
  - "Water reaches at · +3 ft".
  - A smaller answer (20 px).
  - Every number in black.
- **v0.14 → v0.15:** the review had asked for a shorter *box*, not smaller text, and the "You're looking at +2 ft. See it at +3 ft" link wasn't wanted. Fixes:
  - The answer text is back to 24 px.
  - The link is removed at every level.
  - I measured the box (277 × 140 px) and offered three ways to shorten it. The designer picked the answer on the label's row, with a 24 px water band and tighter gaps: 277 × 104 px, and the card drops from 330 to 294 px.

## 11. Known limitations

See [docs/LIMITATIONS.md](docs/LIMITATIONS.md). In short: screening-level NOAA bathtub data (no surge, erosion, subsidence or depth), a single city-wide study area, approximate OSM building heights, no building-level exposure counts, and canvas content that is not exposed to screen readers.

## 12. Potential future improvements

- Building-footprint exposure summaries using an authoritative footprint dataset (for example county or Microsoft footprints), computed offline with documented methods.
- NOAA mapping-confidence rasters as an uncertainty layer.
- Depth rasters, with correct units (metres above ground) and an explicit legend.
- Half-foot scenarios (NOAA publishes 0.5 ft steps) and more study areas.
- Swipe or split comparison once two synchronized maps can be made robust.
- Shareable URL state (scenario, comparison, camera) and an export of observations with caveats attached.
- Run the usability study above and iterate on terminology.
