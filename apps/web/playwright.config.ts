import { defineConfig, devices } from '@playwright/test';

const HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1';
const PORT = process.env.PLAYWRIGHT_PORT ?? '3100';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${PORT}`;
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? 'pnpm dev';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      HOSTNAME: HOST,
      PORT,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
