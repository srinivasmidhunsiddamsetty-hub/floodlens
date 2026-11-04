import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
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
const name = (b: FloodBand) => (b.isReference ? '0 ft' : `+${b.feet} ft`)

describe('<MapLegend>', () => {
  afterEach(() => localStorage.clear())

  it('is a vertical scale, today at the bottom and the top level at the top, with no level highlighted (v0.34, v0.54)', () => {
    render(<MapLegend bands={bands} colorMode="detailed" showFlood />)
    const rows = screen.getAllByRole('listitem')
    // Today's level reads "0 ft" (v0.40), like the rest of the scale.
    expect(rows.map((li) => li.textContent)).toEqual(['+5 ft', '+4 ft', '+3 ft', '+2 ft', '+1 ft', '0 ft'])
    // The slider already shows the chosen level, so the key marks none (v0.54).
    for (const li of rows) expect(li.lastElementChild).not.toHaveClass('font-bold')
    // Only the sea-level colours: no water, low spot, building, selection or city-limits keys (v0.35).
    expect(screen.queryByText(/Low spot|Building|Selected|City limits|Water$/)).toBeNull()
  })

  it('shows every level in its own colour under the place card’s words, "Water reaches at" (v0.54)', () => {
    render(<MapLegend bands={bands} colorMode="detailed" showFlood />)
    expect(screen.getByText('Water reaches at')).toBeInTheDocument()
    expect(screen.queryByText('Water first reaches')).toBeNull()
    for (const b of bands) expect(swatchOf(name(b)).style.background).toBe(rgb(bandColor(b.feet)))
  })

  it('shows only with Per foot colours and while the flood layer is on (v0.35)', () => {
    const { container, rerender } = render(<MapLegend bands={bands} colorMode="simple" showFlood />)
    expect(container).toBeEmptyDOMElement()
    rerender(<MapLegend bands={bands} colorMode="detailed" showFlood={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('is a plain key: its only control is the minus, and it takes the pointer from the map (v0.28, v0.35, v0.54)', () => {
    render(<MapLegend bands={bands} colorMode="detailed" showFlood />)
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Minimise legend'])
    expect(screen.getByRole('region', { name: 'Map legend' })).toHaveClass('pointer-events-auto', 'cursor-default')
  })

  it('minimises to a small square of its colours, opens again, and remembers it (v0.54)', async () => {
    const { unmount } = render(<MapLegend bands={bands} colorMode="detailed" showFlood />)
    await userEvent.click(screen.getByRole('button', { name: 'Minimise legend' }))
    expect(screen.queryByRole('list')).toBeNull()
    const show = screen.getByRole('button', { name: 'Show legend' })
    expect(show).toHaveFocus()
    expect(show).toHaveClass('size-8')
    expect(localStorage.getItem('floodlens.legendMinimised')).toBe('1')
    // Still minimised on the next visit in this browser.
    unmount()
    render(<MapLegend bands={bands} colorMode="detailed" showFlood />)
    await userEvent.click(screen.getByRole('button', { name: 'Show legend' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Minimise legend' })).toHaveFocus()
    expect(localStorage.getItem('floodlens.legendMinimised')).toBe('0')
  })

  it('takes no focus on page load', () => {
    localStorage.setItem('floodlens.legendMinimised', '1')
    render(<MapLegend bands={bands} colorMode="detailed" showFlood />)
    expect(screen.getByRole('button', { name: 'Show legend' })).not.toHaveFocus()
  })
})
