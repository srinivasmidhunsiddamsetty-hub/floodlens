import { BookOpen, Database, MapPin } from 'lucide-react'
import { LOCATION_LABEL } from '../../lib/constants'
import { useAppDispatch } from '../../state/AppState'
import { BrandMark } from './BrandMark'

export function TopBar() {
  const dispatch = useAppDispatch()
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 bg-surface px-4 shadow-[var(--shadow-header)]">
      <div className="flex min-w-0 items-center gap-2.5">
        <BrandMark size={30} />
        <h1 className="t-title font-bold tracking-[-0.015em]">FloodLens</h1>
      </div>

      <div className="mx-1 h-5 w-px bg-line" aria-hidden />

      <p className="flex min-w-0 items-center gap-1.5 truncate t-body">
        <MapPin className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
        <span className="truncate">{LOCATION_LABEL}</span>
      </p>

      <nav aria-label="Data" className="ml-auto flex items-center gap-0.5">
        <button type="button" className="btn-ghost" onClick={() => dispatch({ type: 'openDialog', dialog: 'about' })}>
          <BookOpen className="size-4" aria-hidden />
          About the data
        </button>
        <button type="button" className="btn-ghost" onClick={() => dispatch({ type: 'openDialog', dialog: 'sources' })}>
          <Database className="size-4" aria-hidden />
          Sources
        </button>
      </nav>
    </header>
  )
}
