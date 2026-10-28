import type { LayerSpecification, StyleSpecification } from 'maplibre-gl'
import { BASEMAP_STYLE_URL } from './constants'
import { colors } from './theme'

/** Layers dropped from the basemap: replaced by FloodLens equivalents or visual noise at city scale. */
const REMOVED_LAYERS = new Set([
  'building', // replaced by height-aware extrusions / footprints
  'label_country_1',
  'label_country_2',
  'label_country_3',
  'label_state',
  'boundary_disputed',
])

/** FloodLens ground overlays are inserted directly beneath basemap water. */
export const GROUND_OVERLAY_BEFORE = 'water'

/** Land-surface fills that must draw *below* water (and therefore below the overlays). */
const LAND_SOURCE_LAYERS = new Set(['landuse', 'landcover', 'park'])

/**
 * OpenFreeMap serves Noto Sans glyphs only. FloodLens self-hosts Roboto glyph
 * ranges (public/fonts, from openmaptiles/fonts v2.0, Apache-2.0) so map labels
 * match the UI typeface.
 */
const FONT_MAP: Record<string, string> = {
  'Noto Sans Regular': 'Roboto Regular',
  'Noto Sans Bold': 'Roboto Medium',
  'Noto Sans Italic': 'Roboto Italic',
}

type Paint = Record<string, unknown>

const PAINT: Record<string, Paint> = {
  background: { 'background-color': colors.land },
  park: { 'fill-color': colors.landPark, 'fill-opacity': 0.9 },
  water: { 'fill-color': colors.water, 'fill-antialias': true },
  landcover_ice_shelf: { 'fill-color': colors.land },
  landcover_glacier: { 'fill-color': colors.land },
  landuse_residential: { 'fill-color': colors.landResidential, 'fill-opacity': 0.8 },
  landcover_wood: { 'fill-color': colors.landWood, 'fill-opacity': 0.6 },
  waterway: { 'line-color': colors.waterLine },
  'aeroway-taxiway': { 'line-color': colors.aeroway },
  'aeroway-runway-casing': { 'line-color': colors.roadCasing },
  'aeroway-area': { 'fill-color': colors.aeroway },
  'aeroway-runway': { 'line-color': colors.roadMajor },
  road_area_pier: { 'fill-color': colors.roadMinor },
  road_pier: { 'line-color': colors.roadMinor },
  highway_path: { 'line-color': colors.path },
  highway_minor: { 'line-color': colors.roadMinor },
  highway_major_casing: { 'line-color': colors.roadCasing },
  highway_major_inner: { 'line-color': colors.roadMajor },
  highway_major_subtle: { 'line-color': colors.roadMajor },
  highway_motorway_casing: { 'line-color': colors.roadMotorwayCasing },
  highway_motorway_inner: { 'line-color': colors.roadMotorway },
  highway_motorway_subtle: { 'line-color': colors.roadMotorway },
  highway_motorway_bridge_casing: { 'line-color': colors.roadMotorwayCasing },
  highway_motorway_bridge_inner: { 'line-color': colors.roadMotorway },
  tunnel_motorway_casing: { 'line-color': colors.roadMotorwayCasing },
  tunnel_motorway_inner: { 'line-color': colors.roadMotorway },
  railway_transit: { 'line-color': colors.rail },
  railway_transit_dashline: { 'line-color': colors.land },
  railway_service: { 'line-color': colors.rail },
  railway_service_dashline: { 'line-color': colors.land },
  railway: { 'line-color': colors.rail },
  railway_dashline: { 'line-color': colors.land },
  boundary_2: { 'line-color': colors.boundary },
  boundary_3: { 'line-color': colors.boundary },
}

const LABEL_PAINT = {
  'text-color': colors.label,
  'text-halo-color': colors.halo,
  'text-halo-width': 1.5,
  'text-halo-blur': 0.5,
}

function remapFonts(layer: LayerSpecification): LayerSpecification {
  const layout = (layer as { layout?: Record<string, unknown> }).layout
  const font = layout?.['text-font']
  if (!Array.isArray(font)) return layer
  const mapped = font.map((f) => (typeof f === 'string' ? (FONT_MAP[f] ?? f) : f))
  // Static glyph hosting cannot composite font stacks — keep a single font.
  return { ...layer, layout: { ...layout, 'text-font': [mapped[0]] } } as LayerSpecification
}

function restyle(layer: LayerSpecification): LayerSpecification {
  const next = { ...remapFonts(layer), paint: { ...(layer as { paint?: Paint }).paint } } as LayerSpecification & { paint: Paint }
  const override = PAINT[layer.id]
  if (override) {
    Object.assign(next.paint, override)
    // A flat fill colour replaces sprite patterns that the style may reference.
    if ('fill-color' in override) delete next.paint['fill-pattern']
  }
  if (layer.type === 'symbol' && next.paint) {
    if (layer.id.includes('water') || layer.id.startsWith('waterway')) {
      Object.assign(next.paint, { ...LABEL_PAINT, 'text-color': colors.labelWater, 'text-halo-color': '#e8f1fa' })
    } else if (layer.id.startsWith('highway-name')) {
      Object.assign(next.paint, { ...LABEL_PAINT, 'text-color': colors.labelMinor })
    } else if (!layer.id.includes('shield')) {
      Object.assign(next.paint, LABEL_PAINT)
    }
  }
  return next
}

const sourceLayer = (l: LayerSpecification) => (l as { 'source-layer'?: string })['source-layer']

/**
 * Turn OpenFreeMap's "positron" style into the FloodLens basemap:
 *  - soft geographic palette (land, parks, water, roads) for a light analysis map,
 *  - water drawn above every land-surface fill, so overlays placed beneath it
 *    only appear on land,
 *  - Roboto labels (self-hosted glyphs), flat buildings and low-value layers removed.
 * Pure function — unit tested — so basemap updates can't silently break layer order.
 */
export function transformBasemapStyle(style: StyleSpecification, glyphsUrl?: string): StyleSpecification {
  const kept = style.layers.filter((l) => !REMOVED_LAYERS.has(l.id)).map(restyle)
  const water = kept.find((l) => l.id === 'water')
  let layers = kept
  if (water) {
    layers = kept.filter((l) => l !== water)
    let lastLand = -1
    layers.forEach((l, i) => {
      if (l.type === 'fill' && LAND_SOURCE_LAYERS.has(sourceLayer(l) ?? '')) lastLand = i
    })
    layers.splice(lastLand + 1, 0, water)
  }
  return { ...style, ...(glyphsUrl ? { glyphs: glyphsUrl } : {}), layers }
}

/** Absolute URL template for the self-hosted Roboto glyphs (works under any deploy sub-path). */
export function roboGlyphsUrl(): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.href).href
  return `${base}fonts/{fontstack}/{range}.pbf`
}

/** Offline / failure fallback: a plain background so NOAA overlays still render. */
export const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': colors.land } }],
}

export async function loadBasemapStyle(signal?: AbortSignal): Promise<StyleSpecification> {
  const res = await fetch(BASEMAP_STYLE_URL, { signal })
  if (!res.ok) throw new Error(`Basemap style request failed (HTTP ${res.status}).`)
  const json = (await res.json()) as StyleSpecification
  if (!json || json.version !== 8 || !Array.isArray(json.layers)) throw new Error('Basemap style is malformed.')
  return transformBasemapStyle(json, roboGlyphsUrl())
}
