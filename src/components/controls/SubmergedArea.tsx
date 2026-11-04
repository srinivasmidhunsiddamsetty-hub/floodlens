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
 * One figure in a soft tinted box (v0.39), centred: label, then the number at the agreed stat
 * size (24 px bold), then anything under it. The boxes share the column's height between them
 * and tighten on short windows (the `short` variant), so the panel still fits without scrolling.
 */
function Figure({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-[#f2f5f9] px-1.5 py-2 text-center short:py-1">
      <p className="text-[12px] leading-4 font-medium whitespace-nowrap text-fg short:text-[11px] short:leading-[14px]">{label}</p>
      <p className="mt-0.5 text-[24px] leading-7 font-bold tracking-[-0.03em] text-fg tabular short:text-[20px] short:leading-6">{value}</p>
      {children}
    </div>
  )
}

/**
 * Land underwater at the chosen level, beside the slider (v0.36; the "Land underwater" card in
 * Insights before). Total colours show everything covered at the level; Individual colours show
 * only what that foot adds to the one below, as each colour on the map does ("Total area covered"
 * and "New area covered", v0.38). Two figures of equal weight in two boxes, 6 px apart (v0.39):
 * the area, with a km² / acres switch under it in the style of Total / Individual (one unit at a
 * time; v0.38 showed both), and its share of the city's Census land area, the same denominator in
 * both modes. Today's high tide reads 0, never a blank. Nothing is shown until the data has loaded.
 */
export function SubmergedArea({ manifest, scenarioFt, colorMode, unit, onUnitChange }: Props) {
  const m2 = manifest ? submergedM2(manifest, scenarioFt, colorMode === 'simple' ? 'total' : 'added') : undefined
  if (m2 === undefined) return null
  const landM2 = manifest?.studyArea.boundary?.censusLandM2
  return (
    <div className="flex h-full flex-col gap-1.5" aria-live="polite">
      <Figure label={colorMode === 'simple' ? 'Total area covered' : 'New area covered'} value={formatArea(m2, unit)}>
        <div className="mt-1">
          <AreaUnitToggle value={unit} onChange={onUnitChange} />
        </div>
      </Figure>
      {landM2 ? <Figure label="Share of city land" value={formatPercent(m2 / landM2, true)} /> : null}
    </div>
  )
}
