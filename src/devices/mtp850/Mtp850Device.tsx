import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode, type WheelEvent } from 'react';
import { LinkControls } from '../../components/LinkControls';
import { linkStatusText } from '../../components/linkStatus';
import type { LinkSettings } from '../../hooks/useLink';
import { useVoice, type VoiceAdapter } from '../../hooks/useVoice';
import { VOLUME_MAX, isReceiving, lcdSummary, linkFrequencyHz, renderLcd, type Mtp850Action, type Mtp850State } from './logic';
import { useMtp850 } from './useMtp850';

const VOICE: VoiceAdapter<Mtp850State> = {
  frequencyHz: linkFrequencyHz,
  receiving: isReceiving,
  transmitting: (s) => s.mode === 'transmit',
  gain: (s) => (s.power === 'on' ? s.volume / VOLUME_MAX : 0),
};

const LONG_PRESS_MS = 800;

const KEYS: { digit: string; letters: string }[] = [
  { digit: '1', letters: '!' }, { digit: '2', letters: 'abc' }, { digit: '3', letters: 'def' },
  { digit: '4', letters: 'ghi' }, { digit: '5', letters: 'jkl' }, { digit: '6', letters: 'mno' },
  { digit: '7', letters: 'pqrs' }, { digit: '8', letters: 'tuv' }, { digit: '9', letters: 'wxyz' },
];

type Row = { control: string; does: string; status: string; keys: string };
const ROWS: Row[] = [
  { control: 'Rotary knob (top)', does: 'Select talk group (click left / right half, wheel)', status: 'Verified-public-doc (talk group selector and volume control); volume use not simulated', keys: '[ and ]' },
  { control: 'Emergency button (top, orange)', does: 'Toggle emergency: display turns red', status: 'Verified-public-doc (button, red display); toggling Assumed', keys: 'E' },
  { control: 'PTT (left edge)', does: 'Hold to transmit on the link', status: 'Verified-public-doc (large PTT button)', keys: 'T (hold)' },
  { control: 'Navigation up / down', does: 'Volume', status: 'Assumed', keys: 'Arrow up / down' },
  { control: 'Navigation left / right', does: 'Previous / next talk group', status: 'Assumed', keys: 'Arrow left / right' },
  { control: 'MENU', does: 'Switch TMO / DMO (the real MENU opens menus; not simulated)', status: 'Assumed', keys: 'M' },
  { control: 'Digits 1-9, 0', does: 'Type a talk group number', status: 'Assumed', keys: '0-9' },
  { control: 'Call key (green)', does: 'Go to the typed talk group', status: 'Assumed', keys: 'Enter' },
  { control: 'End / power key (red)', does: 'Short: clear entry. Hold: power off. Short press while off: power on', status: 'Verified-public-doc (power, end, home key); behaviour Assumed', keys: 'P toggles power, Esc / Backspace clears entry' },
  { control: 'Softkeys, * and #, side programmable buttons', does: 'Not interactive', status: 'Verified-photo (placement); function Unknown', keys: '-' },
];

function Ctl({ label, role = 'button', down, up, wheel, onActivate, children, id, extra }: {
  label: string; role?: string; id: string; down?: (e: PointerEvent) => void; up?: (e: PointerEvent) => void; wheel?: (e: WheelEvent) => void;
  onActivate?: () => void; children: ReactNode; extra?: Record<string, string | number>;
}) {
  return (
    <g
      data-control={id}
      role={role}
      tabIndex={0}
      aria-label={label}
      className="p21-ctl"
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onWheel={wheel}
      onKeyDown={(e: KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && onActivate) { e.preventDefault(); e.stopPropagation(); onActivate(); }
      }}
      {...extra}
    >
      {children}
    </g>
  );
}

