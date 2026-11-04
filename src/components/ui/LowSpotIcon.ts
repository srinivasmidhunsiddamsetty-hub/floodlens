import { createLucideIcon } from 'lucide-react'

/**
 * Low spot (v0.38): a hollow in the ground holding water, drawn in Lucide's style since Lucide has
 * no such icon. Water drops (v0.37) and an arrow down to a line (v0.34–v0.36, which read as
 * "download") didn't say "a dip below the water line".
 */
export const LowSpot = createLucideIcon('low-spot', [
  ['path', { d: 'M2 8h4.5l2.5 8h6l2.5-8H22', key: 'ground' }],
  ['path', { d: 'M9.5 12h5', key: 'water' }],
])
