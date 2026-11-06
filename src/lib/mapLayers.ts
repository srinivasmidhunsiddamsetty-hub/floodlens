import type { FeatureCollection } from 'geojson'
import type { DataDrivenPropertyValueSpecification, ExpressionSpecification, GeoJSONSource, Map as MLMap } from 'maplibre-gl'
import { BUILDING_LEVELS_FILE, BUILDINGS_MIN_ZOOM } from './constants'
import { fileUrl } from './manifest'
import { GROUND_OVERLAY_BEFORE } from './mapStyle'
import { BAND_COLORS, BAND_EDGE, colors, opacity, SIMPLE_COLOR, type ColorMode } from './theme'

export const SRC = {
  flood: 'fl-flood',
  low: 'fl-low',
  study: 'fl-study',
  mask: 'fl-mask',
  selectedPoint: 'fl-selected-point',
  selectedBuilding: 'fl-selected-building',
  buildingLevels: 'fl-building-levels',
  basemap: 'openmaptiles',
} as const

export const LYR = {
  floodFill: 'fl-flood-fill',
  floodLine: 'fl-flood-line',
  lowFill: 'fl-low-fill',
  lowLine: 'fl-low-line',
  mask: 'fl-outside-mask',
  studyLine: 'fl-study-line',
  buildings3d: 'fl-buildings-3d',
  buildingsFlat: 'fl-buildings-flat',
  buildingsOutline: 'fl-buildings-outline',
  selectedBuilding3d: 'fl-selected-building-3d',
  selectedBuildingFill: 'fl-selected-building-fill',
  selectedBuildingLine: 'fl-selected-building-line',
  selectedHalo: 'fl-selected-halo',
  selectedCore: 'fl-selected-core',
} as const

/** Layers whose features can be hovered / clicked for inspection. */
export const INTERACTIVE_LAYERS = [LYR.buildings3d, LYR.buildingsFlat, LYR.lowFill, LYR.floodFill] as const

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }

/** The sea levels, lowest first. Each has its own pair of coloured-building layers (v0.62). */
const LEVELS = Object.keys(BAND_COLORS).map(Number)
export const buildingLevel3dId = (feet: number) => `fl-building-level-3d-${feet}`
export const buildingLevelFlatId = (feet: number) => `fl-building-level-flat-${feet}`
/** Roofs of the coloured buildings sit this far above the map's own, and under the selection's (+0.6 m). */
const BUILDING_LEVEL_LIFT_M = 0.3
/** Coloured footprints in 2D: strong enough to read over the plain footprint beneath. */
const BUILDING_LEVEL_FLAT_OPACITY = 0.9
const HATCH = 'fl-hatch'

/** Diagonal hatch for low-lying (hydrologically unconnected) areas — distinguishable without colour. */
function hatchImage(size = 16, ratio = 2) {
  const px = size * ratio
  const data = new Uint8Array(px * px * 4)
  const [r, g, b] = [0x6b, 0x35, 0xaa]
  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      const on = (x + y) % (px / 2) < ratio * 2.2
      const i = (y * px + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = on ? 220 : 26
    }
  }
  return { width: px, height: px, data, pixelRatio: ratio }
}

const has = (map: MLMap, id: string) => !!map.getLayer(id)
const before = (map: MLMap, id: string) => (has(map, id) ? id : undefined)
/** First basemap label layer — buildings and the study mask go beneath it. */
const firstSymbolLayer = (map: MLMap) => map.getStyle().layers?.find((l) => l.type === 'symbol')?.id

const buildingHeight: ExpressionSpecification = ['coalesce', ['get', 'render_height'], 0]
const buildingBase: ExpressionSpecification = ['coalesce', ['get', 'render_min_height'], 0]

/** `band` (ft) → ramp colour in Detailed mode; one blue for every band in Simple mode. */
export function bandColorExpr(mode: ColorMode): DataDrivenPropertyValueSpecification<string> {
  if (mode === 'simple') return SIMPLE_COLOR
  return [
    'match',
    ['get', 'band'],
    ...Object.entries(BAND_COLORS).flatMap(([ft, c]) => [Number(ft), c]),
    BAND_COLORS[2],
  ] as unknown as ExpressionSpecification
}

/** The edge round each flood band: a faint white line with Layered colours, the fill's colour otherwise (v0.37). */
export function bandEdgePaint(mode: ColorMode) {
  return mode === 'simple'
    ? { color: bandColorExpr(mode), opacity: 0.9 }
    : { color: BAND_EDGE.color as DataDrivenPropertyValueSpecification<string>, opacity: BAND_EDGE.opacity }
}

/**
 * Colours the buildings that the chosen sea level reaches (v0.62). A building that level doesn't reach
 * yet keeps the map's plain colour; its coloured copy waits at opacity 0. Each level has its own
 * layers, so moving the slider only changes a layer's opacity: the map doesn't re-read any data, and
 * the colours fade in at once.
 */
