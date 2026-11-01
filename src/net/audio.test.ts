import { describe, expect, it } from 'vitest';
import { packAudio, unpackAudio } from './audio';

describe('audio framing', () => {
  it('packs a client frame with the frequency header and raw samples', () => {
    const buf = packAudio(60_000_000, new Int16Array([1, -2, 300]));
    const v = new DataView(buf);
    expect(v.getUint8(0)).toBe(1);
    expect(v.getUint32(1)).toBe(60_000_000);
    expect(buf.byteLength).toBe(5 + 6);
    expect(v.getInt16(5, true)).toBe(1);
    expect(v.getInt16(7, true)).toBe(-2);
  });

  it('unpacks a relay frame (works from an odd offset)', () => {
    const out = new ArrayBuffer(9 + 4);
    const v = new DataView(out);
    v.setUint8(0, 1);
    v.setUint32(1, 42);
    v.setUint32(5, 60_000_000);
    v.setInt16(9, -5, true);
    v.setInt16(11, 7, true);
    const packet = unpackAudio(out);
    expect(packet).toEqual({ from: '42', frequencyHz: 60_000_000, pcm: new Int16Array([-5, 7]) });
  });

  it.each([new ArrayBuffer(0), new ArrayBuffer(9), new ArrayBuffer(12)])('rejects a bad frame of %j bytes', (b) => {
    expect(unpackAudio(b)).toBeNull();
  });

  it('rejects an unknown frame type', () => {
    const out = new ArrayBuffer(11);
    new DataView(out).setUint8(0, 9);
    expect(unpackAudio(out)).toBeNull();
  });
});
