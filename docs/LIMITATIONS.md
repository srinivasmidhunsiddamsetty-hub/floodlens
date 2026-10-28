# What FloodLens can and cannot tell you

FloodLens is an **exploratory screening tool**. It visualizes NOAA's mapped inundation extents. It is not a flood model.

## The data (NOAA OCM Sea Level Rise Viewer)

- Extents show the **scale** of potential inundation, **not the exact location** (NOAA use constraints).
- They show water levels **above current MHHW** as they would appear during the highest high tides, **excluding wind-driven tides**.
- They do **not** account for erosion, subsidence or future construction.
- They are **not** a storm-surge, wave, rainfall or groundwater simulation.
- Seawalls, pumps and drainage are represented only to the extent captured in the source elevation model.
- Accuracy depends on the DEM and the VDatum tidal surface. NOAA publishes separate mapping-confidence rasters, which FloodLens does not include.
- Per NOAA: planning reference only, not for navigation, permitting or legal purposes. Verify with site visits.

## What FloodLens adds, and its limits

- **Scenarios are amounts of rise, not dates.** No years or probabilities are shown, because that needs a separate sea-level projection.
- **No depth.** An extent polygon cannot tell you how deep water would be.
- **Study area only.** Data are clipped to the City of Miami Beach boundary (US Census TIGER/Line, 39.4 km² including bay waters). Polygons are cut at the city limits, and nothing outside them is processed.
- **Area bookmarks are camera positions.** South Beach, Mid-Beach and North Beach have no official boundaries, so FloodLens reports no statistics for them.
- **Total extent includes open water.** NOAA maps the bay and ocean as inundated at MHHW. The headline metric (extent beyond 0 ft) removes that baseline.
- **"Within the mapped extent" ≠ "will flood".** Inspection results are a geometric test against NOAA polygons, nothing more.
- **Building heights are approximate** (OpenStreetMap via OpenMapTiles; estimated where OSM lacks height). Footprints come from vector tiles and can be merged or clipped at tile edges.
- **Low-lying (unconnected) areas** are a separate NOAA product, shown separately and never merged with ocean-connected extents.
- **Simplification:** 0.75 m topology-preserving simplification and 6-decimal coordinates (about 0.1 m), far below the ~3 m source resolution.
- **No exposure counts.** FloodLens does not estimate homes, people, value or damage. Those require datasets and methods it does not have.

## Accessibility limits

The WebGL map canvas is not exposed to screen readers. All quantitative results (indicators, chart table, inspection card) are available as text.
