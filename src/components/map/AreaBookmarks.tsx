import { Navigation } from 'lucide-react'
import { AREA_BOOKMARKS } from '../../lib/constants'

interface Props {
  onGo: (center: [number, number]) => void
}

/**
 * Quick jumps along the 12 km-long city. Camera bookmarks only: the areas have no
 * official boundary, so FloodLens never reports statistics for them.
 */
export function AreaBookmarks({ onGo }: Props) {
  return (
    <nav aria-label="Go to area" className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-4.5rem)] items-center gap-1.5 overflow-x-auto">
      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-[11px] font-medium tracking-[0.06em] text-fg-subtle uppercase shadow-panel sm:inline-flex">
        <Navigation className="size-3" aria-hidden /> Go to
      </span>
      {AREA_BOOKMARKS.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onGo(a.center)}
          className="shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium text-fg shadow-panel transition-colors hover:border-accent hover:text-accent"
        >
          {a.label}
        </button>
      ))}
    </nav>
  )
}
