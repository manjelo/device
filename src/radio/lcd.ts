// Pure LCD frame generator. PLACEHOLDER LAYOUT: the real display layout is Unknown
// (docs/device-research.md section 2). Row order, wording, and sizes are simulator choices.
// The in-radio LCD and the enlarged preview both render this one frame.
import { DIAL_POSITIONS, FREQ_ENTRY_DIGITS, FREQ_ENTRY_INTEGER_DIGITS, LOW_BATTERY_PERCENT } from './config';
import { LIST_WINDOW, MENUS, PRESETS_MENU_TITLE, type MenuItem } from './menus';
import { activeFrequencyHz, currentMenuId, isReceiving } from './stateMachine';
import type { LcdFrame, LcdRow, RadioState } from './types';

/** Caption for the placeholder LCD area. Required wording from the v2 contract. */
export const LCD_LABEL = 'Simulated LCD (layout approximated)';

const STARTUP_TEXT = 'RADIOSIM STARTING';

export function renderLcd(state: RadioState): LcdFrame {
  // Off: blank frame, no text, no indicators. Every other screen uses placeholder layout.
  if (state.screen === 'off') {
    return {
      screen: 'off',
      rows: [],
      indicators: { power: false, tx: false, rx: false, monitor: false, locked: false, lowBattery: false, battery: 0 },
      brightness: 0,
      label: LCD_LABEL,
      approximated: false,
    };
  }

  return {
    screen: state.screen,
    rows: rowsFor(state),
    indicators: {
      power: state.power === 'on',
      tx: state.mode === 'transmit',
      rx: isReceiving(state),
      monitor: state.monitor,
      locked: state.locked,
      lowBattery: state.batteryPct <= LOW_BATTERY_PERCENT,
      battery: state.batteryPct,
    },
    brightness: state.brightness,
    label: LCD_LABEL,
    approximated: true,
  };
}

function rowsFor(state: RadioState): LcdRow[] {
  switch (state.screen) {
    case 'startup':
      return [
        { text: STARTUP_TEXT, size: 'large' },
        { text: 'PLACEHOLDER STARTUP (not device sequence)', size: 'small' },
      ];
    case 'main':
    case 'locked':
      return mainRows(state);
    case 'menu':
      return menuRows(state);
    case 'edit':
      return editRows(state);
    case 'confirm':
      return confirmRows(state);
    default:
      return [];
  }
}

const mhz = (hz: number): string => `${(hz / 1_000_000).toFixed(3)} MHz`;
const pad2 = (n: number): string => String(n).padStart(2, '0');

function mainRows(state: RadioState): LcdRow[] {
  const preset = state.presets[state.preset - 1];
  const modeText =
    state.mode === 'transmit'
      ? 'TRANSMIT'
      : isReceiving(state)
        ? 'RECEIVING'
        : state.monitor
          ? 'STANDBY  MON'
          : 'STANDBY';
  const rows: LcdRow[] = [
    { text: `PRESET ${pad2(state.preset)}  ${preset.name}`, size: 'small' },
    { text: mhz(activeFrequencyHz(state)), size: 'large' },
    { text: modeText, size: 'small' },
    { text: `DIAL ${DIAL_POSITIONS[state.dial]}`, size: 'small' },
  ];
  if (state.locked) {
    rows.push({ text: 'KEYPAD LOCKED', size: 'small', inverse: true });
    rows.push({ text: 'CLR THEN ENT = UNLOCK (SIM)', size: 'small' });
  }
  if (state.overlay) {
    rows.push({ text: `${state.overlay.kind === 'volume' ? 'VOLUME' : 'SQUELCH'} ${state.overlay.value}`, size: 'small', inverse: true, kind: 'overlay' });
  }
  return withNotice(rows, state);
}

