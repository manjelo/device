import type { CSSProperties } from 'react';
import { insetRows, type LcdFrame, type Screen } from '../radio';

/** Simulator key hints shown under the LCD. Simulator conveniences, not device text. */
const HINTS: Partial<Record<Screen, string>> = {
  main: 'Key 7 opens OPT, key 8 opens PGM. PRE + and PRE - change the preset.',
  menu: 'PRE + / PRE - or the channel dial move the cursor. ENT selects. CLR goes back.',
  edit: 'Type six digits (MMM.KKK MHz). ENT checks the entry. CLR clears it, then goes back.',
  confirm: 'ENT=yes CLR=no',
  locked: 'Keypad locked. Press CLR, then ENT, to unlock. Power, PTT and volume still work.',
};

/** Same brightness rule for the in-radio LCD and the enlarged preview, so the two always match. */
function brightnessStyle(frame: LcdFrame): CSSProperties | undefined {
  return frame.brightness === 0 ? undefined : { filter: `brightness(${(0.55 + 0.1 * frame.brightness).toFixed(2)})` };
}

// Usable width of the inset is about 49 container-query units (the window is 54.3 cqw minus 2 x 2.5 cqw padding).
// A monospace glyph is about 0.62 em wide plus 0.02 em letter-spacing (app.css), so a line of n characters
// fits at about 76 / n cqw.
const INSET_CHARS_PER_CQW = 76;

/** Font size for one inset line: the base size, reduced when the text would otherwise be clipped. */
function fitFontSize(text: string, baseCqw: number): string {
  const fit = INSET_CHARS_PER_CQW / Math.max(text.length, 1);
  return `${Math.min(baseCqw, fit).toFixed(2)}cqw`;
}

/**
 * Live display inside the radio's LCD window (the lcd-area rect in front.svg).
 * Shows two lines at most: the main row and the cursor, notice or indicator row. The full panel below stays the accessible status.
 */
export function LcdInset({ frame }: { frame: LcdFrame }) {
  const { main, second } = insetRows(frame);
  return (
    <div className="rs-screen-inset" aria-hidden="true" style={brightnessStyle(frame)}>
      {main && (
        <div className="rs-screen-inset__main" style={{ fontSize: fitFontSize(main.text, 4.03) }}>
          {main.text}
        </div>
      )}
      {second && (
        <div
          className={second.inverse ? 'rs-screen-inset__line rs-screen-inset__line--inverse' : 'rs-screen-inset__line'}
          style={{ fontSize: fitFontSize(second.text, 3.1) }}
        >
          {second.text}
        </div>
      )}
    </div>
  );
}

/**
 * LCD panel. PLACEHOLDER LAYOUT: the real display layout is Unknown.
 * Full detail panel below the radio (enlarged preview). The compact live display is LcdInset, drawn in the radio body.
 * Both are rendered from the same frame.
 */
export function Lcd({ frame }: { frame: LcdFrame }) {
  const { indicators } = frame;
  const hint = HINTS[frame.screen];
  return (
    <div className="rs-lcd-wrap">
      <div className="rs-lcd" role="status" aria-label="LCD, simulator placeholder layout" style={brightnessStyle(frame)}>
        {frame.rows.map((row, i) => {
          const cls = ['rs-lcd__row', row.size === 'large' ? 'rs-lcd__row--large' : '', row.inverse ? 'rs-lcd__row--inverse' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <div className={cls} key={i}>
              {row.text || ' '}
            </div>
          );
        })}
        {frame.screen !== 'off' && (
          <div className="rs-lcd__indicators">
            <span className="rs-lcd__ind rs-lcd__ind--on">{indicators.power ? 'PWR ON' : 'PWR'}</span>
            {indicators.tx && <span className="rs-lcd__ind rs-lcd__ind--on">TX</span>}
            {indicators.rx && <span className="rs-lcd__ind rs-lcd__ind--on">RX</span>}
            {indicators.monitor && <span className="rs-lcd__ind rs-lcd__ind--on">MON</span>}
            {indicators.locked && <span className="rs-lcd__ind rs-lcd__ind--on">LOCK</span>}
            {indicators.lowBattery && <span className="rs-lcd__ind rs-lcd__ind--on">LOW BAT</span>}
            <span className="rs-lcd__ind rs-lcd__ind--on">BAT {indicators.battery}%</span>
          </div>
        )}
      </div>
      <div className="rs-lcd-meta">
        <span className="rs-muted rs-small">{frame.label}</span>
        {frame.approximated && <span className="rs-badge">Approximated display</span>}
      </div>
      {hint && (
        <p className="rs-lcd-hint">
          <span className="rs-sim-tag">Simulator hint</span> {hint}
        </p>
      )}
    </div>
  );
}
