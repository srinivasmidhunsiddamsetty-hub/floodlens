import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FloodBand } from '../../lib/manifest'
import { bandColor } from '../../lib/theme'
import { MapLegend } from './MapLegend'

const bands: FloodBand[] = [0, 1, 2, 3, 4, 5].map((feet) => ({
  feet,
  file: feet === 0 ? 'slr_0ft.geojson' : `diff_${feet - 1}ft_${feet}ft.geojson`,
  addedM2: feet === 0 ? 0 : 1,
  isReference: feet === 0,
}))

describe('<MapLegend>', () => {
  it('shows every level in its true colour, even above the slider', () => {
    render(
      <MapLegend bands={bands} scenarioFt={2} showFlood showLowLying={false} showBuildings showStudyArea highlightFt={null} onHighlight={() => {}} />,
    )
    expect(screen.queryByText(/not shown/i)).toBeNull()
    for (const b of bands) {
      const row = screen.getByRole('button', { name: b.isReference ? 'Today’s high tide' : `+${b.feet} ft` })
      const swatch = row.querySelector('span[aria-hidden]') as HTMLElement
      expect(swatch.style.background).toBe(bandColor(b.feet).replace(/^#(..)(..)(..)$/, (_, r, g, bl) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(bl, 16)})`))
      expect(swatch.style.opacity).toBe('')
    }
  })
})
