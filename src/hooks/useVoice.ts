// Push-to-talk voice over the network link. Simulator feature: raw 16 kHz PCM through the relay, no codec, no crypto.
// Captures the microphone only into frames that are sent while this radio is transmitting, and plays frames from other
// instances only while this radio is receiving (on, not transmitting, same frequency). Radio volume 0..10 sets the gain.
import { useEffect, useRef, useState } from 'react';
import { activeFrequencyHz, isReceiving } from '../radio';
import type { RadioState } from '../radio';
import { AUDIO_FRAME_SAMPLES, AUDIO_SAMPLE_RATE } from '../net/audio';
import type { Transport } from '../net/transport';
import { VOLUME_MAX } from '../radio/config';

export type VoiceStatus = 'idle' | 'starting' | 'ready' | 'blocked' | 'unsupported';

/** Plays at least this far ahead of the newest frame, so network jitter does not cause gaps. */
const PLAYBACK_LEAD_S = 0.12;
/** Beyond this much queued audio, the queue is reset so speech never lags behind. */
const PLAYBACK_MAX_QUEUE_S = 0.7;

const CAPTURE_WORKLET = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Int16Array(${AUDIO_FRAME_SAMPLES}); this.n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i += 1) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      this.buf[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.n === this.buf.length) { this.port.postMessage(this.buf.slice()); this.n = 0; }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);`;

function voiceSupported(): boolean {
  return (
    typeof AudioContext !== 'undefined' &&
    typeof AudioWorkletNode !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/** How voice reads a device: its tuned frequency, whether it is receiving, whether it is keyed, and its volume (0..1). */
export type VoiceAdapter<S> = {
  frequencyHz: (state: S) => number;
  receiving: (state: S) => boolean;
  transmitting: (state: S) => boolean;
  gain: (state: S) => number;
};

const PRC152_VOICE: VoiceAdapter<RadioState> = {
  frequencyHz: activeFrequencyHz,
  receiving: isReceiving,
  transmitting: (s) => s.mode === 'transmit',
  gain: (s) => s.volume / VOLUME_MAX,
};

export function useVoice<S = RadioState>(
  state: S,
  transport: Transport | null,
  enabled: boolean,
  adapter: VoiceAdapter<S> = PRC152_VOICE as unknown as VoiceAdapter<S>,
): { status: VoiceStatus; framesIn: number } {
  const adapterRef = useRef(adapter);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [framesIn, setFramesIn] = useState(0);
  const stateRef = useRef(state);
  const framesRef = useRef(0);
  const gainRef = useRef<GainNode | null>(null);
  useEffect(() => {
    stateRef.current = state;
    adapterRef.current = adapter;
    if (gainRef.current) gainRef.current.gain.value = adapterRef.current.gain(state);
  }, [state, adapter]);

  const canCarryAudio = !!transport?.sendAudio && !!transport.onAudio;
  const active = enabled && canCarryAudio;

  useEffect(() => {
    if (!active || !transport) {
      setStatus('idle');
      return;
    }
    if (!voiceSupported()) {
      setStatus('unsupported');
      return;
    }
    let disposed = false;
    let ctx: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let offAudio: (() => void) | undefined;
    let workletUrl: string | undefined;
    setStatus('starting');

    (async () => {
      ctx = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
      const context = ctx;
      const gain = context.createGain();
      gain.gain.value = adapterRef.current.gain(stateRef.current);
      gain.connect(context.destination);
      gainRef.current = gain;
      if (context.state === 'suspended') await context.resume().catch(() => {});

      // Playback of other radios. One queue per sender so two speakers do not interleave.
      const nextAt = new Map<string, number>();
      offAudio = transport.onAudio?.((packet) => {
        const s = stateRef.current;
        const a = adapterRef.current;
        if (!a.receiving(s) || packet.frequencyHz !== a.frequencyHz(s)) return;
        framesRef.current += 1;
        const buffer = context.createBuffer(1, packet.pcm.length, AUDIO_SAMPLE_RATE);
        const out = buffer.getChannelData(0);
        for (let i = 0; i < packet.pcm.length; i += 1) out[i] = packet.pcm[i] / 0x8000;
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        const now = context.currentTime;
        let at = nextAt.get(packet.from) ?? 0;
        if (at < now + PLAYBACK_LEAD_S * 0.5 || at > now + PLAYBACK_MAX_QUEUE_S) at = now + PLAYBACK_LEAD_S;
        source.start(at);
        nextAt.set(packet.from, at + buffer.duration);
      });

      // Microphone. Frames are sent only while this radio is transmitting.
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        if (!disposed) setStatus('blocked');
        return; // listening still works without a microphone
      }
      if (disposed) return;
      workletUrl = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'text/javascript' }));
      await context.audioWorklet.addModule(workletUrl);
      if (disposed) return;
      const capture = new AudioWorkletNode(context, 'pcm-capture');
      capture.port.onmessage = (e: MessageEvent<Int16Array>) => {
        const s = stateRef.current;
        const a = adapterRef.current;
        if (a.transmitting(s)) transport.sendAudio?.(a.frequencyHz(s), e.data);
      };
      const mute = context.createGain(); // the worklet only runs while connected toward the destination
      mute.gain.value = 0;
      context.createMediaStreamSource(stream).connect(capture);
      capture.connect(mute).connect(context.destination);
      setStatus('ready');
    })().catch(() => {
      if (!disposed) setStatus('unsupported');
    });

    const counter = window.setInterval(() => setFramesIn(framesRef.current), 500);
    return () => {
      disposed = true;
      window.clearInterval(counter);
      offAudio?.();
      stream?.getTracks().forEach((t) => t.stop());
      gainRef.current = null;
      if (workletUrl) URL.revokeObjectURL(workletUrl);
      void ctx?.close().catch(() => {});
      setStatus('idle');
    };
  }, [active, transport]);

  return { status, framesIn };
}
