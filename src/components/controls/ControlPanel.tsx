import type { CSSProperties } from 'react'
import { AREA_UNITS, formatArea, formatScenario } from '../../lib/format'
import { lowLyingByFeet } from '../../lib/manifest'
import { useAppDispatch, useAppState } from '../../state/AppState'
import type { LayerKey } from '../../state/reducer'
import type { DataManifest } from '../../types/data'
import { Segmented } from '../ui/Segmented'
import { Swatch, type SwatchKind } from '../ui/Swatch'
import { Switch } from '../ui/Switch'
import { ScenarioSelector } from './ScenarioSelector'
import { SubmergedArea } from './SubmergedArea'

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
  const { available, scenarioFt, layers, colorMode, areaUnit } = useAppState()
  const dispatch = useAppDispatch()
  const hasLowLying = !!manifest && manifest.lowLying.length > 0
  // The low-spot area at the chosen level, under its switch while the layer is on (v0.36; in the
  // Insights "Land underwater" card before). It's cut off from the sea, so it isn't in the
  // sea-level figures.
  const low = manifest && layers.lowLying ? lowLyingByFeet(manifest, scenarioFt) : undefined

  return (
    // Each section on its own white tile over the grey canvas, matching the Insights panel (v0.20).
    // The low-spot line adds a row, so the slider gives up that height (see ScenarioSelector).
    // `--fl-panel-rest` is everything in the panel but the slider, plus the top bar; on short
    // windows the cards and rows tighten (v0.39), so it shrinks by 36 px.
    <div
      className="scrollbar-thin flex h-full flex-col gap-3 overflow-y-auto bg-canvas p-3 [--fl-panel-rest:532px] short:[--fl-panel-rest:496px] tiny:[--fl-panel-rest:476px]"
      style={low ? ({ '--fl-panel-extra': '16px' } as CSSProperties) : undefined}
    >
      <section aria-labelledby="sec-level" className="card p-4 short:p-3">
        {/* The colour toggle sits beside the title (v0.35): one colour for all the water, or a
            colour for each foot (v0.34). Named Single and Layered in v0.35, Overview and Layered in v0.37,
            Total and Individual in v0.38 (the owner's names), Total and By level in v0.41, Overall and
            Per foot in v0.47 (the owner's pick: names that explain themselves). */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="sec-level" className="t-title text-[15px] font-bold tracking-[-0.01em]">
            Sea level
          </h2>
          <Segmented
            label="Map colours"
            size="sm"
            className="w-[148px]"
            value={colorMode}
            onChange={(mode) => dispatch({ type: 'setColorMode', mode })}
            options={[
              { value: 'simple', label: 'Overall' },
              { value: 'detailed', label: 'Per foot' },
            ]}
          />
        </div>
        <ScenarioSelector
          available={available}
          value={scenarioFt}
          onChange={(feet) => dispatch({ type: 'setScenario', feet })}
          colorMode={colorMode}
          disabled={!manifest}
        >
          <SubmergedArea
            manifest={manifest}
            scenarioFt={scenarioFt}
            colorMode={colorMode}
            unit={areaUnit}
            onUnitChange={(unit) => dispatch({ type: 'setAreaUnit', unit })}
          />
        </ScenarioSelector>
      </section>

      <section aria-labelledby="sec-layers" className="card p-4 short:p-3">
        <h2 id="sec-layers" className="t-title mb-2 text-[15px] font-bold tracking-[-0.01em]">
          On the map
        </h2>
        {LAYERS.filter((l) => !l.needsLowLying || hasLowLying).map((l) => (
          <Switch
            key={l.key}
            checked={layers[l.key]}
            onChange={() => dispatch({ type: 'toggleLayer', layer: l.key })}
            label={l.label}
            description={
              l.key === 'lowLying' && low ? (
                <>
                  {l.description}
                  {/* In the unit chosen beside the slider (v0.39). */}
                  <span className="block font-medium text-fg tabular">
                    {formatArea(low.areaM2, areaUnit)} {AREA_UNITS[areaUnit].short} at {formatScenario(low.feet)}
                  </span>
                </>
              ) : (
                l.description
              )
            }
            swatch={<Swatch kind={l.swatch} size={16} mode={colorMode} />}
          />
        ))}
      </section>
    </div>
  )
}
