#!/usr/bin/env node
/**
 * Schulflow · Styling-Pipeline-Arzt  (Redesign Phase 10)
 * =====================================================
 *
 * Warum es dieses Skript gibt
 * --------------------------
 * Die installierte Android-App zeigte fast überall kein Styling mehr, obwohl
 * Web-Entwicklung und Web-Build perfekt aussahen. Ursache war *kein*
 * Stylesheet-Ausfall, sondern eine aufgesplittete NativeWind-Laufzeit:
 *
 *   · `nativewind@4` verlangt exakt `react-native-css-interop@0.2.6`
 *   · das Projekt pinnte zusätzlich `react-native-css-interop@^0.1.22` ganz oben
 *
 * npm legt dann beide Kopien ab. Metros NativeWind-Transformer schreibt den
 * kompilierten CSS-Payload in die **eine** Laufzeit (die aus dem generierten
 * `.cache`-Modul aufgelöst wird), während Babel in jede Screen-Datei
 * `require("react-native-css-interop/jsx-runtime")` injiziert — und der leere
 * Specifier löst von `app/` bzw. `src/` aus nach **0.1.22**. Zwei Registry-
 * Instanzen: die Screens fragen in einer leinen Stylesheet-Tabelle nach →
 * auf nativ stirbt jedes `className`, während inline gesetzte `style`-Props
 * (Bottom-Nav, Farbflächen, Pills, Switches) überleben. Auf Web läuft alles
 * über echte CSS-Klassen und bleibt deshalb unauffällig.
 *
 * Genau dieser Zustand ist mit bloßem Hinsehen nicht zu entdecken — deshalb
 * prüft dieses Skript die Invarianten der Pipeline und läuft in CI **vor**
 * `expo prebuild`. Ein kaputter APK-Build wird damit unmöglich.
 *
 * Benutzung:  npm run doctor   (bzw. `node scripts/style-pipeline-check.mjs`)
 * Exit-Code  != 0  → Pipeline defekt, Build abbrechen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(path.join(ROOT, 'noop.js'));
const appReq = createRequire(path.join(ROOT, 'app', '_layout.tsx'));

const results = [];
const ok = (name, detail = '') => results.push({ level: 'ok', name, detail });
const warn = (name, detail) => results.push({ level: 'warn', name, detail });
const fail = (name, detail) => results.push({ level: 'fail', name, detail });

const read = (rel) => {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return null;
  }
};
const pkg = (rel) => {
  try {
    return JSON.parse(read(rel));
  } catch {
    return null;
  }
};

const root = pkg('package.json');
if (!root) {
  console.error('✗ package.json nicht lesbar — von wo wird das Skript gestartet?');
  process.exit(2);
}

/* ------------------------------------------------- 1) genau EINE css-interop */

/** Alle physisch vorhandenen Kopien von react-native-css-interop im Projekt. */
function findCssInteropCopies() {
  const found = [];
  const base = path.join(ROOT, 'node_modules');
  if (!fs.existsSync(base)) return found;
  const queue = [base];
  const seen = new Set();
  while (queue.length) {
    const dir = queue.shift();
    if (seen.has(dir)) continue;
    seen.add(dir);
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name.startsWith('@')) {
        queue.push(full);
        continue;
      }
      if (entry.name === 'react-native-css-interop') {
        found.push(full);
        continue;
      }
      // verschachtelte node_modules weiterer Pakete (npm-Deduping-Fälle)
      if (fs.existsSync(path.join(full, 'node_modules'))) queue.push(path.join(full, 'node_modules'));
    }
  }
  return found;
}

const nwPkg = pkg('node_modules/nativewind/package.json');
if (!nwPkg) {
  fail('nativewind installiert', 'node_modules/nativewind fehlt — `npm ci` ausführen.');
} else {
  ok('nativewind installiert', `nativewind@${nwPkg.version}`);
}

const wanted = nwPkg?.dependencies?.['react-native-css-interop'] ?? null;
const copies = findCssInteropCopies();
const interopPkgs = copies
  .map((dir) => ({ dir, json: pkg(path.relative(ROOT, path.join(dir, 'package.json'))) }))
  .filter((entry) => entry.json);

