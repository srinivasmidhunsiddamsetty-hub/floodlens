import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatBytes, formatKm2 } from '../../lib/format'
import type { DataManifest } from '../../types/data'
import { Dialog } from '../ui/Dialog'

function H({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 mb-2 text-[13px] font-semibold text-fg first:mt-0">{children}</h3>
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline">
      {children}
      <ExternalLink className="size-3" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  manifest: DataManifest | null
  manifestError: string | null
}

export function DataSourcesDialog({ open, onClose, manifest, manifestError }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Data sources" subtitle="Provenance, processing and attribution">
      <H>Sea-level-rise inundation: NOAA Office for Coastal Management</H>
      {manifest ? (
        <>
          <p>
            {manifest.source.dataset}, geography <strong className="text-fg">{manifest.source.geography}</strong> (
            {manifest.source.geographyCounties.join(', ')} counties), published {manifest.source.publicationYear}. Source file{' '}
            <code className="rounded bg-surface-3 px-1 text-xs text-fg">{manifest.source.file}</code> (
            {formatBytes(manifest.source.fileSizeBytes)} uncompressed).
          </p>
          <ul className="mt-2 space-y-1 text-[13px]">
            <li>
              <A href={manifest.source.indexUrl}>NOAA SLR data download directory (FL)</A>
            </li>
            <li>
              <A href={manifest.source.metadata.inport_0ft}>Metadata: current MHHW extent (InPort 48105)</A>
            </li>
            <li>
              <A href={manifest.source.metadata.inport_1to10ft}>Metadata: 1–10 ft extents (InPort 48106)</A>
            </li>
            <li>
              <A href={manifest.source.metadata.methods_pdf}>NOAA inundation mapping methods (PDF)</A>
            </li>
          </ul>

          {manifest.studyArea.boundary && (
            <>
              <H>Study area boundary</H>
              <p>
                {manifest.studyArea.boundary.name} (GEOID {manifest.studyArea.boundary.geoid}) from the{' '}
                <A href={manifest.studyArea.boundary.downloadUrl}>{manifest.studyArea.boundary.publisher} {manifest.studyArea.boundary.dataset}</A>,{' '}
                {manifest.studyArea.boundary.license.toLowerCase()}. The city limits include Biscayne Bay waters: Census lists{' '}
                {formatKm2(manifest.studyArea.boundary.censusLandM2)} km² of land and {formatKm2(manifest.studyArea.boundary.censusWaterM2)} km²
                of water.
              </p>
            </>
          )}

          <H>Processing</H>
          <p className="text-xs">
            Study area <strong className="text-fg">{manifest.studyArea.name}</strong>, bbox [{manifest.studyArea.bbox.join(', ')}] (
            {formatKm2(manifest.studyArea.areaM2)} km²). Source CRS {manifest.crs.source} → processing {manifest.crs.processing} → output{' '}
            {manifest.crs.output}. Generated {new Date(manifest.generatedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })} by{' '}
            <code className="text-fg">{manifest.generator}</code>.
          </p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-xs">
            {manifest.processing.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <H>Validation of derived layers</H>
          <p className="text-xs">
            Each &ldquo;added extent&rdquo; layer is a polygon difference (higher − lower). The pipeline checks that the lower extent lies
            inside the higher one and that the difference area equals the change in total area. The map&rsquo;s colour bands are the
            differences between neighbouring levels (0→1, 1→2, … 4→5 ft).
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs tabular">
              <thead className="text-fg-subtle">
                <tr className="border-b border-line">
                  <th scope="col" className="py-1.5 pr-3 font-medium">Pair</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">Lower outside higher</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">Relative error</th>
                  <th scope="col" className="py-1.5 font-medium">Check</th>
                </tr>
              </thead>
              <tbody>
                {manifest.processing.validation.map((v) => (
                  <tr key={v.pair} className="border-b border-line/60">
                    <td className="py-1.5 pr-3 text-fg">{v.pair.replace('→', ' → ')}</td>
                    <td className="py-1.5 pr-3">{v.lowerOutsideHigherM2.toFixed(3)} m²</td>
                    <td className="py-1.5 pr-3">{v.relativeError.toExponential(1)}</td>
                    <td className="py-1.5">
                      {v.passed ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="size-3.5" aria-hidden /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-danger">
                          <XCircle className="size-3.5" aria-hidden /> Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H>Processed files</H>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular">
              <thead className="text-fg-subtle">
                <tr className="border-b border-line">
                  <th scope="col" className="py-1.5 pr-3 font-medium">Layer</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">NOAA source layer</th>
                  <th scope="col" className="py-1.5 pr-3 font-medium">Area</th>
                  <th scope="col" className="py-1.5 font-medium">Size</th>
                </tr>
              </thead>
              <tbody>
                {[...manifest.scenarios, ...manifest.lowLying].map((s) => (
                  <tr key={s.id} className="border-b border-line/60">
                    <td className="py-1.5 pr-3 text-fg">{s.file}</td>
                    <td className="py-1.5 pr-3 text-xs">{s.sourceLayer}</td>
                    <td className="py-1.5 pr-3">{formatKm2(s.areaM2)} km²</td>
                    <td className="py-1.5">{formatBytes(s.bytes)}</td>
                  </tr>
                ))}
                {manifest.comparisons.map((c) => (
                  <tr key={c.id} className="border-b border-line/60">
                    <td className="py-1.5 pr-3 text-fg">{c.file}</td>
                    <td className="py-1.5 pr-3 text-fg-subtle">derived: {c.toFt} ft − {c.fromFt} ft</td>
                    <td className="py-1.5 pr-3">{formatKm2(c.areaM2)} km²</td>
                    <td className="py-1.5">{formatBytes(c.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-danger">{manifestError ?? 'Processed data manifest has not loaded.'}</p>
      )}

      <H>Basemap</H>
      <p>
        Vector tiles and the base style from <A href="https://openfreemap.org">OpenFreeMap</A> (free, no API key), using the{' '}
        <A href="https://openmaptiles.org">OpenMapTiles</A> schema with data{' '}
        <A href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</A>. FloodLens restyles the colours, draws water
        above land-side overlays, and replaces flat buildings with extrusions from the tiles&rsquo; <code className="text-fg">render_height</code>.
      </p>

      <H>Attribution</H>
      <p className="text-xs">
        Data: NOAA Office for Coastal Management, Sea Level Rise Viewer (coast.noaa.gov/slr). City boundary: US Census Bureau TIGER/Line.
        Map: OpenFreeMap © OpenMapTiles, data from OpenStreetMap. Rendering: MapLibre GL JS. Charts: D3.js.
      </p>
    </Dialog>
  )
}
