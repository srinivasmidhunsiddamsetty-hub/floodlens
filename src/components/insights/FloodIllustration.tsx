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

/**
 * The scene is drawn 600 units wide and right-aligned with `slice`, so at any card
 * width the height stays fixed (no growing with a wider panel) and the water simply
 * runs further to the left.
 */
const W = 600
const H = 88
/** One stream of water per foot; today's high tide is a thinner band. */
const STREAM = 10
const TODAY = 6
const HOUSE_X = W - 80

/** A gentle swell across the full width starting at height y. */
const crest = (y: number, phase: number, len = 40, amp = 3.5) => {
  let d = `M${-len + phase} ${y}`
  for (let x = -len + phase; x < W + len; x += len) d += ` q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`
  return d
}
/** The same swell closed down to the bottom edge, as a filled body of water. */
const wave = (y: number, phase: number) => `${crest(y, phase)} V ${H} H ${-40 + phase} Z`

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
    ? [{ feet: 0, h: kind === 'water' ? 18 : TODAY }]
    : Array.from({ length: reached ? firstFeet : topFeet }, (_, i) => ({ feet: i + 1, h: STREAM }))

  // Stack streams from the bottom edge up, remembering each stream's top.
  let y = H
  const stacked = streams.map((s) => {
    y -= s.h
    return { ...s, top: y }
  })
  const waterTop = y
  // The place stands on ground whose height decides which stream first reaches it.
  const g = reached ? waterTop + 4 : waterTop - 10

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMaxYMax slice" className={className} aria-hidden="true" focusable="false">
      <g fill="#d6e8fb">
        <ellipse cx={W - 34} cy="13" rx="16" ry="5.5" />
        <ellipse cx={W - 48} cy="15" rx="10" ry="5" />
      </g>

      {kind !== 'water' && (
        <g>
          <path d={`M${W - 170} ${H} C ${W - 150} ${g}, ${W - 142} ${g}, ${W - 124} ${g} H ${W} V ${H} Z`} fill="#ece2d0" />
          <path d={`M${W - 170} ${H} C ${W - 150} ${g}, ${W - 142} ${g}, ${W - 124} ${g} H ${W}`} fill="none" stroke="#dccfb6" strokeWidth="1.2" />
          <circle cx={W - 22} cy={g - 8} r="8" fill="#cfe3d2" />
        </g>
      )}

      {kind === 'building' && (
        <g transform={`translate(${HOUSE_X} ${g}) scale(0.64) translate(-224 -96)`}>
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
      )}

      {kind === 'location' && (
        <g transform={`translate(${HOUSE_X} ${g}) scale(0.64) translate(-222 -96)`}>
          <ellipse cx="222" cy="96" rx="12" ry="3" fill="#d8cdb8" />
          <path d="M222 95 C 212 78, 208 70, 208 62 a14 14 0 0 1 28 0 c0 8 -4 16 -14 33 z" fill="#ff7417" />
          <circle cx="222" cy="62" r="5" fill="#ffffff" />
        </g>
      )}

      {/* Streams are drawn top-down so each lower stream overlaps the one above; they rise bottom-up. */}
      {[...stacked].reverse().map((s) => {
        const phase = (s.feet * 15) % 40
        return (
          <g key={s.feet} className="fi-stream" style={{ animationDelay: `${120 + Math.max(0, s.feet - 1) * 220}ms` }}>
            <path d={wave(s.top, phase)} fill={bandColor(s.feet)} />
            <path d={crest(s.top, phase)} fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.3" />
          </g>
        )
      })}
    </svg>
  )
}
