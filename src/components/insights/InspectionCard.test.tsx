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
  it('names the building and its position, without the distance to the street', () => {
    card(levels(3))
    expect(screen.getByRole('heading', { name: 'Building near Euclid Avenue' })).toBeInTheDocument()
    expect(screen.getByText('25.77675° N, 80.13466° W')).toBeInTheDocument()
    expect(screen.queryByText(/from street/)).toBeNull()
  })

  it('copies the position as "lat, lng"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    card(levels(3))
    await userEvent.click(screen.getByRole('button', { name: 'Copy coordinates' }))
    expect(writeText).toHaveBeenCalledWith('25.77675, -80.13466')
    expect(await screen.findByRole('button', { name: 'Coordinates copied' })).toBeInTheDocument()
  })

  it('leads with the first water level that reaches it, and shows every level in context', () => {
    card(levels(3))
    expect(screen.getByText('Water first reaches it').nextSibling).toHaveTextContent('at +3 ft')
    const levelsList = screen.getByRole('list', { name: 'Water at this spot, by sea level' })
    expect(within(levelsList).getAllByRole('listitem')).toHaveLength(4)
    expect(within(levelsList).getAllByText('Not reached')).toHaveLength(3)
    expect(within(levelsList).getByText('First reached')).toBeInTheDocument()
  })

  it('marks the levels after the first one as reached', () => {
    card(levels(1))
    const levelsList = screen.getByRole('list', { name: 'Water at this spot, by sea level' })
    expect(within(levelsList).getAllByText('Reached')).toHaveLength(2)
    expect(within(levelsList).getAllByText('Not reached')).toHaveLength(1)
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
    expect(screen.getByText('Water doesn’t reach it').nextSibling).toHaveTextContent('up to +3 ft')
    expect(screen.queryByText('First reached')).toBeNull()
    expect(screen.queryByText(/dry|safe/i)).toBeNull()
  })

  it('lists the facts in one column: height, footprint, low spot', () => {
    card(levels(2))
    const labels = screen.getAllByRole('term').map((t) => t.textContent)
    expect(labels).toEqual(['Height', 'Footprint', 'Low spot'])
  })

  it('explains places outside the city boundary instead of showing results', () => {
    card(levels(2), { selection: { ...building, insideStudyArea: false } })
    expect(screen.getByText(/This spot is outside Miami Beach/)).toBeInTheDocument()
    expect(screen.queryByText('Water reaches it')).toBeNull()
  })

  it('says water already reaches it at high tide for places it reaches today', () => {
    card(levels(0))
    expect(screen.getByText('Water already reaches it').nextSibling).toHaveTextContent('at high tide')
  })

  it('closes from the × button', async () => {
    const onClear = vi.fn()
    card(levels(2), { onClear })
    await userEvent.click(screen.getByRole('button', { name: 'Close (Esc)' }))
    expect(onClear).toHaveBeenCalled()
  })
})
