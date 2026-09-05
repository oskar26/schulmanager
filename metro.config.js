const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

/* ------------------------------------------------------------------ Durchreicher (CORS)
 *
 * Die Schulmanager-API (login.schulmanager-online.de) sendet **keine**
 * Access-Control-Allow-Origin-Header — Browser blockieren deshalb jeden
 * direkten fetch aus der Web-App. Der Dev-Server (und optional der
 * Export-Server, siehe scripts/web-proxy.mjs) reicht Anfragen unter
 * `…/sm-api/*` und `…/sm-storage/*` 1:1 an die Upstreams durch. Header, die
 * Browser nicht setzen dürfen (User-Agent, Origin), setzt der Durchreicher
 * serverseitig.
 *
 * Erkennung läuft über das Suffix, nicht über einen Wurzel-Pfad: Die Web-App
 * leitet ihre Requests aus ihrer eigenen Basis-URL ab und läuft damit auch
 * unter `/schulmanager/` oder einem beliebigen Unterpfad (Phase 11 — auf
 * GitHub Pages zeigte ein fest verdrahtetes `/sm-api` ins 404-HTML, und die
 * Anbindung „lud keine Daten“).
 */
const { createSmApiProxy } = require('./scripts/sm-api-proxy.cjs');

const previousEnhance = config.server?.enhanceMiddleware;

config.server = {
  ...(config.server ?? {}),
  enhanceMiddleware: (middleware, server) => {
    const inner = previousEnhance ? previousEnhance.call(config.server, middleware, server) : middleware;
    const proxy = createSmApiProxy();
    return (req, res, next) => {
      if (proxy(req, res)) return;
      return inner(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
