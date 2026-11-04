import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { AppStateProvider } from '../../state/AppState'
import { initialState, type Selection } from '../../state/reducer'
import { makeManifest } from '../../test/fixtures'
import { InsightPanel } from './InsightPanel'

const manifest = makeManifest()

const building: Selection = {
  lngLat: [-80.13466, 25.77675],
  building: null,
  street: { name: 'Euclid Avenue', distanceM: 12 },
  insideStudyArea: true,
  onWater: false,
}

const ready = (over = {}) =>
  render(
    <AppStateProvider initial={{ ...initialState, available: [0, 1, 2, 3], scenarioFt: 2, ...over }}>
      <InsightPanel manifestState={{ status: 'ready', manifest, error: null }} inspection={{ status: 'idle' }} />
    </AppStateProvider>,
  )

describe('<InsightPanel>', () => {
  // jsdom has no element scrolling; a new selection scrolls the card into view.
  beforeAll(() => {
    if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {}
  })
  afterEach(() => localStorage.clear())

  it('invites a selection in the slot where the selection card appears', () => {
    ready()
    expect(screen.getByText('Click any building')).toBeInTheDocument()
  })

  it('drops the prompt for good after the first pick, so nothing shows when the card closes (v0.53)', async () => {
    const { unmount } = ready({ selection: building })
    await userEvent.click(screen.getByRole('button', { name: 'Close (Esc)' }))
    expect(screen.queryByText('Click any building')).toBeNull()
    expect(localStorage.getItem('floodlens.clickHintDone')).toBe('1')
    // A later visit in the same browser starts with the right side empty too.
    unmount()
    ready()
    expect(screen.queryByText('Click any building')).toBeNull()
  })

  it('holds only what you pick on the map: no city-wide figures or chart (v0.36)', () => {
    ready({ layers: { ...initialState.layers, lowLying: true } })
    expect(screen.queryByRole('heading', { name: 'Land underwater' })).toBeNull()
    expect(screen.queryByText(/km²|acres|of the city’s land|adds|Low spots/)).toBeNull()
    expect(screen.queryByRole('group', { name: /Land underwater by sea level/ })).toBeNull()
  })

  it('renders a missing-data state without any numbers', () => {
    render(
      <AppStateProvider>
        <InsightPanel
          manifestState={{ status: 'error', manifest: null, error: 'Processed NOAA data not found (HTTP 404).' }}
          inspection={{ status: 'idle' }}
        />
      </AppStateProvider>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/The flood data didn’t load/)
    expect(screen.getByRole('alert')).toHaveTextContent(/never fills the gap with estimates or sample data/)
    expect(screen.queryByText(/km²/)).toBeNull()
  })
})
