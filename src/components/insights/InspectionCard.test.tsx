import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { InspectionState } from '../../hooks/useInspection'
import type { Selection } from '../../state/reducer'
import { InspectionCard } from './InspectionCard'

const building: Selection = {
  lngLat: [-80.13466, 25.77675],
  building: {
    renderHeightM: 5.2,
    renderMinHeightM: 0,
    footprint: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [] } },
    footprintAreaM2: 2001,
  },
  street: { name: 'Euclid Avenue', distanceM: 34 },
  insideStudyArea: true,
  onWater: false,
}

const levels = (first: number | null): InspectionState => ({
  status: 'ready',
  result: {
    hits: [0, 1, 2, 3].map((feet) => ({ feet, within: first !== null && feet >= first })),
    firstFeet: first,
    lowHits: [0, 1, 2, 3].map((feet) => ({ feet, within: false })),
    usedFootprint: true,
    lowPartAreaM2: null,
  },
})

const card = (inspection: InspectionState, over: Partial<Parameters<typeof InspectionCard>[0]> = {}) =>
  render(<InspectionCard selection={building} inspection={inspection} scenarioFt={3} onClear={() => {}} onShowLevel={() => {}} {...over} />)

describe('<InspectionCard>', () => {
  it('names the building, its street and position', () => {
    card(levels(3))
    expect(screen.getByRole('heading', { name: 'Building near Euclid Avenue' })).toBeInTheDocument()
    expect(screen.getByText('34 m from street')).toBeInTheDocument()
    expect(screen.getByText('25.77675° N, 80.13466° W')).toBeInTheDocument()
  })

  it('leads with the first water level that reaches it', () => {
    card(levels(3))
    expect(screen.getByText('First reached')).toBeInTheDocument()
    expect(screen.getByText('Within the mapped extent at +3 ft.')).toBeInTheDocument()
    const gauge = screen.getByRole('list', { name: 'Within NOAA’s mapped extent, by water level' })
    expect(within(gauge).getAllByRole('listitem')).toHaveLength(4)
    expect(within(gauge).getAllByText('outside mapped extent')).toHaveLength(3)
  })

  it('lists height, footprint and low-lying status with approximate values', () => {
    card(levels(1))
    expect(screen.getByText('Height (approx.)').nextSibling).toHaveTextContent('≈ 5 m')
    expect(screen.getByText('Footprint (approx.)').nextSibling).toHaveTextContent('≈ 2,001 m²')
    expect(screen.getByText('Low-lying area').nextSibling).toHaveTextContent('No')
    expect(screen.getByText('Within the mapped extent from +1 ft upward.')).toBeInTheDocument()
  })

  it('offers to show the level on the map when the slider is below it', async () => {
    const onShowLevel = vi.fn()
    card(levels(3), { scenarioFt: 1, onShowLevel })
    await userEvent.click(screen.getByRole('button', { name: /Not on the map at \+1 ft · show \+3 ft/ }))
    expect(onShowLevel).toHaveBeenCalledWith(3)
  })

  it('says "above +3 ft" when no mapped level reaches it, without claiming it stays dry', () => {
    card(levels(null))
    expect(screen.getByText('Outside NOAA’s mapped extent at every level up to +3 ft.')).toBeInTheDocument()
    expect(screen.queryByText(/dry|safe/i)).toBeNull()
  })

  it('explains places outside the city boundary instead of showing results', () => {
    card(levels(2), { selection: { ...building, insideStudyArea: false } })
    expect(screen.getByText(/Outside the study area/)).toBeInTheDocument()
    expect(screen.queryByText('First reached')).toBeNull()
  })

  it('clears from the × button', async () => {
    const onClear = vi.fn()
    card(levels(2), { onClear })
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection (Esc)' }))
    expect(onClear).toHaveBeenCalled()
  })
})
