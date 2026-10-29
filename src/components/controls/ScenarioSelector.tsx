import { Info, Pause, Play } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { formatScenario, formatScenarioLong } from '../../lib/format'
import { bandColor } from '../../lib/theme'
import { useReducedMotion } from '../../hooks/useMediaQuery'

interface Props {
  available: number[]
  value: number
  onChange: (feet: number) => void
  disabled?: boolean
}

const STEP_MS = 1400

/**
 * Water-level control. A native range input provides keyboard, touch and
 * screen-reader support; the track is painted with the same colour ramp as the
 * map so the slider doubles as a key. Positions are discrete NOAA scenarios —
 * nothing is interpolated between them. "Play" steps through the levels so the
 * rise can be watched spreading across the map.
 */
export function ScenarioSelector({ available, value, onChange, disabled }: Props) {
  const id = useId()
  const reduced = useReducedMotion()
  const [showInfo, setShowInfo] = useState(false)
  const [playing, setPlaying] = useState(false)
  const index = Math.max(0, available.indexOf(value))
  const max = Math.max(1, available.length - 1)

  // Playback: start from the bottom if already at the top, stop at the top.
  // Refs keep the interval independent of re-render timing and of a changing onChange identity.
  const valueRef = useRef(value)
  valueRef.current = value
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      const i = available.indexOf(valueRef.current)
      if (i < 0 || i >= available.length - 1) {
        setPlaying(false)
        return
      }
      valueRef.current = available[i + 1]
      onChangeRef.current(available[i + 1])
      if (i + 1 >= available.length - 1) setPlaying(false)
    }, reduced ? STEP_MS * 1.5 : STEP_MS)
    return () => window.clearInterval(timer)
  }, [playing, available, reduced])

  function togglePlay() {
    if (playing) return setPlaying(false)
    if (index >= available.length - 1) {
      valueRef.current = available[0]
      onChange(available[0])
    }
    setPlaying(true)
  }

  // Track: each interval (level i−1 → i) is painted with level i's ramp colour up to the selection.
  const stops = available
    .slice(1)
    .map((ft, k) => {
      const i = k + 1
      const a = ((i - 1) / max) * 100
      const b = (i / max) * 100
      const c = i <= index ? bandColor(ft) : '#d9d9d9'
      return `${c} ${a}%, ${c} ${b}%`
    })
    .join(', ')

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <output htmlFor={id} className="block t-display" aria-live="polite">
            {formatScenario(value)}
          </output>
          <p className="mt-1 t-caption">above today’s high tide</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          aria-expanded={showInfo}
          aria-controls={`${id}-info`}
          aria-label="What do these levels mean?"
          title="What do these levels mean?"
          className="btn-ghost size-8 justify-center px-0"
        >
          <Info className="size-4" aria-hidden />
        </button>
      </div>

      {showInfo && (
        // Two lines at most, so opening it never makes the panel scroll. The technical name
        // (Mean Higher High Water) is explained in "About the data".
        <p id={`${id}-info`} className="mt-2 rounded border border-line bg-surface-2 px-2.5 py-2 t-caption text-fg-muted animate-slide-up">
          Steps are feet of rise above today’s high tide, not dates.
        </p>
      )}

      <div className="mt-5">
        <label htmlFor={id} className="sr-only">
          Sea-level rise above today’s high tide
        </label>
        <div className="relative">
          {/* Colour-ramp track behind the transparent native track */}
          <div className="pointer-events-none absolute top-1/2 right-[10px] left-[10px] h-1.5 -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(to right, ${stops})` }} />
          <input
            id={id}
            type="range"
            className="fl-range relative"
            min={0}
            max={max}
            step={1}
            value={index}
            disabled={disabled || available.length === 0}
            onChange={(e) => {
              setPlaying(false)
              onChange(available[Number(e.target.value)])
            }}
            aria-valuetext={formatScenarioLong(value)}
          />
        </div>
        <div className="mt-1 flex justify-between px-[2px]" aria-hidden="true">
          {available.map((ft) => (
            <button
              key={ft}
              type="button"
              tabIndex={-1}
              onClick={() => {
                setPlaying(false)
                onChange(ft)
              }}
              className={`flex flex-col items-center gap-1 rounded px-1 text-xs tabular transition-colors ${
                ft === value ? 'font-medium text-fg' : 'text-fg-subtle hover:text-fg'
              }`}
            >
              {ft === 0 ? 'Today' : formatScenario(ft)}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={togglePlay}
        disabled={disabled || available.length < 2}
        aria-pressed={playing}
        className="btn-outline mt-4 w-full"
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        {playing ? 'Pause' : 'Watch the water rise'}
      </button>
    </div>
  )
}
