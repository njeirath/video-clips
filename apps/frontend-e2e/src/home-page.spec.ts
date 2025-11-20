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
    await expect(
      page.getByRole('heading', { name: 'Explore Clips' })
    ).toBeVisible();
  });

  test('should display the search bar', async ({ page }) => {
    // Verify search input exists (could be in header or below header on mobile)
    const searchInput = page.getByPlaceholder('Search for video clips...');
    await expect(searchInput).toBeVisible();
  });

  test('should display sidebar or filter button for Shows and Characters', async ({
    page,
  }) => {
    // On desktop, sidebar is visible. On mobile, we have a filter button instead.
    const showsHeading = page.getByRole('heading', { name: 'Shows' });
    const filterButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    
    // Either sidebar is visible OR filter button exists
    const sidebarVisible = await showsHeading.isVisible().catch(() => false);
    const filterButtonVisible = await filterButton.isVisible().catch(() => false);
    
    expect(sidebarVisible || filterButtonVisible).toBeTruthy();
  });

  test('should display video clips grid or empty state', async ({ page }) => {
    // Wait for content to load (either clips or empty state message)
    const hasClips = (await page.locator('[role="main"]').count()) > 0;
    const emptyMessage = page.getByText(/No video clips/i);

    // Either we have clips or an empty state message
    const hasContent = await page
      .locator('video, img, svg')
      .first()
      .isVisible()
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
    // Wait for auth state to be determined (the app checks auth on mount)
    await page.waitForLoadState('networkidle');

    // Check for Login or SignUp buttons
    const loginButton = page.getByRole('link', { name: /login/i });
    const signupButton = page.getByRole('link', { name: /signup/i });

    // Check visibility of both buttons
    const loginVisible = await loginButton.isVisible().catch(() => false);
    const signupVisible = await signupButton.isVisible().catch(() => false);

    // At least one auth button should be visible when not authenticated
    expect(loginVisible || signupVisible).toBeTruthy();
  });
});
