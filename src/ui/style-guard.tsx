/**
 * Style-Pipeline-Sonde (Redesign Phase 10)
 * ========================================
 *
 * Der APK-Styling-Ausfall war **stumm**: Die App lief und reagierte nur waren
 * Farbflächen, Typografie und Abstände spurlos verschwunden. Ursache war eine
 * gesplittete NativeWind-Laufzeit (zwei `react-native-css-interop`-Kopien;
 * die Details stehen in `scripts/style-pipeline-check.mjs`). Kein Nutzer kann
 * das melden, kein Log zeigt es, `typecheck` bleibt grün.
 *
 * Diese Sonde macht den Zustand messbar: Sie rendert einen View, dessen Größe
 * **ausschließlich** aus einer Utility-Klasse kommt (`w-24 h-24` = 96 px).
 * Mißt `onLayout` deutlich weniger, ist das kompilierte Stylesheet nie im
 * Bundle angekommen. Die App zeigt dann eine abbestellbare Hinweis-Karte statt
 * einer halb kahlen Oberfläche — und die Support-Frage „APK sieht kaputt aus?“
 * beantwortet sich selbst.
 *
 * Bewusst **kein** Blocker: Navigation, Demo-Modus und Daten bleiben nutzbar.
 * Alle Styles dieser Karte sind Absicht inline (kein `className`) — sie muß
 * lesbar bleiben, wenn genau das der kaputte Teil ist.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Constants from 'expo-constants';

import { paletteFor } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { useSettings } from '@/state/settings';

/** Erwartete Kantenlänge der Sonde: `w-24`/`h-24` = 24 × 4 px = 96 px. */
const PROBE_EXPECTED = 96;
/** Toleranz: darunter gilt die Klasse als nicht angewendet. */
const PROBE_FLOOR = Math.round(PROBE_EXPECTED * 0.5);
/** Kein Layout-Event in dieser Zeit → nichts melden (z. B. Screen noch nicht sichtbar). */
const PROBE_TIMEOUT = 2500;

export type StylePipelineHealth = 'unknown' | 'healthy' | 'broken';

const healthRef = { current: 'unknown' as StylePipelineHealth };
const listeners = new Set<(health: StylePipelineHealth) => void>();

function reportHealth(next: StylePipelineHealth) {
  if (healthRef.current === next) return;
  healthRef.current = next;
  listeners.forEach((listener) => listener(next));
  if (next === 'broken') {
    console.error(
      '[Schulflow] NativeWind-Styles fehlen im Bundle — jede `className` löst ins Leere auf. ' +
        'Diagnose: `npm run doctor` (prüft u. a. doppelte react-native-css-interop-Kopien).',
    );
  }
}

/** Zustand der Sonde — für Diagnoseanzeigen in den Einstellungen (Phase 12). */
export function useStylePipelineHealth(): StylePipelineHealth {
  const [health, setLocal] = useState<StylePipelineHealth>(healthRef.current);
  useEffect(() => {
    const listener = (next: StylePipelineHealth) => setLocal(next);
    listeners.add(listener);
    setLocal(healthRef.current);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return health;
}

export function StylePipelineGuard() {
  const [health, setLocal] = useState<StylePipelineHealth>(healthRef.current);
  const [dismissed, setDismissed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const measured = useRef(false);

  useEffect(() => {
    const listener = (next: StylePipelineHealth) => setLocal(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Jeder Meßlauf bekommt ein Zeitfenster; ein ausbleibendes Layout-Event ist
  // kein Beweis für ein kaputtes Stylesheet (z. B. Screen gerade unsichtbar).
  useEffect(() => {
    measured.current = false;
    const timer = setTimeout(() => {
      if (!measured.current) reportHealth('unknown');
    }, PROBE_TIMEOUT);
    return () => clearTimeout(timer);
  }, [nonce]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    measured.current = true;
    const { width, height } = event.nativeEvent.layout;
    reportHealth(Math.max(width, height) >= PROBE_FLOOR ? 'healthy' : 'broken');
  }, []);

  return (
    <View pointerEvents="box-none" style={overlayLayer}>
      <View
        key={`probe-${nonce}`}
        collapsable={false}
        pointerEvents="none"
        onLayout={onLayout}
        className="w-24 h-24"
        style={probePosition}
      />
      {health === 'broken' && !dismissed ? (
        <BrokenStylesNotice onRetry={() => setNonce((value) => value + 1)} onDismiss={() => setDismissed(true)} />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Hinweis */

function BrokenStylesNotice({ onRetry, onDismiss }: { onRetry: () => void; onDismiss: () => void }) {
  const { isDark } = useThemeColors();
  const colors = paletteFor(isDark);
  const demo = useSettings((state) => state.settings.demoMode);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildCode = Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber;

  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
        backgroundColor: colors.charcoal,
        borderRadius: 24,
        padding: 16,
        gap: 6,
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 22,
      }}
    >
      <Text
        style={{
          color: colors.accent.amber,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        Styling-Bundle unvollständig
      </Text>
      <Text style={{ color: colors.on.charcoal, fontSize: 16, fontWeight: '800', lineHeight: 21 }}>
        Schulflow sieht gerade nackt aus: Die Gestaltung fehlt im Installationspaket, nicht auf deinem Gerät.
      </Text>
      <Text style={{ color: `${colors.on.charcoal}C4`, fontSize: 13, lineHeight: 19 }}>
        {demo ? 'Demo-Modus aktiv — Daten und Navigation funktionieren weiter. ' : ''}
        Build {version}
        {buildCode ? ` (${buildCode})` : ''}. Installationspaket neu laden bzw. die Seite hart neu laden
        (Strg/Cmd + Shift + R). Hilft das nicht, prüft `npm run doctor` im Repository die NativeWind-Pipeline
        und meldet die genaue Ursache.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        <Pressable
          onPress={onRetry}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Styling erneut prüfen"
          style={{ backgroundColor: colors.accent.amber, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }}
        >
          <Text style={{ color: colors.on.amber, fontSize: 13, fontWeight: '800' }}>Erneut prüfen</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Hinweis ausblenden"
          style={{
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: `${colors.on.charcoal}40`,
          }}
        >
          <Text style={{ color: colors.on.charcoal, fontSize: 13, fontWeight: '700' }}>Ausblenden</Text>
        </Pressable>
      </View>
    </View>
  );
}

const overlayLayer = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

/**
 * Layoutfähig, aber nie im Bild: Der View darf nichts verdrängen und nichts
 * abfangen. Die Größe kommt ausschließlich aus `className`.
 */
const probePosition = {
  position: 'absolute',
  top: -9999,
  left: -9999,
  opacity: 0,
} as const;
