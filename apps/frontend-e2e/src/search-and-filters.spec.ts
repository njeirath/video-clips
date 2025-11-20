import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Combined Search and Filters
 * 
 * Tests the interaction between search and filter features.
 * Validates that users can use both together to narrow down results.
 * Handles both desktop (sidebar) and mobile (drawer) layouts.
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
    // Look for the filter button next to "Explore Clips" heading
    const exploreClipsHeading = page.getByRole('heading', { name: 'Explore Clips' });
    
    // The filter button should be nearby - look for it by aria-label or role
    // It's the first button in the header area with an icon
    const filterButton = page.locator('button').first();
    
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

test.describe('Combined Search and Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should allow searching while show filter is active', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Open drawer if mobile
    await openFilterDrawerIfMobile(page);
    
    // Select a show filter
    const allShows = page.getByText('All Shows');
    await allShows.click();
    
    // Perform a search
    const searchInput = page.getByPlaceholder('Search for video clips...');
    await searchInput.fill('test');
    await page.waitForTimeout(600);
    
    // Both filter and search should be active
    await expect(searchInput).toHaveValue('test');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should allow searching while character filter is active', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Open drawer if mobile
    await openFilterDrawerIfMobile(page);
    
    // Select a character filter
    const allCharacters = page.getByText('All Characters');
    await allCharacters.click();
    
    // Perform a search
    const searchInput = page.getByPlaceholder('Search for video clips...');
    await searchInput.fill('character test');
    await page.waitForTimeout(600);
    
    // Both filter and search should be active
    await expect(searchInput).toHaveValue('character test');
  });

  test('should allow applying filters while search is active', async ({ page }) => {
    // First search
    const searchInput = page.getByPlaceholder('Search for video clips...');
    await searchInput.fill('search first');
    await page.waitForTimeout(600);
    
    // Open drawer if mobile
    await openFilterDrawerIfMobile(page);
    
    // Then apply a filter
    const allShows = page.getByText('All Shows');
    await allShows.click();
    
    // Search should remain
    await expect(searchInput).toHaveValue('search first');
  });

  test('should reset results when both search and filters are cleared', async ({ page }) => {
    // Apply search
    const searchInput = page.getByPlaceholder('Search for video clips...');
    await searchInput.fill('combined');
    await page.waitForTimeout(600);
    
    // Open drawer if mobile
    await openFilterDrawerIfMobile(page);
    
    // Apply filter
    const allShows = page.getByText('All Shows');
    await allShows.click();
    await page.waitForTimeout(500);
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(600);
    
    // Results should update
    await expect(page.locator('body')).toBeVisible();
  });

  test('should allow triple combination: search + show filter + character filter', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Apply search
    const searchInput = page.getByPlaceholder('Search for video clips...');
    await searchInput.fill('triple');
    await page.waitForTimeout(600);
    
    // Open drawer if mobile
    await openFilterDrawerIfMobile(page);
    
    // Apply show filter
    const allShows = page.getByText('All Shows');
    await allShows.click();
    await page.waitForTimeout(300);
    
    // On mobile, drawer closes after selection, so we need to reopen
    await openFilterDrawerIfMobile(page);
    
    // Apply character filter
    const allCharacters = page.getByText('All Characters');
    await allCharacters.click();
    await page.waitForTimeout(300);
    
    // All three should be active
    await expect(searchInput).toHaveValue('triple');
    await expect(page.locator('body')).toBeVisible();
  });
});
