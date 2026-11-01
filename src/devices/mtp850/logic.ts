// Motorola MTP850 simulator logic. Pure TypeScript, no React or DOM.
// Sources and accuracy: docs/devices/mtp850/device-research.md and accuracy-matrix.md.
// Documented: TMO 2048 / DMO 1024 talk groups, rotary talk-group selector, emergency button with red display, PTT.
// Assumed: navigation / MENU / call / end key functions, digit entry, volume scale, long-press power off.

export const TMO_GROUPS = 2048; // Documented
export const DMO_GROUPS = 1024; // Documented
export const VOLUME_MAX = 10; // Assumed scale
export const ENTRY_MAX_DIGITS = 4;
/** Stop-gap link encoding into the relay's 30 to 512 MHz field (see docs). Simulator-specific. */
export const LINK_BASE_TMO_HZ = 511_000_000;
export const LINK_BASE_DMO_HZ = 509_000_000;

export type Net = 'TMO' | 'DMO';
export type NavDir = 'up' | 'down' | 'left' | 'right';

export type Mtp850State = {
  power: 'off' | 'on';
  mode: 'standby' | 'transmit'; // 'transmit' while PTT is held (same field name the link hook uses)
  net: Net;
  tmoGroup: number; // 1..TMO_GROUPS
  dmoGroup: number; // 1..DMO_GROUPS
  volume: number; // 0..VOLUME_MAX
  emergency: boolean;
  entry: string; // digits typed for a direct talk-group jump
  notice: string | null;
  heard: Record<string, number>;
  menu: { screen: MenuScreen; index: number } | null; // null = home screen
};

export type MenuScreen = 'main' | 'setup';
export const MAIN_ITEMS = ['Messages', 'Contacts', 'Security', 'Setup', 'More ...'] as const; // layout from a Motorola menu reference photo
export const SETUP_ITEMS = ['Network', 'Volume'] as const; // Assumed contents

export type Mtp850Action =
  | { type: 'power-on' }
  | { type: 'power-toggle' }
  | { type: 'power-off' }
  | { type: 'ptt'; down: boolean }
  | { type: 'knob'; delta: -1 | 1 }
  | { type: 'nav'; dir: NavDir }
  | { type: 'digit'; digit: string }
  | { type: 'call' }
  | { type: 'end' }
  | { type: 'menu' }
  | { type: 'select' }
  | { type: 'back' }
  | { type: 'emergency' }
  | { type: 'rx-signal'; from: string; frequencyHz: number; active: boolean };

export const initialState: Mtp850State = {
  power: 'off', mode: 'standby', net: 'TMO', tmoGroup: 1, dmoGroup: 1, volume: 5,
  emergency: false, entry: '', notice: null, heard: {}, menu: null,
};

const groupCount = (net: Net) => (net === 'TMO' ? TMO_GROUPS : DMO_GROUPS);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function activeGroup(s: Mtp850State): number {
  return s.net === 'TMO' ? s.tmoGroup : s.dmoGroup;
}

export function groupName(n: number): string {
  return `TalkGrp ${n}`; // sample name from the brochure display; real names come from programming
}

/** Link channel in the relay's frequency field. */
export function linkFrequencyHz(s: Mtp850State): number {
  return (s.net === 'TMO' ? LINK_BASE_TMO_HZ : LINK_BASE_DMO_HZ) + activeGroup(s);
}

export function isReceiving(s: Mtp850State): boolean {
  if (s.power !== 'on' || s.mode === 'transmit') return false;
  const hz = linkFrequencyHz(s);
  return Object.values(s.heard).some((h) => h === hz);
}

function setGroup(s: Mtp850State, group: number): Mtp850State {
  return s.net === 'TMO' ? { ...s, tmoGroup: group } : { ...s, dmoGroup: group };
}

