import { AREA_UNITS, type AreaUnit } from '../../lib/format'
import { Segmented } from './Segmented'

const OPTIONS = (['km2', 'acres'] as const).map((unit) => ({ value: unit, label: AREA_UNITS[unit].short, ariaLabel: AREA_UNITS[unit].title }))

/** The area unit (km² or acres): one Tab stop, arrow keys switch, the chosen unit filled with the accent, like Total / Individual. */
export function AreaUnitToggle({ value, onChange, onDark }: { value: AreaUnit; onChange: (unit: AreaUnit) => void; onDark?: boolean }) {
  return <Segmented label="Area unit" size="xs" options={OPTIONS} value={value} onChange={onChange} onDark={onDark} className="shrink-0" />
}
