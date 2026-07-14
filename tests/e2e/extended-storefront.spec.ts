import { expect, test } from '@playwright/test'

async function openProducts(page: Parameters<typeof test>[0] extends never ? never : never) {
  return page
}

// This suite is intentionally read-only. It never submits a checkout, consumes a
// coupon, creates an account, or sends credentials to the authentication service.
test.describe('Deep Beauty extended safe QA', () => {
  test('product search shows an empty state and can be cleared', async ({ page }) => {
    const response = await page.goto('/products', { waitUntil: 'domcontentloaded' })
    expect(response?.status() ?? 500).toBeLessThan(500)

    const search = page.getByLabel('البحث في المنتجات')
    await expect(search).toBeVisible()

    const noMatchQuery = '__qa_no_match_20260714__'
    await search.fill(noMatchQuery)
    await expect(page.getByText(`لا نتائج لـ "${noMatchQuery}"`)).toBeVisible()
    await expect(page.getByText('جربي كلمة بحث مختلفة')).toBeVisible()

    await page.getByRole('button', { name: 'مسح البحث' }).click()
    await expect(search).toHaveValue('')
    await expect(page.locator('a[href^="/products/"]:has(h3)').first()).toBeVisible()
  })

  test('customer can open a real product details page from the catalogue', async ({ page }) => {
    const response = await page.goto('/products', { waitUntil: 'domcontentloaded' })
    expect(response?.status() ?? 500).toBeLessThan(500)

    const firstProductLink = page.locator('a[href^="/products/"]:has(h3)').first()
    await expect(firstProductLink).toBeVisible()
    const href = await firstProductLink.getAttribute('href')
    expect(href).toMatch(/^\/products\/[a-zA-Z0-9-]+/)

    await firstProductLink.locator('h3').click()
    await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?|$)`))
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('wishlist persists during navigation and can be cleared', async ({ page }) => {
    const response = await page.goto('/products', { waitUntil: 'domcontentloaded' })
    expect(response?.status() ?? 500).toBeLessThan(500)

    const addToWishlist = page.getByRole('button', { name: 'إضافة للمفضلة' }).first()
    await expect(addToWishlist).toBeVisible()
    await addToWishlist.click()
    await expect(page.getByText(/أُضيف للمفضلة/).first()).toBeVisible()

    await page.goto('/wishlist', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /المفضلة/ }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'مسح الكل' })).toBeVisible()

    await page.getByRole('button', { name: 'مسح الكل' }).click()
    await expect(page.getByRole('heading', { name: 'قائمة المفضلة فارغة' })).toBeVisible()
  })

  test('customer login form blocks an empty submission before any auth request', async ({ page }) => {
    let passwordGrantRequests = 0
    page.on('request', (request) => {
      if (/\/auth\/v1\/token/.test(request.url()) && request.method() === 'POST') {
        passwordGrantRequests += 1
      }
    })

    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' })
    expect(response?.status() ?? 500).toBeLessThan(500)

    const email = page.locator('input[type="email"]').first()
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click()

    await expect(email).toBeFocused()
    expect(await email.evaluate((element) => (element as HTMLInputElement).checkValidity())).toBe(false)
    expect(passwordGrantRequests).toBe(0)
    await expect(page).toHaveURL(/\/login(?:\?|$)/)
  })

  test('guest visiting the customer account is redirected to customer login', async ({ page }) => {
    const response = await page.goto('/account', { waitUntil: 'domcontentloaded' })
    expect(response?.status() ?? 500).toBeLessThan(500)

    await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'تسجيل الدخول' })).toBeVisible()
  })

  test('guest visiting the admin dashboard is redirected to the admin login', async ({ page }) => {
    const response = await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' })
    expect(response?.status() ?? 500).toBeLessThan(500)

    await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/)
    await expect(page.getByRole('heading', { name: 'Deep Beauty Admin' })).toBeVisible()
  })

  test('protected APIs reject guests and coupon validation rejects a missing code', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Run API contract checks once per workflow')

    const adminMe = await request.get('/api/admin/me')
    expect(adminMe.status()).toBe(401)
    await expect(adminMe.json()).resolves.toMatchObject({ error: 'Unauthorized' })

    const accountOrders = await request.get('/api/account/orders')
    expect(accountOrders.status()).toBe(401)
    await expect(accountOrders.json()).resolves.toMatchObject({ error: 'Unauthorized' })

    const missingCouponCode = await request.post('/api/coupons/validate', {
      data: { subtotal: 10 },
    })
    expect(missingCouponCode.status()).toBe(400)
    await expect(missingCouponCode.json()).resolves.toMatchObject({ error: 'كود مطلوب' })
  })
})
