import { BookOpen, Database, MapPin, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { LOCATION_LABEL } from '../../lib/constants'
import { useAppDispatch } from '../../state/AppState'
import { BrandMark } from './BrandMark'

interface Props {
  isDesktop: boolean
  controlsOpen: boolean
}

export function TopBar({ isDesktop, controlsOpen }: Props) {
  const dispatch = useAppDispatch()
  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 shadow-sm sm:px-4">
      {!isDesktop && (
        <button
          type="button"
          className="btn-ghost size-9 justify-center px-0"
          aria-label={controlsOpen ? 'Close scenario controls' : 'Open scenario controls'}
          aria-expanded={controlsOpen}
          aria-controls="control-panel"
          onClick={() => dispatch({ type: 'setPanel', panel: 'controls', open: !controlsOpen })}
        >
          <SlidersHorizontal className="size-4.5" aria-hidden />
        </button>
      )}

      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark />
        <div className="min-w-0 leading-tight">
          <h1 className="text-base font-medium text-fg">FloodLens</h1>
          <p className="hidden truncate text-xs text-fg-subtle sm:block">Coastal Exposure Explorer</p>
        </div>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-line md:block" aria-hidden />

      <p className="hidden min-w-0 items-center gap-1.5 truncate text-[13px] text-fg-muted md:flex">
        <MapPin className="size-3.5 shrink-0 text-accent" aria-hidden />
        <span className="truncate">
          {LOCATION_LABEL}
          <span className="text-fg-subtle"> · South Beach study area</span>
        </span>
      </p>

      <nav aria-label="Data and view" className="ml-auto flex items-center gap-0.5">
        <button type="button" className="btn-ghost" onClick={() => dispatch({ type: 'openDialog', dialog: 'sources' })}>
          <Database className="size-4" aria-hidden />
          <span className="hidden lg:inline">Data sources</span>
          <span className="sr-only lg:hidden">Data sources</span>
        </button>
        <button type="button" className="btn-ghost" onClick={() => dispatch({ type: 'openDialog', dialog: 'about' })}>
          <BookOpen className="size-4" aria-hidden />
          <span className="hidden lg:inline">About the data</span>
          <span className="sr-only lg:hidden">About the data</span>
        </button>
        <button
          type="button"
          className="btn-outline ml-2"
          onClick={() => dispatch({ type: 'resetCamera' })}
        >
          <RotateCcw className="size-4" aria-hidden />
          <span className="hidden sm:inline">Reset view</span>
          <span className="sr-only sm:hidden">Reset view</span>
        </button>
      </nav>
    </header>
  )
}
