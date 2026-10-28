import { useMemo } from 'react'
import { bandsFor, lowLyingByFeet, type FloodBand } from '../lib/manifest'
import type { AppState } from '../state/reducer'
import type { DataManifest, ExtentCollection, ExtentFeature } from '../types/data'
import { useCollection, useCollections, type CollectionState } from './useCollection'

export interface MapData {
  /** Every band in the manifest (for legend, chart, slider). */
  bands: FloodBand[]
  /** Bands drawn for the current water level, merged into one collection tagged with `band`. */
  flood: ExtentCollection | null
  lowLying: CollectionState
  studyArea: CollectionState
  /** Human-readable problems with specific files (missing-data disclosure). */
  errors: string[]
  loading: boolean
}

/** Resolves which processed NOAA files the current water level needs, loads them and merges them into bands. */
export function useMapData(manifest: DataManifest | null, state: AppState): MapData {
  const bands = useMemo(() => (manifest ? bandsFor(manifest) : []), [manifest])
  const visible = bands.filter((b) => b.feet <= state.scenarioFt)
  const files = visible.map((b) => b.file)
  const loaded = useCollections(files)

  const lowMeta = manifest ? lowLyingByFeet(manifest, state.scenarioFt) : undefined
  const lowLying = useCollection(state.layers.lowLying ? (lowMeta?.file ?? null) : null)
  const studyArea = useCollection(manifest?.studyArea.file ?? null)

  const flood = useMemo<ExtentCollection | null>(() => {
    if (!loaded.data) return null
    const features: ExtentFeature[] = []
    for (const b of bands) {
      const fc = loaded.data.get(b.file)
      if (!fc || b.feet > state.scenarioFt) continue
      for (const f of fc.features) features.push({ ...f, properties: { ...f.properties, band: b.feet } })
    }
    return { type: 'FeatureCollection', features }
  }, [loaded.data, bands, state.scenarioFt])

  const errors = [...loaded.errors]
  if (manifest && !bands.some((b) => b.feet === state.scenarioFt)) {
    errors.push(`No processed NOAA extent is available for ${state.scenarioFt} ft.`)
  }
  for (const c of [lowLying, studyArea]) if (c.error) errors.push(c.error)

  return {
    bands,
    flood,
    lowLying,
    studyArea,
    errors,
    loading: loaded.status === 'loading' || lowLying.status === 'loading',
  }
}
