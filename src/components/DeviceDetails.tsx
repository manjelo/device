import type { ControlId } from '../radio';
import { ControlLegend } from './ControlLegend';
import { InfoPanel } from './InfoPanel';

/**
 * Secondary information, kept out of the way of the radio. Closed by default so the page reads as a device simulator.
 * Nothing is removed: control status, accuracy, shortcuts and the technical notes are all here.
 */
export function DeviceDetails({ lastControl }: { lastControl: ControlId | null }) {
  return (
    <details className="rs-details">
      <summary>
        Control status, shortcuts and technical notes <span className="rs-sim-tag">Simulator</span>
      </summary>
      <div className="rs-details__body">
        <InfoPanel lastControl={lastControl} />
        <ControlLegend />
        <section className="rs-panel" aria-labelledby="notes-title">
          <h2 id="notes-title">Technical notes</h2>
          <ul className="rs-notes">
            <li>The radio is an approximation built from incomplete sources. It is not a device reference.</li>
            <li>No RF is transmitted. Sound, if enabled, is a synthesized simulator tone, not radio audio. Off by default.</li>
            <li>LCD layout and power-on timing are simulator placeholders (Unknown).</li>
            <li>
              Menus: only keys 7 and 8 as OPT and PGM, and the PGM path System Preset Settings, then System Presets, come from a
              game-mod description (secondary source). Every other menu entry is a simulator choice. See
              docs/device-functionality-v5.md.
            </li>
            <li>
              Power, volume and squelch are visible controls on the Top view. The front view has no invisible hit targets.
            </li>
          </ul>
        </section>
      </div>
    </details>
  );
}
