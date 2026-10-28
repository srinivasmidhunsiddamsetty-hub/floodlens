import { BookOpen, Database, MapPin, SlidersHorizontal } from 'lucide-react'
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
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
      {!isDesktop && (
        <button
          type="button"
          className="btn-ghost size-9 justify-center px-0"
          aria-label={controlsOpen ? 'Close sea level and layers' : 'Open sea level and layers'}
          aria-expanded={controlsOpen}
          aria-controls="control-panel"
          onClick={() => dispatch({ type: 'setPanel', panel: 'controls', open: !controlsOpen })}
        >
          <SlidersHorizontal className="size-4.5" aria-hidden />
        </button>
      )}

      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark size={30} />
        <h1 className="t-title">FloodLens</h1>
      </div>

      <div className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden />

      <p className="hidden min-w-0 items-center gap-1.5 truncate t-body md:flex">
        <MapPin className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
        <span className="truncate">{LOCATION_LABEL}</span>
      </p>

      <nav aria-label="Data" className="ml-auto flex items-center gap-0.5">
        <button type="button" className="btn-ghost" onClick={() => dispatch({ type: 'openDialog', dialog: 'about' })}>
          <BookOpen className="size-4" aria-hidden />
          <span className="hidden lg:inline">About the data</span>
          <span className="sr-only lg:hidden">About the data</span>
        </button>
        <button type="button" className="btn-ghost" onClick={() => dispatch({ type: 'openDialog', dialog: 'sources' })}>
          <Database className="size-4" aria-hidden />
          <span className="hidden lg:inline">Sources</span>
          <span className="sr-only lg:hidden">Data sources</span>
        </button>
      </nav>
    </header>
  )
}
