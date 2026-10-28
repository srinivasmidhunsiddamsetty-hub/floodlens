import { bandColor } from '../../lib/theme'

interface Props {
  /** What was selected: a building gets a house, a bare location a pin, water just waves. */
  kind: 'building' | 'location' | 'water'
  /** First water level (ft) that reaches the selection, or null if none up to `topFeet`. */
  firstFeet: number | null
  /** Highest water level FloodLens shows. */
  topFeet: number
  className?: string
}

const W = 300
const H = 128
/** One stream of water per foot; today's high tide is a thinner band. */
const STREAM = 13
const TODAY = 8

/** A gentle swell across the full width starting at height y. */
const crest = (y: number, phase: number, len = 44, amp = 4.5) => {
  let d = `M${-len + phase} ${y}`
  for (let x = -len + phase; x < W + len; x += len) d += ` q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`
  return d
}
/** The same swell closed down to the bottom edge, as a filled body of water. */
const wave = (y: number, phase: number) => `${crest(y, phase)} V ${H} H ${-44 + phase} Z`

/**
 * Decorative scene for the selected-place card. Water rises in one stream per
 * foot, in the map's colour for that foot, until it reaches the place: a place
 * first reached at +3 ft sits on higher ground than one reached at +1 ft.
 * Hidden from assistive technology; the card states the same thing in text.
 */
export function FloodIllustration({ kind, firstFeet, topFeet, className }: Props) {
  const reached = firstFeet !== null
  const today = kind === 'water' || firstFeet === 0
  const streams = today
    ? [{ feet: 0, h: kind === 'water' ? 24 : TODAY }]
    : Array.from({ length: reached ? firstFeet : topFeet }, (_, i) => ({ feet: i + 1, h: STREAM }))

  // Stack streams from the bottom edge up, remembering each stream's top.
  let y = H
  const stacked = streams.map((s) => {
    y -= s.h
    return { ...s, top: y }
  })
  const waterTop = y
  // The place stands on ground whose height decides which stream first reaches it.
  const groundY = reached ? waterTop + 5 : waterTop - 12

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true" focusable="false">
      {/* backdrop */}
      <g fill="#d6e8fb">
        <ellipse cx="272" cy="18" rx="20" ry="7" />
        <ellipse cx="256" cy="21" rx="12" ry="6" />
      </g>

      {kind !== 'water' && (
        <g>
          {/* the ground the place stands on */}
          <path d={`M138 ${H} C 160 ${groundY}, 168 ${groundY}, 186 ${groundY} H ${W} V ${H} Z`} fill="#ece2d0" />
          <path d={`M138 ${H} C 160 ${groundY}, 168 ${groundY}, 186 ${groundY} H ${W}`} fill="none" stroke="#dccfb6" strokeWidth="1.5" />
          <circle cx="282" cy={groundY - 10} r="11" fill="#cfe3d2" />
          <rect x="281" y={groundY - 4} width="2" height="4" fill="#b9cbb9" />
        </g>
      )}

      {kind === 'building' && (
        <g transform={`translate(0 ${groundY - 96})`}>
          <g transform="translate(222 96) scale(0.95) translate(-224 -96)">
            <rect x="236" y="30" width="9" height="16" fill="#6f84a3" />
            <path d="M196 54 L224 28 L252 54 Z" fill="#8094b2" />
            <path d="M191 56 L224 26 L257 56" fill="none" stroke="#5c7193" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="198" y="54" width="52" height="42" fill="#ffffff" stroke="#c9d5e4" />
            <g fill="#7f9cc8">
              <rect x="204" y="60" width="9" height="9" rx="1" />
              <rect x="219.5" y="60" width="9" height="9" rx="1" />
              <rect x="235" y="60" width="9" height="9" rx="1" />
              <rect x="204" y="75" width="9" height="11" rx="1" />
              <rect x="219.5" y="76" width="9" height="20" rx="1" />
              <rect x="235" y="75" width="9" height="11" rx="1" />
            </g>
          </g>
        </g>
      )}

      {kind === 'location' && (
        <g transform={`translate(0 ${groundY - 96})`}>
          <ellipse cx="222" cy="96" rx="12" ry="3" fill="#d8cdb8" />
          <path d="M222 95 C 212 78, 208 70, 208 62 a14 14 0 0 1 28 0 c0 8 -4 16 -14 33 z" fill="#ff7417" />
          <circle cx="222" cy="62" r="5" fill="#ffffff" />
        </g>
      )}

      {/* Streams are drawn top-down so each lower stream overlaps the one above; they rise bottom-up. */}
      {[...stacked].reverse().map((s) => {
        const phase = (s.feet * 17) % 44
        return (
          <g key={s.feet} className="fi-stream" style={{ animationDelay: `${120 + Math.max(0, s.feet - 1) * 220}ms` }}>
            <path d={wave(s.top, phase)} fill={bandColor(s.feet)} />
            <path d={crest(s.top, phase)} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" />
          </g>
        )
      })}
    </svg>
  )
}
