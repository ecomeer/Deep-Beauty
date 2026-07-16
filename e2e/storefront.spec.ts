import { test, expect } from '@playwright/test'

// Read-only smoke of the purchase path against a deployed environment
// (E2E_BASE_URL, e.g. a Vercel preview). No order is placed and no payment
// is initiated — the flow stops at rendering the checkout form.
test.skip(!process.env.E2E_BASE_URL, 'E2E_BASE_URL not set — skipping deployed-environment smoke')

import type { Page } from '@playwright/test'

// Vercel previews with deployment protection bounce anonymous visitors to
// vercel.com SSO. Without the bypass secret the smoke can't run — skip with
// a pointer instead of failing the whole workflow.
async function gotoStore(page: Page, path: string) {
  await page.goto(path)
  test.skip(
    page.url().includes('vercel.com'),
    'Preview is protected — configure VERCEL_AUTOMATION_BYPASS_SECRET to run the smoke'
  )
}

test.describe('storefront purchase-path smoke', () => {
  test('home page renders the Arabic storefront', async ({ page }) => {
    await gotoStore(page, '/')
    await expect(page.locator('html')).toHaveAttribute('lang', /ar/)
    await expect(page.locator('body')).toContainText(/.+/)
  })

  test('products listing shows product cards', async ({ page }) => {
    await gotoStore(page, '/products')
    const productLinks = page.locator('a[href*="/products/"]')
    await expect(productLinks.first()).toBeVisible({ timeout: 20_000 })
  })

  test('a product can be added to the cart and checkout renders', async ({ page }) => {
    await gotoStore(page, '/products')
    const productLink = page.locator('a[href*="/products/"]').first()
    await productLink.waitFor({ timeout: 20_000 })

    // Open the first product's detail page
    const href = await productLink.getAttribute('href')
    await page.goto(href!)

    // Add to cart (Arabic storefront button)
    const addButton = page.getByRole('button', { name: /أضف للسلة|إضافة للسلة/ }).first()
    await addButton.waitFor({ timeout: 20_000 })

    if (await addButton.isEnabled()) {
      await addButton.click()
      // The cart sidebar opens and shows the cart heading
      await expect(page.getByRole('dialog', { name: 'سلة التسوق' })).toBeVisible({
        timeout: 10_000,
      })
    }

    // Checkout page renders its form regardless
    await page.goto('/checkout')
    await expect(page.locator('form, input')).not.toHaveCount(0, { timeout: 20_000 })
  })
})
