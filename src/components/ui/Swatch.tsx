import { colors, opacity } from '../../lib/theme'

export type SwatchKind = 'flood' | 'compare' | 'lowLying' | 'building' | 'water' | 'land' | 'selection' | 'study' | 'outside'

/** Legend swatch drawn with the exact colours the map uses. */
export function Swatch({ kind, size = 14 }: { kind: SwatchKind; size?: number }) {
  const common = { width: size, height: size, 'aria-hidden': true } as const
  switch (kind) {
    case 'flood':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x=".5" y=".5" width="13" height="13" rx="3" fill={colors.flood} fillOpacity={opacity.flood + 0.15} stroke={colors.floodLine} />
        </svg>
      )
    case 'compare':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x=".5" y=".5" width="13" height="13" rx="3" fill={colors.compare} fillOpacity={opacity.compare} stroke={colors.compareLine} />
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
          <path d="M3 12V5l4-2.5L11 5v7z" fill={colors.buildingTall} stroke={colors.buildingOutline} />
          <path d="M7 2.5V12" stroke={colors.buildingOutline} />
        </svg>
      )
    case 'water':
      return (
        <svg {...common} viewBox="0 0 14 14">
          <rect x=".5" y=".5" width="13" height="13" rx="3" fill={colors.water} stroke="#86acd0" />
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
          <circle cx="7" cy="7" r="5.2" fill="rgba(0,105,176,0.12)" stroke={colors.accent} strokeWidth="1.6" />
          <circle cx="7" cy="7" r="2.2" fill={colors.selection} stroke="#fff" strokeWidth="0.8" />
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
