import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: process.env.CARETRUCE_TEST_URL || 'http://localhost:5173',
    viewport: { width: 390, height: 844 },
    launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] },
  },
  workers: 1,
})
