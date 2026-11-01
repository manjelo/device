import { expect, test, type Locator, type Page } from '@playwright/test';

// Controls are located by their data-control id (the SVG has no other stable hook).
// Interactions go through the physical SVG controls (click, tap, wheel) and the documented simulator shortcuts.

const LCD = /placeholder/i;

// Front-view keys that are interactive: 0-9, star, hash, CLR, ENT, PRE + and PRE - (no power, volume or squelch on the front).
const FRONT_KEY_IDS = [
  'keypad-1', 'keypad-2', 'keypad-3', 'keypad-4', 'keypad-5', 'keypad-6', 'keypad-7', 'keypad-8', 'keypad-9',
  'keypad-star', 'keypad-0', 'keypad-hash', 'keypad-clear', 'keypad-enter', 'keypad-preset-up', 'keypad-preset-down',
];

function lcd(page: Page) {
  return page.getByRole('status', { name: LCD });
}

function control(page: Page, id: string): Locator {
  return page.locator(`[data-control="${id}"]`);
}

/** The highlighted cursor row of a menu on the enlarged LCD. A notice row (also inverse) always comes after it. */
function cursorRow(page: Page): Locator {
  return lcd(page).locator('.rs-lcd__row--inverse').first();
}

/**
 * Fails if any inset line is wider or taller than its box. Text is clipped by overflow: hidden, so the content
 * size is compared with the box size instead of looking at what is visible.
 */
async function expectInsetFits(page: Page) {
  const overflow = await page.locator('.rs-screen-inset').evaluate((el) => {
    const lines = [el, ...Array.from(el.children)] as HTMLElement[];
    return lines.map((line) => ({
      text: line.textContent ?? '',
      overflows: line.scrollWidth > line.clientWidth + 1 || line.scrollHeight > line.clientHeight + 1,
    }));
  });
  expect(overflow.filter((line) => line.overflows), 'inset lines must fit').toEqual([]);
}

/** Powers the radio on from the top view, where the power control is, then returns to the front view. */
async function powerOn(page: Page) {
  await page.getByRole('button', { name: 'Top' }).click();
  await control(page, 'power').click();
  await page.getByRole('button', { name: 'Front' }).click();
}

/** Powers on and waits for the main screen. */
async function powerOnToMain(page: Page) {
  await page.goto('/');
  await powerOn(page);
  await expect(lcd(page)).toHaveText(/PRESET 01/, { timeout: 5_000 });
}

/** Toggles power from the top view and returns to the front view. */
async function togglePower(page: Page) {
  await page.getByRole('button', { name: 'Top' }).click();
  await control(page, 'power').click();
  await page.getByRole('button', { name: 'Front' }).click();
}

const KEY_ID: Record<string, string> = { '*': 'keypad-star', '#': 'keypad-hash' };

/** Presses digit keys on the physical keypad. */
async function typeDigits(page: Page, digits: string) {
  for (const d of digits) await control(page, KEY_ID[d] ?? `keypad-${d}`).click();
}

/**
 * From the main screen: PGM, System Preset Settings, System Presets, move to the preset, open it, open Frequency.
 * `presetNumber` is 1-based. Ends on the frequency edit screen.
 */
async function openPresetFrequencyEdit(page: Page, presetNumber: number) {
  await control(page, 'keypad-8').click();
  await expect(lcd(page)).toContainText('PROGRAM (simulator)');
  await control(page, 'keypad-enter').click();
  await expect(lcd(page)).toContainText('SYSTEM PRESET SETTINGS');
  await control(page, 'keypad-enter').click();
  await expect(lcd(page)).toContainText('SYSTEM PRESETS');
  for (let i = 1; i < presetNumber; i += 1) await control(page, 'keypad-preset-up').click();
  await expect(cursorRow(page)).toHaveText(new RegExp(`^${String(presetNumber).padStart(2, '0')} CHAN`));
  await control(page, 'keypad-enter').click();
  await expect(cursorRow(page)).toHaveText(/^Frequency/);
  await control(page, 'keypad-enter').click();
  await expect(lcd(page)).toContainText('FREQUENCY');
  await expect(lcd(page)).toContainText('___.___ MHz');
}

