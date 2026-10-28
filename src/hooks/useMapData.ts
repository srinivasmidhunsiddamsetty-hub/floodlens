import { comparisonFor, lowLyingByFeet, scenarioByFeet } from '../lib/manifest'
import { comparePair, type AppState } from '../state/reducer'
import type { DataManifest } from '../types/data'
import { useCollection, type CollectionState } from './useCollection'

export interface MapData {
  /** Ocean-connected extent shown as the primary overlay (the lower scenario when comparing). */
  extent: CollectionState
  extentFeet: number | null
  /** Additional extent between the compared scenarios (higher − lower). */
  compare: CollectionState
  pair: [number, number] | null
  lowLying: CollectionState
  studyArea: CollectionState
  /** Human-readable problems with specific files (missing-data disclosure). */
  errors: string[]
  loading: boolean
}

/** Resolves which processed NOAA files the current UI state needs and loads them. */
export function useMapData(manifest: DataManifest | null, state: AppState): MapData {
  const pair = manifest ? comparePair(state) : null
  const extentFeet = pair ? pair[0] : state.scenarioFt

  const extentMeta = manifest ? scenarioByFeet(manifest, extentFeet) : undefined
  const compareMeta = manifest && pair ? comparisonFor(manifest, pair[0], pair[1]) : undefined
  const lowMeta = manifest ? lowLyingByFeet(manifest, state.scenarioFt) : undefined

  const extent = useCollection(extentMeta?.file ?? null)
  const compare = useCollection(compareMeta?.file ?? null)
  const lowLying = useCollection(state.layers.lowLying ? (lowMeta?.file ?? null) : null)
  const studyArea = useCollection(manifest?.studyArea.file ?? null)

  const errors: string[] = []
  if (manifest && !extentMeta) errors.push(`No processed NOAA extent is available for ${extentFeet} ft.`)
  if (manifest && pair && !compareMeta) errors.push(`No comparison layer exists for ${pair[0]} ft → ${pair[1]} ft.`)
  for (const c of [extent, compare, lowLying, studyArea]) if (c.error) errors.push(c.error)

  return {
    extent,
    extentFeet: extentMeta ? extentFeet : null,
    compare,
    pair,
    lowLying,
    studyArea,
    errors,
    loading: [extent, compare, lowLying].some((c) => c.status === 'loading'),
  }
}
