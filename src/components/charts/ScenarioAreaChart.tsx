import * as d3 from 'd3'
import { useEffect, useId, useRef, useState } from 'react'
import { CITY_NAME } from '../../lib/constants'
import { formatAcres, formatKm2, formatScenario, M2_PER_KM2 } from '../../lib/format'
import type { FloodBand } from '../../lib/manifest'
import { bandColor, colors } from '../../lib/theme'
import { useReducedMotion } from '../../hooks/useMediaQuery'

interface Props {
  bands: FloodBand[]
  selectedFt: number
  highlightFt: number | null
  onHighlight: (ft: number | null) => void
  onSelect: (feet: number) => void
}

interface Segment {
  band: number
  y0: number
  y1: number
  addedM2: number
}
interface Bar {
  feet: number
  totalM2: number
  segments: Segment[]
}

interface Tip {
  x: number
  y: number
  bar: Bar
  band: number | null
}

const HEIGHT = 156
const M = { top: 20, right: 4, bottom: 26, left: 30 }

/**
 * Chart titles state the main finding and the subtitle says what is measured,
 * where (ONS / GOV.UK chart guidance). The finding is worked out from the data,
 * never written in: when one foot adds most of the land and at least twice any
 * other foot, that's the headline; otherwise the title just names the measure.
 */
export function chartTitle(bands: FloodBand[]): string {
  const added = bands.filter((b) => !b.isReference && b.addedM2 > 0)
  const total = added.reduce((sum, b) => sum + b.addedM2, 0)
  const [top, next] = [...added].sort((a, b) => b.addedM2 - a.addedM2)
  if (top && top.addedM2 > total / 2 && (!next || top.addedM2 >= 2 * next.addedM2)) {
    return `Land underwater jumps at ${formatScenario(top.feet)}`
  }
  return 'Land underwater at each sea level'
}

/**
 * How the flooded area grows with each foot. Each bar is the total area beyond
 * today's high tide at that level, stacked by the level at which each part is
 * first reached — the same colours as the map. Values come from the processing
 * manifest (geodesic areas of the exported NOAA polygons); nothing is estimated.
 */
