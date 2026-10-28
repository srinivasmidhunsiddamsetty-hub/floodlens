import { expect, test } from '@playwright/test'
import { compassTransform, trackErrors, waitForMap } from './helpers'

test.describe('FloodLens — core flows', () => {
  test('loads Miami Beach with real NOAA data and no runtime errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'FloodLens', level: 1 })).toBeVisible()
    await expect(page.getByText('Miami Beach, Florida')).toBeVisible()
    await waitForMap(page)

    const insights = page.getByRole('complementary', { name: 'Exposure insights' })
    await expect(insights.getByText(/NOAA maps/)).toContainText('0.53 km²')
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/OpenStreetMap/)
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/NOAA/)
    expect(errors).toEqual([])
  })

  test('scenario slider is keyboard operable and swaps the NOAA layer without reloading', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const slider = page.getByRole('slider', { name: /sea-level-rise scenario/i })
    await expect(slider).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')

    const req = page.waitForRequest(/slr_3ft\.geojson/)
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await req
    await expect(slider).toHaveAttribute('aria-valuetext', '+3 ft above MHHW')
    const insights = page.getByRole('complementary', { name: 'Exposure insights' })
    await expect(insights.getByText(/NOAA maps/)).toContainText('2.36 km²')
    await expect(insights.getByText(/Added since \+2 ft/)).toBeVisible()

    await page.keyboard.press('Home')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Current MHHW (0 ft)')
    await expect(insights.getByText(/reference the other scenarios/)).toBeVisible()
    // Same document throughout — no full reload.
    expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(1)
  })

  test('chart bars select scenarios and highlight the current one', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const bar = page.getByRole('button', { name: /^\+1 ft: .* Select scenario\./ })
    await bar.click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+1 ft above MHHW')
    await expect(bar).toHaveAttribute('aria-pressed', 'true')
  })

  test('2D / 3D toggle animates pitch and keeps the scenario', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    expect(await compassTransform(page)).toMatch(/rotateX\((?!0deg)/)
    await page.getByRole('radio', { name: '2D top-down' }).click()
    await expect.poll(() => compassTransform(page)).toMatch(/rotateX\(0deg\) rotateZ\(-?0deg\)/)
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')
    await page.getByRole('radio', { name: '3D oblique' }).click()
    await expect.poll(() => compassTransform(page)).toMatch(/rotateX\(55deg\)/)
  })

  test('comparison mode loads the derived difference layer and updates legend + summary', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const req = page.waitForRequest(/diff_1ft_2ft\.geojson/)
    await page.getByRole('switch', { name: 'Compare two scenarios' }).click()
    await req
    const legend = page.getByRole('region', { name: 'Map legend' })
    await expect(legend).toContainText('Added by +2 ft')
    const insights = page.getByRole('complementary', { name: 'Exposure insights' })
    await expect(insights.getByText(/Going from/)).toContainText('0.50 km²')

    await page.getByRole('radio', { name: '+3 ft' }).click()
    await expect(insights.getByText(/Going from/)).toContainText('+2 ft')
    await expect(insights.getByText(/Going from/)).toContainText('+3 ft')
    await expect(insights.getByText(/Going from/)).toContainText('1.83 km²')
  })

  test('inspecting the map centre reports per-scenario membership', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.getByRole('button', { name: 'Inspect map center' }).first().click()
    const card = page.getByRole('region', { name: /Selected (location|building)/ })
    await expect(card).toBeVisible()
    await expect(card.getByRole('list', { name: 'Ocean-connected extent by scenario' }).getByRole('listitem')).toHaveCount(4)
    await card.getByRole('button', { name: 'Clear selection' }).click()
    await expect(card).toHaveCount(0)
  })

  test('layer toggles and legend respond', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const low = page.getByRole('switch', { name: 'Low-lying areas' })
    const req = page.waitForRequest(/low_2ft\.geojson/)
    await low.click()
    await req
    await expect(low).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('region', { name: 'Map legend' })).toContainText('Low-lying, not ocean-connected')
    await page.getByRole('switch', { name: 'Show legend' }).click()
    await expect(page.getByRole('region', { name: 'Map legend' })).toHaveCount(0)
  })

  test('data dialogs open, show provenance, and close with Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Data sources' }).click()
    const dlg = page.getByRole('dialog', { name: 'Data sources' })
    await expect(dlg).toBeVisible()
    await expect(dlg).toContainText('FL_SE_slr_final_dist.gpkg')
    await expect(dlg).toContainText('EPSG:4269')
    await expect(dlg.getByText('Passed')).toHaveCount(6)
    await page.keyboard.press('Escape')
    await expect(dlg).toBeHidden()

    await page.getByRole('button', { name: 'About the data', exact: true }).click()
    const about = page.getByRole('dialog', { name: 'About the data' })
    await expect(about).toContainText('Mean Higher High Water')
    await expect(about).toContainText('not affiliated with')
    await about.getByRole('button', { name: 'Close dialog' }).click()
    await expect(about).toBeHidden()
  })

  test('missing data is disclosed, never simulated', async ({ page }) => {
    await page.route('**/data/noaa/manifest.json', (r) => r.fulfill({ status: 404, body: 'not found' }))
    await page.goto('/')
    const alert = page.getByRole('complementary', { name: 'Exposure insights' }).getByRole('alert')
    await expect(alert).toContainText('Inundation data unavailable')
    await expect(alert).toContainText('npm run data:prepare')
    await expect(page.getByRole('complementary', { name: 'Exposure insights' })).not.toContainText('km²')
  })

  test('a missing scenario file shows an explicit map warning', async ({ page }) => {
    await page.route('**/data/noaa/slr_3ft.geojson', (r) => r.fulfill({ status: 404, body: 'not found' }))
    await page.goto('/')
    await waitForMap(page)
    await page.getByRole('slider').focus()
    await page.keyboard.press('End')
    await expect(page.getByRole('main').getByRole('alert')).toContainText('slr_3ft.geojson is missing')
  })
})
