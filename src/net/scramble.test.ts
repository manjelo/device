import { describe, expect, it } from 'vitest';
import { scramblePcm } from './scramble';

const frame = Int16Array.from({ length: 640 }, (_, i) => Math.round(Math.sin(i / 7) * 12000));

describe('scramblePcm', () => {
  it('changes the audio and is undone by the same seed', () => {
    const s = scramblePcm(frame, 'key');
    expect(s).not.toEqual(frame);
    expect(scramblePcm(s, 'key')).toEqual(frame);
  });
  it('a different seed does not recover the audio', () => {
    expect(scramblePcm(scramblePcm(frame, 'key-a'), 'key-b')).not.toEqual(frame);
  });
});
