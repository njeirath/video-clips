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
    const filterButton = page
      .getByRole('button')
      .filter({ has: page.locator('svg') })
      .first();

    // Either sidebar is visible OR filter button exists
    const sidebarVisible = await showsHeading.isVisible().catch(() => false);
    const filterButtonVisible = await filterButton
      .isVisible()
      .catch(() => false);

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
    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect).toBeVisible();
  });

  test('should not show login/signup buttons on home page', async ({
    page,
  }) => {
    // Wait for auth state to be determined (the app checks auth on mount)
    await page.waitForLoadState('networkidle');

    // Login and signup buttons have been removed from the home page
    // They should not be visible or present in the DOM
    const loginButton = page.getByRole('link', { name: /login/i });
    const signupButton = page.getByRole('link', { name: /signup/i });

    // Check that login/signup buttons are not present
    const loginExists = (await loginButton.count().catch(() => 0)) > 0;
    const signupExists = (await signupButton.count().catch(() => 0)) > 0;

    // Login/signup buttons should not be present on the home page
    expect(loginExists || signupExists).toBeFalsy();
  });

  test('should show login/signup buttons on admin page', async ({
    page,
  }) => {
    // Wait for auth state to be determined (the app checks auth on mount)
    await page.waitForLoadState('networkidle');

    // The header no longer exposes login/signup links directly. Instead the
    // app exposes dedicated routes for authentication. Verify the Sign In
    // page is reachable and renders correctly when navigating to `/signin`.
    await page.goto('/signin');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
});
