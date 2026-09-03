/**
 * Smoke-Test: lädt das Web-Bundle in jsdom und prüft, ob die App ohne Laufzeitfehler rendert.
 * Ersetzt keinen echten Browser, findet aber Import-, Provider- und Render-Fehler zuverlässig.
 *
 *   node scripts/smoke.mjs [route] [--width=1400] [--height=900] [--expect=Sidebar-Text]
 *
 * Beispiele:
 *   node scripts/smoke.mjs /settings --width=390        # Phone
 *   node scripts/smoke.mjs / --width=1024 --height=768  # Tablet (Rail)
 *   node scripts/smoke.mjs / --width=1600 --expect=Schulflow  # Desktop (Sidebar)
 */
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const route = args.find((arg) => !arg.startsWith('--')) ?? '/';
const width = Number(flag('width', 390));
const height = Number(flag('height', 844));
const expectText = flag('expect', null);
// Phase 4 · Dark-Mode-Stichprobe: `--dark` erzwingt das dunkle Systemfarbschema.
const dark = args.includes('--dark');
// Phase 4 · Abschluss-Aufzeichnung: `--html-out=DATEI` schreibt das gerenderte
// DOM inkl. injiziertem CSS als statischen Snapshot (kein Browser nötig).
const htmlOut = flag('html-out', null);

const BUNDLE_URL =
  'http://localhost:8081/node_modules/expo-router/entry.bundle?platform=web&dev=false&minify=false&hot=false&lazy=false&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable';

const response = await fetch(BUNDLE_URL);
const code = await response.text();
if (!response.ok) {
  console.error('Bundle konnte nicht gebaut werden:\n', code.slice(0, 4000));
  process.exit(1);
}
fs.writeFileSync('/tmp/schulflow-bundle.js', code);
console.log(`Bundle geladen: ${(code.length / 1e6).toFixed(1)} MB · Fenster ${width}×${height}`);

const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => errors.push(error));
virtualConsole.on('error', (...args) => {
  const withStack = args.find((arg) => arg && arg.stack);
  errors.push(withStack ? withStack.stack : args.map(String).join(' '));
});
virtualConsole.on('warn', () => {});
virtualConsole.on('log', (...args) => console.log('[app]', ...args));

const dom = new JSDOM(
  `<!doctype html><html><head></head><body><div id="root"></div></body></html>`,
  {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: `http://localhost:8081${route}`,
    virtualConsole,
  },
);

// Fenstergröße VOR dem Bundle-Lauf setzen — Breakpoints lesen sie direkt aus.
// react-native-web bevorzugt visualViewport (jsdom: clientWidth immer 0!).
Object.defineProperty(dom.window, 'innerWidth', { value: width, configurable: true, writable: true });
Object.defineProperty(dom.window, 'innerHeight', { value: height, configurable: true, writable: true });
dom.window.visualViewport = {
  width,
  height,
  scale: 1,
  offsetLeft: 0,
  offsetTop: 0,
  pageLeft: 0,
  pageTop: 0,
  addEventListener() {},
  removeEventListener() {},
  onresize: null,
  onscroll: null,
};
dom.window.dispatchEvent(new dom.window.Event('resize'));

dom.window.matchMedia = (query) => ({
  // Im Snapshot-Modus „reduced motion“: reanimated springt dann direkt zum
  // Endzustand, statt Elemente auf opacity:0 einzufrieren (wie bei echten
  // Nutzern mit „Bewegung reduzieren“ auch).
  matches:
    (dark && String(query).includes('prefers-color-scheme: dark')) ||
    (htmlOut && String(query).includes('prefers-reduced-motion: reduce')),
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

if (expectText && !text.includes(expectText)) {
  console.error(`Erwarteter Text fehlt: „${expectText}“`);
  dom.window.close();
  process.exit(1);
}

if (htmlOut) {
  // CSSOM → CSS-Text: react-native-css-interop legt seine Regeln per insertRule
  // in (leere) <style>-Tags; für den statischen Snapshot serialisieren wir alle
  // Stylesheets zurück in lesbaren CSS-Text.
  const sheet = dom.window.document.createElement('style');
  sheet.setAttribute('data-snapshot', 'cssom');
  const rules = [];
  for (const styleSheet of dom.window.document.styleSheets) {
    try {
      for (const rule of styleSheet.cssRules) rules.push(rule.cssText);
    } catch {}
  }
  // NativeWind-Utility-CSS liegt im Produktiv-Export als eigene Datei — beim
  // Dev-Bundle-Snapshot fehlt sie, daher hier explizit einlesen (wenn da).
  const cssDir = new URL('../dist/_expo/static/css/', import.meta.url);
  try {
    for (const file of fs.readdirSync(cssDir)) {
      if (file.endsWith('.css')) {
        rules.push(fs.readFileSync(new URL(file, cssDir), 'utf8'));
      }
    }
  } catch {}
  sheet.textContent = rules.join('\n');
  dom.window.document.head.appendChild(sheet);

  // Standalone-Rahmen: RNWs Layout verlangt height:100% bis #root; Phone-
  // Snapshots bekommen eine feste 390×844-Kachel auf neutralem Untergrund.
  const frame = dom.window.document.createElement('style');
  frame.setAttribute('data-snapshot', 'frame');
  const phone = width < 700;
  frame.textContent = phone
    ? `html,body{margin:0;padding:0;height:100%;background:${dark ? '#0b0c0e' : '#e7e4dc'};}`
      + `#root{width:${width}px;height:${height}px;margin:0 auto;box-shadow:0 18px 60px rgba(0,0,0,${dark ? 0.6 : 0.18});}`
    : 'html,body{margin:0;padding:0;height:100%;}#root{height:100%;}';
  dom.window.document.head.appendChild(frame);
  const doc = dom.window.document;
  doc.title = doc.title || `Schulflow ${route}${dark ? ' · dark' : ''} @ ${width}px`;
  let html = doc.documentElement.outerHTML;
  // Eingefrorene Entering-Animationen (reanimated läuft in jsdom nicht) auf den
  // Endzustand heben: Muster „opacity: 0; transform: translateY(...)“ kommt im
  // Ruhezustand der App nicht vor — es ist ausschließlich der FadeInUp-Startwert.
  html = html.replace(/opacity: 0; transform: translateY\([0-9.]+px\)/g, 'opacity: 1');
  fs.writeFileSync(htmlOut, `<!doctype html>\n${html}`);
  console.log(`Snapshot geschrieben: ${htmlOut} (${rules.length} CSS-Regeln)`);
}

console.log(`\n✅ Smoke-Test bestanden für ${route} @ ${width}×${height}${dark ? ' · dark' : ''}${expectText ? ` (mit „${expectText}“)` : ''}.`);
dom.window.close();
process.exit(0);
