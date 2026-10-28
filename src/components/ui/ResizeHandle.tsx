import { useRef, type KeyboardEvent, type PointerEvent } from 'react'

interface Props {
  /** Current width of the panel this handle resizes (px). */
  width: number
  min: number
  max: number
  onChange: (width: number) => void
  onReset: () => void
  /** id of the panel, for aria-controls. */
  controls: string
  label: string
}

const STEP = 16
const BIG_STEP = 64

/**
 * Drag handle on the left edge of a right-hand panel: drag, or focus it and use
 * the arrow keys (Shift for bigger steps, Home/End for the limits). Double-click
 * restores the default width.
 */
export function ResizeHandle({ width, min, max, onChange, onReset, controls, label }: Props) {
  const drag = useRef<{ x: number; width: number } | null>(null)

  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    document.body.style.removeProperty('cursor')
    document.body.style.removeProperty('user-select')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? BIG_STEP : STEP
    // The panel is on the right: moving the divider left makes it wider.
    const next = { ArrowLeft: width + step, ArrowRight: width - step, Home: min, End: max }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onChange(next)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-controls={controls}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, width }
        e.currentTarget.setPointerCapture(e.pointerId)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
      }}
      onPointerMove={(e) => {
        if (drag.current) onChange(drag.current.width + (drag.current.x - e.clientX))
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      className="group absolute inset-y-0 -left-1.5 z-30 w-3 cursor-col-resize touch-none outline-none"
    >
      <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 transition-colors group-hover:bg-accent/60 group-focus-visible:bg-accent group-active:bg-accent" />
    </div>
  )
}
