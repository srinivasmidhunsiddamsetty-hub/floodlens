import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { formatScenario } from '../../lib/format'
import type { FloodBand } from '../../lib/manifest'
import { bandColor } from '../../lib/theme'
import { Swatch } from '../ui/Swatch'

interface Props {
  bands: FloodBand[]
  scenarioFt: number
  showFlood: boolean
  showLowLying: boolean
  showBuildings: boolean
  showStudyArea: boolean
  highlightFt: number | null
  onHighlight: (ft: number | null) => void
  defaultOpen?: boolean
}

/**
 * Compact, collapsible legend. The flood ramp reads like a weather-radar key:
 * one swatch per water level, dimmed for levels above the current scenario.
 * Hovering a level emphasises that band on the map.
 */
export function MapLegend({ bands, scenarioFt, showFlood, showLowLying, showBuildings, showStudyArea, highlightFt, onHighlight, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section aria-label="Map legend" className="pointer-events-auto w-52 overflow-hidden rounded border border-line bg-surface/95 shadow-float backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-8 w-full items-center justify-between px-3 text-left t-label text-fg hover:bg-surface-3"
      >
        Legend
        <ChevronDown className={`size-4 text-fg-subtle transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden />
      </button>

      {open && (
        <div className="border-t border-line px-3 pt-2 pb-3">
          {showFlood && bands.length > 0 && (
            <>
              <p className="t-overline mb-1">Flooded first at</p>
              <ul className="mb-2" onMouseLeave={() => onHighlight(null)}>
                {bands.map((b) => {
                  const shown = b.feet <= scenarioFt
                  return (
                    <li key={b.feet}>
                      <button
                        type="button"
                        disabled={!shown}
                        onMouseEnter={() => shown && onHighlight(b.feet)}
                        onFocus={() => shown && onHighlight(b.feet)}
                        onBlur={() => onHighlight(null)}
                        className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left t-caption transition-colors ${
                          shown ? 'text-fg hover:bg-surface-3' : 'cursor-default text-fg-subtle/70'
                        } ${highlightFt === b.feet ? 'bg-surface-3' : ''}`}
                      >
                        <span
                          aria-hidden
                          className="h-3 w-5 shrink-0 rounded-sm"
                          style={{ background: bandColor(b.feet), opacity: shown ? 1 : 0.3 }}
                        />
                        {b.isReference ? 'Today (0 ft)' : formatScenario(b.feet)}
                        {!shown && <span className="ml-auto text-[11px]">hidden</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-line pt-2 t-caption text-fg-muted">
            {showLowLying && (
              <li className="flex items-center gap-2">
                <Swatch kind="lowLying" size={13} /> Low-lying
              </li>
            )}
            <li className="flex items-center gap-2">
              <Swatch kind="water" size={13} /> Water
            </li>
            {showBuildings && (
              <li className="flex items-center gap-2">
                <Swatch kind="building" size={13} /> Building
              </li>
            )}
            <li className="flex items-center gap-2">
              <Swatch kind="selection" size={13} /> Selected
            </li>
            {showStudyArea && (
              <li className="flex items-center gap-2">
                <Swatch kind="study" size={13} /> City limits
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  )
}
