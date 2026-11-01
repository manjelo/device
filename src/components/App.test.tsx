import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { STARTUP_TICK_MS } from '../hooks/useRadio';
import { OVERLAY_MS } from '../radio/config';

// Records oscillators created by the sound hook, so tests can see whether a tone was synthesized.
const toneLog: string[] = [];

class FakeAudioContext {
  currentTime = 0;
  state = 'running';
  destination = {};
  resume() {
    return Promise.resolve();
  }
  suspend() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
  createOscillator() {
    toneLog.push('osc');
    return {
      type: 'sine',
      frequency: { setValueAtTime() {}, linearRampToValueAtTime() {} },
      connect() {},
      start() {},
      stop() {},
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
    };
  }
}

function control(container: HTMLElement, id: string): Element {
  const el = container.querySelector(`[data-control="${id}"]`);
  if (!el) throw new Error(`missing control ${id}`);
  return el;
}

/** Pointer press and release on a radio control, as a mouse or touch click does. */
function pressControl(container: HTMLElement, id: string): void {
  fireEvent.pointerDown(control(container, id));
  fireEvent.pointerUp(window);
}

function lcd(): HTMLElement {
  return screen.getByRole('status', { name: /placeholder/i });
}

/** Presses power and advances the placeholder startup timer, so the LCD reaches the main screen. */
function powerOnToMain(): void {
  fireEvent.keyDown(window, { key: 'p' });
  act(() => {
    vi.advanceTimersByTime(STARTUP_TICK_MS);
  });
}

