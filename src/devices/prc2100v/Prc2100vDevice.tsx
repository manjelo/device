import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode, type WheelEvent } from 'react';
import { LinkControls } from '../../components/LinkControls';
import { linkStatusText } from '../../components/linkStatus';
import type { LinkSettings } from '../../hooks/useLink';
import { useVoice, type VoiceAdapter } from '../../hooks/useVoice';
import { TX_POWER_W, VOLUME_MAX, activeFrequencyHz, isReceiving, scrambleSeed, renderLcd, type Prc2100vState } from './logic';
import { useProc2100v, type Prc2100vControl } from './useProc2100v';

const VOICE: VoiceAdapter<Prc2100vState> = {
  frequencyHz: activeFrequencyHz,
  receiving: isReceiving,
  transmitting: (s) => s.mode === 'transmit',
  gain: (s) => (s.power === 'on' ? s.volume / VOLUME_MAX : 0),
  scrambleSeed: scrambleSeed,
};

type Row = { control: string; does: string; status: string; keys: string };
const ROWS: Row[] = [
  { control: 'PWR switch', does: 'Power on / off', status: 'Verified-photo (label and position only)', keys: 'P' },
  { control: 'VOLUME', does: 'Audio level 0 to 10', status: 'Verified-photo (label); scale Assumed', keys: '[ and ]' },
  { control: 'Pad up / down', does: 'Previous / next memory channel (1 to 100), following the list on the LCD', status: 'Assumed function (channels Documented)', keys: 'Arrow up / down' },
  { control: 'Pad right / left', does: 'Tune one channel-spacing step up / down', status: 'Assumed function (range and spacing Documented)', keys: 'Arrow right / left' },
  { control: 'Square key', does: 'Back: leaves password entry, then the setting page', status: 'Assumed function', keys: 'B, Esc, Backspace' },
  { control: 'Round key', does: 'Cycle TX power 0.5, 5, 10 W', status: 'Assumed function (3 settings, 0.5 and 10 W Documented; 5 W Assumed)', keys: 'W' },
  { control: 'Wide (oval) key', does: 'Enter / select: opens the setting page of the selected channel; there it acts on the row (F: toggle spacing 25 / 12.5 kHz, H and C: on / off, S: set the password)', status: 'Assumed function and layout (H is a visual flag only; C encrypts and decrypts link voice; S adds a password)', keys: 'S, Enter' },
  { control: 'Pad on the setting page', does: 'Up / down moves the row. F: left / right tunes. H, C, S: left = off, right = on. S on opens the 4-digit password: up / down changes the digit, right moves on (last digit = done), wide key = done', status: 'Assumed function (spacings Documented)', keys: 'Arrows' },
  { control: 'PTT button (below the radio)', does: 'Hold to transmit on the link', status: 'Simulator feature: no PTT is visible on the front panel', keys: 'T (hold)' },
  { control: 'XMODE, RADIO, AMP, top-left connectors', does: 'Not interactive', status: 'Verified-photo (label and position only); function Unknown', keys: '-' },
];

function Ctl({ id, label, onPress, children, role = 'button', extra, handlers }: {
  id: Prc2100vControl; label: string; onPress: (id: Prc2100vControl, e: PointerEvent) => void; children: ReactNode; role?: string; extra?: Record<string, string | number>;
  handlers?: { onPointerMove?: (e: PointerEvent) => void; onPointerUp?: (e: PointerEvent) => void; onWheel?: (e: WheelEvent) => void };
}) {
  return (
    <g
      data-control={id}
      role={role}
      tabIndex={0}
      aria-label={label}
      className="p21-ctl"
      onPointerDown={(e) => onPress(id, e)}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPress(id, e as unknown as PointerEvent); }
      }}
      {...handlers}
      {...extra}
    >
      {children}
    </g>
  );
}

