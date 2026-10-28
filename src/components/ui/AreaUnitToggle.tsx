import { AREA_UNITS, type AreaUnit } from '../../lib/format'
import { Segmented } from './Segmented'

const OPTIONS = (['km2', 'acres'] as const).map((unit) => ({ value: unit, label: AREA_UNITS[unit].short, ariaLabel: AREA_UNITS[unit].title }))

/** The Insights area unit: one Tab stop, arrow keys switch, the chosen unit filled with the accent. */
export function AreaUnitToggle({ value, onChange }: { value: AreaUnit; onChange: (unit: AreaUnit) => void }) {
  return <Segmented label="Area unit" size="xs" options={OPTIONS} value={value} onChange={onChange} className="shrink-0" />
}
