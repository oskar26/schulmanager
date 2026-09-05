/**
 * React-Anschluss an die Transport-Schicht (Redesign Phase 11).
 *
 * Der Hook liefert die aktuelle Entscheidung (Direktverbindung, Durchreicher,
 * Relay, blockiert) samt Latenz und aktualisiert sich, sobald eine Messung
 * neu durchgeführt wurde. Genutzt von Einstellungen → Verbindung und vom
 * Verbindungs-Banner auf dem Start-Screen.
 */
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  currentRelayUrl,
  onTransportChange,
  recheckTransport,
  resolveSmTransport,
  setRelayUrl as persistRelayUrl,
  type SmTransport,
} from '@/api/transport';

export interface SmTransportState {
  transport: SmTransport | null;
  checking: boolean;
  /** Nur auf Web sinnvoll: der persistierte manuelle Umweg. */
  relayUrl: string;
  recheck: () => Promise<void>;
  saveRelay: (url: string | null) => Promise<void>;
}

export function useSmTransport(): SmTransportState {
  const [transport, setTransport] = useState<SmTransport | null>(null);
  const [checking, setChecking] = useState(false);
  const [relayUrl, setRelayUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onTransportChange((next) => {
      if (!cancelled) setTransport(next);
    });
    void resolveSmTransport().then((next) => {
      if (cancelled) return;
      setTransport(next);
      setRelayUrl(currentRelayUrl());
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const recheck = useCallback(async () => {
    setChecking(true);
    try {
      setTransport(await recheckTransport());
    } finally {
      setChecking(false);
    }
  }, []);

  const saveRelay = useCallback(async (url: string | null) => {
    setChecking(true);
    try {
      setTransport(await persistRelayUrl(url));
      setRelayUrl(currentRelayUrl());
    } finally {
      setChecking(false);
    }
  }, []);

  return { transport, checking, relayUrl, recheck, saveRelay };
}

/** Ob die Installation überhaupt einen Umweg brauchen könnte. */
export const IS_WEB = Platform.OS === 'web';