export function Prc2100vDevice({ link, onToggleLink }: { link: LinkSettings; onToggleLink: () => void }) {
  const radio = useProc2100v(link);
  const { state, press, ptt } = radio;
  const voice = useVoice(state, radio.link.transport, link.mode === 'network', VOICE);
  const lcd = renderLcd(state);
  const on = state.power === 'on';
  const lcdText = lcd
    ? `${lcd.title} ${lcd.freq} MHz ${lcd.channel} ${lcd.mode} ${lcd.spacing} ${lcd.volume} PWR ${TX_POWER_W[state.powerIdx]} W${lcd.state ? ` ${lcd.state}` : ''}${lcd.flags ? ` Options ${lcd.flags}` : ''}${lcd.screen === 'settings' ? ` Selected: ${lcd.settings.find((r) => r.selected)?.label} ${lcd.settings.find((r) => r.selected)?.value}` : ''}`
    : 'Display off';

  // Volume: drag up/down or use the wheel; a plain click steps left half down, right half up.
  const drag = useRef<{ y: number; carry: number; moved: boolean } | null>(null);
  const onPress = (id: Prc2100vControl, e: PointerEvent) => {
    if (id === 'volume' && typeof e.clientY === 'number' && e.pointerType !== undefined) {
      (e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId);
      drag.current = { y: e.clientY, carry: 0, moved: false };
      return;
    }
    press(id, 1);
  };
  const onVolumeMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    d.carry += d.y - e.clientY;
    d.y = e.clientY;
    while (Math.abs(d.carry) >= 12) {
      press('volume', d.carry > 0 ? 1 : -1);
      d.carry -= Math.sign(d.carry) * 12;
      d.moved = true;
    }
  };
  const onVolumeUp = (e: PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) {
      const box = (e.currentTarget as SVGGElement).getBoundingClientRect();
      press('volume', e.clientX < box.left + box.width / 2 ? -1 : 1);
    }
  };

  return (
    <>
      <section className="radio-panel p21-panel" aria-label="Radio">
        <svg viewBox="0 0 760 364" role="group" aria-label="Datron PRC2100V front panel" className="p21-svg">
          <rect x="0" y="0" width="760" height="364" rx="14" fill="#4c5342" />
          <rect x="0" y="30" width="30" height="260" rx="10" fill="#3b4133" />
          <rect x="730" y="30" width="30" height="260" rx="10" fill="#3b4133" />
          <rect x="30" y="240" width="700" height="112" rx="8" fill="#454c3b" stroke="#353b2e" />
          {/* Top-left connector and two capped connectors (function Unknown) */}
          <circle cx="88" cy="78" r="44" fill="#3d4433" stroke="#2c3226" strokeWidth="3" />
          <circle cx="88" cy="78" r="24" fill="#5b6350" stroke="#2c3226" strokeWidth="2" />
          <circle cx="92" cy="166" r="20" fill="#1d201a" /><circle cx="160" cy="160" r="17" fill="#1d201a" />
          {/* Capped connectors under the pad (function Unknown) */}
          <circle cx="540" cy="176" r="38" fill="#22251d" stroke="#2c3226" strokeWidth="3" />
          <circle cx="628" cy="170" r="26" fill="#22251d" stroke="#2c3226" strokeWidth="3" />
          {/* LCD */}
          <rect x="196" y="8" width="262" height="160" rx="10" fill="#363c2e" stroke="#262b21" strokeWidth="3" />
          <rect x="210" y="20" width="234" height="136" rx="3" fill={on ? '#a9c08f' : '#2a3326'} />
          {lcd && (
            <g fontFamily="ui-monospace, Menlo, Consolas, monospace" fill="#1c2a17" aria-hidden="true">
              <text x="216" y="38" fontSize={lcd.screen === 'settings' ? 11 : 13} fontWeight="700">{lcd.title}</text>
              {/* Status boxes. GPS and SIL are on the original display; they are never active here (not simulated). */}
              {['GPS', 'SIL'].map((t, i) => (
                <g key={t}>
                  <rect x={322 + i * 36} y="26" width="32" height="15" fill="none" stroke="#1c2a17" strokeOpacity=".45" />
                  <text x={338 + i * 36} y="38" fontSize="10" textAnchor="middle" fillOpacity=".45">{t}</text>
                </g>
              ))}
              <rect x="390" y="26" width="50" height="15" fill="#1c2a17" />
              <text x="415" y="38" fontSize="10" textAnchor="middle" fill="#a9c08f">{`${lcd.mode} ${lcd.spacing}`}</text>
              <line x1="212" x2="442" y1="46" y2="46" stroke="#1c2a17" strokeOpacity=".5" />
              {lcd.screen === 'main' ? (
                lcd.channels.map((c, i) => (
                  <g key={i} fontSize={c.selected ? 14 : 12} fontWeight={c.selected ? 700 : 400} fillOpacity={c.selected ? 1 : 0.65}>
                    {c.selected && <rect x="212" y={47 + i * 16} width="202" height="16" fill="#1c2a17" fillOpacity="1" />}
                    <g fill={c.selected ? '#a9c08f' : '#1c2a17'}>
                      <text x="218" y={59.5 + i * 16}>{c.text && `CH ${c.text}`}</text>
                      {c.opts.map((o, k) => (
                        <g key={o.key} fillOpacity={o.on ? 1 : 0.35}>
                          <text x={282 + k * 18} y={57 + i * 16} fontSize="9" fontWeight={o.on ? 700 : 400}>{o.key}</text>
                          <rect x={282 + k * 18} y={59.5 + i * 16} width="8" height="2" fillOpacity={o.on ? 1 : 0.5} />
                        </g>
                      ))}
                      <text x="408" y={59.5 + i * 16} textAnchor="end">{c.freq}</text>
                    </g>
                  </g>
                ))
              ) : (
                lcd.settings.map((r, i) => (
                  <g key={r.key} fontSize="13" fontWeight={r.selected ? 700 : 400}>
                    {r.selected && <rect x="212" y={52 + i * 18} width="202" height="17" fill="#1c2a17" />}
                    <g fill={r.selected ? '#a9c08f' : '#1c2a17'}>
                      <text x="218" y={65 + i * 18}>{`${r.key}: ${r.label}`}</text>
                      <text x="408" y={65 + i * 18} textAnchor="end">{r.value}</text>
                    </g>
                  </g>
                ))
              )}
              {/* Vertical scale on the right edge (follows volume; Assumed) */}
              {Array.from({ length: 10 }, (_, i) => (
                <rect key={i} x="418" y={112 - i * 6} width={i % 5 === 4 ? 18 : 12} height="3" fillOpacity={i < state.volume ? 1 : 0.2} />
              ))}
              <line x1="212" x2="442" y1="128" y2="128" stroke="#1c2a17" strokeOpacity=".5" />
              <text x="216" y="146" fontSize="12">{lcd.volume}</text>
              <text x="300" y="146" fontSize="12">PWR</text>
              <text x="438" y="146" fontSize="14" fontWeight="700" textAnchor="end">{lcd.state}</text>
              {[0, 1, 2].map((i) => (
                <rect key={i} x={336 + i * 12} y={146 - 6 - i * 3} width="8" height={6 + i * 3} fillOpacity={i < lcd.powerBars ? 1 : 0.2} />
              ))}
            </g>
          )}
          <text x="324" y="190" fontSize="15" fontWeight="700" fill="#d8dccf" textAnchor="middle" letterSpacing="3" fontFamily="system-ui, sans-serif">SPECTRE V</text>
          {/* Keys under the LCD (unlabeled on the original) */}
          <Ctl id="key-square" label="Square key (assumed: back)" onPress={onPress}><rect x="214" y="200" width="34" height="34" rx="5" fill="#2f3528" stroke="#20241b" strokeWidth="2" /></Ctl>
          <Ctl id="key-round" label="Round key (assumed: TX power)" onPress={onPress}><circle cx="288" cy="217" r="18" fill="#2f3528" stroke="#20241b" strokeWidth="2" /></Ctl>
          <Ctl id="key-oval" label="Wide key (assumed: enter / select)" onPress={onPress}><rect x="322" y="199" width="120" height="36" rx="18" fill="#2f3528" stroke="#20241b" strokeWidth="2" /></Ctl>
          {/* Four-way pad */}
          <Ctl id="pad-up" label="Pad up (assumed: previous channel)" onPress={onPress}><rect x="543" y="14" width="34" height="34" rx="6" transform="rotate(45 560 31)" fill="#343a2c" stroke="#20241b" strokeWidth="2" /></Ctl>
          <Ctl id="pad-left" label="Pad left (assumed: tune down)" onPress={onPress}><rect x="503" y="54" width="34" height="34" rx="6" transform="rotate(45 520 71)" fill="#343a2c" stroke="#20241b" strokeWidth="2" /></Ctl>
          <Ctl id="pad-right" label="Pad right (assumed: tune up)" onPress={onPress}><rect x="583" y="54" width="34" height="34" rx="6" transform="rotate(45 600 71)" fill="#343a2c" stroke="#20241b" strokeWidth="2" /></Ctl>
          <Ctl id="pad-down" label="Pad down (assumed: next channel)" onPress={onPress}><rect x="543" y="94" width="34" height="34" rx="6" transform="rotate(45 560 111)" fill="#343a2c" stroke="#20241b" strokeWidth="2" /></Ctl>
          {/* Lower row. Printed labels are on the original. */}
          <g fontSize="13" fontWeight="700" fill="#d8dccf" textAnchor="middle" fontFamily="system-ui, sans-serif" aria-hidden="true">
            <text x="82" y="270">PWR</text><text x="170" y="270">VOLUME</text><text x="262" y="270">XMODE</text>
            <text x="448" y="270">RADIO</text><text x="590" y="270">AMP</text>
          </g>
          <Ctl id="power" label={`PWR switch, ${on ? 'on' : 'off'}`} onPress={onPress} role="switch" extra={{ 'aria-checked': on ? 'true' : 'false' }}>
            <circle cx="82" cy="312" r="26" fill="#1d201a" />
            <line x1="82" y1="312" x2="82" y2={on ? 288 : 336} stroke="#0c0d0a" strokeWidth="12" strokeLinecap="round" />
          </Ctl>
          <Ctl id="volume" label="Volume" onPress={onPress} role="slider" handlers={{ onPointerMove: onVolumeMove, onPointerUp: onVolumeUp, onWheel: (e) => press('volume', e.deltaY < 0 ? 1 : -1) }} extra={{ 'aria-valuemin': 0, 'aria-valuemax': VOLUME_MAX, 'aria-valuenow': state.volume }}>
            <circle cx="170" cy="312" r="22" fill="#2a2e23" stroke="#14160f" strokeWidth="3" />
            <line x1="170" y1="312" x2={170 + 14 * Math.sin(((state.volume / VOLUME_MAX) * 270 - 135) * (Math.PI / 180))} y2={312 - 14 * Math.cos(((state.volume / VOLUME_MAX) * 270 - 135) * (Math.PI / 180))} stroke="#d8dccf" strokeWidth="3" strokeLinecap="round" />
          </Ctl>
          <circle cx="262" cy="314" r="32" fill="#8a8350" stroke="#5e5a36" strokeWidth="3" />
          <rect x="336" y="262" width="36" height="76" rx="4" fill="#9aa09a" stroke="#6b706b" />
          <circle cx="448" cy="314" r="34" fill="#15170f" stroke="#2c3226" strokeWidth="4" />
          <circle cx="590" cy="314" r="34" fill="#15170f" stroke="#2c3226" strokeWidth="4" />
        </svg>

        <p role="status" aria-label="Display text" className="rs-muted rs-small">{lcdText}</p>
        <LinkControls
          link={link}
          onToggle={onToggleLink}
          statusText={linkStatusText(link, radio.link.status, voice.status, voice.framesIn)}
          before={
            <button
          type="button"
          className="rs-view-btn p21-ptt"
          aria-label="Push to talk (simulator), hold"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); press('ptt', 1); }}
          onPointerUp={() => ptt(false)}
          onPointerCancel={() => ptt(false)}
          onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press('ptt', 1); } }}
          onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') ptt(false); }}
        >
          PTT (simulator): hold
        </button>
          }
        />
      </section>

      <details className="rs-details">
        <summary>PRC2100V controls and accuracy</summary>
        <p className="rs-muted rs-small">
          Built from the public Datron datasheet and one front-panel photograph. The operator manual was not available, so what
          the pad and the three keys do is Assumed, and the LCD fields are an approximation. Only the front panel is modelled.
          Mode and spacing do not change radio behaviour beyond the display. Not affiliated with or endorsed by Datron.
        </p>
        <table className="p21-table">
          <thead><tr><th>Control</th><th>Simulated function</th><th>Accuracy</th><th>Keyboard</th></tr></thead>
          <tbody>{ROWS.map((r) => <tr key={r.control}><td>{r.control}</td><td>{r.does}</td><td>{r.status}</td><td>{r.keys}</td></tr>)}</tbody>
        </table>
      </details>
    </>
  );
}

