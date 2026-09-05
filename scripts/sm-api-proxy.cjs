/**
 * Gemeinsamer CORS-Durchreicher für die Schulmanager--APIs.
 *
 * Wird benutzt von:
 *  · metro.config.js         → Dev-Server (`expo start`)   /sm-api/*, /sm-storage/*
 *  · scripts/web-proxy.mjs   → statischer Export-Server     /sm-api/*, /sm-storage/*
 *  · scripts/relay/*.worker.js → Cloudflare-Relay für reines Static-Hosting
 *
 * Der Durchreicher ändert so wenig wie möglich: Prefix abschneiden,
 * hop-by-hop-Header entfernen, User-Agent setzen (Browser verbieten das
 * clientseitig), Body unverändert durchreichen.
 *
 * Wichtig für Phase 11: das Prefix wird **am Suffix** erkannt, nicht an der
 * Wurzel. Die Web-App läuft je nach Auslieferung unter `/`, `/schulmanager/`
 * oder einem beliebigen Unterpfad — sie leitet ihre Requests deshalb relativ zu
 * ihrer eigenen Basis-URL ab (`document.baseURI`). Root-feste Pfade wie
 * `/sm-api` liefen auf statischen Hosts (GitHub Pages) ins Leere und waren der
 * eigentliche Grund, warum im Browser nie Daten ankamen.
 */
'use strict';

const https = require('node:https');

/** Upstream-Host je Mount-Punkt. */
const ROUTES = {
  '/sm-api': process.env.SM_API_UPSTREAM || 'login.schulmanager-online.de',
  '/sm-storage': process.env.SM_STORAGE_UPSTREAM || 'storage.schulmanager-online.de',
};

const USER_AGENT = 'Schulflow/1.0 (+https://github.com/oskar26/schulmanager; unofficial client)';

/** Header, die zwischen Hop 1 (Browser) und Hop 2 (API) nicht weitergereicht werden dürfen. */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'origin',
  'referer',
  'content-length',
  'cookie',
]);

/** Findet das Mount-Prefix am Anfragepfad (suffix-basiert, subpfad-tolerant). */
function matchRoute(url) {
  for (const prefix of Object.keys(ROUTES)) {
    // Die App hängt das Mount-Prefix an ihre eigene Basis-URL an, z. B.
    // `/schulmanager/sm-api/api/calls`. Wir erkennen also das letzte Vorkommen.
    const at = url.lastIndexOf(prefix);
    if (at < 0) continue;
    const rest = url.slice(at + prefix.length);
    if (rest === '' || rest.startsWith('/') || rest.startsWith('?')) return { prefix, at };
  }
  return null;
}

/**
 * Erzeugt einen Request-Handler `(req, res) => boolean`.
 * Rückgabe `false` = Anfrage gehört nicht hierher (Aufrufer soll weiterreichen).
 */
function createSmApiProxy() {
  return (req, res) => {
    const route = matchRoute(req.url ?? '');
    if (!route) return false;
    const host = ROUTES[route.prefix];

    const upstreamPath = req.url.slice(route.at + route.prefix.length) || '/';

    // Health-Check: die Web-App prüft damit in einem Request, ob der Durchreicher
    // überhaupt existiert (statische Hosts wie GitHub Pages kennen ihn nicht).
    if (upstreamPath === '/__health' || upstreamPath === '/__health/') {
      const body = JSON.stringify({ ok: true, proxy: 'schulflow', route: route.prefix, upstream: host });
      res.writeHead(200, { ...corsHeaders(), 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(body);
      return true;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders());
      res.end();
      return true;
    }

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!HOP_BY_HOP.has(key.toLowerCase()) && value !== undefined) {
        headers[key] = value;
      }
    }
    headers['user-agent'] = USER_AGENT;
    headers['accept-encoding'] = 'identity';

    const options = {
      protocol: 'https:',
      hostname: host,
      port: 443,
      path: upstreamPath,
      method: req.method,
      headers,
      timeout: 45_000,
    };

    const upstream = https.request(options, (upstreamRes) => {
      const responseHeaders = { ...corsHeaders() };
      for (const [key, value] of Object.entries(upstreamRes.headers)) {
        if (!HOP_BY_HOP.has(key.toLowerCase()) && value !== undefined) {
          responseHeaders[key] = value;
        }
      }
      res.writeHead(upstreamRes.statusCode ?? 502, responseHeaders);
      upstreamRes.pipe(res);
    });

    upstream.on('timeout', () => upstream.destroy(new Error('timeout')));
    upstream.on('error', (error) => {
      const payload = JSON.stringify({ error: `Schulflow-Proxy: ${error.message}` });
      res.writeHead(502, { ...corsHeaders(), 'content-type': 'application/json' });
      res.end(payload);
    });

    req.pipe(upstream);
    return true;
  };
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, accept',
    'access-control-max-age': '86400',
  };
}

module.exports = { createSmApiProxy, matchRoute, ROUTES };
