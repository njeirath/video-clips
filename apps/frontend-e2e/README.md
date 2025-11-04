# Frontend E2E Tests

This directory contains end-to-end (E2E) tests for the video-clips frontend application using [Playwright](https://playwright.dev/).

## Overview

The E2E test suite validates critical user journeys and functionality:

1. **Home Page Display** - Verifies the home page loads correctly with all UI elements
2. **Search Functionality** - Tests the search feature with debouncing
3. **Filter Functionality** - Tests filtering by shows and characters
4. **Combined Filters** - Tests using multiple filters together
5. **Search and Filters** - Tests the interaction between search and filters
6. **Sort Functionality** - Tests sorting clips by different criteria

## Prerequisites

- Node.js v20 or higher
- npm v10 or higher
- All project dependencies installed (`npm install`)

## Installation

The E2E testing framework (Playwright) is already configured in this project. If you need to install Playwright browsers:

```bash
npx playwright install
```

Or install a specific browser:

```bash
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

## Running Tests

### Run all E2E tests

From the project root:

```bash
npx nx e2e frontend-e2e
```

Or using npm:

```bash
npm run e2e
```

### Run tests in headed mode (see browser)

```bash
npx nx e2e frontend-e2e --headed
```

### Run a specific test file

```bash
npx nx e2e frontend-e2e --grep "Home Page"
```

### Run tests in a specific browser

```bash
npx nx e2e frontend-e2e --project=chromium
npx nx e2e frontend-e2e --project=firefox
npx nx e2e frontend-e2e --project=webkit
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

### Debug tests

```bash
npx nx e2e frontend-e2e --debug
```

Or use the Playwright Inspector:

```bash
PWDEBUG=1 npx nx e2e frontend-e2e
```

## Test Structure

```
apps/frontend-e2e/
├── src/
│   ├── home-page.spec.ts           # Home page display tests
│   ├── search.spec.ts              # Search functionality tests
│   ├── filters.spec.ts             # Filter functionality tests
│   ├── search-and-filters.spec.ts  # Combined search and filters
│   └── sort.spec.ts                # Sort functionality tests
├── playwright.config.ts            # Playwright configuration
├── project.json                    # Nx project configuration
└── README.md                       # This file
```

## Configuration

### Playwright Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:4200` (configurable via `BASE_URL` env var)
- **Web Server**: Automatically starts the frontend dev server before tests
- **Browsers**: Chromium, Firefox, and WebKit (Safari)
- **Retries**: Enabled on CI
- **Trace**: Captured on first retry for debugging
- **Screenshots**: Taken on failure

### CI Configuration

For CI environments, set the `BASE_URL` environment variable to point to your deployed application:

```bash
BASE_URL=https://your-app.example.com npx nx e2e frontend-e2e
```

## Writing New Tests

When adding new E2E tests:

1. Create a new `.spec.ts` file in `src/`
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Organize tests using `test.describe()` blocks
4. Use `test.beforeEach()` for common setup
5. Write clear test descriptions
6. Use Playwright's auto-waiting features

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Your test code
    await expect(page.getByText('Hello')).toBeVisible();
  });
});
```

## Best Practices

1. **Use semantic locators** - Prefer `getByRole()`, `getByText()`, `getByLabel()` over CSS selectors
2. **Wait for network idle** - Use `waitForLoadState('networkidle')` after navigation
3. **Handle async operations** - Account for debouncing, loading states, etc.
4. **Write independent tests** - Each test should be able to run in isolation
5. **Use descriptive names** - Test descriptions should clearly explain what's being tested
6. **Avoid hard-coded waits** - Use Playwright's auto-waiting when possible

## Troubleshooting

### Tests failing locally

1. Ensure the frontend dev server is not already running on port 4200
2. Clear any cached data: `npx nx reset`
3. Reinstall dependencies: `npm ci`
4. Install/update Playwright browsers: `npx playwright install`

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check if the dev server is starting correctly
- Verify network requests are completing

### Debugging tips

1. Run with `--headed` to see the browser
2. Use `--debug` to step through tests
3. Add `await page.pause()` to pause execution
4. Check screenshots in `test-results/` directory after failures
5. Review trace files using `npx playwright show-trace <trace-file>`

## CI Integration

The E2E tests are integrated into the CI pipeline via GitHub Actions. See `.github/workflows/ci.yml` for the workflow configuration.

### Running in CI

Tests run automatically on:
- Pull requests
- Pushes to main branch

The CI configuration:
- Installs all dependencies
- Installs Playwright browsers
- Runs tests in headless mode
- Uploads test results and artifacts

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Nx Playwright Plugin](https://nx.dev/packages/playwright)
- [Writing Tests Guide](https://playwright.dev/docs/writing-tests)
