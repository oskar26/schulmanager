/**
 * Rendert die App-Icons aus den SVG-Logos.
 *
 *   node scripts/render-icons.mjs
 *
 * Quelle: assets/logos/01-flow.svg (Primärmarke)
 */
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = path.resolve(import.meta.dirname, '..');
const outputs = [
  { svg: 'assets/logos/01-flow.svg', out: 'assets/icon.png', width: 1024 },
  { svg: 'assets/logos/01-flow.svg', out: 'assets/favicon.png', width: 96 },
  { svg: 'assets/logos/01-flow.svg', out: 'assets/adaptive-icon.png', width: 1024, padding: 0.34 },
  { svg: 'assets/logos/01-flow.svg', out: 'assets/splash-icon.png', width: 1024, padding: 0.3 },
  { svg: 'assets/logos/01-flow.svg', out: 'assets/logos/preview-01-flow.png', width: 256 },
  { svg: 'assets/logos/02-bookmark.svg', out: 'assets/logos/preview-02-bookmark.png', width: 256 },
  { svg: 'assets/logos/03-bubble-grid.svg', out: 'assets/logos/preview-03-bubble-grid.png', width: 256 },
  { svg: 'assets/logos/04-pencil-clock.svg', out: 'assets/logos/preview-04-pencil-clock.png', width: 256 },
  { svg: 'assets/logos/05-owl.svg', out: 'assets/logos/preview-05-owl.png', width: 256 },
  { svg: 'assets/logos/wordmark.svg', out: 'assets/logos/preview-wordmark.png', width: 720 },
];

for (const { svg, out, width, padding = 0 } of outputs) {
  let source = fs.readFileSync(path.join(root, svg), 'utf8');
  if (padding > 0) {
    // Android-Adaptive-Icons und Splash brauchen Luft: Marke auf transparentem Quadrat zentrieren.
    const scale = 1 - padding;
    const offset = (512 * padding) / 2;
    source = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><g transform="translate(${offset} ${offset}) scale(${scale})">${source
      .replace(/<\?xml[^>]*\?>/, '')
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')}</g></svg>`;
  }
  const renderer = new Resvg(source, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true },
  });
  const png = renderer.render().asPng();
  fs.mkdirSync(path.dirname(path.join(root, out)), { recursive: true });
  fs.writeFileSync(path.join(root, out), png);
  console.log(`${out} (${width}px, ${(png.length / 1024).toFixed(0)} kB)`);
}
