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

/** Track geometry (px): the water area sits on a baseline, each level is a pin on a stem. */
const BASE = 32
const DOT = 18
/** How much the water rises from one pin to the next. */
const STEP = 10
/** At the first level that reaches the place, the water stands this far above the pin's centre. */
const OVER = 4

const levelName = (ft: number) => (ft === 0 ? 'Today' : formatScenario(ft))
const clamp = (y: number) => Math.min(BASE - 2, Math.max(3, y))

/**
 * One pin per sea level on a rising band of water. The water is schematic, not a
 * depth: its surface meets the pin of the first level that reaches the place, so
 * the highlighted pin moves with the answer, and it stays below every pin when no
 * level reaches it. The pins are a list for screen readers; the water is hidden.
 */
export function LevelTrack({ levels, firstFeet, scenarioFt }: Props) {
  const gradientId = useId()
  const n = levels.length
  const first = firstFeet === null ? -1 : levels.findIndex((l) => l.feet === firstFeet)
  // Not reached: anchor one step past the last pin, so the water stays below every pin.
  const anchor = first >= 0 ? first : n
  const surface = levels.map((_, i) => clamp(DOT - OVER + (anchor - i) * STEP))
  const points: [number, number][] = [
    [0, clamp(surface[0] + STEP / 2)],
    ...surface.map((y, i): [number, number] => [((i + 0.5) * 100) / n, y]),
    [100, clamp(surface[n - 1] - STEP / 2)],
  ]
  const area = d3
    .area<[number, number]>()
    .x((d) => d[0])
    .y0(BASE)
    .y1((d) => d[1])
    .curve(d3.curveMonotoneX)(points)
  const line = d3
    .line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(d3.curveMonotoneX)(points)

  return (
    <div className="relative">
      <svg className="absolute inset-x-0 top-0 w-full" style={{ height: BASE }} viewBox={`0 0 100 ${BASE}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b7d6f6" />
            <stop offset="1" stopColor="#e4f0fc" />
          </linearGradient>
        </defs>
        <path d={area ?? ''} fill={`url(#${gradientId})`} />
        <path d={line ?? ''} fill="none" stroke="#86b9ec" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2="100" y1={BASE - 0.5} y2={BASE - 0.5} stroke="#b9d4ee" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-label="Water at this spot, by sea level">
        {levels.map((l, i) => {
          const isFirst = i === first
          return (
            <li key={l.feet} className="flex flex-col items-center">
              <span aria-hidden className="relative block w-full" style={{ height: BASE }}>
                <span
                  className={`absolute bottom-0 left-1/2 w-[1.5px] -translate-x-1/2 ${isFirst ? 'bg-accent' : 'bg-[#a3adb8]'}`}
                  style={{ top: DOT }}
                />
                <span
                  className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${
                    isFirst ? 'size-4 bg-accent shadow-[0_0_0_1px_var(--color-accent)]' : 'size-3 bg-[#a3adb8]'
                  }`}
                  style={{ top: DOT }}
                />
              </span>
              <span className={`mt-1 text-[12px] leading-4 tabular ${isFirst ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
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
