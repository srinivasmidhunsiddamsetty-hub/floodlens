import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

/** Shape of public/data/noaa/manifest.json, written by scripts/prepare_noaa_slr.py */
export interface DataManifest {
  schemaVersion: number
  generatedAt: string
  generator: string
  source: SourceInfo
  studyArea: StudyArea
  crs: { source: string; output: string; processing: string }
  processing: ProcessingInfo
  scenarios: ScenarioMeta[]
  lowLying: LowLyingMeta[]
  comparisons: ComparisonMeta[]
}

export interface SourceInfo {
  publisher: string
  dataset: string
  geography: string
  geographyCounties: string[]
  indexUrl: string
  downloadUrl: string
  file: string
  fileSizeBytes: number
  publicationYear: number
  metadata: Record<string, string>
  verticalReference: string
  credit: string
  useConstraints: string
}

export interface StudyArea {
  name: string
  /** [west, south, east, north] in EPSG:4326 */
  bbox: [number, number, number, number]
  areaM2: number
  file: string
  /** Where the outline comes from (US Census TIGER/Line place boundary). */
  boundary?: StudyAreaBoundary
}

export interface StudyAreaBoundary {
  publisher: string
  dataset: string
  downloadUrl: string
  geoid: string
  name: string
  /** Census-reported land and water area inside the boundary (m²). */
  censusLandM2: number
  censusWaterM2: number
  license: string
}

export interface ValidationCheck {
  pair: string
  lowerOutsideHigherM2: number
  differenceAreaM2: number
  areaDeltaM2: number
  relativeError: number
  passed: boolean
}

export interface ProcessingInfo {
  simplifyToleranceM: number
  minPartAreaM2: number
  coordinateDecimals: number
  areaMethod: string
  steps: string[]
  validation: ValidationCheck[]
}

interface FileStats {
  file: string
  bytes: number
  featureCount: number
  vertexCount: number
}

export interface ScenarioMeta extends FileStats {
  id: string
  feet: number
  label: string
  kind: 'slr'
  sourceLayer: string
  /** Geodesic area of the mapped ocean-connected extent inside the study area (m²) */
  areaM2: number
  /** Geodesic area of the extent that lies outside the 0 ft (current MHHW) extent (m²) */
  beyondBaselineM2: number
}

export interface LowLyingMeta extends FileStats {
  id: string
  feet: number
  kind: 'low'
  sourceLayer: string
  areaM2: number
}

export interface ComparisonMeta extends FileStats {
  id: string
  fromFt: number
  toFt: number
  areaM2: number
}

export interface ExtentProperties {
  layer: string
  kind: 'slr' | 'low' | 'difference'
  part: number
  areaM2: number
  scenarioFt?: number
  fromFt?: number
  toFt?: number
  source?: string
  /** Set client-side: the water level (ft) at which this area is first reached. */
  band?: number
}

export type ExtentFeature = Feature<Polygon | MultiPolygon, ExtentProperties>
export type ExtentCollection = FeatureCollection<Polygon | MultiPolygon, ExtentProperties>
