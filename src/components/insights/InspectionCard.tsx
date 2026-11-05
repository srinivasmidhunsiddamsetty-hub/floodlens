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

// Today's level is "0 ft" (v0.40; "Today" before), as on the slider and the legend.
const levelName = formatScenario

/**
 * One row of the card's single column: icon in a 28 px tile and label, value on the right. One
 * colour for every icon (v0.61, the owner's call): each takes its surface, so on the navy box it's
 * white on a faint white tile. Blue, violet and green tiles before (v0.37–v0.60).
 */
function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 py-1.5">
      <dt className="flex min-w-0 items-center gap-2.5 text-[14px] leading-5 font-medium text-white">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/14 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]"
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        {label}
      </dt>
      {/* Semibold (v0.41; medium before), at the owner's request. */}
      <dd className="text-right text-[20px] leading-7 font-semibold text-white tabular">{value}</dd>
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
      {/* What and where: a 36 px tile for the place (v0.37), its green matching the selection on
          the map (v0.46; a deeper green for the icon, since #3ee67e on a pale tile is too faint),
          then the name and, under it, the coordinates with a small tile of their own. The place
          keeps its green (v0.61, the owner's pick): it's the card's link to the building on the map.
          Every other icon is one colour, navy on a light tint on the white card (grey before). */}
      <div className="flex items-start gap-2.5">
        <span className="tile-soft grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#e9fbf0] text-[#15803d]" aria-hidden>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="insp-title" className="text-[15px] leading-5 font-bold text-fg">
            {noun}
            {street && <> near {street.name}</>}
          </h3>
          {/* No "N m from street": the title already names the street, and the distance answers nothing about water. */}
          <p className="mt-1 flex items-center gap-1.5 text-[12px] leading-4 whitespace-nowrap text-fg-muted tabular">
            <span className="tile-soft grid size-5 shrink-0 place-items-center rounded-md bg-accent-soft text-accent" aria-hidden>
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
          This spot is outside Miami Beach.
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

          // Label and answer: "Water reaches at +2 ft", or "0 ft" (today's high tide, the
          // same name as the first pin). When no level reaches it: "Up to +5 ft · Doesn't
          // reach it" (v0.30). The label keeps the limit: we only map up to the top level, and
          // NOAA's map not reaching a place isn't a promise, so never "safe" or "dry".
          const label = reached ? 'Water reaches at' : `Up to ${formatScenario(top)}`
          const answer = !reached ? 'Doesn’t reach it' : formatScenario(firstFeet)

          return (
            <div aria-live="polite">
              {/* The answer, emphasised, on the label's row (label left, value right, like the facts
                  below), with every level in context under it. A long answer wraps under the label. */}
              {/* Premium navy (v0.49), like the sea-level figures; Soft light in v0.42–v0.48. */}
              <div className="surface-navy mt-3 rounded-lg px-3 pt-2 pb-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-[14px] leading-5 font-medium text-white">{label}</p>
                  <p className="text-[24px] leading-8 font-bold tracking-[-0.03em] text-white tabular">{answer}</p>
                </div>
                <div className="mt-1">
                  <LevelTrack levels={hits} firstFeet={firstFeet} scenarioFt={scenarioFt} />
                </div>
              </div>

              {/* Facts in one column. Height and footprint only for a building (v0.34): a spot has
                  neither, so it no longer shows empty rows. Icons in tinted tiles (v0.37): a ruler, a
                  plot of land for the footprint, and a hollow holding water for a low spot (v0.38). */}
              {/* Grouped in one box (v0.42; straight on the card before), the same navy surface as the answer (v0.49). */}
              <dl className="surface-navy mt-2.5 divide-y divide-white/15 rounded-lg px-3">
                {building && (
                  <>
                    <Row
                      icon={Ruler}
                      label="Height"
                      value={building.renderHeightM != null ? `≈ ${Math.round(building.renderHeightM)} m` : '—'}
                    />
                    <Row icon={LandPlot} label="Footprint" value={`≈ ${formatSmallArea(building.footprintAreaM2)}`} />
                  </>
                )}
                {/* No area caption (v0.31): it showed the whole low-spot area the building touches,
                    not the building's part of it, and the level is what matters. */}
                <Row icon={LowSpot} label="Low spot" value={lowAt.length ? `Yes, from ${lowAt[0]}` : 'No'} />
              </dl>
            </div>
          )
        })()}
    </section>
  )
}
