import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Captures only the front SVG element. Run with: npx playwright test --grep @front-svg
const OUT_DIR = fileURLToPath(new URL('../docs/screenshots/v4-final/', import.meta.url));

test('capture front SVG element', { tag: '@front-svg' }, async ({ page }, testInfo) => {
  mkdirSync(OUT_DIR, { recursive: true });
  const device = testInfo.project.name === 'mobile' ? 'mobile' : 'desktop';
  await page.goto('/');
  // Power is on the top view; switch there, power on, and come back to the front.
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await page.getByRole('button', { name: 'Power' }).click();
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await expect(page.getByRole('status', { name: /placeholder/i })).toHaveText(/PRESET 01/, { timeout: 5_000 });
  const svg = page.locator('svg.rs-svg').first();
  await svg.screenshot({ path: `${OUT_DIR}front-svg-${device}.png`, animations: 'disabled' });
});
