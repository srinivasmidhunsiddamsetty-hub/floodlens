import { AREA_BOOKMARKS } from '../../lib/constants'

interface Props {
  onGo: (id: string, center: [number, number]) => void
  /** The chip just picked, or the area nearest the view when zoomed in. */
  active: string | null
}

/**
 * Quick jumps along the 12.6 km-long city. Camera bookmarks only: the areas have
 * no official boundary, so FloodLens never reports statistics for them.
 * Flat chips (border, no shadow or tint); the selected one gets a 2px accent
 * border and accent text, with 1px less padding so nothing shifts.
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
            onClick={() => onGo(a.id, a.center)}
            aria-current={on ? 'location' : undefined}
            className={`shrink-0 rounded-full bg-surface text-[12px] leading-5 font-medium transition-colors sm:text-[13px] ${
              on
                ? 'border-2 border-accent px-[11px] py-[5px] text-accent sm:px-[15px]'
                : 'border border-line-strong px-3 py-1.5 text-fg hover:border-accent hover:text-accent sm:px-4'
            }`}
          >
            {a.label}
          </button>
        )
      })}
    </nav>
  )
}
