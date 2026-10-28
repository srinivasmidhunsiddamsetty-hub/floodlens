import { useRef, type KeyboardEvent, type ReactNode } from 'react'

export interface SegmentOption<T extends string | number> {
  value: T
  label: ReactNode
  /** Accessible name when `label` is visual-only. */
  ariaLabel?: string
  disabled?: boolean
}

interface Props<T extends string | number> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible group label. */
  label: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Segmented control implemented as an ARIA radio group: Tab focuses the
 * checked option, arrow keys move & select (with wrap), Home/End jump.
 */
export function Segmented<T extends string | number>({ options, value, onChange, label, size = 'md', className = '' }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const enabled = options.filter((o) => !o.disabled)

  function onKeyDown(e: KeyboardEvent) {
    const i = enabled.findIndex((o) => o.value === value)
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % enabled.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + enabled.length) % enabled.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = enabled.length - 1
    if (next < 0) return
    e.preventDefault()
    const opt = enabled[next]
    onChange(opt.value)
    refs.current[options.indexOf(opt)]?.focus()
  }

  const h = size === 'sm' ? 'h-7 text-xs' : 'h-8 text-[13px]'
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`flex rounded-md border border-line bg-surface-3 p-0.5 ${className}`}
    >
      {options.map((o, idx) => {
        const checked = o.value === value
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[idx] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={o.ariaLabel}
            disabled={o.disabled}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`${h} flex flex-1 items-center justify-center gap-1.5 rounded px-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              checked ? 'bg-surface text-accent shadow-sm ring-1 ring-line-strong' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
