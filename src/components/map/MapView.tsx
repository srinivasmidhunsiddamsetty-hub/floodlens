import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import turfCentroid from '@turf/centroid'
import type { Feature, LineString, MultiLineString, Polygon, Position } from 'geojson'
import maplibregl, { type MapGeoJSONFeature, type Map as MLMap, type PointLike, type StyleSpecification } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { INITIAL_CAMERA, MAX_BOUNDS, MAX_ZOOM, MIN_ZOOM, OBLIQUE, TOP_DOWN } from '../../lib/constants'
import { formatScenario, formatSmallArea } from '../../lib/format'
import { distanceToLineM, isInsideBBox, outsideMask, type LngLat } from '../../lib/geo'
import {
  addFloodLensLayers,
  INTERACTIVE_LAYERS,
  LYR,
  setLabelsVisible,
  setSourceData,
  setVisible,
  SRC,
} from '../../lib/mapLayers'
import { FALLBACK_STYLE, loadBasemapStyle } from '../../lib/mapStyle'
import { opacity } from '../../lib/theme'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import type { MapData } from '../../hooks/useMapData'
import { useAppDispatch, useAppState } from '../../state/AppState'
import type { BuildingInfo, Selection } from '../../state/reducer'
import { MapStatus } from './MapStatus'

interface Props {
  data: MapData
  studyBbox: [number, number, number, number] | null
}

interface HoverInfo {
  x: number
  y: number
  text: string
}

const STREET_SEARCH_M = 150

/**
 * The footprint of the clicked building. Vector tiles merge neighbouring
 * buildings with identical attributes into one MultiPolygon, so keep only the
 * part under the click — or, for a 3D roof click (which unprojects to the
 * ground behind the building), the part whose centre is nearest.
 */
