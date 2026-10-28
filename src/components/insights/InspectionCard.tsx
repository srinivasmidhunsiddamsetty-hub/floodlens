import { ArrowRight, Building2, Loader2, MapPin, Mountain, Ruler, Scan, Waves, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatCoord, formatMeters, formatScenario, formatSmallArea } from '../../lib/format'
import { bandColor } from '../../lib/theme'
import type { InspectionState } from '../../hooks/useInspection'
import type { Selection } from '../../state/reducer'
import { FloodIllustration } from './FloodIllustration'

interface Props {
  selection: Selection
  inspection: InspectionState
  scenarioFt: number
  onClear: () => void
  /** Move the sea-level slider, e.g. to the level that first reaches the selection. */
  onShowLevel: (feet: number) => void
}

const levelName = (ft: number) => (ft === 0 ? 'Today' : formatScenario(ft))

const TINTS = { blue: '#1f5fd0', violet: '#5b4bd1', green: '#1d7a3e' } as const

/** One cell of the facts strip: a small tinted icon and label above the value. */
function Fact({ icon: Icon, tint, label, value }: { icon: LucideIcon; tint: keyof typeof TINTS; label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <dt className="flex items-center gap-1 t-caption whitespace-nowrap">
        <Icon className="size-3.5 shrink-0" style={{ color: TINTS[tint] }} aria-hidden />
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[14px] leading-5 font-medium text-fg tabular">{value}</dd>
    </div>
  )
}

/**
 * Selected building / location, kept compact so the whole Insights panel fits
 * without scrolling. Hierarchy: what and where → the answer (first water level
 * that reaches it, with a picture of it) → the level-by-level strip → facts in one
 * row. Wording never says "will flood" or "safe".
 */
export function InspectionCard({ selection, inspection, scenarioFt, onClear, onShowLevel }: Props) {
  const { building, street, lngLat, insideStudyArea, onWater } = selection
  const kind = building ? 'building' : onWater ? 'water' : 'location'
  const noun = building ? 'Building' : onWater ? 'Open water' : 'Spot'
  const Icon = building ? Building2 : onWater ? Waves : MapPin

  return (
    <section aria-labelledby="insp-title" className="rounded-xl border border-line bg-surface p-3.5 shadow-panel animate-slide-up">
      {/* What and where. The orange icon matches the selection on the map. */}
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-[18px] shrink-0 text-[#d65a00]" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 id="insp-title" className="text-[15px] leading-5 font-semibold text-fg">
            {noun}
            {street && <> near {street.name}</>}
          </h3>
        </div>
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
      {/* Full card width, so distance and position fit on one line */}
      <p className="mt-0.5 flex flex-wrap gap-x-1.5 t-caption tabular">
        {street && (
          <>
            <span className="whitespace-nowrap">{formatMeters(street.distanceM)} from street</span>
            <span aria-hidden>·</span>
          </>
        )}
        <span className="whitespace-nowrap">{formatCoord(lngLat[0], lngLat[1], 4)}</span>
      </p>

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
          const firstIndex = reached ? hits.findIndex((h) => h.feet === firstFeet) : -1

          // Label and headline read as one sentence: "Water reaches it at +3 ft",
          // "Up to +3 ft, water doesn't reach it". Never "safe" or "dry": NOAA's
          // map not reaching a place isn't a promise, and we only map to +3 ft.
          const label = reached ? 'Water reaches it' : `Up to ${formatScenario(top)}`
          const headline = !reached ? (
            <>Water doesn’t reach it</>
          ) : firstFeet === 0 ? (
            <>
              Already, at <span className="text-accent">high tide</span>
            </>
          ) : (
            <>
              At <span className="text-accent">{formatScenario(firstFeet)}</span>
            </>
          )

          return (
            <div aria-live="polite">
              {/* The answer */}
              <div className="relative mt-3 overflow-hidden rounded-lg border border-[#d5e6fa] bg-gradient-to-b from-[#f5faff] to-[#e3effc]">
                <div className="relative z-10 w-[64%] px-3.5 pt-3">
                  <span className="inline-block rounded-full bg-[#d6e7fb] px-2 py-[3px] text-[10px] leading-none font-semibold tracking-[0.08em] text-accent-strong uppercase">
                    {label}
                  </span>
                  <p className="mt-1 text-[20px] leading-6 font-semibold tracking-tight text-fg">{headline}</p>
                </div>
                <FloodIllustration
                  key={`${lngLat.join(',')}-${firstFeet}`}
                  kind={kind}
                  firstFeet={firstFeet}
                  topFeet={top}
                  className="pointer-events-none -mt-4 block h-14 w-full"
                />
                {/* The map is on a lower level than the answer: offer to jump there, in the block's free corner. */}
                {reached && !shownOnMap && (
                  <button
                    type="button"
                    onClick={() => onShowLevel(firstFeet)}
                    aria-label={`You’re looking at ${formatScenario(scenarioFt)}. See it at ${formatScenario(firstFeet)}`}
                    title={`You’re looking at ${formatScenario(scenarioFt)} on the map`}
                    className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-0.5 text-[12px] leading-4 font-medium whitespace-nowrap text-accent hover:text-accent-strong"
                  >
                    See it at {formatScenario(firstFeet)}
                    <ArrowRight className="size-3" aria-hidden />
                  </button>
                )}
              </div>

              {/* Level strip: one segment per NOAA water level, in the map's colour where water reaches it */}
              <ol className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${hits.length}, minmax(0, 1fr))` }} aria-label="Water at this spot, by sea level">
                {hits.map((h, i) => {
                  const isFirst = i === firstIndex
                  const within = h.within && reached
                  return (
                    <li key={h.feet} className="flex flex-col gap-1">
                      <span aria-hidden className="h-1.5 rounded-full" style={{ background: within ? bandColor(h.feet) : '#e3e7ec' }} />
                      <span className={`text-[12px] leading-4 tabular ${isFirst ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
                        {levelName(h.feet)}
                        {h.feet === scenarioFt && <span className="sr-only"> (selected level)</span>}
                      </span>
                      <span className="sr-only">{h.within ? 'water reaches it' : 'water doesn’t reach it'}</span>
                    </li>
                  )
                })}
              </ol>

              {/* Facts in one row */}
              <dl
                className="mt-3 grid divide-x divide-line border-t border-line pt-2.5"
                style={{ gridTemplateColumns: `repeat(${building ? 3 : 1}, minmax(0, 1fr))` }}
              >
                {building && (
                  <>
                    <Fact
                      icon={Ruler}
                      tint="blue"
                      label="Height"
                      value={building.renderHeightM !== null ? `≈ ${Math.round(building.renderHeightM)} m` : '—'}
                    />
                    <Fact icon={Scan} tint="violet" label="Footprint" value={`≈ ${formatSmallArea(building.footprintAreaM2)}`} />
                  </>
                )}
                <Fact icon={Mountain} tint="green" label="Low spot" value={lowAt.length ? `From ${lowAt[0]}` : 'No'} />
              </dl>
              {lowAt.length > 0 && lowPartAreaM2 !== null && (
                <p className="mt-1.5 t-caption">{formatSmallArea(lowPartAreaM2)} of it sits in a low spot, cut off from the sea.</p>
              )}

            </div>
          )
        })()}
    </section>
  )
}
