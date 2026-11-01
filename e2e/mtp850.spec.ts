import { expect, test, type Page } from '@playwright/test';

// Motorola MTP850 front panel (device picker). Display text is exposed as a status region.
const display = (page: Page) => page.getByRole('status', { name: 'Display text' });

test('MTP850 powers on, selects talk groups, jumps by number and shows emergency', async ({ page }) => {
  await page.goto('/?device=mtp850');
  await expect(page.getByRole('group', { name: /MTP850 front/ })).toBeVisible();
  await expect(display(page)).toHaveText('Display off');

  await page.locator('[data-control="end"]').click(); // short press while off: power on
  await expect(display(page)).toContainText('My Groups TalkGrp 1 TMO');

  await page.locator('[data-control="knob"]').dispatchEvent('wheel', { deltaY: -100 });
  await expect(display(page)).toContainText('TalkGrp 2');

  for (const d of ['1', '2', '3']) await page.locator(`[data-control="key-${d}"]`).click();
  await expect(display(page)).toContainText('Entry 123');
  await page.locator('[data-control="call"]').click();
  await expect(display(page)).toContainText('TalkGrp 123');

  await page.locator('[data-control="menu"]').click();
  await expect(display(page)).toContainText('DMO');

  await page.locator('[data-control="emergency"]').click();
  await expect(display(page)).toContainText('EMERGENCY');
});

test('picker offers the MTP850', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /MTP850/ }).click();
  await expect(page).toHaveURL(/device=mtp850/);
  await expect(page.getByRole('group', { name: /MTP850 front/ })).toBeVisible();
});
