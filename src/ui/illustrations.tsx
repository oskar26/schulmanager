/**
 * Leerzustand-Illustrationen — Redesign Phase 9 („Politur & Regression“).
 *
 * Kernprinzip 9 der Zielstil-Tabelle verlangt für leere Zustände eine kleine
 * verspielte Illustration statt nur Icon + Text. Entscheidungs-Log #7 legt
 * fest: **kleine Inline-SVGs** (`react-native-svg`), **keine Emojis**.
 *
 * Aufbau jeder Illustration:
 * · eine weiche Farbfläche (Kreis/Blob) in der Kontextfarbe (Fach, Kategorie,
 *   Priorität) — dieselbe Sprache wie `ColorBlockCard`,
 * · darüber eine schlichte Strichzeichnung in der Vordergrundfarbe,
 * · optionale Akzentpunkte („Konfetti“) für Erfolgsmomente.
 *
 * Die Illustrationen sind bewusst farbagnostisch: Sie bekommen `color`
 * (Flächenfarbe) und leiten Kontrast + Tönung selbst ab, damit sie in Light
 * **und** Dark auf Canvas, Surface und Farbflächen lesbar bleiben.
 */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { resolveThemeColor } from '@/design/tokens';
import { tint } from '@/design/subjects';
import { useThemeColors } from '@/design/theme';
import { useBlockContext } from '@/ui/block-context';

export type IllustrationName =
  | 'calendar' // keine Termine / kein Stundenplan-Tag
  | 'lessons' // schulfreier Tag (Sonne + Heft)
  | 'tasks' // keine Aufgaben (Checkliste)
  | 'celebrate' // alles erledigt (Konfetti)
  | 'mail' // keine Briefe / Nachrichten
  | 'grades' // keine Noten (Diagramm)
  | 'board' // kein Aushang (Pinnwand)
  | 'search' // Suche: Startzustand / nichts gefunden
  | 'documents' // keine Dateien
  | 'payments' // keine Rechnungen
  | 'attendance'; // keine Fehlzeiten

const SIZE = 96;

/**
 * Illustration — quadratisches Inline-SVG (Default 96 dp) mit weicher
 * Hintergrundfläche in `color` und Strichmotiv in der passenden
 * Vordergrundfarbe.
 */
export function Illustration({
  name,
  color,
  size = SIZE,
}: {
  name: IllustrationName;
  /** Kontextfarbe (Block-, Fach- oder Semantikfarbe); Default Violet. */
  color?: string;
  size?: number;
}) {
  const { colors, isDark } = useThemeColors();
  const block = useBlockContext();
  // Innerhalb einer `ColorBlockCard` gilt die Vordergrundfarbe der Fläche —
  // nur sie ist auf allen 13 Blockfarben × Light/Dark garantiert lesbar
  // (dieselbe Regel wie bei Sparkline & Qualitätsbalken, Log #15).
  const base = block ? block.fg : resolveThemeColor(color ?? colors.accent.violet, isDark);
  // Fläche bleibt dezent (Tönung), Strich nimmt die Vollfarbe: so funktioniert
  // dieselbe Illustration auf Canvas, weißer Karte und in Dark.
  const wash = tint(base, block ? 0.14 : isDark ? 0.22 : 0.16);
  const line = base;
  // „Papier“ ist auf Farbflächen transparent (sonst stanzt ein weißer Block
  // ein Loch in die Fläche), sonst die Surface-Farbe.
  const paper = block ? 'transparent' : colors.surface;

  const stroke = {
    stroke: line,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as string,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityRole="image">
      {/* Weiche Grundfläche — der „Farbfleck“ hinter jedem Motiv. */}
      <Circle cx={48} cy={48} r={40} fill={wash} />
      {renderMotif(name, { stroke, line, paper, wash })}
    </Svg>
  );
}

type MotifContext = {
  stroke: {
    stroke: string;
    strokeWidth: number;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
    fill: string;
  };
  line: string;
  paper: string;
  wash: string;
};

