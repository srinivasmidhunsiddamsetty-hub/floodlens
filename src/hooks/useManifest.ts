import { useEffect, useState } from 'react'
import { fetchManifest } from '../lib/manifest'
import { useAppDispatch } from '../state/AppState'
import type { DataManifest } from '../types/data'

export type ManifestState =
  | { status: 'loading'; manifest: null; error: null }
  | { status: 'ready'; manifest: DataManifest; error: null }
  | { status: 'error'; manifest: null; error: string }

export function useManifest(): ManifestState {
  const dispatch = useAppDispatch()
  const [state, setState] = useState<ManifestState>({ status: 'loading', manifest: null, error: null })

  useEffect(() => {
    const ctrl = new AbortController()
    fetchManifest(ctrl.signal)
      .then((manifest) => {
        setState({ status: 'ready', manifest, error: null })
        dispatch({ type: 'manifestLoaded', available: manifest.scenarios.map((s) => s.feet) })
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return
        setState({ status: 'error', manifest: null, error: err.message })
      })
    return () => ctrl.abort()
  }, [dispatch])

  return state
}
