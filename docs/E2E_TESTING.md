# End-to-End Testing Guide

This guide provides comprehensive information about the E2E testing setup for the video-clips application.

## Overview

The E2E test suite uses [Playwright](https://playwright.dev/) to test critical user journeys in the video-clips application. The tests run against the actual frontend and backend services with a real OpenSearch database seeded with sample data.

## Architecture

```
┌─────────────────┐
│  Playwright     │
│  Test Runner    │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
    ┌────▼────┐    ┌────▼────┐
    │Frontend │    │ Backend │
    │(React)  │◄───┤(GraphQL)│
    └─────────┘    └────┬────┘
                        │
                   ┌────▼────────┐
                   │ OpenSearch  │
                   │(Test Data)  │
                   └─────────────┘
```

## Test Coverage

### 1. Home Page Tests (`home-page.spec.ts`)
- Application branding and navigation
- Main content areas (sidebar, grid)
- Search bar presence
- Filter sections (Shows, Characters)
- Sort dropdown
- Authentication UI elements

### 2. Search Tests (`search.spec.ts`)
- Text input and clearing
- Debounced search (500ms delay)
- Results filtering based on search terms
- Loading states

### 3. Filter Tests (`filters.spec.ts`)
- Show filtering
  - "All Shows" option
  - Individual show selection
  - Show counts display
- Character filtering
  - "All Characters" option
  - Individual character selection
  - Character counts display
- Combined filters (show + character)

### 4. Search and Filters Tests (`search-and-filters.spec.ts`)
- Search + show filter
- Search + character filter
- All three combined (search + show + character)
- Filter preservation when search changes
- Search preservation when filters change

### 5. Sort Tests (`sort.spec.ts`)
- Sort by "Most Recent" (createdAt desc)
- Sort by "Name (A-Z)" (name asc)
- Sort persistence with filters
- Sort persistence with search

## Test Data

The seed script creates 12 video clips with diverse attributes:

### Shows and Distribution
- **The Office**: 6 clips
  - Diversity Day, Parkour, Michael Scott Paper Company, That's What She Said, Fire Drill, Diversity Day
- **Parks and Recreation**: 4 clips
  - Treat Yo Self, Ron Swanson Breakfast, Li'l Sebastian, Snake Juice
- **Brooklyn Nine-Nine**: 2 clips
  - Cool Cool Cool, Title of Your Sex Tape, Bone

### Characters
Multiple characters with overlapping appearances:
- Michael Scott (4 clips)
- Dwight Schrute (3 clips)
- Jim Halpert, Pam Beesly, Tom Haverford, Leslie Knope, Ron Swanson, Jake Peralta, Amy Santiago, and more

### Tags
Various tags for search testing: comedy, office, business, parks, shopping, parkour, physical, food, breakfast, catchphrase, chaos, fire, party, drunk, training, awkward, argument, etc.

### Date Range
Clips created between 2024-01-15 and 2024-01-26 to test sorting by date.

## Setup Instructions

### Prerequisites

1. **Docker Desktop** (or Docker Engine + Docker Compose)
   - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
   - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
   - Linux: [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)

2. **Node.js 20+** and **npm 10+**

3. **Project dependencies**: `npm install`

### Quick Setup

Run the automated setup script:

```bash
npm run e2e:setup
```

This performs all necessary steps automatically.

### Manual Setup

If you prefer step-by-step control:

```bash
# 1. Start OpenSearch
npm run opensearch:start

# 2. Wait for OpenSearch (check health)
curl http://localhost:9200/_cluster/health

# 3. Start backend once to create the index
npm run start:backend
# Wait for "Server started on http://localhost:3000/graphql"
# Then stop with Ctrl+C

# 4. Seed test data
npm run opensearch:seed

# 5. Verify data
curl http://localhost:9200/video-clips/_count
# Should return: {"count":12, ...}
```

## Running Tests

### All tests (headless)
```bash
npm run e2e
```

### Interactive UI mode
```bash
npm run e2e:ui
```

### Headed mode (see browser)
```bash
npx nx e2e frontend-e2e --headed
```

### Single browser
```bash
npx nx e2e frontend-e2e --project=chromium
npx nx e2e frontend-e2e --project=firefox
npx nx e2e frontend-e2e --project=webkit
```

### Debug mode
```bash
npx nx e2e frontend-e2e --debug
```

Or with Playwright Inspector:
```bash
PWDEBUG=1 npx nx e2e frontend-e2e
```

### Specific test file
```bash
npx nx e2e frontend-e2e --grep "Home Page"
```

## CI/CD Integration

The E2E tests run automatically in GitHub Actions on:
- Pull requests
- Pushes to main branch

### CI Workflow

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes an `e2e` job that:

1. Starts OpenSearch as a service container
2. Installs dependencies
3. Waits for OpenSearch to be healthy
4. Starts the backend to create the index
5. Seeds OpenSearch with test data
6. Installs Playwright browsers
7. Runs E2E tests (Chromium only in CI)
8. Uploads test results and screenshots

### Environment Variables

The CI job sets:
- `OPENSEARCH_HOST=localhost`
- `OPENSEARCH_PORT=9200`

For deployed environments, set `BASE_URL` to point to your deployed app:
```bash
BASE_URL=https://your-app.example.com npm run e2e
```

## Maintenance

### Updating Test Data

To modify the sample data:

1. Edit `apps/backend/scripts/seed-opensearch.ts`
2. Rebuild: `npx nx build backend`
3. Re-seed: `npm run opensearch:seed`

### Adding New Tests

1. Create a new `.spec.ts` file in `apps/frontend-e2e/src/`
2. Follow existing patterns (describe blocks, beforeEach, etc.)
3. Use semantic locators when possible
4. Run tests to verify: `npm run e2e`

### Cleaning Up

```bash
# Stop OpenSearch
npm run opensearch:stop

# Remove OpenSearch data volume
docker volume rm video-clips_opensearch-data

# Clear Playwright cache
npx playwright cache clear

# Reset Nx cache
npx nx reset
```

## Troubleshooting

### OpenSearch won't start

**Problem**: `docker-compose up` fails or OpenSearch is unhealthy

**Solutions**:
- Check if port 9200 is already in use: `lsof -i :9200` (macOS/Linux) or `netstat -ano | findstr :9200` (Windows)
- Increase Docker memory allocation (Docker Desktop → Settings → Resources)
- Check Docker logs: `docker-compose logs opensearch`
- Try restarting Docker Desktop

### Tests time out

**Problem**: Tests fail with timeout errors

**Solutions**:
- Ensure OpenSearch is running: `curl http://localhost:9200/_cluster/health`
- Verify test data: `curl http://localhost:9200/video-clips/_count` should return 12
- Check no servers are running on ports 3000 or 4200
- Increase timeout in `playwright.config.ts` if network is slow

### Tests fail on CI but pass locally

**Problem**: Different behavior in GitHub Actions

**Solutions**:
- Check CI logs for OpenSearch health status
- Verify the seeding step completed successfully
- Ensure environment variables are set correctly
- Test with headless mode locally: `npx nx e2e frontend-e2e`

### No video clips displayed

**Problem**: Tests run but find no clips

**Solutions**:
1. Verify OpenSearch is seeded:
   ```bash
   curl http://localhost:9200/video-clips/_search?size=1
   ```
2. Check backend logs for errors
3. Re-run seed script: `npm run opensearch:seed`
4. Restart everything and try setup again

### Playwright browser not found

**Problem**: `Error: browserType.launch: Executable doesn't exist`

**Solutions**:
```bash
npx playwright install chromium
# or install all browsers
npx playwright install
```

## Best Practices

### Test Independence
- Each test should be runnable in isolation
- Use `test.beforeEach()` for common setup
- Don't rely on test execution order

### Waiting Strategies
- Prefer Playwright's auto-waiting over `waitForTimeout()`
- Use `waitForLoadState('networkidle')` after navigation
- Account for debouncing (500ms for search)

### Selectors
1. **Prefer accessible selectors**:
   - `getByRole('button', { name: 'Login' })`
   - `getByLabel('Sort by')`
   - `getByText('All Shows')`

2. **Fallback to test IDs** when needed:
   - Add `data-testid` attributes
   - Use `getByTestId('clip-card')`

3. **Avoid brittle selectors**:
   - Don't use CSS classes that might change
   - Don't use complex XPath expressions

### Assertions
- Use meaningful error messages
- Check for visibility before interactions
- Verify both positive and negative cases

### Performance
- Run only Chromium in CI to save time
- Use parallelization for large test suites
- Cache node_modules and Nx builds

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Nx Playwright Plugin](https://nx.dev/packages/playwright)
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review test output and screenshots in `playwright-report/`
3. Check Playwright traces with `npx playwright show-trace <trace-file>`
4. Consult the repository's GitHub Issues
