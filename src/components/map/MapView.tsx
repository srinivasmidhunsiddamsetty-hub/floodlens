import turfArea from '@turf/area'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import turfCentroid from '@turf/centroid'
import type { LineString, MultiLineString, Position } from 'geojson'
import maplibregl, { type MapGeoJSONFeature, type Map as MLMap, type PointLike, type StyleSpecification } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { expandFootprint, firstPrismHit, rejoinTileSplit, unionPieces, type Prism } from '../../lib/buildingPick'
import { AREA_BOOKMARKS, BOOKMARK_ZOOM, INITIAL_CAMERA, MAX_BOUNDS, MAX_ZOOM, MIN_ZOOM, OBLIQUE, TOP_DOWN, type CameraState } from '../../lib/constants'
import { formatScenario } from '../../lib/format'
import { distanceToLineM, isInsideArea, nearestBookmark, outsideMask, type LngLat } from '../../lib/geo'
import {
  addFloodLensLayers,
  bandOpacity,
  INTERACTIVE_LAYERS,
  LYR,
  setLabelsVisible,
  setSourceData,
  setVisible,
  SRC,
} from '../../lib/mapLayers'
import { FALLBACK_STYLE, loadBasemapStyle } from '../../lib/mapStyle'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import type { MapData } from '../../hooks/useMapData'
import { useAppDispatch, useAppState } from '../../state/AppState'
import type { BuildingInfo, Selection } from '../../state/reducer'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { AreaBookmarks } from './AreaBookmarks'
import { MapControls } from './MapControls'
import { MapStatus } from './MapStatus'

interface Props {
  data: MapData
  studyBbox: [number, number, number, number] | null
  /** Water level (ft) to emphasise on the map, e.g. while hovering the chart or legend. */
  highlightFt: number | null
}

interface HoverInfo {
  x: number
  y: number
  text: string
}

const STREET_SEARCH_M = 150

type Rings = Position[][]

const partsOf = (f: { geometry: GeoJSON.Geometry }): Rings[] =>
  f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : []

