import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeManifest, realManifestJson } from '../test/fixtures'
import { comparisonFor, fetchManifest, ManifestError, parseManifest, scenarioByFeet } from './manifest'

describe('parseManifest — source metadata handling', () => {
  it('accepts the manifest produced by the data pipeline', () => {
    const m = parseManifest(realManifestJson())
    expect(m.source.publisher).toMatch(/NOAA Office for Coastal Management/)
    expect(m.source.geography).toBe('FL_SE')
    expect(m.source.downloadUrl).toMatch(/^https:\/\/chs\.coast\.noaa\.gov\//)
    expect(m.crs).toEqual({ source: 'EPSG:4269', output: 'EPSG:4326', processing: 'EPSG:26917' })
    expect(m.scenarios.map((s) => s.feet)).toEqual([0, 1, 2, 3])
    expect(m.processing.validation.every((v) => v.passed)).toBe(true)
  })

  it('sorts scenarios by water level', () => {
    const base = makeManifest()
    const m = parseManifest({ ...base, scenarios: [...base.scenarios].reverse() })
    expect(m.scenarios.map((s) => s.feet)).toEqual([0, 1, 2, 3])
  })

  it.each([
    ['null', null, /empty/],
    ['wrong schema', { ...makeManifest(), schemaVersion: 2 }, /schema version/],
    ['no attribution', { ...makeManifest(), source: { publisher: '' } }, /attribution/],
    ['bad bbox', { ...makeManifest(), studyArea: { ...makeManifest().studyArea, bbox: [1, 2, 3] } }, /bounding box/],
    ['no scenarios', { ...makeManifest(), scenarios: [] }, /no sea-level-rise scenarios/],
  ])('rejects %s', (_, raw, msg) => {
    expect(() => parseManifest(raw)).toThrowError(msg)
  })

  it('rejects incomplete and negative scenario entries', () => {
    const m = makeManifest()
    const missingArea = { ...m, scenarios: [{ ...m.scenarios[0], areaM2: undefined }] }
    expect(() => parseManifest(missingArea)).toThrow(ManifestError)
    const negative = { ...m, scenarios: [{ ...m.scenarios[1], beyondBaselineM2: -5 }] }
    expect(() => parseManifest(negative)).toThrow(/negative/)
  })

  it('rejects duplicate scenarios', () => {
    const m = makeManifest()
    expect(() => parseManifest({ ...m, scenarios: [m.scenarios[1], m.scenarios[1]] })).toThrow(/duplicate/)
  })

  it('finds comparison layers regardless of argument order', () => {
    const m = makeManifest()
    expect(comparisonFor(m, 1, 3)?.id).toBe('diff_1ft_3ft')
    expect(comparisonFor(m, 3, 1)?.id).toBe('diff_1ft_3ft')
    expect(comparisonFor(m, 0, 2)).toBeUndefined()
    expect(scenarioByFeet(m, 2)?.file).toBe('slr_2ft.geojson')
    expect(scenarioByFeet(m, 5)).toBeUndefined()
  })
})

describe('fetchManifest — missing-data handling', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('explains how to generate data when the manifest is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })))
    await expect(fetchManifest()).rejects.toThrow(/HTTP 404.*npm run data:prepare/)
  })

  it('reports network failures without leaking stack traces', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(fetchManifest()).rejects.toThrow(/Could not reach the processed NOAA data/)
  })

  it('reports invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{oops', { status: 200 })))
    await expect(fetchManifest()).rejects.toThrow(/not valid JSON/)
  })

  it('returns a parsed manifest on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(makeManifest()), { status: 200 })))
    const m = await fetchManifest()
    expect(m.scenarios).toHaveLength(4)
  })
})
