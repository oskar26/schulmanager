/**
 * Download verschlüsselter Schulmanager-Dateien (Anhänge, Dokumente).
 *
 * Kette: Deskriptor parsen → Storage-Host bestimmen → Ciphertext laden →
 * AES-entschlüsseln (siehe decryptStoredFile) → im Cache ablegen → als
 * Datei teilen/öffnen. Auf Web fällt das auf einen Browser-Download zurück.
 */
import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { SchulmanagerApi } from './endpoints';
import { decryptStoredFile, descriptorPath, parseStoredFile } from './files';
import { bytesToBase64 } from '@/lib/base64';
import { useSession } from '@/state/session';

export interface DownloadResult {
  name: string;
  uri?: string;
  mode: 'plain' | 'cbc' | 'ecb' | 'unknown';
  opened: boolean;
}

export async function downloadStoredFile(
  api: SchulmanagerApi,
  descriptor: unknown,
): Promise<DownloadResult> {
  const parts = parseStoredFile(descriptor);
  if (!parts) throw new Error('Datei-Deskriptor nicht lesbar.');

  const storageUrl = (await api.remoteStorageUrl().catch(() => null)) ?? 'https://storage.schulmanager-online.de';
  const path = descriptorPath(descriptor);
  if (!path) throw new Error('Datei-Deskriptor nicht lesbar.');

  const token = useSession.getState().session?.jwt;
  const response = await fetch(`${storageUrl}/download-file/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`Download fehlgeschlagen (HTTP ${response.status}).`);

  const cipher = new Uint8Array(await response.arrayBuffer());
  const { bytes, mode } = decryptStoredFile(cipher, parts.key);

  const safeName = (parts.name || 'datei').replace(/[/\\?%*:|"<>]/g, '-');
  const fileUri = `${FileSystem.cacheDirectory}${safeName}`;

  if (Platform.OS === 'web') {
    // Browser: Blob-Download ohne Dateisystem.
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: parts.type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return { name: safeName, mode, opened: true };
  }

  await FileSystem.writeAsStringAsync(fileUri, bytesToBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (mode === 'unknown') {
    return { name: safeName, uri: fileUri, mode, opened: false };
  }

  try {
    const Sharing = await import('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: parts.type || 'application/octet-stream',
        dialogTitle: safeName,
      });
    }
    return { name: safeName, uri: fileUri, mode, opened: true };
  } catch {
    // Kein Sharing verfügbar → Datei liegt trotzdem im Cache.
    return { name: safeName, uri: fileUri, mode, opened: false };
  }
}

/** Kalender-iCal-Link ins System teilen bzw. in die Zwischenablage legen (Web). */
export async function shareIcalUrl(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* Clipboard kann verweigert werden — der Link ist trotzdem sichtbar */
    }
    return;
  }
  await Share.share({ message: url });
}
