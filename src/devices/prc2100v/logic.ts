// Datron PRC2100V (Spectre V) simulator logic. Pure TypeScript, no React or DOM.
// Sources and accuracy: docs/devices/prc2100v/device-research.md and accuracy-matrix.md.
// Documented: frequency range, channel spacing, 100 memory channels, three modes, three manpack power settings (500 mW to 10 W).
// Assumed (labelled in the UI): which key does what, default channel contents, the middle power setting, the LCD fields.

export const FREQ_MIN_HZ = 30_000_000; // Documented (datasheet)
export const FREQ_MAX_HZ = 87_975_000; // Documented (datasheet)
export const CHANNEL_COUNT = 100; // Documented
export const SPACINGS_HZ = [12_500, 25_000] as const; // Documented
export const MODES = ['FF', 'FH', 'DIGITAL'] as const; // Documented names (FF FM, FH, digital encryption). Simulated as a label only.
export const TX_POWER_W = [0.5, 5, 10] as const; // 500 mW and 10 W Documented, 3 settings Documented; 5 W is Assumed.
export const VOLUME_MAX = 10; // Assumed scale

export type Mode = (typeof MODES)[number];
export type Channel = { frequencyHz: number; mode: Mode; spacingHz: number };

export type Prc2100vState = {
  power: 'off' | 'on';
  /** 'transmit' while PTT is held (simulator PTT). Same field name the link hook uses. */
  mode: 'standby' | 'transmit';
  channel: number; // 1..CHANNEL_COUNT
  channels: Channel[];
  volume: number; // 0..VOLUME_MAX
  powerIdx: number; // index into TX_POWER_W
  /** 'settings' is the setting page of the selected channel (opened with the oval key). Assumed layout. */
  screen: 'main' | 'settings';
  /** Row cursor on the settings page: index into SETTING_ROWS. */
  cursor: number;
  /** Other simulator instances heard over the link: sender id -> frequency in Hz. Simulator-specific. */
  heard: Record<string, number>;
};

/** Rows of the channel setting page. F sets the frequency; H, C and S are defined one by one (not simulated yet). */
export const SETTING_ROWS = [
  { key: 'F', label: 'FREQ' },
  { key: 'H', label: 'HOPPING FREQ' },
  { key: 'C', label: 'ENCRYPTION' },
  { key: 'S', label: 'SECURE' },
] as const;
/** Channels shown on the main screen, the selected one in the middle. Assumed layout. */
export const CHANNEL_WINDOW = 5;

export type Prc2100vAction =
  | { type: 'settings-toggle' }
  | { type: 'power-toggle' }
  | { type: 'ptt'; down: boolean }
  | { type: 'channel'; delta: -1 | 1 }
  | { type: 'tune'; delta: -1 | 1 } // one channel-spacing step on the active channel
  | { type: 'cycle-mode' }
  | { type: 'cycle-power' }
  | { type: 'cycle-spacing' }
  | { type: 'volume'; delta: -1 | 1 }
  | { type: 'rx-signal'; from: string; frequencyHz: number; active: boolean };

/** Default channel contents are Assumed: 500 kHz apart from 30.000 MHz. */
export function defaultChannels(): Channel[] {
  return Array.from({ length: CHANNEL_COUNT }, (_, i) => ({
    frequencyHz: FREQ_MIN_HZ + i * 500_000,
    mode: 'FF' as Mode,
    spacingHz: 25_000,
  }));
}

