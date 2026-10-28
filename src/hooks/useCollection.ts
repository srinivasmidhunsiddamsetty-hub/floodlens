import { useEffect, useState } from 'react'
import { loadCollection } from '../lib/geojson'
import type { ExtentCollection } from '../types/data'

export interface CollectionState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Most recent successfully loaded data — kept while the next file loads so the map never flashes empty. */
  data: ExtentCollection | null
  /** The file `data` belongs to. */
  dataFile: string | null
  error: string | null
}

const IDLE: CollectionState = { status: 'idle', data: null, dataFile: null, error: null }

export function useCollection(file: string | null): CollectionState {
  const [state, setState] = useState<CollectionState>(IDLE)

  useEffect(() => {
    if (!file) {
      setState(IDLE)
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, status: 'loading', error: null }))
    loadCollection(file)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, dataFile: file, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: 'error', data: null, dataFile: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [file])

  return state
}
