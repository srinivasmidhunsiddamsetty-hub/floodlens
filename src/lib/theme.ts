/**
 * Map + chart colours. Mirrors the CSS tokens in src/styles/index.css so the
 * legend, D3 chart and MapLibre layers always agree.
 *
 * Basemap: a soft "streets / topographic" palette (warm land, sage parks,
 * pale-blue water, white roads) so data overlays carry the strongest colour.
 * Inundation (saturated blue) vs. comparison (orange) is a blue/orange pair
 * that stays distinguishable for common colour-vision deficiencies; the
 * pale-blue water is deliberately much lighter than the inundation fill.
 */
export const colors = {
  // basemap
  land: '#f1eee8',
  landResidential: '#ebe7e0',
  landPark: '#d5e7c6',
  landWood: '#c8dfb6',
  water: '#a9cbe8',
  waterLine: '#a9cbe8',
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
  building: '#e4dfd6',
  buildingTall: '#cfc7ba',
  buildingOutline: '#c6bdb0',

  // data
  flood: '#1f66d1',
  floodLine: '#0f4aa3',
  compare: '#f08c1e',
  compareLine: '#c05f00',
  lowLying: '#6b35aa',
  accent: '#0069b0',
  selection: '#0069b0',
  selectedBuilding: '#2a9df4',
  studyArea: '#3d4655',
  mask: '#ffffff',

  // chart
  chartMuted: '#cdd6e2',
  chartGrid: '#ebebeb',
  chartAxis: '#6a6a6a',
  chartLabel: '#151515',
} as const

export const opacity = {
  flood: 0.62,
  compareBase: 0.5,
  compare: 0.8,
  lowLying: 0.75,
  outsideMask: 0.5,
} as const
