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
 * control says what it does without a click. The tooltip opens on the side away from
 * the map edge the control sits on.
 */
function Btn({
  label,
  onClick,
  children,
  pressed,
  tip = 'left',
  stacked = true,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  pressed?: boolean
  /** Where the tooltip opens: left of the button, or above it. */
  tip?: 'left' | 'top'
  /** In a column group: a divider above every button but the first, and the group's corners. */
  stacked?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`group/btn relative grid size-8 place-items-center border-line text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline-offset-[-2px] ${
        stacked ? 'not-first:border-t first:rounded-t-xl last:rounded-b-xl' : 'rounded-lg'
      } ${pressed ? 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent' : ''}`}
    >
      {children}
      {/* Group overflow stays visible so the tooltip isn't clipped; hence the corners above. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute z-20 rounded-md bg-fg/90 px-2 py-1 text-[12px] leading-4 font-medium whitespace-nowrap text-white opacity-0 transition-opacity delay-150 group-hover/btn:opacity-100 group-focus-visible/btn:opacity-100 ${
          tip === 'left' ? 'top-1/2 right-full mr-2 -translate-y-1/2' : 'bottom-full left-1/2 mb-2 -translate-x-1/2'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

/**
 * Map navigation (v0.34). The view controls sit top right: 2D or 3D, and back to the whole
 * city. The hands-on controls sit bottom right, within easy reach: in 3D, buttons to rotate
 * and tilt (not every trackpad or mouse can), then the compass and zoom.
 */
export function MapControls({ viewMode, bearing, pitch, zoom, onZoomIn, onZoomOut, onResetNorth, onShowAll, onSetMode, onRotate, onTilt }: Props) {
  return (
    <>
      <div className="pointer-events-auto absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Group label="Perspective">
          <Btn label="2D view" pressed={viewMode === '2d'} onClick={() => onSetMode('2d')}>
            <span className="text-[11px] font-medium">2D</span>
          </Btn>
          <Btn label="3D view" pressed={viewMode === '3d'} onClick={() => onSetMode('3d')}>
            <span className="text-[11px] font-medium">3D</span>
          </Btn>
        </Group>
        <Group label="Default view">
          <Btn label="Entire Miami Beach" onClick={onShowAll}>
            <House className="size-4" aria-hidden />
          </Btn>
        </Group>
      </div>

      <div
        className="pointer-events-auto absolute right-4 bottom-[68px] z-10 flex flex-col items-end gap-2"
        data-pitch={Math.round(pitch)}
        data-bearing={Math.round(bearing)}
        data-zoom={zoom.toFixed(1)}
      >
        {viewMode === '3d' && (
          <div role="group" aria-label="Rotate and tilt" className="glass rounded-xl border border-white/80 px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] leading-4 font-medium text-fg">Rotate</span>
              <div className="flex">
                <Btn label="Rotate left" tip="top" stacked={false} onClick={() => onRotate(ROTATE_STEP)}>
                  <RotateCcw className="size-4" aria-hidden />
                </Btn>
                <Btn label="Rotate right" tip="top" stacked={false} onClick={() => onRotate(-ROTATE_STEP)}>
                  <RotateCw className="size-4" aria-hidden />
                </Btn>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] leading-4 font-medium text-fg">Tilt</span>
              <div className="flex">
                <Btn label="Tilt up" tip="top" stacked={false} onClick={() => onTilt(TILT_STEP)}>
                  <ChevronUp className="size-4" aria-hidden />
                </Btn>
                <Btn label="Tilt down" tip="top" stacked={false} onClick={() => onTilt(-TILT_STEP)}>
                  <ChevronDown className="size-4" aria-hidden />
                </Btn>
              </div>
            </div>
          </div>
        )}
        <Group label="Compass">
          <Btn label="Point north" onClick={onResetNorth}>
            <svg viewBox="0 0 16 16" className="size-4" style={{ transform: `rotate(${-bearing}deg)` }} aria-hidden>
              <path d="M8 1.5 11 8H5z" fill="#c62828" />
              <path d="M8 14.5 5 8h6z" fill="currentColor" />
            </svg>
          </Btn>
        </Group>
        <Group label="Zoom">
          <Btn label="Zoom in" onClick={onZoomIn}>
            <Plus className="size-4" aria-hidden />
          </Btn>
          <Btn label="Zoom out" onClick={onZoomOut}>
            <Minus className="size-4" aria-hidden />
          </Btn>
        </Group>
      </div>
    </>
  )
}
