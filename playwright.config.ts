import { defineConfig, devices } from '@playwright/test'

// Run through scripts/e2e.sh (npm run e2e): it starts the API, the database and vite,
// and passes their addresses in E2E_API_URL / E2E_WEB_URL.
export default defineConfig({
  testDir: './e2e',
  // the tests share one database, so keep them in one worker - each makes its own owner anyway
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 },
  },
  // baselines are per OS - fonts render differently on Linux CI than on a Mac
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{platform}{ext}',
  use: {
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:3170',
    timezoneId: 'Europe/Prague',
    locale: 'en-GB',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
})
