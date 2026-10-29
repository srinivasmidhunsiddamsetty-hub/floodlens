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
| v0.16 | 28 Oct 2026 | Answer box down to 92 px | [`docs/versions/v0.16/`](docs/versions/v0.16/) |
| v0.17 | 28 Oct 2026 | Sea levels up to +5 ft, six-step blue ramp | [`docs/versions/v0.17/`](docs/versions/v0.17/) |
| v0.18 | 28 Oct 2026 | Legend shows every level's true colour | [`docs/versions/v0.18/`](docs/versions/v0.18/) |
| v0.19 | 28 Oct 2026 | One "adds" row for the selected level | [`docs/versions/v0.19/`](docs/versions/v0.19/) |
| v0.20 | 28 Oct 2026 | Vermilion selection, stat tiles, grey canvas, tiled left panel, rounded bars | [`docs/versions/v0.20/`](docs/versions/v0.20/) |
| v0.21 | 28 Oct 2026 | Two-line sea-level (i) note | [`docs/versions/v0.21/`](docs/versions/v0.21/) |
| v0.22 | 28 Oct 2026 | Clearer (i) note, level track without circles | [`docs/versions/v0.22/`](docs/versions/v0.22/) |
| v0.23 | 28 Oct 2026 | Smaller level labels in the card's track | [`docs/versions/v0.23/`](docs/versions/v0.23/) |
| v0.24 | 28 Oct 2026 | Smaller x-axis labels in the chart | [`docs/versions/v0.24/`](docs/versions/v0.24/) |
| v0.25 | 28 Oct 2026 | Building areas in m², soft depth and glass, bolder type | [`docs/versions/v0.25/`](docs/versions/v0.25/) |
| v0.26 | 28 Oct 2026 | Earlier legend back, no bottom link, larger card facts | [`docs/versions/v0.26/`](docs/versions/v0.26/) |
| v0.27 | 28 Oct 2026 | Insights cards float over the map at 380 px; solid area chips that toggle | [`docs/versions/v0.27/`](docs/versions/v0.27/) |
| v0.28 | 28 Oct 2026 | A static legend | [`docs/versions/v0.28/`](docs/versions/v0.28/) |
| v0.29 | 29 Oct 2026 | A shorter map credit that folds into an (i) | [`docs/versions/v0.29/`](docs/versions/v0.29/) |
| v0.30 | 29 Oct 2026 | "Up to +5 ft · Doesn't reach it" | [`docs/versions/v0.30/`](docs/versions/v0.30/) |

---

## v0.30: A direct answer when water doesn't reach a place (29 Oct 2026)

- **When none of the mapped levels reach a place, the card says "Up to +5 ft · Doesn't reach it"** instead of "Water reaches at · Not up to +5 ft". The label carries the limit (FloodLens maps up to +5 ft), so the plain answer doesn't claim more than the data shows. It never says "safe" or "dry", since NOAA's layers don't model storms, rain or groundwater.
- It fits on one line in the 380 px pane, so the box stays 90 px tall. Places the water reaches keep "Water reaches at · +3 ft" (or "Today").
- Tests: 104 unit/component tests (the not-reached test checks the new label and answer) and 18 end-to-end tests. Screenshot `09` shows the new answer.

## v0.29: A shorter map credit that folds away (29 Oct 2026)

- **Shorter credit line**, same credits, every one still linked:
  - Now: "© OpenStreetMap · © OpenMapTiles · OpenFreeMap | Flood data: NOAA | Boundary: US Census", 504 px on desktop.
  - Before: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap | Inundation: NOAA Office for Coastal Management | Boundary: US Census Bureau", about 690 px.
  - The order is now fixed. MapLibre sorts credits by length, so the basemap's credit (from its TileJSON) is blanked and the app writes the whole line itself. The basemap part is left out if the basemap fails to load.
- **What's required:**
  - OpenStreetMap's licence (ODbL) requires crediting OpenStreetMap with a link to its licence page; "© OpenStreetMap" is an accepted form.
  - OpenMapTiles asks for a visible, linked credit.
  - OpenFreeMap's quick start shows its name in the credit but doesn't say it's required, so it's kept as a courtesy.
  - NOAA and Census data are US-government public domain. They're credited because the map shows their data.
