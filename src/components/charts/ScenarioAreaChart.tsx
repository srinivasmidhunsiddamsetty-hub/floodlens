import * as d3 from 'd3'
import { useEffect, useId, useRef, useState } from 'react'
import { formatAcres, formatKm2, formatScenario, M2_PER_KM2 } from '../../lib/format'
import { colors } from '../../lib/theme'
import { useReducedMotion } from '../../hooks/useMediaQuery'
import type { ScenarioMeta } from '../../types/data'

interface Props {
  scenarios: ScenarioMeta[]
  selectedFt: number
  /** Ordered compared pair, if comparison is active. */
  pair: [number, number] | null
  onSelect: (feet: number) => void
}

interface Tip {
  x: number
  y: number
  s: ScenarioMeta
}

const HEIGHT = 168
const M = { top: 14, right: 8, bottom: 30, left: 40 }

/**
 * Additional mapped extent beyond the 0 ft (current MHHW) extent, per scenario.
 * Values come from the processing manifest (geodesic areas of the exported
 * polygons) — nothing is hard-coded or estimated here.
 */
export function ScenarioAreaChart({ scenarios, selectedFt, pair, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(280)
  const [tip, setTip] = useState<Tip | null>(null)
  const reduced = useReducedMotion()
  const titleId = useId()
  const descId = useId()

  // Responsive width
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.floor(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    if (!svgRef.current) return
    const innerW = width - M.left - M.right
    const innerH = HEIGHT - M.top - M.bottom
    const values = scenarios.map((s) => s.beyondBaselineM2 / M2_PER_KM2)

    const x = d3
      .scaleBand<number>()
      .domain(scenarios.map((s) => s.feet))
      .range([0, innerW])
      .paddingInner(0.32)
      .paddingOuter(0.12)
    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(values) ?? 1) * 1.12 || 1])
      .nice(4)
      .range([innerH, 0])

    const root = svg
      .selectAll<SVGGElement, null>('g.root')
      .data([null])
      .join('g')
      .attr('class', 'root')
      .attr('transform', `translate(${M.left},${M.top})`)

    // Grid + y axis
    const yAxis = d3
      .axisLeft(y)
      .ticks(4)
      .tickSize(-innerW)
      .tickPadding(6)
      .tickFormat((d) => d3.format('~g')(d as number))
    root
      .selectAll<SVGGElement, null>('g.y')
      .data([null])
      .join('g')
      .attr('class', 'y')
      .call(yAxis)
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', colors.chartGrid))
      .call((g) => g.selectAll('.tick text').attr('fill', colors.chartAxis).attr('font-size', 10))

    // X axis
    root
      .selectAll<SVGGElement, null>('g.x')
      .data([null])
      .join('g')
      .attr('class', 'x')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(8).tickFormat((d) => formatScenario(d as number)))
      .call((g) => g.select('.domain').attr('stroke', colors.chartAxis).attr('stroke-opacity', 0.5))
      .call((g) =>
        g
          .selectAll<SVGTextElement, number>('.tick text')
          .attr('font-size', 11)
          .attr('font-weight', (d) => (d === selectedFt ? 600 : 400))
          .attr('fill', (d) => (d === selectedFt ? colors.floodLine : colors.chartAxis)),
      )

    const isHigh = (ft: number) => pair !== null && ft === pair[1]
    const isLow = (ft: number) => pair !== null && ft === pair[0]
    const fillFor = (ft: number) => {
      if (pair) return isHigh(ft) ? colors.compare : isLow(ft) ? colors.flood : colors.chartMuted
      return ft === selectedFt ? colors.flood : colors.chartMuted
    }

    const t = d3.transition().duration(reduced ? 0 : 450).ease(d3.easeCubicOut)

    const bars = root
      .selectAll<SVGGElement, ScenarioMeta>('g.bar')
      .data(scenarios, (d) => d.id)
      .join((enter) => {
        const g = enter.append('g').attr('class', 'bar').style('cursor', 'pointer')
        g.append('rect').attr('class', 'hit').attr('fill', 'transparent')
        g.append('rect').attr('class', 'v').attr('rx', 3).attr('y', innerH).attr('height', 0)
        g.append('text').attr('class', 'lbl').attr('text-anchor', 'middle').attr('font-size', 10)
        return g
      })

    bars
      .attr('transform', (d) => `translate(${x(d.feet) ?? 0},0)`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr(
        'aria-label',
        (d) =>
          `${formatScenario(d.feet)}: ${formatKm2(d.beyondBaselineM2)} square kilometres beyond the 0 ft extent. Select scenario.`,
      )
      .attr('aria-pressed', (d) => (d.feet === selectedFt ? 'true' : 'false'))
      .on('click', (_, d) => onSelectRef.current(d.feet))
      .on('keydown', (e: KeyboardEvent, d) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelectRef.current(d.feet)
        }
      })
      .on('mouseenter focus', function (_, d) {
        const bx = (x(d.feet) ?? 0) + M.left + x.bandwidth() / 2
        const by = y(d.beyondBaselineM2 / M2_PER_KM2) + M.top
        setTip({ x: bx, y: by, s: d })
      })
      .on('mouseleave blur', () => setTip(null))

    bars
      .select<SVGRectElement>('rect.hit')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', x.bandwidth())
      .attr('height', innerH)

    bars
      .select<SVGRectElement>('rect.v')
      .attr('x', 0)
      .attr('width', x.bandwidth())
      .transition(t)
      .attr('y', (d) => y(d.beyondBaselineM2 / M2_PER_KM2))
      .attr('height', (d) => Math.max(d.beyondBaselineM2 > 0 ? 1.5 : 0, innerH - y(d.beyondBaselineM2 / M2_PER_KM2)))
      .attr('fill', (d) => fillFor(d.feet))

    bars
      .select<SVGTextElement>('text.lbl')
      .attr('x', x.bandwidth() / 2)
      .text((d) => (d.feet === 0 ? 'ref.' : formatKm2(d.beyondBaselineM2)))
      .attr('fill', (d) => (d.feet === selectedFt || isHigh(d.feet) ? colors.chartLabel : colors.chartAxis))
      .attr('font-weight', (d) => (d.feet === selectedFt ? 600 : 400))
      .transition(t)
      .attr('y', (d) => y(d.beyondBaselineM2 / M2_PER_KM2) - 5)
  }, [scenarios, selectedFt, pair, width, reduced])

  return (
    <figure className="m-0">
      <figcaption className="mb-2">
        <span id={titleId} className="block text-[13px] font-medium text-fg">
          Added extent beyond today&rsquo;s high tide
        </span>
        <span className="block text-xs text-fg-subtle">km² within the study area, outside the 0 ft (MHHW) extent</span>
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
        <span className="pointer-events-none absolute top-0 left-0 -translate-x-1 -translate-y-0.5 text-[10px] text-fg-subtle" aria-hidden>
          km²
        </span>
        {tip && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-52 -translate-x-1/2 -translate-y-full rounded-md border border-line-strong bg-surface-2 px-2 py-1.5 text-xs shadow-panel"
            style={{ left: tip.x, top: tip.y - 18 }}
            aria-hidden="true"
          >
            <div className="font-semibold text-fg">{formatScenario(tip.s.feet)}</div>
            <div className="text-fg-muted tabular">
              {tip.s.feet === 0
                ? 'Reference extent (current MHHW)'
                : `${formatKm2(tip.s.beyondBaselineM2)} km² · ${formatAcres(tip.s.beyondBaselineM2)} acres beyond 0 ft`}
            </div>
            <div className="text-fg-subtle tabular">Total mapped: {formatKm2(tip.s.areaM2)} km²</div>
          </div>
        )}
      </div>
      {/* Text alternative with every value the chart encodes (wrapped: tables ignore sr-only's 1px width) */}
      <div className="sr-only">
      <table id={descId}>
        <caption>Mapped inundation area by scenario within the study area</caption>
        <thead>
          <tr>
            <th scope="col">Scenario</th>
            <th scope="col">Beyond 0 ft extent (km²)</th>
            <th scope="col">Total mapped extent (km²)</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.id}>
              <th scope="row">{formatScenario(s.feet)}</th>
              <td>{formatKm2(s.beyondBaselineM2)}</td>
              <td>{formatKm2(s.areaM2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  )
}