function renderMotif(name: IllustrationName, ctx: MotifContext) {
  const { stroke, line, paper } = ctx;

  switch (name) {
    case 'calendar':
      return (
        <G>
          <Rect x={26} y={30} width={44} height={40} rx={10} {...stroke} fill={paper} />
          <Path d="M26 43h44" {...stroke} />
          <Path d="M37 24v10M59 24v10" {...stroke} />
          <Circle cx={39} cy={55} r={3.4} fill={line} />
          <Circle cx={53} cy={55} r={3.4} fill={line} opacity={0.45} />
        </G>
      );

    case 'lessons':
      return (
        <G>
          {/* Sonne über einem Heft — der schulfreie Tag. */}
          <Circle cx={30} cy={28} r={9} {...stroke} fill={paper} />
          <Path d="M30 13v4M15 28h4M41.5 16.5l2.8-2.8" {...stroke} strokeWidth={2.6} />
          <Rect x={38} y={36} width={38} height={34} rx={9} {...stroke} fill={paper} />
          <Path d="M46 47h22M46 56h14" {...stroke} strokeWidth={2.8} />
        </G>
      );

    case 'tasks':
      return (
        <G>
          <Rect x={26} y={24} width={44} height={50} rx={10} {...stroke} fill={paper} />
          <Path d="M35 40h26M35 50h20M35 60h14" {...stroke} strokeWidth={3} />
          <Circle cx={66} cy={64} r={12} {...stroke} fill={paper} />
          <Path d="M60.5 64.2l3.8 3.8 7-7.6" {...stroke} />
        </G>
      );

    case 'celebrate':
      return (
        <G>
          <Circle cx={48} cy={50} r={17} {...stroke} fill={paper} />
          <Path d="M41 50.5l4.6 4.6 9.4-9.6" {...stroke} />
          {/* Konfetti — der Feier-Moment aus dem Zielstil. */}
          <Path d="M22 30l4 4M74 30l-4 4M20 60l5 1.5M76 60l-5 1.5M48 22v5" {...stroke} strokeWidth={2.6} />
          <Circle cx={30} cy={70} r={2.6} fill={line} opacity={0.6} />
          <Circle cx={68} cy={72} r={2.2} fill={line} opacity={0.45} />
        </G>
      );

    case 'mail':
      return (
        <G>
          <Rect x={22} y={32} width={52} height={36} rx={10} {...stroke} fill={paper} />
          <Path d="M24 38l22 15a4 4 0 004.4 0L72 38" {...stroke} />
          <Circle cx={70} cy={34} r={7} fill={line} opacity={0.18} />
        </G>
      );

    case 'grades':
      return (
        <G>
          <Rect x={24} y={26} width={48} height={46} rx={12} {...stroke} fill={paper} />
          <Path d="M34 58v-8M46 58V40M58 58v-13" {...stroke} strokeWidth={4.5} />
          <Path d="M32 34h12" {...stroke} strokeWidth={2.6} opacity={0.5} />
        </G>
      );

    case 'board':
      return (
        <G>
          <Rect x={24} y={28} width={48} height={42} rx={8} {...stroke} fill={paper} />
          <Circle cx={48} cy={24} r={4.4} fill={line} />
          <Path d="M48 28.4V34" {...stroke} strokeWidth={2.6} />
          <Path d="M34 46h28M34 56h18" {...stroke} strokeWidth={3} />
        </G>
      );

    case 'search':
      return (
        <G>
          <Circle cx={44} cy={44} r={17} {...stroke} fill={paper} />
          <Path d="M56.5 56.5L70 70" {...stroke} strokeWidth={4.5} />
          <Path d="M38 44h12" {...stroke} strokeWidth={2.6} opacity={0.55} />
        </G>
      );

    case 'documents':
      return (
        <G>
          <Path d="M34 22h20l14 14v34a6 6 0 01-6 6H34a6 6 0 01-6-6V28a6 6 0 016-6z" {...stroke} fill={paper} />
          <Path d="M54 22v14h14" {...stroke} />
          <Path d="M38 52h20M38 61h13" {...stroke} strokeWidth={2.8} />
        </G>
      );

    case 'payments':
      return (
        <G>
          <Rect x={22} y={34} width={52} height={32} rx={9} {...stroke} fill={paper} />
          <Path d="M22 45h52" {...stroke} strokeWidth={4} />
          <Path d="M32 57h10" {...stroke} strokeWidth={3} />
          <Circle cx={64} cy={57} r={4} fill={line} opacity={0.35} />
        </G>
      );

    case 'attendance':
    default:
      return (
        <G>
          <Ellipse cx={48} cy={68} rx={20} ry={9} {...stroke} fill={paper} />
          <Circle cx={48} cy={40} r={12} {...stroke} fill={paper} />
          <Path d="M62 30l4-4M66 40h5" {...stroke} strokeWidth={2.6} opacity={0.55} />
        </G>
      );
  }
}
