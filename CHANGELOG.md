# FloodLens changelog

Every version is tagged in git (`git checkout v0.3`) and has a screenshot set in [`docs/versions/`](docs/versions/), so the design evolution can be traced for the portfolio case study. The latest screenshots are always in [`docs/screenshots/`](docs/screenshots/).

| Version | Date | Theme | Screenshots |
| --- | --- | --- | --- |
| v0.1 | 23 Oct 2026 | First working build, dark UI | [`docs/versions/v0.1-dark/`](docs/versions/v0.1-dark/) |
| v0.2 | 23 Oct 2026 | Light ArcGIS-style UI, Roboto | [`docs/versions/v0.2-light/`](docs/versions/v0.2-light/) |
| v0.3 | 27 Oct 2026 | Flood bands, in-map controls, redesigned panels | [`docs/versions/v0.3/`](docs/versions/v0.3/) |
| v0.4 | 28 Oct 2026 | Whole City of Miami Beach, new ramp, illustrated building card | [`docs/versions/v0.4/`](docs/versions/v0.4/) |

---

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
