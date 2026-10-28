import { ChevronLeft, ChevronRight, ChevronUp, Layers, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ControlPanel } from './components/controls/ControlPanel'
import { AboutDataDialog } from './components/dialogs/AboutDataDialog'
import { DataSourcesDialog } from './components/dialogs/DataSourcesDialog'
import { InsightPanel } from './components/insights/InsightPanel'
import { TopBar } from './components/layout/TopBar'
import { MapLegend } from './components/map/MapLegend'
import { MapView } from './components/map/MapView'
import { formatKm2, formatScenario } from './lib/format'
import { comparisonFor, scenarioByFeet } from './lib/manifest'
import { useInspection } from './hooks/useInspection'
import { useManifest } from './hooks/useManifest'
import { useMapData } from './hooks/useMapData'
import { useIsDesktop } from './hooks/useMediaQuery'
import { useAppDispatch, useAppState } from './state/AppState'
import { comparePair } from './state/reducer'

export default function App() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const isDesktop = useIsDesktop()
  const manifestState = useManifest()
  const manifest = manifestState.manifest
  const mapData = useMapData(manifest, state)
  const inspection = useInspection(state.selection, manifest, state.scenarioFt)
  const [legendOpen, setLegendOpen] = useState(true)
  const pair = comparePair(state)

  // Drawers start closed on small screens so the map is visible first.
  useEffect(() => {
    dispatch({ type: 'setPanel', panel: 'controls', open: isDesktop })
    dispatch({ type: 'setPanel', panel: 'insights', open: isDesktop })
    setLegendOpen(isDesktop)
  }, [isDesktop, dispatch])

  // A new selection on mobile reveals the insights sheet so the result is visible.
  useEffect(() => {
    if (!isDesktop && state.selection) dispatch({ type: 'setPanel', panel: 'insights', open: true })
  }, [isDesktop, state.selection, dispatch])

  const { controls: controlsOpen, insights: insightsOpen } = state.panels
  const closeControls = () => dispatch({ type: 'setPanel', panel: 'controls', open: false })

  const peek = (() => {
    if (!manifest) return manifestState.status === 'error' ? 'Data unavailable' : 'Loading…'
    if (pair) {
      const c = comparisonFor(manifest, pair[0], pair[1])
      return c ? `+${formatKm2(c.areaM2)} km² added` : '—'
    }
    const s = scenarioByFeet(manifest, state.scenarioFt)
    return s ? `${formatKm2(s.beyondBaselineM2)} km² beyond 0 ft` : '—'
  })()

  return (
    <div className="flex h-full flex-col">
      <a
        href="#map-region"
        className="sr-only-focusable fixed top-2 left-2 z-50 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white"
      >
        Skip to map
      </a>
      <TopBar isDesktop={isDesktop} controlsOpen={controlsOpen} />

      <div className="relative flex min-h-0 flex-1">
        {/* ---------------- Left: controls (docked on desktop, drawer below 1024px) */}
        {isDesktop ? (
          controlsOpen && (
            <aside id="control-panel" aria-label="Scenario controls" className="panel w-[288px] shrink-0 border-r xl:w-[304px]">
              <ControlPanel manifest={manifest} legendOpen={legendOpen} onLegendChange={setLegendOpen} />
            </aside>
          )
        ) : (
          <>
            {controlsOpen && (
              <div className="absolute inset-0 z-30 bg-black/30 animate-fade-in" onClick={closeControls} aria-hidden="true" />
            )}
            <aside
              id="control-panel"
              aria-label="Scenario controls"
              aria-hidden={!controlsOpen}
              inert={!controlsOpen}
              className={`panel absolute inset-y-0 left-0 z-40 w-[min(320px,88vw)] border-r shadow-panel transition-transform duration-200 ${
                controlsOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <button
                type="button"
                onClick={closeControls}
                className="btn-ghost absolute top-4 right-3 size-8 justify-center px-0"
                aria-label="Close scenario controls"
              >
                <X className="size-4" aria-hidden />
              </button>
              <ControlPanel manifest={manifest} legendOpen={legendOpen} onLegendChange={setLegendOpen} />
            </aside>
          </>
        )}

        {/* ---------------- Center: map */}
        <main id="map-region" tabIndex={-1} className="relative min-w-0 flex-1 outline-none">
          <MapView data={mapData} studyBbox={manifest?.studyArea.bbox ?? null} />

          <div
            className={`pointer-events-none absolute left-3 z-10 flex flex-col items-start gap-2 ${
              isDesktop ? 'bottom-14' : 'bottom-[76px]'
            }`}
          >
            {legendOpen ? (
              <MapLegend
                scenarioFt={state.scenarioFt}
                pair={pair}
                showLowLying={state.layers.lowLying}
                showBuildings={state.layers.buildings}
                showStudyArea={state.layers.studyArea}
                showInundation={state.layers.inundation}
                onClose={() => setLegendOpen(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setLegendOpen(true)}
                className="btn-ghost pointer-events-auto border border-line-strong bg-surface/95 shadow-panel"
              >
                <Layers className="size-4" aria-hidden /> Legend
              </button>
            )}
          </div>

          {isDesktop && (
            <div className="absolute top-1/2 z-10 flex w-full -translate-y-1/2 justify-between px-0">
              <button
                type="button"
                onClick={() => dispatch({ type: 'setPanel', panel: 'controls', open: !controlsOpen })}
                className="grid h-12 w-5 place-items-center rounded-r-md border border-l-0 border-line-strong bg-surface/95 text-fg-subtle hover:text-fg"
                aria-label={controlsOpen ? 'Collapse scenario controls' : 'Expand scenario controls'}
                aria-expanded={controlsOpen}
                aria-controls="control-panel"
              >
                {controlsOpen ? <ChevronLeft className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'setPanel', panel: 'insights', open: !insightsOpen })}
                className="mr-0 grid h-12 w-5 place-items-center rounded-l-md border border-r-0 border-line-strong bg-surface/95 text-fg-subtle hover:text-fg"
                aria-label={insightsOpen ? 'Collapse exposure insights' : 'Expand exposure insights'}
                aria-expanded={insightsOpen}
                aria-controls="insight-panel"
              >
                {insightsOpen ? <ChevronRight className="size-3.5" aria-hidden /> : <ChevronLeft className="size-3.5" aria-hidden />}
              </button>
            </div>
          )}
        </main>

        {/* ---------------- Right: insights (docked on desktop, bottom sheet below 1024px) */}
        {isDesktop ? (
          insightsOpen && (
            <aside id="insight-panel" aria-label="Exposure insights" className="panel w-[320px] shrink-0 border-l xl:w-[340px]">
              <InsightPanel manifestState={manifestState} inspection={inspection} />
            </aside>
          )
        ) : (
          <aside
            id="insight-panel"
            aria-label="Exposure insights"
            className={`panel absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t shadow-panel transition-[height] duration-200 ${
              insightsOpen ? 'h-[min(62vh,560px)]' : 'h-16'
            }`}
          >
            <button
              type="button"
              onClick={() => dispatch({ type: 'setPanel', panel: 'insights', open: !insightsOpen })}
              aria-expanded={insightsOpen}
              aria-controls="insight-sheet-body"
              className="flex h-16 w-full shrink-0 items-center justify-between gap-3 px-5 text-left"
            >
              <span>
                <span className="block text-[13px] font-semibold text-fg">
                  Exposure insights · {pair ? `${formatScenario(pair[0])} → ${formatScenario(pair[1])}` : formatScenario(state.scenarioFt)}
                </span>
                <span className="block text-xs text-fg-muted tabular">{peek}</span>
              </span>
              <ChevronUp className={`size-4 text-fg-subtle transition-transform ${insightsOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            <div id="insight-sheet-body" className="min-h-0 flex-1 border-t border-line" hidden={!insightsOpen}>
              <InsightPanel manifestState={manifestState} inspection={inspection} showHeader={false} />
            </div>
          </aside>
        )}
      </div>

      <AboutDataDialog open={state.dialog === 'about'} onClose={() => dispatch({ type: 'openDialog', dialog: null })} manifest={manifest} />
      <DataSourcesDialog
        open={state.dialog === 'sources'}
        onClose={() => dispatch({ type: 'openDialog', dialog: null })}
        manifest={manifest}
        manifestError={manifestState.error}
      />
    </div>
  )
}
