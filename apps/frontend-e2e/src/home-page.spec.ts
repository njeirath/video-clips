import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Home Page Video Clips Display
 * 
 * Tests the basic functionality of viewing video clips on the home page.
 * This is a critical user journey for the application.
 */

test.describe('Home Page - Video Clips Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the app title and branding', async ({ page }) => {
    // Verify the VideoClips branding is visible
    await expect(page.getByText('VideoClips')).toBeVisible();
    
    // Verify the app bar is present
    const appBar = page.locator('header');
    await expect(appBar).toBeVisible();
  });

  test('should display the Explore Clips heading', async ({ page }) => {
    // Verify main heading
    await expect(page.getByRole('heading', { name: 'Explore Clips' })).toBeVisible();
  });

  test('should display the search bar in header', async ({ page }) => {
    // Verify search input exists
    const searchInput = page.getByPlaceholder('Search for video clips...');
    await expect(searchInput).toBeVisible();
  });

  test('should display sidebar with Shows and Characters filters', async ({ page }) => {
    // Verify Shows heading
    await expect(page.getByRole('heading', { name: 'Shows' })).toBeVisible();
    
    // Verify Characters heading
    await expect(page.getByRole('heading', { name: 'Characters' })).toBeVisible();
  });

  test('should display video clips grid or empty state', async ({ page }) => {
    // Wait for content to load (either clips or empty state message)
    const hasClips = await page.locator('[role="main"]').count() > 0;
    const emptyMessage = page.getByText(/No video clips/i);
    
    // Either we have clips or an empty state message
    const hasContent = await page.locator('video, img, svg').first().isVisible()
      .catch(() => false);
    const hasEmptyState = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasContent || hasEmptyState).toBeTruthy();
  });

  test('should display sort dropdown', async ({ page }) => {
    // Verify sort dropdown is present
    const sortSelect = page.getByLabel('Sort by');
    await expect(sortSelect).toBeVisible();
  });

  test('should show login buttons when not authenticated', async ({ page }) => {
    // Check for Login or SignUp buttons
    const loginButton = page.getByRole('button', { name: /login/i });
    const signupButton = page.getByRole('button', { name: /signup/i });
    
    // At least one should be visible (depending on auth state)
    const hasAuthButtons = await loginButton.isVisible().catch(() => false) || 
                           await signupButton.isVisible().catch(() => false);
    
    // We expect to see auth buttons or user menu (if user somehow got authenticated)
    expect(hasAuthButtons).toBeTruthy();
  });
});
