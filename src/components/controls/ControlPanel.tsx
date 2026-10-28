import { Box, Crosshair, RotateCcw, Square } from 'lucide-react'
import { formatScenario } from '../../lib/format'
import { useAppDispatch, useAppState } from '../../state/AppState'
import { comparePair, type LayerKey } from '../../state/reducer'
import type { DataManifest } from '../../types/data'
import { Segmented } from '../ui/Segmented'
import { Swatch } from '../ui/Swatch'
import { Switch } from '../ui/Switch'
import { ScenarioSelector } from './ScenarioSelector'

interface Props {
  manifest: DataManifest | null
  legendOpen: boolean
  onLegendChange: (open: boolean) => void
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="border-t border-line px-5 py-4 first:border-t-0">
      <h3 id={id} className="section-title mb-3">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function ControlPanel({ manifest, legendOpen, onLegendChange }: Props) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const { available, scenarioFt, compare, layers, viewMode } = state
  const pair = comparePair(state)
  const toggle = (layer: LayerKey) => () => dispatch({ type: 'toggleLayer', layer })
  const hasLowLying = !!manifest && manifest.lowLying.length > 0

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-1">
        <h2 className="text-[15px] font-semibold text-fg">Explore scenarios</h2>
        <p className="mt-0.5 text-xs text-fg-subtle">NOAA inundation extents · South Beach</p>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <section aria-label="Scenario" className="px-5 pt-4 pb-5">
          <ScenarioSelector
            available={available}
            value={scenarioFt}
            onChange={(feet) => dispatch({ type: 'setScenario', feet })}
            disabled={!manifest}
          />
        </section>

        <Section title="Compare" id="sec-compare">
          <Switch
            checked={compare.enabled}
            onChange={(enabled) => dispatch({ type: 'setCompareEnabled', enabled })}
            label="Compare two scenarios"
            description="Highlights the extent added between them"
            disabled={available.length < 2}
          />
          {compare.enabled && (
            <div className="mt-3 animate-slide-up">
              <p id="cmp-with" className="mb-1.5 text-xs text-fg-muted">
                Compare {formatScenario(scenarioFt)} with
              </p>
              <Segmented
                label={`Compare ${formatScenario(scenarioFt)} with`}
                size="sm"
                value={compare.withFt}
                onChange={(feet) => dispatch({ type: 'setCompareWith', feet })}
                options={available
                  .filter((ft) => ft !== scenarioFt)
                  .map((ft) => ({ value: ft, label: formatScenario(ft) }))}
              />
              {pair && (
                <ul className="mt-3 space-y-1.5 text-xs text-fg-muted">
                  <li className="flex items-center gap-2">
                    <Swatch kind="flood" size={12} /> Mapped extent at {formatScenario(pair[0])}
                  </li>
                  <li className="flex items-center gap-2">
                    <Swatch kind="compare" size={12} /> Added by {formatScenario(pair[1])}
                  </li>
                </ul>
              )}
            </div>
          )}
        </Section>

        <Section title="Map layers" id="sec-layers">
          <Switch
            checked={layers.inundation}
            onChange={toggle('inundation')}
            label="Mapped inundation extent"
            description="NOAA, ocean-connected"
            swatch={<Swatch kind="flood" />}
          />
          {hasLowLying && (
            <Switch
              checked={layers.lowLying}
              onChange={toggle('lowLying')}
              label="Low-lying areas"
              description="Below the water level but not ocean-connected"
              swatch={<Swatch kind="lowLying" />}
            />
          )}
          <Switch
            checked={layers.buildings}
            onChange={toggle('buildings')}
            label="3D buildings"
            description={viewMode === '2d' ? 'Shown as footprints in 2D' : 'OpenStreetMap heights'}
            swatch={<Swatch kind="building" />}
          />
          <Switch checked={layers.labels} onChange={toggle('labels')} label="Map labels" />
          <Switch
            checked={layers.studyArea}
            onChange={toggle('studyArea')}
            label="Study-area boundary"
            description="Data are clipped to this area"
            swatch={<Swatch kind="study" />}
          />
        </Section>

        <Section title="Display" id="sec-display">
          <Segmented
            label="Map perspective"
            value={viewMode}
            onChange={(mode) => dispatch({ type: 'setViewMode', mode })}
            options={[
              { value: '2d', label: <><Square className="size-3.5" aria-hidden /> 2D</>, ariaLabel: '2D top-down' },
              { value: '3d', label: <><Box className="size-3.5" aria-hidden /> 3D</>, ariaLabel: '3D oblique' },
            ]}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-ghost justify-center border border-line px-2 text-xs whitespace-nowrap"
              onClick={() => dispatch({ type: 'resetCamera' })}
            >
              <RotateCcw className="size-3.5" aria-hidden /> Reset camera
            </button>
            <button
              type="button"
              className="btn-ghost justify-center border border-line px-2 text-xs whitespace-nowrap"
              onClick={() => dispatch({ type: 'inspectCenter' })}
              aria-label="Inspect map center"
            >
              <Crosshair className="size-3.5" aria-hidden /> Inspect center
            </button>
          </div>
          <div className="mt-2">
            <Switch checked={legendOpen} onChange={onLegendChange} label="Show legend" />
          </div>
        </Section>
      </div>
    </div>
  )
}
