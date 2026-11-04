import { useId, type ReactNode } from 'react'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: ReactNode
  swatch?: ReactNode
  disabled?: boolean
}

/**
 * Accessible toggle: a native button with role="switch"; the whole row is clickable. Rows tighten
 * slightly on short windows (the `short` variant, v0.38), so the left panel still fits without scrolling.
 */
export function Switch({ checked, onChange, label, description, swatch, disabled }: Props) {
  const id = useId()
  return (
    <div className={`-mx-2 flex items-center gap-3 rounded px-2 py-2 hover:bg-surface-2 short:py-1.5 tiny:py-1 ${disabled ? 'opacity-50' : ''}`}>
      {swatch && <span className="shrink-0">{swatch}</span>}
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block cursor-pointer t-label text-fg">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="t-caption">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        // A light hairline, not a dark outline (v0.51). Off, the grey knob carries the state at 3:1+.
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
          checked
            ? 'fill-accent border-transparent'
            : 'border-[rgb(16_24_40/0.16)] bg-[#f6f7f9] shadow-[inset_0_1px_2px_rgb(16_24_40/0.06)]'
        }`}
      >
        <span
          aria-hidden
          className={`inline-block size-3.5 rounded-full transition-transform ${
            checked ? 'translate-x-[18px] bg-white shadow-[0_1px_2px_rgb(16_24_40/0.3)]' : 'translate-x-[2px] bg-[#7d8796] shadow-sm'
          }`}
        />
      </button>
    </div>
  )
}
