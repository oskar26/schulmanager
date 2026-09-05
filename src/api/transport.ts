/**
 * Transport-Schicht der Schulmanager-Anbindung (Redesign Phase 11).
 *
 * Warum das überhaupt eine eigene Schicht braucht
 * -----------------------------------------------
 * `login.schulmanager-online.de` sendet **keine** `Access-Control-Allow-Origin`-
 * Header. Nativ (APK/iPA) ist das egal — dort gibt es kein CORS. Im Browser ist
 * jeder direkte fetch damit blockiert. Die Web-App umging das über einen
 * Durchreicher unter dem Root-Pfad `/sm-api`, den nur der Dev-Server und
 * `scripts/web-proxy.mjs` kennen. Ausgeliefert wird die Web-Version aber auf
 * GitHub Pages — einem reinen Datei-Server. Dort führte `/sm-api/api/calls` auf
 * `oskar26.github.io/sm-api/…` → 404 mit HTML als Antwort, der JSON-Parse
 * scheiterte, und die Anbindung „lud keine Daten“. Der APK tat es, weil er
 * gar nicht über einen Proxy muss.
 *
 * Was dieser Baustein deshalb tut
 * -------------------------------
 * 1. **Relativ zur App-Basis** suchen (`document.baseURI`) — der Durchreicher
 *    funktioniert damit unter `/`, `/schulmanager/` und jedem Unterpfad.
 * 2. **Einmal pro Session prüfen**, ob dort wirklich ein Durchreicher sitzt
 *    (`GET …/__health`, 1,5 s). Kein Raten, kein 30-s-Timeout.
 * 3. **Benutzer-Hintertür**: `Einstellungen → Verbindung → Umweg` akzeptiert
 *    eine eigene Relay-URL (z. B. ein selbst ausgestellter Cloudflare-Worker,
 *    `scripts/relay/`). Kein Rebuild, sofort wirksam, auch im Export.
 * 4. **Ehrliche Fehlermeldung** statt „Keine Verbindung“, wenn gar kein Weg
 *    durch den Browser führt — inklusive Erklärung und Sprungmarke.
 */
import { Platform } from 'react-native';

import { KEYS, storage } from '@/lib/storage';

/** API-Host, falls der Browser direkt darf (oder die API je CORS öffnet). */
export const DIRECT_API_HOST = 'https://login.schulmanager-online.de';
/** Storage-Host für Datei-Anhänge (Elternbriefe, Dokumente). */
export const DIRECT_STORAGE_HOST = 'https://storage.schulmanager-online.de';

/** Mount-Pfade des Durchrechers (siehe scripts/sm-api-proxy.cjs). */
export const PROXY_API_MOUNT = '/sm-api';
export const PROXY_STORAGE_MOUNT = '/sm-storage';

export type SmTransportKind =
  /** nativ: direkte HTTPS-Verbindung, kein Umweg nötig */
  | 'native-direct'
  /** same-origin Durchreicher (Dev-Server oder eigener Export-Server) */
  | 'proxy'
  /** von Nutzer:innen eingetragener Umweg (Cloudflare Worker o. ä.) */
  | 'relay'
  /** Build-time-Override EXPO_PUBLIC_SM_API_BASE */
  | 'env'
  /** direkter Zugriff — auf Web nur wirksam, wenn die API CORS öffnet */
  | 'direct'
  /** nachweislich kein Weg bekannt: Anfragen werden gar nicht erst versucht */
  | 'blocked';

export interface SmTransport {
  kind: SmTransportKind;
  /** Basis-URL, an die `/api/calls`, `/api/login` … angehängt wird. */
  apiBase: string;
  /** Basis-URL für Datei-Downloads (`/download-file/…`). */
  storageBase: string;
  /** Erreichbarkeit des Umwegs (Health-Check). nativ/direct: nicht geprüft. */
  reachable: boolean;
  /** Messlatenz des Health-Checks in ms (0 = nicht gemessen). */
  latencyMs: number;
  /** Kurztext fürs UI. */
  label: string;
  /** Erklärung fürs UI. */
  detail: string;
  /** Zeitstempel der Entscheidung. */
  checkedAt: number;
}

const HEALTH_PATH = '/__health';
const PROBE_TIMEOUT_MS = 1500;

/** Von Nutzer:innen gesetzter Umweg (nur auf Web relevant, persistiert). */
let relayOverride: string | null = null;
let cached: SmTransport | null = null;
let pending: Promise<SmTransport> | null = null;
const listeners = new Set<(transport: SmTransport) => void>();

/* ------------------------------------------------------------------ Helfer */

