/**
 * HTTP-Transport für Schulmanager Online.
 *
 * Alle Eigenheiten der API sind hier gekapselt:
 *  · ein einziger Batching-RPC-Gateway (`POST /api/calls`)
 *  · Ergebnisse werden **positionell** zugeordnet, es gibt keine Correlation-ID
 *  · ein Fehler-Result hat **kein** `data`-Feld
 *  · `429` kann als Result-Status **innerhalb** einer HTTP-200-Antwort auftauchen
 *  · `x-new-bearer-token` rotiert das JWT bei praktisch jedem Aufruf
 *  · Rate-Limit-Header ohne `Retry-After` ⇒ eigener Token-Bucket
 *
 * Fair Use: eigener User-Agent, Coalescing gleichzeitiger Aufrufe in einen Batch,
 * Mindestabstand zwischen Requests, exponentielles Backoff.
 */
import { Platform } from 'react-native';

/**
 * Basis-URL der API.
 *
 * · nativ      → direkt gegen login.schulmanager-online.de
 * · Web        → same-origin Pfad `/sm-api`, den der Dev-Server (metro.config.js)
 *                bzw. der Export-Server (scripts/web-proxy.mjs) an die API
 *                durchreicht — die API sendet keine CORS-Header, und Browser
 *                blockieren sonst jeden Aufruf.
 * · Override   → `EXPO_PUBLIC_SM_API_BASE` (z. B. eigener Reverse-Proxy).
 */
export const BASE_URL =
  process.env.EXPO_PUBLIC_SM_API_BASE ??
  (Platform.OS === 'web' ? '/sm-api' : 'https://login.schulmanager-online.de');

/** Ob die Web-App über den eingebauten Proxy läuft (nur informativ fürs UI). */
export const WEB_USES_CORS_PROXY =
  Platform.OS === 'web' && !process.env.EXPO_PUBLIC_SM_API_BASE;

/** Pflichtfeld, dessen Wert der Server nicht prüft (leerer String ⇒ HTTP 400). */
export const BUNDLE_VERSION = '3505280ee7';

export const USER_AGENT = 'Schulflow/1.0 (+https://github.com/oskar26/schulmanager; unofficial client)';

export interface RpcCall {
  moduleName: string;
  endpointName: string;
  parameters?: Record<string, unknown>;
}

export interface RpcResult<T = unknown> {
  status: number;
  data?: T;
  userError?: { germanErrorMessage?: string };
}

export class SchulmanagerError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind:
      | 'auth'
      | 'forbidden'
      | 'not-found'
      | 'rate-limit'
      | 'parameters'
      | 'network'
      | 'maintenance'
      | 'unknown',
    readonly germanMessage?: string,
  ) {
    super(message);
    this.name = 'SchulmanagerError';
  }

  /** Nutzertext — immer deutsch, immer ohne Techniksprache. */
  get userMessage(): string {
    if (this.germanMessage) return this.germanMessage;
    switch (this.kind) {
      case 'auth':
        return 'Anmeldung abgelaufen. Bitte in den Einstellungen neu anmelden.';
      case 'forbidden':
        return 'Dieses Modul ist für dein Konto nicht freigeschaltet.';
      case 'not-found':
        return 'Diese Funktion kennt deine Schule nicht.';
      case 'rate-limit':
        return 'Zu viele Anfragen — Schulflow wartet kurz und versucht es erneut.';
      case 'maintenance':
        return 'Schulmanager Online wird gerade gewartet.';
      case 'network':
        return 'Keine Verbindung. Schulflow zeigt dir den zuletzt geladenen Stand.';
      default:
        return 'Da ist etwas schiefgelaufen.';
    }
  }
}

const kindFromStatus = (status: number): SchulmanagerError['kind'] => {
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limit';
  if (status === 500) return 'parameters';
  if (status === 503) return 'maintenance';
  return 'unknown';
};

/* ------------------------------------------------------------------ Rate limiting */

class TokenBucket {
  private tokens: number;
  private last = Date.now();

  constructor(
    private readonly capacity = 12,
    private readonly refillPerSecond = 1.5,
  ) {
    this.tokens = capacity;
  }

  async take(): Promise<void> {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.refillPerSecond);
    this.last = now;

