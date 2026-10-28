import type { FeatureCollection } from 'geojson'
import type { ExpressionSpecification, GeoJSONSource, Map as MLMap } from 'maplibre-gl'
import { GROUND_OVERLAY_BEFORE } from './mapStyle'
import { colors, opacity } from './theme'

export const SRC = {
  extent: 'fl-extent',
  compare: 'fl-compare',
  low: 'fl-low',
  study: 'fl-study',
  mask: 'fl-mask',
  selectedPoint: 'fl-selected-point',
  selectedBuilding: 'fl-selected-building',
  basemap: 'openmaptiles',
} as const

export const LYR = {
  extentFill: 'fl-extent-fill',
  extentLine: 'fl-extent-line',
  compareFill: 'fl-compare-fill',
  compareLine: 'fl-compare-line',
  lowFill: 'fl-low-fill',
  lowLine: 'fl-low-line',
  mask: 'fl-outside-mask',
  studyLine: 'fl-study-line',
  buildings3d: 'fl-buildings-3d',
  buildingsFlat: 'fl-buildings-flat',
  buildingsOutline: 'fl-buildings-outline',
  selectedBuilding3d: 'fl-selected-building-3d',
  selectedBuildingLine: 'fl-selected-building-line',
  selectedHalo: 'fl-selected-halo',
  selectedCore: 'fl-selected-core',
} as const

/** Layers whose features can be hovered / clicked for inspection. */
export const INTERACTIVE_LAYERS = [
  LYR.buildings3d,
  LYR.buildingsFlat,
  LYR.compareFill,
  LYR.lowFill,
  LYR.extentFill,
] as const

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const HATCH = 'fl-hatch'

/** Diagonal hatch for low-lying (hydrologically unconnected) areas — distinguishable without colour. */
function hatchImage(size = 16, ratio = 2) {
  const px = size * ratio
  const data = new Uint8Array(px * px * 4)
  const [r, g, b] = [0x6b, 0x35, 0xaa]
  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      const d = (x + y) % (px / 2)
      const on = d < ratio * 2.2
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

/**
 * Adds every FloodLens source and layer to a loaded style.
 * Ground overlays sit beneath basemap water (so they read as "water reaching land"),
 * buildings sit above the overlays, and labels stay on top of everything.
 */
export function addFloodLensLayers(map: MLMap) {
  const ground = before(map, GROUND_OVERLAY_BEFORE)
  const labels = firstSymbolLayer(map)
  const hasBasemap = !!map.getSource(SRC.basemap)

  for (const id of [SRC.extent, SRC.compare, SRC.low, SRC.study, SRC.mask, SRC.selectedPoint, SRC.selectedBuilding]) {
    if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: EMPTY, generateId: id !== SRC.selectedBuilding })
  }
  if (!map.hasImage(HATCH)) map.addImage(HATCH, hatchImage())

  // --- ground overlays (below water) -------------------------------------------------
  map.addLayer(
    {
      id: LYR.extentFill,
      type: 'fill',
      source: SRC.extent,
      paint: {
        'fill-color': colors.flood,
        'fill-opacity': opacity.flood,
        'fill-opacity-transition': { duration: 350, delay: 0 },
        'fill-color-transition': { duration: 350, delay: 0 },
      },
    },
    ground,
  )
  map.addLayer(
    {
      id: LYR.extentLine,
      type: 'line',
      source: SRC.extent,
      paint: {
        'line-color': colors.floodLine,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 16, 1.1],
        'line-opacity': 0.55,
      },
    },
    ground,
  )
  map.addLayer(
    {
      id: LYR.compareFill,
      type: 'fill',
      source: SRC.compare,
      paint: { 'fill-color': colors.compare, 'fill-opacity': opacity.compare },
    },
    ground,
  )
  map.addLayer(
    {
      id: LYR.compareLine,
      type: 'line',
      source: SRC.compare,
      paint: {
        'line-color': colors.compareLine,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.3, 16, 1],
        'line-opacity': 0.8,
      },
    },
    ground,
  )
  map.addLayer(
    {
      id: LYR.lowFill,
      type: 'fill',
      source: SRC.low,
      paint: { 'fill-pattern': HATCH, 'fill-opacity': opacity.lowLying },
    },
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

  // --- outside-study-area mask + outline (above roads, below buildings & labels) --------
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
    map.addLayer(
      {
        id: LYR.buildingsFlat,
        type: 'fill',
        source: SRC.basemap,
        'source-layer': 'building',
        minzoom: 13,
        paint: { 'fill-color': colors.building, 'fill-opacity': 0.6 },
      },
      labels,
    )
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
        minzoom: 13,
        filter: ['!=', ['get', 'hide_3d'], true],
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            buildingHeight,
            0,
            colors.building,
            80,
            colors.buildingTall,
          ],
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.6, buildingHeight],
          'fill-extrusion-base': buildingBase,
          'fill-extrusion-opacity': 0.9,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      labels,
    )
  }

  // --- selection --------------------------------------------------------------------------
  map.addLayer({
    id: LYR.selectedBuilding3d,
    type: 'fill-extrusion',
    source: SRC.selectedBuilding,
    paint: {
      'fill-extrusion-color': colors.selectedBuilding,
      'fill-extrusion-height': ['+', ['coalesce', ['get', 'height'], 0], 0.4],
      'fill-extrusion-base': ['coalesce', ['get', 'base'], 0],
      'fill-extrusion-opacity': 0.85,
    },
  })
  map.addLayer({
    id: LYR.selectedBuildingLine,
    type: 'line',
    source: SRC.selectedBuilding,
    paint: { 'line-color': colors.accent, 'line-width': 2.5 },
  })
  map.addLayer({
    id: LYR.selectedHalo,
    type: 'circle',
    source: SRC.selectedPoint,
    paint: {
      'circle-radius': 11,
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-color': colors.accent,
      'circle-stroke-width': 3,
      'circle-pitch-alignment': 'map',
    },
  })
  map.addLayer({
    id: LYR.selectedCore,
    type: 'circle',
    source: SRC.selectedPoint,
    paint: {
      'circle-radius': 4,
      'circle-color': colors.selection,
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
