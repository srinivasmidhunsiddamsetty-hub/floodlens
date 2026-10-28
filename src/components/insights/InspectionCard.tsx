import { Building2, Loader2, MapPin, Waves, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatCoord, formatMeters, formatScenario, formatSmallArea } from '../../lib/format'
import { bandColor } from '../../lib/theme'
import type { InspectionState } from '../../hooks/useInspection'
import type { Selection } from '../../state/reducer'

interface Props {
  selection: Selection
  inspection: InspectionState
  scenarioFt: number
  onClear: () => void
}

const levelName = (ft: number) => (ft === 0 ? 'Today' : formatScenario(ft))

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="t-caption">{label}</dt>
      <dd className="text-right text-[13px] text-fg tabular">{children}</dd>
    </div>
  )
}

/**
 * Selected building / location. Hierarchy: what it is → the answer (first
 * water level that reaches it) → the level-by-level ladder → supporting facts →
 * the caveat. Wording stays at "within NOAA's mapped extent", never "will flood".
 */
export function InspectionCard({ selection, inspection, scenarioFt, onClear }: Props) {
  const { building, street, lngLat, insideStudyArea, onWater } = selection
  const title = building ? 'Building' : onWater ? 'Water' : 'Location'
  const Icon = building ? Building2 : onWater ? Waves : MapPin

  return (
    <section aria-labelledby="insp-title" className="overflow-hidden rounded border border-line bg-surface shadow-panel animate-slide-up">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4">
        <span className="grid size-9 shrink-0 place-items-center rounded bg-[#fff1e3] text-[#b85a00]">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="insp-title" className="t-heading">
            {title}
            {street && <span className="font-normal text-fg-muted"> near {street.name}</span>}
          </h3>
          <p className="t-caption tabular">
            {street ? `${formatMeters(street.distanceM)} from street · ` : ''}
            {formatCoord(lngLat[0], lngLat[1])}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="btn-ghost -mt-1 -mr-2 size-8 justify-center px-0"
          aria-label="Clear selection (Esc)"
          title="Clear selection (Esc)"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="px-4 pt-3 pb-4">
        {!insideStudyArea && (
          <p className="rounded bg-surface-2 px-3 py-2.5 t-body">
            Outside the study area. NOAA data were only processed inside the dashed boundary.
          </p>
        )}

        {insideStudyArea && inspection.status === 'loading' && (
          <p className="flex items-center gap-2 t-body" role="status">
            <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Checking every water level…
          </p>
        )}

        {insideStudyArea && inspection.status === 'error' && (
          <p className="t-body text-danger" role="alert">
            Could not check water levels: {inspection.error}
          </p>
        )}

        {insideStudyArea && inspection.status === 'ready' && (() => {
          const { hits, firstFeet, lowHits, lowPartAreaM2 } = inspection.result
          const reachedNow = firstFeet !== null && firstFeet <= scenarioFt
          const lowAt = lowHits.filter((h) => h.within).map((h) => levelName(h.feet))
          return (
            <div aria-live="polite">
              {/* Answer */}
              <div
                className="rounded px-3 py-2.5"
                style={{ background: firstFeet === null ? '#f3f3f3' : `${bandColor(firstFeet)}14`, borderLeft: `4px solid ${firstFeet === null ? '#c9c9c9' : bandColor(firstFeet)}` }}
              >
                <p className="t-overline">First reached</p>
                <p className="t-metric text-[22px] leading-7">
                  {firstFeet === null ? 'Not up to +3 ft' : firstFeet === 0 ? 'Today' : `at ${formatScenario(firstFeet)}`}
                </p>
                <p className="t-caption mt-0.5">
                  {firstFeet === null
                    ? `Outside NOAA’s mapped extent at every level up to ${levelName(hits.at(-1)?.feet ?? 0)}.`
                    : reachedNow
                      ? `Within the mapped extent at the selected level (${levelName(scenarioFt)}).`
                      : `Not yet at the selected level (${levelName(scenarioFt)}).`}
                </p>
              </div>

              {/* Ladder */}
              <ol className="mt-3 grid grid-flow-col items-end gap-1" aria-label="Within NOAA’s mapped extent, by water level">
                {hits.map((h) => (
                  <li key={h.feet} className="flex flex-col items-center gap-1">
                    <span
                      className={`w-full rounded-sm ${h.feet === scenarioFt ? 'h-3.5' : 'h-2.5'}`}
                      style={{ background: h.within && firstFeet !== null ? bandColor(firstFeet) : '#e6e6e6' }}
                      aria-hidden
                    />
                    <span className={`text-[11px] tabular ${h.feet === scenarioFt ? 'font-medium text-fg' : 'text-fg-subtle'}`}>
                      {levelName(h.feet)}
                    </span>
                    <span className="sr-only">{h.within ? 'within mapped extent' : 'outside mapped extent'}</span>
                  </li>
                ))}
              </ol>

              {/* Facts */}
              <dl className="mt-3 divide-y divide-line border-t border-line">
                {building && (
                  <>
                    <Row label="Height">
                      {building.renderHeightM !== null ? `≈ ${Math.round(building.renderHeightM)} m` : '—'}
                      <span className="block t-caption">OpenStreetMap, may be estimated</span>
                    </Row>
                    <Row label="Footprint">≈ {formatSmallArea(building.footprintAreaM2)}</Row>
                  </>
                )}
                <Row label="Low-lying area">
                  {lowAt.length ? `Yes, from ${lowAt[0]}` : 'No'}
                  {lowAt.length > 0 && lowPartAreaM2 !== null && (
                    <span className="block t-caption">{formatSmallArea(lowPartAreaM2)} patch, not ocean-connected</span>
                  )}
                </Row>
              </dl>

              <p className="mt-3 t-caption leading-4">
                A screening indicator from NOAA’s mapped extents — not a prediction that this {building ? 'building' : 'place'} will
                flood.
              </p>
            </div>
          )
        })()}
      </div>
    </section>
  )
}
