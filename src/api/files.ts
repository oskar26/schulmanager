/**
 * Verschlüsselte Dateien: Download + Entschlüsselung.
 *
 * Der Server speichert nur Ciphertext — der AES-256-Schlüssel reist **im Klartext
 * im Datei-Deskriptor** (StoredFile: JSON-String mit 7-Element-Array). Der Download
 * läuft gegen den Host aus `main/get-remote-storage-url`, nicht gegen den Login-Host.
 *
 * Der AES-Modus ist in der Referenz nicht dokumentiert; wir probieren CBC
 * (Null-IV) und ECB und prüfen das Ergebnis anhand der Magic-Bytes. Schlägt beides
 * fehl, liefern wir die Rohdaten zurück — die App zeigt es ehrlich als „nicht
 * entschlüsselbar" an, statt eine kaputte Datei zu öffnen.
 */
import * as aesjs from 'aes-js';

import type { StoredFileParts } from './types';
import { base64ToBytes, bytesToBase64, encodeDescriptor } from '@/lib/base64';

/** Parsed den Wire-Format-Deskriptor: JSON-String mit [institutionId, scope, id, key, type, size, name]. */
export function parseStoredFile(value: unknown): StoredFileParts | null {
  try {
    let array: unknown[] | null = null;
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) array = parsed;
    } else if (Array.isArray(value)) {
      array = value as unknown[];
    }
    if (!array || array.length < 7) return null;
    return {
      institutionId: array[0] as StoredFileParts['institutionId'],
      scope: String(array[1] ?? ''),
      id: String(array[2] ?? ''),
      key: String(array[3] ?? ''),
      type: String(array[4] ?? 'application/octet-stream'),
      size: Number(array[5] ?? 0),
      name: String(array[6] ?? 'Datei'),
    };
  } catch {
    return null;
  }
}

export function storedFileName(value: unknown): string | null {
  return parseStoredFile(value)?.name ?? null;
}

/** Pfad-Segment für `/download-file/{descriptor}`. */
export function descriptorPath(value: unknown): string | null {
  const parts = parseStoredFile(value);
  if (!parts) return null;
  const array = typeof value === 'string' ? JSON.parse(value as string) : value;
  return encodeDescriptor(array);
}

/* ------------------------------------------------------------------ Magic-Bytes */

const MAGIC: { bytes: number[]; label: string }[] = [
  { bytes: [0x25, 0x50, 0x44, 0x46], label: 'pdf' }, // %PDF
  { bytes: [0x89, 0x50, 0x4e, 0x47], label: 'image/png' },
  { bytes: [0xff, 0xd8, 0xff], label: 'image/jpeg' },
  { bytes: [0x47, 0x49, 0x46, 0x38], label: 'image/gif' },
  { bytes: [0x50, 0x4b, 0x03, 0x04], label: 'zip' }, // docx/xlsx/odt/zip
  { bytes: [0xd0, 0xcf, 0x11, 0xe0], label: 'ole' }, // legacy Office
  { bytes: [0x52, 0x49, 0x46, 0x46], label: 'riff' }, // webp/wav
  { bytes: [0x1f, 0x8b], label: 'gzip' },
  { bytes: [0x49, 0x44, 0x33], label: 'audio/mpeg' }, // ID3
  { bytes: [0x00, 0x00, 0x00, 0x18], label: 'video/mp4' },
];

function detectLabel(bytes: Uint8Array): string | null {
  for (const magic of MAGIC) {
    if (magic.bytes.every((byte, index) => bytes[index] === byte)) return magic.label;
  }
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 256));
  if (/^\s*<\?xml|^\s*<!DOCTYPE|^\s*<html/i.test(text)) return 'text/html';
  if (/^BEGIN:VCALENDAR/i.test(text)) return 'text/calendar';
  return null;
}

const ZERO_IV = new Uint8Array(16);

/** Versucht CBC (Null-IV), dann ECB — zurück gibt es den Kandidaten mit erkannten Magic-Bytes. */
export function decryptStoredFile(cipherBytes: Uint8Array, keyBase64: string): { bytes: Uint8Array; mode: 'plain' | 'cbc' | 'ecb' | 'unknown' } {
  if (detectLabel(cipherBytes)) return { bytes: cipherBytes, mode: 'plain' };

  try {
    const key = base64ToBytes(keyBase64);
    if (key.length === 32 && cipherBytes.length >= 16) {
      const cbc = new aesjs.ModeOfOperation.cbc(key, ZERO_IV);
      const padded = new Uint8Array(cipherBytes.length - (cipherBytes.length % 16));
      padded.set(cipherBytes.subarray(0, padded.length));
      const cbcBytes = new Uint8Array(cbc.decrypt(padded));
      if (detectLabel(cbcBytes)) return { bytes: cbcBytes, mode: 'cbc' };

      const ecb = new aesjs.ModeOfOperation.ecb(key);
      const ecbBytes = new Uint8Array(ecb.decrypt(padded));
      if (detectLabel(ecbBytes)) return { bytes: ecbBytes, mode: 'ecb' };
    }
  } catch {
    /* fällt durch */
  }
  return { bytes: cipherBytes, mode: 'unknown' };
}

export const bytesToBase64ForUpload = bytesToBase64;
