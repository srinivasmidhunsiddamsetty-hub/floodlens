import { formatScenario } from '../../lib/format'
import type { FloodBand } from '../../lib/manifest'
import { bandColor, type ColorMode } from '../../lib/theme'

interface Props {
  bands: FloodBand[]
  scenarioFt: number
  colorMode: ColorMode
  showFlood: boolean
}

/**
 * The map key as a slim vertical scale (v0.34), like the keys in Google Maps: only the sea-level
 * colours, today at the bottom and the top level at the top, with the chosen level in bold. It
 * shows every level in its own colour whatever the slider shows, because the colour says where
 * water first reaches. Shown only with Detailed colours (v0.35): with one colour there is nothing
 * to decode. A plain key (v0.28): nothing in it is clickable, and it takes the pointer (v0.35)
 * so the map's hand cursor and hover labels don't show through it.
 */
export function MapLegend({ bands, scenarioFt, colorMode, showFlood }: Props) {
  if (colorMode !== 'detailed' || !showFlood || bands.length === 0) return null
  const levels = [...bands].reverse()
  return (
    <section aria-label="Map legend" className="glass pointer-events-auto cursor-default rounded-xl border border-white/80 px-2.5 pt-2 pb-2.5">
      <p className="mb-1.5 text-[11px] leading-4 font-medium text-fg-muted">Water first reaches</p>
      <ul className="flex flex-col gap-0.5">
        {levels.map((b, i) => {
          const chosen = b.feet === scenarioFt
          return (
            <li key={b.feet} className="flex items-center gap-2">
              <span
                aria-hidden
                className={`h-[18px] w-2.5 shrink-0 ${i === 0 ? 'rounded-t-full' : ''} ${i === levels.length - 1 ? 'rounded-b-full' : ''}`}
                style={{ background: bandColor(b.feet, colorMode) }}
              />
              <span className={`text-[12px] leading-[18px] tabular ${chosen ? 'font-bold text-fg' : 'text-fg-muted'}`}>
                {b.isReference ? 'Today' : formatScenario(b.feet)}
                {chosen && <span className="sr-only"> (chosen level)</span>}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
