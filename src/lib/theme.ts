/**
 * Map + chart colours. Mirrors the CSS tokens in src/styles/index.css so the
 * legend, D3 chart and MapLibre layers always agree.
 *
 * Basemap: a soft "streets / topographic" palette (warm land, sage parks,
 * fresh light-aqua water, white roads) so data overlays carry the strongest colour.
 */
export const colors = {
  // basemap
  land: '#f1eee8',
  landResidential: '#ebe7e0',
  landPark: '#d5e7c6',
  landWood: '#c8dfb6',
  // Light aqua: livelier than grey-blue, and greener in hue than the azure flood ramp.
  water: '#a8dcea',
  waterLine: '#a8dcea',
  roadMinor: '#ffffff',
  roadMajor: '#ffffff',
  roadCasing: '#d8d1c5',
  roadMotorway: '#fbe2a0',
  roadMotorwayCasing: '#ddb767',
  path: '#e3ddd3',
  rail: '#c2bbb0',
  boundary: '#b5aac4',
  aeroway: '#e4e0d8',
  label: '#333333',
  labelMinor: '#555555',
  labelWater: '#1d5f7a',
  halo: '#ffffff',
  // Warm sandstone buildings (a nod to Miami Beach's Art Deco stucco): the
  // complementary hue to the blue flood ramp, so they stay legible on every band.
  building: '#f0e6d6',
  buildingTall: '#e3d3bb',
  buildingOutline: '#c2a985',
  buildingFlat: '#eadcc6',

  // data
  lowLying: '#6b35aa',
  accent: '#0069b0',
  // Vermilion (v0.20): the colour farthest from everything else on the map (worst-case
  // OKLab ΔE 21 against water, every flood band, buildings, parks and low spots, for
  // normal and colour-blind vision). Orange, before, was 18.
  selection: '#e8452c',
  selectionLine: '#9e2410',
  studyArea: '#3d4655',
  mask: '#ffffff',

  // chart
  chartGrid: '#ebebeb',
  chartAxis: '#6a6a6a',
  chartLabel: '#151515',
} as const

/**
 * How the flood is coloured (v0.34). 'simple' (the default) draws all the water at the chosen
 * level in one blue, spreading as the sea rises. 'detailed' gives the area each foot adds its
 * own colour, from the ramp below. On screen they're "Single" and "Layered" (v0.35).
 */
export type ColorMode = 'simple' | 'detailed'

/** Simple mode: one blue for all the water at the chosen level. */
export const SIMPLE_COLOR = '#3d84e6'

/**
 * Detailed mode: the level where water first reaches each area, light → dark as the sea
 * rises (more water, darker). +1 ft to +5 ft are the owner's colours (v0.35). Drawn at 85%
 * over the land, the closest neighbouring pair is OKLab ΔE 10.0 for normal vision and 9.1 for
 * colour-blind vision (v0.34's ramp: 10.1 and 9.3). +1 ft is close to the basemap's water
 * colour (ΔE 1). Today is a lighter tint of the same blue.
 * v0.34: #80cffd #4ba3f7 #3672e9 #3a45c8 #31248a #1c0b4d.
 * v0.33 and before: #9ec5f4 #67a3ea #3d80d2 #1f5fae #104180 #022555.
 */
export const BAND_COLORS: Record<number, string> = {
  0: '#dceff5',
  1: '#a6d8ed',
  2: '#6db6db',
  3: '#338ec4',
  4: '#1766a1',
  5: '#083b75',
}

export const bandColor = (feet: number, mode: ColorMode = 'detailed') =>
  mode === 'simple' ? SIMPLE_COLOR : (BAND_COLORS[feet] ?? BAND_COLORS[2])

export const opacity = {
  band: 0.85,
  bandDimmed: 0.18,
  lowLying: 0.75,
  outsideMask: 0.5,
} as const
