/**
 * Schulflow-Relay für statisches Web-Hosting (Phase 11)
 * =====================================================
 *
 * Die Web-App läuft auf GitHub Pages — ein reiner Datei-Server. Die
 * Schulmanager-API schickt keine `Access-Control-Allow-Origin`-Header, deshalb
 * blockt jeder Browser den direkten Aufruf: die Anbindung „lädt keine Daten“.
 * Dieses Worker-Skript ist der fehlende dritte Hop: Browser → Worker → API.
 *
 * Ausliefern (kostenlos, ~1 Minute):
 *   1. https://dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Inhalt dieser Datei einfügen → Deploy
 *   3. In Schulflow: Einstellungen → Verbindung → „Umweg (Relay)“ = Worker-URL
 *      z. B. https://schulflow-relay.<dein-name>.workers.dev/sm-api
 *
 * Alternativ per CLI:
 *   npx wrangler deploy -c scripts/relay/wrangler.toml
 *
 * Bewusst NICHT implementiert: kein Loggen von Bodies oder Tokens, kein
 * Caching von Antworten, kein Pfad außerhalb der beiden Upstreams.
 */

const ROUTES = {
  '/sm-api': 'https://login.schulmanager-online.de',
  '/sm-storage': 'https://storage.schulmanager-online.de',
};

const USER_AGENT = 'Schulflow/1.0 (+https://github.com/oskar26/schulmanager; unofficial client)';

/** Header, die der Browser nicht selbst setzen darf und die der API-Host braucht. */
const STRIP_REQUEST = new Set([
  'host',
  'origin',
  'referer',
  'cookie',
  'connection',
  'keep-alive',
  'content-length',
  'transfer-encoding',
  'upgrade',
  'te',
  'trailer',
  'proxy-authorization',
]);

/** Header der Antwort, die ein Worker nicht selbst setzen darf. */
const STRIP_RESPONSE = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const allowed = originAllowed(origin, env);
    if (!allowed) {
      // Klare Antwort statt verschleierter CORS-Meldung in der Konsole.
      return json({ error: `Ursprung ${origin ?? '(ohne Origin)'} ist für dieses Relay nicht freigeschaltet (ALLOWED_ORIGINS).` }, 403, {});
    }
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const route = matchRoute(url.pathname);
    if (!route) {
      return json({ error: 'Unbekannter Pfad — Schulflow-Relay bedient nur /sm-api/* und /sm-storage/*.' }, 404, cors);
    }

    // Die Web-App prüft mit diesem einen Request, ob ein Umweg existiert.
    if (route.rest === '/__health' || route.rest === '/__health/') {
      return json({ ok: true, proxy: 'schulflow-relay', route: route.prefix, upstream: ROUTES[route.prefix] }, 200, {
        ...cors,
        'cache-control': 'no-store',
      });
    }

    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return json({ error: `Methode ${request.method} ist über das Relay nicht erlaubt.` }, 405, cors);
    }

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!STRIP_REQUEST.has(key.toLowerCase())) headers.set(key, value);
    });
    headers.set('user-agent', USER_AGENT);
    headers.set('accept-encoding', 'identity');

    const target = `${ROUTES[route.prefix]}${route.rest}${url.search}`;
    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'manual',
      });
    } catch (error) {
      return json({ error: `Schulflow-Relay: Upstream nicht erreichbar (${error.message}).` }, 502, cors);
    }

    const responseHeaders = new Headers(cors);
    upstream.headers.forEach((value, key) => {
      if (!STRIP_RESPONSE.has(key.toLowerCase())) responseHeaders.set(key, value);
    });

    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  },
};

function matchRoute(pathname) {
  for (const prefix of Object.keys(ROUTES)) {
    const at = pathname.lastIndexOf(prefix);
    if (at < 0) continue;
    const rest = pathname.slice(at + prefix.length) || '/';
    if (rest === '/' || rest.startsWith('/')) return { prefix, rest };
  }
  return null;
}

/**
 * `ALLOWED_ORIGINS` (Komma-liste) schränkt ein, wer das Relay benutzen darf —
 * empfohlen, damit nicht beliebige Dritte den eigenen Worker als Proxy nutzen.
 * Ohne die Variable antwortet das Relay mit `*`; es leitet ausschließlich
 * Anfragen weiter, für die der Aufrufer ohnehin ein gültiges Schulflow-JWT hat.
 */
function originAllowed(origin, env) {
  const allowList = (env?.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!allowList.length) return true;
  return Boolean(origin) && allowList.includes(origin);
}

function corsHeaders(origin, env) {
  const hasAllowList = (env?.ALLOWED_ORIGINS ?? '').trim().length > 0;
  const allowOrigin = hasAllowList && origin ? origin : '*';

  const headers = {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, accept',
    'access-control-max-age': '86400',
  };
  if (allowOrigin !== '*') headers.vary = 'Origin';
  return headers;
}

function json(payload, status, headers) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json', ...headers } });
}
