import { useAppDispatch, useAppState } from '../../state/AppState'
import type { LayerKey } from '../../state/reducer'
import type { DataManifest } from '../../types/data'
import { Swatch, type SwatchKind } from '../ui/Swatch'
import { Switch } from '../ui/Switch'
import { ScenarioSelector } from './ScenarioSelector'

interface Props {
  manifest: DataManifest | null
}

const LAYERS: { key: LayerKey; label: string; description: string; swatch: SwatchKind; needsLowLying?: boolean }[] = [
  { key: 'inundation', label: 'Flooding', description: 'Where NOAA maps the sea reaching', swatch: 'flood' },
  { key: 'lowLying', label: 'Low spots', description: 'Below the water line, but cut off from the sea', swatch: 'lowLying', needsLowLying: true },
  { key: 'buildings', label: 'Buildings', description: 'Shapes and heights from OpenStreetMap', swatch: 'building' },
  { key: 'labels', label: 'Labels', description: 'Street and place names', swatch: 'labels' },
  { key: 'studyArea', label: 'City limits', description: 'We only map inside this line', swatch: 'study' },
]

export function ControlPanel({ manifest }: Props) {
  const { available, scenarioFt, layers } = useAppState()
  const dispatch = useAppDispatch()
  const hasLowLying = !!manifest && manifest.lowLying.length > 0

  return (
    <div className="scrollbar-thin flex h-full flex-col overflow-y-auto">
      <section aria-labelledby="sec-level" className="px-5 pt-5 pb-6">
        <h2 id="sec-level" className="t-title mb-3">
          Sea level
        </h2>
        <ScenarioSelector
          available={available}
          value={scenarioFt}
          onChange={(feet) => dispatch({ type: 'setScenario', feet })}
          disabled={!manifest}
        />
      </section>

      <section aria-labelledby="sec-layers" className="border-t border-line px-5 pt-5 pb-5">
        <h2 id="sec-layers" className="t-title mb-2">
          On the map
        </h2>
        {LAYERS.filter((l) => !l.needsLowLying || hasLowLying).map((l) => (
          <Switch
            key={l.key}
            checked={layers[l.key]}
            onChange={() => dispatch({ type: 'toggleLayer', layer: l.key })}
            label={l.label}
            description={l.description}
            swatch={<Swatch kind={l.swatch} size={16} />}
          />
        ))}
      </section>
    </div>
  )
}
