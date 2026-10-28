# FloodLens changelog

Every version is tagged in git (`git checkout v0.3`) and has a screenshot set in [`docs/versions/`](docs/versions/), so the design evolution can be traced for the portfolio case study. The latest screenshots are always in [`docs/screenshots/`](docs/screenshots/).

| Version | Date | Theme | Screenshots |
| --- | --- | --- | --- |
| v0.1 | 23 Oct 2026 | First working build, dark UI | [`docs/versions/v0.1-dark/`](docs/versions/v0.1-dark/) |
| v0.2 | 23 Oct 2026 | Light ArcGIS-style UI, Roboto | [`docs/versions/v0.2-light/`](docs/versions/v0.2-light/) |
| v0.3 | 27 Oct 2026 | Flood bands, in-map controls, redesigned panels | [`docs/versions/v0.3/`](docs/versions/v0.3/) |
| v0.4 | 28 Oct 2026 | Whole City of Miami Beach, new ramp, illustrated building card | [`docs/versions/v0.4/`](docs/versions/v0.4/) |
| v0.5 | 28 Oct 2026 | City locator, stream-per-foot card, city-limits toggle | [`docs/versions/v0.5/`](docs/versions/v0.5/) |
| v0.6 | 28 Oct 2026 | Viridis-style palette, area chips back, resizable Insights | [`docs/versions/v0.6/`](docs/versions/v0.6/) |
| v0.7 | 28 Oct 2026 | Blues back, human copy, Satoshi, compact answer card | [`docs/versions/v0.7/`](docs/versions/v0.7/) |
| v0.8 | 28 Oct 2026 | Clearer answers and chart: titles, selection, no false "disabled" look | [`docs/versions/v0.8/`](docs/versions/v0.8/) |
| v0.9 | 28 Oct 2026 | km² / acres switch, low spots always listed | [`docs/versions/v0.9/`](docs/versions/v0.9/) |
| v0.10 | 28 Oct 2026 | Compact card, two-block Insights that fits without scrolling | [`docs/versions/v0.10/`](docs/versions/v0.10/) |
| v0.11 | 28 Oct 2026 | One-column card with a level track, chips and bottom link back | [`docs/versions/v0.11/`](docs/versions/v0.11/) |
| v0.12 | 28 Oct 2026 | First-reached answer as the card's lead, summary and chart on tiles | [`docs/versions/v0.12/`](docs/versions/v0.12/) |
| v0.13 | 28 Oct 2026 | Agreed wording back, facts always listed, chart title, pinned footer link | [`docs/versions/v0.13/`](docs/versions/v0.13/) |
| v0.14 | 28 Oct 2026 | One tile for the area figures, "Water reaches at", no blue numbers | [`docs/versions/v0.14/`](docs/versions/v0.14/) |
| v0.15 | 28 Oct 2026 | Shorter answer box, "See it at" link removed | [`docs/versions/v0.15/`](docs/versions/v0.15/) |

---

## v0.15: A shorter box (28 Oct 2026)

Driven by a design review of v0.14.

- **The "See it at +N ft" link is removed** ("You're looking at +2 ft. See it at +3 ft →"), at every level.
- **The answer text is back to 24 px.** v0.14 had shrunk it to 20 px, but the request was to shorten the box, not the text.
- **The box is shorter: 277 × 104 px, down from 277 × 140** (in the default 344 px pane).
  - The designer chose this from three measured options.
  - "WATER REACHES AT" and **+3 ft** now share one row (label left, value right, like Height and Footprint).
  - The water band is 24 px instead of 32.
  - The gaps are 6 px instead of 10.
  - The padding is 10/8 px instead of 12/10.
  - "Not up to +3 ft" is too wide for the row, so in that case it wraps under the label (277 × 120 px).
