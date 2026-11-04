import { useId, type ReactNode } from 'react'
import { formatScenario, formatScenarioLong } from '../../lib/format'
import { bandColor, type ColorMode } from '../../lib/theme'

interface Props {
  available: number[]
  value: number
  onChange: (feet: number) => void
  /** The map's colour mode, so the track wears the same colours as the map. */
  colorMode?: ColorMode
  disabled?: boolean
  /** Shown to the right of the slider, as tall as it: the land underwater at this level (v0.36). */
  children?: ReactNode
}

/**
 * Height of the vertical slider, and the thumb size (the track runs between the thumb's centres).
 * The slider gives up height on short windows (v0.35), so the left panel fits without scrolling
 * in windows down to about 650 px tall; 532 px is the rest of the panel and the top bar, and
 * `--fl-panel-extra` is any line the panel adds (the low-spot area, v0.36). It never goes below
 * 118 px, the height of the two figures beside it (v0.38); the layer rows tighten on short
 * windows to make up the difference (see Switch).
 */
const TRACK_H = 'clamp(118px, calc(100vh - 532px - var(--fl-panel-extra, 0px)), 168px)'
const THUMB = 20

/**
 * Water-level control, upright (v0.34): today at the bottom and the top level at the top, so
 * raising it reads as the sea rising. A native range input provides keyboard, touch and
 * screen-reader support; the track is painted with the map's colours so the slider doubles as
 * a key. Positions are discrete NOAA scenarios — nothing is interpolated between them.
 * The play button and the (i) note were removed in v0.35. The big "+2 ft" went in v0.36: the
 * bold level name already says it, and its place holds the land underwater (`children`).
 */
export function ScenarioSelector({ available, value, onChange, colorMode = 'detailed', disabled, children }: Props) {
  const id = useId()
  const index = Math.max(0, available.indexOf(value))
  const max = Math.max(1, available.length - 1)

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
  const pos = (i: number) => `calc(${THUMB / 2}px + ${i / max} * (100% - ${THUMB}px))`
  // Each level's chip: 22 px tall, or less when a short window squeezes the slider, so chips never overlap.
  const chipH = `min(22px, calc((100% - ${THUMB}px) / ${max} - 2px))`

  return (
    <div>
      <div className="flex gap-2.5">
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
              onChange={(e) => onChange(available[Number(e.target.value)])}
              aria-orientation="vertical"
              aria-valuetext={formatScenarioLong(value)}
            />
          </div>
          {/* Each level is a chip you can click (v0.38; plain text before): a light fill at rest, darker on
              hover, the chosen one filled with the accent tint and bold. The slider is the keyboard route.
              48 px fits the widest name, a bold "Today", and leaves the most room for `children`. */}
          <div className="relative ml-1 w-12" aria-hidden="true">
            {available.map((ft, i) => (
              <button
                key={ft}
                type="button"
                tabIndex={-1}
                onClick={() => onChange(ft)}
                style={{ bottom: pos(i), height: chipH }}
                className={`absolute left-0 flex w-full translate-y-1/2 cursor-pointer items-center rounded-md px-1.5 text-left text-xs whitespace-nowrap tabular transition-colors ${
                  ft === value ? 'bg-accent-soft font-bold text-fg ring-1 ring-accent/35 ring-inset' : 'bg-canvas text-fg-muted hover:bg-[#e4e8ee] hover:text-fg'
                }`}
              >
                {ft === 0 ? 'Today' : formatScenario(ft)}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
