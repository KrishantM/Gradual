import { defineConfig } from '@playwright/test';

const bypassToken = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    ...(bypassToken ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassToken } } : {}),
  },
  timeout: 60_000,
  retries: 0,
  reporter: 'list',
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
