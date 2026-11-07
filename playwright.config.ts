import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3200',
    trace: 'off',
    video: process.env.E2E_VIDEO === '1' ? 'on' : 'off',
    viewport: { width: 1440, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'MOCK_CLAUDE=1 NEXT_DIST_DIR=.next-e2e npx next dev -p 3200',
    url: 'http://localhost:3200',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
