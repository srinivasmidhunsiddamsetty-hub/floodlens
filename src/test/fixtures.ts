import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { DataManifest, ExtentCollection } from '../types/data'

const DATA_DIR = resolve(__dirname, '../../public/data/noaa')

/** The real manifest produced by scripts/prepare_noaa_slr.py */
export function realManifestJson(): unknown {
  return JSON.parse(readFileSync(resolve(DATA_DIR, 'manifest.json'), 'utf8'))
}

export function realCollection(file: string): ExtentCollection {
  return JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf8')) as ExtentCollection
}

/** Minimal valid manifest for state/UI tests that should not depend on the real data. */
export function makeManifest(overrides: Partial<DataManifest> = {}): DataManifest {
  const scenario = (feet: number, areaM2: number, beyond: number) => ({
    id: `slr_${feet}ft`,
    feet,
    label: feet === 0 ? '0 ft' : `+${feet} ft`,
    kind: 'slr' as const,
    sourceLayer: `FL_SE_slr_${feet}_0ft`,
    file: `slr_${feet}ft.geojson`,
    areaM2,
    beyondBaselineM2: beyond,
    bytes: 100,
    featureCount: 1,
    vertexCount: 5,
  })
  return {
    schemaVersion: 1,
    generatedAt: '2026-01-01T00:00:00+00:00',
    generator: 'test',
    source: {
      publisher: 'NOAA Office for Coastal Management (OCM)',
      dataset: 'test',
      geography: 'FL_SE',
      geographyCounties: ['Miami-Dade'],
      indexUrl: 'https://example.test/index',
      downloadUrl: 'https://example.test/file.zip',
      file: 'test.gpkg',
      fileSizeBytes: 1,
      publicationYear: 2023,
      metadata: {},
      verticalReference: 'MHHW',
      credit: 'NOAA',
      useConstraints: 'Screening only',
    },
    studyArea: { name: 'Test', bbox: [-80.16, 25.76, -80.118, 25.8], areaM2: 18_000_000, file: 'study_area.geojson' },
    crs: { source: 'EPSG:4269', output: 'EPSG:4326', processing: 'EPSG:26917' },
    processing: { simplifyToleranceM: 0.75, minPartAreaM2: 1, coordinateDecimals: 6, areaMethod: 'geodesic', steps: [], validation: [] },
    scenarios: [scenario(0, 10_000_000, 0), scenario(1, 10_020_000, 20_000), scenario(2, 10_500_000, 500_000), scenario(3, 12_300_000, 2_300_000)],
    lowLying: [],
    comparisons: [{ id: 'diff_1ft_3ft', fromFt: 1, toFt: 3, file: 'diff_1ft_3ft.geojson', areaM2: 2_280_000, bytes: 1, featureCount: 1, vertexCount: 1 }],
    ...overrides,
  }
}
