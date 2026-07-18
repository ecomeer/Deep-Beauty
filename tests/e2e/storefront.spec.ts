import { expect, Page, test } from '@playwright/test'

const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'https://www.deepbeautykw.com'
const configuredHost = new URL(configuredBaseUrl).hostname.replace(/^www\./, '')

function monitorApplication(page: Page) {
  const consoleErrors: string[] = []
  const serverErrors: string[] = []
  const unexpectedClientErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() !== 'error') return

    const text = message.text()
    const ignoredThirdPartyError = /(facebook|connect\.facebook|snapchat|sc-static|googletagmanager|google-analytics|doubleclick)/i.test(text)
    const genericExpectedGuest401 = /Failed to load resource: the server responded with a status of 401/i.test(text)

    if (!ignoredThirdPartyError && !genericExpectedGuest401) consoleErrors.push(text)
  })

  page.on('response', (response) => {
    const requestType = response.request().resourceType()
    if (!['document', 'xhr', 'fetch'].includes(requestType)) return

    const url = new URL(response.url())
    const responseHost = url.hostname.replace(/^www\./, '')
    if (responseHost !== configuredHost) return

    if (response.status() >= 500) {
      serverErrors.push(`${response.status()} ${url.pathname}`)
      return
    }

    const isExpectedGuestAuthResponse = response.status() === 401 && url.pathname === '/api/auth/me'
    if (response.status() >= 400 && !isExpectedGuestAuthResponse) {
      unexpectedClientErrors.push(`${response.status()} ${url.pathname}`)
    }
  })

  return {
    assertHealthy() {
      expect(consoleErrors, 'Relevant browser console errors').toEqual([])
      expect(serverErrors, 'Unexpected 5xx application responses').toEqual([])
      expect(unexpectedClientErrors, 'Unexpected same-origin 4xx responses').toEqual([])
    },
  }
}

async function openProductsAndAddFirstAvailableItem(page: Page) {
  const response = await page.goto('/products', { waitUntil: 'domcontentloaded' })
  expect(response?.status() ?? 500).toBeLessThan(500)

  const isMobile = (page.viewportSize()?.width ?? 1024) < 768
  const addButton = isMobile
    ? page.locator('button[aria-label^="إضافة"][aria-label$="للسلة"]:not([disabled])').first()
    : page.getByRole('button', { name: 'أضف للسلة', exact: true }).first()

  await expect(addButton, 'At least one in-stock product should be available').toBeVisible()
  await addButton.click()
  await expect(page.getByText(/أُضيف للسلة/).first()).toBeVisible()
}

test.describe('Deep Beauty storefront smoke tests', () => {
  test('homepage loads meaningful Arabic storefront content without app errors', async ({ page }) => {
    const health = monitorApplication(page)
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })

    expect(response?.status() ?? 500).toBeLessThan(500)
    await expect(page).toHaveTitle(/Deep Beauty|ديب بيوتي/i)

    const body = page.locator('body')
    await expect.poll(
      async () => (await body.innerText()).trim().length,
      { timeout: 30_000, message: 'Homepage should finish loading meaningful storefront content' }
    ).toBeGreaterThan(100)

    const bodyText = (await body.innerText()).trim()
    expect(bodyText).toMatch(/ديب بيوتي|Deep Beauty|تسوق|منتج/i)

    health.assertHealthy()
  })

  test('customer can add an item, increase quantity, and remove it from the cart', async ({ page }) => {
    const health = monitorApplication(page)
    await openProductsAndAddFirstAvailableItem(page)

    await page.goto('/cart', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'سلة التسوق' })).toBeVisible()

    const increaseButton = page.getByRole('button', { name: 'زيادة الكمية' }).first()
    const quantityContainer = increaseButton.locator('xpath=..')
    await expect(quantityContainer.locator('span')).toHaveText('1')

    await increaseButton.click()
    await expect(quantityContainer.locator('span')).toHaveText('2')

    await page.getByRole('button', { name: 'حذف المنتج' }).first().click()
    await expect(page.getByRole('heading', { name: 'سلتك فارغة' })).toBeVisible()

    health.assertHealthy()
  })

  test('checkout client validation blocks an incomplete order without calling checkout API', async ({ page }) => {
    const health = monitorApplication(page)
    await openProductsAndAddFirstAvailableItem(page)

    let checkoutRequestCount = 0
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/checkout') checkoutRequestCount += 1
    })

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'إتمام الطلب' })).toBeVisible()

    const submitButton = page.getByRole('button', { name: 'تأكيد الطلب' })
    await expect(submitButton).toBeDisabled()

    const termsCheckbox = page.locator('label').filter({ hasText: 'أوافق على' }).getByRole('checkbox')
    await termsCheckbox.check()
    await expect(submitButton).toBeEnabled()

    await submitButton.click()
    await expect(page.locator('#field-name')).toBeFocused()

    const nameIsInvalid = await page.locator('#field-name').evaluate((element) =>
      !(element as HTMLInputElement).checkValidity()
    )
    expect(nameIsInvalid).toBe(true)
    expect(checkoutRequestCount).toBe(0)
    await expect(page).toHaveURL(/\/checkout(?:\?|$)/)

    health.assertHealthy()
  })

  test('unknown storefront route returns a real 404 response', async ({ page }) => {
    const response = await page.goto('/__qa/not-a-real-page-20260714', {
      waitUntil: 'domcontentloaded',
    })

    expect(response?.status()).toBe(404)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/404|غير موجود|not found/i)
  })
})
