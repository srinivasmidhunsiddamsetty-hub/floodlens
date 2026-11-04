import * as d3 from 'd3'
import { useId } from 'react'
import { formatScenario } from '../../lib/format'

interface Props {
  /** Every mapped level, ascending, and whether its water reaches the place. */
  levels: { feet: number; within: boolean }[]
  /** First level that reaches the place, or null if none does. */
  firstFeet: number | null
  scenarioFt: number
}

/** Height (px) the water band can rise to above the baseline. */
const FILL = 18

// Today's level is "0 ft" (v0.40; "Today" before), so every level reads as a number.
const levelName = formatScenario

/**
 * Sea levels labelled along a baseline, with the water rising from left to right and
 * stopping, with a dashed marker, at the first level that reaches the place. When
 * no level reaches it the water runs on to the end with no marker. The water is
 * schematic, not a depth, so it's hidden from screen readers; the labels are a list.
 */
export function LevelTrack({ levels, firstFeet, scenarioFt }: Props) {
  const gradientId = useId()
  const n = levels.length
  const first = firstFeet === null ? -1 : levels.findIndex((l) => l.feet === firstFeet)
  const x = (i: number) => ((i + 0.5) * 100) / n
  // The surface rises a little more at each level, and is never so low that the marker is lost.
  const rise = (i: number) => Math.max(11, (FILL * (i + 2)) / (n + 1))

  // A gentle S from the left edge up to where it stops: at the first level that
  // reaches the place, or the far end when none does.
  const endX = first >= 0 ? x(first) : 100
  const endH = rise(first >= 0 ? first : n - 1)
  const points = d3.range(25).map((k): [number, number] => {
    const t = k / 24
    return [t * endX, FILL - endH * (0.06 + 0.94 * t * t * (3 - 2 * t))]
  })
  const area = d3
    .area<[number, number]>()
    .x((d) => d[0])
    .y0(FILL)
    .y1((d) => d[1])
    .curve(d3.curveMonotoneX)(points)
  const surface = d3
    .line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(d3.curveMonotoneX)(points)

  return (
    <div>
      <div className="relative" style={{ height: FILL }} aria-hidden="true">
        {/* The water flows in from the left once per place (v0.51), then rests; the marker is revealed
            by the same sweep, so it shows as the water reaches it. The track remounts with each new
            place, since the card shows "Checking…" in between. No motion for people who ask for less. */}
        <svg className="absolute inset-0 h-full w-full motion-safe:animate-water-in" viewBox={`0 0 100 ${FILL}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a9cff5" />
              <stop offset="1" stopColor="#dcebfb" />
            </linearGradient>
          </defs>
          <path d={area ?? ''} fill={`url(#${gradientId})`} />
          <path d={surface ?? ''} fill="none" stroke="#7fb3e6" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* On the navy answer box (v0.49): a light baseline, marker and labels. */}
        <span className="absolute inset-x-0 bottom-0 h-px bg-white/40" />
        {/* Where the water first reaches the place: a dashed drop from the surface to the baseline.
            No circles on the baseline (v0.22): the labels below mark the levels. No dot on the
            surface either (v0.51): it looked like a handle you could drag. */}
        {first >= 0 && (
          <div className="absolute inset-0 motion-safe:animate-water-in">
            <span
              className="absolute w-0 -translate-x-1/2 border-l-[1.5px] border-dashed border-white"
              style={{ left: `${x(first)}%`, top: FILL - rise(first), height: rise(first) }}
            />
          </div>
        )}
      </div>
      <ol className="mt-1.5 grid text-center" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-label="Water at this spot, by sea level">
        {levels.map((l, i) => {
          return (
            <li key={l.feet} className="flex flex-col">
              <span className={`text-[10px] leading-[14px] tabular ${i === first ? 'font-semibold text-white' : 'font-medium text-white'}`}>
                {levelName(l.feet)}
                {l.feet === scenarioFt && <span className="sr-only"> (selected level)</span>}
              </span>
              <span className="sr-only">{l.within ? 'water reaches it' : 'water doesn’t reach it'}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
