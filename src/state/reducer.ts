import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { LngLat } from '../lib/geo'

export type ViewMode = '3d' | '2d'
export type LayerKey = 'inundation' | 'buildings' | 'labels' | 'lowLying' | 'studyArea'
export type DialogKey = 'sources' | 'about' | null

export interface BuildingInfo {
  /** OpenMapTiles render_height (m). May be derived from OSM levels or a default. */
  renderHeightM: number | null
  renderMinHeightM: number | null
  footprint: Feature<Polygon | MultiPolygon>
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
  compare: { enabled: boolean; withFt: number }
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
  | { type: 'setCompareEnabled'; enabled: boolean }
  | { type: 'setCompareWith'; feet: number }
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
  compare: { enabled: false, withFt: 1 },
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
  return available.reduce((best, ft) =>
    Math.abs(ft - target) < Math.abs(best - target) ? ft : best,
  )
}

/** A comparison partner for `scenario`: keep `preferred` if valid, else the next lower, else the next higher. */
export function pickComparePartner(available: number[], scenario: number, preferred: number): number {
  if (preferred !== scenario && available.includes(preferred)) return preferred
  const lower = available.filter((f) => f < scenario)
  if (lower.length) return lower[lower.length - 1]
  const higher = available.filter((f) => f > scenario)
  return higher.length ? higher[0] : scenario
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'manifestLoaded': {
      const available = [...action.available].sort((a, b) => a - b)
      const scenarioFt = available.includes(state.scenarioFt)
        ? state.scenarioFt
        : nearestScenario(available, state.scenarioFt)
      const withFt = pickComparePartner(available, scenarioFt, state.compare.withFt)
      return {
        ...state,
        available,
        scenarioFt,
        compare: { enabled: state.compare.enabled && available.length > 1, withFt },
      }
    }
    case 'setScenario': {
      if (state.available.length && !state.available.includes(action.feet)) return state
      if (action.feet === state.scenarioFt) return state
      return {
        ...state,
        scenarioFt: action.feet,
        compare: { ...state.compare, withFt: pickComparePartner(state.available, action.feet, state.compare.withFt) },
      }
    }
    case 'stepScenario': {
      const i = state.available.indexOf(state.scenarioFt)
      const next = state.available[i + action.delta]
      return next === undefined ? state : reducer(state, { type: 'setScenario', feet: next })
    }
    case 'setCompareEnabled': {
      if (action.enabled && state.available.length < 2) return state
      return {
        ...state,
        compare: {
          enabled: action.enabled,
          withFt: pickComparePartner(state.available, state.scenarioFt, state.compare.withFt),
        },
      }
    }
    case 'setCompareWith': {
      if (action.feet === state.scenarioFt || !state.available.includes(action.feet)) return state
      return { ...state, compare: { ...state.compare, withFt: action.feet } }
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

/** The ordered (lower, higher) pair being compared, or null when comparison is off. */
export function comparePair(state: AppState): [number, number] | null {
  if (!state.compare.enabled || state.compare.withFt === state.scenarioFt) return null
  const a = state.scenarioFt
  const b = state.compare.withFt
  return a < b ? [a, b] : [b, a]
}
