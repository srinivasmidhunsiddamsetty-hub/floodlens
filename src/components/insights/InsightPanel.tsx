import { AlertTriangle, ArrowRight, Loader2, MousePointerClick } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { formatAcres, formatKm2, formatPercent, formatScenario } from '../../lib/format'
import { lowLyingByFeet, scenarioByFeet, type FloodBand } from '../../lib/manifest'
import { bandColor } from '../../lib/theme'
import type { InspectionState } from '../../hooks/useInspection'
import type { ManifestState } from '../../hooks/useManifest'
import { useAppDispatch, useAppState } from '../../state/AppState'
import { ScenarioAreaChart } from '../charts/ScenarioAreaChart'
import { InspectionCard } from './InspectionCard'

interface Props {
  manifestState: ManifestState
  inspection: InspectionState
  bands: FloodBand[]
  highlightFt: number | null
  onHighlight: (ft: number | null) => void
  /** The mobile bottom sheet supplies its own header. */
  showHeader?: boolean
}

export function InsightPanel({ manifestState, inspection, bands, highlightFt, onHighlight, showHeader = true }: Props) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const manifest = manifestState.manifest
  const s = manifest ? scenarioByFeet(manifest, state.scenarioFt) : undefined
  const low = manifest && state.layers.lowLying ? lowLyingByFeet(manifest, state.scenarioFt) : undefined
  const landM2 = manifest?.studyArea.boundary?.censusLandM2

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
      onShowLevel={(feet) => dispatch({ type: 'setScenario', feet })}
    />
  ) : manifestState.status === 'ready' ? (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#ffeedf] text-[#d65a00]" aria-hidden>
        <MousePointerClick className="size-4" />
      </span>
      <p className="t-body">
        <span className="font-medium text-fg">Click any building</span> to see when water would reach it.
      </p>
    </div>
  ) : null

  return (
    <div className="flex h-full flex-col">
      {showHeader ? (
        <div className="px-5 pt-5 pb-1">
          <h2 className="t-title">Insights</h2>
        </div>
      ) : (
        <h2 className="sr-only">Insights</h2>
      )}

      <div ref={scrollRef} className={`scrollbar-thin flex-1 space-y-6 overflow-y-auto px-5 pb-5 ${showHeader ? 'pt-3' : 'pt-4'}`}>
        {card}

        {manifestState.status === 'loading' && (
          <p className="flex items-center gap-2 t-body" role="status">
            <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Loading flood data…
          </p>
        )}

        {manifestState.status === 'error' && (
          <div role="alert" className="rounded border border-danger/40 bg-danger/5 p-4">
            <p className="flex items-center gap-2 t-heading">
              <AlertTriangle className="size-4 text-danger" aria-hidden /> The flood data didn’t load
            </p>
            <p className="mt-1 t-body">{manifestState.error}</p>
            <p className="mt-2 t-caption">We’d rather show nothing than guess, so FloodLens never fills the gap with estimates or sample data.</p>
          </div>
        )}

        {manifestState.status === 'ready' && s && (
          <>
            {/* Hero metric */}
            <section aria-label="Headline">
              {/* "Land" carries "newly": it means ground that is dry at today's high tide. */}
              <p className="t-overline">{s.feet === 0 ? 'Today’s high tide' : `Land underwater at ${formatScenario(s.feet)}`}</p>
              {s.feet === 0 ? (
                <>
                  <p className="mt-1 t-metric">Where we start</p>
                  <p className="mt-1 t-body">This is how far high tide reaches today. Raise the sea level to see what changes.</p>
                </>
              ) : (
                <>
                  <p className="mt-1">
                    <span className="t-metric">{formatKm2(s.beyondBaselineM2)}</span>
                    <span className="ml-1 text-base text-fg-muted">km²</span>
                  </p>
                  <p className="mt-0.5 t-body">
                    About {formatAcres(s.beyondBaselineM2)} acres
                    {landM2 ? <>, roughly {formatPercent(s.beyondBaselineM2 / landM2, true)} of the city’s land</> : null}
                  </p>
                </>
              )}
            </section>

            {/* Chart */}
            <ScenarioAreaChart
              bands={bands}
              selectedFt={state.scenarioFt}
              highlightFt={highlightFt}
              onHighlight={onHighlight}
              onSelect={(feet) => dispatch({ type: 'setScenario', feet })}
            />

            {/* Breakdown — doubles as the chart's key; hover to spotlight a band on the map */}
            <section aria-labelledby="breakdown-title">
              <h3 id="breakdown-title" className="sr-only">
                Area added by each foot
              </h3>
              <ul className="-mx-2" onMouseLeave={() => onHighlight(null)}>
                {bands
                  .filter((b) => !b.isReference)
                  .map((b) => {
                    // Only levels on the map can be spotlighted there, but every row
                    // stays at full strength: the numbers hold at any slider position.
                    const shown = b.feet <= state.scenarioFt
                    return (
                      <li key={b.feet}>
                        <button
                          type="button"
                          onMouseEnter={() => shown && onHighlight(b.feet)}
                          onFocus={() => shown && onHighlight(b.feet)}
                          onBlur={() => onHighlight(null)}
                          onClick={() => dispatch({ type: 'setScenario', feet: b.feet })}
                          className={`flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition-colors hover:bg-surface-2 ${
                            highlightFt === b.feet ? 'bg-surface-2' : ''
                          }`}
                        >
                          <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: bandColor(b.feet) }} />
                          <span className="flex-1 t-label text-fg">{formatScenario(b.feet)} adds</span>
                          <span className="text-[13px] text-fg tabular">{formatKm2(b.addedM2)} km²</span>
                          <span className="w-[74px] text-right t-caption tabular">{formatAcres(b.addedM2)} acres</span>
                        </button>
                      </li>
                    )
                  })}
              </ul>
              {low && (
                <p className="mt-2 flex items-center gap-2 t-caption">
                  <span className="h-3 w-3 shrink-0 rounded-sm border border-dashed border-lowlying bg-lowlying/20" aria-hidden />
                  Plus {formatKm2(low.areaM2)} km² of low spots cut off from the sea, not counted above
                </p>
              )}
            </section>
          </>
        )}

        {manifestState.status === 'ready' && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'openDialog', dialog: 'about' })}
            className="flex w-full items-center justify-between border-t border-line pt-4 text-left t-label text-accent hover:text-accent-strong"
          >
            What this map can and can’t tell you
            <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
