/**
 * Building picking for 3D maps.
 *
 * Why this exists: in an oblique view, a click on a roof unprojects to the
 * ground *behind* the building, and the vector tiles merge many neighbouring
 * buildings into one MultiPolygon. To find the building the user actually
 * clicked we follow the view ray from the camera to the ground and return the
 * first building "prism" (footprint × [base, top] height) it enters.
 *
 * All functions are pure and work in Web-Mercator units (MapLibre
 * MercatorCoordinate space: x, y in [0, 1], z = altitude in the same units).
 */
import turfArea from '@turf/area'
import { featureCollection } from '@turf/helpers'
import intersect from '@turf/intersect'
import union from '@turf/union'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'

export interface XYZ {
  x: number
  y: number
  z: number
}

export interface Prism {
  /** Footprint rings in mercator x/y (outer ring first). */
  rings: Position[][]
  baseZ: number
  topZ: number
}

/** Even-odd point-in-polygon over all rings (holes handled naturally). */
export function pointInRings(x: number, y: number, rings: Position[][]): boolean {
  let inside = false
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
  }
  return inside
}

/**
 * Index of the prism the ray camera → ground enters first, or -1.
 * Samples the part of the ray that lies within each prism's height range.
 */
export function firstPrismHit(camera: XYZ, ground: XYZ, prisms: Prism[], samples = 96): number {
  let best = -1
  let bestS = Infinity
  const cz = Math.max(camera.z, 1e-12)
  prisms.forEach((p, idx) => {
    // Ray altitude z(s) = cz · (1 − s); inside the prism's height band when base ≤ z ≤ top.
    const sStart = Math.max(0, 1 - p.topZ / cz)
    const sEnd = Math.min(1, 1 - p.baseZ / cz)
    if (sStart > sEnd || sStart >= bestS) return
    for (let k = 0; k <= samples; k++) {
      const s = sStart + ((sEnd - sStart) * k) / samples
      if (s >= bestS) break
      const x = camera.x + (ground.x - camera.x) * s
      const y = camera.y + (ground.y - camera.y) * s
      if (pointInRings(x, y, p.rings)) {
        bestS = s
        best = idx
        break
      }
    }
  })
  return best
}

const bbox = (rings: Position[][]) => {
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const r of rings)
    for (const [x, y] of r) {
      if (x < w) w = x
      if (x > e) e = x
      if (y < s) s = y
      if (y > n) n = y
    }
  return [w, s, e, n] as const
}

const asPolygon = (rings: Position[][]): Feature<Polygon> => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: rings },
})

/**
 * Re-join a building that the vector-tile grid split into pieces.
 *
 * Tiles carry a buffer beyond their edge, so the two halves of a split
 * building *overlap* by a strip of real area — while separate neighbouring
 * buildings (e.g. terraced houses) only *touch*. Starting from `seed` (lng/lat
 * rings), collect every polygon in `pool` that overlaps an already-collected
 * piece by more than `minOverlapM2`.
 */
export function rejoinTileSplit(seed: Position[][], pool: Position[][][], minOverlapM2 = 1, maxParts = 8): Position[][][] {
  const out = [seed]
  const remaining = pool.filter((p) => p !== seed)
  let frontier = [seed]
  while (frontier.length && out.length < maxParts) {
    const next: Position[][][] = []
    for (let i = remaining.length - 1; i >= 0; i--) {
      const cand = remaining[i]
      const cb = bbox(cand)
      const overlaps = frontier.some((f) => {
        const fb = bbox(f)
        if (cb[0] > fb[2] || cb[2] < fb[0] || cb[1] > fb[3] || cb[3] < fb[1]) return false
        const inter = intersect(featureCollection([asPolygon(f), asPolygon(cand)]))
        return !!inter && turfArea(inter) > minOverlapM2
      })
      if (overlaps) {
        out.push(cand)
        next.push(cand)
        remaining.splice(i, 1)
      }
    }
    frontier = next
  }
  return out
}

/** Union of polygon pieces → one footprint feature (Polygon or MultiPolygon). */
export function unionPieces(pieces: Position[][][]): Feature<Polygon | MultiPolygon> {
  if (pieces.length === 1) return asPolygon(pieces[0])
  const u = union(featureCollection(pieces.map(asPolygon)))
  return (u as Feature<Polygon | MultiPolygon> | null) ?? asPolygon(pieces[0])
}

/** How much bigger the coloured buildings are drawn than the map's own, so their walls never coincide (v0.62). */
export const LEVEL_OVERLAY_GROW_M = 0.4
/** The selection goes round the coloured building too, so it needs to be bigger still. */
export const SELECTION_GROW_M = 0.6

/**
 * Move every wall of a closed ring `meters` outward (negative: inward), along the wall's own normal.
 * Used to draw a building slightly larger than the map's own (and taller), so the two surfaces never
 * coincide: coincident faces z-fight and flicker while zooming. Each wall moves by the full distance,
 * including the walls of a notch, which a push away from the ring's centre moved the wrong way and
 * left the building underneath showing through (v0.62).
 */
export function expandRing(ring: Position[], meters: number): Position[] {
  const n = ring.length - 1
  if (n < 3) return ring
  const lat0 = ring.reduce((sum, p) => sum + p[1], 0) / ring.length
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180)
  const ky = 110_540
  const pts = ring.slice(0, n).map(([x, y]) => [x * kx, y * ky])
  let area = 0
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % n]
    area += p[0] * q[1] - q[0] * p[1]
  })
  // Counter-clockwise rings have their outside on the right of each wall.
  const side = area >= 0 ? 1 : -1
  const normal = (a: number[], b: number[]) => {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    return [(side * dy) / len, (-side * dx) / len]
  }
  const moved = pts.map((p, i) => {
    const n1 = normal(pts[(i + n - 1) % n], p)
    const n2 = normal(p, pts[(i + 1) % n])
    const mx = n1[0] + n2[0]
    const my = n1[1] + n2[1]
    const len = Math.hypot(mx, my)
    if (len < 1e-6) return [(p[0] + n1[0] * meters) / kx, (p[1] + n1[1] * meters) / ky]
    // Mitre the corner so both walls move the full distance; capped for very sharp corners.
    const f = meters / Math.max((mx / len) * n1[0] + (my / len) * n1[1], 0.5)
    return [(p[0] + (mx / len) * f) / kx, (p[1] + (my / len) * f) / ky]
  })
  return [...moved, moved[0]]
}

/** The footprint grown by `meters`: outer walls move out, and courtyards get smaller. */
export function expandFootprint(f: Feature<Polygon | MultiPolygon>, meters: number): Feature<Polygon | MultiPolygon> {
  const grow = (rings: Position[][]) => rings.map((r, i) => expandRing(r, i === 0 ? meters : -meters))
  const g = f.geometry
  return g.type === 'Polygon'
    ? { ...f, geometry: { type: 'Polygon', coordinates: grow(g.coordinates) } }
    : { ...f, geometry: { type: 'MultiPolygon', coordinates: g.coordinates.map(grow) } }
}