- **The card** is 294 px tall instead of 330 for a building.
- Tests: 99 unit/component tests (the link test now checks that there's no link) and 17 end-to-end tests.

## v0.14: One tile, plain numbers (28 Oct 2026)

Driven by a design review of v0.13.

- **One tile for the area figures.** "Land underwater" (the figures at the chosen level) and "Land underwater by sea level" (the chart and per-foot breakdown) share the km² / acres switch, so they now share one tile, with a hairline between them.
- **"Water reaches at"** replaces "When water reaches it", with the level as the answer:
  - "WATER REACHES AT / **+3 ft**"
  - "Today" (water reaches it at today's high tide)
  - "Not up to +3 ft"
- **A smaller answer.** It's 20 px instead of 24 px, in black instead of blue.
- **No blue numbers.** The first-reached pin's label and the chart's selected axis label are now bold black instead of blue. Blue stays only on links ("You're looking at +2 ft. See it at +3 ft", "What this map can and can't tell you"), pins, the bar's selection ring and the selected area chip.
- Tests: 99 unit/component tests and 17 end-to-end tests.

## v0.13: Reference, not replica (28 Oct 2026)

Driven by a design review of v0.12, which followed the supplied mockup too literally.

- **The answer keeps v0.11's wording**, in v0.12's emphasised layout: "WHEN WATER REACHES IT / **At +3 ft**" (or "Already today", "Not up to +3 ft"). The mockup-derived copy is gone: "Water first reaches it", the supporting sentence, and "Not reached / First reached / Reached" under every pin.
- **The level track stays:** the water rises and stops, with a dashed marker, at the first level that reaches the place. The pins show the level only; screen readers still hear, for each level, whether water reaches it.
- **Height and footprint always show.** They used to disappear when the click landed on open ground or water rather than a building. Now the rows stay, with "—" (and "no building here" for screen readers).
- **The copy-coordinates button is removed.** It came from the mockup and wasn't asked for.
- **Chart title: one plain line, "Land underwater by sea level"**, styled like the "Land underwater" tile. The computed finding ("The biggest jump comes at +3 ft") and the subtitle are gone, along with the code that worked out the finding.
- **"What this map can and can't tell you" is pinned to the bottom of the panel.** It was the last item in the scrolling content, so when v0.13 first removed the chart's title the link rose up the panel. Now it's a footer that always sits at the bottom edge. An end-to-end test checks this with and without a selection.
- Tests: 99 unit/component tests and 17 end-to-end tests.

## v0.12: The answer first (28 Oct 2026)

Driven by a design review of v0.11, with an annotated reference for the card.

- **The answer leads the card, large.** A light-blue block reads "Water first reaches it / **at +3 ft** / Once the sea rises 3 ft above today's high tide." The other states:
  - Today: "Water already reaches it / **at high tide**".
  - Not reached: "Water doesn't reach it / **up to +3 ft** / We only map up to +3 ft, so we can't say beyond that."

  It still never says "safe" or "dry".
- **A level track like the reference.**
  - Pins sit on a baseline, each labelled with its level and "Not reached", "First reached" or "Reached".
  - The water rises in a gentle S from the left and stops at the first level that reaches the place, with a dashed drop to its larger blue pin.
  - When no level reaches it, the water runs to the end with no marker.
  - The shape is schematic, not a depth.
- **Facts stay in one column:** Height, Footprint, Low spot.
- **No "N m from street".** The title already names the street, and the distance said nothing about water. The position chip gains a copy button that copies "lat, lng" and confirms with a tick.
- **Summary and chart on tiles.** "Land underwater" and the chart with its breakdown each sit on a bordered tile with no shadow, instead of full-bleed sections with hairlines.
- **What fits:** with a place selected, everything fits without scrolling at 1440×900. At 1440×850 there's a short scroll when the street name wraps or the "See it at +N ft" line shows. The end-to-end fit test now runs at 1440×900.
- Tests: 103 unit/component tests (new: copy coordinates, reached labels, no distance) and 17 end-to-end tests.

## v0.11: One column (28 Oct 2026)

Driven by a design review of v0.10.

- **The card is one column.** The rows are When water reaches it, Height, Footprint and Low spot. Each has a tinted icon, its label on the left and its value on the right, replacing v0.10's three-across facts strip. The answer reads as a sentence: "When water reaches it · At +3 ft", "Already today", or "Not up to +3 ft". It still never says "safe" or "dry".
- **A level track instead of the house picture**, modelled on the designer's reference:
  - **Pins:** one per sea level on a baseline. The first level that reaches the place gets a larger blue pin.
  - **Water:** a light-blue band rises behind the pins. Its surface meets the blue pin, stays below the earlier pins, and covers the later ones. It's schematic, not a depth.
  - **Not reached:** the water stays below every pin.
  - **"See it" link:** "You're looking at +2 ft. See it at +3 ft →" is back on its own line under the track.
- **Chips are back** for distance and position, as in v0.4–v0.9, with position to 5 decimals again.
- **"What this map can and can't tell you" is back** at the bottom of the panel.
- **No visible "Insights" title.** The card and the two block headers already say what the panel is, so the 40 px go to content. Screen readers still get the heading.
- **What fits:**
  - At 1440×850, everything fits without scrolling with a place selected, in every state.
  - At 1440×800, it fits unless a long street name wraps and the "See it at +N ft" line shows (then about 24 px of scrolling).
  - The end-to-end fit test now runs at 1440×850.
- The house illustration and its CSS animation are removed (they're in git history at v0.10).
- Tests: 101 unit/component tests (new: the one-column order) and 17 end-to-end tests.

## v0.10: Everything at a glance (28 Oct 2026)

Driven by a design review of v0.9: the card took too much room, and the summary text felt scattered.

- **The whole panel fits without scrolling.** With a building selected, the card, summary, chart and breakdown fit in a 1440×800 window (before: 459 px of scrolling). A new end-to-end test checks this.
- **A compact building card** (576 → about 300 px):
  - **Header:** a small orange icon (matching the map selection) instead of the large tile, and distance and position on one line. Position is now shown to 4 decimals (about 11 m).
  - **Answer:** the answer block is shorter, with a 56 px scene. "See it at +3 ft →" moves into the block's top-right corner instead of taking its own line; screen readers still hear "You're looking at +2 ft. See it at +3 ft".
  - **Levels:** the dot-and-line gauge is now a slim strip, one segment per level, in the map's colours.
  - **Facts:** height, footprint and low spot sit in one row instead of three.
- **Two blocks instead of loose text.** Full-bleed sections divided by hairlines, each with an accent icon and a header (Calcite's Block pattern, not cards):
  - **Land underwater**, with the unit switch: the area at the chosen level and the share of the city's land, side by side.
  - **The chart and the per-foot breakdown.** The title is now "The biggest jump comes at +3 ft" (still computed from the data) and the subtitle "Land underwater, km², City of Miami Beach", so "Land underwater" isn't repeated in two headers.
- **Low spots only while their layer is on**, as before v0.9. The row's caption now runs full width, so it stays on one line.
- **The bottom "What this map can and can't tell you" link is gone.** "About the data" in the top bar opens the same dialog.
- **One radio-group component.** The unit switch now reuses the existing `Segmented` component, restyled to the Calcite "solid" look with no shadow, instead of duplicating its keyboard handling.
- Tests: 100 unit/component tests and 17 end-to-end tests. The new end-to-end test checks the panel fits without scrolling at 1440×800.

## v0.9: One unit at a time (28 Oct 2026)

Driven by a design review of the v0.8 Insights section.

- **km² / acres switch.** Showing both units side by side made the section busy. A segmented switch now sits at the top right of the headline and sets one unit for everything in the section:
  - The headline: "1,837 acres", then "Roughly 37% of the city's land".
  - The chart: axis, bar labels, tooltips, subtitle ("Acres, City of Miami Beach") and screen-reader table.
  - The breakdown rows.
  - The low-spots row.
  - The mobile summary.

  It's a radio group, so it's one Tab stop and the arrow keys switch units. The choice is remembered in this browser, and km² is the default. The acre axis uses round ticks (0, 1,000, 2,000) with a wider margin.
- **Low spots are back in Insights.** They were never deleted: the line only appeared when the Low spots map layer was on, and that layer is off by default. Now a "Low spots at +2 ft" row always sits under the breakdown, with the map's purple hatch, its area, and "Cut off from the sea, so not counted above". The figure is NOAA's unconnected low-lying area at the current level. It isn't added per foot like the rows above, and it can shrink at higher levels as low spots join the sea.
- New screenshot `10-insights-acres.png`.
- Tests: 100 unit/component tests and 16 end-to-end tests. New tests cover the unit switch (including the arrow keys and remembering the choice after a reload) and low spots being listed with their layer off.

## v0.8: Saying it plainly (28 Oct 2026)

Driven by a design review of v0.7.

- **"Not by +3 ft" was unclear.** The label and headline now read as one sentence. When water reaches a place: "Water reaches it · At +3 ft". When none of the mapped levels reach it: "Up to +3 ft · Water doesn't reach it". Before, the label said "Water reaches it" even when it didn't. It still never says "safe" or "dry", because we only map up to +3 ft.
- **No more "disabled" look for higher levels.** Levels above the slider were faded in the chart and the breakdown list, to say "not on the map yet". In review it read as a bug, and the numbers are just as true at any slider position. Every bar and row now keeps its full colour. Only the map legend still says "not shown", because that's about the map.
- **Selection rings the bar, not the column.**
  - Clicking a bar used to leave the browser's keyboard-focus outline round the whole column, plus a faint grey fill. Neither was designed.
  - Now the selected level gets a 2 px accent ring with a 2 px gap round its bar, the same language as the selected area chip. Its axis label turns accent and bold.
  - A mouse click no longer focuses the bar. Keyboard users still get the focus outline.
- **Chart titles follow ONS and GOV.UK guidance.** The title states the finding and the subtitle says what's measured and where:
  - Title: "Land underwater jumps at +3 ft". It's worked out from the data, not written in: it appears only when one foot adds more than half of the land and at least twice any other foot. Otherwise the title is "Land underwater at each sea level".
  - Subtitle: "Square kilometres, City of Miami Beach".
- **"Newly underwater" is now "Land underwater at +2 ft".** "Land" already means ground that's dry at today's high tide, so "newly" isn't needed. The level moves into the label, and the detail line becomes "About 244 acres, roughly 5% of the city's land". The mobile summary reads "0.99 km² of land underwater".
- New screenshot `09-north-beach-not-reached.png` shows the new answer.
- Tests: 96 unit/component tests (new: chart title rules, rows never faded) and 15 end-to-end tests. The chart test now checks the data-driven title and that a mouse click doesn't focus the bar.

## v0.7: A human voice (28 Oct 2026)

Driven by a design review of v0.6.

- **Blues are back.** The viridis-style ramp didn't read as water. The flood bands return to the single blue ramp (light blue today → navy at +3 ft), across the map, legend, chart, slider, card streams and gauge.
- **Chips, cleaned up.**
  - Flat: white with a 1 px border, no drop shadow and no tinted fill.
  - The chip you pick turns accent blue with a 2 px border the moment you click. Before, it only lit up once the camera arrived.
  - Panning by hand hands the highlight back to the nearest area.
- **A compact answer.** The "first reached" headline drops from 30 to 22 px. The illustration has a fixed 88 px height, so it no longer grows as the Insights pane widens; the water just runs further left.
- **Copy rewritten in a plain, human voice.** It covers every panel, the legend, map hover text, errors and the About dialog. The voice, rules and a before/after table are in [docs/UX_WRITING.md](docs/UX_WRITING.md). Examples:
  - "Flooded beyond today's high tide" became "Newly underwater at high tide".
  - "First reached at +3 ft" became "Water reaches it: At +3 ft".
  - "Above +3 ft" became "Not by +3 ft".
  - "Low-lying, not ocean-connected" became "Low spot, cut off from the sea".

  The copy still never says "safe" or "will flood". The About dialog also no longer describes the pre-v0.4 colour order.
- **Satoshi for the interface.** It's served by Fontshare, Indian Type Foundry's official web-font service, under the ITF Free Font License. That licence allows use on your own site but not redistributing the files (for example in a public repository) or converting them. So the font files stay out of the repo, and map labels stay in Roboto: MapLibre needs fonts converted to SDF glyphs.
- Tests: 91 unit/component tests, 15 end-to-end tests, updated for the new wording.

## v0.6: Colour and room (28 Oct 2026)

Driven by a design review of v0.5.

- **Area chips are back.** The v0.5 locator mini-map was less clear than the South Beach / Mid-Beach / North Beach chips, so the chips return, with more padding (16 × 6 px, 13 px text; a little tighter on phones so all three fit) and a 16 px gap from the map edge. The map controls and legend now share that 16 px gutter. When you're zoomed in, the chip for the nearest area is highlighted, which keeps the locator's useful "you are here" cue.
- **A flood palette that isn't all blue.** The bands now follow a viridis-style ramp: lime (today), green (+1 ft), teal (+2 ft), indigo (+3 ft). It still darkens as the water rises, so the order reads in greyscale. Changing hue as well as lightness makes neighbouring levels easier to tell apart than the single blue (worst adjacent OKLab ΔE 16.5 vs 14.4), including for colour-vision deficiencies. Map, legend, chart, slider track and the card's water streams all use it. The card's level gauge now wears these colours too, so it doubles as a legend.
- **Resizable Insights pane.** Drag its left edge, or focus the divider and use the arrow keys (Shift for bigger steps, Home/End for the limits). Double-click resets it. The width stays between 300 and 560 px and never squeezes the map below about 420 px. It is remembered in this browser.
- Tests: 90 unit/component tests (new: width limits, nearest-area logic); 15 end-to-end tests (new: resizing, chip highlight).

## v0.5: Less text, more place (28 Oct 2026)

Driven by a design review of v0.4.

**Building card**
- **The answer stands alone.** Removed the caption under "First reached at +3 ft" (it repeated the headline) and the caveat line at the bottom (the limits are one click away in "Data sources & limitations" and "About the data").
- **"≈" says approximate.** "Height (approx.)" and "Footprint (approx.)" are now "Height" and "Footprint".
- **One stream of water per foot.** The dashed level line and "+3 ft" badge are gone. The illustration shows one wave per foot in the map's colour for that foot. A building first reached at +3 ft sits on higher ground with three streams rising to it; one reached at +1 ft gets one stream. Places above +3 ft stand clear of all three. The streams rise one after another when the card opens (off with reduced motion).

**Map**
- **Livelier water.** Basemap water is a light aqua `#a8dcea` instead of a dull grey-blue. Its hue is greener than the azure flood ramp, so the two stay distinct.
- **No more overlap at the bottom edge.** The credits line runs along the very bottom, the scale bar sits above it on the right, and the legend sits above both on the left. On phones the controls lift above the insights sheet.
- **City locator replaces the "Go to" chips** (from 768 px; phones keep the chips, minus the "Go to" label). It is a mini-map of the whole city that shows:
  - the current view as an outline;
  - the flood bands at the current level;
  - South Beach, Mid-Beach and North Beach as labelled jump targets, with the nearest one highlighted when zoomed in.

  Click a name or anywhere on the mini-map to fly there.
- **City limits toggle is back** (from v0.2). It hides the dashed boundary and the dimmed area outside it. The legend row follows.

**Sea level**
- The caption under the level reads "above today's high tide", without the "(MHHW)" jargon. The (i) button still explains Mean Higher High Water, and screen readers still hear "above MHHW".

**Tests:** 85 unit/component tests; 14 end-to-end tests (new: city locator, city-limits toggle).

## v0.4: The whole city (28 Oct 2026)

Driven by a design review of v0.3. Each change lists the problem it solved.

**Data**
- **Study area: the City of Miami Beach.** v0.3 covered an 18.7 km² rectangle over South Beach. v0.4 clips NOAA's data to the city's municipal boundary from the US Census Bureau (TIGER/Line 2026, GEOID 1245025, public domain): 39.4 km² from South Pointe to the northern city limit, including the bay waters inside city limits. It is the area a city planner is responsible for, and the boundary has an authoritative source. All six difference validations pass.
- New figures: beyond today's high tide, +1 ft adds 0.038 km², +2 ft 0.95 km² and +3 ft 6.44 km² (7.43 km² in total at +3 ft, equal to 37% of the city's Census land area).

**Map**
- **Flood ramp reversed and rebuilt.** v0.3 made lower levels darker ("reached sooner"). In review that read backwards: depth isn't shown, so "submerged is submerged". The bands are now one blue hue that darkens as the water rises (today `#9ec5f4` → +3 ft `#104281`), using evenly spaced steps of a validated sequential blue scale. Basemap water is now a muted grey-blue so the flood blues never read as plain water.
- **Buildings in light sandstone** instead of taupe grey, which looked heavy. The warm stone colour is the complement of the blue ramp, so buildings stay legible on every band.
- **"Show all of Miami Beach"** replaces Home. A house icon suggested "go home"; the frame icon and label say what it does: fit the whole city back into view.
- **Area bookmarks.** South Beach, Mid-Beach and North Beach chips fly the camera along the 12.6 km city and keep the current 2D/3D mode. They are camera positions only; no statistics are reported for these unofficial areas.
- **Opening view fits the city** to any screen, tilted 40° and looking up the island, with room for the mobile bottom sheet.

**Insights**
- **Building card rebuilt from a reference design:**
  - An orange icon tile (the map's selection colour), the title, and chips for distance to street and coordinates.
  - A "First reached" hero with a large answer and an illustration: the water rises to the level that first reaches the building, with the level on a gauge line.
  - A four-stop gauge (today → +3 ft).
  - Icon rows for height, footprint and low-lying status.
  - A one-line caveat.
- If the slider is below the level that reaches the building, one click shows that level on the map.
- **The card now opens at the top of Insights**, where the "Click any building" prompt sits, so the answer appears where the eye already is.
- **Units spelled out:** "acres", never "ac". The headline adds "equal to N% of the city's land area" so the number is relatable.

**Engineering**
- Pipeline: Census boundary download and polygon clipping (`scripts/prepare_noaa_slr.py`); manifest records the boundary's source, GEOID, licence and Census land/water areas.
- Study-area tests use the real outline (point-in-polygon), not its bounding box; the outside mask also masks holes in the boundary.
- Tests: 85 unit/component tests (new InspectionCard suite), 13 end-to-end tests (new area-bookmark test).

## v0.3: Clarity pass (27 Oct 2026)

Driven by a design review of v0.2. Each change lists the problem it solved.

**Map and data visualization**
- **Flood bands by water level.** v0.2 drew every scenario in the same blue, so you couldn't tell what flooded at +1 ft from what flooded at +3 ft. Each area is now coloured by the level at which NOAA's mapped extent *first* reaches it: navy for today, then blue, sky blue and aqua for +1/+2/+3 ft. Darker means reached sooner, so most exposed, which matches how depth maps read (the core floods first, the edges last). The bands are the validated neighbour differences (0→1, 1→2, 2→3 ft) that the pipeline already produced.
- **Comparison mode removed.** The "Compare two scenarios" toggle confused users. The bands show every level's contribution on one map, so the separate mode was redundant.
- **Spotlight.** Hovering a level in the legend, the chart or the breakdown list dims the other bands on the map.
- **Buildings in warm taupe grey** instead of near-white, for clear contrast against the pale-blue water and the blue bands. Selection is orange, which no data layer uses.
- **Building picking fixed:**
  - In 3D, a click now follows the view ray to the first building it enters. Before, a roof click hit the ground behind the building, and some buildings felt unclickable.
  - Building pieces split by map-tile edges are re-joined, which fixes the partial highlight.
  - The highlight is drawn 0.4 m wider and 0.6 m taller than the building, which removes the flicker while zooming.

**Controls and layout**
- **Map controls moved into the map** (zoom, compass, Home, 2D/3D), in the ArcGIS and komoot pattern. "Reset view" (header) and "Reset camera" (panel) were duplicates and are now one Home button. "Inspect center" became a keyboard shortcut: focus the map and press Enter.
- **Left panel is now "Sea level" + "Layers" only.** The slider track is painted with the band ramp, so it doubles as a key. **Play the rise** animates today → +3 ft. The study-area and legend toggles are gone: the boundary is always shown, and the legend collapses itself.
- **Insights panel** leads with one large headline number, then the stacked chart, then a breakdown of "+N ft adds …". The "About these numbers" block became a single "Data sources & limitations" link.
- **Selected-building card redesigned:** what it is → the answer (first reached at …) → a level-by-level ladder → height and footprint → the caveat. Esc or × clears it.

**Typography:** a named Roboto type scale (display 36, metric 28, title 16, heading 14, label/body 13, caption 12, overline 11) replaces ad-hoc sizes.

**Engineering**
- New pure, unit-tested modules: `src/lib/buildingPick.ts` (ray picking, tile re-joining, highlight offset) and `bandsFor` in `src/lib/manifest.ts`.
- Fixed a camera bug where an interrupted animation could flip 2D/3D back (only user gestures now sync the toggle).
- Fixed a playback bug where rapid ticks repeated a level (found by a new unit test).
- Tests: 75 unit/component tests, 12 end-to-end tests (desktop and mobile).

Inspiration (Mobbin): Felt (legend card), komoot (in-map control stack), Apple Weather and The Weather Channel (stepped colour key, playable timeline), Kiwi.com and Expedia (selected-item cards).

## v0.2: Light theme and Roboto (23 Oct 2026)

- Light, Calcite-inspired UI: white panels, Esri-style blue accent `#0069b0`, all text WCAG AA.
- Basemap switched to OpenFreeMap Positron, restyled into a warm, geographic palette.
- Roboto everywhere, including map labels (self-hosted SDF glyphs, because OpenFreeMap only serves Noto Sans).

## v0.1: First working build (23 Oct 2026)

- Real NOAA OCM sea-level-rise data (FL_SE GeoPackage) clipped to South Beach by a reproducible Python pipeline, with validated difference layers.
- React + MapLibre 3D map, scenario slider, overlay comparison (blue/amber), D3 chart, location inspection, data dialogs.
- Dark navy UI. Screenshots were captured from the in-app preview at reduced size. v0.1 predates the git history, so its code isn't tagged.
