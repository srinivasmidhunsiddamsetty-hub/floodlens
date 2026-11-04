import { ChevronDown } from 'lucide-react'
import { AREA_UNITS, formatArea, formatPercent, formatScenario, type AreaUnit } from '../../lib/format'
import { submergedM2 } from '../../lib/manifest'
import type { ColorMode } from '../../lib/theme'
import type { DataManifest } from '../../types/data'

interface Props {
  manifest: DataManifest | null
  scenarioFt: number
  colorMode: ColorMode
  unit: AreaUnit
  onUnitChange: (unit: AreaUnit) => void
}

const UNITS = Object.keys(AREA_UNITS) as AreaUnit[]

/**
 * Land underwater at the chosen level, beside the slider (v0.36; the "Land underwater" card in
 * Insights before). Overview colours show everything underwater at the level; Layered colours
 * show only what that foot adds to the one below, as each colour on the map does. One word tells
 * them apart (v0.37): "Underwater at +2 ft" and "Newly underwater at +2 ft". The share uses the
 * same denominator in both: the city's Census land area. The unit is a small menu right after
 * the number (v0.37), so the figure reads as one phrase, "0.99 km²". Nothing is shown until the
 * data has loaded.
 */
export function SubmergedArea({ manifest, scenarioFt, colorMode, unit, onUnitChange }: Props) {
  const m2 = manifest ? submergedM2(manifest, scenarioFt, colorMode === 'simple' ? 'total' : 'added') : undefined
  if (m2 === undefined) return null
  const landM2 = manifest?.studyArea.boundary?.censusLandM2
  const level = formatScenario(scenarioFt)
  return (
    <div aria-live="polite">
      <p className="text-[12px] leading-4 font-medium whitespace-nowrap text-fg">
        {scenarioFt === 0 ? 'At today’s high tide' : colorMode === 'simple' ? `Underwater at ${level}` : `Newly underwater at ${level}`}
      </p>
      {scenarioFt === 0 ? (
        // Today's high tide is the starting line, so nothing is underwater beyond it yet.
        <p className="mt-1 text-[15px] leading-5 font-bold text-fg">None yet</p>
      ) : (
        <>
          <p className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[24px] leading-7 font-bold tracking-[-0.03em] text-fg tabular">{formatArea(m2, unit)}</span>
            <span className="relative inline-flex">
              <select
                aria-label="Area unit"
                value={unit}
                onChange={(e) => onUnitChange(e.target.value as AreaUnit)}
                className="h-6 cursor-pointer appearance-none rounded-md border border-line-strong bg-surface py-0 pr-5 pl-1.5 text-[13px] leading-none text-fg transition-colors hover:border-fg-subtle"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {AREA_UNITS[u].short}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-1 size-3.5 -translate-y-1/2 text-fg-subtle" aria-hidden />
            </span>
          </p>
          {landM2 ? (
            <p className="t-caption">
              <span className="font-bold text-fg tabular">{formatPercent(m2 / landM2, true)}</span> of the city’s land
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
