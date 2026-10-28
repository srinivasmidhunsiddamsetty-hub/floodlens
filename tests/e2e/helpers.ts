import { expect, type Page } from '@playwright/test'

/** Collects console errors and failed same-origin requests for assertions. */
export function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('response', (r) => {
    if (r.url().startsWith('http://localhost') && r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`)
  })
  return errors
}

/** Waits until MapLibre has drawn the canvas and the loading overlay is gone. */
export async function waitForMap(page: Page) {
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await expect(page.getByText('Loading basemap and NOAA overlays…')).toHaveCount(0, { timeout: 30_000 })
  // Give tiles a moment to settle for screenshots.
  await page.waitForTimeout(1500)
}

/** Compass icon transform encodes the map's pitch/bearing (visualizePitch: true). */
export async function compassTransform(page: Page) {
  return page.locator('.maplibregl-ctrl-compass .maplibregl-ctrl-icon').evaluate((el) => (el as HTMLElement).style.transform)
}
