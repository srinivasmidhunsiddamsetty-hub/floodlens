import { ArrowRight, Building2, Crosshair, Loader2, MapPin, Mountain, Ruler, Scan, Waves, X, type LucideIcon } from 'lucide-react'
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

function Chip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] leading-4 whitespace-nowrap text-fg-muted tabular">
      <Icon className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
      {children}
    </span>
  )
}

const TINTS = {
  blue: { background: '#e8f1fd', color: '#1f5fd0' },
  violet: { background: '#efedfd', color: '#5b4bd1' },
  green: { background: '#e5f4ea', color: '#1d7a3e' },
} as const

function Fact({ icon: Icon, tint, label, value, note }: { icon: LucideIcon; tint: keyof typeof TINTS; label: string; value: ReactNode; note?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={TINTS[tint]} aria-hidden>
        <Icon className="size-[18px]" />
      </span>
      <dt className="min-w-0 flex-1 text-[13px] leading-5 text-fg">
        {label}
        {note && <span className="block t-caption">{note}</span>}
      </dt>
      <dd className="text-right text-[15px] font-medium text-fg tabular">{value}</dd>
    </div>
  )
}

/**
 * Selected building / location. Hierarchy: what and where → the answer (first
 * water level that reaches it, with a picture of it) → the level-by-level gauge →
 * supporting facts → the caveat. Wording stays at "within NOAA's mapped extent",
 * never "will flood".
 */
export function InspectionCard({ selection, inspection, scenarioFt, onClear, onShowLevel }: Props) {
  const { building, street, lngLat, insideStudyArea, onWater } = selection
  const kind = building ? 'building' : onWater ? 'water' : 'location'
  const noun = building ? 'Building' : onWater ? 'Open water' : 'Spot'
  const Icon = building ? Building2 : onWater ? Waves : MapPin

  return (
    <section aria-labelledby="insp-title" className="rounded-xl border border-line bg-surface p-4 shadow-panel animate-slide-up">
      {/* What and where */}
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ffeedf] text-[#d65a00]" aria-hidden>
          <Icon className="size-[22px]" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 id="insp-title" className="pr-1 text-[17px] leading-[22px] font-semibold text-fg">
            {noun}
            {street && <> near {street.name}</>}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {street && <Chip icon={MapPin}>{formatMeters(street.distanceM)} from street</Chip>}
            <Chip icon={Crosshair}>{formatCoord(lngLat[0], lngLat[1])}</Chip>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="btn-ghost -mt-1 -mr-1.5 size-8 shrink-0 justify-center px-0"
          aria-label="Close (Esc)"
          title="Close (Esc)"
        >
          <X className="size-[18px]" aria-hidden />
        </button>
      </div>

      {!insideStudyArea && (
        <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 t-body">
          This spot is outside Miami Beach. FloodLens only maps the city itself.
        </p>
      )}

      {insideStudyArea && inspection.status === 'loading' && (
        <p className="mt-4 flex items-center gap-2 t-body" role="status">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Checking each sea level…
        </p>
      )}

      {insideStudyArea && inspection.status === 'error' && (
        <p className="mt-4 t-body text-danger" role="alert">
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
              <div className="relative mt-4 overflow-hidden rounded-xl border border-[#d5e6fa] bg-gradient-to-b from-[#f5faff] to-[#e3effc]">
                <div className="relative z-10 w-[64%] px-4 pt-3.5">
                  <span className="inline-block rounded-full bg-[#d6e7fb] px-2 py-[3px] text-[10.5px] leading-none font-semibold tracking-[0.08em] text-accent-strong uppercase">
                    {label}
                  </span>
                  <p className="mt-2 text-[22px] leading-7 font-semibold tracking-tight text-fg">{headline}</p>
                </div>
                <FloodIllustration
                  key={`${lngLat.join(',')}-${firstFeet}`}
                  kind={kind}
                  firstFeet={firstFeet}
                  topFeet={top}
                  className="pointer-events-none -mt-7 block h-[88px] w-full"
                />
              </div>
              {reached && !shownOnMap && (
                <button
                  type="button"
                  onClick={() => onShowLevel(firstFeet)}
                  className="mt-2 inline-flex items-center gap-1 t-label text-accent hover:text-accent-strong"
                >
                  You’re looking at {formatScenario(scenarioFt)}. See it at {formatScenario(firstFeet)}
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              )}

              {/* Gauge: one stop per NOAA water level */}
              <ol className="relative mt-5 grid" style={{ gridTemplateColumns: `repeat(${hits.length}, minmax(0, 1fr))` }} aria-label="Water at this spot, by sea level">
                <span aria-hidden className="absolute top-[9px] h-0.5 rounded-full bg-[#dfe4ea]" style={{ left: `${50 / hits.length}%`, right: `${50 / hits.length}%` }} />
                {firstIndex >= 0 && firstIndex < hits.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-[9px] h-0.5 rounded-full"
                    style={{
                      left: `${((firstIndex + 0.5) * 100) / hits.length}%`,
                      right: `${50 / hits.length}%`,
                      background: `linear-gradient(to right, ${hits.slice(firstIndex).map((h) => bandColor(h.feet)).join(', ')})`,
                    }}
                  />
                )}
                {hits.map((h, i) => {
                  const isFirst = i === firstIndex
                  const within = h.within && reached
                  return (
                    <li key={h.feet} className="relative flex flex-col items-center gap-2">
                      <span className="grid size-5 place-items-center" aria-hidden>
                        {/* Dots wear the map's colour for that level, so the gauge doubles as a legend. */}
                        {isFirst ? (
                          <span
                            className="size-5 rounded-full border border-black/15"
                            style={{ background: bandColor(h.feet), boxShadow: `0 0 0 4px ${bandColor(h.feet)}33` }}
                          />
                        ) : (
                          <span
                            className={`size-3.5 rounded-full ${within ? 'border border-black/15' : 'bg-[#c9d0d8]'}`}
                            style={within ? { background: bandColor(h.feet) } : undefined}
                          />
                        )}
                      </span>
                      <span className={`text-[13px] tabular ${isFirst ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
                        {levelName(h.feet)}
                        {h.feet === scenarioFt && <span className="sr-only"> (selected level)</span>}
                      </span>
                      <span className="sr-only">{h.within ? 'water reaches it' : 'water doesn’t reach it'}</span>
                    </li>
                  )
                })}
              </ol>

              {/* Supporting facts */}
              <dl className="mt-4 divide-y divide-line border-t border-line">
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
                <Fact
                  icon={Mountain}
                  tint="green"
                  label="In a low spot"
                  note={lowAt.length > 0 && lowPartAreaM2 !== null ? `${formatSmallArea(lowPartAreaM2)}, cut off from the sea` : undefined}
                  value={lowAt.length ? `Yes, from ${lowAt[0]}` : 'No'}
                />
              </dl>

            </div>
          )
        })()}
    </section>
  )
}
