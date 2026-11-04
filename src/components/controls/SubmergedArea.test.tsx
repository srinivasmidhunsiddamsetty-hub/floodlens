import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { AreaUnit } from '../../lib/format'
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
  const [unit, setUnit] = useState<AreaUnit>('km2')
  return <SubmergedArea manifest={manifest} scenarioFt={ft} colorMode={mode} unit={unit} onUnitChange={setUnit} />
}

const figure = () => screen.getByText(/submerged area$/).nextSibling as HTMLElement

describe('<SubmergedArea>', () => {
  it('Single: the total underwater up to the level, and its share of the city’s land', () => {
    render(<Harness ft={3} mode="simple" />)
    expect(screen.getByText('Total submerged area')).toBeInTheDocument()
    // +3 ft includes what +1 and +2 ft reached: 2.30 km² of 10 km² of land.
    expect(figure()).toHaveTextContent('2.30km²')
    expect(screen.getByText('of the city’s land', { exact: false })).toHaveTextContent('23% of the city’s land')
  })

  it('Layered: only what the level adds to the one below, with the same denominator', () => {
    render(<Harness ft={3} mode="detailed" />)
    expect(screen.getByText('Additional submerged area')).toBeInTheDocument()
    expect(figure()).toHaveTextContent('1.80km²')
    expect(screen.getByText('of the city’s land', { exact: false })).toHaveTextContent('18% of the city’s land')
  })

  it('switches between km² and acres, one unit at a time', async () => {
    render(<Harness ft={2} mode="simple" />)
    expect(figure()).toHaveTextContent('0.50km²')
    await userEvent.click(screen.getByRole('radio', { name: 'Acres' }))
    expect(figure()).toHaveTextContent('124acres')
    expect(figure()).not.toHaveTextContent('km²')
  })

  it('says “None yet” at today’s high tide, in either mode', () => {
    const { rerender } = render(<Harness ft={0} mode="simple" />)
    expect(screen.getByText('None yet')).toBeInTheDocument()
    rerender(<Harness ft={0} mode="detailed" />)
    expect(screen.getByText('None yet')).toBeInTheDocument()
    expect(screen.queryByText(/of the city’s land/)).toBeNull()
  })

  it('leaves out the share when the city’s land area is unknown, and shows nothing without data', () => {
    const { container, rerender } = render(<Harness ft={2} mode="simple" manifest={plain} />)
    expect(figure()).toHaveTextContent('0.50km²')
    expect(screen.queryByText(/of the city’s land/)).toBeNull()
    rerender(<Harness ft={2} mode="simple" manifest={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
