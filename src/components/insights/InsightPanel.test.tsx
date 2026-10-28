import { cleanup, render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('heading', { name: 'Land underwater' })).toBeInTheDocument()
    expect(screen.getByText('at +2 ft').nextSibling).toHaveTextContent('0.50km²')
    expect(screen.getAllByText('0.50').length).toBeGreaterThan(0)
    // One unit at a time: no acres alongside the km² figure.
    expect(screen.getByText('at +2 ft').nextSibling).not.toHaveTextContent('acres')
  })

  it('relates the headline to the city’s land area when the Census boundary is known', () => {
    const withLand = makeManifest({
      studyArea: {
        ...manifest.studyArea,
        boundary: {
          publisher: 'US Census Bureau',
          dataset: 'TIGER/Line',
          downloadUrl: 'https://example.test/places.zip',
          geoid: '1245025',
          name: 'Test city',
          censusLandM2: 10_000_000,
          censusWaterM2: 1,
          license: 'Public domain',
        },
      },
    })
    render(
      <AppStateProvider initial={{ ...initialState, available: [0, 1, 2, 3], scenarioFt: 2 }}>
        <InsightPanel
          manifestState={{ status: 'ready', manifest: withLand, error: null }}
          inspection={{ status: 'idle' }}
          bands={bandsFor(withLand)}
          highlightFt={null}
          onHighlight={() => {}}
        />
      </AppStateProvider>,
    )
    // 500,000 m² of 10 km² land → 5.0%
    expect(screen.getByText('of the city’s land').nextSibling).toHaveTextContent('5%')
  })

  it('shows what the selected level adds, in one row and one unit', () => {
    ready() // slider at +2 ft
    const row = screen.getByRole('button', { name: /\+2 ft adds/ })
    expect(row).toHaveTextContent('0.48 km²')
    expect(row).not.toHaveTextContent('acres')
    expect(screen.queryByText(/\+(1|3) ft adds/)).toBeNull()
  })

  it('shows no "adds" row at today’s high tide, where nothing is added', () => {
    ready({ scenarioFt: 0 })
    expect(screen.queryByText(/ft adds/)).toBeNull()
  })

  it('switches the headline, chart and breakdown between km² and acres', async () => {
    ready()
    const km2 = screen.getByRole('radio', { name: 'Square kilometres' })
    expect(km2).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: 'Acres' }))

    expect(screen.getByText('at +2 ft').nextSibling).toHaveTextContent('124acres')
    expect(screen.getByText('at +2 ft').nextSibling).not.toHaveTextContent('km²')
    expect(screen.getByRole('group', { name: /^Land underwater by sea level ?, in acres$/ })).toBeInTheDocument()
    const row = screen.getByRole('button', { name: /\+2 ft adds/ })
    // Units are spelled out: "acres", never the abbreviation "ac".
    expect(row).toHaveTextContent('119 acres')
    expect(row).not.toHaveTextContent('km²')

    // Arrow keys move within the group, like any radio group.
    screen.getByRole('radio', { name: 'Acres' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(km2).toHaveAttribute('aria-checked', 'true')
    expect(km2).toHaveFocus()
  })

  it('lists low spots only while their map layer is on', async () => {
    const withLow = makeManifest({
      comparisons: manifest.comparisons,
      lowLying: [{ id: 'low_2ft', feet: 2, kind: 'low', sourceLayer: 'FL_SE_low_2_0ft', file: 'low_2ft.geojson', areaM2: 940_000, bytes: 1, featureCount: 1, vertexCount: 1 }],
    })
    render(
      <AppStateProvider initial={{ ...initialState, available: [0, 1, 2, 3], scenarioFt: 2 }}>
        <InsightPanel
          manifestState={{ status: 'ready', manifest: withLow, error: null }}
          inspection={{ status: 'idle' }}
          bands={bandsFor(withLow)}
          highlightFt={null}
          onHighlight={() => {}}
        />
      </AppStateProvider>,
    )
    expect(screen.queryByText('Low spots at +2 ft')).toBeNull()
    cleanup()
    render(
      <AppStateProvider initial={{ ...initialState, available: [0, 1, 2, 3], scenarioFt: 2, layers: { ...initialState.layers, lowLying: true } }}>
        <InsightPanel
          manifestState={{ status: 'ready', manifest: withLow, error: null }}
          inspection={{ status: 'idle' }}
          bands={bandsFor(withLow)}
          highlightFt={null}
          onHighlight={() => {}}
        />
      </AppStateProvider>,
    )
    expect(screen.getByText('Low spots at +2 ft')).toBeInTheDocument()
    expect(screen.getByText('0.94 km²')).toBeInTheDocument()
    expect(screen.getByText('Cut off from the sea, so not counted above')).toBeInTheDocument()
  })

  it('titles the chart in one plain line, without the old finding or subtitle', () => {
    ready()
    expect(screen.getByText('Land underwater by sea level')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /^Land underwater by sea level ?, in square kilometres$/ })).toBeInTheDocument()
    expect(screen.queryByText(/biggest jump|City of Miami Beach/i)).toBeNull()
  })

  it('invites a selection in the slot where the selection card appears', () => {
    ready()
    expect(screen.getByText('Click any building')).toBeInTheDocument()
  })

  it('spotlights a band when its breakdown row is hovered', async () => {
    const onHighlight = vi.fn()
    ready({}, onHighlight)
    await userEvent.hover(screen.getByText('+2 ft adds'))
    expect(onHighlight).toHaveBeenCalledWith(2)
  })

  it('describes today as the starting point', () => {
    ready({ scenarioFt: 0 })
    expect(screen.getByText(/None yet\. Today’s high tide is where we start/)).toBeInTheDocument()
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
    expect(screen.getByRole('alert')).toHaveTextContent(/The flood data didn’t load/)
    expect(screen.getByRole('alert')).toHaveTextContent(/never fills the gap with estimates or sample data/)
    expect(screen.queryByText(/km²/)).toBeNull()
  })
})
