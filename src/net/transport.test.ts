import { describe, expect, it } from 'vitest';
import { parseLinkMessage } from './transport';

describe('parseLinkMessage', () => {
  it('accepts a well-formed message', () => {
    expect(parseLinkMessage({ v: 1, from: 'a', active: true, frequencyHz: 60_000_000 })).toEqual({
      v: 1, from: 'a', active: true, frequencyHz: 60_000_000,
    });
  });
  it.each([null, 'x', 5, {}, { v: 2, from: 'a', active: true, frequencyHz: 1 },
    { v: 1, from: '', active: true, frequencyHz: 1 }, { v: 1, from: 'a', active: 'yes', frequencyHz: 1 },
    { v: 1, from: 'a', active: true, frequencyHz: NaN }, { v: 1, from: 'x'.repeat(65), active: true, frequencyHz: 1 }])(
    'drops %j', (bad) => expect(parseLinkMessage(bad)).toBeNull());
});
