/**
 * Base64 ohne Buffer/btoa — läuft auf RN, Web und in jsdom.
 * Für UTF-8-Strings → Bytes → Base64 (exakt das Schema, das die
 * Schulmanager-Datei-Deskriptoren erwarten).
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 0b11) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? '=' : ALPHABET[((b1 & 0b1111) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? '=' : ALPHABET[b2 & 0b111111];
  }
  return out;
}

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const bytes: number[] = [];
  for (let i = 0; i < len; i += 4) {
    const c0 = ALPHABET.indexOf(clean[i]);
    const c1 = ALPHABET.indexOf(clean[i + 1]);
    const c2 = clean[i + 2] === '=' ? -1 : ALPHABET.indexOf(clean[i + 2]);
    const c3 = clean[i + 3] === '=' ? -1 : ALPHABET.indexOf(clean[i + 3]);
    bytes.push((c0 << 2) | (c1 >> 4));
    if (c2 >= 0) bytes.push(((c1 & 0b1111) << 4) | (c2 >> 2));
    if (c3 >= 0) bytes.push(((c2 & 0b11) << 6) | c3);
  }
  return new Uint8Array(bytes);
}

const utf8Bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

/** `btoa(unescape(encodeURIComponent(json)))` — das exakte Schema der API. */
export function encodeDescriptor(value: unknown): string {
  return bytesToBase64(utf8Bytes(JSON.stringify(value)));
}
