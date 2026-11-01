import { expect, test, type Page } from '@playwright/test';

// Radio-to-radio link (simulator feature): two tabs of one browser, same frequency. No RF is involved.
const lcd = (page: Page) => page.getByRole('status', { name: /placeholder/i });

async function powerOn(page: Page) {
  await page.goto('/');
  await page.bringToFront();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('p');
  await expect(lcd(page)).toContainText('STANDBY', { timeout: 5000 });
}

test('a radio hears another tab keyed on the same frequency, and stops when released', async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await powerOn(b);
  await powerOn(a);
  await a.bringToFront();

  await a.keyboard.down('t');
  await expect(lcd(a)).toContainText('TRANSMIT');
  await expect(lcd(b)).toContainText('RECEIVING');

  await a.keyboard.up('t');
  await expect(lcd(b)).toContainText('STANDBY');
});

test('a radio on a different preset frequency does not hear it', async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await powerOn(b);
  await b.keyboard.press('+'); // PRE + : preset 2, a different frequency
  await powerOn(a);
  await a.bringToFront();

  await a.keyboard.down('t');
  await expect(lcd(a)).toContainText('TRANSMIT');
  await a.waitForTimeout(500);
  await expect(lcd(b)).not.toContainText('RECEIVING');
  await a.keyboard.up('t');
});
