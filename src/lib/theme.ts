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
  accent: '#1e3a5f', // navy since v0.50 (#0069b0 before), as --color-accent
  // Bright green (v0.46, the owner's colour), with a deep green outline. Against the Per foot ramp
  // (v0.63) its nearest levels are gold and teal, at OKLab ΔE 20, but gold falls to 5 for
  // deuteranopia, about as close as its nearest colour was before v0.63. Before: vermilion `#e8452c`
  // (v0.42–v0.45, v0.20–v0.37) and charcoal `#1f2937` (v0.38–v0.41).
  selection: '#3ee67e',
  selectionLine: '#15803d',
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
 * Simple mode's buildings (v0.63, the owner's pick): every building the chosen level has reached, in
 * one blue a step deeper than the water, so roofs don't melt into it.
 */
export const SIMPLE_BUILDING_COLOR = '#2563c7'

/**
 * Detailed mode ("Per foot"): the level where water first reaches each area and building.
 * 0 ft is today's high tide, which is simply the sea, so it takes the sea's colour (v0.64, the owner's
 * call; red in v0.63). From +1 ft up, the owner's colours (v0.63): orange, gold, teal, periwinkle,
 * violet, picked after seeing palettes rendered on the real map once buildings carried the colours
 * too. Nothing is near-black, because a building's walls are shaded darker than its roof; the most common levels, +3 and +4 ft (73% of the city's buildings), are the calmest; there's
 * no green, which could read as "safe", and nothing sandy like a plain building. The closest
 * neighbouring pair is +1 and +2 ft at OKLab ΔE 14.4; for colour-blind readers, +3 and +4 ft at 8.4
 * (deuteranopia). +5 ft's violet is close to the low-spot purple (ΔE 6.3); the hatch keeps them apart.
 * v0.41–v0.62: #f0f921 #fca636 #e16462 #b12a90 #6a00a8 #0d0887 (matplotlib's Plasma).
 * v0.40: #f3f351 #f0dd4a #f0b33f #ec9a38 #e77631 #e7612a (the owner's yellow → orange, ΔE 3.9).
 * v0.38–v0.39: #fee391 #fec44f #fe9929 #ec7014 #cc4c02 #8c2d04 (yellow → red-brown, ΔE 7.3 / 6.8).
 * v0.37: #ddf0fb #a9d9f5 #6fb9e8 #3593d2 #1168b2 #083d77 (the owner's blues).
 * v0.35–v0.36: #dceff5 #a6d8ed #6db6db #338ec4 #1766a1 #083b75.
 * v0.34: #80cffd #4ba3f7 #3672e9 #3a45c8 #31248a #1c0b4d.
 * v0.33 and before: #9ec5f4 #67a3ea #3d80d2 #1f5fae #104180 #022555.
 */
export const BAND_COLORS: Record<number, string> = {
  0: colors.water,
  1: '#e07942',
  2: '#e9b44c',
  3: '#36a7a0',
  4: '#898bd4',
  5: '#6451a5',
}

/**
 * Layered colours only (v0.37): a thin, faint white line round each level, so neighbouring
 * levels and the shoreline read apart (the owner's suggestion). With one colour it would draw
 * lines inside the water, so Single colours keep the edge in the fill's colour.
 */
export const BAND_EDGE = { color: '#ffffff', opacity: 0.55, width: 0.6 } as const

export const bandColor = (feet: number, mode: ColorMode = 'detailed') =>
  mode === 'simple' ? SIMPLE_COLOR : (BAND_COLORS[feet] ?? BAND_COLORS[2])

/** A reached building's colour: one blue with Overall colours (v0.63), its level's with Per foot. */
export const buildingColor = (feet: number, mode: ColorMode) => (mode === 'simple' ? SIMPLE_BUILDING_COLOR : BAND_COLORS[feet])

export const opacity = {
  band: 0.85,
  lowLying: 0.75,
  outsideMask: 0.5,
} as const
