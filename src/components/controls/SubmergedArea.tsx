import { AREA_UNITS, formatArea, formatPercent, type AreaUnit } from '../../lib/format'
import { submergedM2 } from '../../lib/manifest'
import type { ColorMode } from '../../lib/theme'
import type { DataManifest } from '../../types/data'
import { AreaUnitToggle } from '../ui/AreaUnitToggle'

interface Props {
  manifest: DataManifest | null
  scenarioFt: number
  colorMode: ColorMode
  unit: AreaUnit
  onUnitChange: (unit: AreaUnit) => void
}

/**
 * Land underwater at the chosen level, beside the slider (v0.36; the "Land underwater" card in
 * Insights before). Single colours show the total up to the level; Layered colours show only what
 * the level adds to the one below, as each colour on the map does. The share uses the same
 * denominator in both: the city's Census land area. Nothing is shown until the data has loaded.
 */
export function SubmergedArea({ manifest, scenarioFt, colorMode, unit, onUnitChange }: Props) {
  const m2 = manifest ? submergedM2(manifest, scenarioFt, colorMode === 'simple' ? 'total' : 'added') : undefined
  if (m2 === undefined) return null
  const landM2 = manifest?.studyArea.boundary?.censusLandM2
  return (
    <div className="flex h-full flex-col items-start justify-between gap-2">
      <div aria-live="polite">
        <p className="text-[12px] leading-4 font-medium tracking-[-0.01em] whitespace-nowrap text-fg">{colorMode === 'simple' ? 'Total submerged area' : 'Additional submerged area'}</p>
        {scenarioFt === 0 ? (
          // Today's high tide is the starting line, so nothing is underwater beyond it yet.
          <p className="mt-1 text-[15px] leading-5 font-bold text-fg">None yet</p>
        ) : (
          <>
            <p className="mt-0.5 flex items-baseline gap-1">
              <span className="text-[24px] leading-7 font-bold tracking-[-0.03em] text-fg tabular">{formatArea(m2, unit)}</span>
              <span className="text-[13px] text-fg-muted">{AREA_UNITS[unit].short}</span>
            </p>
            {landM2 ? (
              <p className="t-caption">
                <span className="font-bold text-fg tabular">{formatPercent(m2 / landM2, true)}</span> of the city’s land
              </p>
            ) : null}
          </>
        )}
      </div>
      <AreaUnitToggle value={unit} onChange={onUnitChange} />
    </div>
  )
}
