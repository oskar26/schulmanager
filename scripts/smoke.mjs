/**
 * Smoke-Test: lädt das Web-Bundle in jsdom und prüft, ob die App ohne Laufzeitfehler rendert.
 * Ersetzt keinen echten Browser, findet aber Import-, Provider- und Render-Fehler zuverlässig.
 *
 *   node scripts/smoke.mjs
 */
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const BUNDLE_URL =
  'http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=false&minify=false&hot=false&lazy=false&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable';

const response = await fetch(BUNDLE_URL);
const code = await response.text();
if (!response.ok) {
  console.error('Bundle konnte nicht gebaut werden:\n', code.slice(0, 4000));
  process.exit(1);
}
fs.writeFileSync('/tmp/schulflow-bundle.js', code);
console.log(`Bundle geladen: ${(code.length / 1e6).toFixed(1)} MB`);

const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(error));
virtualConsole.on('error', (...args) => {
  const withStack = args.find((arg) => arg && arg.stack);
  errors.push(withStack ? withStack.stack : args.map(String).join(' '));
});
virtualConsole.on('warn', () => {});
virtualConsole.on('log', (...args) => console.log('[app]', ...args));

const route = process.argv[2] ?? '/';

const dom = new JSDOM(
  `<!doctype html><html><head></head><body><div id="root"></div></body></html>`,
  {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: `http://localhost:8081${route}`,
    virtualConsole,
  },
);

dom.window.matchMedia = () => ({
  matches: false,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});
dom.window.fetch = fetch;
// jsdom kennt einige CSSOM-Typen nicht, die expo-font auf Web anfasst.
dom.window.CSSFontFaceRule = class CSSFontFaceRule {};
dom.window.CSSStyleRule = dom.window.CSSStyleRule ?? class CSSStyleRule {};
dom.window.scrollTo = () => {};
dom.window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
dom.window.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
};

try {
  dom.window.eval(code);
} catch (error) {
  errors.push(error);
}

await new Promise((resolve) => setTimeout(resolve, 4000));

const root = dom.window.document.getElementById('root');
const text = root?.textContent ?? '';

console.log('--- Gerenderter Text (Ausschnitt) ---');
console.log(text.slice(0, 700));
console.log('-------------------------------------');

if (errors.length > 0) {
  console.error(`\n${errors.length} Fehler:`);
  errors.slice(0, 3).forEach((error) => console.error(String(error?.stack ?? error).slice(0, 1200)));
  dom.window.close();
  process.exit(1);
}

if (text.trim().length < 20) {
  console.error('App hat nichts gerendert.');
  dom.window.close();
  process.exit(1);
}

console.log(`\n✅ Smoke-Test bestanden für ${route}.`);
dom.window.close();
process.exit(0);
