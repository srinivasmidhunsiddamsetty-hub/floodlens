interface Props {
  /** What was selected: a building gets a house, a bare location a pin, water just waves. */
  kind: 'building' | 'location' | 'water'
  /** Water level label on the gauge, e.g. "+3 ft" or "Today". */
  levelLabel: string
  /** Whether the water reaches the selection at that level (water above the ground line). */
  reached: boolean
  className?: string
}

const W = 300
const H = 112
const GROUND_Y = 96
const WATER_REACHED_Y = 80
const WATER_DRY_Y = 104
const WATER_ONLY_Y = 66

/** A gentle swell across the full width, starting at x0 with the given wavelength. */
const wave = (y: number, x0: number, len: number, amp: number) => {
  let d = `M${x0} ${y}`
  for (let x = x0; x < W + len; x += len) d += ` q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`
  return `${d} V ${H} H ${x0} Z`
}

/**
 * Decorative scene for the selected-place card: the place, and the water level at
 * which NOAA's mapped extent first reaches it. Hidden from assistive technology —
 * the card states the same thing in text.
 */
export function FloodIllustration({ kind, levelLabel, reached, className }: Props) {
  const waterY = kind === 'water' ? WATER_ONLY_Y : reached ? WATER_REACHED_Y : WATER_DRY_Y
  const badgeW = Math.max(36, levelLabel.length * 6.8 + 16)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="fi-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f9be9" stopOpacity="0.82" />
          <stop offset="1" stopColor="#2a74cf" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="fi-water-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a7d0f7" stopOpacity="0.85" />
          <stop offset="1" stopColor="#74b2ef" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* backdrop: cloud, trees, ground */}
      <g fill="#d9e9fa">
        <ellipse cx="270" cy="16" rx="20" ry="7" />
        <ellipse cx="255" cy="19" rx="12" ry="6" />
        <circle cx="168" cy="80" r="13" />
        <circle cx="182" cy="86" r="9" />
        <circle cx="282" cy="80" r="12" />
      </g>
      <rect x="0" y={GROUND_Y} width={W} height={H - GROUND_Y} fill="#e6edf5" />

      {kind === 'building' && (
        <g transform="translate(216 96) scale(1.18) translate(-224 -96)">
          <rect x="236" y="28" width="9" height="18" fill="#6f84a3" />
          <path d="M196 54 L224 28 L252 54 Z" fill="#8094b2" />
          <path d="M191 56 L224 26 L257 56" fill="none" stroke="#5c7193" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="198" y="54" width="52" height={GROUND_Y - 54} fill="#ffffff" stroke="#c9d5e4" />
          <g fill="#7f9cc8">
            <rect x="204" y="60" width="9" height="9" rx="1" />
            <rect x="219.5" y="60" width="9" height="9" rx="1" />
            <rect x="235" y="60" width="9" height="9" rx="1" />
            <rect x="204" y="75" width="9" height="11" rx="1" />
            <rect x="219.5" y="76" width="9" height="20" rx="1" />
            <rect x="235" y="75" width="9" height="11" rx="1" />
          </g>
        </g>
      )}

      {kind === 'location' && (
        <g>
          <ellipse cx="224" cy={GROUND_Y} rx="12" ry="3" fill="#c7d4e4" />
          <path d="M224 95 C 214 78, 210 70, 210 62 a14 14 0 0 1 28 0 c0 8 -4 16 -14 33 z" fill="#ff7417" />
          <circle cx="224" cy="62" r="5" fill="#ffffff" />
        </g>
      )}

      {/* water (rises into place once per selection) */}
      <g className="fi-water-rise">
        <path d={wave(waterY + 2, -20, 40, 5)} fill="url(#fi-water-back)" />
        <path d={wave(waterY + 8, -36, 48, 6)} fill="url(#fi-water)" />
      </g>

      {/* gauge: dashed level line, marker and label */}
      <line x1="0" x2={W} y1={waterY} y2={waterY} stroke="#1f5fd0" strokeWidth="1.5" strokeDasharray="5 4" />
      <circle cx="276" cy={waterY} r="4.5" fill="#ffffff" stroke="#1f5fd0" strokeWidth="2.2" />
      <g transform={`translate(${294 - badgeW} ${waterY - 28})`}>
        <rect width={badgeW} height="20" rx="10" fill="#1f5fd0" />
        <text x={badgeW / 2} y="14" textAnchor="middle" fontSize="12" fontWeight="600" fill="#ffffff" fontFamily="inherit">
          {levelLabel}
        </text>
      </g>
    </svg>
  )
}
