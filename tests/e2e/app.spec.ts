import { expect, test, type Page } from '@playwright/test'
import { insights, mapPitch, mapZoom, trackErrors, waitForMap } from './helpers'

/** The left panel: sea level, its figures and the layer switches. */
const seaLevel = (page: Page) => page.getByRole('complementary', { name: 'Sea level and layers' })
/** The two figure boxes beside the slider: label, area, the km² / acres switch ("km²acres"), then the share. */
const figure = (page: Page) => seaLevel(page).locator('[aria-live="polite"]')

test.describe('FloodLens — core flows', () => {
  test('loads the City of Miami Beach with real NOAA data and no runtime errors', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'FloodLens', level: 1 })).toBeVisible()
    await expect(page.getByText('City of Miami Beach, Florida')).toBeVisible()
    await waitForMap(page)

    // The land underwater sits beside the slider (v0.36), not in Insights.
    await expect(figure(page)).toHaveText('Total area covered0.99km²acresShare of city land5%')
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
    await expect(figure(page)).toContainText('7.43')
    // The legend is a plain vertical scale, shown with Per foot colours (v0.35): every level listed,
    // the chosen one marked, nothing a button.
    await page.getByRole('radio', { name: 'Per foot' }).click()
    await slider.focus()
    const legendBox = page.getByRole('region', { name: 'Map legend' })
    await expect(legendBox.getByRole('listitem')).toHaveCount(6)
    await expect(legendBox.getByRole('listitem').filter({ hasText: '+3 ft' })).toContainText('(chosen level)')
    await expect(legendBox.getByText('(chosen level)')).toHaveCount(1)
    await expect(legendBox.getByRole('button')).toHaveCount(0)

    await page.keyboard.press('Home')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Current MHHW (0 ft)')
    // Never a blank at today's high tide (v0.38).
    await expect(figure(page)).toHaveText('New area covered0km²acresShare of city land0%')
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

  test('Overall shows all the area covered, Per foot only what the level adds (v0.36, v0.38)', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const fig = figure(page)
    const slider = page.getByRole('slider')
    // +2 ft: 0.99 km² in all, of which +2 ft adds 0.95 km² (the rest came at +1 ft).
    await expect(fig).toHaveText('Total area covered0.99km²acresShare of city land5%')
    await page.getByRole('radio', { name: 'Per foot' }).click()
    await expect(fig).toHaveText('New area covered0.95km²acresShare of city land5%')
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(fig).toHaveText('New area covered6.44km²acresShare of city land32%')
    await page.getByRole('radio', { name: 'Overall' }).click()
    await expect(fig).toHaveText('Total area covered7.43km²acresShare of city land37%')
    await slider.focus()
    await page.keyboard.press('Home')
    await expect(fig).toHaveText('Total area covered0km²acresShare of city land0%')
    // Today's level is "0 ft" on the slider (v0.40; "Today" before).
    await expect(seaLevel(page).getByRole('button', { name: '0 ft', exact: true, includeHidden: true })).toHaveClass(/font-bold/)
    await page.getByRole('radio', { name: 'Per foot' }).click()
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(fig).toHaveText('New area covered0.038km²acresShare of city land0.2%')
    // Every level is a chip you can click (v0.38).
    // The chips are hidden from screen readers (the slider is their route), hence includeHidden.
    await seaLevel(page).getByRole('button', { name: '+4 ft', exact: true, includeHidden: true }).click()
    await expect(slider).toHaveAttribute('aria-valuetext', '+4 ft above MHHW')
  })

  test('the area switches between km² and acres beside the number, and is remembered (v0.39)', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const left = seaLevel(page)
    const unit = left.getByRole('radiogroup', { name: 'Area unit' })
    await expect(unit.getByRole('radio', { name: 'Square kilometres' })).toHaveAttribute('aria-checked', 'true')
    await unit.getByRole('radio', { name: 'Acres' }).click()
    await expect(figure(page)).toHaveText('Total area covered244km²acresShare of city land5%')
    await page.getByRole('radio', { name: 'Per foot' }).click()
    await expect(figure(page)).toHaveText('New area covered235km²acresShare of city land5%')
    // The low-spot line follows the unit.
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
    // The map controls are one toolbar below the card, always one column (v0.47). On short
    // windows the turn and tilt arrows fold into one button that opens them beside it.
    const card = insights(page).locator('section').first()
    const toolbar = page.getByRole('toolbar', { name: 'Map controls' })
    for (const height of [900, 760, 650]) {
      await page.setViewportSize({ width: 1440, height })
      await expect(page.getByRole('button', { name: 'Turn and tilt' })).toHaveCount(height === 900 ? 0 : 1)
      const [c, t] = [(await card.boundingBox())!, (await toolbar.boundingBox())!]
      expect(t.y).toBeGreaterThan(c.y + c.height + 8)
      expect(t.width).toBeLessThan(40)
    }
    // The fold-out opens the four arrows; Escape closes it without closing the place card.
    await page.setViewportSize({ width: 1440, height: 760 })
    await expect(page.getByRole('button', { name: 'Rotate left' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Turn and tilt' }).click()
    await expect(page.getByRole('button', { name: 'Turn and tilt' })).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('button', { name: 'Rotate left' }).click()
    await expect(page.getByRole('button', { name: 'Tilt up' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Rotate left' })).toHaveCount(0)
    await expect(card).toBeVisible()
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
    // A folded map (v0.42; frame corners in v0.40–v0.41, a house in v0.34–v0.39).
    await expect(page.getByRole('button', { name: 'Entire Miami Beach' }).locator('svg')).toHaveClass(/(^|\s)lucide-map(\s|$)/)
  })

  test('the map controls sit in one column in the bottom-right corner; turn and tilt only in 3D (v0.37)', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const map = (await page.locator('#map-region').boundingBox())!
    const zoomIn = (await page.getByRole('button', { name: 'Zoom in' }).boundingBox())!
    for (const name of ['2D view', '3D view', 'Entire Miami Beach', 'Tilt up', 'Rotate left', 'Point north', 'Rotate right', 'Tilt down', 'Zoom in', 'Zoom out']) {
      const b = (await page.getByRole('button', { name }).boundingBox())!
      expect(b.y).toBeGreaterThan(map.y + map.height / 2)
      expect(Math.abs(b.x + b.width / 2 - (zoomIn.x + zoomIn.width / 2))).toBeLessThanOrEqual(25)
    }
    // 2D sits over 3D (v0.36). The column sits in the map's bottom-right corner, with the scale bar
    // and credit to its left (v0.37).
    const [d2, d3] = [(await page.getByRole('button', { name: '2D view' }).boundingBox())!, (await page.getByRole('button', { name: '3D view' }).boundingBox())!]
    expect(d2.x).toBe(d3.x)
    expect(d3.y).toBeGreaterThan(d2.y)
    const zoomOut = (await page.getByRole('button', { name: 'Zoom out' }).boundingBox())!
    // At the screen's right edge, under the Insights card (v0.38).
    const toolbarBox = (await page.getByRole('toolbar', { name: 'Map controls' }).boundingBox())!
    expect(Math.round(map.x + map.width - (toolbarBox.x + toolbarBox.width))).toBe(16)
    expect(Math.round(map.y + map.height - (toolbarBox.y + toolbarBox.height))).toBe(16)
    for (const ctrl of ['.maplibregl-ctrl-scale', '.maplibregl-ctrl-attrib']) {
      const b = (await page.locator(ctrl).boundingBox())!
      expect(b.x + b.width).toBeLessThanOrEqual(zoomOut.x - 8)
    }
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
    await expect(page.getByRole('group', { name: 'Turn' })).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'Tilt' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Rotate left' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Point north' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible()
  })

  test('colour modes: Overall by default, Per foot gives each foot its own colour, and the choice is remembered', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const modes = page.getByRole('radiogroup', { name: 'Map colours' })
    await expect(modes.getByRole('radio', { name: 'Overall' })).toHaveAttribute('aria-checked', 'true')
    // The slider track wears the map's colours: at +2 ft, one blue for both feet, or one each.
    const trackColours = () =>
      page.locator('#control-panel [style*="linear-gradient"]').evaluate((el) => [
        ...new Set((el as HTMLElement).style.background.match(/rgb\([^)]+\)/g)!.filter((c) => c !== 'rgb(217, 217, 217)')),
      ])
    expect(await trackColours()).toEqual(['rgb(61, 132, 230)'])
    // One colour needs no key (v0.35).
    await expect(page.getByRole('region', { name: 'Map legend' })).toHaveCount(0)

    await modes.getByRole('radio', { name: 'Per foot' }).click()
    // Plasma (v0.41): +1 ft orange and +2 ft coral.
    await expect.poll(trackColours).toEqual(['rgb(252, 166, 54)', 'rgb(225, 100, 98)'])
    await expect(page.getByRole('region', { name: 'Map legend' })).toContainText('Water first reaches')
    await page.reload()
    await waitForMap(page)
    await expect(page.getByRole('radio', { name: 'Per foot' })).toHaveAttribute('aria-checked', 'true')
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
    await page.getByRole('radio', { name: 'Per foot' }).click()
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

  test('the sea-level figures stay full size on laptop windows, and never shrink below 24 px (v0.44)', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    const sizes = () => figure(page).locator('p.tabular').evaluateAll((els) => els.map((e) => getComputedStyle(e).fontSize))
    // v0.43 shrank them to 20 px on ordinary laptop windows (751–770 px tall): keep them at full
    // size, 30 px since v0.45.
    for (const height of [900, 800, 760, 730]) {
      await page.setViewportSize({ width: 1440, height })
      await expect.poll(sizes).toEqual(['30px', '30px'])
    }
    // Only on short windows do they compact, and only to 24 px; the panel still fits.
    await page.setViewportSize({ width: 1440, height: 650 })
    await expect.poll(sizes).toEqual(['24px', '24px'])
    expect(await page.locator('#control-panel > div').evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true)
  })

  test('Insights has a fixed width, with no resize handle or close tab (v0.37; 360 px in v0.38)', async ({ page }) => {
    // A width saved by an older version is ignored.
    await page.addInitScript(() => localStorage.setItem('floodlens.insightsWidth', '500'))
    await page.goto('/')
    await waitForMap(page)
    expect(Math.round((await page.locator('aside#insight-panel').boundingBox())!.width)).toBe(360)
    await expect(page.getByRole('separator', { name: /Resize insights/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /insights/i })).toHaveCount(0)
    // The left panel still collapses.
    await expect(page.getByRole('button', { name: 'Collapse sea level and layers' })).toBeVisible()
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
    await expect(seaLevel(page)).not.toContainText('area covered')
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
