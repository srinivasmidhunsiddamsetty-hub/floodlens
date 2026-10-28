import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { bandsFor } from '../../lib/manifest'
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

const manifest = makeManifest({
  comparisons: [
    { id: 'diff_0ft_1ft', fromFt: 0, toFt: 1, file: 'diff_0ft_1ft.geojson', areaM2: 20_000, bytes: 1, featureCount: 1, vertexCount: 1 },
    { id: 'diff_1ft_2ft', fromFt: 1, toFt: 2, file: 'diff_1ft_2ft.geojson', areaM2: 480_000, bytes: 1, featureCount: 1, vertexCount: 1 },
    { id: 'diff_2ft_3ft', fromFt: 2, toFt: 3, file: 'diff_2ft_3ft.geojson', areaM2: 1_800_000, bytes: 1, featureCount: 1, vertexCount: 1 },
  ],
})

const ready = (over = {}, onHighlight = vi.fn()) =>
  render(
    <AppStateProvider initial={{ ...initialState, available: [0, 1, 2, 3], scenarioFt: 2, ...over }}>
      <InsightPanel
        manifestState={{ status: 'ready', manifest, error: null }}
        inspection={{ status: 'idle' }}
        bands={bandsFor(manifest)}
        highlightFt={null}
        onHighlight={onHighlight}
      />
    </AppStateProvider>,
  )

describe('<InsightPanel>', () => {
  it('leads with the headline metric computed from the manifest', () => {
    ready()
    // 500,000 m² beyond baseline at +2 ft in the fixture → 0.50 km², 124 acres
    expect(screen.getByText('Flooded beyond today’s high tide')).toBeInTheDocument()
    expect(screen.getAllByText('0.50').length).toBeGreaterThan(0)
    expect(screen.getByText(/124 acres of South Beach at \+2 ft/)).toBeInTheDocument()
  })

  it('breaks the total down by the area each foot adds', () => {
    ready()
    const list = screen.getByRole('list', { name: '' }) // breakdown list
    expect(within(list).getByText('+1 ft adds')).toBeInTheDocument()
    expect(within(list).getByText('0.48 km²')).toBeInTheDocument()
    expect(within(list).getByText('1.80 km²')).toBeInTheDocument()
  })

  it('spotlights a band when its breakdown row is hovered', async () => {
    const onHighlight = vi.fn()
    ready({}, onHighlight)
    await userEvent.hover(screen.getByText('+2 ft adds'))
    expect(onHighlight).toHaveBeenCalledWith(2)
  })

  it('describes today as the reference level', () => {
    ready({ scenarioFt: 0 })
    expect(screen.getByText('Reference')).toBeInTheDocument()
  })

  it('renders a missing-data state without any numbers', () => {
    render(
      <AppStateProvider>
        <InsightPanel
          manifestState={{ status: 'error', manifest: null, error: 'Processed NOAA data not found (HTTP 404).' }}
          inspection={{ status: 'idle' }}
          bands={[]}
          highlightFt={null}
          onHighlight={() => {}}
        />
      </AppStateProvider>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/Inundation data unavailable/)
    expect(screen.getByRole('alert')).toHaveTextContent(/never substitutes estimated or sample data/)
    expect(screen.queryByText(/km²/)).toBeNull()
  })
})
