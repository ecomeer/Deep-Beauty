import { test, expect } from '@playwright/test'

// Smoke suite: guards the storefront's critical surfaces against regressions.
// All assertions hold with an empty database (no seeded products required).

test.describe('الصفحة الرئيسية', () => {
  test('تُحمَّل بعنوان الموقع واتجاه RTL', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('h1').first()).toContainText('ديب بيوتي')
  })

  test('شريط التنقل يعرض الروابط الأساسية', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'التنقل الرئيسي' })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('button', { name: 'سلة التسوق' })).toBeVisible()
    await expect(nav.getByRole('button', { name: 'البحث' })).toBeVisible()
  })
})

test.describe('سلة التسوق', () => {
  test('تفتح فارغة وتُغلق', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'سلة التسوق' }).click()
    await expect(page.getByText('سلة التسوق فارغة').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('صفحة المنتجات', () => {
  test('تعرض الترويسة وحقل البحث', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: 'المتجر' }).first()).toBeVisible()
    await expect(page.getByLabel('البحث في المنتجات')).toBeVisible()
  })

  test('البحث عبر الرابط لا يكسر الصفحة', async ({ page }) => {
    await page.goto('/products?search=سيروم')
    await expect(page.getByRole('heading', { name: 'المتجر' }).first()).toBeVisible()
  })
})

test.describe('الحساب والدخول', () => {
  test('صفحة الدخول تعرض نموذجاً مكتملاً', async ({ page }) => {
    await page.goto('/login')
    const email = page.locator('#main-content input[type="email"]').first()
    await expect(email).toBeVisible()
    await expect(page.locator('#main-content input[type="password"]').first()).toBeVisible()
    await expect(email).toHaveAttribute('autocomplete', 'email')
  })
})

test.describe('صفحات المحتوى', () => {
  for (const [path, name] of [
    ['/contact', 'تواصل'],
    ['/faq', 'الأسئلة'],
    ['/shipping', 'الشحن'],
  ] as const) {
    test(`${path} تُحمَّل بدون خطأ`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBeLessThan(400)
      await expect(page.locator('footer')).toBeAttached()
    })
  }
})

test.describe('إمكانية الوصول الأساسية', () => {
  test('رابط تخطي المحتوى موجود', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('تخطي إلى المحتوى الرئيسي').first()).toBeAttached()
  })

  test('لا تمرير أفقي على الجوال', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
