import { AlertTriangle, Loader2, MousePointerClick } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { InspectionState } from '../../hooks/useInspection'
import type { ManifestState } from '../../hooks/useManifest'
import { useAppDispatch, useAppState } from '../../state/AppState'
import { InspectionCard } from './InspectionCard'

interface Props {
  manifestState: ManifestState
  inspection: InspectionState
}

/**
 * Insights is only about what you pick on the map (v0.36): the selected building or spot, or a
 * short prompt when nothing is picked. The city-wide "Land underwater" card (figures, chart and
 * what each foot adds) moved to the Sea level card on the left as its two figures.
 */
export function InsightPanel({ manifestState, inspection }: Props) {
  const state = useAppState()
  const dispatch = useAppDispatch()

  // A new selection is the user's latest question: bring its answer into view.
  const scrollRef = useRef<HTMLDivElement>(null)
  const selection = state.selection
  useEffect(() => {
    if (selection) scrollRef.current?.scrollTo({ top: 0 })
  }, [selection])

  // The selection card and its empty state share the top slot, so the answer always appears in the same place.
  const card = selection ? (
    <InspectionCard
      selection={selection}
      inspection={inspection}
      scenarioFt={state.scenarioFt}
      onClear={() => dispatch({ type: 'select', selection: null })}
    />
  ) : manifestState.status === 'ready' ? (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-dashed border-[#d3d9e2] bg-surface px-4 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eceef1] text-[#1f2937]" aria-hidden>
        <MousePointerClick className="size-4" />
      </span>
      <p className="t-body">
        <span className="font-medium text-fg">Click any building</span> to see when water would reach it.
      </p>
    </div>
  ) : null

  // The cards float over the map with no panel behind them (v0.34): no background, and only the
  // cards take clicks, so the map runs on under and around them. Soft shadows, not borders (v0.25).
  return (
    <div className="flex h-full flex-col">
      {/* No visible title: the card and the block headers already say what this is,
          and the space goes to content. Screen readers still get the heading. */}
      <h2 className="sr-only">Insights</h2>

      <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-3">
        {card}

        {manifestState.status === 'loading' && (
          <p className="pointer-events-auto mt-4 flex items-center gap-2 t-body" role="status">
            <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Loading flood data…
          </p>
        )}

        {manifestState.status === 'error' && (
          <div role="alert" className="pointer-events-auto mt-4 rounded border border-danger/40 bg-surface p-4">
            <p className="flex items-center gap-2 t-heading">
              <AlertTriangle className="size-4 text-danger" aria-hidden /> The flood data didn’t load
            </p>
            <p className="mt-1 t-body">{manifestState.error}</p>
            <p className="mt-2 t-caption">We’d rather show nothing than guess, so FloodLens never fills the gap with estimates or sample data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
