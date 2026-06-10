import { test, expect } from '@playwright/test';

test('landing page loads without errors', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/application error|internal server error|500/i);
});

test('landing page has heading', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });
});

test('login page loads', async ({ page }) => {
  const response = await page.goto('/login');
  await expect(page.locator('body')).toBeVisible();
  expect(response?.status()).toBeLessThan(500);
});
