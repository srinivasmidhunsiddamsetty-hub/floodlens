import { expect, test, type Page } from '@playwright/test'
import { insights, mapPitch, mapZoom, trackErrors, waitForMap } from './helpers'

/** The left panel: sea level, its figures and the layer switches. */
const seaLevel = (page: Page) => page.getByRole('complementary', { name: 'Sea level and layers' })

test.describe('FloodLens — core flows', () => {
  test('loads the City of Miami Beach with real NOAA data and no runtime errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'FloodLens', level: 1 })).toBeVisible()
    await expect(page.getByText('City of Miami Beach, Florida')).toBeVisible()
    await waitForMap(page)

    // The land underwater sits beside the slider (v0.36), not in Insights.
    await expect(seaLevel(page)).toContainText('Total submerged area')
    await expect(seaLevel(page)).toContainText('0.99km²')
    await expect(seaLevel(page)).toContainText('5% of the city’s land')
    await expect(insights(page).getByRole('region', { name: 'Land underwater' })).toHaveCount(0)
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
    await expect(seaLevel(page)).toContainText('7.43km²')
    // The legend is a plain vertical scale, shown with Layered colours (v0.35): every level listed,
    // the chosen one marked, nothing a button.
    await page.getByRole('radio', { name: 'Layered' }).click()
    await slider.focus()
    const legendBox = page.getByRole('region', { name: 'Map legend' })
    await expect(legendBox.getByRole('listitem')).toHaveCount(6)
    await expect(legendBox.getByRole('listitem').filter({ hasText: '+3 ft' })).toContainText('(chosen level)')
    await expect(legendBox.getByText('(chosen level)')).toHaveCount(1)
    await expect(legendBox.getByRole('button')).toHaveCount(0)

    await page.keyboard.press('Home')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Current MHHW (0 ft)')
    await expect(seaLevel(page)).toContainText('None yet')
    expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(1)
  })

  test('the left panel fits without scrolling, with no play or info button (v0.35)', async ({ page }) => {
    // 650 px is about the browser window of a 1366 × 768 laptop. The low-spot line (v0.36) adds a row.
    for (const height of [900, 650]) {
      await page.setViewportSize({ width: 1440, height })
      await page.goto('/')
      await waitForMap(page)
      const panel = page.locator('#control-panel > div')
      const fits = async () => panel.evaluate((el) => el.scrollHeight <= el.clientHeight)
      expect(await fits()).toBe(true)
      await expect(page.getByRole('switch', { name: 'City limits' })).toBeInViewport()
      await page.getByRole('switch', { name: 'Low spots' }).click()
      await expect(seaLevel(page)).toContainText('0.94 km² at +2 ft')
      expect(await fits()).toBe(true)
      await expect(page.getByRole('switch', { name: 'City limits' })).toBeInViewport()
      await page.getByRole('switch', { name: 'Low spots' }).click()
    }
    const left = seaLevel(page)
    await expect(left.getByRole('button', { name: /step up|watch|play|what do these levels mean/i })).toHaveCount(0)
    // No big "+2 ft" (v0.36): the bold level name on the slider says it.
    await expect(left.locator('output')).toHaveCount(0)
    // The colour toggle sits in the Sea level title row.
    const title = page.getByRole('heading', { name: 'Sea level' })
    const toggle = page.getByRole('radiogroup', { name: 'Map colours' })
    const [t, g] = [(await title.boundingBox())!, (await toggle.boundingBox())!]
    expect(Math.abs(t.y + t.height / 2 - (g.y + g.height / 2))).toBeLessThan(4)
  })

  test('Single shows the total underwater, Layered only what the level adds (v0.36)', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const left = seaLevel(page)
    const slider = page.getByRole('slider')
    // +2 ft: 0.99 km² in all, of which +2 ft adds 0.95 km² (the rest came at +1 ft).
    await expect(left).toContainText('Total submerged area0.99km²5% of the city’s land')
    await page.getByRole('radio', { name: 'Layered' }).click()
    await expect(left).toContainText('Additional submerged area0.95km²5% of the city’s land')
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(left).toContainText('Additional submerged area6.44km²32% of the city’s land')
    await page.getByRole('radio', { name: 'Single' }).click()
    await expect(left).toContainText('Total submerged area7.43km²37% of the city’s land')
    await page.getByRole('radio', { name: 'Layered' }).click()
    await slider.focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowRight')
    await expect(left).toContainText('Additional submerged area0.038km²0.2% of the city’s land')
  })

  test('area unit switches the figures to acres and is remembered', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const left = seaLevel(page)
    await left.getByRole('radio', { name: 'Acres' }).click()
    await expect(left).toContainText('244acres')
    await page.getByRole('radio', { name: 'Layered' }).click()
    await expect(left).toContainText('235acres')
    // The low-spot area sits under its switch, only while that layer is on (v0.36).
    await expect(left.getByText('232 acres at +2 ft')).toHaveCount(0)
    await page.getByRole('switch', { name: /Low spots/ }).click()
    await expect(page.getByRole('switch', { name: /Low spots/ })).toHaveAccessibleDescription(/232 acres at \+2 ft/)
    await page.reload()
    await waitForMap(page)
    await expect(seaLevel(page).getByRole('radio', { name: 'Acres' })).toHaveAttribute('aria-checked', 'true')
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
    // Insights holds only the selection (v0.36).
    await expect(insights(page).getByRole('region', { name: 'Land underwater' })).toHaveCount(0)
    await expect(insights(page)).not.toContainText('of the city’s land')
    const fit = await insights(page)
      .locator('.overflow-y-auto')
      .evaluate((el) => ({ content: el.scrollHeight, visible: el.clientHeight }))
    expect(fit.content).toBeLessThanOrEqual(fit.visible)
  })

  test('in-map controls: 2D/3D keeps the level, "Entire Miami Beach" restores the 3D city view', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    expect(await mapPitch(page)).toBe(40)
    await page.getByRole('button', { name: '2D view' }).click()
    await expect.poll(() => mapPitch(page)).toBe(0)
    await expect(page.getByRole('button', { name: '2D view' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '+2 ft above MHHW')
    await page.getByRole('button', { name: 'Entire Miami Beach' }).click()
    await expect.poll(() => mapPitch(page)).toBe(40)
    await expect(page.getByRole('button', { name: '3D view' })).toHaveAttribute('aria-pressed', 'true')
    // The view reset lives only in the map — no duplicate in the header or panels.
    await expect(page.getByRole('banner').getByRole('button', { name: /reset|show all/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Entire Miami Beach' })).toHaveCount(1)
  })

  test('the map controls sit in one column at the bottom right; the dial turns and tilts in 3D (v0.35)', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const map = (await page.locator('#map-region').boundingBox())!
    const zoomIn = (await page.getByRole('button', { name: 'Zoom in' }).boundingBox())!
    for (const name of ['2D view', '3D view', 'Entire Miami Beach', 'Tilt up', 'Rotate left', 'Point north', 'Rotate right', 'Tilt down', 'Zoom in', 'Zoom out']) {
      const b = (await page.getByRole('button', { name }).boundingBox())!
      expect(b.y).toBeGreaterThan(map.y + map.height / 2)
      expect(Math.abs(b.x + b.width / 2 - (zoomIn.x + zoomIn.width / 2))).toBeLessThanOrEqual(25)
    }
    // 2D sits over 3D (v0.36), and zoom stays clear of the scale bar.
    const [d2, d3] = [(await page.getByRole('button', { name: '2D view' }).boundingBox())!, (await page.getByRole('button', { name: '3D view' }).boundingBox())!]
    expect(d2.x).toBe(d3.x)
    expect(d3.y).toBeGreaterThan(d2.y)
    const zoomOut = (await page.getByRole('button', { name: 'Zoom out' }).boundingBox())!
    const scale = (await page.locator('.maplibregl-ctrl-scale').boundingBox())!
    expect(zoomOut.y + zoomOut.height).toBeLessThanOrEqual(scale.y - 8)
    const bearing = async () => Number(await page.locator('[data-bearing]').getAttribute('data-bearing'))
    expect(await bearing()).toBe(-15)
    await page.getByRole('button', { name: 'Rotate left' }).click()
    await expect.poll(bearing).toBe(15)
    await page.getByRole('button', { name: 'Rotate right' }).click()
    await expect.poll(bearing).toBe(-15)
    await page.getByRole('button', { name: 'Tilt up' }).click()
    await expect.poll(() => mapPitch(page)).toBe(50)
    await page.getByRole('button', { name: 'Tilt down' }).click()
    await expect.poll(() => mapPitch(page)).toBe(40)
    await page.getByRole('button', { name: '2D view' }).click()
    await expect(page.getByRole('group', { name: 'Compass, turn and tilt' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Rotate left' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Point north' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible()
  })

  test('colour modes: Single by default, Layered gives each foot its own colour, and the choice is remembered', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const modes = page.getByRole('radiogroup', { name: 'Map colours' })
    await expect(modes.getByRole('radio', { name: 'Single' })).toHaveAttribute('aria-checked', 'true')
    // The slider track wears the map's colours: at +2 ft, one blue for both feet, or one each.
    const trackColours = () =>
      page.locator('#control-panel [style*="linear-gradient"]').evaluate((el) => [
        ...new Set((el as HTMLElement).style.background.match(/rgb\([^)]+\)/g)!.filter((c) => c !== 'rgb(217, 217, 217)')),
      ])
    expect(await trackColours()).toEqual(['rgb(61, 132, 230)'])
    // One colour needs no key (v0.35).
    await expect(page.getByRole('region', { name: 'Map legend' })).toHaveCount(0)

    await modes.getByRole('radio', { name: 'Layered' }).click()
    await expect.poll(trackColours).toEqual(['rgb(166, 216, 237)', 'rgb(109, 182, 219)'])
    await expect(page.getByRole('region', { name: 'Map legend' })).toContainText('Water first reaches')
    await page.reload()
    await waitForMap(page)
    await expect(page.getByRole('radio', { name: 'Layered' })).toHaveAttribute('aria-checked', 'true')
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

  test('layer toggles respond, and the legend follows the flooding layer', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.getByRole('radio', { name: 'Layered' }).click()
    const low = page.getByRole('switch', { name: 'Low spots' })
    const req = page.waitForRequest(/low_2ft\.geojson/)
    await low.click()
    await req
    await expect(low).toHaveAttribute('aria-checked', 'true')
    // The legend keys only the sea-level colours, never low spots (v0.35).
    const legend = page.getByRole('region', { name: 'Map legend' })
    await expect(legend.getByRole('listitem')).toHaveCount(6)
    await expect(legend).not.toContainText('Low spot')
    // City limits can be hidden (and shown again).
    const limits = page.getByRole('switch', { name: 'City limits' })
    await expect(limits).toHaveAttribute('aria-checked', 'true')
    await limits.click()
    await expect(limits).toHaveAttribute('aria-checked', 'false')
    await limits.click()
    await expect(limits).toHaveAttribute('aria-checked', 'true')
    // The scale shows only the sea-level colours (v0.34), so it goes with the flooding layer.
    await page.getByRole('switch', { name: /Flooding/ }).click()
    await expect(legend).toHaveCount(0)
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

    // Drag the divider 120 px to the left: the panel grows by 120 px.
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
    await expect(seaLevel(page)).not.toContainText('submerged')
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
