import { describe, expect, it } from 'vitest'
import type { FloodBand } from '../../lib/manifest'
import { chartTitle } from './ScenarioAreaChart'

const bands = (...added: number[]): FloodBand[] => [
  { feet: 0, file: 'slr_0ft.geojson', addedM2: 0, isReference: true },
  ...added.map((addedM2, i) => ({ feet: i + 1, file: `diff_${i}ft_${i + 1}ft.geojson`, addedM2, isReference: false })),
]

describe('chartTitle', () => {
  it('leads with the foot that adds most of the land when it clearly stands out', () => {
    // The real Miami Beach figures: +3 ft adds 6.44 of 7.43 km².
    expect(chartTitle(bands(38_000, 950_000, 6_440_000))).toBe('The biggest jump comes at +3 ft')
  })

  it('falls back to naming the measure when no single foot dominates', () => {
    expect(chartTitle(bands(1_000_000, 1_200_000, 1_400_000))).toBe('How each foot adds up')
    // More than half the total, but less than twice the next foot.
    expect(chartTitle(bands(0, 900_000, 1_100_000))).toBe('How each foot adds up')
  })

  it('names the measure when there is nothing to compare', () => {
    expect(chartTitle(bands())).toBe('How each foot adds up')
    expect(chartTitle(bands(0, 0, 0))).toBe('How each foot adds up')
  })
})
