import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppStateProvider } from '../../state/AppState'
import { initialState } from '../../state/reducer'
import { makeManifest } from '../../test/fixtures'
import { ControlPanel } from './ControlPanel'

const manifest = makeManifest({
  lowLying: [{ id: 'low_2ft', feet: 2, kind: 'low', sourceLayer: 'FL_SE_low_2_0ft', file: 'low_2ft.geojson', areaM2: 940_000, bytes: 1, featureCount: 1, vertexCount: 1 }],
})

const panel = (over = {}) =>
  render(
    <AppStateProvider initial={{ ...initialState, available: [0, 1, 2, 3], scenarioFt: 2, ...over }}>
      <ControlPanel manifest={manifest} />
    </AppStateProvider>,
  )

describe('<ControlPanel>', () => {
  it('shows the land underwater beside the slider, and the colour toggle picks total or added (v0.36)', async () => {
    panel()
    expect(screen.getByText('Total submerged area')).toBeInTheDocument()
    expect(screen.getByText('0.50')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Layered' }))
    expect(screen.getByText('Additional submerged area')).toBeInTheDocument()
    expect(screen.getByText('0.48')).toBeInTheDocument()
  })

  it('shows the low-spot area under its switch only while that layer is on (v0.36)', () => {
    const { unmount } = panel()
    expect(screen.queryByText('0.94 km² at +2 ft')).toBeNull()
    unmount()
    panel({ layers: { ...initialState.layers, lowLying: true } })
    expect(screen.getByRole('switch', { name: 'Low spots' })).toHaveAccessibleDescription(/cut off from the sea.*0\.94 km² at \+2 ft/)
  })
})
