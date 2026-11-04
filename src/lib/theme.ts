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
  // Charcoal (v0.38): the warm Individual ramp runs through vermilion, so the selection moved
  // to the one colour far from everything (worst-case OKLab ΔE 19 against every flood band in
  // both modes, water, buildings, parks, low spots and land, for normal and colour-blind
  // vision). Vermilion `#e8452c` (v0.20–v0.37) would have scored 0 for deuteranopia.
  selection: '#1f2937',
  selectionLine: '#000000',
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
 * Detailed mode ("By level"): the level where water first reaches each area, light → dark as the
 * sea rises (more water, darker). v0.41: matplotlib's Plasma, six steps, yellow → orange → coral
 * → magenta → purple → indigo. The owner wanted a different colour for each level that's easy to
 * tell apart on the map without looking improvised; Plasma is a standard, perceptually even
 * science palette. Drawn at 85% over the land, the closest neighbouring pair is OKLab ΔE 15.1 for
 * normal vision (6.2 for protanopia, 9.0 for deuteranopia), and every band is far from the water,
 * parks and buildings (ΔE 15+). +4 ft's purple is close to the low-spot hatch colour; the hatch
 * pattern keeps low spots apart.
 * v0.40: #f3f351 #f0dd4a #f0b33f #ec9a38 #e77631 #e7612a (the owner's yellow → orange, ΔE 3.9).
 * v0.38–v0.39: #fee391 #fec44f #fe9929 #ec7014 #cc4c02 #8c2d04 (yellow → red-brown, ΔE 7.3 / 6.8).
 * v0.37: #ddf0fb #a9d9f5 #6fb9e8 #3593d2 #1168b2 #083d77 (the owner's blues).
 * v0.35–v0.36: #dceff5 #a6d8ed #6db6db #338ec4 #1766a1 #083b75.
 * v0.34: #80cffd #4ba3f7 #3672e9 #3a45c8 #31248a #1c0b4d.
 * v0.33 and before: #9ec5f4 #67a3ea #3d80d2 #1f5fae #104180 #022555.
 */
export const BAND_COLORS: Record<number, string> = {
  0: '#f0f921',
  1: '#fca636',
  2: '#e16462',
  3: '#b12a90',
  4: '#6a00a8',
  5: '#0d0887',
}

/**
 * Layered colours only (v0.37): a thin, faint white line round each level, so neighbouring
 * levels and the shoreline read apart (the owner's suggestion). With one colour it would draw
 * lines inside the water, so Single colours keep the edge in the fill's colour.
 */
export const BAND_EDGE = { color: '#ffffff', opacity: 0.55, width: 0.6 } as const

export const bandColor = (feet: number, mode: ColorMode = 'detailed') =>
  mode === 'simple' ? SIMPLE_COLOR : (BAND_COLORS[feet] ?? BAND_COLORS[2])

export const opacity = {
  band: 0.85,
  lowLying: 0.75,
  outsideMask: 0.5,
} as const
