import { Building2, Loader2, MapPin, X } from 'lucide-react'
import { formatCoord, formatMeters, formatScenario, formatSmallArea } from '../../lib/format'
import type { InspectionState } from '../../hooks/useInspection'
import type { Selection } from '../../state/reducer'

interface Props {
  selection: Selection
  inspection: InspectionState
  scenarioFt: number
  onClear: () => void
}

function Dot({ on, tone }: { on: boolean; tone: 'flood' | 'low' }) {
  const color = tone === 'flood' ? 'bg-flood' : 'bg-lowlying'
  return (
    <span
      aria-hidden
      className={`inline-block size-2.5 shrink-0 rounded-full ${on ? color : 'border border-fg-subtle/60 bg-transparent'}`}
    />
  )
}

export function InspectionCard({ selection, inspection, scenarioFt, onClear }: Props) {
  const { building, street, lngLat, insideStudyArea, onWater } = selection
  const subject = building ? 'Building footprint' : 'Location'
  const verb = building ? 'intersects' : 'is within'

  return (
    <section aria-labelledby="insp-title" className="rounded-xl border border-accent/30 bg-surface-2 p-4 animate-slide-up">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {building ? <Building2 className="size-4 text-accent" aria-hidden /> : <MapPin className="size-4 text-accent" aria-hidden />}
          <h3 id="insp-title" className="text-[13px] font-semibold text-fg">
            {building ? 'Selected building' : 'Selected location'}
          </h3>
        </div>
        <button type="button" onClick={onClear} className="rounded p-0.5 text-fg-subtle hover:text-fg" aria-label="Clear selection">
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <dl className="mt-2 space-y-0.5 text-xs">
        {street && (
          <div className="flex gap-1.5">
            <dt className="text-fg-subtle">Near</dt>
            <dd className="text-fg">
              {street.name} <span className="text-fg-subtle">(≈{formatMeters(street.distanceM)}, OSM)</span>
            </dd>
          </div>
        )}
        <div className="flex gap-1.5">
          <dt className="sr-only">Coordinates</dt>
          <dd className="text-xs text-fg-muted tabular">{formatCoord(lngLat[0], lngLat[1])}</dd>
        </div>
        {building && (
          <div className="flex gap-1.5">
            <dt className="text-fg-subtle">Height</dt>
            <dd className="text-fg">
              {building.renderHeightM !== null ? `${Math.round(building.renderHeightM)} m` : 'Not available'}
              <span className="text-fg-subtle"> · OSM-derived, may be estimated</span>
            </dd>
          </div>
        )}
      </dl>

      {!insideStudyArea && (
        <p className="mt-3 rounded-md bg-surface-3 px-2.5 py-2 text-xs text-fg-muted">
          Outside the study area. NOAA data were only processed inside the dashed boundary, so no scenario
          information is shown here.
        </p>
      )}

      {insideStudyArea && onWater && (
        <p className="mt-3 text-xs text-fg-muted">OpenStreetMap draws this point as open water.</p>
      )}

      {insideStudyArea && inspection.status === 'loading' && (
        <p className="mt-3 flex items-center gap-2 text-xs text-fg-muted" role="status">
          <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden /> Checking all scenarios…
        </p>
      )}

      {insideStudyArea && inspection.status === 'error' && (
        <p className="mt-3 text-xs text-danger" role="alert">
          Could not check scenarios: {inspection.error}
        </p>
      )}

      {insideStudyArea && inspection.status === 'ready' && (
        <div className="mt-3" aria-live="polite">
          <p className="text-[13px] leading-5 text-fg">
            {inspection.result.firstFeet === null
              ? `${subject} is outside the mapped ocean-connected extent for every scenario up to ${formatScenario(
                  inspection.result.hits.at(-1)?.feet ?? 0,
                )}.`
              : inspection.result.firstFeet === 0
                ? `${subject} ${verb} the extent NOAA maps at today’s MHHW (0 ft).`
                : `${subject} first ${verb} the mapped extent at ${formatScenario(inspection.result.firstFeet)}.`}
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs" aria-label="Ocean-connected extent by scenario">
            {inspection.result.hits.map((h) => (
              <li key={h.feet} className={`flex items-center gap-2 ${h.feet === scenarioFt ? 'text-fg' : 'text-fg-muted'}`}>
                <Dot on={h.within} tone="flood" />
                <span className="tabular">{formatScenario(h.feet)}</span>
                <span className="sr-only">{h.within ? 'within mapped extent' : 'outside mapped extent'}</span>
                <span aria-hidden className="text-fg-subtle">
                  {h.within ? 'within' : 'outside'}
                </span>
              </li>
            ))}
          </ul>
          {inspection.result.lowHits.some((h) => h.within) && (
            <p className="mt-2 flex items-start gap-2 text-xs text-fg-muted">
              <Dot on tone="low" />
              <span>
                In a low-lying area that is not ocean-connected at{' '}
                {inspection.result.lowHits
                  .filter((h) => h.within)
                  .map((h) => formatScenario(h.feet))
                  .join(', ')}
                {inspection.result.lowPartAreaM2 !== null && ` (${formatSmallArea(inspection.result.lowPartAreaM2)} patch at ${formatScenario(scenarioFt)})`}
                .
              </span>
            </p>
          )}
          <p className="mt-3 border-t border-line pt-2 text-[11px] leading-4 text-fg-subtle">
            “Within the mapped extent” is a screening indicator, not a statement that this {building ? 'building' : 'place'} will
            flood. NOAA extents show the scale, not the exact location, of potential inundation.
          </p>
        </div>
      )}
    </section>
  )
}
