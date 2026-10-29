import { useEffect, useState } from 'react'
import { probeScenarios, type ScenarioHit } from '../lib/geo'
import { loadCollection } from '../lib/geojson'
import type { Selection } from '../state/reducer'
import type { DataManifest, ExtentCollection } from '../types/data'

export interface InspectionResult {
  /** Ocean-connected extent membership, one entry per scenario (ascending). */
  hits: ScenarioHit[]
  firstFeet: number | null
  /** Hydrologically unconnected low-lying areas, per scenario. */
  lowHits: ScenarioHit[]
  /** Whether the probe used a building footprint (true) or a single point (false). */
  usedFootprint: boolean
}

export type InspectionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; result: InspectionResult }
  | { status: 'error'; error: string }

async function loadAll(files: { feet: number; file: string }[]) {
  const entries = await Promise.all(files.map(async (s) => [s.feet, await loadCollection(s.file)] as const))
  return new Map<number, ExtentCollection>(entries)
}

/**
 * Spatial look-up for a selected location: tests the point (or the clicked
 * building's footprint) against every processed scenario. Purely derived from
 * the NOAA polygons — no modelling, no interpolation.
 */
export function useInspection(selection: Selection | null, manifest: DataManifest | null): InspectionState {
  const [state, setState] = useState<InspectionState>({ status: 'idle' })

  useEffect(() => {
    if (!selection || !manifest) {
      setState({ status: 'idle' })
      return
    }
    if (!selection.insideStudyArea) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    Promise.all([loadAll(manifest.scenarios), loadAll(manifest.lowLying)])
      .then(([slr, low]) => {
        if (cancelled) return
        const probe = { point: selection.lngLat, footprint: selection.building?.footprint }
        const { hits, firstFeet } = probeScenarios(slr, probe)
        const { hits: lowHits } = probeScenarios(low, probe)
        setState({ status: 'ready', result: { hits, firstFeet, lowHits, usedFootprint: !!probe.footprint } })
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: 'error', error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [selection, manifest])

  return state
}