describe('RadioSim UI', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    toneLog.length = 0;
  });

  it('renders the front view with its keypad and the LCD panel', () => {
    const { container } = render(<App />);
    // Keypad (12 keys), CLR, ENT, PRE + and PRE - (4), and the LCD window: 17 data-control elements, all visible.
    expect(container.querySelectorAll('svg [data-control]')).toHaveLength(17);
    expect(lcd()).toBeInTheDocument();
    expect(screen.getByText('Simulated LCD (layout approximated)')).toBeInTheDocument();
  });

  it('the front view has no power, volume or squelch control (they are on the top view)', () => {
    const { container } = render(<App />);
    for (const id of ['power', 'knob-volume', 'knob-squelch', 'fn-1', 'fn-4']) {
      expect(container.querySelector(`[data-control="${id}"]`)).toBeNull();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Top' }));
    for (const id of ['power', 'knob-volume', 'knob-squelch']) {
      expect(control(container, id)).toHaveAttribute('tabindex', '0');
    }
  });

  it('off screen shows only the blank panel: no indicators and no rows', () => {
    render(<App />);
    expect(lcd()).toBeInTheDocument();
    expect(lcd()).toBeEmptyDOMElement();
    for (const text of ['PWR', 'PWR ON', 'TX', 'RX', 'MON', 'LOCK', 'LOW BAT']) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/^BAT /)).not.toBeInTheDocument();
  });

  it('power on shows the PWR ON indicator as text', () => {
    render(<App />);
    powerOnToMain();
    expect(screen.getByText('PWR ON')).toBeInTheDocument();
    expect(screen.getByText('PWR ON')).toHaveClass('rs-lcd__ind--on');
    // Indicators appear only while they apply: TX shows during PTT and goes away on release.
    expect(screen.queryByText('TX')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 't' });
    expect(screen.getByText('TX')).toBeInTheDocument();
    fireEvent.keyUp(window, { key: 't' });
    expect(screen.queryByText('TX')).not.toBeInTheDocument();
  });

  it('renders four view buttons: Front, Left, Right, Top', () => {
    render(<App />);
    for (const name of ['Front', 'Left', 'Right', 'Top']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Front' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Side' })).not.toBeInTheDocument();
  });

  it('switches views: Left has the PTT switch, Right has no controls, Top has the controls and connectors', () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Left' }));
    expect(screen.getByRole('button', { name: 'Left' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Push-to-talk (PTT)' })).toBeInTheDocument();
    // The LCD panel stays visible in every view, so a power-on from the top view shows its state.
    expect(lcd()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Right' }));
    expect(container.querySelectorAll('svg [data-control]')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Top' }));
    // The top view has power, the function dial, volume, squelch, the antenna, and the top connector.
    expect(container.querySelectorAll('svg [data-control]')).toHaveLength(6);
    expect(control(container, 'power')).toBeInTheDocument();
    expect(control(container, 'knob-channel')).toBeInTheDocument();
    expect(control(container, 'knob-volume')).toBeInTheDocument();
    expect(control(container, 'knob-squelch')).toBeInTheDocument();
    expect(control(container, 'antenna')).not.toHaveAttribute('tabindex');
    expect(control(container, 'conn-top')).not.toHaveAttribute('tabindex');
  });

  it('clicking the power control on the top view shows the startup screen', () => {
    const { container } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Top' }));
    pressControl(container, 'power');
    expect(lcd()).toHaveTextContent('RADIOSIM STARTING');
    expect(screen.getByText('Approximated display')).toBeInTheDocument();
  });

  it('the startup tick advances to the main screen after about 1200 ms', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'p' });
    expect(lcd()).toHaveTextContent('RADIOSIM STARTING');
    act(() => {
      vi.advanceTimersByTime(STARTUP_TICK_MS - 1);
    });
    expect(lcd()).toHaveTextContent('RADIOSIM STARTING');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(lcd()).toHaveTextContent('PRESET 01');
  });

  it('power off during startup cancels the tick', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'p' });
    fireEvent.keyDown(window, { key: 'p' });
    act(() => {
      vi.advanceTimersByTime(STARTUP_TICK_MS * 2);
    });
    expect(screen.queryByText(/PRESET/)).not.toBeInTheDocument();
    expect(screen.queryByText('RADIOSIM STARTING')).not.toBeInTheDocument();
  });

  it('key 7 opens the OPT menu and key 8 opens PGM once the main screen is shown', () => {
    render(<App />);
    powerOnToMain();
    fireEvent.keyDown(window, { key: '7' });
    expect(lcd()).toHaveTextContent('OPTIONS (simulator)');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(lcd()).toHaveTextContent('PRESET 01');
    fireEvent.keyDown(window, { key: '8' });
    expect(lcd()).toHaveTextContent('PROGRAM (simulator)');
  });

  it('ENT on the main screen does not open a menu', () => {
    render(<App />);
    powerOnToMain();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(lcd()).toHaveTextContent('PRESET 01');
    expect(lcd()).not.toHaveTextContent('simulator)');
  });

  it('keys do nothing during startup', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'p' });
    fireEvent.keyDown(window, { key: '7' });
    expect(lcd()).toHaveTextContent('RADIOSIM STARTING');
    act(() => {
      vi.advanceTimersByTime(STARTUP_TICK_MS);
    });
    expect(lcd()).toHaveTextContent('PRESET 01');
    expect(lcd()).not.toHaveTextContent('OPTIONS');
  });

  it('+ and - retune the active preset by 25 kHz and the LCD shows the new frequency at once', () => {
    render(<App />);
    powerOnToMain();
    fireEvent.keyDown(window, { key: '+' });
    expect(lcd()).toHaveTextContent('PRESET 01');
    expect(lcd()).toHaveTextContent('30.025 MHz');
    fireEvent.keyDown(window, { key: '-' });
    fireEvent.keyDown(window, { key: '-' });
    expect(lcd()).toHaveTextContent('30.000 MHz');
  });

  it('volume shows a temporary indicator that clears after its timeout', () => {
    render(<App />);
    powerOnToMain();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(lcd()).toHaveTextContent('VOLUME 6');
    act(() => {
      vi.advanceTimersByTime(OVERLAY_MS);
    });
    expect(lcd()).not.toHaveTextContent('VOLUME');
  });

  it('keypad lock blocks the keypad until CLR then ENT, and the LOCK indicator follows it', () => {
    render(<App />);
    powerOnToMain();
    fireEvent.keyDown(window, { key: '7' });
    fireEvent.keyDown(window, { key: 'Enter' }); // Keypad Lock is the first OPT entry
    expect(lcd()).toHaveTextContent('KEYPAD LOCKED');
    expect(screen.getByText('LOCK')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '7' });
    expect(lcd()).not.toHaveTextContent('OPTIONS');
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(lcd()).not.toHaveTextContent('KEYPAD LOCKED');
    expect(screen.queryByText('LOCK')).not.toBeInTheDocument();
  });

  it('the in-radio LCD inset and the enlarged preview show the same state', () => {
    const { container } = render(<App />);
    powerOnToMain();
    const inset = (): string => container.querySelector('.rs-screen-inset')?.textContent ?? '';
    expect(inset()).toContain('30.000 MHz');
    fireEvent.keyDown(window, { key: '8' });
    expect(lcd()).toHaveTextContent('PROGRAM (simulator)');
    // The inset shows the first text row of the same frame (its title) and the cursor row.
    expect(inset()).toContain('PROGRAM (simulator)');
    expect(inset()).toContain('System Preset Settings');
  });

  it('PTT never stays latched after the view changes', () => {
    const { container } = render(<App />);
    powerOnToMain();
    fireEvent.click(screen.getByRole('button', { name: 'Left' }));
    fireEvent.pointerDown(control(container, 'ptt'));
    expect(screen.getByText('TX')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Front' }));
    expect(screen.queryByText('TX')).not.toBeInTheDocument();
  });

  it('PTT is released when the window loses focus', () => {
    const { container } = render(<App />);
    powerOnToMain();
    fireEvent.click(screen.getByRole('button', { name: 'Left' }));
    fireEvent.pointerDown(control(container, 'ptt'));
    expect(screen.getByText('TX')).toBeInTheDocument();
    fireEvent.blur(window);
    expect(screen.queryByText('TX')).not.toBeInTheDocument();
  });

  it('shows the accuracy status of the last pressed control', () => {
    const { container } = render(<App />);
    pressControl(container, 'keypad-5');
    expect(screen.getByText('Secondary-source')).toBeInTheDocument();
  });

  it('exposes focusable, named controls and a labelled radio group', () => {
    const { container } = render(<App />);
    const root = container.querySelector('svg.rs-svg');
    expect(root).toHaveAttribute('role', 'group');
    expect(screen.getByRole('button', { name: 'Enter (ENT)' })).toHaveAttribute('data-control', 'keypad-enter');
    expect(control(container, 'lcd-area')).not.toHaveAttribute('tabindex');

    fireEvent.click(screen.getByRole('button', { name: 'Top' }));
    expect(screen.getByRole('button', { name: 'Power' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('slider', { name: 'Volume knob' })).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByRole('slider', { name: 'Squelch knob' })).toHaveAttribute('aria-valuenow', '5');
  });

  it('Enter and Space on a focused control press it, like a click', () => {
    const { container } = render(<App />);
    powerOnToMain();
    const key7 = control(container, 'keypad-7');
    fireEvent.keyDown(key7, { key: ' ' });
    fireEvent.keyUp(key7, { key: ' ' });
    expect(lcd()).toHaveTextContent('OPTIONS (simulator)');
  });

  it('Enter on a view button is not swallowed by the radio shortcuts', () => {
    render(<App />);
    powerOnToMain();
    const top = screen.getByRole('button', { name: 'Top' });
    const event = createEvent.keyDown(top, { key: 'Enter' });
    fireEvent(top, event);
    expect(event.defaultPrevented).toBe(false);
    // The radio ignored the key: still on the main screen.
    expect(lcd()).toHaveTextContent('PRESET 01');
    expect(lcd()).not.toHaveTextContent('simulator)');
  });

  it('digit shortcuts work after clicking a view button, with focus on that button', () => {
    render(<App />);
    powerOnToMain();
    const left = screen.getByRole('button', { name: 'Left' });
    left.focus();
    fireEvent.click(left);
    fireEvent.keyDown(left, { key: '7' });
    fireEvent.click(screen.getByRole('button', { name: 'Front' }));
    expect(lcd()).toHaveTextContent('OPTIONS (simulator)');
  });

  it('sound toggle is off by default, with its state in aria-pressed', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: 'Sound: off' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('sound toggle turns on, and a power press then plays a tone', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Sound: off' }));
    const toggle = screen.getByRole('button', { name: 'Sound: on' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(window, { key: 'p' });
    expect(toneLog.length).toBeGreaterThan(0);
  });

  it('no tone plays while sound is off', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    render(<App />);
    fireEvent.keyDown(window, { key: 'p' });
    expect(toneLog).toHaveLength(0);
  });
});

describe('PTT release, details summary and in-radio notices', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Opens the Left view and presses the PTT switch with the given pointer. */
  function holdPtt(container: HTMLElement, pointerId: number): void {
    fireEvent.click(screen.getByRole('button', { name: 'Left' }));
    fireEvent.pointerDown(control(container, 'ptt'), { pointerId });
    expect(screen.getByText('TX')).toBeInTheDocument();
  }

  const txShown = (): boolean => screen.queryByText('TX') !== null;

  it('another pointer lifting does not end a PTT hold, but the holding pointer does', () => {
    const { container } = render(<App />);
    powerOnToMain();
    holdPtt(container, 1);
    fireEvent.pointerUp(window, { pointerId: 2 });
    expect(txShown()).toBe(true);
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(txShown()).toBe(false);
  });

  it('pointer-cancel from the holding pointer releases PTT', () => {
    const { container } = render(<App />);
    powerOnToMain();
    holdPtt(container, 4);
    fireEvent.pointerCancel(window, { pointerId: 9 });
    expect(txShown()).toBe(true);
    fireEvent.pointerCancel(window, { pointerId: 4 });
    expect(txShown()).toBe(false);
  });

  it('the t key-up does not end a PTT hold made with the pointer', () => {
    const { container } = render(<App />);
    powerOnToMain();
    holdPtt(container, 1);
    fireEvent.keyDown(window, { key: 't' });
    fireEvent.keyUp(window, { key: 't' });
    expect(txShown()).toBe(true);
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(txShown()).toBe(false);
  });

  it('lifting the pointer does not end TX while the t key still holds it', () => {
    const { container } = render(<App />);
    powerOnToMain();
    fireEvent.click(screen.getByRole('button', { name: 'Left' }));
    fireEvent.keyDown(window, { key: 't' });
    fireEvent.pointerDown(control(container, 'ptt'), { pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(txShown()).toBe(true);
    fireEvent.keyUp(window, { key: 't' });
    expect(txShown()).toBe(false);
  });

  it('a hidden tab releases PTT', () => {
    const { container } = render(<App />);
    powerOnToMain();
    holdPtt(container, 1);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    try {
      fireEvent(document, new Event('visibilitychange'));
    } finally {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    }
    expect(txShown()).toBe(false);
  });

  it('power-off while PTT is held clears TX, and it stays clear after power-on', () => {
    const { container } = render(<App />);
    powerOnToMain();
    holdPtt(container, 1);
    fireEvent.keyDown(window, { key: 'p' });
    expect(lcd()).toBeEmptyDOMElement();
    powerOnToMain();
    expect(txShown()).toBe(false);
    expect(lcd()).not.toHaveTextContent('TRANSMIT');
  });

  it('Enter on the details summary opens it and is not taken by the radio', () => {
    const { container } = render(<App />);
    powerOnToMain();
    fireEvent.keyDown(window, { key: '7' });
    const summary = container.querySelector('summary');
    expect(summary).not.toBeNull();
    const event = createEvent.keyDown(summary as Element, { key: 'Enter' });
    fireEvent(summary as Element, event);
    expect(event.defaultPrevented).toBe(false);
    // The radio did not receive ENT: Keypad Lock (the highlighted entry) was not activated.
    expect(lcd()).toHaveTextContent('OPTIONS (simulator)');
    expect(lcd()).not.toHaveTextContent('KEYPAD LOCKED');
  });

  it('a menu notice appears inside the in-radio display, not only in the preview', () => {
    const { container } = render(<App />);
    powerOnToMain();
    fireEvent.keyDown(window, { key: '7' });
    for (let i = 0; i < 6; i += 1) fireEvent.keyDown(window, { key: '+' }); // COMSEC
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(lcd()).toHaveTextContent('UNAVAILABLE IN SIM');
    expect(container.querySelector('.rs-screen-inset')?.textContent).toContain('UNAVAILABLE IN SIM');
  });

  it('has a device picker that switches to the PRC2100V and back', async () => {
    vi.useRealTimers(); // the lazy device chunk loads asynchronously
    render(<App />);
    expect(screen.getByRole('button', { name: /AN\/PRC-152/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /PRC2100V/ }));
    expect(await screen.findByRole('group', { name: /PRC2100V front panel/ })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Display text' }).textContent).toBe('Display off');
    fireEvent.click(screen.getByRole('button', { name: /AN\/PRC-152/ }));
    expect(screen.queryByRole('group', { name: /PRC2100V front panel/ })).toBeNull();
  });
});
