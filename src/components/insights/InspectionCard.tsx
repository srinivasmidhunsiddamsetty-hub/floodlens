import { Building2, Crosshair, Loader2, MapPin, Mountain, Ruler, Scan, Waves, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatCoord, formatScenario, formatSmallArea } from '../../lib/format'
import type { InspectionState } from '../../hooks/useInspection'
import type { Selection } from '../../state/reducer'
import { LevelTrack } from './LevelTrack'

interface Props {
  selection: Selection
  inspection: InspectionState
  scenarioFt: number
  onClear: () => void
}

const levelName = (ft: number) => (ft === 0 ? 'Today' : formatScenario(ft))

function Chip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-[3px] text-[12px] leading-4 whitespace-nowrap text-fg-muted tabular">
      <Icon className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
      {children}
    </span>
  )
}

const TINTS = { blue: '#1f5fd0', violet: '#5b4bd1', green: '#1d7a3e' } as const

/** Empty value for a spot that isn't a building, so the card keeps the same rows everywhere. */
const NoValue = () => (
  <span className="font-normal text-fg-subtle" title="No building here">
    —<span className="sr-only">no building here</span>
  </span>
)

/** One row of the card's single column: tinted icon and label, value on the right, extras underneath. */
function Row({
  icon: Icon,
  tint,
  label,
  value,
  children,
}: {
  icon: LucideIcon
  tint: keyof typeof TINTS
  label: string
  value: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 py-1.5">
      <dt className="flex min-w-0 items-center gap-2.5 text-[14px] leading-5 font-medium text-fg">
        <Icon className="size-4 shrink-0" style={{ color: TINTS[tint] }} aria-hidden />
        {label}
      </dt>
      <dd className="text-right text-[20px] leading-7 font-medium text-fg tabular">{value}</dd>
      {children}
    </div>
  )
}

/**
 * Selected building / location. Hierarchy: what and where → the answer, large
 * (the first sea level whose water reaches it, with every level in context) →
 * height, footprint and low spot in one column. Wording never says "will flood"
 * or "safe".
 */
export function InspectionCard({ selection, inspection, scenarioFt, onClear }: Props) {
  const { building, street, lngLat, insideStudyArea, onWater } = selection
  const noun = building ? 'Building' : onWater ? 'Open water' : 'Spot'
  const Icon = building ? Building2 : onWater ? Waves : MapPin

  return (
    <section aria-labelledby="insp-title" className="card pointer-events-auto p-3 animate-slide-up">
      {/* What and where. The vermilion icon matches the selection on the map. */}
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-[18px] shrink-0 text-[#d03a22]" aria-hidden />
        <h3 id="insp-title" className="min-w-0 flex-1 text-[15px] leading-5 font-bold text-fg">
          {noun}
          {street && <> near {street.name}</>}
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="btn-ghost -mt-1.5 -mr-1.5 size-7 shrink-0 justify-center px-0"
          aria-label="Close (Esc)"
          title="Close (Esc)"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {/* No "N m from street": the title already names the street, and the distance answers nothing about water. */}
      <div className="mt-1.5 flex">
        <Chip icon={Crosshair}>{formatCoord(lngLat[0], lngLat[1])}</Chip>
      </div>

      {!insideStudyArea && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5 t-body">
          This spot is outside Miami Beach. FloodLens only maps the city itself.
        </p>
      )}

      {insideStudyArea && inspection.status === 'loading' && (
        <p className="mt-3 flex items-center gap-2 t-body" role="status">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Checking each sea level…
        </p>
      )}

      {insideStudyArea && inspection.status === 'error' && (
        <p className="mt-3 t-body text-danger" role="alert">
          We couldn’t check this spot. {inspection.error}
        </p>
      )}

      {insideStudyArea &&
        inspection.status === 'ready' &&
        (() => {
          const { hits, firstFeet, lowHits, lowPartAreaM2 } = inspection.result
          const top = hits.at(-1)?.feet ?? 0
          const reached = firstFeet !== null
          const lowAt = lowHits.filter((h) => h.within).map((h) => levelName(h.feet))

          // Label and answer: "Water reaches at +2 ft", or "Today" (today's high tide, the
          // same name as the first pin). When no level reaches it: "Up to +5 ft · Doesn't
          // reach it" (v0.30). The label keeps the limit: we only map up to the top level, and
          // NOAA's map not reaching a place isn't a promise, so never "safe" or "dry".
          const label = reached ? 'Water reaches at' : `Up to ${formatScenario(top)}`
          const answer = !reached ? 'Doesn’t reach it' : firstFeet === 0 ? 'Today' : formatScenario(firstFeet)

          return (
            <div aria-live="polite">
              {/* The answer, emphasised, on the label's row (label left, value right, like the facts
                  below), with every level in context under it. A long answer wraps under the label. */}
              <div className="mt-3 rounded-lg border border-[#d5e6fa] bg-gradient-to-b from-[#f6faff] to-[#ecf4fd] px-3 pt-2 pb-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-[14px] leading-5 font-medium text-fg">{label}</p>
                  <p className="text-[24px] leading-8 font-bold tracking-[-0.03em] text-fg tabular">{answer}</p>
                </div>
                <div className="mt-1">
                  <LevelTrack levels={hits} firstFeet={firstFeet} scenarioFt={scenarioFt} />
                </div>
              </div>

              {/* Facts in one column. Height and footprint always show; "—" when the click isn't on a building. */}
              <dl className="mt-1 divide-y divide-line">
                <Row
                  icon={Ruler}
                  tint="blue"
                  label="Height"
                  value={building?.renderHeightM != null ? `≈ ${Math.round(building.renderHeightM)} m` : <NoValue />}
                />
                <Row icon={Scan} tint="violet" label="Footprint" value={building ? `≈ ${formatSmallArea(building.footprintAreaM2)}` : <NoValue />} />
                <Row icon={Mountain} tint="green" label="Low spot" value={lowAt.length ? `Yes, from ${lowAt[0]}` : 'No'}>
                  {lowAt.length > 0 && lowPartAreaM2 !== null && (
                    <dd className="col-span-2 pl-[26px] t-caption">{formatSmallArea(lowPartAreaM2)} of it, cut off from the sea</dd>
                  )}
                </Row>
              </dl>
            </div>
          )
        })()}
    </section>
  )
}
