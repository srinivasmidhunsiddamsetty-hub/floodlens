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

export interface CollectionsState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Loaded collections keyed by file; keeps the last complete set while a new set loads. */
  data: Map<string, ExtentCollection> | null
  errors: string[]
}

/** Loads a set of files together; `data` only updates once every file has arrived. */
export function useCollections(files: string[]): CollectionsState {
  const key = files.join('|')
  const [state, setState] = useState<CollectionsState>({ status: 'idle', data: null, errors: [] })

  useEffect(() => {
    const list = key ? key.split('|') : []
    if (!list.length) {
      setState({ status: 'idle', data: null, errors: [] })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, status: 'loading', errors: [] }))
    Promise.allSettled(list.map((f) => loadCollection(f))).then((results) => {
      if (cancelled) return
      const data = new Map<string, ExtentCollection>()
      const errors: string[] = []
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') data.set(list[i], r.value)
        else errors.push((r.reason as Error).message)
      })
      setState({ status: errors.length ? 'error' : 'ready', data, errors })
    })
    return () => {
      cancelled = true
    }
  }, [key])

  return state
}
