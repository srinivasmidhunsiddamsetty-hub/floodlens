/**
 * Works out, for every OpenStreetMap building in the City of Miami Beach, the lowest NOAA sea level
 * whose mapped extent touches its footprint, and writes those buildings to
 * public/data/noaa/building_levels.geojson. The map colours them from that file (v0.62).
 *
 * Why a file of its own: the map's vector tiles merge up to about a thousand separate buildings into
 * one feature and cut them at tile edges, so a building can't be coloured on its own from the tiles.
 *
 * The rule is the place card's, so the colour and the card agree: a building counts as inside the
 * city when its footprint's centre is (`isInsideArea`), and its level is the first one whose
 * ocean-connected extent touches any part of its footprint (`probeScenarios`). Low spots don't count,
 * as they don't in "Water reaches at". Buildings no level reaches, and buildings outside the city,
 * aren't in the file: they keep the map's plain colour. Nothing is estimated.
 *
 *   npm run data:buildings
 *
 * Needs the network (OpenFreeMap tiles, free, no key). Takes a few seconds.
 */
import { gunzipSync } from 'node:zlib'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { VectorTile } from '@mapbox/vector-tile'
import turfArea from '@turf/area'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import turfCentroid from '@turf/centroid'
import { featureCollection } from '@turf/helpers'
import intersect from '@turf/intersect'
import union from '@turf/union'
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson'
import Pbf from 'pbf'
import { expandFootprint, LEVEL_OVERLAY_GROW_M } from '../src/lib/buildingPick'

const DATA = resolve(import.meta.dirname, '../public/data/noaa')
const OUT = resolve(DATA, 'building_levels.geojson')
const TILEJSON = 'https://tiles.openfreemap.org/planet'
const ZOOM = 14 // the tiles' highest zoom, so the most detail they have
const LEVELS = [0, 1, 2, 3, 4, 5]
/** Two tile copies of a building overlap by a real strip; neighbours only touch (as in `rejoinTileSplit`). */
const MIN_OVERLAP_M2 = 1

type Rings = Position[][]
type Area = Feature<Polygon | MultiPolygon>
type BBox = [number, number, number, number]
interface Part {
  rings: Rings
  bbox: BBox
  height: number
  base: number
  hide3d: boolean
}

const readJson = (file: string) => JSON.parse(readFileSync(resolve(DATA, file), 'utf8'))
const asPolygon = (rings: Rings): Feature<Polygon> => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: rings } })
const polygonsOf = (g: Polygon | MultiPolygon): Rings[] => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)

function bboxOf(rings: Rings): BBox {
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const r of rings)
    for (const [x, y] of r) {
      if (x < w) w = x
      if (x > e) e = x
      if (y < s) s = y
      if (y > n) n = y
    }
  return [w, s, e, n]
}
const overlaps = (a: BBox, b: BBox) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]

/** Every building part in the tiles over the city. One tile feature can hold hundreds of buildings. */
async function readTileParts(bounds: BBox): Promise<{ parts: Part[]; tileset: string }> {
  const tilejson = (await (await fetch(TILEJSON)).json()) as { tiles: string[]; maxzoom: number }
  const template = tilejson.tiles[0]
  const count = 2 ** ZOOM
  const tileX = (lng: number) => Math.floor(((lng + 180) / 360) * count)
  const tileY = (lat: number) => {
    const r = (lat * Math.PI) / 180
    return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * count)
  }
  const parts: Part[] = []
  for (let x = tileX(bounds[0]); x <= tileX(bounds[2]); x++) {
    for (let y = tileY(bounds[3]); y <= tileY(bounds[1]); y++) {
      const url = template.replace('{z}', String(ZOOM)).replace('{x}', String(x)).replace('{y}', String(y))
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Tile ${x}/${y} didn't load (HTTP ${res.status}).`)
      let buf: Buffer = Buffer.from(await res.arrayBuffer())
      if (buf[0] === 0x1f) buf = gunzipSync(buf)
      const layer = new VectorTile(new Pbf(buf)).layers.building
      if (!layer) continue
      for (let i = 0; i < layer.length; i++) {
        const f = layer.feature(i)
        const g = f.toGeoJSON(x, y, ZOOM).geometry
        if (g.type !== 'Polygon' && g.type !== 'MultiPolygon') continue
        for (const rings of polygonsOf(g)) {
          parts.push({
            rings,
            bbox: bboxOf(rings),
            height: Number(f.properties.render_height) || 0,
            base: Number(f.properties.render_min_height) || 0,
            hide3d: f.properties.hide_3d === true,
          })
        }
      }
    }
  }
  return { parts, tileset: template.split('/').at(-4) ?? template }
}

