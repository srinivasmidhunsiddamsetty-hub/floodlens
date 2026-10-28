import { expect, test } from '@playwright/test'
import { trackErrors, waitForMap } from './helpers'

test.describe('FloodLens — small screens', () => {
  test('panels become a drawer and a bottom sheet with no horizontal overflow', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await waitForMap(page)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    // Map controls stay inside the map on phones too.
    await expect(page.getByRole('button', { name: 'Reset view' })).toBeVisible()

    // Drawer starts closed so the map is visible first.
    const open = page.getByRole('button', { name: 'Open sea level and layers' })
    await expect(open).toHaveAttribute('aria-expanded', 'false')
    await open.click()
    const slider = page.getByRole('slider', { name: /sea-level rise above today/i })
    await expect(slider).toBeVisible()
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(slider).toHaveAttribute('aria-valuetext', '+3 ft above MHHW')
    await page.getByRole('button', { name: 'Close sea level and layers' }).first().click()

    // Bottom sheet peeks with the headline number, expands on demand.
    const sheetToggle = page.getByRole('button', { name: /Insights · \+3 ft/ })
    await expect(sheetToggle).toContainText('2.36 km² flooded beyond today')
    await expect(sheetToggle).toHaveAttribute('aria-expanded', 'false')
    await sheetToggle.click()
    await expect(page.getByRole('region', { name: 'Headline' })).toContainText('Flooded beyond today’s high tide')
    expect(errors).toEqual([])
  })
})
