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
 * How the flood is coloured (v0.34). "Simple" (the default) draws all the water at the chosen
 * level in one blue, spreading as the sea rises. "Detailed" gives the area each foot adds its
 * own colour, from the ramp below.
 */
export type ColorMode = 'simple' | 'detailed'

/** Simple mode: one blue for all the water at the chosen level. */
export const SIMPLE_COLOR = '#3d84e6'

/**
 * Detailed mode: the level where water first reaches each area, light → dark as the sea
 * rises (more water, darker), and turning from sky blue through royal blue to indigo so
 * neighbouring levels differ in hue as well as lightness. v0.34 re-picked it because people
 * couldn't tell the v0.17 blues apart: the worst neighbouring pair, drawn at 85% over the
 * land, went from OKLab ΔE 8.6 to 9.3 for colour-blind vision and 8.8 to 10.1 for normal
 * vision. That is about the ceiling for six steps in the hues the basemap leaves free
 * (greens are parks, aqua is water, purple is low spots, red is the selection).
 * v0.33 and before: #9ec5f4 #67a3ea #3d80d2 #1f5fae #104180 #022555.
 */
export const BAND_COLORS: Record<number, string> = {
  0: '#80cffd',
  1: '#4ba3f7',
  2: '#3672e9',
  3: '#3a45c8',
  4: '#31248a',
  5: '#1c0b4d',
}

export const bandColor = (feet: number, mode: ColorMode = 'detailed') =>
  mode === 'simple' ? SIMPLE_COLOR : (BAND_COLORS[feet] ?? BAND_COLORS[2])

export const opacity = {
  band: 0.85,
  bandDimmed: 0.18,
  lowLying: 0.75,
  outsideMask: 0.5,
} as const