export function ScenarioAreaChart({ bands, selectedFt, highlightFt, onHighlight, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(280)
  const [tip, setTip] = useState<Tip | null>(null)
  const reduced = useReducedMotion()
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.floor(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cb = useRef({ onSelect, onHighlight })
  cb.current = { onSelect, onHighlight }

  const bars: Bar[] = bands.map((b) => {
    let acc = 0
    const segments: Segment[] = []
    for (const s of bands) {
      if (s.isReference || s.feet > b.feet) continue
      segments.push({ band: s.feet, y0: acc, y1: acc + s.addedM2, addedM2: s.addedM2 })
      acc += s.addedM2
    }
    return { feet: b.feet, totalM2: acc, segments }
  })

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl || !bars.length) return
    const svg = d3.select(svgEl)
    const innerW = width - M.left - M.right
    const innerH = HEIGHT - M.top - M.bottom
    const toKm2 = (m2: number) => m2 / M2_PER_KM2

    const x = d3
      .scaleBand<number>()
      .domain(bars.map((b) => b.feet))
      .range([0, innerW])
      .paddingInner(0.38)
      .paddingOuter(0.1)
    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(bars, (b) => toKm2(b.totalM2)) ?? 1) * 1.08 || 1])
      .nice(3)
      .range([innerH, 0])

    const root = svg
      .selectAll<SVGGElement, null>('g.root')
      .data([null])
      .join('g')
      .attr('class', 'root')
      .attr('transform', `translate(${M.left},${M.top})`)

    root
      .selectAll<SVGGElement, null>('g.y')
      .data([null])
      .join('g')
      .attr('class', 'y')
      .call(
        d3
          .axisLeft(y)
          .ticks(3)
          .tickSize(-innerW)
          .tickPadding(6)
          .tickFormat((d) => d3.format('~g')(d as number)),
      )
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', colors.chartGrid))
      .call((g) => g.selectAll('.tick text').attr('fill', colors.chartAxis).attr('font-size', 11))

    root
      .selectAll<SVGGElement, null>('g.x')
      .data([null])
      .join('g')
      .attr('class', 'x')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .tickSize(0)
          .tickPadding(8)
          .tickFormat((d) => ((d as number) === 0 ? 'Today' : formatScenario(d as number))),
      )
      .call((g) => g.select('.domain').attr('stroke', '#c9c9c9'))
      .call((g) =>
        g
          .selectAll<SVGTextElement, number>('.tick text')
          .attr('font-size', 11)
          .attr('font-weight', (d) => (d === selectedFt ? 600 : 400))
          .attr('fill', (d) => (d === selectedFt ? colors.accent : colors.chartAxis)),
      )

    const t = d3.transition().duration(reduced ? 0 : 400).ease(d3.easeCubicOut)

    const barG = root
      .selectAll<SVGGElement, Bar>('g.bar')
      .data(bars, (d) => String(d.feet))
      .join((enter) => {
        const g = enter.append('g').attr('class', 'bar').style('cursor', 'pointer')
        g.append('rect').attr('class', 'hit').attr('fill', 'transparent')
        g.append('rect').attr('class', 'sel').attr('fill', 'none').attr('rx', 3)
        g.append('text').attr('class', 'lbl').attr('text-anchor', 'middle').attr('font-size', 11)
        return g
      })
      .attr('transform', (d) => `translate(${x(d.feet) ?? 0},0)`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-pressed', (d) => (d.feet === selectedFt ? 'true' : 'false'))
      .attr('aria-label', (d) =>
        d.feet === 0
          ? 'Today: where we start. Show on the map.'
          : `${formatScenario(d.feet)}: ${formatKm2(d.totalM2)} square kilometres of land underwater. Show on the map.`,
      )
      // A mouse click selects without focusing, so the browser's focus outline
      // (a box around the whole column) only appears for keyboard users.
      .on('mousedown', (e: MouseEvent) => e.preventDefault())
      .on('click', (_, d) => cb.current.onSelect(d.feet))
      .on('keydown', (e: KeyboardEvent, d) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          cb.current.onSelect(d.feet)
        }
      })
      .on('mouseleave blur', () => {
        setTip(null)
        cb.current.onHighlight(null)
      })
      .on('focus', (_, d) => setTip({ x: (x(d.feet) ?? 0) + M.left + x.bandwidth() / 2, y: y(toKm2(d.totalM2)) + M.top, bar: d, band: null }))

    barG
      .select<SVGRectElement>('rect.hit')
      .attr('width', x.bandwidth())
      .attr('height', innerH)
      .on('mouseenter', (_, d) => setTip({ x: (x(d.feet) ?? 0) + M.left + x.bandwidth() / 2, y: y(toKm2(d.totalM2)) + M.top, bar: d, band: null }))

    // The selected level gets a 2px ring around its bar, with a 2px gap, like the
    // selected area chip. It hugs the bar rather than boxing the whole column, and
    // still shows as a small capsule on the baseline for near-zero bars.
    barG
      .select<SVGRectElement>('rect.sel')
      .attr('x', -4)
      .attr('width', x.bandwidth() + 8)
      .attr('rx', 5)
      .attr('fill', 'none')
      .attr('stroke', colors.accent)
      .attr('stroke-width', 2)
      .attr('opacity', (d) => (d.feet === selectedFt ? 1 : 0))
      .transition(t)
      .attr('y', (d) => y(toKm2(d.totalM2)) - 4)
      .attr('height', (d) => innerH - y(toKm2(d.totalM2)) + 7)

    barG
      .selectAll<SVGRectElement, Segment>('rect.seg')
      .data((d) => d.segments.map((s) => ({ ...s, bar: d })) as (Segment & { bar: Bar })[], (s) => String((s as Segment).band))
      .join((enter) => enter.append('rect').attr('class', 'seg').attr('y', innerH).attr('height', 0))
      .attr('x', 0)
      .attr('width', x.bandwidth())
      .attr('fill', (s) => bandColor(s.band))
      .on('mouseenter', (_, s) => {
        cb.current.onHighlight(s.band)
        setTip({ x: (x(s.bar.feet) ?? 0) + M.left + x.bandwidth() / 2, y: y(toKm2(s.y1)) + M.top, bar: s.bar, band: s.band })
      })
      .transition(t)
      .attr('y', (s) => y(toKm2(s.y1)))
      .attr('height', (s) => Math.max(s.addedM2 > 0 ? 1.5 : 0, y(toKm2(s.y0)) - y(toKm2(s.y1))))
      // Every level keeps its full colour: the data is the same whichever level
      // the slider is on. Only hovering a band fades the others, to spotlight it.
      .attr('opacity', (s) => (highlightFt !== null && s.band !== highlightFt ? 0.35 : 1))

    barG
      .select<SVGTextElement>('text.lbl')
      .attr('x', x.bandwidth() / 2)
      .text((d) => (d.feet === 0 ? '0' : formatKm2(d.totalM2)))
      .attr('fill', (d) => (d.feet === selectedFt ? colors.chartLabel : colors.chartAxis))
      .attr('font-weight', (d) => (d.feet === selectedFt ? 600 : 400))
      .transition(t)
      .attr('y', (d) => y(toKm2(d.totalM2)) - 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bands, selectedFt, highlightFt, width, reduced])

  return (
    <figure className="m-0">
      <figcaption className="mb-2">
        <span id={titleId} className="block t-heading">
          {chartTitle(bands)}
        </span>
        <span className="block t-caption">Square kilometres, {CITY_NAME}</span>
      </figcaption>
      <div ref={wrapRef} className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={HEIGHT}
          role="group"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="block overflow-visible font-sans"
        />
        {tip && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-56 -translate-x-1/2 -translate-y-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs shadow-float"
            style={{ left: tip.x, top: tip.y - 10 }}
            aria-hidden="true"
          >
            {tip.band !== null ? (
              <>
                <div className="font-medium text-fg">{formatScenario(tip.band)} adds</div>
                <div className="tabular text-fg-muted">
                  {formatKm2(bands.find((b) => b.feet === tip.band)?.addedM2 ?? 0)} km² ·{' '}
                  {formatAcres(bands.find((b) => b.feet === tip.band)?.addedM2 ?? 0)} acres
                </div>
              </>
            ) : (
              <>
                <div className="font-medium text-fg">{tip.bar.feet === 0 ? 'Today' : formatScenario(tip.bar.feet)}</div>
                <div className="tabular text-fg-muted">
                  {tip.bar.feet === 0 ? 'Where we start' : `${formatKm2(tip.bar.totalM2)} km² · ${formatAcres(tip.bar.totalM2)} acres`}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="sr-only">
        <table id={descId}>
          <caption>Land underwater, by sea level</caption>
          <thead>
            <tr>
              <th scope="col">Sea level</th>
              <th scope="col">Land underwater (km²)</th>
              <th scope="col">Added by this foot (km²)</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b) => (
              <tr key={b.feet}>
                <th scope="row">{b.feet === 0 ? 'Today' : formatScenario(b.feet)}</th>
                <td>{formatKm2(b.totalM2)}</td>
                <td>{formatKm2(bands.find((x) => x.feet === b.feet)?.addedM2 ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
