# Data sources

Everything below is reproducible with `scripts/prepare_noaa_slr.py`, which also writes the machine-readable `public/data/noaa/manifest.json`. The manifest drives the UI and the "Data sources" dialog.

## 1. Sea-level-rise inundation: NOAA Office for Coastal Management

| | |
| --- | --- |
| Publisher | NOAA Office for Coastal Management (OCM), Sea Level Rise Viewer data |
| Directory | https://coast.noaa.gov/slrdata/Sea_Level_Rise_Vectors/FL/index.html |
| File used | https://chs.coast.noaa.gov/htdata/Inundation/SLR/BulkDownload/Sea_Level_Rise_Vectors/FL/FL_SE_slr_data_dist.zip |
| Zip size / date | 977,163,448 bytes; server `Last-Modified: Wed, 27 Sep 2023` |
| Contents | `FL_SE_slr_final_dist.gpkg` (4,087,308,288 bytes) + `NOAA_OCM_SLR_Data_README.txt` |
| Geography | FL_SE = Broward, Miami-Dade, Palm Beach counties |
| Layer timestamps | `gpkg_contents.last_change` 2023-02-13 / 2023-02-14 |
| Metadata | 0 ft (current MHHW) extent: https://www.fisheries.noaa.gov/inport/item/48105 · 1–10 ft extents: https://www.fisheries.noaa.gov/inport/item/48106 · Mapping confidence: https://www.fisheries.noaa.gov/inport/item/48107 |
| Methods | https://coast.noaa.gov/data/digitalcoast/pdf/slr-inundation-methods.pdf |
| Publication year | 2023 (InPort "Time Frame" and publication date) |

### Layers used

The GeoPackage holds 42 layers: `FL_SE_slr_{0_0…10_0}ft` and `FL_SE_low_{0_0…10_0}ft` in half-foot steps. All are `MULTIPOLYGON` in **EPSG:4269 (NAD83)**, with fields `Id` and `gridcode`.

| FloodLens scenario | Ocean-connected layer (`slr`) | Low-lying layer (`low`) | Region-wide features (slr / low) |
| --- | --- | --- | --- |
| 0 ft (current MHHW) | `FL_SE_slr_0_0ft` | `FL_SE_low_0_0ft` | 9,785 / 7,317 |
| +1 ft | `FL_SE_slr_1_0ft` | `FL_SE_low_1_0ft` | 10,412 / 9,980 |
| +2 ft | `FL_SE_slr_2_0ft` | `FL_SE_low_2_0ft` | 6,423 / 8,703 |
| +3 ft | `FL_SE_slr_3_0ft` | `FL_SE_low_3_0ft` | 6,329 / 8,674 |

- **`slr`**: inundation hydrologically connected to the ocean. This is FloodLens's primary layer.
- **`low`**: areas below the water level but **not** connected to the ocean, which "may also flood". These are processed separately, shown only as an optional hatched layer, and never merged with `slr`.
- In the `slr` layers, `gridcode` is always 1. In the `low` layers it is a region-wide identifier. Neither is shown in the UI because neither carries meaning for users.

### Scenario definitions (from NOAA metadata)

- Each scenario is a water surface at **N ft above current Mean Higher High Water (MHHW)**. 0 ft is NOAA's extent at current MHHW.
- NOAA uses a **modified bathtub** approach: a DEM compared with a tidal surface (MHHW in NAVD88, built with NOAA VDatum), with hydrological connectivity.
- Use constraints, quoted from the metadata: *"These data illustrate the scale of potential flooding, not the exact location, and do not account for erosion, subsidence, or future construction. Inundation is shown as it would appear during the highest high tides (excludes wind driven tides) … should be used only as a screening-level tool … not for navigation, permitting, or other legal purposes."*
- Scenarios are amounts of rise, **not years**. FloodLens attaches no dates or probabilities.

### Why the bulk GeoPackage (and not a web service)

The NOAA ArcGIS REST services (`coast.noaa.gov/arcgis/rest/services/dc_slr/slr_{N}ft/MapServer`) expose only the **low-lying** polygons as a queryable feature layer. Ocean-connected inundation is published there as a depth raster. The bulk GeoPackage is the only official vector source of ocean-connected extents, so the pipeline downloads it once (resumable), caches it outside the repository, and reads only features that intersect the study area through the GeoPackage spatial index.

## 2. Study area: City of Miami Beach (US Census Bureau TIGER/Line)

| | |
| --- | --- |
| Name | City of Miami Beach, FL (incorporated place; GEOID `1245025`) |
| Source | US Census Bureau, TIGER/Line Shapefiles 2026, places, Florida: https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_12_place.zip (7.1 MB, `Last-Modified: 06 Oct 2026`) |
| Licence | Public domain (US federal government work) |
| Bounding box (EPSG:4326) | west −80.16905, south 25.759106, east −80.118744, north 25.872621 |
| Geodesic area | 39.418 km² (Census: 19.92 km² land, 19.49 km² water) |
| File | `public/data/noaa/study_area.geojson` |

The city limits run 12.6 km from South Pointe to the northern boundary and include the city's islands and the Biscayne Bay waters inside city limits. The boundary is published in EPSG:4269, the same CRS as the NOAA data, so it is used unsimplified for clipping; the outline file shown on the map is simplified with the same 0.75 m tolerance. Data outside it are not processed, and the app dims that area.

