import { AREA_BOOKMARKS } from '../../lib/constants'

interface Props {
  onGo: (center: [number, number]) => void
  /** Bookmark nearest the current view when zoomed in, shown as "you are here". */
  active: string | null
}

/**
 * Quick jumps along the 12.6 km-long city. Camera bookmarks only: the areas have
 * no official boundary, so FloodLens never reports statistics for them.
 */
export function AreaBookmarks({ onGo, active }: Props) {
  return (
    <nav aria-label="Go to area" className="absolute top-4 left-4 z-10 flex max-w-[calc(100%-5.5rem)] items-center gap-1.5 overflow-x-auto sm:gap-2">
      {AREA_BOOKMARKS.map((a) => {
        const on = active === a.id
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onGo(a.center)}
            aria-current={on ? 'location' : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] leading-5 font-medium shadow-panel transition-colors sm:px-4 sm:text-[13px] ${
              on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-fg hover:border-accent hover:text-accent'
            }`}
          >
            {a.label}
          </button>
        )
      })}
    </nav>
  )
}
