/**
 * Leerzustand-Illustrationen — Redesign Phase 9.
 *
 * Kleine, emoji-freie Inline-SVGs (Entscheidungs-Log #7). Alle Illustrationen
 * zeichnen ausschließlich in der Vordergrundfarbe ihrer Umgebung
 * (`ink`-Prop, gespeist aus `useBlockInk()`): auf weißem Canvas ist das `colors.ink`, innerhalb einer
 * `ColorBlockCard` die kontrastsichere Blockfarbe (via `EmptyState`). Dadurch funktionieren sie
 * automatisch in Light **und** Dark Mode und auf jeder der 13 Blockfarben —
 * ohne eigene Farbtabelle.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { tint } from '@/design/subjects';

const WIDTH = 126;
const HEIGHT = 88;

export type IllustrationName =
  | 'free-day'
  | 'all-done'
  | 'empty-inbox'
  | 'no-messages'
  | 'no-grades'
  | 'no-results'
  | 'search'
  | 'empty-folder'
  | 'no-events'
  | 'no-absences'
  | 'locked'
  | 'nothing-here';

interface Ink {
  ink: string;
  soft: string;
  softer: string;
}

function inkSet(ink: string): Ink {
  return { ink, soft: tint(ink, 0.13), softer: tint(ink, 0.08) };
}

/** Gemeinsamer Rahmen: feste Bühne, damit alle Leerzustände gleich hoch sind. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ width: WIDTH, height: HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} accessible={false}>
        {children}
      </Svg>
    </View>
  );
}

/** Sonne + Heft + Wolke: schulfreier Tag / kein Unterricht. */
function FreeDay({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Circle cx="21" cy="19" r="11" fill={soft} />
      <Line x1="21" y1="2" x2="21" y2="7" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="4" y1="19" x2="9" y2="19" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="33" y1="7" x2="37" y2="3" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      <Rect x="39" y="26" width="54" height="43" rx="11" fill={softer} stroke={ink} strokeWidth="2.2" />
      <Path d="M49 38h34M49 47h25M49 56h18" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M95 57c8-1 14 4 16 12-8 3-16 0-19-7" fill={soft} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
      <Path d="M93 68c5-5 10-8 16-10" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="105" cy="24" r="3" fill={ink} opacity="0.72" />
      <Circle cx="114" cy="34" r="2" fill={ink} opacity="0.42" />
    </Stage>
  );
}

/** Abgehakte Liste mit Konfetti: alles erledigt. */
function AllDone({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Rect x="26" y="14" width="62" height="60" rx="14" fill={softer} stroke={ink} strokeWidth="2.2" />
      <Path d="M37 32l5 5 9-10" stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M37 50l5 5 9-10" stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M58 32h20M58 50h14" stroke={ink} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
      <Circle cx="100" cy="26" r="9" fill={soft} />
      <Path d="M95 26l4 4 7-8" stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 22l-4-4M15 46h-6M104 58l6 4" stroke={ink} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <Circle cx="14" cy="62" r="2.5" fill={ink} opacity="0.4" />
      <Circle cx="112" cy="44" r="2" fill={ink} opacity="0.4" />
    </Stage>
  );
}

/** Offener Briefumschlag: keine Elternbriefe. */
function EmptyInbox({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Rect x="24" y="26" width="78" height="50" rx="12" fill={softer} stroke={ink} strokeWidth="2.2" />
      <Path d="M24 38l35 22a6 6 0 006 0l37-23" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="43" y="8" width="40" height="26" rx="8" fill={soft} stroke={ink} strokeWidth="2.2" />
      <Path d="M52 18h22M52 25h14" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="14" cy="34" r="2.5" fill={ink} opacity="0.35" />
      <Circle cx="112" cy="18" r="2" fill={ink} opacity="0.35" />
    </Stage>
  );
}

/** Zwei Sprechblasen: keine Nachrichten. */
function NoMessages({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Path
        d="M18 20h56a10 10 0 0110 10v20a10 10 0 01-10 10H42l-14 11V60h-10a10 10 0 01-10-10V30a10 10 0 0110-10z"
        fill={softer}
        stroke={ink}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <Path d="M28 34h34M28 45h22" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      <Path
        d="M92 12h18a8 8 0 018 8v14a8 8 0 01-8 8h-3l-9 7v-7h-6a8 8 0 01-8-8V20a8 8 0 018-8z"
        fill={soft}
        stroke={ink}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </Stage>
  );
}

/** Zeugnis mit Stern: keine Noten. */
function NoGrades({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Rect x="30" y="10" width="58" height="68" rx="13" fill={softer} stroke={ink} strokeWidth="2.2" />
      <Path d="M41 30h36M41 42h28M41 54h20" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="94" cy="60" r="15" fill={soft} stroke={ink} strokeWidth="2.2" />
      <Path
        d="M94 51l3 6 6.5.9-4.8 4.6 1.2 6.5L94 66l-5.9 3 1.2-6.5-4.8-4.6 6.5-.9z"
        fill={ink}
        opacity="0.75"
      />
      <Circle cx="18" cy="26" r="2.5" fill={ink} opacity="0.35" />
      <Circle cx="20" cy="60" r="2" fill={ink} opacity="0.3" />
    </Stage>
  );
}

