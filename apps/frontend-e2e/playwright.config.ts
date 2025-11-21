import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  // Save Playwright test results and artifacts to a known folder
  // outputDir: 'playwright-report',
  reporter: process.env.CI
    ? [['dot'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [
        ['list'],
        ['html', { open: 'on-failure', outputFolder: 'playwright-report' }],
      ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  /* Run your local dev servers (both frontend and backend) before starting the tests */
  webServer: [
    {
      command: 'npx nx serve backend',
      url: 'http://localhost:3020/graphql',
      // In CI we want to reuse an existing server if it's already running (to avoid port conflicts
      // when the job starts/stops the backend during seeding). Locally we still start a dev server.
      reuseExistingServer: !!process.env.CI,
      cwd: workspaceRoot,
      timeout: 120000,
    },
    {
      command: 'npx nx serve frontend',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      cwd: workspaceRoot,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Uncomment for mobile browsers support
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Chrome landscape',
      use: { ...devices['Pixel 7 landscape'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'iPad Safari',
      use: { ...devices['iPad Pro 11'] },
    },

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