    if (this.tokens < 1) {
      const waitMs = ((1 - this.tokens) / this.refillPerSecond) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      this.tokens = 0;
      this.last = Date.now();
      return;
    }
    this.tokens -= 1;
  }
}

/* ------------------------------------------------------------------ Client */

export interface ClientOptions {
  getToken: () => string | null;
  onTokenRotated?: (token: string) => void;
  onDeviceRevoked?: () => void;
  baseUrl?: string;
  /** Testhaken */
  fetchImpl?: typeof fetch;
}

interface QueuedCall {
  call: RpcCall;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

export class SchulmanagerClient {
  private readonly bucket = new TokenBucket();
  private queue: QueuedCall[] = [];
  private flushHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: ClientOptions) {}

  private get baseUrl() {
    return this.options.baseUrl ?? BASE_URL;
  }

  private get fetch() {
    return this.options.fetchImpl ?? fetch;
  }

  /** Roher HTTP-POST auf einen der wenigen echten Endpunkte. */
  async post<T>(path: string, body: unknown, opts: { auth?: boolean } = {}): Promise<T> {
    await this.bucket.take();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    // Browser verbieten selbst gesetzte User-Agents — das macht der Proxy.
    if (Platform.OS !== 'web') headers['User-Agent'] = USER_AGENT;

    if (opts.auth !== false) {
      const token = this.options.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    // Timeout: Nach 30 s abbrechen, statt ewig zu warten (Bug: hängende Requests).
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      response = await this.fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body ?? {}),
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      throw new SchulmanagerError(
        aborted ? `Timeout bei ${path}` : String(error),
        0,
        'network',
        aborted ? 'Die Schule antwortet nicht (Timeout). Prüfe deine Internetverbindung.' : undefined,
      );
    } finally {
      clearTimeout(timeout);
    }

    const rotated = response.headers.get('x-new-bearer-token');
    if (rotated) this.options.onTokenRotated?.(rotated);
    if (response.headers.get('x-user-device-doesnt-exist')) this.options.onDeviceRevoked?.();

    if (!response.ok) {
      throw new SchulmanagerError(
        `HTTP ${response.status} bei ${path}`,
        response.status,
        kindFromStatus(response.status),
      );
    }

    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  /**
   * Ein logischer Aufruf. Mehrere Aufrufe im selben Tick werden automatisch
   * zu **einem** HTTP-Request gebündelt (genau wie der offizielle Web-Client).
   */
  call<T>(moduleName: string, endpointName: string, parameters?: Record<string, unknown>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ call: { moduleName, endpointName, parameters }, resolve: resolve as never, reject });
      if (!this.flushHandle) this.flushHandle = setTimeout(() => void this.flush(), 0);
    });
  }

  /** Expliziter Batch mit garantierter Reihenfolge. */
  async batch(calls: RpcCall[]): Promise<RpcResult[]> {
    if (calls.length === 0) return [];
    const body = { bundleVersion: BUNDLE_VERSION, requests: calls };
    const envelope = await this.post<{ results: RpcResult[] }>('/api/calls', body);
    return envelope?.results ?? [];
  }

  private async flush() {
    this.flushHandle = null;
    const pending = this.queue;
    this.queue = [];
    if (pending.length === 0) return;

    try {
      const results = await this.withRetry(() => this.batch(pending.map((entry) => entry.call)));

      pending.forEach((entry, index) => {
        // Positionelle Zuordnung — die API kennt keine Correlation-ID.
        const result = results[index];
        if (!result) {
          entry.reject(new SchulmanagerError('Keine Antwort für diesen Aufruf', 0, 'unknown'));
          return;
        }
        if (result.status >= 400) {
          entry.reject(
            new SchulmanagerError(
              `${entry.call.moduleName}/${entry.call.endpointName} → ${result.status}`,
              result.status,
              kindFromStatus(result.status),
              result.userError?.germanErrorMessage,
            ),
          );
          return;
        }
        // Erfolg wird am Status erkannt, nie an der Existenz von `data`.
        entry.resolve(result.data);
      });
    } catch (error) {
      pending.forEach((entry) => entry.reject(error));
    }
  }

  private async withRetry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await task();
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof SchulmanagerError && ['rate-limit', 'network', 'maintenance'].includes(error.kind);
        if (!retryable || attempt === attempts - 1) break;
        await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
      }
    }
    throw lastError;
  }
}