if (copies.length === 0) {
  fail('react-native-css-interop vorhanden', 'Keine Kopie gefunden — `npm ci` fehlt oder node_modules ist beschädigt.');
} else if (copies.length > 1) {
  fail(
    'genau eine Kopie von react-native-css-interop',
    [
      `${copies.length} Kopien gefunden:`,
      ...copies.map((c) => `  · ${path.relative(ROOT, c)}@${interopPkgs.find((p) => p.dir === c)?.json?.version ?? '?'}`),
      '→ Die NativeWind-Laufzeit splittet sich: „className“ bleibt auf nativ ohne Effekt,',
      '  während inline gesetzte style-Props überleben (das Muster aus Phase 10).',
      `Fix: react-native-css-interop auf exakt ${wanted ?? 'die von nativewind verlangte'} Version pinnen`,
      '     (package.json: dependencies + overrides), dann: rm -rf node_modules && npm install',
    ].join('\n      '),
  );
} else {
  const version = interopPkgs[0]?.json?.version ?? 'unbekannt';
  if (wanted && version !== wanted.replace(/^[\^~]/, '')) {
    fail(
      'css-interop-Version == nativewind-Erwartung',
      `installiert ${version}, nativewind@${nwPkg.version} verlangt ${wanted}.`,
    );
  } else {
    ok('genau eine Kopie von react-native-css-interop', `react-native-css-interop@${version}`);
  }
}

/** Die Pin im eigenen package.json muss zu nativewind passen (CI-Gegencheck). */
const ownPin = root.dependencies?.['react-native-css-interop'] ?? root.devDependencies?.['react-native-css-interop'] ?? null;
if (ownPin && wanted && ownPin.replace(/^[\^~]/, '') !== wanted.replace(/^[\^~]/, '')) {
  fail(
    'package.json-Pin konsistent mit nativewind',
    `package.json pinnt ${ownPin}, nativewind will ${wanted}. Ersteres war die Ursache des APK-Styling-Ausfalls.`,
  );
} else if (ownPin) {
  ok('package.json-Pin konsistent mit nativewind', ownPin);
} else if (wanted) {
  warn(
    'package.json-Pin für css-interop fehlt',
    `ohne eigene Pin entscheidet npm über die Platzierung; empfohlen: "react-native-css-interop": "${wanted}" + overrides.`,
  );
}

if (!root.overrides?.['react-native-css-interop'] && wanted) {
  warn(
    'overrides für css-interop gesetzt',
    `ohne Override kann ein transitives Paket eine zweite Kopie mitbringen. Empfohlen: "overrides": { "react-native-css-interop": "${wanted}" }`.replace(/\n/g, '\n      '),
  );
} else {
  ok('overrides für css-interop gesetzt', JSON.stringify(root.overrides?.['react-native-css-interop'] ?? null));
}

/* ------------------------------------- 2) Auflösungs-Symmetrie (der eigentliche Bug) */

/**
 * Der Kern-Test: Das JSX-Runtime, das Babel in jede Screen-Datei injiziert, und
 * das Runtime-Modul, in das der kompilierte CSS-Payload fließt, müssen
 * identisch sein. Wir imitieren beide Auflösungspfade.
 */
const appSpecifier = 'react-native-css-interop/jsx-runtime';
const payloadSpecifier = 'react-native-css-interop/dist/runtime/native/styles';
const cacheProbe = path.join(ROOT, 'node_modules', 'react-native-css-interop', '.cache', 'probe.js');

let appResolved = null;
let payloadResolved = null;
try {
  appResolved = appReq.resolve(appSpecifier);
} catch {
  fail('jsx-runtime aus app/ auflösbar', `${appSpecifier} findet kein Modul → nativer Build hat gar kein NativeWind-Runtime.`);
}
try {
  payloadResolved = createRequire(cacheProbe).resolve(payloadSpecifier);
} catch {
  // node_modules/react-native-css-interop/.cache existiert ggf. vor dem ersten Build nicht.
  payloadResolved = (() => {
    try {
      return req.resolve(payloadSpecifier);
    } catch {
      return null;
    }
  })();
}

