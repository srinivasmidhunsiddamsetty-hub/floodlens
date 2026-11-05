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
 * One figure in a box (v0.57, the owner's mockup): label, then the number (30 px bold since v0.45,
 * navy), then anything under it, all aligned left in a light-blue box (`.surface-sky`). Before:
 * premium navy with white text, centred (v0.49–v0.56), "Soft light" (v0.42–v0.48), a pale blue
 * gradient (v0.41), a flat grey-blue fill (v0.39–v0.40). The area box is as tall as its content and
 * the share takes the rest of the slider's height, as in the mockup (equal heights in v0.41–v0.56).
 * Only on windows 725 px tall or less (the `tiny` variant, v0.44) do they tighten, to 24 px numbers
 * and smaller gaps, so the panel still fits without scrolling; above that they stay at full size.
 */
function Figure({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  // With nothing under the number (the share), the label and number sit in the middle of the box:
  // rows of space, number, space (v0.52), the label resting on the number. When the box is short,
  // the label's row keeps its height and the number moves down, so the label is never squeezed.
  // `min-h-0 basis-0`: a grid asks for room for both spare rows, which would make the card taller
  // than the slider and the panel scroll.
  const centred = !children
  return (
    <div
      className={`surface-sky rounded-lg px-3 py-2.5 text-left tiny:px-2.5 tiny:py-1 ${
        centred ? 'grid min-h-0 flex-1 basis-0 grid-rows-[1fr_auto_1fr] justify-items-start' : 'flex flex-none flex-col items-start'
      }`}
    >
      <p
        className={`text-[13px] leading-4 font-medium whitespace-nowrap text-fg tiny:text-[11px] tiny:leading-[14px] ${
          // tiny:pt-1.5: on the shortest windows the label keeps 8 px from the box's top edge (v0.53).
          centred ? 'mb-2 self-end tiny:mb-1 tiny:pt-1.5' : ''
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-[30px] leading-[34px] font-bold tracking-[-0.03em] text-accent tabular tiny:mt-0.5 tiny:text-[24px] tiny:leading-7">
        {value}
      </p>
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
        <div className="mt-2 w-full tiny:mt-1">
          <AreaUnitToggle value={unit} onChange={onUnitChange} className="w-full" />
        </div>
      </Figure>
      {landM2 ? <Figure label="Share of city land" value={formatPercent(m2 / landM2, true)} /> : null}
    </div>
  )
}
