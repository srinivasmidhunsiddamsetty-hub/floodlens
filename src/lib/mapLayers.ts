import type { FeatureCollection } from 'geojson'
import type { DataDrivenPropertyValueSpecification, ExpressionSpecification, GeoJSONSource, Map as MLMap } from 'maplibre-gl'
import { GROUND_OVERLAY_BEFORE } from './mapStyle'
import { BAND_COLORS, colors, opacity } from './theme'

export const SRC = {
  flood: 'fl-flood',
  low: 'fl-low',
  study: 'fl-study',
  mask: 'fl-mask',
  selectedPoint: 'fl-selected-point',
  selectedBuilding: 'fl-selected-building',
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

/** `band` (ft) → ramp colour. */
const bandColorExpr = [
  'match',
  ['get', 'band'],
  ...Object.entries(BAND_COLORS).flatMap(([ft, c]) => [Number(ft), c]),
  BAND_COLORS[2],
] as unknown as ExpressionSpecification

/** Opacity for the flood bands, optionally emphasising one band and dimming the others. */
export function bandOpacity(highlight: number | null): DataDrivenPropertyValueSpecification<number> {
  if (highlight === null) return opacity.band
  return ['case', ['==', ['get', 'band'], highlight], 0.95, opacity.bandDimmed]
}

/**
 * Adds every FloodLens source and layer to a loaded style.
 * Flood bands sit beneath basemap water (so they read as "water reaching land"),
 * buildings sit above the overlays, and labels stay on top of everything.
 */
export function addFloodLensLayers(map: MLMap) {
  const ground = before(map, GROUND_OVERLAY_BEFORE)
  const labels = firstSymbolLayer(map)
  const hasBasemap = !!map.getSource(SRC.basemap)

  for (const id of Object.values(SRC)) {
    if (id === SRC.basemap || map.getSource(id)) continue
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
        'fill-color': bandColorExpr,
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
      paint: { 'line-color': bandColorExpr, 'line-width': 0.6, 'line-opacity': 0.9 },
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
    map.addLayer(
      {
        id: LYR.buildingsFlat,
        type: 'fill',
        source: SRC.basemap,
        'source-layer': 'building',
        minzoom: 13,
        paint: { 'fill-color': colors.buildingFlat, 'fill-opacity': 0.75 },
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
          'fill-extrusion-color': ['interpolate', ['linear'], buildingHeight, 0, colors.building, 60, colors.buildingTall],
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.6, buildingHeight],
          'fill-extrusion-base': buildingBase,
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      labels,
    )
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
      'circle-color': 'rgba(232,69,44,0.16)',
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
