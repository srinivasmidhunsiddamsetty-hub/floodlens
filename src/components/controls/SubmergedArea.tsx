import { formatArea, formatPercent } from '../../lib/format'
import { submergedM2 } from '../../lib/manifest'
import type { ColorMode } from '../../lib/theme'
import type { DataManifest } from '../../types/data'

interface Props {
  manifest: DataManifest | null
  scenarioFt: number
  colorMode: ColorMode
}

/** A figure's label: 12 px medium, black, one line. */
function Label({ children }: { children: string }) {
  return <p className="text-[12px] leading-4 font-medium whitespace-nowrap text-fg">{children}</p>
}

/** A figure: 24 px bold, the agreed size for stat numbers. */
const BIG = 'text-[24px] leading-7 font-bold tracking-[-0.03em] text-fg tabular'

/**
 * Land underwater at the chosen level, beside the slider (v0.36; the "Land underwater" card in
 * Insights before). Total colours show everything covered at the level; Individual colours show
 * only what that foot adds to the one below, as each colour on the map does (v0.38 labels: "Total
 * area covered" and "New area covered"). Two figures of equal weight (v0.38): the area, in km²
 * with acres under it (both always shown, so there's no unit control to learn), and its share of
 * the city's Census land area, the same denominator in both modes. They spread over the slider's
 * height so the column has no empty gap. Today's high tide reads 0 km², 0 acres and 0%, never a
 * blank. Nothing is shown until the data has loaded.
 */
export function SubmergedArea({ manifest, scenarioFt, colorMode }: Props) {
  const m2 = manifest ? submergedM2(manifest, scenarioFt, colorMode === 'simple' ? 'total' : 'added') : undefined
  if (m2 === undefined) return null
  const landM2 = manifest?.studyArea.boundary?.censusLandM2
  return (
    <div className="flex h-full flex-col justify-between gap-2" aria-live="polite">
      <div>
        <Label>{colorMode === 'simple' ? 'Total area covered' : 'New area covered'}</Label>
        <p className="mt-0.5 flex items-baseline gap-1">
          <span className={BIG}>{formatArea(m2, 'km2')}</span>
          <span className="text-[13px] font-medium text-fg-muted">km²</span>
        </p>
        <p className="text-[12px] leading-4 text-fg-muted tabular">{formatArea(m2, 'acres')} acres</p>
      </div>
      {landM2 ? (
        <div>
          <Label>Share of city land</Label>
          <p className={`mt-0.5 ${BIG}`}>{formatPercent(m2 / landM2, true)}</p>
        </div>
      ) : null}
    </div>
  )
}
