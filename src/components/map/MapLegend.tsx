import { X } from 'lucide-react'
import { formatScenario } from '../../lib/format'
import { Swatch, type SwatchKind } from '../ui/Swatch'

interface Props {
  scenarioFt: number
  pair: [number, number] | null
  showLowLying: boolean
  showBuildings: boolean
  showStudyArea: boolean
  showInundation: boolean
  onClose: () => void
}

function Row({ kind, children }: { kind: SwatchKind; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 leading-5">
      <Swatch kind={kind} size={13} />
      <span>{children}</span>
    </li>
  )
}

/** Compact legend — entries mirror only what is currently drawn on the map. */
export function MapLegend({ scenarioFt, pair, showLowLying, showBuildings, showStudyArea, showInundation, onClose }: Props) {
  return (
    <section
      aria-label="Map legend"
      className="pointer-events-auto w-60 rounded-xl border border-line-strong bg-surface/95 p-3 text-xs text-fg-muted shadow-panel backdrop-blur-sm animate-fade-in"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="section-title">Legend</h3>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-fg-subtle hover:text-fg" aria-label="Hide legend">
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      <ul className="space-y-1">
        {showInundation && !pair && <Row kind="flood">Mapped inundation, {formatScenario(scenarioFt)}</Row>}
        {showInundation && pair && (
          <>
            <Row kind="flood">Mapped extent, {formatScenario(pair[0])}</Row>
            <Row kind="compare">Added by {formatScenario(pair[1])}</Row>
          </>
        )}
        {showLowLying && <Row kind="lowLying">Low-lying, not ocean-connected</Row>}
        <Row kind="water">Existing water (OSM)</Row>
        <Row kind="land">Land</Row>
        {showBuildings && <Row kind="building">Buildings (OSM footprints)</Row>}
        <Row kind="selection">Selected location</Row>
        {showStudyArea && <Row kind="study">Study area · data clipped</Row>}
        {showStudyArea && <Row kind="outside">Outside study area</Row>}
      </ul>
      <p className="mt-2 border-t border-line pt-2 leading-4 text-fg-subtle">
        Overlays appear on land only; open water is drawn above them.
      </p>
    </section>
  )
}