/** Sichere Basis-URL der ausgelieferten App, inkl. Unterpfad. */
function appBaseUrl(): string {
  if (typeof document !== 'undefined' && document.baseURI) {
    try {
      // `document.baseURI` ist der <base href> des Exports, sonst die Fenster-URL.
      const base = new URL('.', document.baseURI);
      return base.href;
    } catch {
      /* fällt auf das Fenster zurück */
    }
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/`;
  }
  return '/';
}

/**
 * Akzeptiert, was Nutzer:innen tatsächlich eintippen: Worker-Root, Pfad mit
 * `/sm-api`, mit/ohne Schrägstrich. Rückgabe ist jeweils eine API-Basis.
 */
export function normaliseRelayUrl(input: string): { apiBase: string; storageBase: string } | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  let path = url.pathname.replace(/\/+$/, '');
  if (path.endsWith(PROXY_API_MOUNT)) path = path.slice(0, -PROXY_API_MOUNT.length);
  else if (path.endsWith(PROXY_STORAGE_MOUNT)) path = path.slice(0, -PROXY_STORAGE_MOUNT.length);
  const root = `${url.origin}${path}`;
  return { apiBase: `${root}${PROXY_API_MOUNT}`, storageBase: `${root}${PROXY_STORAGE_MOUNT}` };
}

/** Health-Check gegen einen Kandidaten — ein Request, kurzes Timeout. */
async function probe(apiBase: string): Promise<{ reachable: boolean; latencyMs: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(`${apiBase}${HEALTH_PATH}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) return { reachable: false, latencyMs: Date.now() - started };
    // Ein 200 mit HTML (SPA-Fallback eines Datei-Servers) ist kein Durchreicher.
    const type = response.headers.get('content-type') ?? '';
    if (type.includes('text/html')) return { reachable: false, latencyMs: Date.now() - started };
    return { reachable: true, latencyMs: Date.now() - started };
  } catch {
    return { reachable: false, latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

const LABELS: Record<SmTransportKind, { label: string; detail: string }> = {
  'native-direct': {
    label: 'Direktverbindung',
    detail: 'Nativ gibt es keine Same-Origin-Beschränkung — Schulflow spricht die API selbst an.',
  },
  proxy: {
    label: 'Durchreicher dieser Installation',
    detail: 'Die App-Installation stellt /sm-api und /sm-storage selbst bereit.',
  },
  relay: {
    label: 'Eigener Umweg (Relay)',
    detail: 'Läuft über die in den Einstellungen hinterlegte Relay-Adresse.',
  },
  env: {
    label: 'Build-Adresse (EXPO_PUBLIC_SM_API_BASE)',
    detail: 'Beim Bauen gesetzt; übersteuert alles außer dem manuellen Umweg.',
  },
  direct: {
    label: 'Direkt im Browser',
    detail: 'Funktioniert nur, solange die API CORS für diese Herkunft erlaubt.',
  },
  blocked: {
    label: 'Kein Weg durch den Browser',
    detail:
      'Die Schulmanager-API erlaubt keine Browser-Direktanfragen, und diese Installation hat keinen Durchreicher. ' +
      'Hinterlege einen Umweg (Einstellungen → Verbindung) oder nutze die installierte App.',
  },
};

/* ------------------------------------------------------------------ Auflösung */

async function computeTransport(): Promise<SmTransport> {
  const checkedAt = Date.now();

  if (Platform.OS !== 'web') {
    return {
      kind: 'native-direct',
      apiBase: DIRECT_API_HOST,
      storageBase: DIRECT_STORAGE_HOST,
      reachable: true,
      latencyMs: 0,
      ...LABELS['native-direct'],
      checkedAt,
    };
  }

  const envBase = process.env.EXPO_PUBLIC_SM_API_BASE?.trim();
  const relay = relayOverride ? normaliseRelayUrl(relayOverride) : null;

  // Kandidaten in Vorrangfolge: manueller Umweg → Build-Override →
  // same-origin Durchreicher → Direktaufruf als letzte Chance.
  const candidates: { apiBase: string; storageBase: string; kind: SmTransportKind; probeNeeded: boolean }[] = [];

  if (relay) candidates.push({ ...relay, kind: 'relay', probeNeeded: true });
  if (envBase) {
    const envStorage = envBase.replace(/\/sm-api$/, '/sm-storage');
    candidates.push({ apiBase: envBase, storageBase: envStorage, kind: 'env', probeNeeded: true });
  }
  const sameOrigin = new URL(`.${PROXY_API_MOUNT}`, appBaseUrl()).href.replace(/\/+$/, '');
  candidates.push({
    apiBase: sameOrigin,
    storageBase: sameOrigin.replace(/\/sm-api$/, PROXY_STORAGE_MOUNT),
    kind: 'proxy',
    probeNeeded: true,
  });
  candidates.push({ apiBase: DIRECT_API_HOST, storageBase: DIRECT_STORAGE_HOST, kind: 'direct', probeNeeded: false });

  for (const candidate of candidates) {
    if (!candidate.probeNeeded) {
      return {
        ...candidate,
        reachable: true,
        latencyMs: 0,
        ...LABELS[candidate.kind],
        checkedAt,
      };
    }
    const result = await probe(candidate.apiBase);
    if (result.reachable) {
      return {
        apiBase: candidate.apiBase,
        storageBase: candidate.storageBase,
        kind: candidate.kind,
        reachable: true,
        latencyMs: result.latencyMs,
        ...LABELS[candidate.kind],
        checkedAt,
      };
    }
  }

  return {
    kind: 'blocked',
    apiBase: '',
    storageBase: '',
    reachable: false,
    latencyMs: 0,
    ...LABELS.blocked,
    checkedAt,
  };
}

/**
 * Die Transport-Entscheidung. Lädt genau einmal pro Session und wird danach
 * nur durch `setRelayUrl()`/`recheckTransport()` neu berechnet.
 */
export function resolveSmTransport(): Promise<SmTransport> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = computeTransport()
      .then((transport) => {
        cached = transport;
        listeners.forEach((listener) => listener(transport));
        return transport;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

/** Bisherige Entscheidung (synchron, für Render-Pfade). */
export function peekSmTransport(): SmTransport | null {
  return cached;
}

/** Neu bestimmen (nach Umweg-Eingabe oder per Hand im UI). */
export async function recheckTransport(): Promise<SmTransport> {
  cached = null;
  pending = null;
  return resolveSmTransport();
}

/** Persistiert den manuellen Umweg; `null` entfernt ihn wieder. */
export async function setRelayUrl(url: string | null): Promise<SmTransport> {
  relayOverride = url && url.trim().length > 0 ? url.trim() : null;
  await storage.setJSON(KEYS.smRelay, { url: relayOverride });
  return recheckTransport();
}

/** Der aktuell hinterlegte Umweg, so wie er eingegeben wurde (für Eingabefelder). */
export function currentRelayUrl(): string {
  return relayOverride ?? '';
}

/** Beim App-Start einmalig einsammeln, damit ein gespeicherter Umweg greift. */
export async function hydrateRelayOverride(): Promise<void> {
  if (Platform.OS !== 'web') return;
  const stored = await storage.getJSON<{ url?: string | null }>(KEYS.smRelay, {});
  relayOverride = stored?.url ?? null;
}

export function onTransportChange(listener: (transport: SmTransport) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Antworttext für fehlgeschlagene Web-Anfragen: erklärt statt zu vertrösten.
 * `null` = nichts Erklärendes nötig (nativ, oder es ist ein echter API-Fehler,
 * oder ein funktionierender Umweg war nur kurz nicht erreichbar).
 */
export function explainWebBlock(transport: SmTransport | null): string | null {
  if (Platform.OS !== 'web') return null;
  if (!transport || transport.kind === 'blocked') return LABELS.blocked.detail;
  if (transport.kind === 'direct') {
    // Der letzte Rettungsanker ist der Direktaufruf. Er schlägt typischerweise
    // mit einer kryptischen `TypeError` auf (CORS), und genau die darf der
    // Nutzer nicht zu sehen bekommen.
    return (
      'Der Browser hat die Anfrage an Schulmanager Online blockiert (die API antwortet ohne ' +
      'Access-Control-Allow-Origin). Schulflow konnte keinen Durchreicher finden — bitte in den ' +
      'Einstellungen unter „Verbindung zur Schule“ einen eigenen Umweg eintragen, oder die ' +
      'installierte App nutzen: native Verbindungen kennen diese Sperre nicht.'
    );
  }
  if (!transport.reachable) {
    return `Der hinterlegte Umweg (${transport.apiBase || '—'}) war nicht erreichbar. Prüfe die Adresse in den Einstellungen → Verbindung.`;
  }
  return null;
}

/**
 * Leitet eine absolute Storage-URL der Schule auf den Umweg um (Anhänge
 * hängen am selben CORS-Problem wie die API). Nativ: unverändert.
 */
export function rewriteStorageUrlForWeb(url: string, transport: SmTransport | null): string {
  if (Platform.OS === 'web' && transport && transport.storageBase && url.startsWith('http')) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.endsWith('schulmanager-online.de')) {
        return `${transport.storageBase}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      /* Rohtext behalten */
    }
  }
  return url;
}
