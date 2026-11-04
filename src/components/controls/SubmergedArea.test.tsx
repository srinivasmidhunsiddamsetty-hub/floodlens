import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ColorMode } from '../../lib/theme'
import { makeManifest } from '../../test/fixtures'
import type { DataManifest } from '../../types/data'
import { SubmergedArea } from './SubmergedArea'

// Fixture: 20,000 m² beyond today's high tide at +1 ft, 500,000 at +2 ft, 2,300,000 at +3 ft.
const plain = makeManifest()
const withLand = makeManifest({
  studyArea: {
    ...plain.studyArea,
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

function Harness({ ft, mode, manifest = withLand }: { ft: number; mode: ColorMode; manifest?: DataManifest | null }) {
  return <SubmergedArea manifest={manifest} scenarioFt={ft} colorMode={mode} />
}

/** The area block, then the share block, as text. */
const blocks = (container: HTMLElement) => [...container.firstElementChild!.children].map((b) => b.textContent)

describe('<SubmergedArea>', () => {
  it('Total: everything covered at the level, in km² and acres, and its share of the city’s land', () => {
    const { container } = render(<Harness ft={3} mode="simple" />)
    // +3 ft includes what +1 and +2 ft reached: 2.30 km² (568 acres) of 10 km² of land.
    expect(blocks(container)).toEqual(['Total area covered2.30km²568 acres', 'Share of city land23%'])
  })

  it('Individual: only what the level adds to the one below, with the same denominator', () => {
    const { container } = render(<Harness ft={3} mode="detailed" />)
    expect(blocks(container)).toEqual(['New area covered1.80km²445 acres', 'Share of city land18%'])
  })

  it('gives the share the same weight as the area (v0.38)', () => {
    render(<Harness ft={2} mode="simple" />)
    expect(screen.getByText('5%')).toHaveClass('text-[24px]', 'font-bold')
    expect(screen.getByText('0.50')).toHaveClass('text-[24px]', 'font-bold')
  })

  it('shows 0 at today’s high tide, never a blank, in either mode (v0.38)', () => {
    const { container, rerender } = render(<Harness ft={0} mode="simple" />)
    expect(blocks(container)).toEqual(['Total area covered0km²0 acres', 'Share of city land0%'])
    rerender(<Harness ft={0} mode="detailed" />)
    expect(blocks(container)).toEqual(['New area covered0km²0 acres', 'Share of city land0%'])
  })

  it('leaves out the share when the city’s land area is unknown, and shows nothing without data', () => {
    const { container, rerender } = render(<Harness ft={2} mode="simple" manifest={plain} />)
    expect(blocks(container)).toEqual(['Total area covered0.50km²124 acres'])
    rerender(<Harness ft={2} mode="simple" manifest={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