test.describe('RadioSim page', () => {
  test('page loads with the front view selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /RadioSim/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Front' })).toHaveAttribute('aria-pressed', 'true');
    // Front view: 16 keys plus the LCD window. Power, volume and squelch are on the top view only.
    await expect(page.locator('svg [data-control]')).toHaveCount(17);
    await expect(control(page, 'power')).toHaveCount(0);
    // The radio is off, so the LCD is a blank panel with no indicator text.
    await expect(lcd(page)).toHaveText('');
    await expect(lcd(page)).not.toContainText(/TX|RX|PWR/);
  });

  test('left, right, and top views can be selected', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Left' }).click();
    await expect(page.getByRole('button', { name: 'Left' })).toHaveAttribute('aria-pressed', 'true');
    await expect(control(page, 'ptt')).toHaveCount(1);

    await page.getByRole('button', { name: 'Right' }).click();
    await expect(page.getByRole('button', { name: 'Right' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('svg [data-control]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Top' }).click();
    await expect(page.getByRole('button', { name: 'Top' })).toHaveAttribute('aria-pressed', 'true');
    await expect(control(page, 'antenna')).toHaveCount(1);
    await expect(control(page, 'power')).toHaveCount(1);

    await page.getByRole('button', { name: 'Front' }).click();
    await expect(page.getByRole('button', { name: 'Front' })).toHaveAttribute('aria-pressed', 'true');
    await expect(control(page, 'keypad-1')).toHaveCount(1);
  });

  test('the LCD panel stays visible in every view', async ({ page }) => {
    await page.goto('/');
    for (const view of ['Left', 'Right', 'Top', 'Front']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      await expect(lcd(page)).toBeVisible();
    }
  });
});

test.describe('power and startup', () => {
  test('power button on the top view shows the startup screen, then the main screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Top' }).click();
    await control(page, 'power').click();
    await expect(lcd(page)).toHaveText(/RADIOSIM STARTING/);
    await expect(lcd(page)).toHaveText(/PWR ON/);
    // Startup is a placeholder frame; the timer (STARTUP_TICK_MS, about 1.2 s) moves it to main.
    await expect(lcd(page)).toHaveText(/PRESET 01/, { timeout: 5_000 });
    await expect(lcd(page)).toHaveText(/30\.000 MHz/);
    await expect(lcd(page)).toContainText('CHAN 01');
  });

  test('keys are ignored during startup and while the radio is off', async ({ page }) => {
    await page.goto('/');
    await control(page, 'keypad-7').click();
    await expect(lcd(page)).toHaveText('');
    await powerOn(page);
    await expect(lcd(page)).toHaveText(/RADIOSIM STARTING/);
    await control(page, 'keypad-7').click();
    await expect(lcd(page)).not.toContainText('OPTIONS');
    await expect(lcd(page)).toHaveText(/PRESET 01/, { timeout: 5_000 });
  });

  test('power off blanks the LCD, leaves menus and discards an uncommitted edit', async ({ page }) => {
    await powerOnToMain(page);
    await openPresetFrequencyEdit(page, 1);
    await typeDigits(page, '1234');
    await expect(lcd(page)).toContainText('123.4__ MHz');
    await togglePower(page);
    await expect(lcd(page)).toHaveText('');
    await togglePower(page);
    await expect(lcd(page)).toHaveText(/PRESET 01/, { timeout: 5_000 });
    // The edit was never confirmed, so the preset frequency is unchanged.
    await expect(lcd(page)).toHaveText(/30\.000 MHz/);
    await expect(lcd(page)).not.toContainText('123.4');
  });

  test('indicators change with the device state instead of all showing at once', async ({ page }) => {
    await powerOnToMain(page);
    await expect(lcd(page)).toContainText('BAT 100%');
    await expect(lcd(page)).not.toContainText(/\bTX\b|\bRX\b|MON|LOCK|LOW BAT/);
  });
});