/**
 * Neighbouring tiles each hold a copy (whole or cut) of a building near their shared edge. Pieces of
 * the same height that really overlap are one building, the rule the place card uses when it re-joins
 * a clicked building (`pickBuilding`). The tiles' ids can't do it: the same building usually has a
 * different id in each tile. Different heights stay apart, so a tower isn't joined to its podium.
 */
function joinTileCopies(parts: Part[]): Part[][] {
  const parent = parts.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const CELL = 0.001
  const cells = new Map<string, number[]>()
  parts.forEach((p, i) => {
    for (let a = Math.floor(p.bbox[0] / CELL); a <= Math.floor(p.bbox[2] / CELL); a++) {
      for (let b = Math.floor(p.bbox[1] / CELL); b <= Math.floor(p.bbox[3] / CELL); b++) {
        const key = `${a}_${b}`
        const cell = cells.get(key)
        if (cell) cell.push(i)
        else cells.set(key, [i])
      }
    }
  })
  const seen = new Set<string>()
  for (const cell of cells.values()) {
    for (let a = 0; a < cell.length; a++) {
      for (let b = a + 1; b < cell.length; b++) {
        const [i, j] = [cell[a], cell[b]]
        const [a1, a2] = [parts[i], parts[j]]
        if (a1.height !== a2.height || a1.base !== a2.base || a1.hide3d !== a2.hide3d || !overlaps(a1.bbox, a2.bbox)) continue
        const key = `${i}:${j}`
        if (seen.has(key) || find(i) === find(j)) continue
        seen.add(key)
        const shared = intersect(featureCollection([asPolygon(a1.rings), asPolygon(a2.rings)]))
        if (shared && turfArea(shared) > MIN_OVERLAP_M2) parent[find(i)] = find(j)
      }
    }
  }
  const groups = new Map<number, Part[]>()
  parts.forEach((p, i) => {
    const root = find(i)
    const group = groups.get(root)
    if (group) group.push(p)
    else groups.set(root, [p])
  })
  return [...groups.values()]
}

function footprintOf(group: Part[]): Area {
  if (group.length === 1) return asPolygon(group[0].rings)
  const joined = union(featureCollection(group.map((p) => asPolygon(p.rings))))
  if (!joined) throw new Error('A building could not be joined from its tile copies.')
  return joined as Area
}

/**
 * Whether a footprint touches a level's extent: the same answer as `featureIntersecting` in lib/geo
 * (src/lib/dataIntegrity.test.ts checks it against that function), but thousands of times faster,
 * because the extent's edges are bucketed by latitude and only the nearby ones are tested.
 */
