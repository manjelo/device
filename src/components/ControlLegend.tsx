import { Fragment } from 'react';

// Keyboard shortcuts from keyToAction (src/radio/keypad.ts). Simulator conveniences, not device behavior.
const SHORTCUTS: [keys: string, action: string][] = [
  ['0 to 9', 'Keypad digits. On the main screen 7 opens OPT and 8 opens PGM.'],
  ['Enter', 'ENT (select, check an entry, apply)'],
  ['Backspace, Escape', 'CLR (clear the entry, go back)'],
  ['+, -', 'PRE + and PRE - (change preset, move the menu cursor)'],
  ['p', 'Power on or off'],
  ['t (hold)', 'Push to talk, simulated. Release the key to stop.'],
  ['ArrowUp, ArrowDown', 'Channel dial +1 or -1 (moves the menu cursor in a menu)'],
  ['ArrowRight, ArrowLeft', 'Volume knob +1 or -1'],
  ['PageUp, PageDown', 'Squelch knob +1 or -1'],
];

export function ControlLegend() {
  return (
    <section className="rs-panel" aria-labelledby="legend-title">
      <h2 id="legend-title">
        Keyboard shortcuts <span className="rs-sim-tag">Simulator</span>
      </h2>
      <p className="rs-muted">
        These keys are simulator conveniences, not documented radio behavior. No keyboard mapping is documented in the
        sources used for this simulator.
      </p>
      <dl className="rs-legend">
        {SHORTCUTS.map(([keys, action]) => (
          <div className="rs-legend__row" key={keys}>
            <dt>
              {keys.split(', ').map((key, i) => (
                <Fragment key={key}>
                  {i > 0 && ', '}
                  <kbd>{key}</kbd>
                </Fragment>
              ))}
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
      <p className="rs-muted">
        Knobs can also be turned with the mouse wheel or by dragging up and down on the knob (simulator convenience).
      </p>
    </section>
  );
}
