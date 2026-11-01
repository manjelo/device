// Wire format for push-to-talk audio between RadioSim instances. Simulator-only: raw 16 kHz mono PCM, no codec, no crypto.
// Client -> relay: [1][frequency u32 BE][int16 LE samples...]
// Relay -> client: [1][sender id u32 BE][frequency u32 BE][int16 LE samples...]
export const AUDIO_SAMPLE_RATE = 16_000;
/** 40 ms per frame. */
export const AUDIO_FRAME_SAMPLES = 640;
const AUDIO_TYPE = 1;
const OUT_HEADER = 9;

export type AudioPacket = { from: string; frequencyHz: number; pcm: Int16Array };

export function packAudio(frequencyHz: number, pcm: Int16Array): ArrayBuffer {
  const out = new ArrayBuffer(5 + pcm.byteLength);
  const view = new DataView(out);
  view.setUint8(0, AUDIO_TYPE);
  view.setUint32(1, frequencyHz);
  new Uint8Array(out, 5).set(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
  return out;
}

export function unpackAudio(data: ArrayBuffer): AudioPacket | null {
  if (data.byteLength <= OUT_HEADER || (data.byteLength - OUT_HEADER) % 2 !== 0) return null;
  const view = new DataView(data);
  if (view.getUint8(0) !== AUDIO_TYPE) return null;
  return {
    from: String(view.getUint32(1)),
    frequencyHz: view.getUint32(5),
    pcm: new Int16Array(data.slice(OUT_HEADER)), // slice gives an aligned copy
  };
}