export function setBuildingLevel(map: Pick<MLMap, 'getLayer' | 'setPaintProperty'>, level: number) {
  for (const feet of LEVELS) {
    const on = feet <= level
    if (map.getLayer(buildingLevel3dId(feet))) map.setPaintProperty(buildingLevel3dId(feet), 'fill-extrusion-opacity', on ? 1 : 0)
    if (map.getLayer(buildingLevelFlatId(feet))) map.setPaintProperty(buildingLevelFlatId(feet), 'fill-opacity', on ? BUILDING_LEVEL_FLAT_OPACITY : 0)
  }
}

/** Show the coloured buildings' 3D or flat layers, with the map's own buildings of the same kind. */
export function setBuildingLevelsVisible(map: MLMap, view: { extruded: boolean; flat: boolean }) {
  for (const feet of LEVELS) {
    setVisible(map, buildingLevel3dId(feet), view.extruded)
    setVisible(map, buildingLevelFlatId(feet), view.flat)
  }
}

/** Recolour the flood bands when the colour mode changes. */
export function setBandColors(map: MLMap, mode: ColorMode) {
  if (!map.getLayer(LYR.floodFill)) return
  const edge = bandEdgePaint(mode)
  map.setPaintProperty(LYR.floodFill, 'fill-color', bandColorExpr(mode))
  map.setPaintProperty(LYR.floodLine, 'line-color', edge.color)
  map.setPaintProperty(LYR.floodLine, 'line-opacity', edge.opacity)
}

/**
 * Adds every FloodLens source and layer to a loaded style.
 * Flood bands sit beneath basemap water (so they read as "water reaching land"),
 * buildings sit above the overlays, and labels stay on top of everything.
 */
