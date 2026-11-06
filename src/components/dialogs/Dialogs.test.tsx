import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeManifest } from '../../test/fixtures'
import { AboutDataDialog } from './AboutDataDialog'
import { DataSourcesDialog } from './DataSourcesDialog'

const manifest = makeManifest()

describe('About the data and Sources (v0.55)', () => {
  it('describes both colour modes, the figures and the place card as they are now', () => {
    render(<AboutDataDialog open onClose={() => {}} manifest={manifest} />)
    const text = document.body.textContent!
    // Two colour modes since v0.34; the old one-blue ramp description is gone.
    expect(text).toMatch(/Overall colours show all the water at the chosen level in one blue/)
    expect(text).toMatch(/and the buildings it\s+reaches in a deeper blue/)
    expect(text).toMatch(/red at today’s high tide, then orange, gold, teal and periwinkle, to violet at \+5 ft/)
    expect(text).not.toMatch(/light blue|getting darker/)
    // The figures count only land beyond today's high tide (v0.36), so 0 ft reads 0.
    expect(text).toMatch(/count only land that today’s high tide doesn’t reach, so 0 ft reads 0/)
    // The card's answers, worded as on the card, never "safe" or "dry".
    expect(text).toMatch(/“Doesn’t reach it” only means no level up to \+5 ft does on NOAA’s map/)
    expect(text).not.toMatch(/\bsafe\b|\bdry\b/i)
  })

  it('says what a building’s colour means, and what it doesn’t (v0.62)', () => {
    render(<AboutDataDialog open onClose={() => {}} manifest={manifest} />)
    const text = document.body.textContent!
    expect(text).toMatch(/change colour once the slider reaches the first level whose water touches them/)
    expect(text).toMatch(/touches the building’s footprint at that level, even at one corner/)
    expect(text).toMatch(/doesn’t mean the building is underwater/)
    expect(text).toMatch(/Low spots don’t colour buildings/)
    expect(text).not.toMatch(/\bsafe\b|\bdry\b/i)
  })

  it('explains how the sea-level figures are computed, and credits D3 for what it draws now', () => {
    render(<DataSourcesDialog open onClose={() => {}} manifest={manifest} manifestError={null} />)
    expect(screen.getByRole('heading', { name: 'Sea-level figures' })).toBeInTheDocument()
    const text = document.body.textContent!
    expect(text).toMatch(/a level’s extent minus today’s high-tide extent \(0 ft\)/)
    // The chart went in v0.36; D3 now draws only the place card's water track.
    expect(text).not.toMatch(/Charts: D3/)
    expect(text).toMatch(/D3\.js for the place card’s water track/)
    expect(screen.getByRole('heading', { name: 'Building colours' })).toBeInTheDocument()
    expect(text).toMatch(/building_levels\.geojson, derived from OpenStreetMap and NOAA data/)
  })
})
