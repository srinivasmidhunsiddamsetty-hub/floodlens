import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ScenarioSelector } from './ScenarioSelector'

function Harness({ onChange, start = 2 }: { onChange?: (ft: number) => void; start?: number }) {
  const [ft, setFt] = useState(start)
  return (
    <ScenarioSelector
      available={[0, 1, 2, 3]}
      value={ft}
      onChange={(v) => {
        setFt(v)
        onChange?.(v)
      }}
    />
  )
}

describe('<ScenarioSelector>', () => {
  it('exposes a labelled slider with a meaningful value text', () => {
    render(<Harness />)
    const slider = screen.getByRole('slider', { name: /sea-level rise above today/i })
    expect(slider).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')
    // Upright (v0.34): raising it reads as the sea rising.
    expect(slider).toHaveAttribute('aria-orientation', 'vertical')
    // No big "+2 ft" beside it (v0.36): the bold level name says it.
    expect(document.querySelector('output')).toBeNull()
  })

  it('only lands on discrete NOAA scenarios', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const slider = screen.getByRole('slider')
    // jsdom does not implement native range key handling; emulate the resulting change events.
    fireEvent.change(slider, { target: { value: '3' } })
    expect(onChange).toHaveBeenLastCalledWith(3)
    expect(slider).toHaveAttribute('aria-valuetext', '+3 ft above MHHW')
    fireEvent.change(slider, { target: { value: '0' } })
    expect(slider).toHaveAttribute('aria-valuetext', 'Current MHHW (0 ft)')
  })

  it('tick labels select a scenario with the mouse', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '+1 ft', hidden: true }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('shows only the chosen level as a pill; the others are plain labels that fill on hover (v0.57)', () => {
    render(<Harness />)
    const label = (name: string) => screen.getAllByRole('button', { hidden: true }).find((b) => b.textContent === name)!
    expect(label('+2 ft')).toHaveClass('bg-accent-soft', 'font-bold', 'ring-1')
    for (const name of ['0 ft', '+1 ft', '+3 ft']) {
      expect(label(name)).not.toHaveClass('bg-accent-soft', 'chip-soft', 'bg-canvas')
      expect(label(name)).toHaveClass('hover:bg-[#eef2f7]', 'text-[13px]')
    }
  })

  it('has no play or info button (v0.35), and holds what it is given beside the slider (v0.36)', () => {
    render(
      <ScenarioSelector available={[0, 1, 2, 3]} value={2} onChange={() => {}}>
        <p>Total submerged area</p>
      </ScenarioSelector>,
    )
    expect(screen.getByText('Total submerged area')).toBeInTheDocument()
    // Only the level names (hidden from assistive tech; the slider is the keyboard route) are buttons.
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getAllByRole('button', { hidden: true }).map((b) => b.textContent)).toEqual(['0 ft', '+1 ft', '+2 ft', '+3 ft'])
  })
})
