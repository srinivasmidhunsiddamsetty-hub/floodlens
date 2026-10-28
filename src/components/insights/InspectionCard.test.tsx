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
    expect(screen.getByText('When water reaches it').nextSibling).toHaveTextContent('At +3 ft')
    const gauge = screen.getByRole('list', { name: 'Water at this spot, by sea level' })
    expect(within(gauge).getAllByRole('listitem')).toHaveLength(4)
    expect(within(gauge).getAllByText('water doesn’t reach it')).toHaveLength(3)
  })

  it('lists height, footprint and low-lying status with approximate values', () => {
    card(levels(1))
    // "≈" already says approximate, so the labels don't repeat it.
    expect(screen.getByText('Height').nextSibling).toHaveTextContent('≈ 5 m')
    expect(screen.getByText('Footprint').nextSibling).toHaveTextContent('≈ 2,001 m²')
    expect(screen.getByText('Low spot').nextSibling).toHaveTextContent('No')
    expect(screen.queryByText(/approx/i)).toBeNull()
  })

  it('offers to show the level on the map when the slider is below it', async () => {
    const onShowLevel = vi.fn()
    card(levels(3), { scenarioFt: 1, onShowLevel })
    await userEvent.click(screen.getByRole('button', { name: /You’re looking at \+1 ft\. See it at \+3 ft/ }))
    expect(onShowLevel).toHaveBeenCalledWith(3)
  })

  it('says water doesn’t reach it up to +3 ft, without claiming it stays dry', () => {
    card(levels(null))
    expect(screen.getByText('When water reaches it').nextSibling).toHaveTextContent('Not up to +3 ft')
    expect(screen.queryByText(/dry|safe/i)).toBeNull()
  })

  it('lists every answer in one column: when water reaches it, height, footprint, low spot', () => {
    card(levels(2))
    const labels = screen.getAllByRole('term').map((t) => t.textContent)
    expect(labels).toEqual(['When water reaches it', 'Height', 'Footprint', 'Low spot'])
  })

  it('explains places outside the city boundary instead of showing results', () => {
    card(levels(2), { selection: { ...building, insideStudyArea: false } })
    expect(screen.getByText(/This spot is outside Miami Beach/)).toBeInTheDocument()
    expect(screen.queryByText('Water reaches it')).toBeNull()
  })

  it('says "already today" for places water reaches at today’s high tide', () => {
    card(levels(0))
    expect(screen.getByText('When water reaches it').nextSibling).toHaveTextContent('Already today')
  })

  it('closes from the × button', async () => {
    const onClear = vi.fn()
    card(levels(2), { onClear })
    await userEvent.click(screen.getByRole('button', { name: 'Close (Esc)' }))
    expect(onClear).toHaveBeenCalled()
  })
})
