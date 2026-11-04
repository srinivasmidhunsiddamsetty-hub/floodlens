import { Info, Pause, Play } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { formatScenario, formatScenarioLong } from '../../lib/format'
import { bandColor, type ColorMode } from '../../lib/theme'
import { useReducedMotion } from '../../hooks/useMediaQuery'

interface Props {
  available: number[]
  value: number
  onChange: (feet: number) => void
  /** The map's colour mode, so the track wears the same colours as the map. */
  colorMode?: ColorMode
  disabled?: boolean
}

const STEP_MS = 1400
/** Height of the vertical slider, and the thumb size (the track runs between the thumb's centres). */
const TRACK_H = 168
const THUMB = 20

/**
 * Water-level control, upright (v0.34): today at the bottom and the top level at the top, so
 * raising it reads as the sea rising. A native range input provides keyboard, touch and
 * screen-reader support; the track is painted with the map's colours so the slider doubles as
 * a key. Positions are discrete NOAA scenarios — nothing is interpolated between them. "Step up"
 * plays through the levels, one way only, so the rise can be watched spreading across the map.
 */
export function ScenarioSelector({ available, value, onChange, colorMode = 'detailed', disabled }: Props) {
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
      const c = i <= index ? bandColor(ft, colorMode) : '#d9d9d9'
      return `${c} ${a}%, ${c} ${b}%`
    })
    .join(', ')

  // The thumb's centre for each level, measured up from the bottom of the slider.
  const pos = (i: number) => THUMB / 2 + (i / max) * (TRACK_H - THUMB)
  const top = available.at(-1)

  return (
    <div>
      <div className="flex gap-4">
        <div className="relative flex shrink-0" style={{ height: TRACK_H }}>
          <label htmlFor={id} className="sr-only">
            Sea-level rise above today’s high tide
          </label>
          <div className="relative w-5">
            {/* Colour-ramp track behind the transparent native track */}
            <div
              className="pointer-events-none absolute left-1/2 w-1.5 -translate-x-1/2 rounded-full"
              style={{ top: THUMB / 2, bottom: THUMB / 2, background: `linear-gradient(to top, ${stops})` }}
            />
            <input
              id={id}
              type="range"
              className="fl-range fl-range-v relative"
              min={0}
              max={max}
              step={1}
              value={index}
              disabled={disabled || available.length === 0}
              onChange={(e) => {
                setPlaying(false)
                onChange(available[Number(e.target.value)])
              }}
              aria-orientation="vertical"
              aria-valuetext={formatScenarioLong(value)}
            />
          </div>
          {/* Level names beside the stops; clicking one picks it (the slider is the keyboard route). */}
          <div className="relative ml-1.5 w-12" aria-hidden="true">
            {available.map((ft, i) => (
              <button
                key={ft}
                type="button"
                tabIndex={-1}
                onClick={() => {
                  setPlaying(false)
                  onChange(ft)
                }}
                style={{ bottom: pos(i) - 9 }}
                className={`absolute left-0 h-[18px] rounded px-1 text-left text-xs leading-[18px] whitespace-nowrap tabular transition-colors ${
                  ft === value ? 'font-bold text-fg' : 'text-fg-subtle hover:text-fg'
                }`}
              >
                {ft === 0 ? 'Today' : formatScenario(ft)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
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
            className="btn-ghost -mt-1 -mr-1 size-8 shrink-0 justify-center px-0"
          >
            <Info className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {showInfo && (
        // Two lines at most, so opening it never makes the panel scroll. The technical name
        // (Mean Higher High Water) is explained in "About the data".
        <p id={`${id}-info`} className="mt-3 rounded border border-line bg-surface-2 px-2.5 py-2 t-caption text-fg-muted animate-slide-up">
          +1 ft means the sea is 1 ft above today’s high tide, not a year.
        </p>
      )}

      {/* "Watch the water rise" read as tides that come and go (v0.34): name the one-way climb instead. */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={disabled || available.length < 2}
        aria-pressed={playing}
        className="btn-outline mt-4 w-full"
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        {playing ? 'Pause' : `Step up to ${top === undefined ? 'the top level' : formatScenario(top)}`}
      </button>
    </div>
  )
}
