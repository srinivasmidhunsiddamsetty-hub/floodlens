import type { ComparisonMeta, DataManifest, LowLyingMeta, ScenarioMeta } from '../types/data'

export const DATA_BASE_URL = `${import.meta.env.BASE_URL}data/noaa/`
export const MANIFEST_URL = `${DATA_BASE_URL}manifest.json`

export class ManifestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ManifestError'
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0

/**
 * Validate an unknown JSON value against the manifest schema the pipeline writes.
 * Throws a ManifestError that names the first problem, so the UI can show a
 * precise missing-data message instead of rendering partial/incorrect numbers.
 */
export function parseManifest(raw: unknown): DataManifest {
  if (!raw || typeof raw !== 'object') throw new ManifestError('Manifest is empty or not an object.')
  const m = raw as Record<string, unknown>
  if (m.schemaVersion !== 1) throw new ManifestError(`Unsupported manifest schema version: ${String(m.schemaVersion)}.`)

  const source = m.source as Record<string, unknown> | undefined
  if (!source || !isStr(source.publisher) || !isStr(source.downloadUrl)) {
    throw new ManifestError('Manifest is missing source attribution (publisher / download URL).')
  }

  const study = m.studyArea as Record<string, unknown> | undefined
  if (!study || !Array.isArray(study.bbox) || study.bbox.length !== 4 || !study.bbox.every(isNum)) {
    throw new ManifestError('Manifest study area bounding box is missing or malformed.')
  }
  if (!isNum(study.areaM2) || study.areaM2 <= 0) throw new ManifestError('Study-area size is missing.')

  if (!Array.isArray(m.scenarios) || m.scenarios.length === 0) {
    throw new ManifestError('Manifest lists no sea-level-rise scenarios.')
  }
  m.scenarios.forEach((s: Record<string, unknown>, i: number) => {
    if (!isNum(s.feet) || !isStr(s.file) || !isStr(s.id) || !isNum(s.areaM2) || !isNum(s.beyondBaselineM2)) {
      throw new ManifestError(`Scenario entry ${i} is incomplete (needs id, feet, file, areaM2, beyondBaselineM2).`)
    }
    if (s.areaM2 < 0 || s.beyondBaselineM2 < 0) throw new ManifestError(`Scenario ${s.id} has a negative area.`)
  })
  const feet = (m.scenarios as ScenarioMeta[]).map((s) => s.feet)
  if (new Set(feet).size !== feet.length) throw new ManifestError('Manifest lists duplicate scenarios.')

  for (const key of ['lowLying', 'comparisons'] as const) {
    if (m[key] !== undefined && !Array.isArray(m[key])) throw new ManifestError(`Manifest field "${key}" must be a list.`)
  }

  const manifest = raw as DataManifest
  return {
    ...manifest,
    lowLying: manifest.lowLying ?? [],
    comparisons: manifest.comparisons ?? [],
    scenarios: [...manifest.scenarios].sort((a, b) => a.feet - b.feet),
  }
}

export async function fetchManifest(signal?: AbortSignal): Promise<DataManifest> {
  let res: Response
  try {
    res = await fetch(MANIFEST_URL, { signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ManifestError('We couldn’t reach the flood data. Check your connection and reload.')
  }
  if (!res.ok) {
    throw new ManifestError(
      `The flood data isn’t here yet (HTTP ${res.status}). Run "npm run data:prepare" to create it in public/data/noaa/.`,
    )
  }
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new ManifestError('The data manifest is not valid JSON.')
  }
  return parseManifest(json)
}

export const scenarioByFeet = (m: DataManifest, ft: number): ScenarioMeta | undefined =>
  m.scenarios.find((s) => s.feet === ft)

export const lowLyingByFeet = (m: DataManifest, ft: number): LowLyingMeta | undefined =>
  m.lowLying.find((s) => s.feet === ft)

/** The additional-extent layer between two scenarios, independent of argument order. */
export function comparisonFor(m: DataManifest, a: number, b: number): ComparisonMeta | undefined {
  const [lo, hi] = a < b ? [a, b] : [b, a]
  return m.comparisons.find((c) => c.fromFt === lo && c.toFt === hi)
}

export interface FloodBand {
  /** Water level (ft above MHHW) at which this area is first reached. */
  feet: number
  file: string
  /** Area this level adds beyond the previous level (m²); 0 for the reference level. */
  addedM2: number
  isReference: boolean
}

/**
 * Splits the cumulative NOAA extents into disjoint bands: the reference extent
 * (0 ft) plus "area added by each next level", using the validated difference
 * layers between neighbouring scenarios. Returns only bands whose data exist.
 */
export function bandsFor(m: DataManifest): FloodBand[] {
  const bands: FloodBand[] = []
  m.scenarios.forEach((s, i) => {
    if (i === 0) {
      bands.push({ feet: s.feet, file: s.file, addedM2: 0, isReference: true })
      return
    }
    const c = comparisonFor(m, m.scenarios[i - 1].feet, s.feet)
    if (c) bands.push({ feet: s.feet, file: c.file, addedM2: c.areaM2, isReference: false })
  })
  return bands
}

export const fileUrl = (file: string) => `${DATA_BASE_URL}${file}`
