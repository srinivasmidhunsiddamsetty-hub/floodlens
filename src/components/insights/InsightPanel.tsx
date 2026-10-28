import { AlertTriangle, BookOpen, Crosshair, Loader2, MousePointerClick } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatAcres, formatKm2, formatPercent, formatScenario, formatScenarioLong } from '../../lib/format'
import { comparisonFor, lowLyingByFeet, scenarioByFeet } from '../../lib/manifest'
import type { InspectionState } from '../../hooks/useInspection'
import type { ManifestState } from '../../hooks/useManifest'
import { useAppDispatch, useAppState } from '../../state/AppState'
import { comparePair } from '../../state/reducer'
import type { DataManifest } from '../../types/data'
import { ScenarioAreaChart } from '../charts/ScenarioAreaChart'
import { InspectionCard } from './InspectionCard'

interface Props {
  manifestState: ManifestState
  inspection: InspectionState
  /** The mobile bottom sheet supplies its own header. */
  showHeader?: boolean
}

function Metric({ label, value, unit, sub }: { label: ReactNode; value: string; unit?: string; sub?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-xs leading-4 text-fg-muted">{label}</dt>
      <dd className="shrink-0 text-right">
        <span className="text-[15px] font-semibold text-fg tabular">{value}</span>
        {unit && <span className="ml-1 text-xs text-fg-subtle">{unit}</span>}
        {sub && <span className="block text-[11px] text-fg-subtle tabular">{sub}</span>}
      </dd>
    </div>
  )
}

function Summary({ manifest }: { manifest: DataManifest }) {
  const state = useAppState()
  const pair = comparePair(state)
  const s = scenarioByFeet(manifest, state.scenarioFt)
  if (!s) {
    return <p className="text-sm text-fg-muted">No processed NOAA data for {formatScenario(state.scenarioFt)}.</p>
  }

  if (pair) {
    const c = comparisonFor(manifest, pair[0], pair[1])
    return (
      <p className="text-[13px] leading-5 text-fg-muted">
        Going from <strong className="font-semibold text-flood-strong">{formatScenario(pair[0])}</strong> to{' '}
        <strong className="font-semibold text-compare-strong">{formatScenario(pair[1])}</strong>
        {c ? (
          <>
            {' '}adds <strong className="font-semibold text-fg tabular">{formatKm2(c.areaM2)} km²</strong> ({formatAcres(c.areaM2)}{' '}
            acres) of mapped ocean-connected extent within the study area.
          </>
        ) : (
          <> — the comparison layer for this pair is missing from the processed data.</>
        )}
      </p>
    )
  }

  if (s.feet === 0) {
    return (
      <p className="text-[13px] leading-5 text-fg-muted">
        At <strong className="font-semibold text-fg">today&rsquo;s MHHW (0 ft)</strong> NOAA&rsquo;s mapped extent is mostly existing open water
        and intertidal edges. It is the reference the other scenarios are measured against.
      </p>
    )
  }

  return (
    <p className="text-[13px] leading-5 text-fg-muted">
      At <strong className="font-semibold text-flood-strong">{formatScenarioLong(s.feet)}</strong>, NOAA maps{' '}
      <strong className="font-semibold text-fg tabular">{formatKm2(s.beyondBaselineM2)} km²</strong> ({formatAcres(s.beyondBaselineM2)} acres) of
      ocean-connected inundation in the study area beyond the extent mapped at today&rsquo;s high tide.
    </p>
  )
}

function Metrics({ manifest }: { manifest: DataManifest }) {
  const state = useAppState()
  const s = scenarioByFeet(manifest, state.scenarioFt)
  if (!s) return null
  const idx = manifest.scenarios.indexOf(s)
  const prev = idx > 0 ? manifest.scenarios[idx - 1] : null
  const step = prev ? comparisonFor(manifest, prev.feet, s.feet) : undefined
  const low = state.layers.lowLying ? lowLyingByFeet(manifest, s.feet) : undefined
  const study = manifest.studyArea.areaM2

  return (
    <dl className="divide-y divide-line">
      <Metric
        label={<>Beyond 0 ft extent</>}
        value={formatKm2(s.beyondBaselineM2)}
        unit="km²"
        sub={`${formatAcres(s.beyondBaselineM2)} acres`}
      />
      {prev && step && (
        <Metric
          label={<>Added since {formatScenario(prev.feet)}</>}
          value={`+${formatKm2(step.areaM2)}`}
          unit="km²"
          sub={`${formatAcres(step.areaM2)} acres`}
        />
      )}
      <Metric
        label={
          <>
            Total mapped extent
            <span className="block text-[11px] text-fg-subtle">incl. existing water · of {formatKm2(study)} km² study area</span>
          </>
        }
        value={formatKm2(s.areaM2)}
        unit="km²"
        sub={formatPercent(s.areaM2 / study)}
      />
      {low && (
        <Metric
          label={
            <>
              Low-lying, not ocean-connected
              <span className="block text-[11px] text-fg-subtle">reported separately, not in totals above</span>
            </>
          }
          value={formatKm2(low.areaM2)}
          unit="km²"
        />
      )}
    </dl>
  )
}

