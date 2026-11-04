import type { ReactNode } from 'react'
import { formatArea, formatPercent, type AreaUnit } from '../../lib/format'
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
 * One figure in a box, centred: label, then the number (30 px bold since v0.45; 28 px in v0.43–v0.44, 24 px before), then
 * anything under it. The box shares the "Soft light" surface (`.surface-soft`, v0.42) with the
 * place card's answer and facts, so the two panels read as one design (v0.41 had a pale blue
 * gradient; v0.39–v0.40 a flat grey-blue fill). These two boxes have a slightly heavier hairline,
 * 1.5 px (v0.43), than the card's boxes. The elements have room to breathe (8 px label to number, 10 px number to switch).
 * Both boxes take an equal share of the column (basis 0), so they're the same height whenever
 * there's room; on the shortest windows the second gives way first. Only on windows 725 px tall
 * or less (the `tiny` variant, v0.44) do they tighten, to 24 px numbers and smaller gaps, so the
 * panel still fits without scrolling; above that they stay at full size.
 */
function Figure({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 basis-0 flex-col items-center justify-center surface-soft rounded-lg border-[1.5px] px-2 py-3 text-center tiny:py-0.5">
      <p className="text-[12px] leading-4 font-medium whitespace-nowrap text-fg tiny:text-[11px] tiny:leading-[14px]">{label}</p>
      <p className="mt-2 text-[30px] leading-[34px] font-bold tracking-[-0.03em] text-fg tabular tiny:mt-1 tiny:text-[24px] tiny:leading-7">{value}</p>
      {children}
    </div>
  )
}

/**
 * Land underwater at the chosen level, beside the slider (v0.36; the "Land underwater" card in
 * Insights before). Total colours show everything covered at the level; Individual colours show
 * only what that foot adds to the one below, as each colour on the map does ("Total area covered"
 * and "New area covered", v0.38). Two figures of equal weight in two boxes, 8 px apart (v0.39):
 * the area, with a km² / acres switch under it in the style of Total / Individual (one unit at a
 * time; v0.38 showed both), and its share of the city's Census land area, the same denominator in
 * both modes. Today's high tide reads 0, never a blank. Nothing is shown until the data has loaded.
 */
export function SubmergedArea({ manifest, scenarioFt, colorMode, unit, onUnitChange }: Props) {
  const m2 = manifest ? submergedM2(manifest, scenarioFt, colorMode === 'simple' ? 'total' : 'added') : undefined
  if (m2 === undefined) return null
  const landM2 = manifest?.studyArea.boundary?.censusLandM2
  return (
    <div className="flex h-full flex-col gap-2 tiny:gap-1.5" aria-live="polite">
      <Figure label={colorMode === 'simple' ? 'Total area covered' : 'New area covered'} value={formatArea(m2, unit)}>
        <div className="mt-2.5 tiny:mt-1">
          <AreaUnitToggle value={unit} onChange={onUnitChange} />
        </div>
      </Figure>
      {landM2 ? <Figure label="Share of city land" value={formatPercent(m2 / landM2, true)} /> : null}
    </div>
  )
}
