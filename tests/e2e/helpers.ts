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
  await expect(page.getByText('Loading the map and flood data…')).toHaveCount(0, { timeout: 30_000 })
  // Give tiles a moment to settle for screenshots.
  await page.waitForTimeout(1500)
}

/** Current map pitch, exposed by the in-map control stack. */
export async function mapPitch(page: Page) {
  return Number(await page.locator('[data-pitch]').getAttribute('data-pitch'))
}

/** Current map zoom (one decimal), exposed by the in-map control stack. */
export async function mapZoom(page: Page) {
  return Number(await page.locator('[data-zoom]').getAttribute('data-zoom'))
}

export const insights = (page: Page) => page.getByRole('complementary', { name: 'Insights' })
