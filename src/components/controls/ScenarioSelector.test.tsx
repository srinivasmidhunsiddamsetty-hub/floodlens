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
    expect(screen.getByText('+2 ft', { selector: 'output' })).toBeInTheDocument()
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

  it('has no play or info button: the caption says what the number means (v0.35)', () => {
    render(<Harness />)
    expect(screen.getByText('above today’s high tide')).toBeInTheDocument()
    // Only the level names (hidden from assistive tech; the slider is the keyboard route) are buttons.
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getAllByRole('button', { hidden: true }).map((b) => b.textContent)).toEqual(['Today', '+1 ft', '+2 ft', '+3 ft'])
  })
})
