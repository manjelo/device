import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { devices, expect, test, type Browser, type Page } from '@playwright/test';

// Run only these captures with: npx playwright test --grep @screenshots
// Writes full-page captures to docs/screenshots/v5-fidelity/ from the current source.

const OUT_DIR = fileURLToPath(new URL('../docs/screenshots/v5-fidelity/', import.meta.url));

const DESKTOP = { viewport: { width: 1280, height: 800 } };

function mobileProfile() {
  // The Pixel 5 profile with the 375 x 812 viewport this capture uses.
  const { defaultBrowserType: _unused, ...pixel5 } = devices['Pixel 5'];
  return { ...pixel5, viewport: { width: 375, height: 812 } };
}

async function powerOn(page: Page) {
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await page.getByRole('button', { name: 'Power' }).click();
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await expect(page.getByRole('status', { name: /placeholder/i })).toHaveText(/PRESET 01/, { timeout: 5_000 });
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT_DIR}${name}.png`, fullPage: true, animations: 'disabled' });
}

async function captureDesktop(browser: Browser, baseURL: string) {
  const context = await browser.newContext({ ...DESKTOP, baseURL });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Front', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await shot(page, 'front-desktop');

    await powerOn(page);
    await shot(page, 'front-powered-on');

    // Extra capture: the power, volume and squelch controls moved to the top view in V4.
    await page.getByRole('button', { name: 'Top', exact: true }).click();
    await shot(page, 'top-powered-on');
    await page.getByRole('button', { name: 'Left', exact: true }).click();
    await shot(page, 'left-powered-on');
    await page.getByRole('button', { name: 'Right', exact: true }).click();
    await shot(page, 'right-powered-on');
    await page.getByRole('button', { name: 'Front', exact: true }).click();

    await page.getByRole('button', { name: 'Top', exact: true }).click();
    await page.getByRole('button', { name: 'Power' }).click();
    await expect(page.getByRole('status', { name: /placeholder/i })).toHaveText('', { timeout: 5_000 });
    await page.getByRole('button', { name: 'Front', exact: true }).click();
    await shot(page, 'front-powered-off');

    await powerOn(page);
    await page.locator('[data-control="keypad-7"]').click();
    await expect(page.getByRole('status', { name: /placeholder/i })).toHaveText(/OPTIONS \(simulator\)/);
    await shot(page, 'front-menu-open');
  } finally {
    await context.close();
  }
}

async function captureMobile(browser: Browser, baseURL: string) {
  const context = await browser.newContext({ ...mobileProfile(), baseURL });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Front', exact: true })).toBeVisible();
    await shot(page, 'front-mobile');
  } finally {
    await context.close();
  }
}

test('capture screenshots', { tag: '@screenshots' }, async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Captures both devices once, from the desktop project run.');
  mkdirSync(OUT_DIR, { recursive: true });
  const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:4173';

  await captureDesktop(browser, baseURL);
  await captureMobile(browser, baseURL);
});
