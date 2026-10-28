import { AREA_BOOKMARKS } from '../../lib/constants'

interface Props {
  onGo: (center: [number, number]) => void
}

/**
 * Quick jumps along the 12 km-long city on small screens (larger screens get the
 * AreaLocator). Camera bookmarks only: the areas have no official boundary, so
 * FloodLens never reports statistics for them.
 */
export function AreaBookmarks({ onGo }: Props) {
  return (
    <nav aria-label="Go to area" className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-4.5rem)] items-center gap-1.5 overflow-x-auto">
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
