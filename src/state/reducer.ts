import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { LngLat } from '../lib/geo'

export type ViewMode = '3d' | '2d'
export type LayerKey = 'inundation' | 'buildings' | 'labels' | 'lowLying' | 'studyArea'
export type DialogKey = 'sources' | 'about' | null

export interface BuildingInfo {
  /** OpenMapTiles render_height (m). May be derived from OSM levels or a default. */
  renderHeightM: number | null
  renderMinHeightM: number | null
  /** Footprint as drawn in the vector tiles (tile-split pieces re-joined). */
  footprint: Feature<Polygon | MultiPolygon>
  /** Geodesic area of the footprint as drawn in the vector tiles (m²). */
  footprintAreaM2: number
}

export interface Selection {
  lngLat: LngLat
  building: BuildingInfo | null
  street: { name: string; distanceM: number } | null
  insideStudyArea: boolean
  /** The clicked point is drawn as water by the OpenStreetMap basemap. */
  onWater: boolean
}

export interface AppState {
  /** Scenario feet available in the manifest, ascending. Empty until the manifest loads. */
  available: number[]
  scenarioFt: number
  layers: Record<LayerKey, boolean>
  viewMode: ViewMode
  selection: Selection | null
  dialog: DialogKey
  /** Incremented to ask the map to fly back to the initial camera. */
  cameraResetToken: number
  /** Incremented to inspect the location at the map centre (keyboard alternative to clicking). */
  inspectCenterToken: number
  /** Mobile/tablet drawers; desktop panels can be collapsed too. */
  panels: { controls: boolean; insights: boolean }
}

export type Action =
  | { type: 'manifestLoaded'; available: number[] }
  | { type: 'setScenario'; feet: number }
  | { type: 'stepScenario'; delta: 1 | -1 }
  | { type: 'toggleLayer'; layer: LayerKey }
  | { type: 'setLayer'; layer: LayerKey; visible: boolean }
  | { type: 'setViewMode'; mode: ViewMode }
  | { type: 'select'; selection: Selection | null }
  | { type: 'openDialog'; dialog: DialogKey }
  | { type: 'resetCamera' }
  | { type: 'inspectCenter' }
  | { type: 'setPanel'; panel: keyof AppState['panels']; open: boolean }

export const DEFAULT_SCENARIO_FT = 2

export const initialState: AppState = {
  available: [],
  scenarioFt: DEFAULT_SCENARIO_FT,
  layers: { inundation: true, buildings: true, labels: true, lowLying: false, studyArea: true },
  viewMode: '3d',
  selection: null,
  dialog: null,
  cameraResetToken: 0,
  inspectCenterToken: 0,
  panels: { controls: true, insights: true },
}

/** Nearest available scenario to `target`, preferring the lower one on ties. */
export function nearestScenario(available: number[], target: number): number {
  if (available.length === 0) return target
  return available.reduce((best, ft) => (Math.abs(ft - target) < Math.abs(best - target) ? ft : best))
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'manifestLoaded': {
      const available = [...action.available].sort((a, b) => a - b)
      const scenarioFt = available.includes(state.scenarioFt)
        ? state.scenarioFt
        : nearestScenario(available, state.scenarioFt)
      return { ...state, available, scenarioFt }
    }
    case 'setScenario': {
      if (state.available.length && !state.available.includes(action.feet)) return state
      if (action.feet === state.scenarioFt) return state
      return { ...state, scenarioFt: action.feet }
    }
    case 'stepScenario': {
      const i = state.available.indexOf(state.scenarioFt)
      const next = state.available[i + action.delta]
      return next === undefined ? state : { ...state, scenarioFt: next }
    }
    case 'toggleLayer':
      return { ...state, layers: { ...state.layers, [action.layer]: !state.layers[action.layer] } }
    case 'setLayer':
      return { ...state, layers: { ...state.layers, [action.layer]: action.visible } }
    case 'setViewMode':
      return action.mode === state.viewMode ? state : { ...state, viewMode: action.mode }
    case 'select':
      return { ...state, selection: action.selection }
    case 'openDialog':
      return { ...state, dialog: action.dialog }
    case 'resetCamera':
      return { ...state, viewMode: '3d', cameraResetToken: state.cameraResetToken + 1 }
    case 'inspectCenter':
      return { ...state, inspectCenterToken: state.inspectCenterToken + 1 }
    case 'setPanel':
      return { ...state, panels: { ...state.panels, [action.panel]: action.open } }
    default:
      return state
  }
}