test.describe('keypad and menus', () => {
  test('ENT on the main screen does nothing; key 7 opens OPT and key 8 opens PGM', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toHaveText(/PRESET 01/);
    await expect(lcd(page)).not.toContainText('simulator)');

    await control(page, 'keypad-7').click();
    await expect(lcd(page)).toContainText('OPTIONS (simulator)');
    await control(page, 'keypad-clear').click();
    await expect(lcd(page)).toHaveText(/PRESET 01/);

    await control(page, 'keypad-8').click();
    await expect(lcd(page)).toContainText('PROGRAM (simulator)');
  });

  test('the OPT menu lists its entries and marks unsupported ones as unavailable', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-7').click();
    for (const label of ['Keypad Lock', 'Monitor', 'Display Bright', 'RF Power', 'Battery Drain', 'Reset Simulator', 'COMSEC', 'Waveform']) {
      await expect(lcd(page)).toContainText(label);
    }
    for (let i = 0; i < 6; i += 1) await control(page, 'keypad-preset-up').click();
    await expect(cursorRow(page)).toHaveText(/^COMSEC\s+N\/A/);
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('UNAVAILABLE IN SIM');
  });

  test('PRE +/-, the channel dial and arrow keys move the menu cursor within its bounds', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-7').click();
    await expect(cursorRow(page)).toHaveText(/^Keypad Lock/);

    await control(page, 'keypad-preset-up').click();
    await expect(cursorRow(page)).toHaveText(/^Monitor/);
    await control(page, 'keypad-preset-down').click();
    await expect(cursorRow(page)).toHaveText(/^Keypad Lock/);

    // ArrowUp is the dial +1 (README shortcuts): the cursor moves down the menu.
    await page.keyboard.press('ArrowUp');
    await expect(cursorRow(page)).toHaveText(/^Monitor/);
    await page.keyboard.press('ArrowDown');
    await expect(cursorRow(page)).toHaveText(/^Keypad Lock/);

    // The cursor clamps at the top of the menu (no wrap).
    await page.keyboard.press('ArrowDown');
    await expect(cursorRow(page)).toHaveText(/^Keypad Lock/);

    // A wheel tick over the dial on the top view moves the cursor too (deltaY < 0 is +1).
    await page.getByRole('button', { name: 'Top' }).click();
    await control(page, 'knob-channel').hover();
    await page.mouse.wheel(0, -100);
    await expect(cursorRow(page)).toHaveText(/^Monitor/);
  });

  test('Monitor toggles from the OPT menu and shows the MON indicator', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-7').click();
    await control(page, 'keypad-preset-up').click();
    await control(page, 'keypad-enter').click();
    await expect(cursorRow(page)).toHaveText(/^Monitor\s+ON/);
    await expect(lcd(page)).toContainText('MON');
    await control(page, 'keypad-clear').click();
    await expect(lcd(page)).toHaveText(/STANDBY\s+MON/);
    await control(page, 'keypad-7').click();
    await control(page, 'keypad-preset-up').click();
    await control(page, 'keypad-enter').click();
    await expect(cursorRow(page)).toHaveText(/^Monitor\s+OFF/);
  });

  test('CLR steps back one menu level at a time and returns to the main screen from the root', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-8').click();
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('SYSTEM PRESET SETTINGS');
    await control(page, 'keypad-clear').click();
    await expect(lcd(page)).toContainText('PROGRAM (simulator)');
    await control(page, 'keypad-clear').click();
    await expect(lcd(page)).toHaveText(/PRESET 01/);
    await expect(lcd(page)).not.toContainText('simulator)');
  });

  test('star and hash have no function and say so', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-star').click();
    await expect(lcd(page)).toContainText('UNAVAILABLE IN SIM');
  });
});

