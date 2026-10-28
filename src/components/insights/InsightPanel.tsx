import { AlertTriangle, ArrowRight, Loader2, MousePointerClick } from 'lucide-react'
import { formatAcres, formatKm2, formatScenario } from '../../lib/format'
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

  return (
    <div className="flex h-full flex-col">
      {showHeader ? (
        <div className="px-5 pt-5 pb-1">
          <h2 className="t-title">Insights</h2>
        </div>
      ) : (
        <h2 className="sr-only">Insights</h2>
      )}

      <div className={`scrollbar-thin flex-1 space-y-6 overflow-y-auto px-5 pb-5 ${showHeader ? 'pt-3' : 'pt-4'}`}>
        {manifestState.status === 'loading' && (
          <p className="flex items-center gap-2 t-body" role="status">
            <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Loading NOAA data…
          </p>
        )}

        {manifestState.status === 'error' && (
          <div role="alert" className="rounded border border-danger/40 bg-danger/5 p-4">
            <p className="flex items-center gap-2 t-heading">
              <AlertTriangle className="size-4 text-danger" aria-hidden /> Inundation data unavailable
            </p>
            <p className="mt-1 t-body">{manifestState.error}</p>
            <p className="mt-2 t-caption">No flood extents or areas are shown. FloodLens never substitutes estimated or sample data.</p>
          </div>
        )}

        {manifestState.status === 'ready' && s && (
          <>
            {/* Hero metric */}
            <section aria-label="Headline">
              <p className="t-overline">Flooded beyond today’s high tide</p>
              {s.feet === 0 ? (
                <>
                  <p className="mt-1 t-metric">Reference</p>
                  <p className="mt-1 t-body">Today’s high tide. Raise the sea level to see how far water reaches onto land.</p>
                </>
              ) : (
                <>
                  <p className="mt-1">
                    <span className="t-metric">{formatKm2(s.beyondBaselineM2)}</span>
                    <span className="ml-1 text-base text-fg-muted">km²</span>
                  </p>
                  <p className="mt-0.5 t-body">
                    ≈ {formatAcres(s.beyondBaselineM2)} acres of South Beach at {formatScenario(s.feet)}
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
                          } ${shown ? '' : 'opacity-50'}`}
                        >
                          <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: bandColor(b.feet) }} />
                          <span className="flex-1 t-label text-fg">{formatScenario(b.feet)} adds</span>
                          <span className="text-[13px] text-fg tabular">{formatKm2(b.addedM2)} km²</span>
                          <span className="w-16 text-right t-caption tabular">{formatAcres(b.addedM2)} ac</span>
                        </button>
                      </li>
                    )
                  })}
              </ul>
              {low && (
                <p className="mt-2 flex items-center gap-2 t-caption">
                  <span className="h-3 w-3 shrink-0 rounded-sm border border-dashed border-lowlying bg-lowlying/20" aria-hidden />
                  Plus {formatKm2(low.areaM2)} km² low-lying, not ocean-connected (not counted above)
                </p>
              )}
            </section>
          </>
        )}

        {/* Selection */}
        {state.selection ? (
          <InspectionCard
            selection={state.selection}
            inspection={inspection}
            scenarioFt={state.scenarioFt}
            onClear={() => dispatch({ type: 'select', selection: null })}
          />
        ) : (
          manifestState.status === 'ready' && (
            <div className="flex items-start gap-3 rounded border border-dashed border-line-strong px-4 py-3">
              <MousePointerClick className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <p className="t-body">
                <span className="text-fg">Select a building or place</span> on the map to see the water level that first reaches it.
              </p>
            </div>
          )
        )}

        {manifestState.status === 'ready' && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'openDialog', dialog: 'about' })}
            className="flex w-full items-center justify-between border-t border-line pt-4 text-left t-label text-accent hover:text-accent-strong"
          >
            Data sources &amp; limitations
            <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
