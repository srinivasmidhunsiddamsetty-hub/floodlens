/**
 * Captures reference screenshots into docs/screenshots/ for visual QA and the
 * portfolio case study. Run on demand: `npm run screenshots`.
 */
import { test } from '@playwright/test'
import { waitForMap } from './helpers'

const OUT = 'docs/screenshots'

test.describe('screenshots', () => {
  test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture')

  test('desktop states', async ({ page }) => {
    await page.goto('/')
    await waitForMap(page)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/01-overview-2ft-3d.png` })

    await page.getByRole('switch', { name: 'Compare two scenarios' }).click()
    await page.getByRole('radio', { name: '0 ft' }).click()
    await page.getByRole('slider').focus()
    await page.keyboard.press('End')
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/02-compare-0-3ft.png` })

    await page.getByRole('switch', { name: 'Compare two scenarios' }).click()
    await page.getByRole('radio', { name: '2D top-down' }).click()
    await page.waitForTimeout(2500)
    await page.getByRole('button', { name: 'Inspect map center' }).first().click()
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
    await page.getByRole('button', { name: /Exposure insights ·/ }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/06-mobile-insights.png` })
    await page.getByRole('button', { name: /Exposure insights ·/ }).click()
    await page.getByRole('button', { name: 'Open scenario controls' }).click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/07-mobile-controls.png` })
  })
})
