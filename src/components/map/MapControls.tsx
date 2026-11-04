import { ChevronDown, ChevronUp, House, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
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

function Group({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="glass flex flex-col rounded-xl border border-white/80">
      {children}
    </div>
  )
}

/**
 * A map button with its name in a tooltip on hover and keyboard focus (v0.34), so every
 * control says what it does without a click. The tooltips open to the left of the column,
 * away from the map edge, and never over a neighbouring button (v0.35).
 */
function Btn({
  label,
  onClick,
  children,
  pressed,
  tipGap = 8,
  stacked = true,
  className,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  pressed?: boolean
  /** Pixels from the button's left edge to the tooltip, to clear buttons further left. */
  tipGap?: number
  /** In a column group: a divider above every button but the first, and the group's corners. */
  stacked?: boolean
  /** Replaces the size and shape (the compass dial's round buttons). */
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`group/btn relative grid place-items-center border-line text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline-offset-[-2px] ${
        className ?? `size-8 ${stacked ? 'not-first:border-t first:rounded-t-xl last:rounded-b-xl' : 'rounded-lg'}`
      } ${pressed ? 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent' : ''}`}
    >
      {children}
      {/* Group overflow stays visible so the tooltip isn't clipped; hence the corners above. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-full z-20 -translate-y-1/2 rounded-md bg-fg/90 px-2 py-1 text-[12px] leading-4 font-medium whitespace-nowrap text-white opacity-0 transition-opacity delay-150 group-hover/btn:opacity-100 group-focus-visible/btn:opacity-100"
        style={{ marginRight: tipGap }}
      >
        {label}
      </span>
    </button>
  )
}

function Needle({ bearing }: { bearing: number }) {
  return (
    <svg viewBox="0 0 16 16" className="size-4" style={{ transform: `rotate(${-bearing}deg)` }} aria-hidden>
      <path d="M8 1.5 11 8H5z" fill="#c62828" />
      <path d="M8 14.5 5 8h6z" fill="currentColor" />
    </svg>
  )
}

/** A round button on the compass dial. */
const DIAL_BTN = 'size-6 rounded-full'

/**
 * Map navigation (v0.35): one slim column in the bottom-right corner, so the rest of the map
 * stays clear. From the top: 2D or 3D, back to the whole city, the compass, zoom. In 3D the
 * compass becomes a dial with arrows around it to turn and tilt the view (not every trackpad or
 * mouse can); clicking the needle in the middle turns the map back to north. v0.34 had the view
 * buttons top right and a separate Rotate/Tilt card.
 */
export function MapControls({ viewMode, bearing, pitch, zoom, onZoomIn, onZoomOut, onResetNorth, onShowAll, onSetMode, onRotate, onTilt }: Props) {
  return (
    <div
      className="pointer-events-auto absolute right-4 bottom-[68px] z-10 flex w-[72px] flex-col items-center gap-2"
      data-pitch={Math.round(pitch)}
      data-bearing={Math.round(bearing)}
      data-zoom={zoom.toFixed(1)}
    >
      <div role="group" aria-label="Perspective" className="glass flex rounded-xl border border-white/80">
        <Btn label="2D view" stacked={false} className="size-8 rounded-l-xl" pressed={viewMode === '2d'} onClick={() => onSetMode('2d')}>
          <span className="text-[11px] font-medium">2D</span>
        </Btn>
        <Btn label="3D view" stacked={false} tipGap={40} className="size-8 rounded-r-xl border-l" pressed={viewMode === '3d'} onClick={() => onSetMode('3d')}>
          <span className="text-[11px] font-medium">3D</span>
        </Btn>
      </div>
      <Group label="Default view">
        <Btn label="Entire Miami Beach" onClick={onShowAll}>
          <House className="size-4" aria-hidden />
        </Btn>
      </Group>
      {viewMode === '3d' ? (
        // A 3 × 3 grid in a circle: tilt arrows above and below the needle, turn arrows either side.
        <div
          role="group"
          aria-label="Compass, turn and tilt"
          className="glass grid size-[72px] grid-cols-3 grid-rows-3 place-items-center rounded-full border border-white/80"
        >
          <Btn label="Tilt up" tipGap={32} className={`${DIAL_BTN} col-start-2`} onClick={() => onTilt(TILT_STEP)}>
            <ChevronUp className="size-3.5" aria-hidden />
          </Btn>
          <Btn label="Rotate left" className={`${DIAL_BTN} col-start-1 row-start-2`} onClick={() => onRotate(ROTATE_STEP)}>
            <RotateCcw className="size-3.5" aria-hidden />
          </Btn>
          <Btn label="Point north" tipGap={32} className={`${DIAL_BTN} col-start-2 row-start-2`} onClick={onResetNorth}>
            <Needle bearing={bearing} />
          </Btn>
          <Btn label="Rotate right" tipGap={56} className={`${DIAL_BTN} col-start-3 row-start-2`} onClick={() => onRotate(-ROTATE_STEP)}>
            <RotateCw className="size-3.5" aria-hidden />
          </Btn>
          <Btn label="Tilt down" tipGap={32} className={`${DIAL_BTN} col-start-2 row-start-3`} onClick={() => onTilt(-TILT_STEP)}>
            <ChevronDown className="size-3.5" aria-hidden />
          </Btn>
        </div>
      ) : (
        <Group label="Compass">
          <Btn label="Point north" onClick={onResetNorth}>
            <Needle bearing={bearing} />
          </Btn>
        </Group>
      )}
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
