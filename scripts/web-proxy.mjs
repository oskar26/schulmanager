/**
 * Produktiv-Server für den statischen Web-Export von Schulflow.
 *
 *   npx expo export --platform web -o dist   # baut nach dist/
 *   node scripts/web-proxy.mjs                # serviert dist/ + die Durchreicher
 *
 * Ohne diesen Mini-Server würde die Web-App die Schulmanager-API direkt
 * aufrufen — und der Browser blockt das wegen fehlender CORS-Header. Hier ist
 * alles dabei: Statikdateien, SPA-Fallback und die Upstream-Durchreicher
 * `/…/sm-api/*` (login.schulmanager-online.de) sowie `/…/sm-storage/*`
 * (storage.schulmanager-online.de, Datei-Anhänge).
 *
 * Umgebungsvariablen:
 *   PORT        Port (Standard 8080)
 *   SERVE_DIR   Export-Verzeichnis (Standard ./dist)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createSmApiProxy } = require('./sm-api-proxy.cjs');

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = process.env.SERVE_DIR ? path.resolve(process.env.SERVE_DIR) : path.join(ROOT, '..', 'dist');
const PORT = Number(process.env.PORT ?? 8080);

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
  // 1) Upstream-Durchreicher: suffix-basiert, damit der Export unter `/`,
  //    `/schulmanager/` oder jedem anderen Unterpfad identisch funktioniert.
  if (proxy(req, res)) return;

  // 2) Statische Dateien mit SPA-Fallback (Client-Routing).
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  let file = path.join(DIST, pathname);

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
  console.log('Durchreicher:  …/sm-api → https://login.schulmanager-online.de');
  console.log('               …/sm-storage → https://storage.schulmanager-online.de');
});
