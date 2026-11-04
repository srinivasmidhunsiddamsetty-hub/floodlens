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

const rgb = (hex: string) => hex.replace(/^#(..)(..)(..)$/, (_, r, g, b) => `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`)
const swatchOf = (label: string) => screen.getByText(label).closest('li')!.querySelector('span[aria-hidden]') as HTMLElement
const name = (b: FloodBand) => (b.isReference ? 'Today' : `+${b.feet} ft`)

describe('<MapLegend>', () => {
  it('is a vertical scale, today at the bottom and the top level at the top (v0.34)', () => {
    render(<MapLegend bands={bands} scenarioFt={2} colorMode="detailed" showFlood />)
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(rows).toEqual(['+5 ft', '+4 ft', '+3 ft', '+2 ft (chosen level)', '+1 ft', 'Today'])
    // Only the sea-level colours: no water, low spot, building, selection or city-limits keys (v0.35).
    expect(screen.queryByText(/Low spot|Building|Selected|City limits|Water$/)).toBeNull()
  })

  it('shows every level in its own colour, whatever the slider shows', () => {
    render(<MapLegend bands={bands} scenarioFt={2} colorMode="detailed" showFlood />)
    expect(screen.getByText('Water first reaches')).toBeInTheDocument()
    for (const b of bands) expect(swatchOf(name(b)).style.background).toBe(rgb(bandColor(b.feet)))
  })

  it('shows only with Layered colours and while the flood layer is on (v0.35)', () => {
    const { container, rerender } = render(<MapLegend bands={bands} scenarioFt={2} colorMode="simple" showFlood />)
    expect(container).toBeEmptyDOMElement()
    rerender(<MapLegend bands={bands} scenarioFt={2} colorMode="detailed" showFlood={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('is a plain key that takes the pointer from the map (v0.28, v0.35)', () => {
    render(<MapLegend bands={bands} scenarioFt={2} colorMode="detailed" showFlood />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByRole('region', { name: 'Map legend' })).toHaveClass('pointer-events-auto', 'cursor-default')
  })
})
