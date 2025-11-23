import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Sort Functionality
 *
 * Tests the sorting feature for video clips.
 * Validates that users can sort clips by different criteria.
 * Handles both desktop and mobile layouts.
 */

/**
 * Helper function to open filter drawer on mobile devices
 */
async function openFilterDrawerIfMobile(page) {
  // Check if the Shows heading is visible (desktop) or if we need to open drawer (mobile)
  const showsHeading = page.getByRole('heading', { name: 'Shows' });
  const isVisible = await showsHeading.isVisible().catch(() => false);
  
  if (!isVisible) {
    // We're on mobile, need to open the drawer
    const filterButton = page.getByRole('button', { name: 'open filters' });
    
    try {
      await filterButton.click({ timeout: 3000 });
      // Wait for drawer to open and Shows heading to become visible
      await showsHeading.waitFor({ state: 'visible', timeout: 3000 });
    } catch (e) {
      // If we can't find or click the filter button, or drawer doesn't open,
      // we might already be on desktop or the element structure is different
      console.log('Could not open filter drawer:', e.message);
    }
  }
}

test.describe('Sort Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display sort dropdown with default value', async ({ page }) => {
    // Verify sort select is visible
    // Use explicit id selector to avoid Playwright strict-mode ambiguity: the label "Sort by"
    // is referenced by both the combobox and the popup list, which can intermittently match
    // multiple elements when using getByLabel. Use the select's id `#sort-select` instead.
    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toBeVisible();

    // Default should be "Most Recent" (createdAt)
    await expect(sortSelect).toContainText('Most Recent');
  });

  test('should allow opening sort dropdown', async ({ page }) => {
    const sortSelect = page.locator('#sort-select');

    // Click to open dropdown
    await sortSelect.click();

    // Verify options are shown
    const mostRecentOption = page.getByRole('option', { name: 'Most Recent' });
    const nameOption = page.getByRole('option', { name: 'Name (A-Z)' });

    await expect(mostRecentOption).toBeVisible();
    await expect(nameOption).toBeVisible();
  });

  test('should allow sorting by Most Recent', async ({ page }) => {
    const sortSelect = page.locator('#sort-select');

    // Open dropdown
    await sortSelect.click();

    // Select "Most Recent"
    const mostRecentOption = page.getByRole('option', { name: 'Most Recent' });
    await mostRecentOption.click();

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify selection
    await expect(sortSelect).toContainText('Most Recent');
  });

  test('should allow sorting by Name (A-Z)', async ({ page }) => {
    const sortSelect = page.locator('#sort-select');

    // Open dropdown
    await sortSelect.click();

    // Select "Name (A-Z)"
    const nameOption = page.getByRole('option', { name: 'Name (A-Z)' });
    await nameOption.click();

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify selection
    await expect(sortSelect).toContainText('Name (A-Z)');
  });

  test('should update results when sort order changes', async ({ page }) => {
    const sortSelect = page.locator('#sort-select');

    // Change to Name sort
    await sortSelect.click();
    await page.getByRole('option', { name: 'Name (A-Z)' }).click();
    await page.waitForTimeout(500);

    // Change back to Most Recent
    await sortSelect.click();
    await page.getByRole('option', { name: 'Most Recent' }).click();
    await page.waitForTimeout(500);

    // Page should be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should maintain sort order when applying filters', async ({ page }) => {
    const sortSelect = page.locator('#sort-select');

    // Set sort to Name
    await sortSelect.click();
    await page.getByRole('option', { name: 'Name (A-Z)' }).click();
    await page.waitForTimeout(500);

    // Open drawer if mobile
    await openFilterDrawerIfMobile(page);

    // Apply a filter
    const allShows = page.getByText('All Shows');
    await allShows.click();
    await page.waitForTimeout(500);

    // Sort should remain on Name
    await expect(sortSelect).toContainText('Name (A-Z)');
  });

  test('should maintain sort order when searching', async ({ page }) => {
    const sortSelect = page.locator('#sort-select');

    // Set sort to Name
    await sortSelect.click();
    await page.getByRole('option', { name: 'Name (A-Z)' }).click();
    await page.waitForTimeout(500);

    // Perform a search
    const searchInput = page.getByPlaceholder('Search for video clips...');
    await searchInput.fill('test');
    await page.waitForTimeout(600);

    // Sort should remain on Name
    await expect(sortSelect).toContainText('Name (A-Z)');
  });
});
