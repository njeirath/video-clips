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
- Docker and Docker Compose (for running OpenSearch locally)

**Note**: The E2E tests automatically start both the frontend and backend servers before running tests. You don't need to start them manually.

### OpenSearch Setup (Required for Full E2E Testing)

The E2E tests work best with OpenSearch running and seeded with sample data. This provides realistic test scenarios with actual data.

**Quick Setup:**

```bash
npm run e2e:setup
```

This script will:
1. Start OpenSearch in a Docker container
2. Start the backend to create the index
3. Seed OpenSearch with 12 sample video clips
4. Display verification instructions

**Manual Setup:**

If you prefer to set up OpenSearch manually:

```bash
# Start OpenSearch
npm run opensearch:start

# Wait for OpenSearch to be ready (check http://localhost:9200)

# Start backend once to create the index
npm run start:backend
# (Wait for it to start, then stop it with Ctrl+C)

# Seed the data
npm run opensearch:seed
```

**Verify Data:**

```bash
# Check if OpenSearch is running
curl http://localhost:9200/_cluster/health

# Count video clips
curl http://localhost:9200/video-clips/_count
```

You should see 12 video clips in the index.

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

## Sample Test Data

The seed script (`apps/backend/scripts/seed-opensearch.ts`) populates OpenSearch with 12 sample video clips:

- **Shows**: The Office (6 clips), Parks and Recreation (4 clips), Brooklyn Nine-Nine (2 clips)
- **Characters**: Michael Scott, Dwight Schrute, Jim Halpert, Pam Beesly, Tom Haverford, Leslie Knope, Ron Swanson, Jake Peralta, Amy Santiago, and more
- **Tags**: Various tags for testing search functionality
- **Date Range**: Clips created between 2024-01-15 and 2024-01-26 for sorting tests

This data ensures comprehensive testing of:
- Show filtering (3 different shows)
- Character filtering (multiple characters, some appearing in multiple clips)
- Search functionality (names, descriptions, scripts)
- Sorting by date and name
- Combined filters and search

## Configuration

### Playwright Configuration

The Playwright configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: `http://localhost:4200` (configurable via `BASE_URL` env var)
- **Web Servers**: Automatically starts both backend (`http://localhost:3020/graphql`) and frontend (`http://localhost:4200`) dev servers before tests
- **Browsers**: Chromium, Firefox, and WebKit (Safari)
- **Retries**: Enabled on CI
- **Trace**: Captured on first retry for debugging
- **Screenshots**: Taken on failure

The E2E tests run against the actual GraphQL backend, ensuring full integration testing.

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

1. Ensure OpenSearch is running and seeded with data: `npm run e2e:setup`
2. Ensure the frontend dev server is not already running on port 4200
3. Ensure the backend dev server is not already running on port 3020
4. Clear any cached data: `npx nx reset`
5. Reinstall dependencies: `npm ci`
6. Install/update Playwright browsers: `npx playwright install`

### OpenSearch not starting

1. Ensure Docker is running: `docker ps`
2. Check Docker Compose logs: `docker-compose logs opensearch`
3. Try restarting: `npm run opensearch:stop && npm run opensearch:start`
4. If port 9200 is in use, stop other services or modify `docker-compose.yml`

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
