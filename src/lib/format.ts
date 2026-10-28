export const M2_PER_KM2 = 1_000_000
export const M2_PER_ACRE = 4046.8564224

/** km² with precision that adapts to magnitude, e.g. 0.022 / 0.53 / 12.99 */
export function formatKm2(m2: number): string {
  const km2 = m2 / M2_PER_KM2
  if (km2 === 0) return '0'
  if (km2 < 0.1) return km2.toFixed(3)
  if (km2 < 10) return km2.toFixed(2)
  return km2.toFixed(1)
}

export function formatAcres(m2: number): string {
  const ac = m2 / M2_PER_ACRE
  if (ac === 0) return '0'
  if (ac < 10) return ac.toFixed(1)
  return Math.round(ac).toLocaleString('en-US')
}

/** Small polygon areas read better in m² */
export function formatSmallArea(m2: number): string {
  if (m2 < 10_000) return `${Math.round(m2).toLocaleString('en-US')} m²`
  return `${formatKm2(m2)} km²`
}

export function formatScenario(ft: number): string {
  return ft === 0 ? '0 ft' : `+${ft} ft`
}

export function formatScenarioLong(ft: number): string {
  return ft === 0 ? 'Current MHHW (0 ft)' : `+${ft} ft above MHHW`
}

/** Percent with one decimal below 10% (5.0%), or rounded for prose (`round`: 5%, 37%). */
export function formatPercent(fraction: number, round = false): string {
  const pct = fraction * 100
  if (pct > 0 && pct < 0.1) return '<0.1%'
  if (round) return pct < 1 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`
  return `${pct.toFixed(pct < 10 ? 1 : 0)}%`
}

export function formatCoord(lng: number, lat: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(5)}° ${ns}, ${Math.abs(lng).toFixed(5)}° ${ew}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function formatMeters(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}