function footprintFrom(features: MapGeoJSONFeature[], clicked: LngLat): Feature<Polygon> | null {
  const first = features[0]
  if (!first) return null
  // The top-most hit, plus its tile-clipped siblings (same feature id).
  const pieces = features.filter((f) => f === first || (first.id !== undefined && f.id === first.id))
  const parts: Position[][][] = []
  for (const f of pieces) {
    if (f.geometry.type === 'Polygon') parts.push(f.geometry.coordinates)
    else if (f.geometry.type === 'MultiPolygon') parts.push(...f.geometry.coordinates)
  }
  if (!parts.length) return null
  const asFeature = (coordinates: Position[][]): Feature<Polygon> => ({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates },
  })
  const containing = parts.find((p) => booleanPointInPolygon(clicked, asFeature(p)))
  if (containing) return asFeature(containing)
  let best = parts[0]
  let bestD = Infinity
  for (const p of parts) {
    const [x, y] = turfCentroid(asFeature(p)).geometry.coordinates
    const d = Math.hypot(x - clicked[0], y - clicked[1])
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return asFeature(best)
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

export function MapView({ data, studyBbox }: Props) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const reduced = useReducedMotion()

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const [ready, setReady] = useState(false)
  const [fatal, setFatal] = useState<string | null>(null)
  const [basemapWarning, setBasemapWarning] = useState<string | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  // Values read inside long-lived map event handlers.
  const live = useRef({ state, data, studyBbox, reduced })
  live.current = { state, data, studyBbox, reduced }

  // ---------------------------------------------------------------- map lifecycle
  useEffect(() => {
    const ctrl = new AbortController()
    let map: MLMap | null = null

    ;(async () => {
      let style: StyleSpecification
      try {
        style = await loadBasemapStyle(ctrl.signal)
      } catch (err) {
        if (ctrl.signal.aborted) return
        style = FALLBACK_STYLE
        setBasemapWarning(
          `Basemap unavailable (${(err as Error).message}). NOAA overlays are shown without streets or buildings.`,
        )
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
        setFatal('Your browser could not start WebGL, which the interactive map requires. Try a recent Chrome, Edge, Firefox or Safari.')
        return
      }
      mapRef.current = map
      // Dev-only handle for debugging/QA from the browser console.
      if (import.meta.env.DEV) (window as unknown as { __floodlensMap?: MLMap }).__floodlensMap = map
      map.getCanvas().setAttribute(
        'aria-label',
        'Interactive map of South Beach, Miami Beach. Use arrow keys to pan and plus or minus to zoom.',
      )

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right')
      map.addControl(new maplibregl.ScaleControl({ unit: 'imperial', maxWidth: 110 }), 'bottom-right')
      map.addControl(
        new maplibregl.AttributionControl({
          // Keep attribution fully visible on desktop; collapse to an (i) button on narrow screens.
          compact: window.innerWidth < 1024,
          customAttribution:
            'Inundation: <a href="https://coast.noaa.gov/slr/" target="_blank" rel="noopener">NOAA Office for Coastal Management</a>',
        }),
        'bottom-right',
      )

      map.on('load', () => {
        if (!map) return
        addFloodLensLayers(map)
        setReady(true)
      })
      map.on('error', (e) => {
        // Individual tile failures are recoverable; log once for debugging without alarming users.
        console.warn('[FloodLens map]', e.error?.message ?? e)
      })

      map.on('click', (e) => {
        if (!map) return
        dispatch({ type: 'select', selection: buildSelection(map, e.point, [e.lngLat.lng, e.lngLat.lat]) })
      })

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

      // Keep the 2D/3D toggle honest when users tilt the map directly (right-drag, two-finger drag).
      map.on('pitchend', () => {
        if (!map) return
        const mode = live.current.state.viewMode
        const pitch = map.getPitch()
        if (mode === '2d' && pitch > 8) dispatch({ type: 'setViewMode', mode: '3d' })
        if (mode === '3d' && pitch < 1) dispatch({ type: 'setViewMode', mode: '2d' })
      })
    })()

    function buildSelection(map: MLMap, point: maplibregl.Point, clicked: LngLat): Selection {
      const buildingLayers = [LYR.buildings3d, LYR.buildingsFlat].filter(
        (id) => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none',
      )
      const hits = buildingLayers.length ? map.queryRenderedFeatures(point, { layers: buildingLayers }) : []
      const footprint = footprintFrom(hits, clicked)
      let building: BuildingInfo | null = null
      let lngLat = clicked
      if (footprint) {
        const props = hits[0].properties ?? {}
        building = {
          renderHeightM: typeof props.render_height === 'number' ? props.render_height : null,
          renderMinHeightM: typeof props.render_min_height === 'number' ? props.render_min_height : null,
          footprint,
        }
        // In 3D a click on a roof unprojects to the ground *behind* the building — use the footprint centre.
        lngLat = turfCentroid(footprint).geometry.coordinates as LngLat
      }
      const bbox = live.current.studyBbox
      return {
        lngLat,
        building,
        street: nearestStreet(map, lngLat),
        insideStudyArea: bbox ? isInsideBBox(lngLat, bbox) : false,
        onWater: !footprint && isWaterAt(map, point),
      }
    }

    function describeHover(map: MLMap, point: maplibregl.Point): string | null {
      const layers = visibleInteractiveLayers(map)
      if (!layers.length) return null
      const feats = map.queryRenderedFeatures(point, { layers })
      if (!feats.length) return null
      const { state: s, data: d } = live.current
      const byLayer = (id: string) => feats.find((f) => f.layer.id === id)
      const building = byLayer(LYR.buildings3d) ?? byLayer(LYR.buildingsFlat)
      const compare = byLayer(LYR.compareFill)
      const low = byLayer(LYR.lowFill)
      const extent = byLayer(LYR.extentFill)
      const parts: string[] = []
      if (building) parts.push('Building — click to inspect')
      if (compare && d.pair) {
        const a = compare.properties?.areaM2 as number | undefined
        parts.push(
          `Added between ${formatScenario(d.pair[0])} and ${formatScenario(d.pair[1])}${a ? ` · ${formatSmallArea(a)}` : ''}`,
        )
      } else if (extent && d.extentFeet !== null && !isWaterAt(map, point)) {
        parts.push(`Within mapped ${formatScenario(d.pair ? d.pair[0] : s.scenarioFt)} extent`)
      }
      if (low) parts.push('Low-lying area (not ocean-connected)')
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
  const extentData = data.extent.data
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    if (live.current.reduced) {
      setSourceData(map, SRC.extent, extentData)
      return
    }
    // Brief, restrained fade so a scenario change reads as a change, not a flicker.
    map.setPaintProperty(LYR.extentFill, 'fill-opacity-transition', { duration: 0, delay: 0 })
    map.setPaintProperty(LYR.extentFill, 'fill-opacity', 0.12)
    setSourceData(map, SRC.extent, extentData)
    const raf = requestAnimationFrame(() => {
      map.setPaintProperty(LYR.extentFill, 'fill-opacity-transition', { duration: 450, delay: 0 })
      map.setPaintProperty(LYR.extentFill, 'fill-opacity', data.pair ? opacity.compareBase : opacity.flood)
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, extentData])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    map.setPaintProperty(LYR.extentFill, 'fill-opacity', data.pair ? opacity.compareBase : opacity.flood)
  }, [ready, data.pair])

  const compareData = data.pair ? data.compare.data : null
  useEffect(() => {
    if (ready && mapRef.current) setSourceData(mapRef.current, SRC.compare, compareData)
  }, [ready, compareData])

  const lowData = state.layers.lowLying ? data.lowLying.data : null
  useEffect(() => {
    if (ready && mapRef.current) setSourceData(mapRef.current, SRC.low, lowData)
  }, [ready, lowData])

  const studyData = data.studyArea.data
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    setSourceData(map, SRC.study, studyData)
    setSourceData(map, SRC.mask, studyBbox ? outsideMask(studyBbox) : null)
  }, [ready, studyData, studyBbox])

  // ---------------------------------------------------------------- layer visibility
  const { layers, viewMode } = state
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    for (const id of [LYR.extentFill, LYR.extentLine, LYR.compareFill, LYR.compareLine]) setVisible(map, id, layers.inundation)
    setVisible(map, LYR.lowFill, layers.lowLying)
    setVisible(map, LYR.lowLine, layers.lowLying)
    setVisible(map, LYR.studyLine, layers.studyArea)
    setVisible(map, LYR.mask, layers.studyArea)
    const extruded = layers.buildings && viewMode === '3d'
    setVisible(map, LYR.buildings3d, extruded)
    setVisible(map, LYR.buildingsFlat, !extruded)
    setVisible(map, LYR.buildingsOutline, !extruded)
    setVisible(map, LYR.selectedBuilding3d, extruded)
    setVisible(map, LYR.selectedBuildingLine, !extruded)
    setLabelsVisible(map, layers.labels)
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
    if (reduced) map.jumpTo(INITIAL_CAMERA)
    else map.flyTo({ ...INITIAL_CAMERA, duration: 1400, essential: false })
  }, [ready, resetToken, reduced])

  const inspectToken = state.inspectCenterToken
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || inspectToken === 0) return
    const c = map.getCenter()
    const pt = map.project(c)
    map.fire('click', { point: pt, lngLat: c, originalEvent: new MouseEvent('click') })
  }, [ready, inspectToken])

  // ---------------------------------------------------------------- selection
  const selection = state.selection
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    setSourceData(
      map,
      SRC.selectedPoint,
      selection ? { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: selection.lngLat } } : null,
    )
    const b = selection?.building
    setSourceData(
      map,
      SRC.selectedBuilding,
      b ? { ...b.footprint, properties: { height: b.renderHeightM ?? 0, base: b.renderMinHeightM ?? 0 } } : null,
    )
  }, [ready, selection])

  return (
    <div className="relative h-full w-full bg-canvas" role="region" aria-label="Map">
      {/* maplibre-gl.css forces `position: relative` on the container, so size it explicitly. */}
      <div ref={containerRef} className="h-full w-full" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-64 rounded-md border border-line-strong bg-surface/95 px-2 py-1 text-xs text-fg shadow-panel"
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
        scenarioLabel={data.pair ? `${formatScenario(data.pair[0])} → ${formatScenario(data.pair[1])}` : formatScenario(state.scenarioFt)}
      />
    </div>
  )
}
