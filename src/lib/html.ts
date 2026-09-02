/** Sehr kleiner HTML→Text-Konverter für Elternbriefe, Tiles und Termin-Beschreibungen. */

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&auml;': 'ä',
  '&ouml;': 'ö',
  '&uuml;': 'ü',
  '&Auml;': 'Ä',
  '&Ouml;': 'Ö',
  '&Uuml;': 'Ü',
  '&szlig;': 'ß',
  '&hellip;': '…',
  '&ndash;': '–',
  '&mdash;': '—',
  '&euro;': '€',
  '&deg;': '°',
  '&laquo;': '«',
  '&raquo;': '»',
  '&bdquo;': '„',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&sbquo;': '‚',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&bull;': '•',
  '&middot;': '·',
  '&shy;': '',
  '&apos;': "'",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (entity, body: string) => {
    if (ENTITIES[entity]) return ENTITIES[entity];
    if (body.startsWith('#')) {
      const codePoint = body[1] === 'x' || body[1] === 'X'
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      if (Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10ffff) {
        return String.fromCodePoint(codePoint);
      }
    }
    return entity;
  });
}

export function htmlToText(html?: string | null): string {
  if (!html) return '';
  return decodeEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
      .replace(/<\s*li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

export function excerpt(text: string, length = 140): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= length ? clean : `${clean.slice(0, length - 1)}…`;
}
