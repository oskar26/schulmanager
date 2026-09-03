/**
 * Gemeinsamer CORS-Proxy für die Schulmanager-API.
 *
 * Wird zweimal benutzt:
 *  · metro.config.js         → Dev-Server (`expo start`) unter `/sm-api/*`
 *  · scripts/web-proxy.mjs   → statischer Export-Server für `expo export`
 *
 * Der Proxy ändert so wenig wie möglich: Pfad kürzen, hop-by-hop-Header
 * entfernen, User-Agent setzen (Browsers verbieten das clientseitig),
 * Body unverändert durchreichen.
 */
'use strict';

const https = require('node:https');
const http = require('node:http');

const TARGET_HOST = 'login.schulmanager-online.de';
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

/**
 * Erzeugt einen Request-Handler `(req, res, prefix) => void`.
 * `prefix` ist der Mount-Pfad (z. B. '/sm-api'), der entfernt wird.
 */
function createSmApiProxy() {
  return (req, res, prefix) => {
    const upstreamPath = req.url.slice(prefix.length) || '/';

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders());
      res.end();
      return;
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
      hostname: TARGET_HOST,
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

module.exports = { createSmApiProxy };
