import { AREA_BOOKMARKS } from '../../lib/constants'

interface Props {
  onGo: (id: string, center: [number, number]) => void
  /** Clicking the lit chip again un-picks it and shows the whole city. */
  onShowAll: () => void
  /** The chip just picked, or the area nearest the view when zoomed in. */
  active: string | null
}

/**
 * Quick jumps along the 12.6 km-long city. Camera bookmarks only: the areas have
 * no official boundary, so FloodLens never reports statistics for them.
 * Frosted chips; the selected one is filled with the accent (v0.27). Clicking it
 * again goes back to all of Miami Beach.
 */
export function AreaBookmarks({ onGo, onShowAll, active }: Props) {
  return (
    <nav aria-label="Go to area" className="pointer-events-auto absolute top-4 left-4 z-10 flex max-w-[calc(100%-5.5rem)] items-center gap-1.5 overflow-x-auto sm:gap-2">
      {AREA_BOOKMARKS.map((a) => {
        const on = active === a.id
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => (on ? onShowAll() : onGo(a.id, a.center))}
            aria-current={on ? 'location' : undefined}
            title={on ? 'Show all of Miami Beach' : undefined}
            className={`glass shrink-0 rounded-full text-[12px] leading-5 font-medium transition-colors sm:text-[13px] ${
              on
                ? 'border border-accent bg-accent px-3 py-1.5 text-white hover:bg-accent-strong sm:px-4'
                : 'border border-white/80 px-3 py-1.5 text-fg hover:border-accent hover:text-accent sm:px-4'
            }`}
          >
            {a.label}
          </button>
        )
      })}
    </nav>
  )
}