test.describe('presets and frequency', () => {
  test('+ and - retune the active preset by 25 kHz and the LCD updates at once', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-preset-up').click();
    await expect(lcd(page)).toHaveText(/PRESET 01/);
    await expect(lcd(page)).toContainText('30.025 MHz');
    await control(page, 'keypad-preset-down').click();
    await control(page, 'keypad-preset-down').click();
    await expect(lcd(page)).toContainText('30.000 MHz');

    // Many presses keep tuning the same preset and never touch the dial.
    for (let i = 0; i < 6; i += 1) await control(page, 'keypad-preset-up').click();
    await expect(lcd(page)).toHaveText(/PRESET 01/);
    await expect(lcd(page)).toContainText('30.150 MHz');
    await expect(lcd(page)).toContainText('DIAL 1');
    await expect(lcd(page)).not.toContainText('N/A');
  });

  test('the top dial is separate from the stored presets', async ({ page }) => {
    await powerOnToMain(page);
    await page.getByRole('button', { name: 'Top' }).click();
    await control(page, 'knob-channel').focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(lcd(page)).toHaveText(/PRESET 03/);
    await expect(lcd(page)).toContainText('DIAL 3');
    // A dial position with no preset is shown as not supported and leaves the preset alone.
    for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowUp');
    await expect(lcd(page)).toContainText('DIAL S');
    await expect(lcd(page)).toContainText('S: SCAN CHANNELS');
    await expect(lcd(page)).toHaveText(/PRESET 05/);
  });

  test('edits a preset frequency, saves it, and the value survives view changes and a power cycle', async ({ page }) => {
    await powerOnToMain(page);
    await openPresetFrequencyEdit(page, 3);
    await typeDigits(page, '450000');
    await expect(lcd(page)).toContainText('450.000 MHz');
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('NEW 450.000 MHz');
    await expect(lcd(page)).toContainText('Apply? ENT=yes CLR=no');
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('SAVED');
    await expect(cursorRow(page)).toHaveText(/^Frequency\s+450\.000 MHz/);

    // Back to the main screen and select preset 3.
    for (let i = 0; i < 4; i += 1) await control(page, 'keypad-clear').click();
    await expect(lcd(page)).toHaveText(/PRESET 01/);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(lcd(page)).toHaveText(/PRESET 03/);
    await expect(lcd(page)).toContainText('450.000 MHz');
    await expectInsetFits(page);

    // Switching views changes nothing.
    for (const view of ['Left', 'Right', 'Top', 'Front']) {
      await page.getByRole('button', { name: view, exact: true }).click();
    }
    await expect(lcd(page)).toContainText('450.000 MHz');
    await expect(page.locator('.rs-screen-inset__main')).toHaveText('450.000 MHz');

    // A power cycle keeps the saved preset.
    await togglePower(page);
    await expect(lcd(page)).toHaveText('');
    await togglePower(page);
    await expect(lcd(page)).toHaveText(/PRESET 03/, { timeout: 5_000 });
    await expect(lcd(page)).toContainText('450.000 MHz');
  });

  test('CLR at the confirm screen cancels and leaves the saved value unchanged', async ({ page }) => {
    await powerOnToMain(page);
    await openPresetFrequencyEdit(page, 3);
    await typeDigits(page, '300000');
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('NEW 300.000 MHz');
    await control(page, 'keypad-clear').click();
    await expect(cursorRow(page)).toHaveText(/^Frequency\s+39\.000 MHz/);
    await expect(lcd(page)).not.toContainText('SAVED');
  });

  test('rejects incomplete and out-of-range entries and keeps the previous value', async ({ page }) => {
    await powerOnToMain(page);
    await openPresetFrequencyEdit(page, 1);
    await typeDigits(page, '150');
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('ENTER 6 DIGITS');
    await expect(lcd(page)).toContainText('150.___ MHz');

    // CLR clears the typed entry first, then leaves the edit.
    await control(page, 'keypad-clear').click();
    await expect(lcd(page)).toContainText('___.___ MHz');
    await typeDigits(page, '999999');
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('OUT OF RANGE');
    await control(page, 'keypad-clear').click();
    await control(page, 'keypad-clear').click();
    await expect(cursorRow(page)).toHaveText(/^Frequency\s+30\.000 MHz/);
  });
});

