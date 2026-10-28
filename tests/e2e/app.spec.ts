import { expect, test } from '@playwright/test'
import { insights, mapPitch, mapZoom, trackErrors, waitForMap } from './helpers'

test.describe('FloodLens — core flows', () => {
  test('loads the City of Miami Beach with real NOAA data and no runtime errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'FloodLens', level: 1 })).toBeVisible()
    await expect(page.getByText('City of Miami Beach, Florida')).toBeVisible()
    await waitForMap(page)

    const headline = insights(page).getByRole('region', { name: 'Headline' })
    await expect(headline).toContainText('Flooded beyond today’s high tide')
    await expect(headline).toContainText('0.99')
    await expect(headline).toContainText('of the city’s land area')
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/OpenStreetMap/)
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/NOAA/)
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/Census Bureau/)
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
    await expect(insights(page).getByRole('region', { name: 'Headline' })).toContainText('7.43')
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
    await expect(row).toContainText('6.44 km²')
    await expect(row).toContainText('acres')
    await row.click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+3 ft above MHHW')
  })

  test('in-map controls: 2D/3D keeps the level, "show all" restores the 3D city view', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    expect(await mapPitch(page)).toBe(40)
    await page.getByRole('button', { name: '2D view' }).click()
    await expect.poll(() => mapPitch(page)).toBe(0)
    await expect(page.getByRole('button', { name: '2D view' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')
    await page.getByRole('button', { name: 'Show all of Miami Beach' }).click()
    await expect.poll(() => mapPitch(page)).toBe(40)
    await expect(page.getByRole('button', { name: '3D view' })).toHaveAttribute('aria-pressed', 'true')
    // The view reset lives only in the map — no duplicate in the header or panels.
    await expect(page.getByRole('banner').getByRole('button', { name: /reset|show all/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Show all of Miami Beach' })).toHaveCount(1)
  })

  test('area bookmarks fly along the city and keep the current 2D/3D mode', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const overview = await mapZoom(page)
    const go = page.getByRole('navigation', { name: 'Go to area' })
    await go.getByRole('button', { name: 'North Beach' }).click()
    await expect.poll(() => mapZoom(page), { timeout: 10_000 }).toBeGreaterThan(overview + 2)
    await expect.poll(() => mapPitch(page)).toBe(55)
    await page.getByRole('button', { name: '2D view' }).click()
    await expect.poll(() => mapPitch(page)).toBe(0)
    await go.getByRole('button', { name: 'South Beach' }).click()
    await page.waitForTimeout(2500)
    expect(await mapPitch(page)).toBe(0)
    await expect(page.getByRole('button', { name: '2D view' })).toHaveAttribute('aria-pressed', 'true')
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
    // City limits can be hidden (and shown again), and the legend follows.
    const limits = page.getByRole('switch', { name: 'City limits' })
    await expect(limits).toHaveAttribute('aria-checked', 'true')
    await expect(legend).toContainText('City limits')
    await limits.click()
    await expect(limits).toHaveAttribute('aria-checked', 'false')
    await expect(legend).not.toContainText('City limits')
    await limits.click()
    await expect(legend).toContainText('City limits')

    const toggle = legend.getByRole('button', { name: 'Legend' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(legend).not.toContainText('Low-lying')
  })

  test('the city locator shows where the view is and flies to named areas', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const locator = page.getByRole('navigation', { name: 'Go to area' })
    await expect(locator.locator('svg polygon')).toHaveCount(0) // whole city on screen: no viewport outline
    await locator.getByRole('button', { name: 'Mid-Beach' }).click()
    await expect(locator.getByRole('button', { name: 'Mid-Beach' })).toHaveAttribute('aria-current', 'location', { timeout: 10_000 })
    await expect(locator.locator('svg polygon')).toHaveCount(1)
    await expect(locator.getByRole('button', { name: 'South Beach' })).not.toHaveAttribute('aria-current', 'location')
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
