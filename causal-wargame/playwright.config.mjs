import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests/visual',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL, colorScheme: 'dark', locale: 'es-CO' },
  webServer: {
    command: 'vite --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: { VITE_FUNCTIONS_BASE_URL: 'https://mock.dean.test/functions/v1' }
  },
  projects: [
    { name: 'report', use: { ...devices['Desktop Chrome'] } },
    { name: 'contract', use: { ...devices['Desktop Chrome'] } }
  ],
  globalTeardown: './tests/visual/teardown.mjs'
})