export function reduce(s: Mtp850State, a: Mtp850Action): Mtp850State {
  if (a.type === 'rx-signal') {
    const heard = { ...s.heard };
    if (a.active) heard[a.from] = a.frequencyHz;
    else delete heard[a.from];
    return { ...s, heard };
  }
  if (a.type === 'power-toggle') return reduce(s, { type: s.power === 'on' ? 'power-off' : 'power-on' });
  if (a.type === 'power-on') return s.power === 'off' ? { ...s, power: 'on' } : s;
  if (a.type === 'power-off') {
    return s.power === 'on' ? { ...s, power: 'off', mode: 'standby', emergency: false, entry: '', notice: null, menu: null } : s;
  }
  if (s.power !== 'on') return s;
  const quiet = { ...s, notice: null };
  switch (a.type) {
    case 'ptt':
      return { ...quiet, mode: a.down ? 'transmit' : 'standby' };
    case 'emergency':
      return { ...quiet, emergency: !s.emergency }; // toggling is Assumed; red display in emergency is Documented
    case 'nav':
      if (s.menu) return menuNav(quiet, a.dir);
      if (a.dir === 'up' || a.dir === 'down') {
        return { ...quiet, volume: clamp(s.volume + (a.dir === 'up' ? 1 : -1), 0, VOLUME_MAX) };
      }
      return s.mode === 'transmit' ? s : knob(quiet, a.dir === 'right' ? 1 : -1);
    case 'knob':
      return s.mode === 'transmit' ? s : knob(quiet, a.delta);
    case 'menu':
      if (s.mode === 'transmit') return s;
      return s.menu ? { ...quiet, menu: null } : { ...quiet, entry: '', menu: { screen: 'main', index: 0 } };
    case 'select':
      return s.menu ? menuSelect(quiet) : s;
    case 'back':
      return s.menu ? menuBack(quiet) : s;
    case 'digit':
      return /^[0-9]$/.test(a.digit) && s.entry.length < ENTRY_MAX_DIGITS ? { ...quiet, entry: s.entry + a.digit } : s;
    case 'call': {
      if (s.menu) return menuSelect(quiet);
      if (s.entry === '') return s;
      const n = Number(s.entry);
      if (n < 1 || n > groupCount(s.net)) return { ...s, entry: '', notice: 'INVALID GROUP' };
      return setGroup({ ...quiet, entry: '' }, n);
    }
    case 'end':
      if (s.menu) return menuBack(quiet);
      return s.entry !== '' ? { ...quiet, entry: '' } : quiet;
  }
}

function menuItems(screen: MenuScreen): readonly string[] {
  return screen === 'main' ? MAIN_ITEMS : SETUP_ITEMS;
}

function menuNav(s: Mtp850State, dir: NavDir): Mtp850State {
  const m = s.menu!;
  const n = menuItems(m.screen).length;
  if (dir === 'up' || dir === 'down') return { ...s, menu: { ...m, index: (m.index + (dir === 'up' ? -1 : 1) + n) % n } };
  if (m.screen === 'setup' && SETUP_ITEMS[m.index] === 'Volume') {
    return { ...s, volume: clamp(s.volume + (dir === 'right' ? 1 : -1), 0, VOLUME_MAX) };
  }
  return s;
}

function menuSelect(s: Mtp850State): Mtp850State {
  const m = s.menu!;
  if (m.screen === 'main') {
    return MAIN_ITEMS[m.index] === 'Setup'
      ? { ...s, menu: { screen: 'setup', index: 0 } }
      : { ...s, notice: 'NOT SIMULATED', menu: null };
  }
  if (SETUP_ITEMS[m.index] === 'Network') return { ...s, net: s.net === 'TMO' ? 'DMO' : 'TMO' };
  return s;
}

function menuBack(s: Mtp850State): Mtp850State {
  return s.menu!.screen === 'setup' ? { ...s, menu: { screen: 'main', index: MAIN_ITEMS.indexOf('Setup') } } : { ...s, menu: null };
}

export function menuRows(s: Mtp850State): string[] {
  if (!s.menu) return [];
  if (s.menu.screen === 'main') return [...MAIN_ITEMS];
  return SETUP_ITEMS.map((i) => (i === 'Network' ? `Network: ${s.net}` : `Volume: ${s.volume}`));
}

function knob(s: Mtp850State, delta: -1 | 1): Mtp850State {
  const count = groupCount(s.net);
  return setGroup({ ...s, entry: '' }, ((activeGroup(s) - 1 + delta + count) % count) + 1);
}

export type Lcd = {
  folder: string; group: string; net: Net; softLeft: string; softRight: string;
  entry: string; notice: string | null; emergency: boolean; state: 'TX' | 'RX' | ''; volume: number;
  menu: { title: string; rows: string[]; index: number } | null;
} | null;

export function renderLcd(s: Mtp850State): Lcd {
  if (s.power !== 'on') return null;
  return {
    folder: 'My Groups', group: groupName(activeGroup(s)), net: s.net,
    softLeft: s.menu ? 'Select' : 'Optns', softRight: s.menu ? 'Back' : 'Contcs', // home labels from the brochure sample screen
    menu: s.menu ? { title: s.menu.screen === 'main' ? 'Main Menu' : 'Setup', rows: menuRows(s), index: s.menu.index } : null,
    entry: s.entry, notice: s.notice, emergency: s.emergency,
    state: s.mode === 'transmit' ? 'TX' : isReceiving(s) ? 'RX' : '', volume: s.volume,
  };
}

export function lcdSummary(s: Mtp850State): string {
  const l = renderLcd(s);
  if (!l) return 'Display off';
  if (l.menu) return `${l.menu.title}: ${l.menu.rows.map((r, i) => (i === l.menu!.index ? `[${r}]` : r)).join(', ')}`;
  return [
    l.emergency ? 'EMERGENCY' : '', l.folder, l.group, l.net, `VOL ${l.volume}`,
    l.entry ? `Entry ${l.entry}` : '', l.notice ?? '', l.state,
  ].filter(Boolean).join(' ');
}