export function Mtp850Device({ link, onToggleLink }: { link: LinkSettings; onToggleLink: () => void }) {
  const radio = useMtp850(link);
  const { state, send } = radio;
  const voice = useVoice(state, radio.link.transport, link.mode === 'network', VOICE);
  const lcd = renderLcd(state);
  const on = state.power === 'on';
  const endTimer = useRef<number | undefined>(undefined);
  const endFired = useRef(false);
  const act = (a: Mtp850Action) => () => send(a);

  const endDown = () => {
    endFired.current = false;
    endTimer.current = window.setTimeout(() => { endFired.current = true; send({ type: 'power-off' }); }, LONG_PRESS_MS);
  };
  const endUp = () => {
    window.clearTimeout(endTimer.current);
    if (!endFired.current) send(on ? { type: 'end' } : { type: 'power-on' });
  };

  return (
    <>
      <section className="radio-panel m850-panel" aria-label="Radio">
        <svg viewBox="0 0 300 640" role="group" aria-label="Motorola MTP850 front" className="m850-svg">
          {/* Antenna with integrated GPS */}
          <rect x="190" y="8" width="24" height="136" rx="11" fill="#15171a" stroke="#0a0b0c" />
          <text x="202" y="80" fontSize="12" fontWeight="700" fill="#3b3f46" textAnchor="middle" transform="rotate(-90 202 80)" fontFamily="system-ui, sans-serif" aria-hidden="true">GPS</text>
          {/* Body */}
          <rect x="60" y="130" width="180" height="486" rx="28" fill="#1c1e22" stroke="#0b0c0e" strokeWidth="2" />
          {/* Rotary knob (top) */}
          <Ctl id="knob" label={`Rotary knob, talk group ${on ? (state.net === 'TMO' ? state.tmoGroup : state.dmoGroup) : ''}`} role="slider"
            down={(e) => { const b = (e.currentTarget as SVGGElement).getBoundingClientRect(); send({ type: 'knob', delta: e.clientX < b.left + b.width / 2 ? -1 : 1 }); }}
            wheel={(e) => send({ type: 'knob', delta: e.deltaY < 0 ? 1 : -1 })}
            extra={{ 'aria-valuemin': 1, 'aria-valuemax': state.net === 'TMO' ? 2048 : 1024, 'aria-valuenow': state.net === 'TMO' ? state.tmoGroup : state.dmoGroup }}>
            <rect x="80" y="94" width="52" height="44" rx="8" fill="#26292e" stroke="#0b0c0e" />
            {Array.from({ length: 9 }, (_, i) => <line key={i} x1={86 + i * 5.5} x2={86 + i * 5.5} y1="100" y2="132" stroke="#14161a" strokeWidth="2" />)}
          </Ctl>
          {/* Emergency button (top, orange) */}
          <Ctl id="emergency" label={`Emergency button, ${state.emergency ? 'active' : 'inactive'}`} down={act({ type: 'emergency' })} onActivate={act({ type: 'emergency' })}
            extra={{ 'aria-pressed': state.emergency ? 'true' : 'false' }}>
            <rect x="136" y="106" width="44" height="34" fill="transparent" />
            <rect x="142" y="120" width="30" height="12" rx="5" fill="#e8741c" stroke="#8a420d" />
          </Ctl>
          {/* Speaker grille and logo */}
          {[0, 1, 2].map((r) => Array.from({ length: 9 }, (_, c) => <circle key={`${r}-${c}`} cx={100 + c * 12.5} cy={152 + r * 9} r="2.6" fill="#0c0d0f" />))}
          <circle cx="104" cy="196" r="9" fill="#e9e9e9" /><text x="104" y="200" fontSize="10" fontWeight="700" textAnchor="middle" fill="#1c1e22" aria-hidden="true">M</text>
          <text x="120" y="200" fontSize="13" fontWeight="800" fill="#e9e9e9" fontFamily="system-ui, sans-serif" aria-hidden="true">MOTOROLA</text>
          <text x="196" y="209" fontSize="8" fontWeight="700" fill="#cfcfcf" textAnchor="end" fontFamily="system-ui, sans-serif" aria-hidden="true">MTP850</text>
          {/* Display */}
          <rect x="86" y="216" width="128" height="128" rx="9" fill="#2a2d33" stroke="#3b3f47" strokeWidth="2" />
          <defs>
            <linearGradient id="m850-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b78b8" /><stop offset="1" stopColor="#0f2a4a" /></linearGradient>
          </defs>
          <rect x="94" y="224" width="112" height="112" rx="2" fill={!lcd ? '#0a0b0d' : lcd.emergency ? '#b3121c' : 'url(#m850-wall)'} />
          {lcd && (
            <g fontFamily="system-ui, sans-serif" fill="#f4f7fb" aria-hidden="true">
              <text x="100" y="236" fontSize="9" fontWeight="700">{lcd.state}</text>
              <text x="200" y="236" fontSize="9" fontWeight="700" textAnchor="end">{lcd.net}</text>
              {lcd.emergency && <text x="150" y="256" fontSize="11" fontWeight="800" textAnchor="middle">EMERGENCY</text>}
              <text x="150" y="276" fontSize="12" textAnchor="middle">{lcd.folder}</text>
              <text x="150" y="294" fontSize="14" fontWeight="700" textAnchor="middle">{lcd.group}</text>
              <text x="150" y="312" fontSize="10" textAnchor="middle">{lcd.notice ?? (lcd.entry ? `> ${lcd.entry}` : '')}</text>
              <rect x="94" y="318" width="112" height="18" fill="#1f6fb8" />
              <text x="100" y="331" fontSize="10" fontWeight="700">{lcd.softLeft}</text>
              <text x="200" y="331" fontSize="10" fontWeight="700" textAnchor="end">{lcd.softRight}</text>
            </g>
          )}
          {/* Softkeys and MENU (function Unknown / Assumed) */}
          <circle cx="102" cy="368" r="8" fill="#2c3036" stroke="#0b0c0e" /><circle cx="198" cy="368" r="8" fill="#2c3036" stroke="#0b0c0e" />
          <Ctl id="menu" label="MENU key (assumed: switch TMO / DMO)" down={act({ type: 'menu' })} onActivate={act({ type: 'menu' })}>
            <rect x="120" y="357" width="60" height="22" rx="9" fill="#2c3036" stroke="#0b0c0e" />
            <text x="150" y="372" fontSize="10" fontWeight="700" fill="#cfd3da" textAnchor="middle" aria-hidden="true">MENU</text>
          </Ctl>
          {/* Call key, navigation, end/power key */}
          <Ctl id="call" label="Call key (assumed: go to typed talk group)" down={act({ type: 'call' })} onActivate={act({ type: 'call' })}>
            <rect x="72" y="394" width="38" height="52" rx="16" fill="#23292a" stroke="#0b0c0e" />
            <text x="91" y="427" fontSize="22" fill="#5fc8b0" textAnchor="middle" aria-hidden="true">✆</text>
          </Ctl>
          <ellipse cx="150" cy="420" rx="36" ry="28" fill="#202327" stroke="#0b0c0e" strokeWidth="2" />
          <Ctl id="nav-up" label="Navigation up (assumed: volume up)" down={act({ type: 'nav', dir: 'up' })} onActivate={act({ type: 'nav', dir: 'up' })}><rect x="130" y="392" width="40" height="16" fill="transparent" /><polygon points="150,396 144,404 156,404" fill="#8d939d" /></Ctl>
          <Ctl id="nav-down" label="Navigation down (assumed: volume down)" down={act({ type: 'nav', dir: 'down' })} onActivate={act({ type: 'nav', dir: 'down' })}><rect x="130" y="432" width="40" height="16" fill="transparent" /><polygon points="150,444 144,436 156,436" fill="#8d939d" /></Ctl>
          <Ctl id="nav-left" label="Navigation left (assumed: previous talk group)" down={act({ type: 'nav', dir: 'left' })} onActivate={act({ type: 'nav', dir: 'left' })}><rect x="114" y="408" width="16" height="24" fill="transparent" /><polygon points="118,420 126,414 126,426" fill="#8d939d" /></Ctl>
          <Ctl id="nav-right" label="Navigation right (assumed: next talk group)" down={act({ type: 'nav', dir: 'right' })} onActivate={act({ type: 'nav', dir: 'right' })}><rect x="170" y="408" width="16" height="24" fill="transparent" /><polygon points="182,420 174,414 174,426" fill="#8d939d" /></Ctl>
          <Ctl id="end" label={`End and power key, ${on ? 'on' : 'off'} (hold to power off)`} down={endDown} up={endUp}
            onActivate={act({ type: 'power-toggle' })}>
            <rect x="190" y="394" width="38" height="52" rx="16" fill="#2a2121" stroke="#0b0c0e" />
            <text x="209" y="427" fontSize="20" fill="#e0452d" textAnchor="middle" aria-hidden="true">⏻</text>
          </Ctl>
          {/* Keypad */}
          {KEYS.map((k, i) => (
            <Ctl key={k.digit} id={`key-${k.digit}`} label={`Key ${k.digit}`} down={act({ type: 'digit', digit: k.digit })} onActivate={act({ type: 'digit', digit: k.digit })}>
              <rect x={78 + (i % 3) * 50} y={464 + Math.floor(i / 3) * 36} width="44" height="28" rx="10" fill="#2a2d33" stroke="#0b0c0e" />
              <text x={90 + (i % 3) * 50} y={483 + Math.floor(i / 3) * 36} fontSize="15" fontWeight="700" fill="#e1e4ea" aria-hidden="true">{k.digit}</text>
              <text x={102 + (i % 3) * 50} y={483 + Math.floor(i / 3) * 36} fontSize="8" fill="#9aa0aa" aria-hidden="true">{k.letters}</text>
            </Ctl>
          ))}
          <rect x="78" y="572" width="44" height="28" rx="10" fill="#2a2d33" stroke="#0b0c0e" /><text x="94" y="592" fontSize="16" fontWeight="700" fill="#e1e4ea" aria-hidden="true">*</text>
          <Ctl id="key-0" label="Key 0" down={act({ type: 'digit', digit: '0' })} onActivate={act({ type: 'digit', digit: '0' })}>
            <rect x="128" y="572" width="44" height="28" rx="10" fill="#2a2d33" stroke="#0b0c0e" />
            <text x="138" y="591" fontSize="15" fontWeight="700" fill="#e1e4ea" aria-hidden="true">0</text><text x="150" y="591" fontSize="7" fill="#9aa0aa" aria-hidden="true">+next</text>
          </Ctl>
          <rect x="178" y="572" width="44" height="28" rx="10" fill="#2a2d33" stroke="#0b0c0e" /><text x="194" y="592" fontSize="15" fontWeight="700" fill="#e1e4ea" aria-hidden="true">#</text>
          {/* Left edge: programmable side buttons (function Unknown) and PTT */}
          <rect x="52" y="222" width="9" height="36" rx="3" fill="#2f8a78" />
          <Ctl id="ptt" label="Push to talk (left edge), hold" down={(e) => { (e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId); send({ type: 'ptt', down: true }); }} up={() => send({ type: 'ptt', down: false })}
            onActivate={act({ type: 'ptt', down: true })}>
            <rect x="34" y="262" width="34" height="84" fill="transparent" />
            <rect x="50" y="266" width="13" height="76" rx="5" fill="#101215" stroke="#3b3f47" />
          </Ctl>
          <rect x="52" y="352" width="9" height="36" rx="3" fill="#24272c" stroke="#3b3f47" />
          {/* Right edge: audio accessory connector */}
          <rect x="239" y="440" width="7" height="44" rx="3" fill="#101215" stroke="#3b3f47" />
        </svg>

        <p role="status" aria-label="Display text" className="rs-muted rs-small">{lcdSummary(state)}</p>
        <LinkControls link={link} onToggle={onToggleLink} statusText={linkStatusText(link, radio.link.status, voice.status, voice.framesIn)} />
      </section>

      <details className="rs-details">
        <summary>MTP850 controls and accuracy</summary>
        <p className="rs-muted rs-small">
          Built from the public Motorola MTP850 brochure and its annotated front photograph. No manual was available, so key
          functions beyond the printed labels are Assumed and there are no menus. This is the plain MTP850, not the MTP850 Ex.
          No TETRA network, trunking, encryption or GPS is simulated. Not affiliated with or endorsed by Motorola.
        </p>
        <table className="p21-table">
          <thead><tr><th>Control</th><th>Simulated function</th><th>Accuracy</th><th>Keyboard</th></tr></thead>
          <tbody>{ROWS.map((r) => <tr key={r.control}><td>{r.control}</td><td>{r.does}</td><td>{r.status}</td><td>{r.keys}</td></tr>)}</tbody>
        </table>
      </details>
    </>
  );
}
