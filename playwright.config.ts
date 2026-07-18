import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

// Sandboxed environments ship a system Chromium instead of Playwright's
// managed browsers — use it when present (or via PLAYWRIGHT_CHROMIUM_PATH).
const chromiumPath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const launchOptions = chromiumPath ? { executablePath: chromiumPath } : undefined

/**
 * E2E smoke tests for the storefront. Run with `npm run test:e2e`.
 * Starts the dev server automatically (reuses one if already running).
 * Tests are written to pass with an empty database — they assert layout
 * and navigation, not seeded product data.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    launchOptions,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
