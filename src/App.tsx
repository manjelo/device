import { useEffect, useState } from 'react';
import { DeviceDetails } from './components/DeviceDetails';
import { RadioView } from './components/RadioView';
import { ViewSwitcher } from './components/ViewSwitcher';
import type { ViewId } from './components/controlInfo';
import { useRadio } from './hooks/useRadio';
import { useSound } from './hooks/useSound';
import { useVoice } from './hooks/useVoice';
import type { LinkMode, LinkSettings } from './hooks/useLink';

type Theme = 'light' | 'dark';
const THEME_KEY = 'radiosim-theme';
const LINK_KEY = 'radiosim-link';
const LINK_MODES: LinkMode[] = ['off', 'tabs', 'network'];
const LINK_LABEL: Record<LinkMode, string> = { off: 'off', tabs: 'this browser', network: 'network' };

function initialLink(): LinkSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(LINK_KEY) ?? 'null') as Partial<LinkSettings> | null;
    if (stored && LINK_MODES.includes(stored.mode as LinkMode)) {
      return { mode: stored.mode as LinkMode };
    }
  } catch {
    // Storage can be blocked or hold junk. Use the default.
  }
  return { mode: 'tabs' };
}


function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage can be blocked. Fall back to the system preference.
  }
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function linkStatusText(link: LinkSettings, status: string, mic: string, framesIn: number): string {
  if (link.mode === 'off') return 'Link off.';
  if (link.mode === 'tabs') return 'Link: tabs of this browser (no voice).';
  if (status !== 'connected') return `Network ${status === 'offline' ? 'offline, retrying' : 'connecting'}.`;
  const micText =
    mic === 'ready' ? 'mic ready' : mic === 'blocked' ? 'mic blocked (listen only)' : mic === 'unsupported' ? 'voice unsupported (needs https)' : 'mic starting';
  return `Network connected, ${micText}, audio in ${framesIn}.`;
}

export default function App() {
  const [link, setLink] = useState<LinkSettings>(initialLink);
  const radio = useRadio(link);
  const voice = useVoice(radio.state, radio.link.transport, link.mode === 'network');
  const sound = useSound(radio.state.sound);
  const [view, setView] = useState<ViewId>('front');
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    try {
      localStorage.setItem(LINK_KEY, JSON.stringify(link));
    } catch {
      // Ignore: the link settings still apply for this page load.
    }
  }, [link]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore: the theme still applies for this page load.
    }
  }, [theme]);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>
            RadioSim <span className="rs-sim-tag">Simulator</span>
          </h1>
          <p className="rs-muted">
            Simulated Harris Falcon III AN/PRC-152 (original model). An approximation built from incomplete sources. Not a
            device reference. No RF is transmitted.
          </p>
        </div>
        <button
          type="button"
          className="rs-theme-btn"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? 'Light theme' : 'Dark theme'}
        </button>
      </header>

      <main className="app-main">
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
            <button
              type="button"
              className="rs-view-btn"
              aria-pressed={link.mode !== 'off'}
              onClick={() =>
                setLink((l) => ({ ...l, mode: LINK_MODES[(LINK_MODES.indexOf(l.mode) + 1) % LINK_MODES.length] }))
              }
            >
              {`Link: ${LINK_LABEL[link.mode]}`}
            </button>
            <p className="rs-muted rs-small" role="status" aria-label="Link status">
              {linkStatusText(link, radio.link.status, voice.status, voice.framesIn)}
            </p>
            <p className="rs-muted rs-small">
              Link is a simulator feature. A radio hears another one that is keyed on the same frequency. Network mode
              carries push-to-talk voice through a relay to everyone else using the site. No RF.
            </p>
          </div>
        </section>

        <DeviceDetails lastControl={radio.lastControl} />
      </main>
    </div>
  );
}