export const initialState: Prc2100vState = {
  power: 'off',
  mode: 'standby',
  channel: 1,
  channels: defaultChannels(),
  volume: 5,
  powerIdx: 0,
  screen: 'main',
  cursor: 0,
  heard: {},
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function activeChannel(s: Prc2100vState): Channel {
  return s.channels[s.channel - 1];
}

export function activeFrequencyHz(s: Prc2100vState): number {
  return activeChannel(s).frequencyHz;
}

export function isReceiving(s: Prc2100vState): boolean {
  if (s.power !== 'on' || s.mode === 'transmit') return false;
  const hz = activeFrequencyHz(s);
  return Object.values(s.heard).some((h) => h === hz);
}

/** Largest valid frequency on this spacing grid (grid starts at FREQ_MIN_HZ). */
function snap(hz: number, spacingHz: number): number {
  const steps = Math.round((clamp(hz, FREQ_MIN_HZ, FREQ_MAX_HZ) - FREQ_MIN_HZ) / spacingHz);
  let out = FREQ_MIN_HZ + steps * spacingHz;
  if (out > FREQ_MAX_HZ) out -= spacingHz;
  return out;
}

function withChannel(s: Prc2100vState, patch: Partial<Channel>): Prc2100vState {
  const channels = s.channels.slice();
  channels[s.channel - 1] = { ...activeChannel(s), ...patch };
  return { ...s, channels };
}

export function reduce(s: Prc2100vState, a: Prc2100vAction): Prc2100vState {
  if (a.type === 'rx-signal') {
    const heard = { ...s.heard };
    if (a.active) heard[a.from] = a.frequencyHz;
    else delete heard[a.from];
    return { ...s, heard };
  }
  if (a.type === 'power-toggle') {
    return s.power === 'off' ? { ...s, power: 'on' } : { ...s, power: 'off', mode: 'standby', screen: 'main', cursor: 0 };
  }
  if (s.power !== 'on') return s; // every other control is inert while off
  switch (a.type) {
    case 'ptt':
      return { ...s, mode: a.down ? 'transmit' : 'standby' };
    case 'volume':
      return { ...s, volume: clamp(s.volume + a.delta, 0, VOLUME_MAX) };
    case 'cycle-power':
      return { ...s, powerIdx: (s.powerIdx + 1) % TX_POWER_W.length };
  }
  if (s.mode === 'transmit') return s; // no retuning while keyed
  if (a.type === 'settings-toggle') return { ...s, screen: s.screen === 'main' ? 'settings' : 'main', cursor: 0 };
  if (s.screen === 'settings') {
    // On the setting page the pad up/down moves the row cursor, left/right tunes on the frequency row, and the mode
    // key (otherwise label-only) toggles the channel spacing, which used to be on the oval key.
    if (a.type === 'channel') return { ...s, cursor: clamp(s.cursor - a.delta, 0, SETTING_ROWS.length - 1) };
    if (a.type === 'tune' && s.cursor !== 0) return s;
    if (a.type === 'cycle-mode') a = { type: 'cycle-spacing' };
  }
  switch (a.type) {
    case 'channel':
      return { ...s, channel: ((s.channel - 1 + a.delta + CHANNEL_COUNT) % CHANNEL_COUNT) + 1 };
    case 'tune': {
      const c = activeChannel(s);
      return withChannel(s, { frequencyHz: snap(c.frequencyHz + a.delta * c.spacingHz, c.spacingHz) });
    }
    case 'cycle-mode': {
      const c = activeChannel(s);
      return withChannel(s, { mode: MODES[(MODES.indexOf(c.mode) + 1) % MODES.length] });
    }
    case 'cycle-spacing': {
      const c = activeChannel(s);
      const spacingHz = c.spacingHz === 25_000 ? 12_500 : 25_000;
      return withChannel(s, { spacingHz, frequencyHz: snap(c.frequencyHz, spacingHz) });
    }
  }
  return s;
}

/** "30.000" MHz; four decimals only when the 12.5 kHz grid needs them. */
export function formatMhz(hz: number): string {
  return (hz / 1_000_000).toFixed(hz % 1000 === 0 ? 3 : 4);
}

export type LcdChannelRow = { text: string; freq: string; selected: boolean };
export type LcdSettingRow = { key: string; label: string; value: string; selected: boolean };
export type Prc2100vLcd = {
  on: true;
  screen: 'main' | 'settings';
  title: string;
  freq: string;
  channel: string;
  mode: string;
  spacing: string;
  volume: string;
  powerBars: number;
  state: 'TX' | 'RX' | '';
  /** Main screen: CHANNEL_WINDOW channels, the selected one in the middle. Slots outside 1..CHANNEL_COUNT are blank. */
  channels: LcdChannelRow[];
  /** Setting page rows. */
  settings: LcdSettingRow[];
};

/** Text the LCD shows. Field choice is Assumed (the photo shows the main frequency only). */
export function renderLcd(s: Prc2100vState): Prc2100vLcd | null {
  if (s.power !== 'on') return null;
  const c = activeChannel(s);
  const half = Math.floor(CHANNEL_WINDOW / 2);
  const ch3 = (n: number) => String(n).padStart(3, '0');
  return {
    on: true,
    screen: s.screen,
    title: s.screen === 'settings' ? `CH ${ch3(s.channel)} SETTINGS` : 'SPECTRE',
    freq: formatMhz(c.frequencyHz),
    channel: `CH ${ch3(s.channel)}`,
    mode: c.mode === 'DIGITAL' ? 'DIG' : c.mode,
    spacing: c.spacingHz === 12_500 ? '12.5K' : '25K',
    volume: `VOL ${s.volume}`,
    powerBars: s.powerIdx + 1,
    state: s.mode === 'transmit' ? 'TX' : isReceiving(s) ? 'RX' : '',
    channels: Array.from({ length: CHANNEL_WINDOW }, (_, i) => {
      const n = s.channel + i - half;
      if (n < 1 || n > CHANNEL_COUNT) return { text: '', freq: '', selected: false };
      return { text: ch3(n), freq: formatMhz(s.channels[n - 1].frequencyHz), selected: i === half };
    }),
    settings: SETTING_ROWS.map((r, i) => ({
      key: r.key,
      label: r.label,
      value: i === 0 ? `${formatMhz(c.frequencyHz)} MHz ${c.spacingHz === 12_500 ? '12.5K' : '25K'}` : '',
      selected: i === s.cursor,
    })),
  };
}
