import { useId, type ReactNode } from 'react'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: ReactNode
  swatch?: ReactNode
  disabled?: boolean
}

/** Accessible toggle: a native button with role="switch"; the whole row is clickable. */
export function Switch({ checked, onChange, label, description, swatch, disabled }: Props) {
  const id = useId()
  return (
    <div className={`-mx-2 flex items-center gap-3 rounded px-2 py-2 hover:bg-surface-2 ${disabled ? 'opacity-50' : ''}`}>
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
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-control bg-surface'
        }`}
      >
        <span
          aria-hidden
          className={`inline-block size-3.5 rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-[18px] bg-white' : 'translate-x-[2px] bg-fg-subtle'
          }`}
        />
      </button>
    </div>
  )
}
