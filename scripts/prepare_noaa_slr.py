#!/usr/bin/env python3
"""
FloodLens — NOAA sea-level-rise data preparation.

Reproducible pipeline that turns NOAA Office for Coastal Management (OCM)
Sea Level Rise Viewer inundation polygons into small, web-ready GeoJSON files
for the FloodLens study area: the City of Miami Beach, FL, as drawn by the
US Census Bureau's TIGER/Line place boundary.

Steps
  1. Acquire   download FL_SE_slr_data_dist.zip (resumable) and extract the
               GeoPackage, unless a local copy is supplied with --gpkg; and
               download the Census TIGER/Line Florida places file for the
               city boundary.
  2. Inspect   list layers, CRS and feature counts; fail loudly if the expected
               scenario layers are missing.
  3. Clip      read only features intersecting the study area, cut them to its
               bounding box, repair invalid geometries, then clip them to the
               city boundary polygon.
  4. Derive    compute the additional extent between every pair of scenarios
               with GEOS polygon difference in a projected CRS (validated).
  5. Simplify  conservative, topology-preserving simplification in metres.
  6. Export    reproject to EPSG:4326, write GeoJSON + a manifest with
               geodesic areas, provenance, processing steps and validation.

Nothing in this script invents geometry: every output polygon is a subset of
a NOAA source polygon (or a difference between two of them).

Usage
  python3 -m venv scripts/.venv
  scripts/.venv/bin/pip install -r scripts/requirements.txt
  scripts/.venv/bin/python scripts/prepare_noaa_slr.py --cache-dir ~/.cache/floodlens
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import sys
import urllib.request
import zipfile
from dataclasses import dataclass
from itertools import combinations
from pathlib import Path

import numpy as np
import pyogrio
import shapely
from pyproj import Geod, Transformer
from shapely.geometry import MultiPolygon, Polygon, mapping
from shapely.geometry.polygon import orient

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

SOURCE_ZIP_URL = (
    "https://chs.coast.noaa.gov/htdata/Inundation/SLR/BulkDownload/"
    "Sea_Level_Rise_Vectors/FL/FL_SE_slr_data_dist.zip"
)
SOURCE_INDEX_URL = "https://coast.noaa.gov/slrdata/Sea_Level_Rise_Vectors/FL/index.html"
GPKG_MEMBER = "FL_SE_slr_final_dist.gpkg"
GEOGRAPHY = "FL_SE"  # Broward, Miami-Dade, Palm Beach

# Study area: the City of Miami Beach municipal boundary (incorporated place),
# from the US Census Bureau TIGER/Line Shapefiles. Includes the barrier island
# from South Pointe to the northern city limit, the Venetian, Star, Palm,
# Hibiscus and other city islands, and the Biscayne Bay waters inside city limits.
STUDY_AREA_NAME = "City of Miami Beach, FL"
BOUNDARY_YEAR = 2026
BOUNDARY_ZIP_URL = (
    f"https://www2.census.gov/geo/tiger/TIGER{BOUNDARY_YEAR}/PLACE/tl_{BOUNDARY_YEAR}_12_place.zip"
)
BOUNDARY_GEOID = "1245025"  # Miami Beach city, Florida

SCENARIOS_FT = [0, 1, 2, 3]

SOURCE_CRS = "EPSG:4269"  # NAD83 geographic — as published in the GeoPackage
OUTPUT_CRS = "EPSG:4326"  # WGS84 lon/lat for web maps (RFC 7946)
METRIC_CRS = "EPSG:26917"  # NAD83 / UTM zone 17N — used for simplification

SIMPLIFY_TOLERANCE_M = 0.75  # well below the source DEM cell size
MIN_PART_AREA_M2 = 1.0  # drop sub-1 m² slivers created by polygon differencing
COORD_DECIMALS = 6  # ≈ 0.1 m at this latitude

METADATA = {
    "inport_0ft": "https://www.fisheries.noaa.gov/inport/item/48105",
    "inport_1to10ft": "https://www.fisheries.noaa.gov/inport/item/48106",
    "inport_confidence": "https://www.fisheries.noaa.gov/inport/item/48107",
    "methods_pdf": "https://coast.noaa.gov/data/digitalcoast/pdf/slr-inundation-methods.pdf",
    "viewer": "https://coast.noaa.gov/slr",
}

GEOD = Geod(ellps="WGS84")


@dataclass
class Layer:
    kind: str  # "slr" (ocean-connected) | "low" (hydrologically unconnected)
    feet: int

    @property
    def name(self) -> str:
        return f"{GEOGRAPHY}_{self.kind}_{self.feet}_0ft"

    @property
    def id(self) -> str:
        return f"{self.kind}_{self.feet}ft"


def log(msg: str) -> None:
    print(f"[prepare] {msg}", flush=True)


# --------------------------------------------------------------------------
# 1. Acquire
# --------------------------------------------------------------------------

def remote_size(url: str) -> int:
    req = urllib.request.Request(url, method="HEAD")
    with urllib.request.urlopen(req, timeout=60) as r:
        return int(r.headers["Content-Length"])


def download_resumable(url: str, dest: Path) -> None:
    total = remote_size(url)
    have = dest.stat().st_size if dest.exists() else 0
    log(f"source zip is {total / 1e6:.1f} MB; {have / 1e6:.1f} MB already cached")
    if have == total:
        return
    if have > total:
        dest.unlink()
        have = 0
    req = urllib.request.Request(url, headers={"Range": f"bytes={have}-"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "ab") as f:
        done = have
        while chunk := r.read(1 << 20):
            f.write(chunk)
            done += len(chunk)
            if done % (50 << 20) < (1 << 20):
                log(f"  {done / total:5.1%}")
    if dest.stat().st_size != total:
        raise RuntimeError("download incomplete — re-run to resume")


def acquire_boundary(cache_dir: Path, zip_arg: str | None) -> Path:
    if zip_arg:
        p = Path(zip_arg).expanduser().resolve()
        if not p.exists():
            raise FileNotFoundError(p)
        return p
    cache_dir.mkdir(parents=True, exist_ok=True)
    zpath = cache_dir / Path(BOUNDARY_ZIP_URL).name
    download_resumable(BOUNDARY_ZIP_URL, zpath)
    return zpath


def acquire(cache_dir: Path, gpkg_arg: str | None) -> Path:
    if gpkg_arg:
        p = Path(gpkg_arg).expanduser().resolve()
        if not p.exists():
            raise FileNotFoundError(p)
        return p
    cache_dir.mkdir(parents=True, exist_ok=True)
    gpkg = cache_dir / GPKG_MEMBER
    if gpkg.exists():
        log(f"using cached GeoPackage {gpkg}")
        return gpkg
    zpath = cache_dir / Path(SOURCE_ZIP_URL).name
    download_resumable(SOURCE_ZIP_URL, zpath)
    log("extracting GeoPackage (≈4.1 GB uncompressed)…")
    with zipfile.ZipFile(zpath) as z:
        z.extract(GPKG_MEMBER, cache_dir)
        if "NOAA_OCM_SLR_Data_README.txt" in z.namelist():
            z.extract("NOAA_OCM_SLR_Data_README.txt", cache_dir)
    return gpkg


# --------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------

def make_transform(src: str, dst: str):
    tr = Transformer.from_crs(src, dst, always_xy=True)

    def _apply(geom):
        return shapely.transform(geom, lambda xy: np.column_stack(tr.transform(xy[:, 0], xy[:, 1])))

    return _apply


source_to_metric = make_transform(SOURCE_CRS, METRIC_CRS)
metric_to_output = make_transform(METRIC_CRS, OUTPUT_CRS)
output_to_metric = make_transform(OUTPUT_CRS, METRIC_CRS)


def polygons_only(geom) -> MultiPolygon:
    """Keep only polygonal parts (make_valid/intersection can emit lines/points)."""
    if geom is None or geom.is_empty:
        return MultiPolygon()
    parts = []
    for g in getattr(geom, "geoms", [geom]):
        if isinstance(g, Polygon):
            parts.append(g)
        elif isinstance(g, MultiPolygon):
            parts.extend(g.geoms)
        elif hasattr(g, "geoms"):
            parts.extend(polygons_only(g).geoms)
    return MultiPolygon([p for p in parts if not p.is_empty])


def geodesic_area_m2(geom_wgs84) -> float:
    """Ellipsoidal (WGS84) geodesic area — never computed from raw degrees."""
    total = 0.0
    for p in polygons_only(geom_wgs84).geoms:
        a, _ = GEOD.geometry_area_perimeter(orient(p, sign=1.0))
        total += abs(a)
    return total


def round_coords(geom, ndigits: int = COORD_DECIMALS):
    return shapely.set_precision(geom, 10 ** -ndigits, mode="pointwise")


# --------------------------------------------------------------------------
# 2–3. Inspect & clip
# --------------------------------------------------------------------------

def inspect(gpkg: Path) -> dict:
    layers = {name: gtype for name, gtype in pyogrio.list_layers(gpkg)}
    expected = [Layer(k, ft).name for k in ("slr", "low") for ft in SCENARIOS_FT]
    missing = [n for n in expected if n not in layers]
    if missing:
        raise RuntimeError(f"expected NOAA layers missing from {gpkg.name}: {missing}")
    info = {}
    for n in expected:
        meta = pyogrio.read_info(gpkg, layer=n)
        info[n] = {
            "geometryType": meta["geometry_type"],
            "crs": meta["crs"],
            "featureCount": int(meta["features"]),
            "fields": list(meta["fields"]),
        }
        if meta["crs"] != SOURCE_CRS:
            raise RuntimeError(f"{n}: unexpected CRS {meta['crs']} (expected {SOURCE_CRS})")
    log(f"{len(layers)} layers in GeoPackage; all {len(expected)} required layers present")
    return {"layerCount": len(layers), "layers": info}


def study_area_polygons(boundary_zip: Path):
    """The city boundary in the source CRS (for clipping) and as a simplified WGS84 outline."""
    meta, _, wkb, fields = pyogrio.raw.read(f"/vsizip/{boundary_zip}", where=f"GEOID = '{BOUNDARY_GEOID}'")
    if len(wkb) != 1:
        raise RuntimeError(f"expected exactly one place with GEOID {BOUNDARY_GEOID}, found {len(wkb)}")
    if meta["crs"] != SOURCE_CRS:
        raise RuntimeError(f"boundary CRS {meta['crs']} (expected {SOURCE_CRS})")
    record = {name: fields[i][0] for i, name in enumerate(meta["fields"])}
    study_src = polygons_only(shapely.make_valid(shapely.from_wkb(wkb[0])))
    study_wgs84 = finalize(source_to_metric(study_src))
    census = {
        "publisher": "US Census Bureau",
        "dataset": f"TIGER/Line Shapefiles {BOUNDARY_YEAR}, places (Florida)",
        "downloadUrl": BOUNDARY_ZIP_URL,
        "geoid": BOUNDARY_GEOID,
        "name": str(record["NAMELSAD"]),
        "censusLandM2": int(record["ALAND"]),
        "censusWaterM2": int(record["AWATER"]),
        "license": "Public domain (US federal government work)",
    }
    return study_wgs84, study_src, census


def clip_layer(gpkg: Path, layer: Layer, study_src) -> MultiPolygon:
    """Return the layer clipped to the study area, in METRIC_CRS, valid."""
    minx, miny, maxx, maxy = study_src.bounds
    _, _, wkb, _ = pyogrio.raw.read(gpkg, layer=layer.name, bbox=(minx, miny, maxx, maxy))
    if len(wkb) == 0:
        return MultiPolygon()
    geoms = shapely.from_wkb(wkb)
    # Cut the (often region-sized) source polygons to the bbox *before* repairing
    # them — make_valid on the full FL_SE geometry takes many minutes.
    geoms = shapely.clip_by_rect(geoms, minx, miny, maxx, maxy)
    geoms = shapely.make_valid(geoms)
    merged = shapely.union_all(geoms)
    clipped = shapely.intersection(merged, study_src)
    metric = shapely.make_valid(source_to_metric(polygons_only(clipped)))
    return polygons_only(metric)


# --------------------------------------------------------------------------
# 5–6. Simplify & export
# --------------------------------------------------------------------------

def finalize(metric_geom, drop_slivers: bool = False):
    """Simplify in metres, reproject to WGS84, round, re-validate."""
    g = polygons_only(metric_geom)
    if drop_slivers:
        g = MultiPolygon([p for p in g.geoms if p.area >= MIN_PART_AREA_M2])
    g = shapely.simplify(g, SIMPLIFY_TOLERANCE_M, preserve_topology=True)
    g = metric_to_output(polygons_only(shapely.make_valid(g)))
    g = polygons_only(shapely.make_valid(round_coords(g)))
    return g


def to_features(geom_wgs84, base_props: dict, explode: bool) -> list[dict]:
    parts = list(polygons_only(geom_wgs84).geoms)
    if not explode:
        if not parts:
            return []
        mp = MultiPolygon([orient(p, sign=1.0) for p in parts])
        return [{
            "type": "Feature",
            "properties": {**base_props, "part": 0, "areaM2": round(geodesic_area_m2(mp), 1)},
            "geometry": mapping(mp),
        }]
    feats = []
    parts.sort(key=lambda p: -abs(GEOD.geometry_area_perimeter(p)[0]))
    for i, p in enumerate(parts):
        p = orient(p, sign=1.0)
        feats.append({
            "type": "Feature",
            "id": i,
            "properties": {**base_props, "part": i, "areaM2": round(geodesic_area_m2(p), 1)},
            "geometry": mapping(p),
        })
    return feats


def write_geojson(path: Path, features: list[dict], name: str) -> dict:
    fc = {"type": "FeatureCollection", "name": name, "features": features}
    text = json.dumps(fc, separators=(",", ":"))
    path.write_text(text)
    return {
        "bytes": len(text.encode()),
        "sha256": hashlib.sha256(text.encode()).hexdigest()[:16],
        "featureCount": len(features),
        "vertexCount": int(sum(shapely.get_num_coordinates(shapely.geometry.shape(f["geometry"])) for f in features)),
    }


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cache-dir", default=".cache/floodlens", help="where the raw downloads are cached")
    ap.add_argument("--gpkg", help="use an existing FL_SE GeoPackage instead of downloading")
    ap.add_argument("--boundary-zip", help="use an existing TIGER/Line Florida places zip instead of downloading")
    ap.add_argument("--out", default="public/data/noaa", help="output directory for processed data")
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    cache = Path(args.cache_dir).expanduser()
    gpkg = acquire(cache / "noaa", args.gpkg)
    boundary_zip = acquire_boundary(cache / "tiger", args.boundary_zip)
    inspection = inspect(gpkg)
    study_wgs84, study_src, census = study_area_polygons(boundary_zip)
    study_area_m2 = geodesic_area_m2(study_wgs84)
    log(f"study area {STUDY_AREA_NAME}: {study_area_m2 / 1e6:.3f} km²")

    # ---- clip every scenario (kept in metric CRS for exact differencing)
    clipped: dict[str, MultiPolygon] = {}
    for kind in ("slr", "low"):
        for ft in SCENARIOS_FT:
            lyr = Layer(kind, ft)
            clipped[lyr.id] = clip_layer(gpkg, lyr, study_src)
            log(f"clipped {lyr.name:<18} → {clipped[lyr.id].area / 1e6:8.4f} km² (planar UTM, pre-simplify)")

    files: dict[str, dict] = {}
    scenarios = []
    baseline_m = clipped["slr_0ft"]

    # ---- ocean-connected extents
    for ft in SCENARIOS_FT:
        lid = f"slr_{ft}ft"
        g = finalize(clipped[lid])
        fname = f"{lid}.geojson"
        props = {"layer": lid, "kind": "slr", "scenarioFt": ft, "source": Layer("slr", ft).name}
        stats = write_geojson(out / fname, to_features(g, props, explode=False), lid)
        beyond = finalize(shapely.difference(clipped[lid], baseline_m), drop_slivers=True) if ft > 0 else MultiPolygon()
        scenarios.append({
            "id": lid,
            "feet": ft,
            "label": "0 ft" if ft == 0 else f"+{ft} ft",
            "kind": "slr",
            "sourceLayer": Layer("slr", ft).name,
            "file": fname,
            "areaM2": round(geodesic_area_m2(g), 1),
            "beyondBaselineM2": round(geodesic_area_m2(beyond), 1),
            **stats,
        })
        files[fname] = stats

    # ---- hydrologically unconnected low-lying areas (kept separate, never merged)
    low_lying = []
    for ft in SCENARIOS_FT:
        lid = f"low_{ft}ft"
        g = finalize(clipped[lid])
        fname = f"{lid}.geojson"
        props = {"layer": lid, "kind": "low", "scenarioFt": ft, "source": Layer("low", ft).name}
        stats = write_geojson(out / fname, to_features(g, props, explode=True), lid)
        low_lying.append({
            "id": lid,
            "feet": ft,
            "kind": "low",
            "sourceLayer": Layer("low", ft).name,
            "file": fname,
            "areaM2": round(geodesic_area_m2(g), 1),
            **stats,
        })
        files[fname] = stats

    # ---- additional extent between scenario pairs: B − A (A < B)
    comparisons = []
    validation = []
    for a, b in combinations(SCENARIOS_FT, 2):
        A, B = clipped[f"slr_{a}ft"], clipped[f"slr_{b}ft"]
        a_minus_b = shapely.difference(A, B).area
        diff_m = shapely.difference(B, A)
        expected = B.area - A.area
        rel_err = abs(diff_m.area - expected) / expected if expected > 0 else 0.0
        check = {
            "pair": f"{a}ft→{b}ft",
            "lowerOutsideHigherM2": round(a_minus_b, 3),
            "differenceAreaM2": round(diff_m.area, 1),
            "areaDeltaM2": round(expected, 1),
            "relativeError": round(rel_err, 6),
            "passed": bool(a_minus_b < 1.0 and rel_err < 1e-3),
        }
        validation.append(check)
        if not check["passed"]:
            log(f"WARNING validation failed for {check['pair']}: {check}")
        g = finalize(diff_m, drop_slivers=True)
        lid = f"diff_{a}ft_{b}ft"
        fname = f"{lid}.geojson"
        props = {"layer": lid, "kind": "difference", "fromFt": a, "toFt": b}
        stats = write_geojson(out / fname, to_features(g, props, explode=True), lid)
        comparisons.append({
            "id": lid,
            "fromFt": a,
            "toFt": b,
            "file": fname,
            "areaM2": round(geodesic_area_m2(g), 1),
            **stats,
        })
        files[fname] = stats

    # ---- study area outline
    study_parts = [orient(p, sign=1.0) for p in study_wgs84.geoms]
    study_geom = study_parts[0] if len(study_parts) == 1 else MultiPolygon(study_parts)
    write_geojson(out / "study_area.geojson", [{
        "type": "Feature",
        "properties": {"name": STUDY_AREA_NAME, "geoid": BOUNDARY_GEOID, "areaM2": round(study_area_m2, 1)},
        "geometry": mapping(study_geom),
    }], "study_area")

    manifest = {
        "schemaVersion": 1,
        "generatedAt": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "generator": "scripts/prepare_noaa_slr.py",
        "source": {
            "publisher": "NOAA Office for Coastal Management (OCM)",
            "dataset": "Sea Level Rise Viewer — inundation extent vector polygons",
            "geography": GEOGRAPHY,
            "geographyCounties": ["Broward", "Miami-Dade", "Palm Beach"],
            "indexUrl": SOURCE_INDEX_URL,
            "downloadUrl": SOURCE_ZIP_URL,
            "file": GPKG_MEMBER,
            "fileSizeBytes": gpkg.stat().st_size,
            "publicationYear": 2023,
            "metadata": METADATA,
            "verticalReference": "Mean Higher High Water (MHHW), modelled with NOAA VDatum (NAVD88 orthometric)",
            "credit": "Data: NOAA Office for Coastal Management, Sea Level Rise Viewer (coast.noaa.gov/slr)",
            "useConstraints": (
                "These data illustrate the scale of potential flooding, not the exact location, and do not "
                "account for erosion, subsidence, or future construction. Screening-level tool only; "
                "not for navigation, permitting, or other legal purposes."
            ),
            "inspection": inspection,
        },
        "studyArea": {
            "name": STUDY_AREA_NAME,
            "bbox": [round(v, 6) for v in study_wgs84.bounds],
            "areaM2": round(study_area_m2, 1),
            "file": "study_area.geojson",
            "boundary": census,
        },
        "crs": {"source": SOURCE_CRS, "output": OUTPUT_CRS, "processing": METRIC_CRS},
        "processing": {
            "simplifyToleranceM": SIMPLIFY_TOLERANCE_M,
            "minPartAreaM2": MIN_PART_AREA_M2,
            "coordinateDecimals": COORD_DECIMALS,
            "areaMethod": "Geodesic area on the WGS84 ellipsoid (pyproj.Geod) of the exported polygons",
            "steps": [
                "Read only features intersecting the study area from the NOAA FL_SE GeoPackage (EPSG:4269).",
                "Cut source polygons to the study area's bounding box, repair invalid geometry (GEOS make_valid) and dissolve.",
                f"Clip to the City of Miami Beach boundary (Census TIGER/Line {BOUNDARY_YEAR} place, GEOID {BOUNDARY_GEOID}).",
                "Reproject to NAD83 / UTM zone 17N (EPSG:26917) for metric operations.",
                "Derive additional extent between scenario pairs with GEOS polygon difference (higher − lower).",
                f"Drop difference slivers smaller than {MIN_PART_AREA_M2} m².",
                f"Simplify with a {SIMPLIFY_TOLERANCE_M} m topology-preserving tolerance.",
                f"Reproject to WGS84 (EPSG:4326), round to {COORD_DECIMALS} decimals and re-validate.",
                "Compute geodesic areas of the exported polygons.",
            ],
            "validation": validation,
        },
        "scenarios": scenarios,
        "lowLying": low_lying,
        "comparisons": comparisons,
        "files": files,
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2))
    total = sum(f["bytes"] for f in files.values())
    log(f"wrote {len(files) + 2} files to {out} ({total / 1e3:.0f} kB of GeoJSON)")
    for s in scenarios:
        log(f"  {s['label']:>6}: extent {s['areaM2'] / 1e6:.4f} km², beyond 0 ft {s['beyondBaselineM2'] / 1e6:.4f} km²")
    if not all(v["passed"] for v in validation):
        log("one or more validation checks failed — see manifest.processing.validation")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
