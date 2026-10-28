import { expect, test } from '@playwright/test'
import { insights, mapPitch, trackErrors, waitForMap } from './helpers'

test.describe('FloodLens — core flows', () => {
  test('loads Miami Beach with real NOAA data and no runtime errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'FloodLens', level: 1 })).toBeVisible()
    await expect(page.getByText('Miami Beach, Florida · South Beach')).toBeVisible()
    await waitForMap(page)

    const headline = insights(page).getByRole('region', { name: 'Headline' })
    await expect(headline).toContainText('Flooded beyond today’s high tide')
    await expect(headline).toContainText('0.53')
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/OpenStreetMap/)
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/NOAA/)
    expect(errors).toEqual([])
  })

  test('sea-level slider is keyboard operable and adds a band per foot without reloading', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const slider = page.getByRole('slider', { name: /sea-level rise above today/i })
    await expect(slider).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')

    const req = page.waitForRequest(/diff_2ft_3ft\.geojson/)
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await req
    await expect(slider).toHaveAttribute('aria-valuetext', '+3 ft above MHHW')
    await expect(insights(page).getByRole('region', { name: 'Headline' })).toContainText('2.36')
    await expect(page.getByRole('region', { name: 'Map legend' }).getByRole('button', { name: '+3 ft' })).toBeEnabled()

    await page.keyboard.press('Home')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Current MHHW (0 ft)')
    await expect(insights(page).getByRole('region', { name: 'Headline' })).toContainText('Reference')
    expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(1)
  })

  test('play steps through every level and stops at the top', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.getByRole('button', { name: 'Play the rise' }).click()
    const slider = page.getByRole('slider')
    await expect(slider).toHaveAttribute('aria-valuetext', '+3 ft above MHHW', { timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Play the rise' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('chart bars select levels; breakdown rows show what each foot adds', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const bar = page.getByRole('button', { name: /^\+1 ft: .*Select\./ })
    await bar.click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+1 ft above MHHW')
    await expect(bar).toHaveAttribute('aria-pressed', 'true')
    const row = insights(page).getByRole('button', { name: /\+3 ft adds/ })
    await expect(row).toContainText('1.83 km²')
    await row.click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+3 ft above MHHW')
  })

  test('in-map controls: 2D/3D keeps the level, Home restores the 3D view', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    expect(await mapPitch(page)).toBe(55)
    await page.getByRole('button', { name: '2D view' }).click()
    await expect.poll(() => mapPitch(page)).toBe(0)
    await expect(page.getByRole('button', { name: '2D view' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')
    await page.getByRole('button', { name: 'Reset view' }).click()
    await expect.poll(() => mapPitch(page)).toBe(55)
    await expect(page.getByRole('button', { name: '3D view' })).toHaveAttribute('aria-pressed', 'true')
    // Reset view lives only in the map now — no duplicate in the header or panels.
    await expect(page.getByRole('banner').getByRole('button', { name: /reset/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Reset view' })).toHaveCount(1)
  })

  test('keyboard inspection: Enter on the map inspects the centre, Esc clears it', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.locator('.maplibregl-canvas').focus()
    await page.keyboard.press('Enter')
    const card = page.getByRole('region', { name: /^(Building|Location|Water)/ })
    await expect(card).toBeVisible()
    await expect(card.getByRole('list', { name: /by water level/ }).getByRole('listitem')).toHaveCount(4)
    await page.keyboard.press('Escape')
    await expect(card).toHaveCount(0)
  })

  test('selection can also be cleared with the close button', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.locator('.maplibregl-canvas').focus()
    await page.keyboard.press('Enter')
    const card = page.getByRole('region', { name: /^(Building|Location|Water)/ })
    await card.getByRole('button', { name: /clear selection/i }).click()
    await expect(card).toHaveCount(0)
  })

  test('layer toggles and collapsible legend respond', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const low = page.getByRole('switch', { name: 'Low-lying areas' })
    const req = page.waitForRequest(/low_2ft\.geojson/)
    await low.click()
    await req
    await expect(low).toHaveAttribute('aria-checked', 'true')
    const legend = page.getByRole('region', { name: 'Map legend' })
    await expect(legend).toContainText('Low-lying')
    const toggle = legend.getByRole('button', { name: 'Legend' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(legend).not.toContainText('Low-lying')
  })

  test('data dialogs open, show provenance, and close with Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sources', exact: true }).click()
    const dlg = page.getByRole('dialog', { name: 'Data sources' })
    await expect(dlg).toBeVisible()
    await expect(dlg).toContainText('FL_SE_slr_final_dist.gpkg')
    await expect(dlg).toContainText('EPSG:4269')
    await expect(dlg.getByText('Passed')).toHaveCount(6)
    await page.keyboard.press('Escape')
    await expect(dlg).toBeHidden()

    await page.getByRole('button', { name: 'Data sources & limitations' }).click()
    const about = page.getByRole('dialog', { name: 'About the data' })
    await expect(about).toContainText('Mean Higher High Water')
    await expect(about).toContainText('not affiliated with')
    await about.getByRole('button', { name: 'Close dialog' }).click()
    await expect(about).toBeHidden()
  })

  test('missing data is disclosed, never simulated', async ({ page }) => {
    await page.route('**/data/noaa/manifest.json', (r) => r.fulfill({ status: 404, body: 'not found' }))
    await page.goto('/')
    const alert = insights(page).getByRole('alert')
    await expect(alert).toContainText('Inundation data unavailable')
    await expect(alert).toContainText('npm run data:prepare')
    await expect(insights(page)).not.toContainText('km²')
  })

  test('a missing band file shows an explicit map warning', async ({ page }) => {
    await page.route('**/data/noaa/diff_2ft_3ft.geojson', (r) => r.fulfill({ status: 404, body: 'not found' }))
    await page.goto('/')
    await waitForMap(page)
    await page.getByRole('slider').focus()
    await page.keyboard.press('End')
    await expect(page.getByRole('main').getByRole('alert')).toContainText('diff_2ft_3ft.geojson is missing')
  })
})
