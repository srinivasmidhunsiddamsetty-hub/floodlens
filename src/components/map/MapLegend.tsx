import { Minus } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatScenario } from '../../lib/format'
import type { FloodBand } from '../../lib/manifest'
import { bandColor, type ColorMode } from '../../lib/theme'

interface Props {
  bands: FloodBand[]
  colorMode: ColorMode
  showFlood: boolean
  /** Buildings are on the map, in their levels' colours, so the key is needed in either colour mode (v0.62). */
  showBuildings: boolean
}

const MIN_KEY = 'floodlens.legendMinimised'

const readMinimised = (): boolean => {
  try {
    return localStorage.getItem(MIN_KEY) === '1'
  } catch {
    return false
  }
}

/** A legend button with a tooltip that opens to its right, styled like the map toolbar's. */
function LegendButton({
  label,
  onClick,
  focusOnMount,
  className,
  children,
}: {
  label: string
  onClick: () => void
  focusOnMount: boolean
  className: string
  children: ReactNode
}) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    // Minimising swaps one button for the other: keep keyboard focus on the one now shown.
    if (focusOnMount) ref.current?.focus()
  }, [focusOnMount])
  return (
    <button ref={ref} type="button" aria-label={label} onClick={onClick} className={`group/btn relative cursor-pointer transition-colors ${className}`}>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-full z-20 ml-2 -translate-y-1/2 rounded-md bg-fg/90 px-2 py-1 text-[12px] leading-4 font-medium whitespace-nowrap text-white opacity-0 transition-opacity delay-150 group-hover/btn:opacity-100 group-focus-visible/btn:opacity-100"
      >
        {label}
      </span>
    </button>
  )
}

/**
 * The map key as a slim vertical scale (v0.34), like the keys in Google Maps: only the sea-level
 * colours, today at the bottom and the top level at the top. It shows every level in its own
 * colour whatever the slider shows, because the colour says where water first reaches; no level
 * is highlighted (v0.54), since the slider already shows the chosen one. Its title matches the
 * place card's answer, "Water reaches at" (v0.54; "Water first reaches" before), and keeps "+3 ft"
 * from reading as a depth. Shown whenever those colours are on the map: the water with Per foot
 * colours (v0.35), and the buildings once you're zoomed in far enough to see them (v0.62). In the
 * whole-city view with one blue there is nothing to decode, so it stays away. The rows are a plain
 * key (v0.28): the only control is the minus that folds it
 * into a small square showing the colours, which opens it again (v0.54, remembered per browser).
 * It takes the pointer (v0.35) so the map's hand cursor and hover labels don't show through it.
 */
export function MapLegend({ bands, colorMode, showFlood, showBuildings }: Props) {
  const [minimised, setMinimised] = useState(readMinimised)
  // Set by the user's own click, so the swapped-in button takes focus then and never on page load.
  const [toggled, setToggled] = useState(false)
  const toggle = (next: boolean) => {
    setToggled(true)
    setMinimised(next)
  }
  useEffect(() => {
    try {
      localStorage.setItem(MIN_KEY, minimised ? '1' : '0')
    } catch {
      /* storage unavailable (private mode): the legend just opens again on the next visit */
    }
  }, [minimised])

  const waterInLevelColours = colorMode === 'detailed' && showFlood
  if ((!waterInLevelColours && !showBuildings) || bands.length === 0) return null
  const levels = [...bands].reverse()
  const strip = levels.map((b, i) => `${bandColor(b.feet)} ${(i / levels.length) * 100}% ${((i + 1) / levels.length) * 100}%`).join(', ')

  if (minimised) {
    return (
      <section aria-label="Map legend" className="pointer-events-auto cursor-default">
        <LegendButton
          label="Show legend"
          onClick={() => toggle(false)}
          focusOnMount={toggled}
          className="glass grid size-8 place-items-center rounded-lg border border-white/80 hover:bg-white"
        >
          <span aria-hidden className="block h-[18px] w-1.5 rounded-[3px]" style={{ background: `linear-gradient(to bottom, ${strip})` }} />
        </LegendButton>
      </section>
    )
  }

  return (
    <section aria-label="Map legend" className="glass pointer-events-auto cursor-default rounded-xl border border-white/80 px-2.5 pt-2 pb-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-1.5">
        <p className="text-[11px] leading-4 font-medium whitespace-nowrap text-fg-muted">Water reaches at</p>
        <LegendButton
          label="Minimise legend"
          onClick={() => toggle(true)}
          focusOnMount={toggled}
          className="-mt-0.5 -mr-1 grid size-5 place-items-center rounded-md bg-[rgb(16_24_40/0.05)] text-fg-subtle hover:bg-[rgb(16_24_40/0.1)] hover:text-fg"
        >
          <Minus className="size-3.5" strokeWidth={2.25} aria-hidden />
        </LegendButton>
      </div>
      <ul className="flex flex-col gap-0.5">
        {levels.map((b, i) => (
          <li key={b.feet} className="flex items-center gap-2">
            <span
              aria-hidden
              className={`h-[18px] w-2.5 shrink-0 ${i === 0 ? 'rounded-t-full' : ''} ${i === levels.length - 1 ? 'rounded-b-full' : ''}`}
              style={{ background: bandColor(b.feet) }}
            />
            <span className="text-[12px] leading-[18px] text-fg-muted tabular">{formatScenario(b.feet)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
