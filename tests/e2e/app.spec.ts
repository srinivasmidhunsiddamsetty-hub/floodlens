import { expect, test } from '@playwright/test'
import { insights, mapPitch, mapZoom, trackErrors, waitForMap } from './helpers'

test.describe('FloodLens — core flows', () => {
  test('loads the City of Miami Beach with real NOAA data and no runtime errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'FloodLens', level: 1 })).toBeVisible()
    await expect(page.getByText('City of Miami Beach, Florida')).toBeVisible()
    await waitForMap(page)

    const headline = insights(page).getByRole('region', { name: 'Land underwater' })
    await expect(headline).toContainText('at +2 ft')
    await expect(headline).toContainText('0.99')
    await expect(headline).toContainText('of the city’s land')
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/OpenStreetMap/)
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/NOAA/)
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(/US Census/)
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
    await expect(insights(page).getByRole('region', { name: 'Land underwater' })).toContainText('7.43')
    // The legend is a plain key: every level listed, none of them a button.
    const legendBox = page.getByRole('region', { name: 'Map legend' })
    await expect(legendBox.getByText('+3 ft', { exact: true })).toBeVisible()
    await expect(legendBox.getByRole('button')).toHaveCount(1)

    await page.keyboard.press('Home')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Current MHHW (0 ft)')
    await expect(insights(page).getByRole('region', { name: 'Land underwater' })).toContainText('None yet')
    expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(1)
  })

  test('play steps through every level and stops at the top', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.getByRole('button', { name: 'Watch the water rise' }).click()
    const slider = page.getByRole('slider')
    await expect(slider).toHaveAttribute('aria-valuetext', '+5 ft above MHHW', { timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Watch the water rise' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('chart bars select levels; one row shows what the selected foot adds', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const bar = page.getByRole('button', { name: /^\+1 ft: .*Show on the map\./ })
    await bar.click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+1 ft above MHHW')
    await expect(bar).toHaveAttribute('aria-pressed', 'true')
    // Selection is a ring around the bar; a mouse click doesn't leave a focus box round the column.
    await expect(bar).not.toBeFocused()
    await expect(insights(page).getByRole('button', { name: /\+1 ft adds/ })).toContainText('0.038 km²')
    await expect(insights(page).getByText(/ft adds/)).toHaveCount(1)
    await page.getByRole('button', { name: /^\+3 ft: .*Show on the map\./ }).click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+3 ft above MHHW')
    const row = insights(page).getByRole('button', { name: /\+3 ft adds/ })
    await expect(row).toContainText('6.44 km²')
    await expect(row).not.toContainText('acres')
    await expect(insights(page).getByText(/ft adds/)).toHaveCount(1)
  })

  test('area unit switches everything to acres and is remembered', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const panel = insights(page)
    await panel.getByRole('radio', { name: 'Acres' }).click()
    const area = panel.getByText('at +2 ft').locator('xpath=following-sibling::dd')
    await expect(area).toHaveText('244acres')
    await expect(panel.getByRole('button', { name: /\+2 ft adds/ })).toContainText('235 acres')
    await expect(panel.getByRole('button', { name: /^\+3 ft: 1,837 acres of land underwater/ })).toBeVisible()
    // Low spots are listed only while their map layer is on.
    await expect(panel.getByText('Low spots at +2 ft')).toHaveCount(0)
    await page.getByRole('switch', { name: /Low spots/ }).click()
    await expect(panel.getByText('Low spots at +2 ft')).toBeVisible()
    await expect(panel.getByText('Low spots at +2 ft').locator('xpath=following-sibling::span')).toHaveText('232 acres')
    await page.reload()
    await waitForMap(page)
    await expect(insights(page).getByRole('radio', { name: 'Acres' })).toHaveAttribute('aria-checked', 'true')
  })

  test('with a place selected, every insight fits without scrolling at 1440×900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await waitForMap(page)
    // No bottom link (v0.26): "About the data" in the top bar opens the same dialog.
    await expect(insights(page).getByRole('button', { name: /can and can’t tell you/ })).toHaveCount(0)
    await page.getByRole('navigation', { name: 'Go to area' }).getByRole('button', { name: 'South Beach' }).click()
    await expect.poll(() => mapZoom(page), { timeout: 10_000 }).toBeGreaterThan(15)
    await page.locator('.maplibregl-canvas').focus()
    await page.keyboard.press('Enter')
    await expect(insights(page).getByRole('list', { name: 'Water at this spot, by sea level' })).toBeVisible()
    await expect(insights(page).getByRole('region', { name: 'Land underwater' })).toBeVisible()
    const fit = await insights(page)
      .locator('.overflow-y-auto')
      .evaluate((el) => ({ content: el.scrollHeight, visible: el.clientHeight }))
    expect(fit.content).toBeLessThanOrEqual(fit.visible)
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

  test('the map credit starts open, folds into an (i) on the first drag, and the (i) opens it again', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const credit = page.locator('.maplibregl-ctrl-attrib')
    await expect(credit).toHaveClass(/maplibregl-compact-show/)
    await expect(credit).toContainText('© OpenStreetMap · © OpenMapTiles · OpenFreeMap | Flood data: NOAA | Boundary: US Census')
    await expect(credit.getByRole('link', { name: '© OpenStreetMap' })).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright')
    const box = (await page.locator('.maplibregl-canvas').boundingBox())!
    await page.mouse.move(box.x + 300, box.y + 400)
    await page.mouse.down()
    await page.mouse.move(box.x + 380, box.y + 440, { steps: 6 })
    await page.mouse.up()
    await expect(credit).not.toHaveClass(/maplibregl-compact-show/)
    await page.locator('.maplibregl-ctrl-attrib-button').click()
    await expect(credit).toHaveClass(/maplibregl-compact-show/)
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
    const card = page.getByRole('region', { name: /^(Building|Spot|Open water)/ })
    await expect(card).toBeVisible()
    await expect(card.getByRole('list', { name: /by sea level/ }).getByRole('listitem')).toHaveCount(6)
    await page.keyboard.press('Escape')
    await expect(card).toHaveCount(0)
  })

  test('selection can also be cleared with the close button', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.locator('.maplibregl-canvas').focus()
    await page.keyboard.press('Enter')
    const card = page.getByRole('region', { name: /^(Building|Spot|Open water)/ })
    await card.getByRole('button', { name: /close/i }).click()
    await expect(card).toHaveCount(0)
  })

  test('layer toggles and collapsible legend respond', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const low = page.getByRole('switch', { name: 'Low spots' })
    const req = page.waitForRequest(/low_2ft\.geojson/)
    await low.click()
    await req
    await expect(low).toHaveAttribute('aria-checked', 'true')
    const legend = page.getByRole('region', { name: 'Map legend' })
    await expect(legend).toContainText('Low spot')
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
    await expect(legend).not.toContainText('Low spot')
  })

  test('area chips highlight the area you are in once zoomed in', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const chips = page.getByRole('navigation', { name: 'Go to area' })
    await expect(chips.locator('[aria-current="location"]')).toHaveCount(0) // city overview: nowhere in particular
    await chips.getByRole('button', { name: 'Mid-Beach' }).click()
    await expect(chips.getByRole('button', { name: 'Mid-Beach' })).toHaveAttribute('aria-current', 'location', { timeout: 10_000 })
    await expect(chips.locator('[aria-current="location"]')).toHaveCount(1)
    // Clicking the lit chip again goes back to the whole city, with no chip lit (v0.27).
    await expect.poll(() => mapZoom(page), { timeout: 10_000 }).toBeGreaterThan(15)
    await chips.getByRole('button', { name: 'Mid-Beach' }).click()
    await expect(chips.locator('[aria-current="location"]')).toHaveCount(0)
    await expect.poll(() => mapZoom(page), { timeout: 10_000 }).toBeLessThan(14)
    await page.waitForTimeout(500)
    await expect(chips.locator('[aria-current="location"]')).toHaveCount(0)
  })

  test('the insights panel resizes by drag and keyboard within its limits', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const panel = page.locator('aside#insight-panel')
    const handle = page.getByRole('separator', { name: 'Resize insights panel' })
    const width = async () => Math.round((await panel.boundingBox())!.width)
    expect(await width()).toBe(380)
    await expect(handle).toHaveAttribute('aria-valuemin', '300')
    await expect(handle).toHaveAttribute('aria-valuemax', '560')

    // Drag the divider 120 px to the left: the panel grows by 120 px and the chart follows.
    const box = (await handle.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + 300)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + 300, { steps: 6 })
    await page.mouse.up()
    expect(await width()).toBe(500)

    // Limits hold however far you drag or press.
    await handle.focus()
    await page.keyboard.press('End')
    expect(await width()).toBe(560)
    await page.keyboard.press('ArrowLeft')
    expect(await width()).toBe(560)
    await page.keyboard.press('Home')
    expect(await width()).toBe(300)
    await page.keyboard.press('ArrowLeft')
    expect(await width()).toBe(316)

    // Double-click restores the default; the width is remembered across reloads.
    await handle.dblclick()
    expect(await width()).toBe(380)
    await page.keyboard.press('Shift+ArrowLeft')
    await page.reload()
    await waitForMap(page)
    expect(await width()).toBe(444)
  })

  test('data dialogs open, show provenance, and close with Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sources', exact: true }).click()
    const dlg = page.getByRole('dialog', { name: 'Data sources' })
    await expect(dlg).toBeVisible()
    await expect(dlg).toContainText('FL_SE_slr_final_dist.gpkg')
    await expect(dlg).toContainText('EPSG:4269')
    await expect(dlg.getByText('Passed')).toHaveCount(5)
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
    const alert = insights(page).getByRole('alert')
    await expect(alert).toContainText('The flood data didn’t load')
    await expect(alert).toContainText('npm run data:prepare')
    await expect(insights(page)).not.toContainText('km²')
  })

  test('a missing band file shows an explicit map warning', async ({ page }) => {
    await page.route('**/data/noaa/diff_2ft_3ft.geojson', (r) => r.fulfill({ status: 404, body: 'not found' }))
    await page.goto('/')
    await waitForMap(page)
    await page.getByRole('slider').focus()
    await page.keyboard.press('End')
    await expect(page.getByRole('main').getByRole('alert')).toContainText('diff_2ft_3ft.geojson didn’t load')
  })
})
