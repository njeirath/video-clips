import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Admin Page
 *
 * Tests the admin page functionality including access control.
 * Validates that unauthenticated users are redirected to sign in.
 */

test.describe('Admin Page - Access Control', () => {
  test('should redirect to sign in when accessing /admin without authentication', async ({ page }) => {
    // Navigate to admin page
    await page.goto('/admin');

    // Wait for the redirect to happen
    await page.waitForLoadState('networkidle');

    // Should be redirected to sign in page
    await expect(page).toHaveURL(/\/signin/);

    // Should see the sign in form
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should redirect to sign in when accessing /admin/add-clip without authentication', async ({ page }) => {
    // Navigate directly to add-clip under admin
    await page.goto('/admin/add-clip');

    // Wait for the redirect to happen
    await page.waitForLoadState('networkidle');

    // Should be redirected to sign in page
    await expect(page).toHaveURL(/\/signin/);

    // Should see the sign in form
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('sign in page should have email input and continue button', async ({ page }) => {
    // Navigate to admin page (will redirect to sign in)
    await page.goto('/admin');

    // Wait for the redirect
    await page.waitForLoadState('networkidle');

    // Should see the sign in page with email input
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();

    // Should have a continue button
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeVisible();
  });
});
