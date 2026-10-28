import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * Modal built on the native <dialog> element: focus is moved inside and
 * restored on close, Esc closes, and the rest of the page is inert.
 */
export function Dialog({ open, onClose, title, subtitle, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal()
      else d.setAttribute('open', '')
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close()
      else d.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="m-auto max-h-[min(86vh,820px)] w-[min(680px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-panel backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div className="flex max-h-[min(86vh,820px)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              <h2 id={titleId} className="text-base font-semibold">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 text-xs text-fg-subtle">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} className="btn-ghost size-8 justify-center px-0" aria-label="Close dialog">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="scrollbar-thin overflow-y-auto px-6 py-5 text-sm leading-6 text-fg-muted">{children}</div>
        </div>
      )}
    </dialog>
  )
}
