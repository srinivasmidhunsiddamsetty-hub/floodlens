import type { StyleSpecification } from 'maplibre-gl'
import { describe, expect, it } from 'vitest'
import { GROUND_OVERLAY_BEFORE, transformBasemapStyle } from './mapStyle'
import { colors } from './theme'

// Mirrors the layer order of OpenFreeMap "positron": water sits between land fills.
const style = {
  version: 8,
  sources: {},
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#000' } },
    { id: 'park', type: 'fill', source: 'x', 'source-layer': 'park', paint: { 'fill-color': '#222' } },
    { id: 'water', type: 'fill', source: 'x', 'source-layer': 'water', paint: { 'fill-color': '#111' } },
    { id: 'landuse_residential', type: 'fill', source: 'x', 'source-layer': 'landuse', paint: {} },
    { id: 'landcover_wood', type: 'fill', source: 'x', 'source-layer': 'landcover', paint: { 'fill-pattern': 'wood-pattern' } },
    { id: 'waterway', type: 'line', source: 'x', 'source-layer': 'waterway', paint: {} },
    { id: 'building', type: 'fill', source: 'x', 'source-layer': 'building', paint: {} },
    { id: 'label_country_1', type: 'symbol', source: 'x', 'source-layer': 'place' },
    {
      id: 'label_city',
      type: 'symbol',
      source: 'x',
      'source-layer': 'place',
      layout: { 'text-font': ['Noto Sans Bold', 'Noto Sans Regular'] },
      paint: { 'text-color': '#666' },
    },
  ],
} as unknown as StyleSpecification

describe('transformBasemapStyle', () => {
  const out = transformBasemapStyle(style, 'https://app.test/fonts/{fontstack}/{range}.pbf')
  const ids = out.layers.map((l) => l.id)

  it('draws water above every land-surface fill so ground overlays only show on land', () => {
    expect(ids.indexOf('water')).toBeGreaterThan(ids.indexOf('park'))
    expect(ids.indexOf('water')).toBeGreaterThan(ids.indexOf('landuse_residential'))
    expect(ids.indexOf('water')).toBeGreaterThan(ids.indexOf('landcover_wood'))
    expect(ids.indexOf('water')).toBeLessThan(ids.indexOf('waterway'))
    expect(GROUND_OVERLAY_BEFORE).toBe('water')
  })

  it('removes flat buildings and country-scale clutter', () => {
    expect(ids).not.toContain('building')
    expect(ids).not.toContain('label_country_1')
  })

  it('applies the geographic palette and drops sprite patterns', () => {
    const paint = (id: string) => (out.layers.find((l) => l.id === id) as { paint: Record<string, unknown> }).paint
    expect(paint('water')['fill-color']).toBe(colors.water)
    expect(paint('park')['fill-color']).toBe(colors.landPark)
    expect(paint('landcover_wood')['fill-pattern']).toBeUndefined()
    expect(paint('label_city')['text-halo-color']).toBe('#ffffff')
  })

  it('renders labels in self-hosted Roboto glyphs', () => {
    expect(out.glyphs).toBe('https://app.test/fonts/{fontstack}/{range}.pbf')
    const city = out.layers.find((l) => l.id === 'label_city') as { layout: Record<string, unknown> }
    expect(city.layout['text-font']).toEqual(['Roboto Medium'])
  })

  it('does not mutate the input style', () => {
    expect(style.layers.map((l) => l.id)).toContain('building')
    expect((style.layers[4] as { paint: Record<string, unknown> }).paint['fill-pattern']).toBe('wood-pattern')
    expect(style.glyphs).toMatch(/openfreemap/)
  })
})
