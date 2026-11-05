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

/** Each box's text: the area box (label, number, unit switch), then the share box. */
const boxes = (container: HTMLElement) => [...container.firstElementChild!.children].map((b) => b.textContent)

describe('<SubmergedArea>', () => {
  it('Total: everything covered at the level, and its share of the city’s land', () => {
    const { container } = render(<Harness ft={3} mode="simple" />)
    // +3 ft includes what +1 and +2 ft reached: 2.30 km² of 10 km² of land.
    expect(boxes(container)).toEqual(['Total area covered2.30km²acres', 'Share of city land23%'])
  })

  it('By level: only what the level adds to the one below, with the same denominator', () => {
    const { container } = render(<Harness ft={3} mode="detailed" />)
    expect(boxes(container)).toEqual(['New area covered1.80km²acres', 'Share of city land18%'])
  })

  it('centres each figure in a light-blue box, navy, the share as large as the area (v0.45, v0.57, v0.58)', () => {
    render(<Harness ft={2} mode="simple" />)
    for (const n of ['0.50', '5%']) {
      const value = screen.getByText(n)
      expect(value).toHaveClass('text-[30px]', 'font-bold', 'text-accent')
      // Centred (v0.58, the owner's pick after seeing both; left in v0.57).
      expect(value.parentElement).toHaveClass('surface-sky', 'text-center')
      expect(value.parentElement).not.toHaveClass('surface-navy', 'text-left')
    }
    // The unit switch is the light pill (v0.57; white on navy before), at its smallest size and only
    // as wide as its text (v0.58: 20 px tall, 11 px text).
    const unit = screen.getByRole('radiogroup', { name: 'Area unit' })
    expect(unit).toHaveClass('w-max', 'bg-surface')
    for (const option of screen.getAllByRole('radio')) expect(option).toHaveClass('h-5', 'text-[11px]')
  })

  it('sizes the area box to its content and gives the share the rest, label resting on its number (v0.52, v0.57)', () => {
    render(<Harness ft={2} mode="simple" />)
    // The area box stacks label, number and unit switch at its own height, as in the mockup.
    expect(screen.getByText('0.50').parentElement).toHaveClass('flex', 'flex-none', 'flex-col', 'items-center')
    // The share: rows of space, number, space, so it sits in the middle of what's left. `basis-0`
    // and `min-h-0` keep it from asking for more height than the slider has.
    const share = screen.getByText('5%').parentElement!
    expect(share).toHaveClass('grid', 'grid-rows-[1fr_auto_1fr]', 'flex-1', 'basis-0', 'min-h-0', 'justify-items-center')
    expect(screen.getByText('Share of city land')).toHaveClass('self-end')
  })

  it('shows one unit at a time, switched like Total / By level (v0.39)', async () => {
    render(<Harness ft={2} mode="simple" />)
    const km2 = screen.getByRole('radio', { name: 'Square kilometres' })
    expect(km2).toHaveAttribute('aria-checked', 'true')
    // Only the number in the chosen unit: no acres figure alongside the km² one (v0.38 showed both).
    expect(screen.queryByText(/\d+ acres/)).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'Acres' }))
    expect(screen.getByText('124')).toBeInTheDocument()
    expect(screen.queryByText('0.50')).toBeNull()
    // Arrow keys move within the group, like any radio group.
    screen.getByRole('radio', { name: 'Acres' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(km2).toHaveAttribute('aria-checked', 'true')
  })

  it('shows 0 at today’s high tide, never a blank, in either mode (v0.38)', () => {
    const { container, rerender } = render(<Harness ft={0} mode="simple" />)
    expect(boxes(container)).toEqual(['Total area covered0km²acres', 'Share of city land0%'])
    rerender(<Harness ft={0} mode="detailed" />)
    expect(boxes(container)).toEqual(['New area covered0km²acres', 'Share of city land0%'])
  })

  it('leaves out the share when the city’s land area is unknown, and shows nothing without data', () => {
    const { container, rerender } = render(<Harness ft={2} mode="simple" manifest={plain} />)
    expect(boxes(container)).toEqual(['Total area covered0.50km²acres'])
    rerender(<Harness ft={2} mode="simple" manifest={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
