/**
 * Map + chart colours. Mirrors the CSS tokens in src/styles/index.css so the
 * legend, D3 chart and MapLibre layers always agree.
 *
 * Basemap: a soft "streets / topographic" palette (warm land, sage parks,
 * pale grey-blue water, white roads) so data overlays carry the strongest colour.
 */
export const colors = {
  // basemap
  land: '#f1eee8',
  landResidential: '#ebe7e0',
  landPark: '#d5e7c6',
  landWood: '#c8dfb6',
  water: '#b3cde3',
  waterLine: '#b3cde3',
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
  labelWater: '#2f5d8f',
  halo: '#ffffff',
  // Warm taupe buildings: clearly darker than land and a different hue from water.
  building: '#b4ada3',
  buildingTall: '#8f877c',
  buildingOutline: '#8a8277',
  buildingFlat: '#c3bcb2',

  // data
  lowLying: '#6b35aa',
  accent: '#0069b0',
  selection: '#ff8a1f',
  selectionLine: '#b85a00',
  studyArea: '#3d4655',
  mask: '#ffffff',

  // chart
  chartGrid: '#ebebeb',
  chartAxis: '#6a6a6a',
  chartLabel: '#151515',
} as const

/**
 * Sequential ramp for "where water first reaches" at each NOAA water level.
 * Darkest = reached at the lowest level (most exposed, and deepest at any higher
 * level); lighter = reached only at higher levels. Lightness carries the order,
 * so the ramp also works in greyscale and for colour-vision deficiencies; the
 * hue drifts navy → aqua so even the lightest band stays distinct from the
 * pale grey-blue basemap water.
 */
export const BAND_COLORS: Record<number, string> = {
  0: '#14307a',
  1: '#1f5fd0',
  2: '#3a97e8',
  3: '#4cc9d6',
}

export const bandColor = (feet: number) => BAND_COLORS[feet] ?? '#3a97e8'

export const opacity = {
  band: 0.85,
  bandDimmed: 0.18,
  lowLying: 0.75,
  outsideMask: 0.5,
} as const
