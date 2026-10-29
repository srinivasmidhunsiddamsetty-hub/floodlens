import { describe, expect, it } from 'vitest'
import { formatAcres, formatArea, formatCoord, formatKm2, formatPercent, formatScenario, formatScenarioLong, formatSmallArea, toUnit } from './format'

describe('format', () => {
  it('formats km² with magnitude-aware precision', () => {
    expect(formatKm2(0)).toBe('0')
    expect(formatKm2(21_680)).toBe('0.022')
    expect(formatKm2(526_288)).toBe('0.53')
    expect(formatKm2(12_987_800)).toBe('13.0')
  })

  it('converts to US survey acres', () => {
    expect(formatAcres(4046.8564224)).toBe('1.0')
    expect(formatAcres(526_288)).toBe('130')
  })

  it('labels scenarios relative to MHHW', () => {
    expect(formatScenario(0)).toBe('0 ft')
    expect(formatScenario(2)).toBe('+2 ft')
    expect(formatScenarioLong(0)).toMatch(/MHHW/)
    expect(formatScenarioLong(3)).toBe('+3 ft above MHHW')
  })

  it('formats small areas, percentages and coordinates', () => {
    expect(formatSmallArea(1234.4)).toBe('1,234 m²')
    // Large buildings stay in m², never km².
    expect(formatSmallArea(11_420.6)).toBe('11,421 m²')
    expect(formatPercent(0.0004)).toBe('<0.1%')
    expect(formatPercent(0.598)).toBe('60%')
    expect(formatCoord(-80.1342, 25.7811)).toBe('25.78110° N, 80.13420° W')
  })

  it('formats an area in the chosen unit only', () => {
    expect(formatArea(7_432_662.7, 'km2')).toBe('7.43')
    expect(formatArea(7_432_662.7, 'acres')).toBe('1,837')
    expect(toUnit(4046.8564224, 'acres')).toBeCloseTo(1)
    expect(toUnit(2_000_000, 'km2')).toBe(2)
  })
})
