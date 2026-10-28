import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppStateProvider } from '../../state/AppState'
import { initialState } from '../../state/reducer'
import { makeManifest } from '../../test/fixtures'
import { InsightPanel } from './InsightPanel'

// D3 chart measures layout with ResizeObserver, which jsdom lacks.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  },
)

const ready = (over = {}) =>
  render(
    <AppStateProvider initial={{ ...initialState, available: [0, 1, 2, 3], scenarioFt: 2, ...over }}>
      <InsightPanel manifestState={{ status: 'ready', manifest: makeManifest(), error: null }} inspection={{ status: 'idle' }} />
    </AppStateProvider>,
  )

describe('<InsightPanel>', () => {
  it('shows only indicators computed from the manifest', () => {
    ready()
    // 500,000 m² beyond baseline in the fixture → 0.50 km², 124 acres
    expect(screen.getAllByText('0.50').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/124 acres/).length).toBeGreaterThan(0)
    expect(screen.getByText('Beyond 0 ft extent', { selector: 'dt' })).toBeInTheDocument()
  })

  it('describes the 0 ft scenario as the reference', () => {
    ready({ scenarioFt: 0 })
    expect(screen.getByText(/reference the other scenarios are measured against/)).toBeInTheDocument()
  })

  it('summarises the added extent when comparing', () => {
    ready({ scenarioFt: 3, compare: { enabled: true, withFt: 1 } })
    expect(screen.getByText(/adds/)).toBeInTheDocument()
    expect(screen.getByText('2.28 km²')).toBeInTheDocument()
  })

  it('states clearly when comparison data are missing instead of estimating', () => {
    ready({ scenarioFt: 2, compare: { enabled: true, withFt: 0 } })
    expect(screen.getByText(/comparison layer for this pair is missing/)).toBeInTheDocument()
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
    expect(screen.getByRole('alert')).toHaveTextContent(/Inundation data unavailable/)
    expect(screen.getByRole('alert')).toHaveTextContent(/never substitutes estimated or sample data/)
    expect(screen.queryByText(/km²/)).toBeNull()
  })
})
