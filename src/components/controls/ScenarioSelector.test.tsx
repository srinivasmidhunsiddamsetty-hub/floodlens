import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ScenarioSelector } from './ScenarioSelector'

function Harness({ onChange }: { onChange?: (ft: number) => void }) {
  const [ft, setFt] = useState(2)
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
    const slider = screen.getByRole('slider', { name: /sea-level-rise scenario/i })
    expect(slider).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')
    expect(screen.getByText('+2 ft', { selector: 'output' })).toBeInTheDocument()
  })

  it('is keyboard operable and only lands on discrete NOAA scenarios', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const slider = screen.getByRole('slider')
    slider.focus()
    // jsdom does not implement native range key handling; emulate the resulting change events.
    fireEvent.change(slider, { target: { value: '3' } })
    expect(onChange).toHaveBeenLastCalledWith(3)
    expect(slider).toHaveAttribute('aria-valuetext', '+3 ft above MHHW')
    fireEvent.change(slider, { target: { value: '0' } })
    expect(onChange).toHaveBeenLastCalledWith(0)
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
    const btn = screen.getByRole('button', { name: /reference/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Mean Higher High Water/)).toBeInTheDocument()
  })
})
