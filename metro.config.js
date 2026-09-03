const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

/* ------------------------------------------------------------------ Dev-Proxy (CORS)
 *
 * Die Schulmanager-API (login.schulmanager-online.de) sendet **keine**
 * Access-Control-Allow-Origin-Header — Browser blockieren deshalb jeden
 * direkten fetch aus der Web-App. Der Dev-Server (und optional der
 * Export-Server, siehe scripts/web-proxy.mjs) reicht Anfragen unter
 * `/sm-api/*` deshalb 1:1 an die API durch. Header, die Browser nicht
 * setzen dürfen (User-Agent, Origin), macht der Proxy serverseitig.
 */
const { createSmApiProxy } = require('./scripts/sm-api-proxy.cjs');

const SM_API_PREFIX = '/sm-api';
const previousEnhance = config.server?.enhanceMiddleware;

config.server = {
  ...(config.server ?? {}),
  enhanceMiddleware: (middleware, server) => {
    const inner = previousEnhance ? previousEnhance.call(config.server, middleware, server) : middleware;
    const proxy = createSmApiProxy();
    return (req, res, next) => {
      if (req.url && req.url.startsWith(`${SM_API_PREFIX}/`)) {
        proxy(req, res, SM_API_PREFIX);
        return;
      }
      return inner(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
