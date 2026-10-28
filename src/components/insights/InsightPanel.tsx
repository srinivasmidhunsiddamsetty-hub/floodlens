import { AlertTriangle, ArrowRight, Loader2, MousePointerClick, Waves } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { AREA_UNITS, formatArea, formatPercent, formatScenario } from '../../lib/format'
import { lowLyingByFeet, scenarioByFeet, type FloodBand } from '../../lib/manifest'
import { bandColor } from '../../lib/theme'
import type { InspectionState } from '../../hooks/useInspection'
import type { ManifestState } from '../../hooks/useManifest'
import { useAppDispatch, useAppState } from '../../state/AppState'
import { ScenarioAreaChart } from '../charts/ScenarioAreaChart'
import { AreaUnitToggle } from '../ui/AreaUnitToggle'
import { Swatch } from '../ui/Swatch'
import { InspectionCard } from './InspectionCard'

interface Props {
  manifestState: ManifestState
  inspection: InspectionState
  bands: FloodBand[]
  highlightFt: number | null
  onHighlight: (ft: number | null) => void
}

export function InsightPanel({ manifestState, inspection, bands, highlightFt, onHighlight }: Props) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const manifest = manifestState.manifest
  const s = manifest ? scenarioByFeet(manifest, state.scenarioFt) : undefined
  // Low spots are listed only while their map layer is on, so the panel matches the map.
  const low = manifest && state.layers.lowLying ? lowLyingByFeet(manifest, state.scenarioFt) : undefined
  const unit = state.areaUnit
  const unitShort = AREA_UNITS[unit].short
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
      {/* No visible title: the card and the block headers already say what this is,
          and the space goes to content. Screen readers still get the heading. */}
      <h2 className="sr-only">Insights</h2>

      <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-3">
        {card}

        {manifestState.status === 'loading' && (
          <p className="mt-4 flex items-center gap-2 t-body" role="status">
            <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Loading flood data…
          </p>
        )}

        {manifestState.status === 'error' && (
          <div role="alert" className="mt-4 rounded border border-danger/40 bg-danger/5 p-4">
            <p className="flex items-center gap-2 t-heading">
              <AlertTriangle className="size-4 text-danger" aria-hidden /> The flood data didn’t load
            </p>
            <p className="mt-1 t-body">{manifestState.error}</p>
            <p className="mt-2 t-caption">We’d rather show nothing than guess, so FloodLens never fills the gap with estimates or sample data.</p>
          </div>
        )}

        {manifestState.status === 'ready' && s && (
          <>
            {/* One tile for everything the km² / acres switch controls: the figures at the
                chosen level, then every level in the chart, with what each foot adds. */}
            <section aria-labelledby="summary-title" className="mt-2.5 rounded-xl border border-line bg-surface px-3 pt-3 pb-1.5">
              <div className="flex items-center justify-between gap-3">
                <h3 id="summary-title" className="flex items-center gap-2 t-heading font-semibold">
                  <Waves className="size-4 shrink-0 text-accent" aria-hidden />
                  Land underwater
                </h3>
                <AreaUnitToggle value={unit} onChange={(u) => dispatch({ type: 'setAreaUnit', unit: u })} />
              </div>
              {s.feet === 0 ? (
                <p className="mt-2 t-body">None yet. Today’s high tide is where we start: raise the sea level to see what changes.</p>
              ) : (
                // "Land" carries "newly": it means ground that is dry at today's high tide.
                <dl className={`mt-2 grid divide-x divide-line ${landM2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="flex flex-col-reverse pr-3">
                    <dt className="t-caption">at {formatScenario(s.feet)}</dt>
                    <dd className="flex items-baseline gap-1">
                      <span className="text-[24px] leading-7 font-medium tracking-tight text-fg tabular">{formatArea(s.beyondBaselineM2, unit)}</span>
                      <span className="text-[13px] text-fg-muted">{unitShort}</span>
                    </dd>
                  </div>
                  {landM2 ? (
                    <div className="flex flex-col-reverse pl-4">
                      <dt className="t-caption">of the city’s land</dt>
                      <dd className="text-[24px] leading-7 font-medium tracking-tight text-fg tabular">
                        {formatPercent(s.beyondBaselineM2 / landM2, true)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              )}

              <div className="mt-3 border-t border-line pt-3">
                <ScenarioAreaChart
                  bands={bands}
                  unit={unit}
                  selectedFt={state.scenarioFt}
                  highlightFt={highlightFt}
                  onHighlight={onHighlight}
                  onSelect={(feet) => dispatch({ type: 'setScenario', feet })}
                />

                {/* Breakdown: doubles as the chart's key; hover to spotlight a band on the map */}
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
                              className={`flex w-full items-center gap-3 rounded px-2 py-[3px] text-left transition-colors hover:bg-surface-2 ${
                                highlightFt === b.feet ? 'bg-surface-2' : ''
                              }`}
                            >
                              <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: bandColor(b.feet) }} />
                              <span className="flex-1 t-label text-fg">{formatScenario(b.feet)} adds</span>
                              <span className="text-[13px] text-fg tabular">
                                {formatArea(b.addedM2, unit)} {unitShort}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                  </ul>
                  {low && (
                    <div className="mt-1.5 border-t border-line pt-2">
                      <p className="flex items-center gap-3">
                        <span className="shrink-0" aria-hidden>
                          <Swatch kind="lowLying" size={12} />
                        </span>
                        <span className="flex-1 t-label text-fg">Low spots {low.feet === 0 ? 'today' : `at ${formatScenario(low.feet)}`}</span>
                        <span className="text-[13px] text-fg tabular">
                          {formatArea(low.areaM2, unit)} {unitShort}
                        </span>
                      </p>
                      {/* Full width under the label, so it stays on one line */}
                      <p className="pl-6 t-caption">Cut off from the sea, so not counted above</p>
                    </div>
                  )}
                </section>
              </div>
            </section>
          </>
        )}

      </div>

      {/* Pinned footer: always at the bottom of the panel, however much content is above it. */}
      {manifestState.status === 'ready' && (
        <div className="shrink-0 border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={() => dispatch({ type: 'openDialog', dialog: 'about' })}
            className="flex w-full items-center justify-between text-left t-label text-accent hover:text-accent-strong"
          >
            What this map can and can’t tell you
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
