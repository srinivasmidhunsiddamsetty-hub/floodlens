import { describe, expect, it } from 'vitest'
import { clampWidth, INSIGHTS_WIDTH } from './usePanelWidth'

describe('clampWidth', () => {
  it('keeps the insights panel between its minimum and maximum', () => {
    expect(clampWidth(100, INSIGHTS_WIDTH, 1440)).toBe(300)
    expect(clampWidth(420.4, INSIGHTS_WIDTH, 1440)).toBe(420)
    expect(clampWidth(2000, INSIGHTS_WIDTH, 1440)).toBe(560)
  })

  it('lowers the maximum on small windows so the map stays usable', () => {
    // 1100 px window − 700 px reserved (left panel + map) leaves 400 px at most.
    expect(clampWidth(560, INSIGHTS_WIDTH, 1100)).toBe(400)
  })

  it('never goes below the minimum, even when the window is too small', () => {
    expect(clampWidth(560, INSIGHTS_WIDTH, 900)).toBe(300)
  })
})