const rootOf = (file) => {
  if (!file) return null;
  const marker = `${path.sep}react-native-css-interop${path.sep}`;
  const at = file.lastIndexOf(marker);
  return at === -1 ? path.dirname(file) : file.slice(0, at + marker.length - 1);
};

if (appResolved && payloadResolved) {
  if (rootOf(appResolved) === rootOf(payloadResolved)) {
    ok('JSX-Runtime und CSS-Payload teilen eine Laufzeit', path.relative(ROOT, rootOf(appResolved)));
  } else {
    fail(
      'JSX-Runtime und CSS-Payload teilen eine Laufzeit',
      `Screens nutzen ${path.relative(ROOT, rootOf(appResolved))},\n      der kompilierte CSS-Payload landet in ${path.relative(ROOT, rootOf(payloadResolved))}.\n      → Genau dieser Fall ließ das Styling im APK verschwinden (Phase 10).`,
    );
  }
}

/* --------------------------------------------------- 3) babel / metro / entry */

const babel = read('babel.config.js') ?? '';
if (!/jsxImportSource:\s*['"]nativewind['"]/.test(babel)) {
  fail("babel: jsxImportSource 'nativewind'", 'ohne diese Einstellung läuft kein className durch NativeWind.');
} else {
  ok("babel: jsxImportSource 'nativewind'");
}
if (!/nativewind\/babel/.test(babel)) {
  fail('babel: Preset nativewind/babel', 'der Preset erzeugt die className-Interop-Bausteine.');
} else {
  ok('babel: Preset nativewind/babel');
}

const metro = read('metro.config.js') ?? '';
if (!/withNativeWind\s*\(/.test(metro)) {
  fail('metro: withNativeWind()', 'metro.config.js muss `withNativeWind(config, { input: "./global.css" })` nutzen.');
} else {
  ok('metro: withNativeWind()');
}
if (!/['"]\.\/global\.css['"]/.test(metro)) {
  fail('metro: Input global.css', 'NativeWind braucht den Pfad zur CSS-Datei als Transformer-Input.');
} else {
  ok('metro: Input global.css');
}

const layout = read('app/_layout.tsx') ?? '';
if (!/import\s+['"]\.\.\/global\.css['"]/.test(layout)) {
  fail('app/_layout.tsx importiert ../global.css', 'ohne Import wird das Stylesheet nie in den Bundle-Graph aufgenommen.');
} else {
  ok('app/_layout.tsx importiert ../global.css');
}

/* --------------------------------------------------------- 4) tailwind-config */

const tw = read('tailwind.config.js') ?? '';
if (!tw) {
  fail('tailwind.config.js gefunden');
} else {
  if (!/nativewind\/preset/.test(tw)) {
    fail('tailwind: nativewind/preset', 'ohne Preset fehlen die NativeWind-Utilities (u. a. className-Unterstützung).');
  } else {
    ok('tailwind: nativewind/preset');
  }
  const content = tw.match(/content:\s*\[([^\]]*)\]/s)?.[1] ?? '';
  for (const glob of ['./app/', './src/']) {
    if (!content.includes(glob)) {
      fail(`tailwind: content deckt ${glob} ab`, 'Klassen in Dateien außerhalb der content-Globs werden nie kompiliert — auf Web unsichtbar, nativ komplett weg.');
    }
  }
  if (!/content:\s*\[[^\]]*\]/s.test(tw)) warn('tailwind: content-Globs', 'keine content-Zeile gefunden — Klassenfallen könnten fehlen.');
  else ok('tailwind: content-Globs erfassen app/ und src/');

  // className-Nutzung außerhalb der konfigurierten Globs wäre eine stille Lücke.
  const outside = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full !== path.join(ROOT, 'app') && full !== path.join(ROOT, 'src')) walk(full);
        continue;
      }
      if (!/\.(tsx|jsx)$/.test(entry.name)) continue;
      const rel = path.relative(ROOT, full);
      if (rel.startsWith('app/') || rel.startsWith('src/')) continue;
      if (/className=/.test(fs.readFileSync(full, 'utf8'))) outside.push(rel);
    }
  };
  try {
    walk(ROOT);
  } catch {
    /* readdir-Fehler sind hier unkritisch */
  }
  if (outside.length) {
    warn('alle className-Dateien liegen in den content-Globs', `${outside.join(', ')} nutzt className außerhalb von app/ und src/.`);
  } else {
    ok('alle className-Dateien liegen in den content-Globs');
  }
}

