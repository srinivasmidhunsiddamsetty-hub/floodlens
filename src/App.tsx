import { ChevronLeft, ChevronRight, ChevronUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ControlPanel } from './components/controls/ControlPanel'
import { AboutDataDialog } from './components/dialogs/AboutDataDialog'
import { DataSourcesDialog } from './components/dialogs/DataSourcesDialog'
import { InsightPanel } from './components/insights/InsightPanel'
import { TopBar } from './components/layout/TopBar'
import { MapLegend } from './components/map/MapLegend'
import { MapView } from './components/map/MapView'
import { ResizeHandle } from './components/ui/ResizeHandle'
import { AREA_UNITS, formatArea, formatScenario } from './lib/format'
import { scenarioByFeet } from './lib/manifest'
import { useInspection } from './hooks/useInspection'
import { useManifest } from './hooks/useManifest'
import { useMapData } from './hooks/useMapData'
import { useIsDesktop } from './hooks/useMediaQuery'
import { INSIGHTS_WIDTH, usePanelWidth } from './hooks/usePanelWidth'
import { useAppDispatch, useAppState } from './state/AppState'

export default function App() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const isDesktop = useIsDesktop()
  const manifestState = useManifest()
  const manifest = manifestState.manifest
  const mapData = useMapData(manifest, state)
  const inspection = useInspection(state.selection, manifest, state.scenarioFt)
  /** Water level spotlighted on the map while hovering the chart, breakdown or legend. */
  const [highlightFt, setHighlightFt] = useState<number | null>(null)
  const insightsWidth = usePanelWidth('floodlens.insightsWidth', INSIGHTS_WIDTH)

  // Drawers start closed on small screens so the map is visible first.
  useEffect(() => {
    dispatch({ type: 'setPanel', panel: 'controls', open: isDesktop })
    dispatch({ type: 'setPanel', panel: 'insights', open: isDesktop })
  }, [isDesktop, dispatch])

  // A new selection on mobile reveals the insights sheet so the result is visible.
  useEffect(() => {
    if (!isDesktop && state.selection) dispatch({ type: 'setPanel', panel: 'insights', open: true })
  }, [isDesktop, state.selection, dispatch])

  // Esc clears the selection anywhere (dialogs handle their own Esc first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !state.dialog && state.selection) dispatch({ type: 'select', selection: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, state.dialog, state.selection])

  const { controls: controlsOpen, insights: insightsOpen } = state.panels
  const closeControls = () => dispatch({ type: 'setPanel', panel: 'controls', open: false })

  const peek = (() => {
    if (!manifest) return manifestState.status === 'error' ? 'Data unavailable' : 'Loading…'
    const s = scenarioByFeet(manifest, state.scenarioFt)
    if (!s) return '—'
    return s.feet === 0 ? 'Today’s high tide' : `${formatArea(s.beyondBaselineM2, state.areaUnit)} ${AREA_UNITS[state.areaUnit].short} of land underwater`
  })()

  const insightProps = { manifestState, inspection, bands: mapData.bands, highlightFt, onHighlight: setHighlightFt }

  return (
    <div className="flex h-full flex-col">
      <a href="#map-region" className="sr-only-focusable fixed top-2 left-2 z-50 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white">
        Skip to map
      </a>
      <TopBar isDesktop={isDesktop} controlsOpen={controlsOpen} />

      <div className="relative flex min-h-0 flex-1">
        {/* ---------------- Left: sea level + layers (docked on desktop, drawer below 1024px) */}
        {isDesktop ? (
          controlsOpen && (
            <aside id="control-panel" aria-label="Sea level and layers" className="panel w-[280px] shrink-0 border-r">
              <ControlPanel manifest={manifest} />
            </aside>
          )
        ) : (
          <>
            {controlsOpen && <div className="absolute inset-0 z-30 bg-black/30 animate-fade-in" onClick={closeControls} aria-hidden="true" />}
            <aside
              id="control-panel"
              aria-label="Sea level and layers"
              aria-hidden={!controlsOpen}
              inert={!controlsOpen}
              className={`panel absolute inset-y-0 left-0 z-40 w-[min(320px,88vw)] border-r shadow-float transition-transform duration-200 ${
                controlsOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <button
                type="button"
                onClick={closeControls}
                className="btn-ghost absolute top-4 right-3 z-10 size-8 justify-center px-0"
                aria-label="Close sea level and layers"
              >
                <X className="size-4" aria-hidden />
              </button>
              <ControlPanel manifest={manifest} />
            </aside>
          </>
        )}

        {/* ---------------- Center: map */}
        <main id="map-region" tabIndex={-1} className="relative min-w-0 flex-1 outline-none">
          <MapView
            data={mapData}
            studyBbox={manifest?.studyArea.bbox ?? null}
            highlightFt={highlightFt}
            rightInset={isDesktop && insightsOpen ? insightsWidth.width : 0}
          />

          <div className={`pointer-events-none absolute left-4 z-10 ${isDesktop ? 'bottom-12' : 'bottom-[120px]'}`}>
            <MapLegend
              key={isDesktop ? 'd' : 'm'}
              defaultOpen={isDesktop}
              bands={mapData.bands}
              scenarioFt={state.scenarioFt}
              showFlood={state.layers.inundation}
              showLowLying={state.layers.lowLying}
              showBuildings={state.layers.buildings}
              showStudyArea={state.layers.studyArea}
              highlightFt={highlightFt}
              onHighlight={setHighlightFt}
            />
          </div>

          {isDesktop && (
            <>
              <button
                type="button"
                onClick={() => dispatch({ type: 'setPanel', panel: 'controls', open: !controlsOpen })}
                className="absolute top-1/2 left-0 z-10 grid h-12 w-5 -translate-y-1/2 place-items-center rounded-r border border-l-0 border-line bg-surface text-fg-subtle shadow-panel hover:text-fg"
                aria-label={controlsOpen ? 'Collapse sea level and layers' : 'Expand sea level and layers'}
                aria-expanded={controlsOpen}
                aria-controls="control-panel"
              >
                {controlsOpen ? <ChevronLeft className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
              </button>
              {/* Sits in the 20 px gutter beside the floating cards, or at the edge when they're hidden. */}
              <button
                type="button"
                onClick={() => dispatch({ type: 'setPanel', panel: 'insights', open: !insightsOpen })}
                style={{ right: insightsOpen ? insightsWidth.width - 20 : 0 }}
                className="absolute top-1/2 z-10 grid h-12 w-5 -translate-y-1/2 place-items-center rounded-l border border-r-0 border-line bg-surface text-fg-subtle shadow-panel hover:text-fg"
                aria-label={insightsOpen ? 'Collapse insights' : 'Expand insights'}
                aria-expanded={insightsOpen}
                aria-controls="insight-panel"
              >
                {insightsOpen ? <ChevronRight className="size-3.5" aria-hidden /> : <ChevronLeft className="size-3.5" aria-hidden />}
              </button>
            </>
          )}

          {/* ---------------- Right: insights. On desktop the cards float over the map, with no
              panel behind them (v0.27); the map is padded so they never hide the city. */}
          {isDesktop && insightsOpen && (
            <aside id="insight-panel" aria-label="Insights" className="pointer-events-none absolute inset-y-0 right-0 z-20" style={{ width: insightsWidth.width }}>
              <ResizeHandle
                width={insightsWidth.width}
                min={insightsWidth.min}
                max={insightsWidth.max}
                onChange={insightsWidth.setWidth}
                onReset={insightsWidth.reset}
                controls="insight-panel"
                label="Resize insights panel"
              />
              <InsightPanel {...insightProps} floating />
            </aside>
          )}
        </main>

        {/* ---------------- Below 1024px: insights in a bottom sheet */}
        {!isDesktop && (
          <aside
            id="insight-panel"
            aria-label="Insights"
            className={`panel absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-xl border-t shadow-float transition-[height] duration-200 ${
              insightsOpen ? 'h-[min(64vh,580px)]' : 'h-16'
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
                <span className="block t-label text-fg">Insights · {formatScenario(state.scenarioFt)}</span>
                <span className="block t-caption tabular">{peek}</span>
              </span>
              <ChevronUp className={`size-4 text-fg-subtle transition-transform ${insightsOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            <div id="insight-sheet-body" className="min-h-0 flex-1 border-t border-line" hidden={!insightsOpen}>
              <InsightPanel {...insightProps} />
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