test.describe('volume and squelch', () => {
  test('volume shows a temporary indicator on the LCD and clears by itself', async ({ page }) => {
    await powerOnToMain(page);
    await page.keyboard.press('ArrowRight');
    await expect(lcd(page)).toContainText('VOLUME 6');
    await expect(page.locator('.rs-screen-inset')).toContainText('VOLUME 6');
    await expect(lcd(page)).not.toContainText('VOLUME', { timeout: 4_000 });
  });

  test('the volume knob works from the top view and respects its limits', async ({ page }) => {
    await powerOnToMain(page);
    await page.getByRole('button', { name: 'Top' }).click();
    await control(page, 'knob-volume').hover();
    for (let i = 0; i < 8; i += 1) await page.mouse.wheel(0, -100);
    await expect(lcd(page)).toContainText('VOLUME 10');
    await expect(control(page, 'knob-volume')).toHaveAttribute('aria-valuenow', '10');
    for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, 100);
    await expect(control(page, 'knob-volume')).toHaveAttribute('aria-valuenow', '0');
  });

  test('the squelch knob shows its own temporary indicator', async ({ page }) => {
    await powerOnToMain(page);
    await page.keyboard.press('PageDown');
    await expect(lcd(page)).toContainText('SQUELCH 4');
  });
});

test.describe('keypad lock', () => {
  test('locks from the OPT menu, blocks keys, and unlocks with CLR then ENT', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-7').click();
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('KEYPAD LOCKED');
    await expect(lcd(page).locator('.rs-lcd__ind', { hasText: /^LOCK$/ })).toBeVisible();

    // Keys and the preset keys do nothing while locked.
    await control(page, 'keypad-preset-up').click();
    await expect(lcd(page)).toContainText('30.000 MHz');
    await control(page, 'keypad-8').click();
    await expect(lcd(page)).not.toContainText('PROGRAM');

    // A wrong sequence does not unlock.
    await control(page, 'keypad-clear').click();
    await control(page, 'keypad-5').click();
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('KEYPAD LOCKED');

    // Volume stays available while locked.
    await page.keyboard.press('ArrowRight');
    await expect(lcd(page)).toContainText('VOLUME 6');

    await control(page, 'keypad-clear').click();
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).not.toContainText('KEYPAD LOCKED');
    await expect(lcd(page).locator('.rs-lcd__ind', { hasText: /^LOCK$/ })).toHaveCount(0);
    await control(page, 'keypad-preset-up').click();
    await expect(lcd(page)).toContainText('30.025 MHz');
  });

  test('a power cycle clears the lock', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-7').click();
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('KEYPAD LOCKED');
    await togglePower(page);
    await togglePower(page);
    await expect(lcd(page)).toHaveText(/PRESET 01/, { timeout: 5_000 });
    await expect(lcd(page)).not.toContainText('KEYPAD LOCKED');
  });
});

test.describe('simulated PTT', () => {
  test('pressing the PTT switch sets TX and releasing clears it', async ({ page }) => {
    await powerOnToMain(page);
    await page.getByRole('button', { name: 'Left' }).click();
    await control(page, 'ptt').hover();
    await page.mouse.down();
    await expect(lcd(page)).toContainText('TRANSMIT');
    await expect(lcd(page)).toContainText('TX');
    await page.mouse.up();
    await expect(lcd(page)).not.toContainText('TRANSMIT');
  });

  test('PTT is released when the view changes while it is held', async ({ page }) => {
    await powerOnToMain(page);
    await page.getByRole('button', { name: 'Left' }).click();
    await control(page, 'ptt').hover();
    await page.mouse.down();
    await expect(lcd(page)).toContainText('TRANSMIT');
    // The pointer is still down: switch the view from script so the SVG under it is replaced.
    await page.evaluate(() => {
      const front = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Front');
      front?.click();
    });
    await expect(lcd(page)).not.toContainText('TRANSMIT');
    await page.mouse.up();
  });

  test('PTT is released when the window loses focus', async ({ page }) => {
    await powerOnToMain(page);
    await page.getByRole('button', { name: 'Left' }).click();
    await control(page, 'ptt').hover();
    await page.mouse.down();
    await expect(lcd(page)).toContainText('TRANSMIT');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(lcd(page)).not.toContainText('TRANSMIT');
    await page.mouse.up();
  });

  test('powering off while PTT is held clears transmit', async ({ page }) => {
    await powerOnToMain(page);
    await page.getByRole('button', { name: 'Left' }).click();
    await control(page, 'ptt').hover();
    await page.mouse.down();
    await expect(lcd(page)).toContainText('TRANSMIT');
    await page.keyboard.press('p');
    await expect(lcd(page)).toHaveText('');
    await page.mouse.up();
    await page.keyboard.press('p');
    await expect(lcd(page)).toHaveText(/PRESET 01/, { timeout: 5_000 });
    await expect(lcd(page)).not.toContainText('TRANSMIT');
  });

  test('PTT does nothing while the radio is off', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Left' }).click();
    await control(page, 'ptt').hover();
    await page.mouse.down();
    await expect(lcd(page)).toHaveText('');
    await page.mouse.up();
  });
});

