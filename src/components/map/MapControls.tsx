import { Focus, Minus, Plus } from 'lucide-react'
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
}

function Group({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="group" aria-label={label} className="glass flex flex-col overflow-hidden rounded-xl border border-white/80">
      {children}
    </div>
  )
}

function Btn({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={`grid size-8 place-items-center border-line text-fg-muted transition-colors not-first:border-t hover:bg-surface-3 hover:text-fg focus-visible:outline-offset-[-2px] ${
        pressed ? 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent' : ''
      }`}
    >
      {children}
    </button>
  )
}

/** Map navigation in the ArcGIS/komoot pattern: zoom, orientation, full extent, then perspective. */
export function MapControls({ viewMode, bearing, pitch, zoom, onZoomIn, onZoomOut, onResetNorth, onShowAll, onSetMode }: Props) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2" data-pitch={Math.round(pitch)} data-bearing={Math.round(bearing)} data-zoom={zoom.toFixed(1)}>
      <Group label="Zoom">
        <Btn label="Zoom in" onClick={onZoomIn}>
          <Plus className="size-4" aria-hidden />
        </Btn>
        <Btn label="Zoom out" onClick={onZoomOut}>
          <Minus className="size-4" aria-hidden />
        </Btn>
      </Group>
      <Group label="Orientation">
        <Btn label="Point north" onClick={onResetNorth}>
          <svg viewBox="0 0 16 16" className="size-4" style={{ transform: `rotate(${-bearing}deg)` }} aria-hidden>
            <path d="M8 1.5 11 8H5z" fill="#c62828" />
            <path d="M8 14.5 5 8h6z" fill="currentColor" />
          </svg>
        </Btn>
        <Btn label="Show all of Miami Beach" onClick={onShowAll}>
          <Focus className="size-4" aria-hidden />
        </Btn>
      </Group>
      <Group label="Perspective">
        <Btn label="2D view" pressed={viewMode === '2d'} onClick={() => onSetMode('2d')}>
          <span className="text-[11px] font-medium">2D</span>
        </Btn>
        <Btn label="3D view" pressed={viewMode === '3d'} onClick={() => onSetMode('3d')}>
          <span className="text-[11px] font-medium">3D</span>
        </Btn>
      </Group>
    </div>
  )
}
