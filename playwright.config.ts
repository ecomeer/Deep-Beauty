import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'fs'

// Some dev environments ship a system Chromium instead of the exact build
// this Playwright version pins (CI installs the pinned one itself).
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium'

// E2E smoke tests run against a deployed environment (typically the Vercel
// preview URL of a PR) — set E2E_BASE_URL. They are read-only: no orders are
// placed and no payments initiated. Unit tests (vitest) never run this suite;
// see .github/workflows/e2e.yml for the CI wiring.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL,
    trace: 'retain-on-failure',
    // Vercel "Protection Bypass for Automation" secret, for previews behind
    // deployment protection. Set VERCEL_AUTOMATION_BYPASS_SECRET in CI.
    ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          extraHTTPHeaders: {
            'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          },
        }
      : {}),
    ...(!process.env.CI && existsSync(LOCAL_CHROMIUM)
      ? {
          launchOptions: { executablePath: LOCAL_CHROMIUM },
          // Sandboxed dev environments route HTTPS through a local
          // TLS-intercepting proxy; the browser must use it and accept its CA.
          // CI never takes this branch.
          ...(process.env.HTTPS_PROXY
            ? {
                proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' },
                ignoreHTTPSErrors: true,
              }
            : {}),
        }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
