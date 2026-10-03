import * as Crypto from 'expo-crypto';

export const randomId = (prefix = '') => prefix + Crypto.randomUUID();
export const randomToken = (bytes = 32) =>
  Array.from(Crypto.getRandomBytes(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
export const sha256 = (s: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);

// Uniform-enough random integer in [0, max) from the secure random source (fine for dice).
export const randomInt = (max: number) => {
  const b = Crypto.getRandomBytes(4);
  return Math.floor((new DataView(b.buffer, b.byteOffset, 4).getUint32(0) / 2 ** 32) * max);
};
