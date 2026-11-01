import { Suspense, lazy, useEffect, useState } from 'react';
import { Prc152Device } from './components/Prc152Device';
import type { LinkMode, LinkSettings } from './hooks/useLink';

// The PRC2100V is loaded on demand so the PRC-152 bundle does not grow.
const Mtp850Device = lazy(() => import('./devices/mtp850/Mtp850Device').then((m) => ({ default: m.Mtp850Device })));
const Prc2100vDevice = lazy(() => import('./devices/prc2100v/Prc2100vDevice').then((m) => ({ default: m.Prc2100vDevice })));

type Theme = 'light' | 'dark';
const THEME_KEY = 'radiosim-theme';
const LINK_KEY = 'radiosim-link';
const DEVICE_KEY = 'radiosim-device';
const LINK_MODES: LinkMode[] = ['off', 'network'];

type DeviceId = 'prc152' | 'prc2100v' | 'mtp850';
const DEVICES: { id: DeviceId; name: string; blurb: string }[] = [
  {
    id: 'prc152',
    name: 'Harris Falcon III AN/PRC-152',
    blurb: 'Simulated Harris Falcon III AN/PRC-152 (original model). An approximation built from incomplete sources. Not a device reference. No RF is transmitted.',
  },
  {
    id: 'prc2100v',
    name: 'Datron PRC2100V (Spectre V)',
    blurb: 'Simulated Datron PRC2100V tactical VHF manpack, front panel only. Built from a public datasheet and one photograph; most control functions are Assumed. Not a device reference. No RF is transmitted.',
  },
  {
    id: 'mtp850',
    name: 'Motorola MTP850 (TETRA)',
    blurb: 'Simulated Motorola MTP850 TETRA handheld (not the Ex variant), front panel only. Built from a public brochure; key functions beyond the printed labels are Assumed and there are no menus. Not a device reference. No RF is transmitted.',
  },
];

function initialDevice(): DeviceId {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('device');
    const stored = fromUrl ?? localStorage.getItem(DEVICE_KEY);
    if (DEVICES.some((d) => d.id === stored)) return stored as DeviceId;
  } catch {
    // Storage or URL access can fail. Use the default.
  }
  return 'prc152';
}

function initialLink(): LinkSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(LINK_KEY) ?? 'null') as Partial<LinkSettings> | null;
    if (stored && LINK_MODES.includes(stored.mode as LinkMode)) {
      return { mode: stored.mode as LinkMode };
    }
  } catch {
    // Storage can be blocked or hold junk. Use the default.
  }
  return { mode: 'network' };
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

export default function App() {
  const [link, setLink] = useState<LinkSettings>(initialLink);
  const [device, setDevice] = useState<DeviceId>(initialDevice);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const toggleLink = () =>
    setLink((l) => ({ ...l, mode: LINK_MODES[(LINK_MODES.indexOf(l.mode) + 1) % LINK_MODES.length] }));

  useEffect(() => {
    try {
      localStorage.setItem(LINK_KEY, JSON.stringify(link));
    } catch {
      // Ignore: the link settings still apply for this page load.
    }
  }, [link]);

  useEffect(() => {
    try {
      localStorage.setItem(DEVICE_KEY, device);
      const url = new URL(window.location.href);
      url.searchParams.set('device', device);
      window.history.replaceState(null, '', url);
    } catch {
      // Ignore: the device still applies for this page load.
    }
  }, [device]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore: the theme still applies for this page load.
    }
  }, [theme]);

  const current = DEVICES.find((d) => d.id === device) ?? DEVICES[0];

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>
            RadioSim <span className="rs-sim-tag">Simulator</span>
          </h1>
          <p className="rs-muted">{current.blurb}</p>
          <div className="rs-views rs-device-picker" role="group" aria-label="Device">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                className="rs-view-btn"
                aria-pressed={device === d.id}
                onClick={() => setDevice(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
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
        {device === 'prc152' ? (
          <Prc152Device key="prc152" link={link} onToggleLink={toggleLink} />
        ) : (
          <Suspense fallback={<p className="rs-muted">Loading device...</p>}>
            {device === 'mtp850' ? (
              <Mtp850Device key="mtp850" link={link} onToggleLink={toggleLink} />
            ) : (
              <Prc2100vDevice key="prc2100v" link={link} onToggleLink={toggleLink} />
            )}
          </Suspense>
        )}
      </main>
    </div>
  );
}
