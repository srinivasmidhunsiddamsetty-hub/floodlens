import type { ReactNode } from 'react'
import type { DataManifest } from '../../types/data'
import { Dialog } from '../ui/Dialog'

function H({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-2 text-[13px] font-semibold text-fg first:mt-0">{children}</h3>
}

interface Props {
  open: boolean
  onClose: () => void
  manifest: DataManifest | null
}

export function AboutDataDialog({ open, onClose, manifest }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="About the data" subtitle="What the map shows, and what it can’t">
      <H>What the levels mean</H>
      <p>
        Each step is the sea rising one more foot above <strong className="text-fg">today’s high tide</strong>. Scientists measure that
        line as Mean Higher High Water (MHHW): the average of the higher of each day’s two high tides. NOAA maps how far the water would
        reach at each level during the highest high tides. 0 ft is today, our starting point.
      </p>
      <p className="mt-2">
        These are <strong className="text-fg">amounts of rise, not dates</strong>. FloodLens doesn’t say when they’ll happen or how
        likely they are. That needs a separate sea-level forecast.
      </p>

      <H>Where the maps come from</H>
      <p>
        NOAA’s Office for Coastal Management compares detailed ground-height data with the tide line, then keeps only the places{' '}
        <strong className="text-fg">connected to the sea</strong> (a “modified bathtub” method). Places below the water line with no path
        to the sea are mapped separately as <em>low spots</em>. FloodLens shows those as their own optional layer and never mixes the two.
      </p>

      <H>How to read the map</H>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Colour shows the sea level at which water <em>first</em> reaches a place: light blue at today’s high tide, getting darker at +1,
          +2 and +3 ft.
        </li>
        <li>Open water sits on top, so colour only appears where water reaches land.</li>
        <li>Areas are measured on the curved Earth, and only inside Miami Beach’s city limits.</li>
        <li>Building heights come from OpenStreetMap. Where a building has no recorded height, the map estimates one.</li>
      </ul>

      <H>What it can’t tell you</H>
      <ul className="list-disc space-y-1 pl-5">
        <li>It shows <strong className="text-fg">how much</strong> could flood, not exactly where the water’s edge will be.</li>
        <li>It leaves out erosion, sinking ground, new construction and wind-driven tides.</li>
        <li>It isn’t a model of storm surge, waves, rain or groundwater. Seawalls and drains count only as far as the ground-height data shows them.</li>
        <li>It shows where water reaches, not how deep it gets.</li>
        <li>It’s only as accurate as NOAA’s ground-height and tide data. NOAA publishes confidence maps too; they aren’t included here.</li>
        <li>Water reaching a building on the map doesn’t mean that building will flood.</li>
      </ul>

      <H>Good uses</H>
      <p>
        Getting a feel for the scale of the problem, comparing levels, spotting places that need a closer look, and starting
        conversations. NOAA says the data are for planning only, not for navigation, permits or legal decisions. Check anything
        important with site visits and local studies.
      </p>

      {manifest && (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-5">
          <span className="font-medium text-fg">In NOAA’s words:</span> {manifest.source.useConstraints}
        </p>
      )}

      <H>Who made this</H>
      <p>
        FloodLens is an independent portfolio project. It’s not affiliated with, sponsored by or endorsed by NOAA, Esri, OpenFreeMap,
        OpenMapTiles, OpenStreetMap or the City of Miami Beach.
      </p>
    </Dialog>
  )
}
