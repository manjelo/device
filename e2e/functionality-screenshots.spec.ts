import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { devices, expect, test, type Page } from '@playwright/test';

// Run only these captures with: npx playwright test --grep @functionality-screenshots
// Writes full-page captures to docs/screenshots/v5-functionality/ by driving the physical SVG controls.

const OUT_DIR = fileURLToPath(new URL('../docs/screenshots/v5-functionality/', import.meta.url));

const DESKTOP = { viewport: { width: 1280, height: 800 } };

function mobileProfile() {
  // The Pixel 5 profile with the 375 x 812 viewport the other captures use.
  const { defaultBrowserType: _unused, ...pixel5 } = devices['Pixel 5'];
  return { ...pixel5, viewport: { width: 375, height: 812 } };
}

const lcd = (page: Page) => page.getByRole('status', { name: /placeholder/i });
const key = (page: Page, id: string) => page.locator(`[data-control="${id}"]`);
const view = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT_DIR}${name}.png`, fullPage: true, animations: 'disabled' });
}

async function togglePower(page: Page) {
  await view(page, 'Top').click();
  await key(page, 'power').click();
  await view(page, 'Front').click();
}

test('capture functionality screenshots', { tag: '@functionality-screenshots' }, async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Captures desktop and mobile once, from the desktop project run.');
  mkdirSync(OUT_DIR, { recursive: true });
  const baseURL = testInfo.project.use.baseURL ?? 'http://localhost:4173';

  const desktop = await browser.newContext({ ...DESKTOP, baseURL });
  const page = await desktop.newPage();
  try {
    await page.goto('/');
    await togglePower(page);
    await expect(lcd(page)).toHaveText(/PRESET 01/, { timeout: 5_000 });
    await shot(page, 'main-screen');

    await key(page, 'keypad-7').click();
    await expect(lcd(page)).toContainText('OPTIONS (simulator)');
    await shot(page, 'options-menu');
    await key(page, 'keypad-clear').click();

    await key(page, 'keypad-8').click();
    await key(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('SYSTEM PRESET SETTINGS');
    await shot(page, 'basic-settings-menu');

    await key(page, 'keypad-enter').click();
    await key(page, 'keypad-preset-up').click();
    await key(page, 'keypad-preset-up').click();
    await expect(lcd(page)).toContainText('SYSTEM PRESETS');
    await shot(page, 'preset-selection');

    await key(page, 'keypad-enter').click();
    await key(page, 'keypad-enter').click();
    for (const d of ['4', '5']) await key(page, `keypad-${d}`).click();
    await expect(lcd(page)).toContainText('45_.___ MHz');
    await shot(page, 'frequency-editing');

    for (const d of ['0', '0', '0', '0']) await key(page, `keypad-${d}`).click();
    await key(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('NEW 450.000 MHz');
    await shot(page, 'frequency-confirm');

    await key(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('SAVED');
    for (let i = 0; i < 4; i += 1) await key(page, 'keypad-clear').click();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(lcd(page)).toContainText('450.000 MHz');
    await shot(page, 'preset-saved-main');

    await key(page, 'keypad-7').click();
    await key(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('KEYPAD LOCKED');
    await shot(page, 'keypad-locked');
    await key(page, 'keypad-clear').click();
    await key(page, 'keypad-enter').click();

    await togglePower(page);
    await expect(lcd(page)).toHaveText('');
    await shot(page, 'powered-off');
  } finally {
    await desktop.close();
  }

  const mobile = await browser.newContext({ ...mobileProfile(), baseURL });
  const phone = await mobile.newPage();
  try {
    await phone.goto('/');
    await togglePower(phone);
    await expect(lcd(phone)).toHaveText(/PRESET 01/, { timeout: 5_000 });
    await key(phone, 'keypad-8').click();
    await expect(lcd(phone)).toContainText('PROGRAM (simulator)');
    await shot(phone, 'mobile-program-menu');
  } finally {
    await mobile.close();
  }
});
