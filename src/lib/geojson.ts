import type { ExtentCollection } from '../types/data'
import { fileUrl } from './manifest'

export class DataFileError extends Error {
  readonly file: string
  constructor(file: string, message: string) {
    super(message)
    this.name = 'DataFileError'
    this.file = file
  }
}

const cache = new Map<string, Promise<ExtentCollection>>()

export function isFeatureCollection(v: unknown): v is ExtentCollection {
  return (
    !!v &&
    typeof v === 'object' &&
    (v as { type?: unknown }).type === 'FeatureCollection' &&
    Array.isArray((v as { features?: unknown }).features)
  )
}

async function fetchCollection(file: string): Promise<ExtentCollection> {
  let res: Response
  try {
    res = await fetch(fileUrl(file))
  } catch {
    throw new DataFileError(file, `Network error while loading ${file}.`)
  }
  if (!res.ok) throw new DataFileError(file, `${file} is missing (HTTP ${res.status}).`)
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new DataFileError(file, `${file} is not valid GeoJSON.`)
  }
  if (!isFeatureCollection(json)) throw new DataFileError(file, `${file} is not a GeoJSON FeatureCollection.`)
  return json
}

/** Fetch a processed GeoJSON file once per session; failed requests are not cached. */
export function loadCollection(file: string): Promise<ExtentCollection> {
  let p = cache.get(file)
  if (!p) {
    p = fetchCollection(file)
    p.catch(() => cache.delete(file))
    cache.set(file, p)
  }
  return p
}

export function clearCollectionCache() {
  cache.clear()
}
