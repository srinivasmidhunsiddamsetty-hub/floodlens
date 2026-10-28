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
  const noun = building ? 'Building' : onWater ? 'Water' : 'Location'
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
          aria-label="Clear selection (Esc)"
          title="Clear selection (Esc)"
        >
          <X className="size-[18px]" aria-hidden />
        </button>
      </div>

      {!insideStudyArea && (
        <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2.5 t-body">
          Outside the City of Miami Beach. FloodLens only processes NOAA data inside the city boundary.
        </p>
      )}

      {insideStudyArea && inspection.status === 'loading' && (
        <p className="mt-4 flex items-center gap-2 t-body" role="status">
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Checking every water level…
        </p>
      )}

      {insideStudyArea && inspection.status === 'error' && (
        <p className="mt-4 t-body text-danger" role="alert">
          Could not check water levels: {inspection.error}
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

          const headline = !reached ? (
            <>
              Above <span className="text-accent">{levelName(top)}</span>
            </>
          ) : firstFeet === 0 ? (
            <span className="text-accent">Today</span>
          ) : (
            <>
              at <span className="text-accent">{formatScenario(firstFeet)}</span>
            </>
          )

          return (
            <div aria-live="polite">
              {/* The answer */}
              <div className="relative mt-4 overflow-hidden rounded-xl border border-[#d5e6fa] bg-gradient-to-b from-[#f5faff] to-[#e3effc]">
                <div className="relative z-10 w-[62%] p-4 pb-0">
                  <span className="inline-block rounded-full bg-[#d6e7fb] px-2.5 py-1 text-[11px] leading-none font-semibold tracking-[0.08em] text-accent-strong uppercase">
                    First reached
                  </span>
                  <p className="mt-2.5 text-[30px] leading-[34px] font-bold tracking-tight text-fg">{headline}</p>
                </div>
                <FloodIllustration
                  key={`${lngLat.join(',')}-${firstFeet}`}
                  kind={kind}
                  firstFeet={firstFeet}
                  topFeet={top}
                  className="pointer-events-none -mt-6 block h-auto w-full"
                />
              </div>
              {reached && !shownOnMap && (
                <button
                  type="button"
                  onClick={() => onShowLevel(firstFeet)}
                  className="mt-2 inline-flex items-center gap-1 t-label text-accent hover:text-accent-strong"
                >
                  Not on the map at {levelName(scenarioFt)} · show {levelName(firstFeet)}
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              )}

              {/* Gauge: one stop per NOAA water level */}
              <ol className="relative mt-5 grid" style={{ gridTemplateColumns: `repeat(${hits.length}, minmax(0, 1fr))` }} aria-label="Within NOAA’s mapped extent, by water level">
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
                      <span className="sr-only">{h.within ? 'within mapped extent' : 'outside mapped extent'}</span>
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
                  label="Low-lying area"
                  note={lowAt.length > 0 && lowPartAreaM2 !== null ? `${formatSmallArea(lowPartAreaM2)} patch, not ocean-connected` : undefined}
                  value={lowAt.length ? `Yes, from ${lowAt[0]}` : 'No'}
                />
              </dl>

            </div>
          )
        })()}
    </section>
  )
}
