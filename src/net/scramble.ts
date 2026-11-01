// Simulator-only voice scrambling for the Datron PRC2100V channel settings (C encryption, S secure password).
// Not real cryptography: a seeded keystream is XORed onto each PCM frame. XOR is its own inverse, so the same call
// scrambles on the transmitting radio and recovers the audio on a receiver with the same seed. A receiver with a
// different seed (or none) hears noise. The keystream restarts on every frame, so frames need no sequence numbers.

/** FNV-1a hash of the seed text. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Returns a new frame: pcm XOR keystream(seed). Calling it again with the same seed restores the original. */
export function scramblePcm(pcm: Int16Array, seed: string): Int16Array {
  let a = hashSeed(seed);
  const out = new Int16Array(pcm.length);
  for (let i = 0; i < pcm.length; i += 1) {
    a = (a + 0x6d2b79f5) >>> 0; // mulberry32
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const key = ((t ^ (t >>> 14)) >>> 0) & 0xffff;
    out[i] = pcm[i] ^ key;
  }
  return out;
}
