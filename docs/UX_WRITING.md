# FloodLens voice and copy

FloodLens talks about something frightening (water reaching people's homes) using data that most people have never read. The copy has to be calm, plain and honest, and it has to sound like a person, not a GIS report.

## Voice

| We are | We are not |
| --- | --- |
| **Plain.** "Low spots cut off from the sea" | Technical: "hydrologically unconnected low-lying areas" |
| **Calm.** "Water reaches it at +3 ft" | Alarming: "This building will flood" |
| **Honest.** "Up to +3 ft, water doesn't reach it" | Falsely reassuring: "Safe", "Stays dry" |
| **Brief.** The answer first, detail on demand | Wordy: caveats on every screen |
| **Human.** "We'd rather show nothing than guess" | Robotic: "No overlay is shown rather than an estimate" |

## Rules

1. **Lead with what it means for a person.** "Land underwater at +2 ft", not "Area flooded beyond today's high tide (MHHW)".
2. **Swap jargon for everyday words.** Keep the technical term once, where it's explained (the (i) panel and "About the data"): MHHW, inundation extent, hydrologic connectivity.
3. **Never promise safety or predict damage.** Water reaching a building on NOAA's map isn't a flood forecast, and not reaching it doesn't mean "safe". So: "water reaches it", "not by +3 ft".
4. **Sentence case, short labels, no trailing full stops on single phrases.** Buttons say what happens: "Watch the water rise", "Show all of Miami Beach".
5. **One name for one thing.** Sea level (the slider), high tide (today's baseline), "+2 ft" (a level), low spots (unconnected areas), city limits (the boundary).
6. **Errors say what happened and what to do, without blame.** "We couldn't reach the flood data. Check your connection and reload."
7. **Use "we" for FloodLens and "you" sparingly**, for the user's own actions ("You're looking at +2 ft").
8. **A label and its value read as one sentence.** "Water reaches it · At +3 ft". "Up to +3 ft · Water doesn't reach it". Never pair a label with a value that contradicts it.
9. **Chart titles are one plain line that names the measure: "Land underwater by sea level".** v0.8–v0.12 followed the [ONS](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text) / [GOV.UK](https://brand.design-system.service.gov.uk/data/charts) pattern of a finding as the title plus a measure-and-place subtitle. In a small tile under a "Land underwater" summary, that was more text than the reader needed, so v0.13 cut it to one line.
10. **A reference is a reference.** When a mockup is supplied, take its layout and emphasis, not its wording. The answer keeps FloodLens's voice ("Water reaches at · +3 ft"), not the mockup's ("First reached / at +3 ft / Within the mapped extent…").

## Before and after (v0.6 → v0.7)

| Where | Before | After |
| --- | --- | --- |
| Headline label | Flooded beyond today's high tide | Newly underwater at high tide |
| Headline detail | ≈ 244 acres at +2 ft, equal to 5.0% of the city's land area | About 244 acres at +2 ft, roughly 5% of the city's land |
| Today | Reference / Today's high tide. Raise the sea level to see how far water reaches onto land. | Where we start / This is how far high tide reaches today. Raise the sea level to see what changes. |
| Chart | Growth with each foot / Area flooded beyond today's high tide, km² | Each foot adds more / Newly underwater, km² |
| Low spots note | Plus 0.94 km² low-lying, not ocean-connected (not counted above) | Plus 0.94 km² of low spots cut off from the sea, not counted above |
| Link | Data sources & limitations | What this map can and can't tell you |
| Empty state | Click any building to see the water level that first reaches it. | Click any building to see when water would reach it. |
| Card label | First reached / at +3 ft | Water reaches it / At +3 ft |
| Card, today | Today | Already, at high tide |
| Card, not reached | Above +3 ft | Not by +3 ft |
| Card link | Not on the map at +2 ft · show +3 ft | You're looking at +2 ft. See it at +3 ft |
| Card fact | Low-lying area: No | In a low spot: No |
| Outside the city | Outside the City of Miami Beach. FloodLens only processes NOAA data inside the city boundary. | This spot is outside Miami Beach. FloodLens only maps the city itself. |
| Close button | Clear selection (Esc) | Close (Esc) |
| Play button | Play the rise | Watch the water rise |
| Layers | Layers / Flood extent: NOAA, connected to the ocean | On the map / Flooding: Where NOAA maps the sea reaching |
| Layers | Low-lying areas: Below the water level, not connected | Low spots: Below the water line, but cut off from the sea |
| Legend | Flooded first at / Today (0 ft) / hidden | Water first reaches / Today's high tide / not shown |
| Map hover | Building · click for details | Click to see when water reaches it |
| Map hover | First reached at +2 ft · patch 1,234 m² | Water reaches here at +2 ft |
| Loading | Loading basemap and NOAA overlays… | Loading the map and flood data… |
| Missing data | Inundation data unavailable / FloodLens never substitutes estimated or sample data. | The flood data didn't load / We'd rather show nothing than guess, so FloodLens never fills the gap with estimates or sample data. |
| Missing file | diff_2ft_3ft.geojson is missing (HTTP 404). The map shows no overlay for this layer rather than an estimate. | diff_2ft_3ft.geojson didn't load (HTTP 404). We'd rather leave it off the map than guess. |
| Compass | Reset north | Point north |

## Before and after (v0.7 → v0.8)

| Where | Before | After |
| --- | --- | --- |
| Headline label | Newly underwater at high tide | Land underwater at +2 ft |
| Headline detail | About 244 acres at +2 ft, roughly 5% of the city's land | About 244 acres, roughly 5% of the city's land |
| Chart title | Each foot adds more | Land underwater jumps at +3 ft (from the data; otherwise "Land underwater at each sea level") |
| Chart subtitle | Newly underwater, km² | Square kilometres, City of Miami Beach |
| Card, not reached | Water reaches it / Not by +3 ft | Up to +3 ft / Water doesn't reach it |
| Mobile summary | 0.99 km² newly underwater | 0.99 km² of land underwater |
| Chart bar (screen reader) | +2 ft: 0.99 square kilometres newly underwater | +2 ft: 0.99 square kilometres of land underwater |

## Before and after (v0.8 → v0.9)

| Where | Before | After |
| --- | --- | --- |
| Headline detail | About 1,837 acres, roughly 37% of the city's land (under 7.43 km²) | Roughly 37% of the city's land (the number above is in the chosen unit) |
| Breakdown row | +3 ft adds · 6.44 km² · 1,592 acres | +3 ft adds · 6.44 km² (or 1,592 acres) |
| Low spots | Plus 0.29 km² of low spots cut off from the sea, not counted above (only with the layer on) | Low spots at +3 ft · 0.29 km² · Cut off from the sea, so not counted above (always) |
| Unit switch | (none) | km² / acres. Screen readers hear "Area unit: Square kilometres / Acres" |

## Before and after (v0.9 → v0.10)

| Where | Before | After |
| --- | --- | --- |
| Summary | LAND UNDERWATER AT +3 FT / 7.43 km² / Roughly 37% of the city's land | Land underwater: **7.43 km²** at +3 ft │ **37%** of the city's land |
| Summary, today | Today's high tide / Where we start / This is how far high tide reaches today… | None yet. Today's high tide is where we start: raise the sea level to see what changes. |
| Chart title | Land underwater jumps at +3 ft | The biggest jump comes at +3 ft |
| Chart subtitle | Square kilometres, City of Miami Beach | Land underwater, km², City of Miami Beach |
| Card link | You're looking at +2 ft. See it at +3 ft → (own line) | See it at +3 ft → (in the answer block; the full sentence is its accessible name) |
| Card fact | In a low spot: Yes, from +2 ft | Low spot: From +2 ft |
| Bottom link | What this map can and can't tell you | (removed; "About the data" in the top bar opens the same dialog) |

## Before and after (v0.10 → v0.11)

| Where | Before | After |
| --- | --- | --- |
| Card answer | WATER REACHES IT / At +3 ft (headline over a picture) | When water reaches it · At +3 ft (a row, with a pin track) |
| Card, today | Already, at high tide | Already today (the Today pin is highlighted too) |
| Card, not reached | UP TO +3 FT / Water doesn't reach it | When water reaches it · Not up to +3 ft |
| Card link | See it at +3 ft → (corner of the answer block) | You're looking at +2 ft. See it at +3 ft → (under the track) |
| Card fact | Low spot: From +2 ft | Low spot: Yes, from +2 ft |
| Panel title | Insights | (visually hidden; still the panel's heading for screen readers) |
| Bottom link | (removed) | What this map can and can't tell you → |

## Before and after (v0.11 → v0.12)

| Where | Before | After |
| --- | --- | --- |
| Card answer | When water reaches it · At +3 ft (a row) | WATER FIRST REACHES IT / **at +3 ft** / Once the sea rises 3 ft above today's high tide. |
| Card, today | When water reaches it · Already today | WATER ALREADY REACHES IT / **at high tide** / Today, before the sea rises at all. |
| Card, not reached | When water reaches it · Not up to +3 ft | WATER DOESN'T REACH IT / **up to +3 ft** / We only map up to +3 ft, so we can't say beyond that. |
| Level pins | (level names only) | Today · Not reached, +3 ft · First reached, and "Reached" after it |
| Card meta | 34 m from street · 25.77675° N, 80.13466° W | 25.77675° N, 80.13466° W, with a "Copy coordinates" button |

## Before and after (v0.12 → v0.13)

| Where | Before | After |
| --- | --- | --- |
| Card answer | WATER FIRST REACHES IT / at +3 ft / Once the sea rises 3 ft above today's high tide. | WHEN WATER REACHES IT / At +3 ft (v0.11's wording, emphasised) |
| Card, today | WATER ALREADY REACHES IT / at high tide / Today, before the sea rises at all. | WHEN WATER REACHES IT / Already today |
| Card, not reached | WATER DOESN'T REACH IT / up to +3 ft / We only map up to +3 ft, so we can't say beyond that. | WHEN WATER REACHES IT / Not up to +3 ft |
| Level pins | Today · Not reached … +3 ft · First reached | Today, +1 ft, +2 ft, +3 ft (the first level in blue) |
| Chart title | The biggest jump comes at +3 ft / Land underwater, km², City of Miami Beach | Land underwater by sea level |
| Facts, not a building | (Height and Footprint rows hidden) | Height — / Footprint — |

## Before and after (v0.13 → v0.14)

| Where | Before | After |
| --- | --- | --- |
| Card answer | WHEN WATER REACHES IT / At +3 ft | WATER REACHES AT / +3 ft |
| Card, today | WHEN WATER REACHES IT / Already today | WATER REACHES AT / Today |
| Card, not reached | WHEN WATER REACHES IT / Not up to +3 ft | WATER REACHES AT / Not up to +3 ft |

## Before and after (v0.14 → v0.15)

| Where | Before | After |
| --- | --- | --- |
| Card link | You're looking at +2 ft. See it at +3 ft → | (removed at every level) |

## Before and after (v0.17 → v0.18)

| Where | Before | After |
| --- | --- | --- |
| Legend, levels above the slider | +4 ft · not shown (faded swatch, grey text) | +4 ft (true colour, no label) |
