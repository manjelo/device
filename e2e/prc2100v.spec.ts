import { expect, test, type Page } from '@playwright/test';

// Datron PRC2100V front panel (device picker). Display text is exposed as a status region.
const display = (page: Page) => page.getByRole('status', { name: 'Display text' });

test('picker opens the PRC2100V, which powers on and tunes with the pad', async ({ page }) => {
  await page.goto('/?device=prc2100v');
  await expect(page.getByRole('group', { name: /PRC2100V front panel/ })).toBeVisible();
  await expect(display(page)).toHaveText('Display off');

  await page.locator('[data-control="power"]').click();
  await expect(display(page)).toContainText('30.000 MHz CH 001');

  await page.locator('[data-control="pad-right"]').click();
  await expect(display(page)).toContainText('30.025 MHz');
  await page.locator('[data-control="pad-down"]').click();
  await expect(display(page)).toContainText('CH 002');
  await page.locator('[data-control="key-oval"]').click();
  await expect(display(page)).toContainText('CH 002 SETTINGS');
  await page.locator('[data-control="key-square"]').click();
  await expect(display(page)).toContainText('12.5K');
  await page.locator('[data-control="key-oval"]').click();
  await expect(display(page)).not.toContainText('SETTINGS');
});

test('device choice is kept in the URL and switching back shows the PRC-152', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /PRC2100V/ }).click();
  await expect(page).toHaveURL(/device=prc2100v/);
  await expect(page.getByRole('group', { name: /PRC2100V front panel/ })).toBeVisible();
  await page.getByRole('button', { name: /AN\/PRC-152/ }).click();
  await expect(page.getByRole('status', { name: /placeholder/i })).toBeVisible();
});