test.describe('LCD inset on the radio face', () => {
  test('the inset sits on the LCD window and its text stays inside the screen', async ({ page }) => {
    await powerOnToMain(page);

    const inset = page.locator('.rs-screen-inset');
    const lcdWindow = control(page, 'lcd-area');
    const insetBox = await inset.boundingBox();
    const windowBox = await lcdWindow.boundingBox();
    expect(insetBox).not.toBeNull();
    expect(windowBox).not.toBeNull();
    // The inset is positioned from the lcd-area rect's viewBox fractions. Allow 2 px for rounding.
    expect(Math.abs(insetBox!.x - windowBox!.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(insetBox!.y - windowBox!.y)).toBeLessThanOrEqual(2);
    expect(Math.abs(insetBox!.width - windowBox!.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(insetBox!.height - windowBox!.height)).toBeLessThanOrEqual(2);

    await expectInsetFits(page);
  });

  test('every screen fits inside the inset: menus, the presets list, edit, confirm, lock and notices', async ({ page }) => {
    await powerOnToMain(page);

    await control(page, 'keypad-7').click();
    await expectInsetFits(page);
    await control(page, 'keypad-clear').click();

    await openPresetFrequencyEdit(page, 12);
    await expectInsetFits(page);
    await typeDigits(page, '4');
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('ENTER 6 DIGITS');
    await expectInsetFits(page);
    await typeDigits(page, '50000');
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('NEW 450.000 MHz');
    await expectInsetFits(page);
    await control(page, 'keypad-clear').click();
    for (let i = 0; i < 4; i += 1) await control(page, 'keypad-clear').click();

    await control(page, 'keypad-7').click();
    await control(page, 'keypad-enter').click();
    await expect(lcd(page)).toContainText('KEYPAD LOCKED');
    await expectInsetFits(page);
  });

  test('the inset does not intercept clicks on the keypad or the LCD window', async ({ page }) => {
    await powerOnToMain(page);
    const insetBox = await page.locator('.rs-screen-inset').boundingBox();
    const hitId = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest('[data-control]')?.getAttribute('data-control') ?? null;
    }, { x: insetBox!.x + insetBox!.width / 2, y: insetBox!.y + insetBox!.height / 2 });
    expect(hitId).toBe('lcd-area');
  });

  test('the enlarged LCD panel shows the same state as the inset', async ({ page }) => {
    await powerOnToMain(page);
    await expect(page.locator('.rs-screen-inset__main')).toHaveText(/30\.000 MHz/);
    await expect(lcd(page)).toContainText('30.000 MHz');
    await control(page, 'keypad-8').click();
    await expect(page.locator('.rs-screen-inset')).toContainText('PROGRAM (simulator)');
    await expect(lcd(page)).toContainText('PROGRAM (simulator)');
    // The brightness filter comes from the same frame for both displays.
    const insetFilter = await page.locator('.rs-screen-inset').evaluate((el) => (el as HTMLElement).style.filter);
    const lcdFilter = await lcd(page).evaluate((el) => (el as HTMLElement).style.filter);
    expect(insetFilter).toBe(lcdFilter);
  });

  test('display brightness from the OPT menu reaches both displays', async ({ page }) => {
    await powerOnToMain(page);
    await control(page, 'keypad-7').click();
    for (let i = 0; i < 2; i += 1) await control(page, 'keypad-preset-up').click();
    await expect(cursorRow(page)).toHaveText(/^Display Bright\s+5/);
    await control(page, 'keypad-enter').click();
    await expect(cursorRow(page)).toHaveText(/^Display Bright\s+1/);
    const insetFilter = await page.locator('.rs-screen-inset').evaluate((el) => (el as HTMLElement).style.filter);
    const lcdFilter = await lcd(page).evaluate((el) => (el as HTMLElement).style.filter);
    expect(insetFilter).toBe('brightness(0.65)');
    expect(lcdFilter).toBe('brightness(0.65)');
  });
});