/** Lupe mit leerer Fläche: keine Treffer. */
function NoResults({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Circle cx="54" cy="38" r="26" fill={softer} stroke={ink} strokeWidth="2.4" />
      <Path d="M73 57l18 18" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M44 38h20" stroke={ink} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <Circle cx="54" cy="38" r="14" fill={soft} opacity="0.7" />
      <Circle cx="104" cy="26" r="2.5" fill={ink} opacity="0.35" />
      <Circle cx="20" cy="70" r="2" fill={ink} opacity="0.3" />
    </Stage>
  );
}

/** Lupe über Karten: Suche starten. */
function SearchStart({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Rect x="14" y="20" width="48" height="14" rx="7" fill={softer} stroke={ink} strokeWidth="2" />
      <Rect x="14" y="42" width="36" height="14" rx="7" fill={softer} stroke={ink} strokeWidth="2" />
      <Rect x="14" y="64" width="44" height="14" rx="7" fill={softer} stroke={ink} strokeWidth="2" />
      <Circle cx="90" cy="36" r="20" fill={soft} stroke={ink} strokeWidth="2.4" />
      <Path d="M104 50l12 12" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
    </Stage>
  );
}

/** Offener Ordner: leeres Verzeichnis. */
function EmptyFolder({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Path
        d="M20 24a8 8 0 018-8h18l8 9h26a8 8 0 018 8v33a8 8 0 01-8 8H28a8 8 0 01-8-8z"
        fill={softer}
        stroke={ink}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <Path d="M20 40h88l-9 26a8 8 0 01-7.6 5.5H28" fill={soft} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
      <Circle cx="112" cy="22" r="2.5" fill={ink} opacity="0.35" />
    </Stage>
  );
}

/** Kalenderblatt: keine Termine. */
function NoEvents({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Rect x="22" y="16" width="82" height="60" rx="14" fill={softer} stroke={ink} strokeWidth="2.2" />
      <Path d="M22 34h82" stroke={ink} strokeWidth="2.2" />
      <Line x1="42" y1="8" x2="42" y2="22" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
      <Line x1="84" y1="8" x2="84" y2="22" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
      <Circle cx="43" cy="49" r="4" fill={soft} />
      <Circle cx="63" cy="49" r="4" fill={soft} />
      <Circle cx="83" cy="49" r="4" fill={soft} />
      <Circle cx="43" cy="64" r="4" fill={soft} />
      <Circle cx="63" cy="64" r="4" fill={ink} opacity="0.55" />
      <Circle cx="83" cy="64" r="4" fill={soft} />
    </Stage>
  );
}

/** Schild mit Haken: keine Fehlzeiten. */
function NoAbsences({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Path
        d="M63 8l30 11v22c0 18-12 32-30 39-18-7-30-21-30-39V19z"
        fill={softer}
        stroke={ink}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <Path d="M63 20l20 7.5V44c0 12-8 21-20 26-12-5-20-14-20-26V27.5z" fill={soft} />
      <Path d="M52 44l8 8 16-17" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="16" cy="30" r="2.5" fill={ink} opacity="0.32" />
      <Circle cx="110" cy="52" r="2" fill={ink} opacity="0.32" />
    </Stage>
  );
}

/** Schloss: Modul nicht freigeschaltet / nicht sichtbar. */
function Locked({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Path d="M45 40V29a18 18 0 0136 0v11" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
      <Rect x="32" y="38" width="62" height="42" rx="14" fill={softer} stroke={ink} strokeWidth="2.4" />
      <Circle cx="63" cy="56" r="8" fill={soft} stroke={ink} strokeWidth="2.2" />
      <Path d="M63 62v8" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
      <Circle cx="18" cy="24" r="2.5" fill={ink} opacity="0.32" />
      <Circle cx="110" cy="30" r="2" fill={ink} opacity="0.32" />
    </Stage>
  );
}

/** Neutrale, leere Fläche: generischer Leerzustand. */
function NothingHere({ ink, soft, softer }: Ink) {
  return (
    <Stage>
      <Rect x="24" y="22" width="78" height="52" rx="16" fill={softer} stroke={ink} strokeWidth="2.2" />
      <Path d="M40 44h46" stroke={ink} strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
      <Circle cx="63" cy="12" r="5" fill={soft} stroke={ink} strokeWidth="2" />
      <Circle cx="16" cy="58" r="2.5" fill={ink} opacity="0.32" />
      <Circle cx="112" cy="60" r="2" fill={ink} opacity="0.32" />
    </Stage>
  );
}

const RENDERERS: Record<IllustrationName, (ink: Ink) => React.ReactElement> = {
  'free-day': FreeDay,
  'all-done': AllDone,
  'empty-inbox': EmptyInbox,
  'no-messages': NoMessages,
  'no-grades': NoGrades,
  'no-results': NoResults,
  search: SearchStart,
  'empty-folder': EmptyFolder,
  'no-events': NoEvents,
  'no-absences': NoAbsences,
  locked: Locked,
  'nothing-here': NothingHere,
};

/**
 * Zeichnet eine der Leerzustand-Illustrationen. Wird normalerweise nicht direkt
 * verwendet, sondern über `<EmptyState illustration="free-day" …>`; `ink` ist
 * die Vordergrundfarbe der Umgebung (`useBlockInk()`), damit dieses Modul
 * keine Abhängigkeit zurück auf `primitives` braucht (Zyklus-frei).
 */
export function Illustration({ name, ink }: { name: IllustrationName; ink: string }) {
  const render = RENDERERS[name] ?? NothingHere;
  return render(inkSet(ink));
}

export const ILLUSTRATION_NAMES = Object.keys(RENDERERS) as IllustrationName[];
