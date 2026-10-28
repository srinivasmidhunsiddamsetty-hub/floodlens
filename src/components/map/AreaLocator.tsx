import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import type { Map as MLMap } from 'maplibre-gl'
import { useEffect, useMemo, useState } from 'react'
import { AREA_BOOKMARKS } from '../../lib/constants'
import { featureBBox } from '../../lib/geo'
import { bandColor, colors } from '../../lib/theme'
import type { ExtentCollection } from '../../types/data'

interface Props {
  map: MLMap
  area: Feature<Polygon | MultiPolygon>
  /** The flood bands currently drawn on the map (band 0 = today's high tide). */
  flood: ExtentCollection | null
  showFlood: boolean
  onGo: (center: [number, number]) => void
}

const HEIGHT = 176
/** Below this zoom the whole city is on screen, so a viewport outline adds nothing. */
const VIEWPORT_MIN_ZOOM = 12.6
/** Mark an area as "you are here" only when zoomed in near its bookmark. */
const ACTIVE_MIN_ZOOM = 13.5
const ACTIVE_MAX_KM = 2.5

type Project = (p: Position) => [number, number]

function polygonsOf(f: Feature<Polygon | MultiPolygon>): Position[][][] {
  return f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
}

/** SVG path for polygons, dropping vertices closer than `minPx` to the last one kept. */
function toPath(features: Feature<Polygon | MultiPolygon>[], project: Project, minPx = 0.7): string {
  let d = ''
  for (const f of features)
    for (const rings of polygonsOf(f))
      for (const ring of rings) {
        let last: [number, number] | null = null
        let part = ''
        for (const p of ring) {
          const [x, y] = project(p)
          if (last && Math.abs(x - last[0]) < minPx && Math.abs(y - last[1]) < minPx) continue
          part += `${part ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
          last = [x, y]
        }
        if (part) d += `${part}Z`
      }
  return d
}

/**
 * Overview of the whole city: where the current view is, how flooding spreads at
 * the current level, and one-click jumps to its three commonly named areas
 * (camera positions only; they have no official boundaries).
 */
export function AreaLocator({ map, area, flood, showFlood, onGo }: Props) {
  const geo = useMemo(() => {
    const [west, south, east, north] = featureBBox(area)
    const kx = Math.cos((((south + north) / 2) * Math.PI) / 180)
    const s = HEIGHT / (north - south)
    const width = Math.round((east - west) * kx * s)
    const project: Project = ([lng, lat]) => [(lng - west) * kx * s, (north - lat) * s]
    const unproject = (x: number, y: number): [number, number] => [west + x / (kx * s), north - y / s]
    return { width, project, unproject, outline: toPath([area], project) }
  }, [area])

  const floodPaths = useMemo(() => {
    if (!flood) return []
    const byBand = new Map<number, Feature<Polygon | MultiPolygon>[]>()
    for (const f of flood.features) {
      const band = Number(f.properties?.band ?? 0)
      byBand.set(band, [...(byBand.get(band) ?? []), f as Feature<Polygon | MultiPolygon>])
    }
    return [...byBand.entries()].sort(([a], [b]) => a - b).map(([band, fs]) => ({ band, d: toPath(fs, geo.project) }))
  }, [flood, geo])

  // Follow the camera: viewport outline + the nearest named area.
  const [view, setView] = useState<{ corners: string | null; active: string | null }>({ corners: null, active: null })
  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const { clientWidth: w, clientHeight: h } = map.getContainer()
        const zoom = map.getZoom()
        const corners =
          zoom < VIEWPORT_MIN_ZOOM
            ? null
            : [
                [0, 0],
                [w, 0],
                [w, h],
                [0, h],
              ]
                .map(([x, y]) => map.unproject([x, y]))
                .map((ll) => geo.project([ll.lng, ll.lat]).map((v) => v.toFixed(1)).join(','))
                .join(' ')
        const c = map.getCenter()
        let active: string | null = null
        if (zoom >= ACTIVE_MIN_ZOOM) {
          const kmPerDeg = 111.32
          let best = ACTIVE_MAX_KM
          for (const a of AREA_BOOKMARKS) {
            const dKm = Math.hypot((a.center[0] - c.lng) * kmPerDeg * Math.cos((c.lat * Math.PI) / 180), (a.center[1] - c.lat) * kmPerDeg)
            if (dKm < best) [best, active] = [dKm, a.id]
          }
        }
        setView({ corners, active })
      })
    }
    update()
    map.on('move', update)
    map.on('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      map.off('move', update)
      map.off('resize', update)
    }
  }, [map, geo])

  return (
    <nav aria-label="Go to area" className="absolute top-3 left-3 z-10 flex gap-1 rounded-lg border border-line bg-surface/95 p-2 pr-2.5 shadow-panel">
      <svg
        width={geo.width}
        height={HEIGHT}
        viewBox={`0 0 ${geo.width} ${HEIGHT}`}
        className="shrink-0 cursor-pointer overflow-hidden rounded"
        aria-hidden="true"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          onGo(geo.unproject(e.clientX - r.left, e.clientY - r.top))
        }}
      >
        <title>Click to fly there</title>
        {/* outside the city (no data) in grey, so the city's shape reads at a glance */}
        <rect width={geo.width} height={HEIGHT} fill="#eceff2" />
        <path d={geo.outline} fill="#fbf9f4" />
        {floodPaths.map((p) =>
          p.band === 0 ? (
            <path key={p.band} d={p.d} fill={colors.water} fillRule="evenodd" />
          ) : (
            showFlood && <path key={p.band} d={p.d} fill={bandColor(p.band)} fillRule="evenodd" />
          ),
        )}
        <path d={geo.outline} fill="none" stroke={colors.studyArea} strokeWidth="0.8" strokeDasharray="2 1.5" />
        {view.corners && <polygon points={view.corners} fill={colors.accent} fillOpacity="0.12" stroke={colors.accent} strokeWidth="1.5" strokeLinejoin="round" />}
        {AREA_BOOKMARKS.map((a) => {
          const [x, y] = geo.project(a.center)
          const on = view.active === a.id
          return (
            <g key={a.id}>
              {/* leader from the place to its label */}
              <line x1={x + 3} x2={geo.width} y1={y} y2={y} stroke={on ? colors.accent : '#9aa4ae'} strokeWidth="0.8" strokeDasharray="1.5 1.5" />
              <circle cx={x} cy={y} r={on ? 3.5 : 2.5} fill={on ? colors.accent : '#ffffff'} stroke={on ? '#ffffff' : colors.studyArea} strokeWidth="1.2" />
            </g>
          )
        })}
      </svg>
      <ul className="relative w-[86px]" style={{ height: HEIGHT }}>
        {AREA_BOOKMARKS.map((a) => {
          const on = view.active === a.id
          return (
            <li key={a.id} className="absolute left-0" style={{ top: geo.project(a.center)[1] - 11 }}>
              <button
                type="button"
                onClick={() => onGo(a.center)}
                aria-current={on ? 'location' : undefined}
                className={`rounded px-1.5 py-0.5 text-left text-[12px] leading-[18px] whitespace-nowrap transition-colors hover:bg-accent-soft hover:text-accent ${
                  on ? 'font-semibold text-accent' : 'font-medium text-fg'
                }`}
              >
                {a.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
