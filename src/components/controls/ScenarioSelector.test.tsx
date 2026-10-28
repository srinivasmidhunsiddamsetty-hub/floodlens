import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => vi.useRealTimers())

  it('exposes a labelled slider with a meaningful value text', () => {
    render(<Harness />)
    const slider = screen.getByRole('slider', { name: /sea-level rise above today/i })
    expect(slider).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')
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

  it('reveals the MHHW explanation on demand', async () => {
    render(<Harness />)
    const btn = screen.getByRole('button', { name: /what does the water level mean/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Mean Higher High Water/)).toBeInTheDocument()
  })

  it('plays the rise from today to the top level, then stops', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} start={3} />)
    fireEvent.click(screen.getByRole('button', { name: /play the rise/i }))
    // Starting at the top restarts from today
    expect(onChange).toHaveBeenLastCalledWith(0)
    act(() => vi.advanceTimersByTime(1400 * 4))
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([0, 1, 2, 3])
    expect(screen.getByRole('button', { name: /play the rise/i })).toHaveAttribute('aria-pressed', 'false')
  })
})