v0.1–v0.3 used an 18.7 km² rectangle over South Beach (`[-80.160, 25.760, -80.118, 25.800]`). v0.4 replaced it with the municipal boundary: the jurisdiction a city planner is responsible for, and a boundary with an authoritative source.

## 3. Coordinate reference systems

| Stage | CRS |
| --- | --- |
| Source | EPSG:4269, NAD83 geographic |
| Metric processing (difference, simplification) | EPSG:26917, NAD83 / UTM zone 17N |
| Output (web map, RFC 7946 GeoJSON) | EPSG:4326, WGS84 |

NAD83 → WGS84 uses the default PROJ transformation, which differs by about 1–2 m in this area. That is well below the source resolution (polygon edges follow ~3 m raster cells).

## 4. Transformation steps

1. **Acquire**: resumable download of the zip; extract the GeoPackage (or `--gpkg` to use a local copy).
2. **Inspect**: list layers and verify that all 8 required layers exist, are `MULTIPOLYGON` and use EPSG:4269. Otherwise fail.
3. **Read**: only features intersecting the study area (spatial-index bbox read with pyogrio).
4. **Clip, then repair**: `clip_by_rect` to the boundary's bounding box first, because NOAA features can cover the whole FL_SE region and repairing them before clipping takes minutes. Then `make_valid`, dissolve (`union_all`) and exact intersection with the city boundary polygon.
5. **Project** to EPSG:26917.
6. **Derive comparison layers**: for every scenario pair (A < B), GEOS `difference(B, A)`. Validation checks:
   - *Containment*: area(A − B) must be under 1 m². Measured: 0.12–0.18 m².
   - *Consistency*: area(B − A) must equal area(B) − area(A) within 0.1%. Measured relative error: 0.000000.
   All 6 pairs pass. The results are stored in `manifest.processing.validation` and shown in the app.
7. **Drop slivers** under 1 m² created by differencing. These are numerical artifacts; the smallest real raster-derived parts are about 9 m².
8. **Simplify** with a topology-preserving 0.75 m tolerance (in metres, below the ~3 m source cell size).
9. **Reproject** to EPSG:4326, round to 6 decimals (about 0.1 m), re-validate, and orient rings counter-clockwise.
10. **Measure**: geodesic area on the WGS84 ellipsoid (`pyproj.Geod`) of the exported polygons. Areas are never computed from raw degrees.
11. **Export** GeoJSON and `manifest.json` with provenance, CRS, steps, validation, per-file sizes and SHA-256 prefixes.

## 5. Resulting figures (study area only)

| Scenario | Total mapped extent | Beyond 0 ft extent | Share of Census land area | File |
| --- | --- | --- | --- | --- |
| 0 ft | 19.671 km² | n/a (reference) | n/a | `slr_0ft.geojson` (520 KB) |
| +1 ft | 19.710 km² | 0.038 km² | 0.2% | `slr_1ft.geojson` (521 KB) |
| +2 ft | 20.660 km² | 0.989 km² | 5.0% | `slr_2ft.geojson` (1.1 MB) |
| +3 ft | 27.094 km² | 7.433 km² | 37% | `slr_3ft.geojson` (2.7 MB) |

"Total mapped extent" includes existing open water (the Biscayne Bay waters inside city limits), which NOAA maps as inundated at MHHW. "Beyond 0 ft" is the land-side growth and is the headline indicator in the UI. The share column divides it by the Census land area (19.92 km²); the app words this as "equal to N% of the city's land area", a size comparison between two sources rather than a parcel count.

What each foot adds (the map's colour bands): +1 ft 0.038 km², +2 ft 0.951 km², +3 ft 6.444 km².

The unit tests (`src/lib/dataIntegrity.test.ts`) recompute every area in the browser with Turf (spherical) and require agreement within 0.5%. They also check monotonic growth, that all coordinates fall inside the study area, and point membership for derived layers.

## 6. Basemap: OpenFreeMap / OpenMapTiles / OpenStreetMap

| | |
| --- | --- |
| Style | https://tiles.openfreemap.org/styles/positron (fetched at runtime, restyled to a light geographic palette in `src/lib/mapStyle.ts`) |
| Tiles | `https://tiles.openfreemap.org/planet` (OpenMapTiles schema, z0–14) |
| Terms | Public instance is free, with no API key, registration or cookies. Attribution "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" is required and shown in the map. |
| Label glyphs | Roboto Regular / Medium / Italic SDF glyph ranges self-hosted in `public/fonts/` (from [openmaptiles/fonts](https://github.com/openmaptiles/fonts) v2.0; Roboto is Apache-2.0). OpenFreeMap serves only Noto Sans glyphs. |
| Buildings | `building` layer, `render_height` / `render_min_height`. Values come from OSM `height` / `building:levels` where present; otherwise the tile generator estimates them. Treat them as approximate. |

## 7. Assumptions

- The bulk GeoPackage (2023) is the same product shown in NOAA's Sea Level Rise Viewer for this area.
- The Census place boundary represents the City of Miami Beach. Polygons are cut at the city limits, which the dashed boundary and the outside mask disclose.
- Areas are reported for the study area only and include whatever NOAA maps as inundated there (including open water for the total extent).
- Street names in the inspection card come from the nearest OSM `transportation_name` feature within 150 m. They are a locational aid, not an address.
