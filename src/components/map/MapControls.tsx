import { ChevronDown, ChevronUp, Map as MapIcon, Minus, Plus, Rotate3d, RotateCcw, RotateCw } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { ViewMode } from '../../state/reducer'

interface Props {
  viewMode: ViewMode
  bearing: number
  pitch: number
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetNorth: () => void
  /** Fit the whole study area (the City of Miami Beach) back into view. */
  onShowAll: () => void
  onSetMode: (mode: ViewMode) => void
  /** Turn the map by this many degrees (positive turns it to the left, anticlockwise). */
  onRotate: (deg: number) => void
  /** Tilt the view by this many degrees (positive tilts it up, toward the horizon). */
  onTilt: (deg: number) => void
}

/** Degrees per click of the rotate and tilt buttons. */
export const ROTATE_STEP = 30
export const TILT_STEP = 10

/** A run of buttons inside the toolbar, named for screen readers. */
function Group({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col items-center gap-0.5">
      {children}
    </div>
  )
}

/** A thin rule between groups in the toolbar. */
const Divider = () => <div aria-hidden className="my-1 h-px w-4 bg-line-strong tiny:my-0.5" />

/**
 * A map button with its name in a tooltip on hover and keyboard focus (v0.34), so every
 * control says what it does without a click. The tooltip opens to the left, away from the map
 * edge. 32 px, or 28 px on the shortest windows (`tiny`).
 */
function Btn({
  label,
  onClick,
  children,
  pressed,
  expanded,
  controls,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  pressed?: boolean
  expanded?: boolean
  controls?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      className={`group/btn relative grid size-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline-offset-[-2px] tiny:size-7 ${
        pressed || expanded ? 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent' : ''
      }`}
    >
      {children}
      {/* No tooltip while its fold-out is open: the fold-out sits where the tooltip would. */}
      <span
        aria-hidden
        hidden={expanded}
        className="pointer-events-none absolute top-1/2 right-full z-20 mr-2 -translate-y-1/2 rounded-md bg-fg/90 px-2 py-1 text-[12px] leading-4 font-medium whitespace-nowrap text-white opacity-0 transition-opacity delay-150 group-hover/btn:opacity-100 group-focus-visible/btn:opacity-100"
      >
        {label}
      </span>
    </button>
  )
}

/** The compass needle, turned with the map so it always points north. */
function Needle({ bearing }: { bearing: number }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" style={{ transform: `rotate(${-bearing}deg)` }} aria-hidden>
      <path d="M8 1.5 11 8H5z" fill="#c62828" />
      <path d="M8 14.5 5 8h6z" fill="currentColor" />
    </svg>
  )
}

/**
 * Below this window height the full toolbar and a place's card would meet, so the four turn and
 * tilt arrows fold into one button: 56 (top bar) + 16 + about 322 (the tallest usual card) + 8
 * + 372 (the full toolbar, in 3D) + 16 px needs about 790 px. Folded, it's 270 px (226 px with
 * 28 px buttons and tighter rules on `tiny` windows), which clears the card down to 650 px.
 */
const SHORT_WINDOW = '(max-height: 800px)'

/**
 * Map navigation (v0.47): one toolbar at the screen's right edge, in the corner under the
 * Insights card, with thin rules between its groups. From the top: 2D or 3D, back to the whole
 * city, then in 3D the arrows to turn and tilt (not every trackpad or mouse can), the compass and
 * zoom. On short windows the four arrows fold into one "Turn and tilt" button that opens them
 * beside it, so the toolbar stays one column and clear of the card. v0.38–v0.46 had six separate
 * groups that split into two columns on short windows, which the owner found scattered.
 */
export function MapControls({ viewMode, bearing, pitch, zoom, onZoomIn, onZoomOut, onResetNorth, onShowAll, onSetMode, onRotate, onTilt }: Props) {
  const short = useMediaQuery(SHORT_WINDOW)
  const [arrowsOpen, setArrowsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const show3d = viewMode === '3d'

  // The folded arrows close on Escape or a click elsewhere, and when they unfold or leave 3D.
  // Escape is caught first (capture) and stopped, so it closes only the arrows, not the place card.
  useEffect(() => {
    if (!arrowsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setArrowsOpen(false)
    }
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setArrowsOpen(false)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [arrowsOpen])
  useEffect(() => {
    if (!short || !show3d) setArrowsOpen(false)
  }, [short, show3d])

  const arrows = (
    <>
      <Group label="Turn">
        <Btn label="Rotate left" onClick={() => onRotate(ROTATE_STEP)}>
          <RotateCcw className="size-4" aria-hidden />
        </Btn>
        <Btn label="Rotate right" onClick={() => onRotate(-ROTATE_STEP)}>
          <RotateCw className="size-4" aria-hidden />
        </Btn>
      </Group>
      <Group label="Tilt">
        <Btn label="Tilt up" onClick={() => onTilt(TILT_STEP)}>
          <ChevronUp className="size-4" aria-hidden />
        </Btn>
        <Btn label="Tilt down" onClick={() => onTilt(-TILT_STEP)}>
          <ChevronDown className="size-4" aria-hidden />
        </Btn>
      </Group>
    </>
  )

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Map controls"
      aria-orientation="vertical"
      className="glass pointer-events-auto absolute right-4 bottom-4 z-10 flex flex-col items-center rounded-xl border border-white/80 p-0.5"
      data-pitch={Math.round(pitch)}
      data-bearing={Math.round(bearing)}
      data-zoom={zoom.toFixed(1)}
    >
      <Group label="Perspective">
        <Btn label="2D view" pressed={viewMode === '2d'} onClick={() => onSetMode('2d')}>
          <span className="text-[11px] font-medium">2D</span>
        </Btn>
        <Btn label="3D view" pressed={viewMode === '3d'} onClick={() => onSetMode('3d')}>
          <span className="text-[11px] font-medium">3D</span>
        </Btn>
      </Group>
      <Divider />
      {/* A folded map, "the whole map" (v0.42, the owner's pick). Frame corners in v0.40–v0.41;
          the house (v0.34–v0.39) was misleading, since the button fits the city rather than going home. */}
      <Group label="Default view">
        <Btn label="Entire Miami Beach" onClick={onShowAll}>
          <MapIcon className="size-4" aria-hidden />
        </Btn>
      </Group>
      {show3d && (
        <>
          <Divider />
          {short ? (
            <div className="relative">
              <Btn label="Turn and tilt" expanded={arrowsOpen} controls="turn-tilt" onClick={() => setArrowsOpen((v) => !v)}>
                <Rotate3d className="size-4" aria-hidden />
              </Btn>
              {arrowsOpen && (
                <div
                  id="turn-tilt"
                  className="glass absolute top-1/2 right-full mr-2 grid w-max -translate-y-1/2 grid-cols-2 gap-0.5 rounded-xl border border-white/80 p-0.5"
                >
                  {arrows}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">{arrows}</div>
          )}
        </>
      )}
      <Divider />
      <Group label="Compass">
        <Btn label="Point north" onClick={onResetNorth}>
          <Needle bearing={bearing} />
        </Btn>
      </Group>
      <Divider />
      <Group label="Zoom">
        <Btn label="Zoom in" onClick={onZoomIn}>
          <Plus className="size-4" aria-hidden />
        </Btn>
        <Btn label="Zoom out" onClick={onZoomOut}>
          <Minus className="size-4" aria-hidden />
        </Btn>
      </Group>
    </div>
  )
}
