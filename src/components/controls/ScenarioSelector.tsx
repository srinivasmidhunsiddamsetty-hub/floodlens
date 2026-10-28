import { Info } from 'lucide-react'
import { useId, useState, type CSSProperties } from 'react'
import { formatScenario, formatScenarioLong } from '../../lib/format'

interface Props {
  available: number[]
  value: number
  onChange: (feet: number) => void
  disabled?: boolean
}

/**
 * Discrete scenario slider. A native range input gives keyboard, touch and
 * screen-reader support for free; the tick labels below are mouse shortcuts.
 * Positions are discrete NOAA scenarios — nothing is interpolated between them.
 */
export function ScenarioSelector({ available, value, onChange, disabled }: Props) {
  const id = useId()
  const [showInfo, setShowInfo] = useState(false)
  const index = Math.max(0, available.indexOf(value))
  const max = Math.max(1, available.length - 1)
  const fill = `${(index / max) * 100}%`

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <output htmlFor={id} className="block text-[34px] leading-none font-semibold tracking-tight text-fg tabular" aria-live="polite">
            {formatScenario(value)}
          </output>
          <p className="mt-1.5 text-[13px] text-fg-muted">Sea-level-rise inundation scenario</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          aria-expanded={showInfo}
          aria-controls={`${id}-info`}
          className="btn-ghost h-7 px-2 text-xs"
        >
          <Info className="size-3.5" aria-hidden />
          Reference
        </button>
      </div>

      {showInfo && (
        <p id={`${id}-info`} className="mt-3 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-5 text-fg-muted animate-slide-up">
          Each scenario is a rise in water level <strong className="font-medium text-fg">above Mean Higher High Water (MHHW)</strong> — the
          average of the higher of the two daily high tides. <strong className="font-medium text-fg">0 ft</strong> shows NOAA&rsquo;s mapped
          extent at today&rsquo;s MHHW. Scenarios are water levels, not years or forecasts.
        </p>
      )}

      <div className="mt-4">
        <label htmlFor={id} className="sr-only">
          Sea-level-rise scenario above MHHW
        </label>
        <input
          id={id}
          type="range"
          className="fl-range"
          min={0}
          max={max}
          step={1}
          value={index}
          disabled={disabled || available.length === 0}
          onChange={(e) => onChange(available[Number(e.target.value)])}
          aria-valuetext={formatScenarioLong(value)}
          style={{ '--fill': fill } as CSSProperties}
        />
        <div className="mt-1 flex justify-between" aria-hidden="true">
          {available.map((ft) => (
            <button
              key={ft}
              type="button"
              tabIndex={-1}
              onClick={() => onChange(ft)}
              className={`-mx-1 rounded px-1 text-xs tabular transition-colors ${
                ft === value ? 'font-semibold text-flood-strong' : 'text-fg-subtle hover:text-fg'
              }`}
            >
              {formatScenario(ft)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
