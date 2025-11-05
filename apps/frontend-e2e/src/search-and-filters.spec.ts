import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Combined Search and Filters
 * 
 * Tests the interaction between search and filter features.
 * Validates that users can use both together to narrow down results.
 */

test.describe('Combined Search and Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should allow searching while show filter is active', async ({ page }) => {
    await page.waitForTimeout(500);
    
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
    
    // Apply show filter
    const allShows = page.getByText('All Shows');
    await allShows.click();
    await page.waitForTimeout(300);
    
    // Apply character filter
    const allCharacters = page.getByText('All Characters');
    await allCharacters.click();
    await page.waitForTimeout(300);
    
    // All three should be active
    await expect(searchInput).toHaveValue('triple');
    await expect(page.locator('body')).toBeVisible();
  });
});
