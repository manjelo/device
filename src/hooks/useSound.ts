// Simulator sound: short synthesized tones for the radio logic's sound cues (state.sound).
// Simulator convenience. No recorded audio, and no claim that it matches the real radio.
// Off by default. The AudioContext is created only inside toggle(), which runs from a user gesture.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SoundCue } from '../radio';

type Tone = {
  freq: number;
  endFreq?: number;
  start: number; // seconds after the cue starts
  dur: number; // seconds
  peak: number;
  type?: OscillatorType;
};

const CUE_TONES: Record<SoundCue, Tone[]> = {
  key: [{ freq: 1800, start: 0, dur: 0.03, peak: 0.08 }],
  knob: [{ freq: 1200, start: 0, dur: 0.02, peak: 0.06 }],
  'power-on': [{ freq: 500, endFreq: 1200, start: 0, dur: 0.2, peak: 0.1 }],
  'power-off': [{ freq: 1200, endFreq: 400, start: 0, dur: 0.2, peak: 0.1 }],
  'ptt-down': [{ freq: 1000, start: 0, dur: 0.06, peak: 0.1 }],
  'ptt-up': [{ freq: 700, start: 0, dur: 0.06, peak: 0.1 }],
  error: [{ freq: 300, start: 0, dur: 0.18, peak: 0.05, type: 'square' }],
  confirm: [
    { freq: 880, start: 0, dur: 0.08, peak: 0.1 },
    { freq: 1320, start: 0.1, dur: 0.1, peak: 0.1 },
  ],
};

function playCue(ctx: AudioContext, cue: SoundCue): void {
  const t0 = ctx.currentTime;
  for (const tone of CUE_TONES[cue]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = t0 + tone.start;
    const end = start + tone.dur;
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.endFreq !== undefined) osc.frequency.linearRampToValueAtTime(tone.endFreq, end);
    // Short attack and decay envelope, so the tone does not click.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.peak, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.01);
  }
}

export type SoundControls = {
  enabled: boolean;
  /** False when the browser has no Web Audio support. The toggle then stays off. */
  unavailable: boolean;
  toggle: () => void;
};

export function useSound(sound: { seq: number; cue: SoundCue }): SoundControls {
  const [enabled, setEnabled] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const enabledRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const toggle = useCallback(() => {
    if (enabledRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      void ctxRef.current?.suspend().catch(() => undefined);
      return;
    }
    // Created here, inside the click handler, so browsers allow audio.
    if (!ctxRef.current) {
      if (typeof AudioContext !== 'function') {
        setUnavailable(true);
        return;
      }
      try {
        ctxRef.current = new AudioContext();
      } catch {
        setUnavailable(true);
        return;
      }
    }
    void ctxRef.current.resume().catch(() => undefined);
    enabledRef.current = true;
    setEnabled(true);
  }, []);

  // Play only when the cue sequence increases and sound is on. Turning sound on does not replay the last cue.
  const lastSeqRef = useRef(sound.seq);
  useEffect(() => {
    const previous = lastSeqRef.current;
    lastSeqRef.current = sound.seq;
    if (sound.seq <= previous || !enabledRef.current) return;
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== 'closed') playCue(ctx, sound.cue);
  }, [sound]);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
    };
  }, []);

  return { enabled, unavailable, toggle };
}
