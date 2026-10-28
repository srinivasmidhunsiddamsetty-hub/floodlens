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
    <Dialog open={open} onClose={onClose} title="About the data" subtitle="What the map shows, and what it cannot tell you">
      <H>What the scenarios represent</H>
      <p>
        Each scenario is a <strong className="text-fg">water level above Mean Higher High Water (MHHW)</strong>: the average height of the
        higher of the two daily high tides. NOAA maps where the water would reach if sea level were 1, 2 or 3 ft higher than today&rsquo;s
        MHHW, as it would appear during the highest high tides. <strong className="text-fg">0 ft</strong> is NOAA&rsquo;s extent at
        current MHHW and acts as the reference.
      </p>
      <p className="mt-2">
        Scenarios are <strong className="text-fg">amounts of rise, not dates</strong>. FloodLens does not attach years or probabilities to
        them, because that requires a separate sea-level projection.
      </p>

      <H>How NOAA produced the extents</H>
      <p>
        NOAA&rsquo;s Office for Coastal Management uses a <em>modified bathtub</em> method. It compares a high-resolution digital elevation
        model with a tidal surface (MHHW, built with NOAA VDatum) and keeps only areas{' '}
        <strong className="text-fg">hydrologically connected to the ocean</strong>. Areas that sit below the water level but have no
        connection are published separately as <em>low-lying areas</em>. FloodLens keeps them in a separate, optional layer and never
        merges the two.
      </p>

      <H>How to read the map</H>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Colour shows the water level at which NOAA&rsquo;s mapped extent <em>first</em> reaches each area: darkest for today&rsquo;s high
          tide, lightening through +1, +2 and +3 ft. Places reached at lower levels are the most exposed.
        </li>
        <li>Open water is drawn above the overlay, so colour appears only where water reaches land.</li>
        <li>Areas are geodesic measurements of the processed polygons inside the study area only.</li>
        <li>Building heights come from OpenStreetMap through OpenMapTiles. Where OSM has no height, the tiles use an estimate, so heights are approximate.</li>
      </ul>

      <H>Limitations</H>
      <ul className="list-disc space-y-1 pl-5">
        <li>The data illustrate the <strong className="text-fg">scale</strong> of potential flooding, not its exact location.</li>
        <li>NOAA notes the data do not account for erosion, subsidence or future construction, and exclude wind-driven tides.</li>
        <li>This is not a storm-surge, wave, rainfall or groundwater model. Seawalls and drainage are represented only as far as the elevation data capture them.</li>
        <li>An extent polygon says nothing about water depth. FloodLens shows no depths.</li>
        <li>Accuracy is limited by the source elevation data and tidal model (NOAA also publishes mapping-confidence rasters, not included here).</li>
        <li>&ldquo;Within the mapped extent&rdquo; does not mean a property or building will flood.</li>
      </ul>

      <H>Appropriate uses</H>
      <p>
        Screening-level exploration: comparing scenarios, spotting areas for further study, and starting conversations with stakeholders.
        NOAA states the data are for planning reference only and should not be used for navigation, permitting or other legal purposes.
        Verify findings with site visits and local studies.
      </p>

      {manifest && (
        <p className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-5">
          <span className="font-medium text-fg">NOAA use constraints:</span> {manifest.source.useConstraints}
        </p>
      )}

      <H>Independence</H>
      <p>
        FloodLens is an independent portfolio concept. It is not affiliated with, sponsored by, or endorsed by NOAA, Esri, OpenFreeMap,
        OpenMapTiles, OpenStreetMap or the City of Miami Beach.
      </p>
    </Dialog>
  )
}
