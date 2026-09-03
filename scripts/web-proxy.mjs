/**
 * Produktiv-Server für den statischen Web-Export von Schulflow.
 *
 *   npx expo export --platform web        # baut nach dist/
 *   node scripts/web-proxy.mjs            # serviert dist/ + /sm-api/*
 *
 * Ohne diesen Mini-Server würde die Web-App die Schulmanager-API direkt
 * aufrufen — und der Browser blockt das wegen fehlender CORS-Header.
 * Hier ist alles dabei: Statikdateien, SPA-Fallback und der API-Proxy.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createSmApiProxy } = require('./sm-api-proxy.cjs');

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, '..', 'dist');
const PORT = Number(process.env.PORT ?? 8080);
const SM_API_PREFIX = '/sm-api';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

const proxy = createSmApiProxy();

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith(`${SM_API_PREFIX}/`)) {
    proxy(req, res, SM_API_PREFIX);
    return;
  }

  if (pathname === '/') pathname = '/index.html';
  let file = path.join(DIST, pathname);

  // SPA-Fallback: unbekannte Pfade → index.html (Client-Routing).
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, 'index.html');
  }

  const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
  const headers = { 'content-type': type };
  if (file.includes(`${path.sep}_expo${path.sep}`) || file.includes(`${path.sep}assets${path.sep}`)) {
    headers['cache-control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['cache-control'] = 'no-cache';
  }
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Schulflow Web läuft: http://localhost:${PORT}`);
  console.log(`API-Proxy:           http://localhost:${PORT}${SM_API_PREFIX} → https://login.schulmanager-online.de`);
});
