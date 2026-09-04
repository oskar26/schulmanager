/**
 * Mini-Trendlinie (Sparkline) für die Fach-Karten — Redesign Phase 6
 * (docs/redesign-phasen.md).
 *
 * Zeichnet die datierten Noten eines Fachs als Verlauf auf einer Farbfläche.
 * Die Y-Achse ist **immer nach Qualität normalisiert** (oben = besser), damit
 * Noten (1–6, klein = gut) und Punkte (0–15, groß = gut) dieselbe Lesart
 * haben: Linie steigt ⇒ es wird besser.
 *
 * Die Linie wird bewusst in der Vordergrundfarbe der Fläche gezeichnet
 * (`useBlockInk()`), damit sie in Light **und** Dark auf jedem Block der
 * 13-Farb-Palette lesbar bleibt.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { gradeRatio } from '@/features/grades/calculator';
import { tint } from '@/design/subjects';

export function Sparkline({
  values,
  system = 0,
  color,
  width = 92,
  height = 34,
  hidden = false,
}: {
  /** Chronologische Notenwerte (mind. 2). */
  values: number[];
  /** 0 = Noten 1–6, 1 = Punkte 0–15. */
  system?: 0 | 1;
  /** Linienfarbe — üblicherweise die Vordergrundfarbe der Farbfläche. */
  color: string;
  width?: number;
  height?: number;
  /** „Noten verbergen“ — zeigt eine flache Platzhalterlinie. */
  hidden?: boolean;
}) {
  const padding = 4;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  if (values.length < 2) return null;

  // Qualitäts-normalisierte Punkte: y = 0 (oben) ist die beste Note.
  const points = values.map((value, index) => {
    const x = padding + (usableW * index) / (values.length - 1);
    const quality = hidden ? 0.5 : gradeRatio(value, system);
    const y = padding + usableH * (1 - quality);
    return { x, y };
  });

  // Weiche Kurve über Mittelpunkt-Glättung (quadratische Segmente) — wirkt
  // ruhiger als eine harte Zickzack-Polyline und bleibt SVG-schlank.
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const midX = (previous.x + current.x) / 2;
    d += ` Q${previous.x.toFixed(1)},${previous.y.toFixed(1)} ${midX.toFixed(1)},${((previous.y + current.y) / 2).toFixed(1)}`;
    d += ` Q${current.x.toFixed(1)},${current.y.toFixed(1)} ${current.x.toFixed(1)},${current.y.toFixed(1)}`;
  }

  const last = points[points.length - 1];

  return (
    <View accessible={false} style={{ width, height }}>
      <Svg width={width} height={height} accessible={false}>
        <Path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={hidden ? 0.35 : 0.9}
        />
        {hidden ? null : (
          <Circle cx={last.x} cy={last.y} r={3.4} fill={color} />
        )}
      </Svg>
    </View>
  );
}

/**
 * Balken-Fallback für Fächer mit < 3 datierten Noten: eine Qualitätsleiste
 * in der Vordergrundfarbe der Fläche (kein eigener Farbton, damit die
 * Farbfläche die Identität trägt).
 */
export function QualityBar({
  ratio,
  color,
  hidden = false,
}: {
  /** 0…1, 1 = beste Note. */
  ratio: number;
  color: string;
  hidden?: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View
      accessible={false}
      // Der Track ist eine getönte Variante derselben Farbe — `opacity` auf
      // dem Eltern-View würde auch die Füllung mit ausbleichen.
      style={{ height: 8, borderRadius: 999, backgroundColor: tint(color, 0.24), overflow: 'hidden' }}
    >
      <View
        style={{
          width: `${(hidden ? 0 : clamped) * 100}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
