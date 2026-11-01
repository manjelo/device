import { useState } from 'react';
import { DeviceDetails } from './DeviceDetails';
import { LinkControls } from './LinkControls';
import { linkStatusText } from './linkStatus';
import { RadioView } from './RadioView';
import { ViewSwitcher } from './ViewSwitcher';
import type { ViewId } from './controlInfo';
import type { LinkSettings } from '../hooks/useLink';
import { useRadio } from '../hooks/useRadio';
import { useSound } from '../hooks/useSound';
import { useVoice } from '../hooks/useVoice';

/** The Harris Falcon III AN/PRC-152 simulator: radio views, sound, link and details. */
export function Prc152Device({ link, onToggleLink }: { link: LinkSettings; onToggleLink: () => void }) {
  const radio = useRadio(link);
  const voice = useVoice(radio.state, radio.link.transport, link.mode === 'network');
  const sound = useSound(radio.state.sound);
  const [view, setView] = useState<ViewId>('front');

  return (
    <>
      <section className="radio-panel" aria-label="Radio">
        <ViewSwitcher view={view} onChange={setView} />
        <RadioView view={view} radio={radio} />
        <div className="rs-sound">
          <button
            type="button"
            className="rs-view-btn"
            aria-pressed={sound.enabled}
            disabled={sound.unavailable}
            onClick={sound.toggle}
          >
            {`Sound: ${sound.enabled ? 'on' : 'off'}`}
          </button>
          {sound.unavailable && <p className="rs-muted rs-small">Sound is not available in this browser.</p>}
          <LinkControls
            link={link}
            onToggle={onToggleLink}
            statusText={linkStatusText(link, radio.link.status, voice.status, voice.framesIn)}
          />
        </div>
      </section>

      <DeviceDetails lastControl={radio.lastControl} />
    </>
  );
}
