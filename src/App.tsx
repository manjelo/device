import { useEffect, useState } from 'react';
import { DeviceDetails } from './components/DeviceDetails';
import { RadioView } from './components/RadioView';
import { ViewSwitcher } from './components/ViewSwitcher';
import type { ViewId } from './components/controlInfo';
import { useRadio } from './hooks/useRadio';
import { useSound } from './hooks/useSound';

type Theme = 'light' | 'dark';
const THEME_KEY = 'radiosim-theme';

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

export default function App() {
  const radio = useRadio();
  const sound = useSound(radio.state.sound);
  const [view, setView] = useState<ViewId>('front');
  const [theme, setTheme] = useState<Theme>(initialTheme);

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
          </div>
        </section>

        <DeviceDetails lastControl={radio.lastControl} />
      </main>
    </div>
  );
}