/* ------------------------------------------------------------- 5) CSS-Größe */

const css = read('global.css');
if (!css) fail('global.css vorhanden');
else if (css.length < 500) warn('global.css Umfang', `nur ${css.length} Zeichen — Stylesheet wirkt abgeschnitten.`);
else ok('global.css vorhanden', `${css.length} Zeichen`);

/* ------------------------------------- 6) --built: wurden Styles wirklich kompiliert? */

if (process.argv.includes('--built') || process.argv.some((a) => a.startsWith('--built='))) {
  const arg = process.argv.find((a) => a.startsWith('--built='));
  const requested = arg ? arg.slice('--built='.length).split(',').filter(Boolean) : null;
  const cacheDir = path.join(ROOT, 'node_modules', 'react-native-css-interop', '.cache');
  const sizeOf = (platform) => {
    const file = path.join(cacheDir, `${platform}.js`);
    return fs.existsSync(file) ? fs.statSync(file).size : -1;
  };

  if (!fs.existsSync(cacheDir)) {
    fail('Native-Styles kompiliert', `${path.relative(ROOT, cacheDir)} existiert nicht — lief der Build mit diesem metro.config.js?`);
  } else if (requested) {
    // CI weiß, welches Platform-Target gebaut wird → gezielter Fehler.
    for (const platform of requested) {
      const size = sizeOf(platform);
      if (size < 1000) {
        fail(
          `Native-Styles kompiliert (${platform})`,
          `Kompiliertes StyleSheet: ${size < 0 ? 'Datei fehlt' : `${size} Byte`}. NativeWind hat für dieses Target keine Klassen erzeugt — der Build wäre ungestylt.`,
        );
      } else {
        ok(`Native-Styles kompiliert (${platform})`, `${size} Byte StyleSheet-Registry`);
      }
    }
  } else {
    // Ohne Ziel: mindestens ein natives Target muss gefüllt sein. Leere Dateien
    // legt der Metro-Plugin für alle Plattformen an („noch nicht gebaut“).
    const filled = ['android', 'ios', 'native', 'macos', 'windows'].filter((platform) => sizeOf(platform) >= 1000);
    if (filled.length) {
      ok('Native-Styles kompiliert', filled.map((platform) => `${platform}: ${sizeOf(platform)} Byte`).join(' · '));
    } else {
      fail('Native-Styles kompiliert', 'Kein natives Target hat ein nicht-leeres StyleSheet — className-Styling kann nicht funktionieren.');
    }
  }
}

/* ------------------------------------------------------------------- Bericht */

const label = { ok: '✅', warn: '⚠️ ', fail: '❌' };
console.log('\nSchulflow · Styling-Pipeline (Phase 10)\n' + '─'.repeat(52));
for (const item of results) {
  console.log(`${label[item.level]} ${item.name}${item.detail ? `\n      ${item.detail}` : ''}`);
}
const failures = results.filter((r) => r.level === 'fail');
const warnings = results.filter((r) => r.level === 'warn');
console.log('─'.repeat(52));
if (failures.length) {
  console.log(`❌ ${failures.length} Fehler, ${warnings.length} Warnungen — Build stoppen, sonst wird eine ungestylte App ausgeliefert.`);
} else {
  console.log(`✅ Alle Invarianten erfüllt (${results.length} Prüfungen, ${warnings.length} Warnungen).`);
  console.log('   Jeder dieser Punkte war einmal die Ursache für „APK ohne Styling“ — bricht einer weg,');
  console.log('   schlägt dieser Check in CI laut auf, statt dass Nutzer:innen eine halbfertige App sehen.');
}
process.exit(failures.length ? 1 : 0);