test.describe('mobile touch', () => {
  test('taps drive the power control, the keypad and the menus', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Touch taps need the mobile project (hasTouch).');
    await page.goto('/');
    await page.getByRole('button', { name: 'Top' }).tap();
    await control(page, 'power').tap();
    await page.getByRole('button', { name: 'Front' }).tap();
    await expect(lcd(page)).toHaveText(/PRESET 01/, { timeout: 5_000 });
    await control(page, 'keypad-preset-up').tap();
    await expect(lcd(page)).toContainText('30.025 MHz');
    await control(page, 'keypad-7').tap();
    await expect(lcd(page)).toContainText('OPTIONS (simulator)');
    await control(page, 'keypad-clear').tap();
    await expect(lcd(page)).toContainText('30.025 MHz');
  });
});

test.describe('collapsible information section', () => {
  test('is closed by default and opens to show shortcuts and status', async ({ page }) => {
    await page.goto('/');
    const details = page.locator('details.rs-details');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeHidden();
    await details.locator('summary').click();
    await expect(page.getByRole('heading', { name: 'Keyboard shortcuts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Control status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Technical notes' })).toBeVisible();
  });

  test('view buttons and the sound toggle stay visible outside the section', async ({ page }) => {
    await page.goto('/');
    for (const name of ['Front', 'Left', 'Right', 'Top']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Sound: (on|off)/ })).toBeVisible();
  });
});

test.describe('layout', () => {
  test('no horizontal page scroll at 375 px width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Front' })).toBeVisible();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  for (const width of [1280, 768, 375]) {
    test(`no horizontal page scroll with the LCD and details open at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('details.rs-details summary').click();
      await page.getByRole('button', { name: 'Top' }).click();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }

  test('top-view power control hit area is at least 44 px in each dimension', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Top' }).click();
    const box = await control(page, 'power').boundingBox();
    expect(box, 'power control must be rendered').not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('every front-view key is at least 44 px in each dimension at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Front' })).toBeVisible();

    const failures: string[] = [];
    for (const id of FRONT_KEY_IDS) {
      const box = await control(page, id).boundingBox();
      if (!box) {
        failures.push(`${id}: not rendered`);
        continue;
      }
      if (box.width < 44 || box.height < 44) {
        failures.push(`${id}: ${box.width.toFixed(1)} x ${box.height.toFixed(1)} px`);
      }
    }
    expect(failures, `keys under 44 px:\n${failures.join('\n')}`).toEqual([]);
  });

  test('every top-view button and knob is at least 44 px in each dimension at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Top' }).click();

    const failures: string[] = [];
    const checked: string[] = [];
    for (const id of ['power', 'knob-channel', 'knob-volume', 'knob-squelch']) {
      const el = control(page, id);
      const box = await el.boundingBox();
      checked.push(id);
      if (!box) {
        failures.push(`${id}: not rendered`);
        continue;
      }
      if (box.width < 44 || box.height < 44) {
        failures.push(`${id}: ${box.width.toFixed(1)} x ${box.height.toFixed(1)} px`);
      }
    }
    expect(checked).toHaveLength(4);
    expect(failures, `controls under 44 px:\n${failures.join('\n')}`).toEqual([]);
  });
});
