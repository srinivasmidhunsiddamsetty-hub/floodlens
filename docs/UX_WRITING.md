# FloodLens voice and copy

FloodLens talks about something frightening (water reaching people's homes) using data that most people have never read. The copy has to be calm, plain and honest, and it has to sound like a person, not a GIS report.

## Voice

| We are | We are not |
| --- | --- |
| **Plain.** "Low spots cut off from the sea" | Technical: "hydrologically unconnected low-lying areas" |
| **Calm.** "Water reaches it at +3 ft" | Alarming: "This building will flood" |
| **Honest.** "Not by +3 ft" | Falsely reassuring: "Safe", "Stays dry" |
| **Brief.** The answer first, detail on demand | Wordy: caveats on every screen |
| **Human.** "We'd rather show nothing than guess" | Robotic: "No overlay is shown rather than an estimate" |

## Rules

1. **Lead with what it means for a person.** "Newly underwater at high tide", not "Area flooded beyond today's high tide (MHHW)".
2. **Swap jargon for everyday words.** Keep the technical term once, where it's explained (the (i) panel and "About the data"): MHHW, inundation extent, hydrologic connectivity.
3. **Never promise safety or predict damage.** Water reaching a building on NOAA's map isn't a flood forecast, and not reaching it doesn't mean "safe". So: "water reaches it", "not by +3 ft".
4. **Sentence case, short labels, no trailing full stops on single phrases.** Buttons say what happens: "Watch the water rise", "Show all of Miami Beach".
5. **One name for one thing.** Sea level (the slider), high tide (today's baseline), "+2 ft" (a level), low spots (unconnected areas), city limits (the boundary).
6. **Errors say what happened and what to do, without blame.** "We couldn't reach the flood data. Check your connection and reload."
7. **Use "we" for FloodLens and "you" sparingly**, for the user's own actions ("You're looking at +2 ft").

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
