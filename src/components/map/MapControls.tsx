import { ChevronDown, ChevronUp, Maximize, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
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

function Group({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="glass flex flex-col rounded-xl border border-white/80">
      {children}
    </div>
  )
}

/**
 * A map button with its name in a tooltip on hover and keyboard focus (v0.34), so every
 * control says what it does without a click. The tooltip opens to the left, away from the map
 * edge. In a column group: a divider above every button but the first, and the group's corners.
 */
function Btn({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`group/btn relative grid size-8 place-items-center border-line text-fg-muted transition-colors not-first:border-t first:rounded-t-xl last:rounded-b-xl hover:bg-surface-3 hover:text-fg focus-visible:outline-offset-[-2px] ${
        pressed ? 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent' : ''
      }`}
    >
      {children}
      {/* Group overflow stays visible so the tooltip isn't clipped; hence the corners above. */}
      <span
        aria-hidden
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
 * Below this window height the column and a place's card would meet, so the controls split into
 * two columns: 56 (top bar) + 16 + about 322 (the tallest usual card) + 12 + 360 (column, in 3D)
 * + 16 px needs about 790 px; 800 leaves a margin.
 */
const SHORT_WINDOW = '(max-height: 800px)'

/**
 * Map navigation (v0.38): at the screen's right edge, in the corner under the Insights card, 16 px
 * from both edges (v0.37 had it at the edge of the visible map, left of the card's column). From
 * the top: 2D over 3D, back to the whole city, then in 3D a pair to turn and a pair to tilt (not
 * every trackpad or mouse can), then the compass and zoom. On short windows it splits into two
 * columns so it never runs into the card. v0.35–v0.36 had a round dial; v0.34 a labelled panel.
 */
export function MapControls({ viewMode, bearing, pitch, zoom, onZoomIn, onZoomOut, onResetNorth, onShowAll, onSetMode, onRotate, onTilt }: Props) {
  const short = useMediaQuery(SHORT_WINDOW)
  const perspective = (
    <Group label="Perspective">
      <Btn label="2D view" pressed={viewMode === '2d'} onClick={() => onSetMode('2d')}>
        <span className="text-[11px] font-medium">2D</span>
      </Btn>
      <Btn label="3D view" pressed={viewMode === '3d'} onClick={() => onSetMode('3d')}>
        <span className="text-[11px] font-medium">3D</span>
      </Btn>
    </Group>
  )
  const home = (
    <Group label="Default view">
      {/* Frame corners, the usual "fit to view" symbol (v0.40): the owner found the house
          (v0.34–v0.39) misleading, since the button fits the whole city rather than going home. */}
      <Btn label="Entire Miami Beach" onClick={onShowAll}>
        <Maximize className="size-4" aria-hidden />
      </Btn>
    </Group>
  )
  const turnAndTilt = viewMode === '3d' && (
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
  const compassAndZoom = (
    <>
      <Group label="Compass">
        <Btn label="Point north" onClick={onResetNorth}>
          <Needle bearing={bearing} />
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
    </>
  )
  return (
    <div
      className="pointer-events-auto absolute right-4 bottom-4 z-10 flex items-end gap-2"
      data-pitch={Math.round(pitch)}
      data-bearing={Math.round(bearing)}
      data-zoom={zoom.toFixed(1)}
    >
      {short ? (
        // Two columns: how you look at the map on the left, where you are on the right.
        <>
          <div className="flex flex-col gap-2">
            {perspective}
            {turnAndTilt}
          </div>
          <div className="flex flex-col gap-2">
            {home}
            {compassAndZoom}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {perspective}
          {home}
          {turnAndTilt}
          {compassAndZoom}
        </div>
      )}
    </div>
  )
}
