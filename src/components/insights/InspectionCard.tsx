import { Building2, Crosshair, LandPlot, Loader2, MapPin, Ruler, Waves, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatCoord, formatScenario, formatSmallArea } from '../../lib/format'
import type { InspectionState } from '../../hooks/useInspection'
import type { Selection } from '../../state/reducer'
import { LowSpot } from '../ui/LowSpotIcon'
import { LevelTrack } from './LevelTrack'

interface Props {
  selection: Selection
  inspection: InspectionState
  scenarioFt: number
  onClear: () => void
}

const levelName = (ft: number) => (ft === 0 ? 'Today' : formatScenario(ft))

/** Icon colour and its tile's light fill (v0.37). */
const TINTS = {
  blue: { fg: '#1f5fd0', bg: '#e9f0fc' },
  violet: { fg: '#5b4bd1', bg: '#efedfb' },
  green: { fg: '#1d7a3e', bg: '#e8f4ec' },
} as const

/** One row of the card's single column: icon in a 28 px tinted tile and label, value on the right. */
function Row({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: LucideIcon
  tint: keyof typeof TINTS
  label: string
  value: ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 py-1.5">
      <dt className="flex min-w-0 items-center gap-2.5 text-[14px] leading-5 font-medium text-fg">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: TINTS[tint].bg, color: TINTS[tint].fg }} aria-hidden>
          <Icon className="size-4" />
        </span>
        {label}
      </dt>
      <dd className="text-right text-[20px] leading-7 font-medium text-fg tabular">{value}</dd>
    </div>
  )
}

/**
 * Selected building / location. Hierarchy: what and where → the answer, large
 * (the first sea level whose water reaches it, with every level in context) →
 * the facts in one column. A building lists height, footprint and low spot; a spot
 * or open water lists only low spot, since it has no height or footprint (v0.34).
 * Wording never says "will flood" or "safe".
 */
export function InspectionCard({ selection, inspection, scenarioFt, onClear }: Props) {
  const { building, street, lngLat, insideStudyArea, onWater } = selection
  const noun = building ? 'Building' : onWater ? 'Open water' : 'Spot'
  const Icon = building ? Building2 : onWater ? Waves : MapPin

  return (
    <section aria-labelledby="insp-title" className="card pointer-events-auto p-3 animate-slide-up">
      {/* What and where: a 36 px tile for the place (v0.37), its charcoal matching the selection
          on the map (v0.38; vermilion before), then the name and, under it, the coordinates with a
          small tile of their own. */}
      <div className="flex items-start gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#eceef1] text-[#1f2937]" aria-hidden>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="insp-title" className="text-[15px] leading-5 font-bold text-fg">
            {noun}
            {street && <> near {street.name}</>}
          </h3>
          {/* No "N m from street": the title already names the street, and the distance answers nothing about water. */}
          <p className="mt-1 flex items-center gap-1.5 text-[12px] leading-4 whitespace-nowrap text-fg-muted tabular">
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-surface-2 text-fg-subtle" aria-hidden>
              <Crosshair className="size-3" />
            </span>
            {formatCoord(lngLat[0], lngLat[1])}
          </p>
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
          const { hits, firstFeet, lowHits } = inspection.result
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

              {/* Facts in one column. Height and footprint only for a building (v0.34): a spot has
                  neither, so it no longer shows empty rows. Icons in tinted tiles (v0.37): a ruler, a
                  plot of land for the footprint, and a hollow holding water for a low spot (v0.38). */}
              <dl className="mt-1 divide-y divide-line">
                {building && (
                  <>
                    <Row
                      icon={Ruler}
                      tint="blue"
                      label="Height"
                      value={building.renderHeightM != null ? `≈ ${Math.round(building.renderHeightM)} m` : '—'}
                    />
                    <Row icon={LandPlot} tint="violet" label="Footprint" value={`≈ ${formatSmallArea(building.footprintAreaM2)}`} />
                  </>
                )}
                {/* No area caption (v0.31): it showed the whole low-spot area the building touches,
                    not the building's part of it, and the level is what matters. */}
                <Row icon={LowSpot} tint="green" label="Low spot" value={lowAt.length ? `Yes, from ${lowAt[0]}` : 'No'} />
              </dl>
            </div>
          )
        })()}
    </section>
  )
}
