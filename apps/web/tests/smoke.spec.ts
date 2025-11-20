import { test, expect } from '@playwright/test';

test.describe('public routes render core content', () => {
  test('login hero loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome to the Oonru Portal')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Business Email')).toBeVisible();
  });

  test('home inventory pulse renders stats header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Realtime inventory pulse')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Operational wedge', { exact: false })).toBeVisible();
  });
});
