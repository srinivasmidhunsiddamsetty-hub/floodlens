import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { ControlPanel } from './components/controls/ControlPanel'
import { AboutDataDialog } from './components/dialogs/AboutDataDialog'
import { DataSourcesDialog } from './components/dialogs/DataSourcesDialog'
import { InsightPanel } from './components/insights/InsightPanel'
import { TopBar } from './components/layout/TopBar'
import { MapLegend } from './components/map/MapLegend'
import { MapView } from './components/map/MapView'
import { useInspection } from './hooks/useInspection'
import { useManifest } from './hooks/useManifest'
import { useMapData } from './hooks/useMapData'
import { useAppDispatch, useAppState } from './state/AppState'

/**
 * Insights width (v0.37): fixed, with no resize handle or close tab, at the width long card
 * titles were measured for (v0.27). The owner wants it simply wide enough.
 */
const INSIGHTS_WIDTH = 380

/** Desktop and laptop only (v0.33): a docked panel on the left; the Insights cards float over the right of the map (v0.34). */
export default function App() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const manifestState = useManifest()
  const manifest = manifestState.manifest
  const mapData = useMapData(manifest, state)
  const inspection = useInspection(state.selection, manifest)

  // Esc clears the selection anywhere (dialogs handle their own Esc first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !state.dialog && state.selection) dispatch({ type: 'select', selection: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, state.dialog, state.selection])

  const controlsOpen = state.panels.controls

  return (
    <div className="flex h-full flex-col">
      <a href="#map-region" className="sr-only-focusable fixed top-2 left-2 z-50 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white">
        Skip to map
      </a>
      <TopBar />

      <div className="relative flex min-h-0 flex-1">
        {/* ---------------- Left: sea level + layers */}
        {controlsOpen && (
          <aside id="control-panel" aria-label="Sea level and layers" className="panel w-[280px] shrink-0 border-r">
            <ControlPanel manifest={manifest} />
          </aside>
        )}

        {/* ---------------- Center: map */}
        <main id="map-region" tabIndex={-1} className="relative min-w-0 flex-1 outline-none">
          <MapView
            data={mapData}
            studyBbox={manifest?.studyArea.bbox ?? null}
            rightInset={INSIGHTS_WIDTH}
          />

          <div className="pointer-events-none absolute bottom-4 left-4 z-10">
            <MapLegend
              bands={mapData.bands}
              scenarioFt={state.scenarioFt}
              colorMode={state.colorMode}
              showFlood={state.layers.inundation}
            />
          </div>

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
          {/* ---------------- Right: insights. The cards float over the map with no panel behind
              them (v0.34, as in v0.27–v0.31; docked in v0.32–v0.33); the map is padded so they never
              hide the city. Always shown, at a fixed width (v0.37). */}
          <aside id="insight-panel" aria-label="Insights" className="pointer-events-none absolute inset-y-0 right-0 z-20" style={{ width: INSIGHTS_WIDTH }}>
            <InsightPanel manifestState={manifestState} inspection={inspection} />
          </aside>
        </main>
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
