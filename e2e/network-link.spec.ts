import { expect, test, type Browser, type Page } from '@playwright/test';

// Two separate browser contexts (two "devices") talk through the relay. Uses Chromium's fake microphone.
const lcd = (page: Page) => page.getByRole('status', { name: /placeholder/i });
const linkStatus = (page: Page) => page.getByRole('status', { name: 'Link status' });

async function device(browser: Browser, preset = 0) {
  const context = await browser.newContext({ permissions: ['microphone'] });
  await context.addInitScript(() => localStorage.setItem('radiosim-link', JSON.stringify({ mode: 'network' })));
  const page = await context.newPage();
  await page.goto('/');
  await expect(linkStatus(page)).toContainText('mic ready', { timeout: 15_000 });
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('p');
  await expect(lcd(page)).toContainText('STANDBY', { timeout: 5000 });
  for (let i = 0; i < preset; i += 1) await page.keyboard.press('+');
  return { page, context };
}

// Everyone shares one room, so these tests must not run at the same time.
test.describe.configure({ mode: 'serial' });
test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'desktop Chromium fake microphone only');

test('voice goes from one device to another in the same room and frequency', async ({ browser }) => {
  const a = await device(browser);
  const b = await device(browser);
  await a.page.bringToFront();
  await a.page.keyboard.down('t');
  await expect(lcd(a.page)).toContainText('TRANSMIT');
  await expect(lcd(b.page)).toContainText('RECEIVING');
  await expect(linkStatus(b.page)).not.toContainText('audio in 0', { timeout: 10_000 });
  await a.page.keyboard.up('t');
  await expect(lcd(b.page)).toContainText('STANDBY');
  await a.context.close();
  await b.context.close();
});

test('a different frequency does not hear it', async ({ browser }) => {
  const a = await device(browser);
  const otherFreq = await device(browser, 1);
  await a.page.bringToFront();
  await a.page.keyboard.down('t');
  await expect(lcd(a.page)).toContainText('TRANSMIT');
  await a.page.waitForTimeout(1500);
  await expect(lcd(otherFreq.page)).not.toContainText('RECEIVING');
  await expect(linkStatus(otherFreq.page)).toContainText('audio in 0');
  await a.page.keyboard.up('t');
  await Promise.all([a, otherFreq].map((d) => d.context.close()));
});
