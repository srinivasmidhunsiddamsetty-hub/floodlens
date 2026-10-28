/**
 * Captures reference screenshots into docs/screenshots/ for visual QA and the
 * portfolio case study. Run on demand: `npm run screenshots`.
 */
import { test } from '@playwright/test'
import { waitForMap } from './helpers'

const OUT = process.env.SCREENSHOT_DIR ?? 'docs/screenshots'

test.describe('screenshots', () => {
  test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture')

  test('desktop states', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/01-overview-2ft-3d.png` })

    // +3 ft with the +2 ft band spotlighted from the breakdown list
    await page.getByRole('slider').focus()
    await page.keyboard.press('End')
    await page.waitForTimeout(2500)
    await page.getByRole('button', { name: /\+2 ft adds/ }).hover()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/02-bands-3ft-spotlight-2ft.png` })
    await page.mouse.move(700, 120)

    // 2D + inspection of the map centre
    await page.getByRole('button', { name: '2D view' }).click()
    await page.waitForTimeout(2500)
    await page.locator('.maplibregl-canvas').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT}/03-2d-3ft-inspect.png` })

    await page.getByRole('button', { name: 'About the data', exact: true }).click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/04-about-data.png` })
  })

  test('mobile states', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await waitForMap(page)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/05-mobile-map.png` })
    await page.getByRole('button', { name: /Insights ·/ }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/06-mobile-insights.png` })
    await page.getByRole('button', { name: /Insights ·/ }).click()
    await page.getByRole('button', { name: 'Open sea level and layers' }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/07-mobile-controls.png` })
  })
})