function ringsBBox(rings: Rings) {
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

/**
 * Find the building the user actually clicked.
 *
 * Vector tiles merge neighbouring buildings into MultiPolygons and split
 * buildings at tile edges, and in 3D a roof click unprojects to the ground
 * behind the building. So: follow the view ray through every candidate
 * building volume, take the first one it enters, then re-join that building's
 * tile-split pieces.
 */
function pickBuilding(map: MLMap, point: maplibregl.Point, clicked: LngLat): BuildingInfo | null {
  const layers = [LYR.buildings3d, LYR.buildingsFlat].filter(
    (id) => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none',
  )
  if (!layers.length) return null
  const hits = map.queryRenderedFeatures(point, { layers })
  if (!hits.length) return null

  const t = map.transform
  const camera = maplibregl.MercatorCoordinate.fromLngLat(t.getCameraLngLat(), t.getCameraAltitude())
  const ground = maplibregl.MercatorCoordinate.fromLngLat(clicked, 0)
  const unitsPerMeter = ground.meterInMercatorCoordinateUnits()

  // Only parts near the ray's ground track can be hit.
  const camLngLat = t.getCameraLngLat()
  const maxTop = Math.max(...hits.map((f) => Number(f.properties?.render_height) || 0), 1)
  const reach = Math.min(1, (maxTop * unitsPerMeter) / Math.max(camera.z, 1e-12))
  const nearX = clicked[0] + (camLngLat.lng - clicked[0]) * reach
  const nearY = clicked[1] + (camLngLat.lat - clicked[1]) * reach
  const pad = 0.00005
  const track = [Math.min(nearX, clicked[0]) - pad, Math.min(nearY, clicked[1]) - pad, Math.max(nearX, clicked[0]) + pad, Math.max(nearY, clicked[1]) + pad]

  const prisms: Prism[] = []
  const owners: { feature: MapGeoJSONFeature; rings: Rings }[] = []
  for (const f of hits) {
    const extruded = f.layer.id === LYR.buildings3d
    const top = extruded ? Number(f.properties?.render_height) || 0 : 0
    const base = extruded ? Number(f.properties?.render_min_height) || 0 : 0
    for (const rings of partsOf(f)) {
      const b = ringsBBox(rings)
      if (b[0] > track[2] || b[2] < track[0] || b[1] > track[3] || b[3] < track[1]) continue
      prisms.push({
        rings: rings.map((r) => r.map((p) => {
          const m = maplibregl.MercatorCoordinate.fromLngLat(p as [number, number], 0)
          return [m.x, m.y]
        })),
        baseZ: base * unitsPerMeter,
        topZ: top * unitsPerMeter,
      })
      owners.push({ feature: f, rings })
    }
  }

  let idx = firstPrismHit(camera, ground, prisms)
  if (idx < 0) {
    // Fallback: the part under the click on the ground, else the first candidate.
    idx = owners.findIndex((o) => booleanPointInPolygon(clicked, { type: 'Polygon', coordinates: o.rings }))
    if (idx < 0) idx = 0
  }
  const chosen = owners[idx]
  if (!chosen) return null

  // Re-join pieces of the same building split across tiles (same feature id, overlapping strip).
  const id = chosen.feature.id
  const pool =
    id === undefined
      ? []
      : map
          .querySourceFeatures(SRC.basemap, { sourceLayer: 'building', filter: ['==', ['id'], id] })
          .flatMap(partsOf)
  const pieces = rejoinTileSplit(chosen.rings, pool)
  const footprint = unionPieces(pieces)
  const props = chosen.feature.properties ?? {}
  return {
    renderHeightM: typeof props.render_height === 'number' ? props.render_height : null,
    renderMinHeightM: typeof props.render_min_height === 'number' ? props.render_min_height : null,
    footprint,
    footprintAreaM2: turfArea(footprint),
  }
}

function nearestStreet(map: MLMap, pt: LngLat): Selection['street'] {
  if (!map.getSource(SRC.basemap)) return null
  let best: Selection['street'] = null
  const dLat = STREET_SEARCH_M / 111_000
  const dLng = dLat / Math.cos((pt[1] * Math.PI) / 180)
  for (const f of map.querySourceFeatures(SRC.basemap, { sourceLayer: 'transportation_name' })) {
    const name = (f.properties?.name_en || f.properties?.name) as string | undefined
    if (!name) continue
    const g = f.geometry as LineString | MultiLineString
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []
    for (const line of lines) {
      const near = line.some(([x, y]) => Math.abs(x - pt[0]) < dLng * 3 && Math.abs(y - pt[1]) < dLat * 3)
      if (!near) continue
      const d = distanceToLineM(pt, line)
      if (d <= STREET_SEARCH_M && (!best || d < best.distanceM)) best = { name, distanceM: d }
    }
  }
  return best
}

function visibleInteractiveLayers(map: MLMap) {
  return INTERACTIVE_LAYERS.filter((id) => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none')
}

function isWaterAt(map: MLMap, point: PointLike) {
  return !!map.getLayer('water') && map.queryRenderedFeatures(point, { layers: ['water'] }).length > 0
}

/**
 * The whole study area fitted to the current viewport, tilted and looking up the
 * island. Computed directly in Web Mercator so the result doesn't depend on the
 * camera's current pitch (maplibre's cameraForBounds does).
 */
function overviewCamera(map: MLMap, bbox: [number, number, number, number] | null, mode: '2d' | '3d'): CameraState {
  const pitch = mode === '3d' ? INITIAL_CAMERA.pitch : 0
  const bearing = mode === '3d' ? INITIAL_CAMERA.bearing : 0
  if (!bbox) return { ...INITIAL_CAMERA, pitch, bearing }
  const { clientWidth: w, clientHeight: h } = map.getContainer()
  const [west, south, east, north] = bbox
  const corners = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
  ].map(([lng, lat]) => maplibregl.MercatorCoordinate.fromLngLat([lng, lat]))
  const cx = (Math.min(...corners.map((c) => c.x)) + Math.max(...corners.map((c) => c.x))) / 2
  const cy = (Math.min(...corners.map((c) => c.y)) + Math.max(...corners.map((c) => c.y))) / 2
  // Rotate into screen space for the target bearing, then measure the extent.
  const rad = (bearing * Math.PI) / 180
  const rotated = corners.map((c) => {
    const dx = c.x - cx
    const dy = c.y - cy
    return [dx * Math.cos(rad) + dy * Math.sin(rad), -dx * Math.sin(rad) + dy * Math.cos(rad)]
  })
  const spanX = Math.max(...rotated.map((r) => r[0])) - Math.min(...rotated.map((r) => r[0]))
  const spanY = Math.max(...rotated.map((r) => r[1])) - Math.min(...rotated.map((r) => r[1]))
  const pad = Math.max(16, Math.min(w, h) * 0.05)
  // Below 1024px the insights sheet (64px peek) and legend overlap the bottom of the map.
  const sheet = window.innerWidth < 1024 ? 96 : 0
  const availW = Math.max(100, w - 2 * pad - 48) // room for the map controls
  const availH = Math.max(100, h - 2 * pad - 52 - sheet) // room for the area bookmarks
  // A tilted view foreshortens the north–south extent (≈ cos 40° ≈ 0.77), so it can zoom in a little.
  const zoom = Math.log2(Math.min(availW / (spanX * 512), availH / (spanY * 512))) + (pitch > 0 ? 0.3 : 0)
  // Nudge the centre toward the near (south) end, which a tilted camera magnifies.
  const tilt = pitch > 0 ? 0.08 * (Math.max(...corners.map((c) => c.y)) - Math.min(...corners.map((c) => c.y))) : 0
  const lift = sheet / 2 / (512 * 2 ** zoom)
  const center = new maplibregl.MercatorCoordinate(cx, cy + tilt + lift).toLngLat()
  return { center: [center.lng, center.lat], zoom: Math.min(Math.max(zoom, MIN_ZOOM), 16), pitch, bearing }
}

type StudyFeature = Feature<Polygon | MultiPolygon>

export function MapView({ data, studyBbox, highlightFt }: Props) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const reduced = useReducedMotion()

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const [ready, setReady] = useState(false)
  const [fatal, setFatal] = useState<string | null>(null)
  const [basemapWarning, setBasemapWarning] = useState<string | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [camera, setCamera] = useState({ bearing: INITIAL_CAMERA.bearing, pitch: INITIAL_CAMERA.pitch, zoom: INITIAL_CAMERA.zoom, center: INITIAL_CAMERA.center })
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  /** Area chip the user just picked: highlighted at once, not only after the camera arrives. */
  const [pickedArea, setPickedArea] = useState<string | null>(null)

  // Values read inside long-lived map event handlers.
  const studyFeature = (data.studyArea.data?.features[0] ?? null) as StudyFeature | null
  const live = useRef({ state, studyFeature, studyBbox, reduced })
  live.current = { state, studyFeature, studyBbox, reduced }

  // ---------------------------------------------------------------- map lifecycle
  useEffect(() => {
    const ctrl = new AbortController()
    let map: MLMap | null = null

    function select(point: maplibregl.Point, clicked: LngLat) {
      if (!map) return
      const building = pickBuilding(map, point, clicked)
      // Use the footprint centre: in 3D the click unprojects to the ground behind the roof.
      const lngLat = building ? (turfCentroid(building.footprint).geometry.coordinates as LngLat) : clicked
      const area = live.current.studyFeature
      dispatch({
        type: 'select',
        selection: {
          lngLat,
          building,
          street: nearestStreet(map, lngLat),
          insideStudyArea: area ? isInsideArea(lngLat, area) : false,
          onWater: !building && isWaterAt(map, point),
        },
      })
    }

    ;(async () => {
      let style: StyleSpecification
      try {
        style = await loadBasemapStyle(ctrl.signal)
      } catch (err) {
        if (ctrl.signal.aborted) return
        style = FALLBACK_STYLE
        setBasemapWarning(`Streets and buildings didn’t load (${(err as Error).message}), so you’ll see the flood areas on their own.`)
      }
      if (ctrl.signal.aborted || !containerRef.current) return

      try {
        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          ...INITIAL_CAMERA,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          maxPitch: 70,
          maxBounds: MAX_BOUNDS,
          attributionControl: false,
          canvasContextAttributes: { antialias: true },
          fadeDuration: live.current.reduced ? 0 : 200,
        })
      } catch {
        setFatal('This browser can’t draw the 3D map, which needs WebGL. Try a recent version of Chrome, Edge, Firefox or Safari.')
        return
      }
      mapRef.current = map
      // Dev-only handle for debugging/QA from the browser console.
      if (import.meta.env.DEV) (window as unknown as { __floodlensMap?: MLMap }).__floodlensMap = map

      const canvas = map.getCanvas()
      canvas.setAttribute(
        'aria-label',
        'Map of Miami Beach. Use the arrow keys to move, plus and minus to zoom, Enter to check the middle of the map, and Escape to close the details.',
      )
      canvas.addEventListener('focus', () => setKeyboardFocus(canvas.matches(':focus-visible')))
      canvas.addEventListener('blur', () => setKeyboardFocus(false))
      canvas.addEventListener('keydown', (e) => {
        if (!map) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          const c = map.getCenter()
          select(map.project(c), [c.lng, c.lat])
        } else if (e.key === 'Escape') {
          dispatch({ type: 'select', selection: null })
        }
      })

      // Attribution sits on the bottom edge with the scale bar above it, so neither runs under the
      // legend (bottom-left). Bottom controls stack newest-on-top, hence attribution first.
      // Desktop shows it in full; narrow screens collapse it to an (i) button with shorter names.
      const compact = window.innerWidth < 1024
      const noaa = '<a href="https://coast.noaa.gov/slr/" target="_blank" rel="noopener">'
      const census = '<a href="https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html" target="_blank" rel="noopener">'
      map.addControl(
        new maplibregl.AttributionControl({
          compact,
          customAttribution: compact
            ? `Inundation: ${noaa}NOAA OCM</a> | Boundary: ${census}US Census Bureau</a>`
            : `Inundation: ${noaa}NOAA Office for Coastal Management</a> | Boundary: ${census}US Census Bureau</a>`,
        }),
        'bottom-right',
      )
      map.addControl(new maplibregl.ScaleControl({ unit: 'imperial', maxWidth: 110 }), 'bottom-right')

      map.on('load', () => {
        if (!map) return
        addFloodLensLayers(map)
        setReady(true)
      })
      map.on('error', (e) => {
        // Individual tile failures are recoverable; log for debugging without alarming users.
        console.warn('[FloodLens map]', e.error?.message ?? e)
      })
      map.on('click', (e) => select(e.point, [e.lngLat.lng, e.lngLat.lat]))

      let frame = 0
      map.on('mousemove', (e) => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          if (!map) return
          const text = describeHover(map, e.point)
          map.getCanvas().style.cursor = text ? 'pointer' : ''
          setHover(text ? { x: e.point.x, y: e.point.y, text } : null)
        })
      })
      map.on('mouseout', () => {
        cancelAnimationFrame(frame)
        setHover(null)
      })

      // Moving the map by hand hands the chip highlight back to "nearest area".
      map.on('movestart', (e) => {
        if (e.originalEvent) setPickedArea(null)
      })

      let camFrame = 0
      map.on('move', () => {
        cancelAnimationFrame(camFrame)
        camFrame = requestAnimationFrame(() => {
          if (!map) return
          const c = map.getCenter()
          setCamera({ bearing: map.getBearing(), pitch: map.getPitch(), zoom: map.getZoom(), center: [c.lng, c.lat] })
        })
      })

      // Keep the 2D/3D control honest when users tilt the map directly (right-drag, two-finger drag).
      // Only user gestures carry an originalEvent; programmatic moves (Home, 2D/3D) are ignored so an
      // interrupted animation can't flip the mode back.
      map.on('pitchend', (e) => {
        if (!map || !e.originalEvent) return
        const mode = live.current.state.viewMode
        const pitch = map.getPitch()
        if (mode === '2d' && pitch > 8) dispatch({ type: 'setViewMode', mode: '3d' })
        if (mode === '3d' && pitch < 1) dispatch({ type: 'setViewMode', mode: '2d' })
      })
    })()

    function describeHover(map: MLMap, point: maplibregl.Point): string | null {
      const layers = visibleInteractiveLayers(map)
      if (!layers.length) return null
      const feats = map.queryRenderedFeatures(point, { layers })
      if (!feats.length) return null
      const byLayer = (id: string) => feats.find((f) => f.layer.id === id)
      const building = byLayer(LYR.buildings3d) ?? byLayer(LYR.buildingsFlat)
      const band = byLayer(LYR.floodFill)
      const low = byLayer(LYR.lowFill)
      if (building) return 'Click to see when water reaches it'
      const parts: string[] = []
      if (band && !isWaterAt(map, point)) {
        const ft = band.properties?.band as number | undefined
        if (ft !== undefined) {
          parts.push(ft === 0 ? 'Underwater at today’s high tide' : `Water reaches here at ${formatScenario(ft)}`)
        }
      }
      if (low) parts.push('Low spot, cut off from the sea')
      return parts.length ? parts.join(' · ') : null
    }

    return () => {
      ctrl.abort()
      map?.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [dispatch])

  // ---------------------------------------------------------------- data → sources
  const flood = data.flood
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    setSourceData(map, SRC.flood, flood)
  }, [ready, flood])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setPaintProperty(LYR.floodFill, 'fill-opacity', bandOpacity(highlightFt))
    map.setPaintProperty(LYR.floodLine, 'line-opacity', highlightFt === null ? 0.9 : ['case', ['==', ['get', 'band'], highlightFt], 1, 0.15])
  }, [ready, highlightFt])

  const lowData = state.layers.lowLying ? data.lowLying.data : null
  useEffect(() => {
    if (ready && mapRef.current) setSourceData(mapRef.current, SRC.low, lowData)
  }, [ready, lowData])

  const studyData = data.studyArea.data
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    setSourceData(map, SRC.study, studyData)
    setSourceData(map, SRC.mask, studyFeature ? outsideMask(studyFeature) : null)
  }, [ready, studyData, studyFeature])

  // Frame the whole city once, as soon as both the map and the study area are known.
  const fitted = useRef(false)
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !studyBbox || fitted.current) return
    fitted.current = true
    map.jumpTo(overviewCamera(map, studyBbox, live.current.state.viewMode))
  }, [ready, studyBbox])

  // ---------------------------------------------------------------- layer visibility
  const { layers, viewMode } = state
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    setVisible(map, LYR.floodFill, layers.inundation)
    setVisible(map, LYR.floodLine, layers.inundation)
    setVisible(map, LYR.lowFill, layers.lowLying)
    setVisible(map, LYR.lowLine, layers.lowLying)
    const extruded = layers.buildings && viewMode === '3d'
    setVisible(map, LYR.buildings3d, extruded)
    setVisible(map, LYR.buildingsFlat, layers.buildings && !extruded)
    setVisible(map, LYR.buildingsOutline, layers.buildings && !extruded)
    setVisible(map, LYR.selectedBuilding3d, extruded)
    setVisible(map, LYR.selectedBuildingFill, !extruded)
    setVisible(map, LYR.selectedBuildingLine, !extruded)
    setLabelsVisible(map, layers.labels)
    // The outside wash goes with the boundary (as in v0.2), so turning it off gives a clean map.
    setVisible(map, LYR.studyLine, layers.studyArea)
    setVisible(map, LYR.mask, layers.studyArea)
  }, [ready, layers, viewMode])

  // ---------------------------------------------------------------- camera
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const duration = reduced ? 0 : 900
    const pitch = map.getPitch()
    if (viewMode === '2d' && (pitch > 0.5 || map.getBearing() !== 0)) {
      map.easeTo({ ...TOP_DOWN, duration })
    } else if (viewMode === '3d' && pitch < 5) {
      const bearing = Math.abs(map.getBearing()) < 0.5 ? OBLIQUE.bearing : map.getBearing()
      map.easeTo({ pitch: OBLIQUE.pitch, bearing, duration })
    }
  }, [ready, viewMode, reduced])

  const resetToken = state.cameraResetToken
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || resetToken === 0) return
    setPickedArea(null)
    const camera = overviewCamera(map, live.current.studyBbox, '3d')
    if (reduced) map.jumpTo(camera)
    else map.flyTo({ ...camera, duration: 1400, essential: false })
  }, [ready, resetToken, reduced])

  const inspectToken = state.inspectCenterToken
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || inspectToken === 0) return
    const c = map.getCenter()
    map.fire('click', { point: map.project(c), lngLat: c, originalEvent: new MouseEvent('click') })
  }, [ready, inspectToken])

  // ---------------------------------------------------------------- selection
  const selection = state.selection
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    setSourceData(
      map,
      SRC.selectedPoint,
      selection && !selection.building
        ? { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: selection.lngLat } }
        : null,
    )
    const b = selection?.building
    setSourceData(
      map,
      SRC.selectedBuilding,
      b ? { ...expandFootprint(b.footprint, 0.4), properties: { height: b.renderHeightM ?? 0, base: b.renderMinHeightM ?? 0 } } : null,
    )
  }, [ready, selection])

  const ease = (fn: (m: MLMap) => void) => mapRef.current && fn(mapRef.current)
  const anim = reduced ? { duration: 0 } : { duration: 300 }
  const goTo = (id: string, center: [number, number]) => {
    setPickedArea(id)
    ease((m) => {
      const camera = { center, zoom: BOOKMARK_ZOOM, ...(viewMode === '3d' ? OBLIQUE : TOP_DOWN) }
      if (reduced) m.jumpTo(camera)
      else m.flyTo({ ...camera, duration: 1600, essential: false })
    })
  }

  return (
    <div className="relative h-full w-full bg-canvas" role="region" aria-label="Map">
      {/* maplibre-gl.css forces `position: relative` on the container, so size it explicitly. */}
      <div ref={containerRef} className="h-full w-full" />

      {ready && <AreaBookmarks onGo={goTo} active={pickedArea ?? nearestBookmark(camera.center, camera.zoom, AREA_BOOKMARKS)} />}
      {ready && (
        <MapControls
          viewMode={viewMode}
          bearing={camera.bearing}
          pitch={camera.pitch}
          zoom={camera.zoom}
          onZoomIn={() => ease((m) => m.zoomIn(anim))}
          onZoomOut={() => ease((m) => m.zoomOut(anim))}
          onResetNorth={() => ease((m) => m.easeTo({ bearing: 0, ...anim }))}
          onShowAll={() => dispatch({ type: 'resetCamera' })}
          onSetMode={(mode) => dispatch({ type: 'setViewMode', mode })}
        />
      )}

      {keyboardFocus && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center" aria-hidden="true">
          <div className="relative size-10">
            <span className="absolute top-1/2 left-0 h-px w-full bg-fg/70" />
            <span className="absolute top-0 left-1/2 h-full w-px bg-fg/70" />
            <span className="absolute inset-3 rounded-full border-2 border-accent bg-white/60" />
          </div>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-fg/85 px-3 py-1 text-xs text-white">
            Press Enter to check the middle of the map · Esc to close
          </span>
        </div>
      )}

      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-64 rounded border border-line bg-surface px-2 py-1 text-xs text-fg shadow-float"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
          aria-hidden="true"
        >
          {hover.text}
        </div>
      )}
      <MapStatus
        ready={ready}
        fatal={fatal}
        warning={basemapWarning}
        loading={data.loading}
        errors={data.errors}
        scenarioLabel={formatScenario(state.scenarioFt)}
      />
    </div>
  )
}
