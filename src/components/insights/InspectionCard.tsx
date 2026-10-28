import { ArrowRight, Building2, Crosshair, Loader2, MapPin, Mountain, Ruler, Scan, Waves, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatCoord, formatMeters, formatScenario, formatSmallArea } from '../../lib/format'
import type { InspectionState } from '../../hooks/useInspection'
import type { Selection } from '../../state/reducer'
import { LevelTrack } from './LevelTrack'

interface Props {
  selection: Selection
  inspection: InspectionState
  scenarioFt: number
  onClear: () => void
  /** Move the sea-level slider, e.g. to the level that first reaches the selection. */
  onShowLevel: (feet: number) => void
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

const TINTS = { water: '#0069b0', blue: '#1f5fd0', violet: '#5b4bd1', green: '#1d7a3e' } as const

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
      <dt className="flex min-w-0 items-center gap-2.5 text-[13px] leading-5 text-fg">
        <Icon className="size-4 shrink-0" style={{ color: TINTS[tint] }} aria-hidden />
        {label}
      </dt>
      <dd className="text-right text-[14px] leading-5 font-medium text-fg tabular">{value}</dd>
      {children}
    </div>
  )
}

/**
 * Selected building / location. Hierarchy: what and where → one column of
 * answers: when water reaches it (with a pin per level), then height, footprint
 * and low spot. Kept compact so the whole Insights panel fits without scrolling.
 * Wording never says "will flood" or "safe".
 */
export function InspectionCard({ selection, inspection, scenarioFt, onClear, onShowLevel }: Props) {
  const { building, street, lngLat, insideStudyArea, onWater } = selection
  const noun = building ? 'Building' : onWater ? 'Open water' : 'Spot'
  const Icon = building ? Building2 : onWater ? Waves : MapPin

  return (
    <section aria-labelledby="insp-title" className="rounded-xl border border-line bg-surface p-3 shadow-panel animate-slide-up">
      {/* What and where. The orange icon matches the selection on the map. */}
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-[18px] shrink-0 text-[#d65a00]" aria-hidden />
        <h3 id="insp-title" className="min-w-0 flex-1 text-[15px] leading-5 font-semibold text-fg">
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
      <div className="mt-1.5 flex flex-wrap gap-1">
        {street && <Chip icon={MapPin}>{formatMeters(street.distanceM)} from street</Chip>}
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
          const shownOnMap = reached && firstFeet <= scenarioFt
          const lowAt = lowHits.filter((h) => h.within).map((h) => levelName(h.feet))

          // Label and value read as one sentence: "When water reaches it: at +3 ft",
          // "already today" (at today's high tide; the Today pin says so too).
          // Never "safe" or "dry": NOAA's map not reaching a place isn't a promise,
          // and we only map up to +3 ft.
          const answer = !reached ? (
            <span className="text-fg-muted">Not up to {formatScenario(top)}</span>
          ) : firstFeet === 0 ? (
            <span className="text-accent">Already today</span>
          ) : (
            <span className="text-accent">At {formatScenario(firstFeet)}</span>
          )

          return (
            <dl aria-live="polite" className="mt-3 divide-y divide-line border-t border-line">
              <Row icon={Waves} tint="water" label="When water reaches it" value={answer}>
                <dd className="col-span-2 mt-1.5">
                  <LevelTrack levels={hits} firstFeet={firstFeet} scenarioFt={scenarioFt} />
                </dd>
                {reached && !shownOnMap && (
                  <dd className="col-span-2 mt-1">
                    <button
                      type="button"
                      onClick={() => onShowLevel(firstFeet)}
                      className="inline-flex items-center gap-1 t-label text-accent hover:text-accent-strong"
                    >
                      You’re looking at {formatScenario(scenarioFt)}. See it at {formatScenario(firstFeet)}
                      <ArrowRight className="size-3.5" aria-hidden />
                    </button>
                  </dd>
                )}
              </Row>
              {building && (
                <>
                  <Row
                    icon={Ruler}
                    tint="blue"
                    label="Height"
                    value={building.renderHeightM !== null ? `≈ ${Math.round(building.renderHeightM)} m` : '—'}
                  />
                  <Row icon={Scan} tint="violet" label="Footprint" value={`≈ ${formatSmallArea(building.footprintAreaM2)}`} />
                </>
              )}
              <Row icon={Mountain} tint="green" label="Low spot" value={lowAt.length ? `Yes, from ${lowAt[0]}` : 'No'}>
                {lowAt.length > 0 && lowPartAreaM2 !== null && (
                  <dd className="col-span-2 pl-[26px] t-caption">{formatSmallArea(lowPartAreaM2)} of it, cut off from the sea</dd>
                )}
              </Row>
            </dl>
          )
        })()}
    </section>
  )
}
