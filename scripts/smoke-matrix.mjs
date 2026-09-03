/**
 * Smoke-Matrix: alle Routen × drei Formfaktoren.
 * Findet sowohl Render-Crashes als auch, ob die adaptiven Layouts greifen.
 *
 *   node scripts/smoke-matrix.mjs            (volle Matrix)
 *   node scripts/smoke-matrix.mjs --quick    (Kurzfassung)
 */
import { spawnSync } from 'node:child_process';

const ROUTES = [
  '/',
  '/timetable',
  '/tasks',
  '/grades',
  '/inbox',
  '/settings',
  '/calendar',
  '/attendance',
  '/sick-note',
  '/exemption',
  '/search',
  '/thread',
  '/payments',
  '/documents',
  '/parent-talks',
  '/electives',
  '/allday',
];

const quick = process.argv.includes('--quick');
const routes = quick ? ['/', '/timetable', '/inbox', '/settings', '/payments', '/parent-talks'] : ROUTES;

const FORM_FACTORS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'desktop', width: 1600, height: 950 },
];

let failures = 0;

for (const factor of FORM_FACTORS) {
  for (const route of routes) {
    const result = spawnSync('node', ['scripts/smoke.mjs', route, `--width=${factor.width}`, `--height=${factor.height}`], {
      encoding: 'utf8',
    });
    const ok = result.status === 0;
    if (!ok) failures += 1;
    const tail = (result.stdout || '').trim().split('\n').pop() ?? '';
    console.log(`${ok ? '✅' : '❌'} [${factor.name}] ${route}  ${ok ? '' : (result.stderr ?? tail).slice(0, 300)}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} Kombination(en) fehlgeschlagen.`);
  process.exit(1);
}
console.log('\n🎉 Alle Routen in allen Formfaktoren sauber.');