- **Folds into an (i):** the credit starts open and collapses to an (i) button on the first drag; the (i) opens it again. The OSMF attribution guidelines allow collapsing "on map interaction such as panning, clicking, or zooming", as long as the licence information can still be found (the (i), and the Data sources dialog). Phones and desktop now behave the same; phones previously used a shorter NOAA name.
- New screenshots `11-credit-open.png` and `12-credit-folded.png`.
- Tests: 104 unit/component tests (new: sources' own credits are blanked; the basemap credit links OpenStreetMap's licence page) and 18 end-to-end tests (new: the credit's text, its fold on drag and the (i) reopening it).

## v0.28: A static legend (28 Oct 2026)

- **The legend is a plain key.** Each level used to be a hidden button: hovering or tabbing to it faded the other flood levels on the map. Levels above the slider were switched off, since they aren't drawn yet. So the rows looked selectable, did nothing on click, and half of them silently didn't respond. Now they only say what each colour means.
- Spotlighting a level is still there, on the chart (hover a bar or a slice of one) and on its "+N ft adds" row.
- Keyboard users no longer tab through up to six legend rows; the only legend control is its open/close header.
- Screenshot `02` now spotlights +2 ft from the chart (its slice of the +5 ft bar) instead of the legend.
- Tests: 102 unit/component tests (new: the legend levels aren't buttons) and 17 end-to-end tests.

## v0.27: Floating Insights cards, toggling area chips (28 Oct 2026)

- **The Insights cards float over the map.** The grey back panel on the right is gone, so the map runs to the right edge under the cards.
  - The camera is padded by the cards' width, so the city overview, the area fly-tos and "the middle of the map" (keyboard Enter) all use the uncovered part.
  - The map controls, scale bar and attribution sit just left of the cards. Collapsing or resizing the cards eases the map with them.
  - Only the cards take clicks; the map works in the space below them.
  - The left panel stays docked. Floating both sides was previewed but not chosen.
  - Below 1024 px nothing changes (bottom sheet).
- **Default width 380 px (was 344).** Measured with Satoshi: long titles such as "Building near Pennsylvania Avenue" need about 364 px to stay on one line, and "Water reaches at · Not up to +5 ft" about 361 px. The pane is still resizable from 300 to 560 px.
- **Area chips:** the selected chip is filled with the accent (white text) instead of an outline. Clicking it again goes back to all of Miami Beach, with no chip lit. "Show all" now also clears a picked chip; before, it stayed lit over the whole-city view.
- **Card labels:** Height, Footprint and Low spot are 14 px medium (were 16 px regular). "Water reaches at" uses the same style: sentence case, 14 px medium, black. It was a grey 10.5 px uppercase overline.
- Previews of the width, floating both sides and the label case are kept as `11`–`13`.
- Tests: 101 unit/component tests and 17 end-to-end tests. The chip test now checks that clicking the lit chip shows the whole city; the resize test uses the 380 px default.

## v0.26: Earlier legend, larger card facts (28 Oct 2026)

- **The legend is back to its v0.24 look:** solid white with a 1 px border, small corners and the regular-weight "Water first reaches" overline. The area chips and map controls stay frosted glass.
- **No bottom link.** "What this map can and can't tell you" is gone from the Insights panel. "About the data" in the top bar opens the same dialog.
- **Bold titles:** the card's title ("Building near Bay Road") and "Land underwater" are now bold (700). They were semibold (600). Satoshi loads as a variable font, so 600 is a real, lighter weight; the v0.25 note saying it already rendered as bold was wrong.
- **Larger card facts:** the labels (Height, Footprint, Low spot) are 16 px, up from 13 px. The values (≈ 132 m, ≈ 7,160 m², No) are 20 px, up from 14 px. With a place selected, the panel still fits without scrolling at 1440×900.
- **No icon beside "Land underwater by sea level".**
- Tests: 101 unit/component tests and 17 end-to-end tests. The fit test now checks that the bottom link is gone, and the dialog test opens About the data from the top bar.

## v0.25: Building areas in m², a more premium finish (28 Oct 2026)

- **Building areas are always in m².** A footprint of 10,000 m² or more used to switch to km² ("≈ 0.011 km²"), unlike every other building. Footprints, and the low part of a footprint, now always read in m² ("≈ 11,421 m²").
- **Premium finish.** Four directions were previewed as before/after images (soft depth and glass, bolder type, map lighting, navy header). Two were chosen:
  - **Soft depth and glass:** the panel cards lose their hard border for a faint ring and a soft shadow, with 16 px corners. The canvas is a cooler grey (`#f1f3f6`). The area chips, legend and map controls are frosted glass over the map. The header has a soft shadow instead of a line.
  - **Bolder type:** the wordmark, the panel titles ("Sea level", "On the map"), the sea level (+2 ft), the answer (+3 ft) and the two figures are bold with tighter tracking. Overlines ("Water reaches at") are bold with wider spacing. Sizes and wording are unchanged.
  - Map lighting and the navy header weren't chosen. Their previews are kept in the version folder.
- **Contrast on glass:** the glass is 88% white, so accent text keeps 4.5:1 even over the darkest flood blue. Secondary text on glass is a step darker (`#575757`, 5.7:1 in that worst case). With *reduce transparency* on, the glass turns solid white.
- New screenshots `11`–`14`: the four before/after previews.
- Tests: 101 unit/component tests and 17 end-to-end tests.

## v0.24: Smaller chart axis labels (28 Oct 2026)

- **The chart's x-axis labels** (Today, +1 ft … +5 ft) are 10 px instead of 11 px, to match the card's level track. The selected level's label stays bold.
- The y-axis numbers and the values above the bars are unchanged at 11 px.
- New screenshot `11-chart-axis-labels.png` (the area tile at 2×).
- Tests: 101 unit/component tests and 17 end-to-end tests.

## v0.23: Smaller track labels (28 Oct 2026)

- **The level labels under the card's water track** (Today, +1 ft … +5 ft) are 10 px instead of 12 px, with a 14 px line. The first level that reaches the place stays bold. The box is now 277 × 90 px.
- The chart's own axis labels are unchanged at 11 px.
- New screenshot `11-level-track-labels.png`.
- Tests: 101 unit/component tests and 17 end-to-end tests.

## v0.22: Plainer note, cleaner track (28 Oct 2026)

- **The (i) note says what "+1 ft" means:** "+1 ft means the sea is 1 ft above today's high tide, not a year." "Steps" was the control talking, not the reader. It's still two lines, so the panel doesn't scroll.
- **No circles on the card's level track.**
  - The circle at every level and the larger highlight circle on the first level that reaches the place are gone.
  - The labels mark the levels, and the first-reached label stays bold.
  - The dashed line from the water's surface to the baseline, with its small dot, still marks where the water first reaches.
- New screenshot `11-note-and-level-track.png` shows the note and the track in all three states.
- Tests: 101 unit/component tests and 17 end-to-end tests.

## v0.21: A shorter note (28 Oct 2026)

- **The sea-level (i) note is now two lines:** "Steps are feet of rise above today's high tide, not dates."
  - Before, it ran to about seven lines (230 characters), and opening it made the left panel scroll by 82 px at 1440×800.
  - The box is now 50 px tall instead of 146, with tighter padding, and the panel fits at 800 and 900 px tall.
  - The technical name, Mean Higher High Water, is still explained in "About the data".
- New screenshot `11-sea-level-info-open.png` shows the note open.
- Tests: 101 unit/component tests (the info test now checks the note stays short) and 17 end-to-end tests.

## v0.20: Polish (28 Oct 2026)

Driven by a design review of v0.19.

- **Vermilion selection** (`#e8452c`, outline `#9e2410`) instead of orange: the selected building, the point halo, the legend's "Selected" swatch and the card's icon. The designer picked it from a preview of four colours on the same building, each measured against every colour on the map for normal and colour-blind vision:

  | Colour | Worst-case contrast | Note |
  | --- | --- | --- |
  | Vermilion | ΔE 21 | the highest |
  | Coral red | ΔE 20 | |
  | Orange | ΔE 18 | |
  | Watermelon | ΔE 18 | |
  | Magenta | ΔE 8 | dropped: looks like the +3 ft blue to people with protanopia |
- **The two figures each sit on a soft stat tile** (light blue-grey fill, no border) inside the "Land underwater" tile: "3,770 acres at +5 ft" and "77% of the city's land".
- **A light grey canvas behind both side panels**, so the building card and the tiles read as cards.
- **The left panel in tiles.** "Sea level" and "On the map" each sit on a white tile, matching the Insights panel.
- **Rounded bar tops.** The chart bars' top corners are rounded by 4 px, and the bottoms stay square on the baseline.
- Tests: 101 unit/component tests and 17 end-to-end tests.

## v0.19: One row (28 Oct 2026)

- **Only the selected level's "adds" row is shown under the chart**, for example "+5 ft adds 2.87 km²", instead of all five.
  - The chart already shows every level side by side, and the map legend explains the colours.
  - Hovering a bar segment still gives any foot's increment ("+3 ft adds 6.44 km²").
  - The row still spotlights its band on the map on hover.
  - At today's high tide nothing is added, so there's no row.
  - It saves about 100 px in the panel.
- **Screenshot 02 now spotlights +2 ft from the map legend**, since that row no longer exists at +5 ft.
- Tests: 101 unit/component tests (new: one row only, none at today's high tide) and 17 end-to-end tests.

## v0.18: True colours in the legend (28 Oct 2026)

- **Legend levels above the slider are no longer faded.**
  - Every level shows its real colour, from today's light blue to the +5 ft navy.
  - The text stays black, and the "not shown" label is gone.
  - Hovering one of those levels still doesn't spotlight anything, because it isn't on the map until the slider gets there.
- **The local dev server can run on 5173 again**, the usual address, as well as 5179 (`.claude/launch.json`).
- Tests: 101 unit/component tests (new: the legend shows true colours and no "not shown") and 17 end-to-end tests.

## v0.17: Up to +5 ft (28 Oct 2026)

- **Sea levels now run from today's high tide to +5 ft**, up from +3 ft.
  - The +4 and +5 ft layers are NOAA's own, from the same GeoPackage, processed by the same pipeline.
  - Land underwater: 12.37 km² (62% of the city's land) at +4 ft, and 15.26 km² (77%) at +5 ft.
  - The designer chose +5 ft after seeing every level measured for Miami Beach, from 37% at +3 ft to 97% at +10 ft. +5 ft covers the Southeast Florida Compact's 2070 range.
- **Everything follows the data:** the slider, Watch the water rise, the legend, the chart, the breakdown and the card's level track. A building the top level doesn't reach now says "Not up to +5 ft".
- **A six-step blue ramp.**
  - It starts from the same light blue for today and steps evenly darker to a dark navy at +5 ft (`#9ec5f4 #67a3ea #3d80d2 #1f5fae #104180 #022555`).
  - Keeping the four v0.7 shades and adding two darker ones would have ended near black, so the middle shades shift a little lighter. The old +3 ft navy is now +4 ft.
  - The worst neighbouring pair stays ΔE 10.5 apart for colour-blind viewers.
- **The pipeline writes only the bands the app uses:** neighbouring levels 0→1 … 4→5 ft. Before, it derived every pair; three of those files (0→2, 0→3, 1→3 ft) were never loaded and are removed. All 5 band validations pass.
- **Data:** 26 MB across 19 files. The new bands load only when the slider reaches +4 or +5 ft, so the opening view is unchanged.
- **Wording:** the About dialog now says the colour gets "darker with each foot up to +5 ft". The Sources dialog lists the neighbouring bands as "0→1, 1→2, … 4→5 ft".
- **Tests:**
  - The data test now checks that each level's total equals the sum of its bands.
  - The band-area tolerance is measured against the extent, not the band; simplification noise grows with the 32–35 km² outlines.
  - 100 unit/component tests and 17 end-to-end tests pass.
- **Screenshots:** 02 and 03 are renamed for the +5 ft top level. 09 now shows a building near Beachwalk that +5 ft doesn't reach.

## v0.16: 92 px (28 Oct 2026)

- **The "Water reaches at" box is down to 277 × 92 px**, from 104. The designer chose this from a side-by-side preview.
  - Padding is 8/6 px.
  - The gap under the answer row is 4 px.
  - The water band is 18 px.
  - The text sizes and the 6 px above the pin labels are unchanged; any less and the blue pin runs into its label.
  - When "Not up to +3 ft" wraps, the box is 108 px.
- Tests: 99 unit/component tests and 17 end-to-end tests.

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
