import { useId, type ReactNode } from 'react'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: ReactNode
  swatch?: ReactNode
  disabled?: boolean
}

/** Accessible toggle: a native button with role="switch" and a visible label. */
export function Switch({ checked, onChange, label, description, swatch, disabled }: Props) {
  const id = useId()
  return (
    <div className={`flex items-start gap-3 py-1.5 ${disabled ? 'opacity-50' : ''}`}>
      {swatch && <span className="mt-0.5 shrink-0">{swatch}</span>}
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block cursor-pointer text-[13px] leading-5 text-fg">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="text-xs leading-4 text-fg-subtle">
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
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
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
