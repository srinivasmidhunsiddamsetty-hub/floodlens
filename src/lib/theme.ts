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
  selection: '#ff7417',
  selectionLine: '#b34700',
  studyArea: '#3d4655',
  mask: '#ffffff',

  // chart
  chartGrid: '#ebebeb',
  chartAxis: '#6a6a6a',
  chartLabel: '#151515',
} as const

/**
 * Sequential ramp for "where water first reaches" at each NOAA water level:
 * one blue hue, light → dark as the water level rises (more water, darker blue).
 * Evenly spaced steps (200 / 350 / 500 / 650) of a validated sequential blue
 * scale, so lightness alone carries the order: it survives greyscale printing
 * and colour-vision deficiencies. (v0.6 tried a viridis-style ramp; the blues
 * read better as water and were restored in v0.7.)
 */
export const BAND_COLORS: Record<number, string> = {
  0: '#9ec5f4',
  1: '#5598e7',
  2: '#256abf',
  3: '#104281',
}

export const bandColor = (feet: number) => BAND_COLORS[feet] ?? BAND_COLORS[2]

export const opacity = {
  band: 0.85,
  bandDimmed: 0.18,
  lowLying: 0.75,
  outsideMask: 0.5,
} as const
