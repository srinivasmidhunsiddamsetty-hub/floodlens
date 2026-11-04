import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FloodBand } from '../../lib/manifest'
import { bandColor, SIMPLE_COLOR } from '../../lib/theme'
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
    render(<MapLegend bands={bands} scenarioFt={2} colorMode="detailed" showFlood showLowLying={false} />)
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(rows).toEqual(['+5 ft', '+4 ft', '+3 ft', '+2 ft (chosen level)', '+1 ft', 'Today'])
    // Only the sea-level colours: no water, building, selection or city-limits keys.
    expect(screen.queryByText(/Building|Selected|City limits|Water$/)).toBeNull()
  })

  it('in Detailed mode shows every level in its own colour, whatever the slider shows', () => {
    render(<MapLegend bands={bands} scenarioFt={2} colorMode="detailed" showFlood showLowLying={false} />)
    expect(screen.getByText('Water first reaches')).toBeInTheDocument()
    for (const b of bands) expect(swatchOf(name(b)).style.background).toBe(rgb(bandColor(b.feet)))
  })

  it('in Simple mode fills one colour up to the chosen level and leaves the levels above empty', () => {
    render(<MapLegend bands={bands} scenarioFt={2} colorMode="simple" showFlood showLowLying={false} />)
    expect(screen.getByText('Sea level')).toBeInTheDocument()
    for (const b of bands) expect(swatchOf(name(b)).style.background).toBe(b.feet <= 2 ? rgb(SIMPLE_COLOR) : '')
  })

  it('is a plain key: nothing in it is a button (v0.28)', () => {
    render(<MapLegend bands={bands} scenarioFt={2} colorMode="detailed" showFlood showLowLying />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByText('Low spot')).toBeInTheDocument()
  })
})