export function InsightPanel({ manifestState, inspection, showHeader = true }: Props) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const pair = comparePair(state)

  return (
    <div className="flex h-full flex-col">
      {showHeader ? (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-[15px] font-semibold text-fg">Exposure insights</h2>
          <span className="rounded-full border border-flood/40 bg-flood/10 px-2 py-0.5 text-xs font-medium text-flood-strong tabular">
            {pair ? `${formatScenario(pair[0])} → ${formatScenario(pair[1])}` : formatScenario(state.scenarioFt)}
          </span>
        </div>
      ) : (
        <h2 className="sr-only">Exposure insights</h2>
      )}

      <div className={`scrollbar-thin h-full flex-1 space-y-5 overflow-y-auto px-5 pb-5 ${showHeader ? '' : 'pt-4'}`}>
        {manifestState.status === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-fg-muted" role="status">
            <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Loading processed NOAA data…
          </p>
        )}

        {manifestState.status === 'error' && (
          <div role="alert" className="rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-fg">
              <AlertTriangle className="size-4 text-danger" aria-hidden /> Inundation data unavailable
            </p>
            <p className="mt-1 text-xs leading-5 text-fg-muted">{manifestState.error}</p>
            <p className="mt-2 text-xs leading-5 text-fg-subtle">
              No inundation extents or areas are shown. FloodLens never substitutes estimated or sample data.
            </p>
          </div>
        )}

        {manifestState.status === 'ready' && (
          <>
            <Summary manifest={manifestState.manifest} />
            <Metrics manifest={manifestState.manifest} />
            <ScenarioAreaChart
              scenarios={manifestState.manifest.scenarios}
              selectedFt={state.scenarioFt}
              pair={pair}
              onSelect={(feet) => dispatch({ type: 'setScenario', feet })}
            />
          </>
        )}

        {state.selection ? (
          <InspectionCard
            selection={state.selection}
            inspection={inspection}
            scenarioFt={state.scenarioFt}
            onClear={() => dispatch({ type: 'select', selection: null })}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong p-4 text-xs text-fg-muted">
            <p className="flex items-center gap-2 text-[13px] font-medium text-fg">
              <MousePointerClick className="size-4 text-accent" aria-hidden /> Inspect a location
            </p>
            <p className="mt-1 leading-5">
              Click the map or a building to see which scenarios&rsquo; mapped extents include it.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'inspectCenter' })}
              className="btn-ghost mt-2 -ml-2 h-7 text-xs text-accent hover:text-accent-strong"
            >
              <Crosshair className="size-3.5" aria-hidden /> Inspect map center
            </button>
          </div>
        )}

        {manifestState.status === 'ready' && (
          <section aria-labelledby="notes-title" className="border-t border-line pt-4 text-xs leading-5 text-fg-muted">
            <h3 id="notes-title" className="section-title mb-2">
              About these numbers
            </h3>
            <ul className="list-disc space-y-1 pl-4 marker:text-fg-subtle">
              <li>
                <span className="text-fg">Measure:</span> geodesic area of NOAA polygons clipped to the{' '}
                {formatKm2(manifestState.manifest.studyArea.areaM2)} km² study area.
              </li>
              <li>
                <span className="text-fg">Source:</span> NOAA Office for Coastal Management, Sea Level Rise Viewer data (
                {manifestState.manifest.source.geography}, {manifestState.manifest.source.publicationYear}).
              </li>
              <li>
                <span className="text-fg">Use:</span> screening-level comparison of mapped extents, not property-level risk, depth, timing
                or storm surge.
              </li>
            </ul>
            <button
              type="button"
              onClick={() => dispatch({ type: 'openDialog', dialog: 'about' })}
              className="btn-ghost mt-2 -ml-2 h-7 text-xs text-accent hover:text-accent-strong"
            >
              <BookOpen className="size-3.5" aria-hidden /> Read about the data &amp; limitations
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