function levelIndex(extent: FeatureCollection<Polygon | MultiPolygon>) {
  const BAND = 2e-4
  const bands = new Map<number, number[][]>()
  for (const f of extent.features) {
    for (const rings of polygonsOf(f.geometry)) {
      for (const ring of rings) {
        for (let i = 1; i < ring.length; i++) {
          const [ax, ay] = ring[i - 1]
          const [bx, by] = ring[i]
          for (let k = Math.floor(Math.min(ay, by) / BAND); k <= Math.floor(Math.max(ay, by) / BAND); k++) {
            const band = bands.get(k)
            if (band) band.push([ax, ay, bx, by])
            else bands.set(k, [[ax, ay, bx, by]])
          }
        }
      }
    }
  }
  const crosses = (e: number[], a: Position, b: Position) => {
    const d = (e[2] - e[0]) * (b[1] - a[1]) - (e[3] - e[1]) * (b[0] - a[0])
    if (d === 0) return false
    const t = ((a[0] - e[0]) * (b[1] - a[1]) - (a[1] - e[1]) * (b[0] - a[0])) / d
    const u = ((a[0] - e[0]) * (e[3] - e[1]) - (a[1] - e[1]) * (e[2] - e[0])) / d
    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }
  return (footprint: Area) => {
    for (const rings of polygonsOf(footprint.geometry)) {
      const box = bboxOf(rings)
      for (let k = Math.floor(box[1] / BAND); k <= Math.floor(box[3] / BAND); k++) {
        for (const e of bands.get(k) ?? []) {
          if (!overlaps(box, [Math.min(e[0], e[2]), Math.min(e[1], e[3]), Math.max(e[0], e[2]), Math.max(e[1], e[3])])) continue
          for (const ring of rings) for (let i = 1; i < ring.length; i++) if (crosses(e, ring[i - 1], ring[i])) return true
        }
      }
      // No edge crosses, so the footprint is wholly inside or wholly outside: test one corner.
      const [px, py] = rings[0][0]
      let inside = false
      for (const e of bands.get(Math.floor(py / BAND)) ?? []) {
        if (e[1] > py !== e[3] > py && px < ((e[2] - e[0]) * (py - e[1])) / (e[3] - e[1]) + e[0]) inside = !inside
      }
      if (inside) return true
    }
    return false
  }
}

const round = (v: unknown): unknown => (typeof (v as number[])[0] === 'number' ? (v as number[]).map((n) => +n.toFixed(6)) : (v as unknown[]).map(round))

const study = readJson('study_area.geojson').features[0] as Area
const { parts, tileset } = await readTileParts(bboxOf(polygonsOf(study.geometry).flat()))
const groups = joinTileCopies(parts)
const touches = LEVELS.map((ft) => levelIndex(readJson(`slr_${ft}ft.geojson`)))

const counts: Record<string, number> = { notReached: 0 }
for (const ft of LEVELS) counts[ft] = 0
let inCity = 0
const features: Feature[] = []
for (const group of groups) {
  const footprint = footprintOf(group)
  if (!booleanPointInPolygon(turfCentroid(footprint), study)) continue
  inCity++
  const level = LEVELS.find((ft) => touches[ft](footprint))
  if (level === undefined) {
    counts.notReached++
    continue
  }
  counts[level]++
  const grown = expandFootprint(footprint, LEVEL_OVERLAY_GROW_M).geometry
  features.push({
    type: 'Feature',
    properties: {
      r: level,
      h: group[0].height,
      b: group[0].base,
      // The map's own 3D buildings skip these outlines of many-part buildings, and draw the parts.
      ...(group[0].hide3d ? { x: 1 } : {}),
    },
    geometry: { type: grown.type, coordinates: round(grown.coordinates) } as Polygon | MultiPolygon,
  })
}

const metadata = {
  description: 'OpenStreetMap buildings in the City of Miami Beach, with the lowest NOAA sea level whose extent touches each footprint',
  properties: { r: 'level in ft', h: 'height in m', b: 'base in m', x: '1 if the map hides it in 3D' },
  growM: LEVEL_OVERLAY_GROW_M,
  tileset,
  generator: 'scripts/prepare_buildings.ts',
  buildingsInCity: inCity,
  counts,
}
writeFileSync(OUT, JSON.stringify({ type: 'FeatureCollection', metadata, features }))
console.log(`${tileset}: ${inCity} buildings in the city, ${features.length} reached by some level`, counts)
