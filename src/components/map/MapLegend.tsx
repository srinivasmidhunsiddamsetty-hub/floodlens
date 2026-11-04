import { formatScenario } from '../../lib/format'
import type { FloodBand } from '../../lib/manifest'
import { bandColor, type ColorMode } from '../../lib/theme'
import { Swatch } from '../ui/Swatch'

interface Props {
  bands: FloodBand[]
  scenarioFt: number
  colorMode: ColorMode
  showFlood: boolean
  showLowLying: boolean
}

/**
 * The map key as a slim vertical scale (v0.34), like the keys in Google Maps: only the sea-level
 * colours, today at the bottom and the top level at the top, with the chosen level in bold.
 * Detailed mode shows every level in its own colour whatever the slider shows, because the
 * colour says where water first reaches. Simple mode fills one colour up to the chosen level and
 * leaves the levels above empty, because they aren't on the map. A plain key (v0.28): nothing in
 * it is clickable.
 */
export function MapLegend({ bands, scenarioFt, colorMode, showFlood, showLowLying }: Props) {
  const flood = showFlood && bands.length > 0
  if (!flood && !showLowLying) return null
  const levels = [...bands].reverse()
  return (
    <section aria-label="Map legend" className="glass rounded-xl border border-white/80 px-2.5 pt-2 pb-2.5">
      {flood && (
        <>
          <p className="mb-1.5 text-[11px] leading-4 font-medium text-fg-muted">{colorMode === 'detailed' ? 'Water first reaches' : 'Sea level'}</p>
          <ul className="flex flex-col gap-0.5">
            {levels.map((b, i) => {
              const chosen = b.feet === scenarioFt
              const filled = colorMode === 'detailed' || b.feet <= scenarioFt
              return (
                <li key={b.feet} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-[18px] w-2.5 shrink-0 ${i === 0 ? 'rounded-t-full' : ''} ${i === levels.length - 1 ? 'rounded-b-full' : ''} ${
                      filled ? '' : 'bg-white/70 ring-1 ring-line-strong ring-inset'
                    }`}
                    style={filled ? { background: bandColor(b.feet, colorMode) } : undefined}
                  />
                  <span className={`text-[12px] leading-[18px] tabular ${chosen ? 'font-bold text-fg' : 'text-fg-muted'}`}>
                    {b.isReference ? 'Today' : formatScenario(b.feet)}
                    {chosen && <span className="sr-only"> (chosen level)</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
      {showLowLying && (
        <p className={`flex items-center gap-2 text-[12px] leading-[18px] text-fg-muted ${flood ? 'mt-2 border-t border-line pt-2' : ''}`}>
          <Swatch kind="lowLying" size={12} /> Low spot
        </p>
      )}
    </section>
  )
}
