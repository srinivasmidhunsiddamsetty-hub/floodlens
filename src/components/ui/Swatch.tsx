import { BAND_COLORS, colors } from '../../lib/theme'

export type SwatchKind = 'flood' | 'lowLying' | 'building' | 'water' | 'land' | 'selection' | 'study' | 'outside' | 'labels'

/** Legend swatch drawn with the exact colours the map uses. */
export function Swatch({ kind, size = 14 }: { kind: SwatchKind; size?: number }) {
  const common = { width: size, height: size, 'aria-hidden': true } as const
  switch (kind) {
    case 'flood':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x="0" y="0" width="14" height="14" rx="3" fill={BAND_COLORS[3]} />
          <path d="M0 5h14v9H0z" fill={BAND_COLORS[2]} />
          <path d="M0 9h14v5H0z" fill={BAND_COLORS[1]} />
          <rect x=".5" y=".5" width="13" height="13" rx="2.5" fill="none" stroke="rgba(0,0,0,.15)" />
        </svg>
      )
    case 'labels':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x=".5" y=".5" width="13" height="13" rx="3" fill={colors.land} stroke="#cfc8bc" />
          <path d="M4 10.5 7 3.5l3 7M5.2 8h3.6" stroke={colors.label} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'lowLying':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <defs>
            <pattern id="sw-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="1.6" height="4" fill={colors.lowLying} />
            </pattern>
          </defs>
          <rect x=".5" y=".5" width="13" height="13" rx="3" fill="url(#sw-hatch)" stroke={colors.lowLying} strokeDasharray="2 1.5" />
        </svg>
      )
    case 'building':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <path d="M2.5 12.5V5.5L7 3l4.5 2.5v7z" fill={colors.building} stroke={colors.buildingOutline} />
          <path d="M7 3v9.5M7 5.5l4.5 0" stroke={colors.buildingTall} />
        </svg>
      )
    case 'water':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x=".5" y=".5" width="13" height="13" rx="3" fill={colors.water} stroke="#7bbcd0" />
        </svg>
      )
    case 'land':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x=".5" y=".5" width="13" height="13" rx="3" fill={colors.land} stroke="#cfc8bc" />
        </svg>
      )
    case 'selection':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <circle cx="7" cy="7" r="5.2" fill="rgba(232,69,44,0.16)" stroke={colors.selection} strokeWidth="1.6" />
          <circle cx="7" cy="7" r="2.2" fill={colors.selectionLine} stroke="#fff" strokeWidth="0.8" />
        </svg>
      )
    case 'study':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke={colors.studyArea} strokeDasharray="3 2" strokeWidth="1.3" />
        </svg>
      )
    case 'outside':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x=".5" y=".5" width="13" height="13" rx="3" fill="#f7f6f3" stroke="#cfcfcf" />
        </svg>
      )
  }
}