function menuRows(state: RadioState): LcdRow[] {
  const menu = state.menu;
  if (!menu) return [];
  const id = currentMenuId(menu);

  if (id === 'pgm.presets') {
    const start = Math.min(Math.max(menu.cursor - 2, 0), Math.max(0, state.presets.length - LIST_WINDOW));
    const rows: LcdRow[] = [{ text: PRESETS_MENU_TITLE, size: 'small' }];
    for (let i = start; i < Math.min(start + LIST_WINDOW, state.presets.length); i += 1) {
      const p = state.presets[i];
      rows.push({ text: `${pad2(i + 1)} ${p.name}  ${mhz(p.frequencyHz)}`, size: 'small', inverse: i === menu.cursor, kind: i === menu.cursor ? 'cursor' : undefined });
    }
    return withNotice(rows, state);
  }

  const title = id === 'pgm.preset' && menu.target !== null ? `PRESET ${pad2(menu.target + 1)}  ${state.presets[menu.target].name}` : MENUS[id].title;
  const rows: LcdRow[] = [{ text: title, size: 'small' }];
  MENUS[id].items.forEach((item, i) => {
    rows.push({ text: `${item.label}  ${itemValue(state, item)}`.trimEnd(), size: 'small', inverse: i === menu.cursor, kind: i === menu.cursor ? 'cursor' : undefined });
  });
  return withNotice(rows, state);
}

/** The value text shown after a menu entry. */
function itemValue(state: RadioState, item: MenuItem): string {
  switch (item.id) {
    case 'monitor':
      return state.monitor ? 'ON' : 'OFF';
    case 'drain':
      return state.batteryDrain ? 'ON' : 'OFF';
    case 'brightness':
      return String(state.brightness);
    case 'rfpower':
      return `${state.outputPowerW} W`;
    case 'frequency':
      return state.menu?.target == null ? '' : mhz(state.presets[state.menu.target].frequencyHz);
    default:
      if (item.kind === 'unavailable') return 'N/A';
      return item.kind === 'submenu' ? '>' : '';
  }
}

/** The frequency edit template: typed digits, then underscores, read as MMM.KKK MHz. */
export function frequencyTemplate(buffer: string): string {
  const padded = buffer.padEnd(FREQ_ENTRY_DIGITS, '_');
  return `${padded.slice(0, FREQ_ENTRY_INTEGER_DIGITS)}.${padded.slice(FREQ_ENTRY_INTEGER_DIGITS)} MHz`;
}

function editRows(state: RadioState): LcdRow[] {
  const target = state.menu?.target ?? 0;
  return withNotice(
    [
      { text: `PRESET ${pad2(target + 1)} FREQUENCY`, size: 'small' },
      { text: `CURRENT ${mhz(state.presets[target].frequencyHz)}`, size: 'small' },
      { text: frequencyTemplate(state.edit?.buffer ?? ''), size: 'large' },
      { text: 'ENT=next  CLR=clear/back', size: 'small' },
    ],
    state,
  );
}

function confirmRows(state: RadioState): LcdRow[] {
  const pending = state.pendingConfirm;
  if (!pending) return [];
  if (pending.kind === 'reset') {
    return [
      { text: 'RESET SIMULATOR', size: 'small' },
      { text: 'DEFAULTS', size: 'large' },
      { text: pending.prompt, size: 'small' },
    ];
  }
  return [
    { text: `PRESET ${pad2(pending.presetIndex + 1)} FREQUENCY`, size: 'small' },
    { text: `NEW ${mhz(pending.frequencyHz)}`, size: 'large' },
    { text: pending.prompt, size: 'small' },
  ];
}

/**
 * The two rows the small in-radio display shows from a frame: the large (or first) row, and one status row.
 * The status row is a notice first, then a temporary volume/squelch row, then the menu cursor row, so a message is
 * never hidden behind the cursor. The enlarged preview shows every row.
 */
export function insetRows(frame: LcdFrame): { main: LcdRow | undefined; second: LcdRow | undefined } {
  const main = frame.rows.find((r) => r.size === 'large' && r.text) ?? frame.rows.find((r) => r.text);
  const second =
    frame.rows.find((r) => r.kind === 'notice' && r.text) ??
    frame.rows.find((r) => r.kind === 'overlay' && r.text) ??
    frame.rows.find((r) => r.kind === 'cursor' && r.text) ??
    frame.rows.find((r) => r.inverse && r.text) ??
    frame.rows.find((r) => r.text && r !== main);
  return { main, second };
}

/** Adds the notice row only while a notice is showing. */
function withNotice(rows: LcdRow[], state: RadioState): LcdRow[] {
  return state.notice === null ? rows : [...rows, { text: state.notice, size: 'small', inverse: true, kind: 'notice' }];
}
