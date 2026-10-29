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
  render(<InspectionCard selection={building} inspection={inspection} scenarioFt={3} onClear={() => {}} {...over} />)

describe('<InspectionCard>', () => {
  it('names the building and its position, without the distance to the street', () => {
    card(levels(3))
    expect(screen.getByRole('heading', { name: 'Building near Euclid Avenue' })).toBeInTheDocument()
    expect(screen.getByText('25.77675° N, 80.13466° W')).toBeInTheDocument()
    expect(screen.queryByText(/from street/)).toBeNull()
  })

  it('leads with the first water level that reaches it, and shows every level in context', () => {
    card(levels(3))
    expect(screen.getByText('Water reaches at').nextSibling).toHaveTextContent(/^\+3 ft$/)
    const levelsList = screen.getByRole('list', { name: 'Water at this spot, by sea level' })
    expect(within(levelsList).getAllByRole('listitem')).toHaveLength(4)
    expect(within(levelsList).getAllByText('water doesn’t reach it')).toHaveLength(3)
  })

  it('lists height, footprint and low-lying status with approximate values', () => {
    card(levels(1))
    // "≈" already says approximate, so the labels don't repeat it.
    expect(screen.getByText('Height').nextSibling).toHaveTextContent('≈ 5 m')
    expect(screen.getByText('Footprint').nextSibling).toHaveTextContent('≈ 2,001 m²')
    expect(screen.getByText('Low spot').nextSibling).toHaveTextContent('No')
    expect(screen.queryByText(/approx/i)).toBeNull()
  })

  it('doesn’t offer to jump to another level, whatever the slider shows', () => {
    card(levels(3), { scenarioFt: 1 })
    expect(screen.queryByText(/You’re looking at|See it at/)).toBeNull()
  })

  it('says water doesn’t reach it up to +3 ft, without claiming it stays dry', () => {
    card(levels(null))
    // The label keeps the limit; the answer says it plainly (v0.30).
    expect(screen.getByText('Up to +3 ft').nextSibling).toHaveTextContent('Doesn’t reach it')
    expect(screen.queryByText('Water reaches at')).toBeNull()
    expect(screen.queryByText(/dry|safe|Not up to/i)).toBeNull()
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

  it('says "Today" for places water reaches at today’s high tide', () => {
    card(levels(0))
    expect(screen.getByText('Water reaches at').nextSibling).toHaveTextContent(/^Today$/)
  })

  it('keeps height and footprint for a spot that isn’t a building, with no value', () => {
    card(levels(2), { selection: { ...building, building: null } })
    expect(screen.getByText('Height').nextSibling).toHaveTextContent('no building here')
    expect(screen.getByText('Footprint').nextSibling).toHaveTextContent('no building here')
  })

  it('closes from the × button', async () => {
    const onClear = vi.fn()
    card(levels(2), { onClear })
    await userEvent.click(screen.getByRole('button', { name: 'Close (Esc)' }))
    expect(onClear).toHaveBeenCalled()
  })
})
