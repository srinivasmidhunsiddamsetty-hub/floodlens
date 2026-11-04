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

    // Individual colours at the top level (+5 ft): what +5 ft adds, beside the slider
    await page.getByRole('radio', { name: 'Individual' }).click()
    await page.getByRole('slider').focus()
    await page.keyboard.press('End')
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/02-individual-5ft.png` })

    // 2D + inspection of the map centre
    await page.getByRole('button', { name: '2D view' }).click()
    await page.waitForTimeout(2500)
    await page.locator('.maplibregl-canvas').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT}/03-2d-5ft-inspect.png` })

    await page.getByRole('button', { name: 'About the data', exact: true }).click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${OUT}/04-about-data.png` })
    await page.keyboard.press('Escape')

    // South Beach in 3D at +2 ft in Total colours, with a building selected (Euclid Avenue at this viewport)
    await page.keyboard.press('Escape')
    await page.getByRole('radio', { name: 'Total' }).click()
    await page.getByRole('slider').focus()
    await page.keyboard.press('ArrowLeft', { delay: 50 })
    await page.keyboard.press('ArrowLeft', { delay: 50 })
    await page.keyboard.press('ArrowLeft', { delay: 50 })
    await page.getByRole('button', { name: '3D view' }).click()
    await page.getByRole('navigation', { name: 'Go to area' }).getByRole('button', { name: 'South Beach' }).click()
    await page.waitForTimeout(5000)
    await page.mouse.click(622, 470)
    await page.mouse.move(700, 120)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/08-south-beach-building-card.png` })

    // North Beach at +5 ft, a building none of the mapped levels reach (near Beachwalk at this viewport)
    await page.getByRole('slider').focus()
    await page.keyboard.press('End')
    await page.getByRole('navigation', { name: 'Go to area' }).getByRole('button', { name: 'North Beach' }).click()
    await page.waitForTimeout(5000)
    await page.mouse.click(868, 346)
    await page.mouse.move(700, 120)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/09-north-beach-not-reached.png` })

    // Today's high tide: the figures read 0, never a blank (v0.38)
    await page.keyboard.press('Escape')
    await page.getByRole('slider').focus()
    await page.keyboard.press('Home')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT}/10-today-zero.png` })
  })
})
