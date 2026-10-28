import { useRef, type KeyboardEvent } from 'react'
import { AREA_UNITS, type AreaUnit } from '../../lib/format'

const ORDER: AreaUnit[] = ['km2', 'acres']

interface Props {
  value: AreaUnit
  onChange: (unit: AreaUnit) => void
  className?: string
}

/**
 * Segmented control for the Insights area unit, in the Calcite "solid" pattern:
 * the chosen unit is filled with the accent, the other is plain text. A radio
 * group, so it's one Tab stop and the arrow keys switch units.
 */
export function AreaUnitToggle({ value, onChange, className = '' }: Props) {
  const refs = useRef<Partial<Record<AreaUnit, HTMLButtonElement | null>>>({})

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = ORDER[(ORDER.indexOf(value) + step + ORDER.length) % ORDER.length]
    onChange(next)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Area unit"
      onKeyDown={onKeyDown}
      className={`inline-flex shrink-0 rounded-md border border-line-strong bg-surface p-0.5 ${className}`}
    >
      {ORDER.map((unit) => {
        const on = unit === value
        return (
          <button
            key={unit}
            ref={(el) => {
              refs.current[unit] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={AREA_UNITS[unit].title}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(unit)}
            className={`h-6 min-w-11 rounded-[4px] px-2 text-[12px] leading-none font-medium transition-colors ${
              on ? 'bg-accent text-white' : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
            }`}
          >
            {AREA_UNITS[unit].short}
          </button>
        )
      })}
    </div>
  )
}