export function addFloodLensLayers(map: MLMap, mode: ColorMode, options: { reducedMotion?: boolean } = {}) {
  const ground = before(map, GROUND_OVERLAY_BEFORE)
  const labels = firstSymbolLayer(map)
  const hasBasemap = !!map.getSource(SRC.basemap)

  for (const id of Object.values(SRC)) {
    if (id === SRC.basemap || id === SRC.buildingLevels || map.getSource(id)) continue
    map.addSource(id, { type: 'geojson', data: EMPTY, generateId: id !== SRC.selectedBuilding })
  }
  if (!map.hasImage(HATCH)) map.addImage(HATCH, hatchImage())

  // --- flood bands + low-lying areas (below water) ------------------------------------
  map.addLayer(
    {
      id: LYR.floodFill,
      type: 'fill',
      source: SRC.flood,
      paint: {
        'fill-color': bandColorExpr(mode),
        'fill-opacity': opacity.band,
        'fill-opacity-transition': { duration: 300, delay: 0 },
      },
    },
    ground,
  )
  map.addLayer(
    {
      id: LYR.floodLine,
      type: 'line',
      source: SRC.flood,
      minzoom: 14,
      paint: { 'line-color': bandEdgePaint(mode).color, 'line-width': BAND_EDGE.width, 'line-opacity': bandEdgePaint(mode).opacity },
    },
    ground,
  )
  map.addLayer(
    { id: LYR.lowFill, type: 'fill', source: SRC.low, paint: { 'fill-pattern': HATCH, 'fill-opacity': opacity.lowLying } },
    ground,
  )
  map.addLayer(
    {
      id: LYR.lowLine,
      type: 'line',
      source: SRC.low,
      paint: { 'line-color': colors.lowLying, 'line-width': 1, 'line-dasharray': [2, 1.5], 'line-opacity': 0.9 },
    },
    ground,
  )

  // --- outside-study-area wash + boundary (above roads, below buildings & labels) --------
  map.addLayer(
    { id: LYR.mask, type: 'fill', source: SRC.mask, paint: { 'fill-color': colors.mask, 'fill-opacity': opacity.outsideMask } },
    labels,
  )
  map.addLayer(
    {
      id: LYR.studyLine,
      type: 'line',
      source: SRC.study,
      paint: { 'line-color': colors.studyArea, 'line-width': 1.6, 'line-dasharray': [3, 2], 'line-opacity': 0.85 },
    },
    labels,
  )

  // --- buildings (OpenMapTiles render_height from OpenStreetMap) -------------------------
  if (hasBasemap) {
    // The level that first reaches each building, from scripts/prepare_buildings.ts. Loaded and read
    // off the main thread; no simplification, so a coloured footprint never cuts inside the plain one.
    map.addSource(SRC.buildingLevels, {
      type: 'geojson',
      data: new URL(fileUrl(BUILDING_LEVELS_FILE), window.location.href).href,
      tolerance: 0,
    })
    const fade = { duration: options.reducedMotion ? 0 : 300, delay: 0 }
    map.addLayer(
      {
        id: LYR.buildingsFlat,
        type: 'fill',
        source: SRC.basemap,
        'source-layer': 'building',
        minzoom: BUILDINGS_MIN_ZOOM,
        paint: { 'fill-color': colors.buildingFlat, 'fill-opacity': 0.75 },
      },
      labels,
    )
    for (const feet of LEVELS) {
      map.addLayer(
        {
          id: buildingLevelFlatId(feet),
          type: 'fill',
          source: SRC.buildingLevels,
          minzoom: BUILDINGS_MIN_ZOOM,
          filter: ['==', ['get', 'r'], feet],
          paint: { 'fill-color': BAND_COLORS[feet], 'fill-opacity': 0, 'fill-opacity-transition': fade },
        },
        labels,
      )
    }
    map.addLayer(
      {
        id: LYR.buildingsOutline,
        type: 'line',
        source: SRC.basemap,
        'source-layer': 'building',
        minzoom: 14,
        paint: { 'line-color': colors.buildingOutline, 'line-width': 0.7, 'line-opacity': 0.9 },
      },
      labels,
    )
    map.addLayer(
      {
        id: LYR.buildings3d,
        type: 'fill-extrusion',
        source: SRC.basemap,
        'source-layer': 'building',
        minzoom: BUILDINGS_MIN_ZOOM,
        filter: ['!=', ['get', 'hide_3d'], true],
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], buildingHeight, 0, colors.building, 60, colors.buildingTall],
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.6, buildingHeight],
          'fill-extrusion-base': buildingBase,
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      labels,
    )
    // A copy of each reached building, a touch larger and taller, in its level's colour (v0.62). The
    // map's own building stays underneath: it's the one you click, and it's what shows until the
    // slider reaches this level, so buildings outside the data simply stay as they are.
    for (const feet of LEVELS) {
      map.addLayer(
        {
          id: buildingLevel3dId(feet),
          type: 'fill-extrusion',
          source: SRC.buildingLevels,
          minzoom: BUILDINGS_MIN_ZOOM,
          filter: ['all', ['==', ['get', 'r'], feet], ['!=', ['get', 'x'], 1]],
          paint: {
            'fill-extrusion-color': BAND_COLORS[feet],
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.6, ['+', ['get', 'h'], BUILDING_LEVEL_LIFT_M]],
            'fill-extrusion-base': ['get', 'b'],
            'fill-extrusion-opacity': 0,
            'fill-extrusion-opacity-transition': fade,
            'fill-extrusion-vertical-gradient': true,
          },
        },
        labels,
      )
    }
  }

  // --- selection (drawn slightly larger than the building so faces never coincide) -------
  map.addLayer({
    id: LYR.selectedBuilding3d,
    type: 'fill-extrusion',
    source: SRC.selectedBuilding,
    paint: {
      'fill-extrusion-color': colors.selection,
      'fill-extrusion-height': ['+', ['coalesce', ['get', 'height'], 0], 0.6],
      'fill-extrusion-base': ['coalesce', ['get', 'base'], 0],
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': true,
    },
  })
  map.addLayer({
    id: LYR.selectedBuildingFill,
    type: 'fill',
    source: SRC.selectedBuilding,
    paint: { 'fill-color': colors.selection, 'fill-opacity': 0.85 },
  })
  map.addLayer({
    id: LYR.selectedBuildingLine,
    type: 'line',
    source: SRC.selectedBuilding,
    paint: { 'line-color': colors.selectionLine, 'line-width': 2 },
  })
  map.addLayer({
    id: LYR.selectedHalo,
    type: 'circle',
    source: SRC.selectedPoint,
    paint: {
      'circle-radius': 12,
      // A faint wash of the selection colour (v0.46; it stayed vermilion through v0.38–v0.41 by mistake).
      'circle-color': 'rgba(62,230,126,0.16)',
      'circle-stroke-color': colors.selection,
      'circle-stroke-width': 3,
      'circle-pitch-alignment': 'map',
    },
  })
  map.addLayer({
    id: LYR.selectedCore,
    type: 'circle',
    source: SRC.selectedPoint,
    paint: {
      'circle-radius': 4.5,
      'circle-color': colors.selectionLine,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-pitch-alignment': 'map',
    },
  })
}

export function setSourceData(map: MLMap, id: string, data: FeatureCollection | GeoJSON.Feature | null) {
  const src = map.getSource(id) as GeoJSONSource | undefined
  src?.setData(data ?? EMPTY)
}

export function setVisible(map: MLMap, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) return
  const v = visible ? 'visible' : 'none'
  if (map.getLayoutProperty(layerId, 'visibility') !== v) map.setLayoutProperty(layerId, 'visibility', v)
}

/** Toggle every basemap label layer (symbol layers that FloodLens did not add). */
export function setLabelsVisible(map: MLMap, visible: boolean) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'symbol' && !layer.id.startsWith('fl-')) setVisible(map, layer.id, visible)
  }
}
