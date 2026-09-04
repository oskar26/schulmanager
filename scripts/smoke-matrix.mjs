/**
 * Smoke-Matrix: alle Routen × drei Formfaktoren.
 * Findet sowohl Render-Crashes als auch, ob die adaptiven Layouts greifen.
 *
 *   node scripts/smoke-matrix.mjs            (volle Matrix, Light)
 *   node scripts/smoke-matrix.mjs --quick    (Kurzfassung)
 *   node scripts/smoke-matrix.mjs --dark     (nur Dark Mode)
 *   node scripts/smoke-matrix.mjs --themes   (Light UND Dark — Phase-9-Audit)
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

// Phase 9 · Dark-Mode-Audit: dieselbe Matrix lässt sich in beiden
// Farbschemata fahren, ohne jede Route einzeln aufzurufen.
const THEMES = process.argv.includes('--themes')
  ? ['light', 'dark']
  : process.argv.includes('--dark')
    ? ['dark']
    : ['light'];

let failures = 0;

for (const theme of THEMES) {
  for (const factor of FORM_FACTORS) {
    for (const route of routes) {
      const args = ['scripts/smoke.mjs', route, `--width=${factor.width}`, `--height=${factor.height}`];
      if (theme === 'dark') args.push('--dark');
      const result = spawnSync('node', args, { encoding: 'utf8' });
      const ok = result.status === 0;
      if (!ok) failures += 1;
      const tail = (result.stdout || '').trim().split('\n').pop() ?? '';
      const label = THEMES.length > 1 || theme === 'dark' ? `${factor.name}/${theme}` : factor.name;
      console.log(`${ok ? '✅' : '❌'} [${label}] ${route}  ${ok ? '' : (result.stderr ?? tail).slice(0, 300)}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} Kombination(en) fehlgeschlagen.`);
  process.exit(1);
}
console.log('\n🎉 Alle Routen in allen Formfaktoren sauber.');
