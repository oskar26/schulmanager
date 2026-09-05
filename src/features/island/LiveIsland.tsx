/**
 * Live-Island — jetzt die **Tab-Bar-Erweiterung** der Web-Version (Redesign Phase 13).
 *
 * Ursprung: eine „Dynamic Island"-Kapsel, die über *allen* Screens oben am
 * Bildschirm schwebte. Das hat auf Telegram-artige Referenz-Apps gewirkt, aber
 * im eigenen Systemkontext doppelt gehalten: oben überlappte sie Statusleiste
 * und Notch, und in der installierten App war sie das falsche Vehikel — dort
 * gehören Live-Infos auf den Sperrbildschirm bzw. ins Live-Update.
 *
 * Deshalb:
 *  · **Nativ (APK/iPA):** kein eigenes In-App-Island-UI mehr. `effects.ts`
 *    spielt dieselben Infos weiter über die Android-Fortschritts-Notification
 *    (Live-Update / HyperOS-Fokus-Notification) und, sobald der
 *    WidgetKit-Target gebaut ist, über eine iOS **Live Activity**
 *    (`modules/schulflow-live-island/ios/`) zu. Diese Komponente liefert dann `null`.
 *  · **Web:** dieselbe Pille, aber nicht oben — sondern als Erweiterung über der
 *    schwebenden Tab-Bar (Antippen klappt die Detailkarte nach oben auf).
 *
 * Inhalt unverändert: laufende Stunde mit Restzeit + Fortschritt, sonst die
 * nächste Stunde mit Countdown (≤ 60 min).
 */
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BookOpen } from 'lucide-react-native';

import type { IslandState } from '@/features/island/use-island';
import { hapticLight } from '@/lib/haptics';
import { useLayout } from '@/lib/breakpoints';
import { useTabNavReserve } from '@/ui/nav-reserve';
import { tint } from '@/design/subjects';
import { foregroundOn } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { LivePulse, PressableOpacity, PressableScale } from '@/ui/motion';


export function LiveIsland({ state }: { state: IslandState | null }) {
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const navReserve = useTabNavReserve();
  const [expanded, setExpanded] = useState(false);

  // Zuklappen, sobald der Kontext wechselt (andere Stunde, Pause→Stunde …).
  const signature = state ? `${state.kind}:${state.lesson.id}` : 'none';
  useEffect(() => {
    setExpanded(false);
  }, [signature]);

  // Phase 13: natives In-App-Island ist abgeschaltet — Live-Infos laufen dort
  // über das System (Android-Live-Update, iOS Live Activity), nicht über eine
  // Kapsel im Layout. Web behält das In-App-Pendant, unten über der Tab-Bar.
  if (!state || Platform.OS !== 'web') return null;

  // Auf Phones sitzt die Pille direkt über der schwebenden Kapsel (in der
  // ohnehin freien Reserve, damit kein Screen-Inhalt verdeckt wird); auf
  // Rail/Desktop reicht der übliche Rand.
  const anchorBottom = layout.navigation === 'bottom' ? Math.max(navReserve, insets.bottom + 92) : 20;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: anchorBottom,
        left: layout.navigationWidth,
        right: 0,
        alignItems: 'center',
        zIndex: 60,
      }}
    >
      <View pointerEvents="box-none" style={{ width: '100%', maxWidth: 460, paddingHorizontal: 12, alignItems: 'center' }}>
        {expanded ? <IslandCard state={state} onClose={() => setExpanded(false)} /> : null}
        <IslandPill state={state} expanded={expanded} onToggle={() => { hapticLight(); setExpanded((v) => !v); }} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ Kapsel */

function IslandPill({
  state,
  expanded,
  onToggle,
}: {
  state: IslandState;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useThemeColors();
  const islandText = colors.on.charcoal;
  const islandSub = tint(colors.on.charcoal, 0.72);
  const islandTrack = tint(colors.on.charcoal, 0.14);
  const subjectForeground = foregroundOn(state.color, colors);
  const urgent = state.kind === 'break' || state.kind === 'before-school';

  return (
    <PressableScale
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`${state.title}, ${state.statusLabel}`}
      scale={0.97}
      hoverScale={1.01}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.charcoal,
        borderRadius: 999,
        paddingVertical: 7,
        paddingLeft: 8,
        paddingRight: 14,
        maxWidth: '100%',
        shadowColor: colors.charcoal,
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 14,
      }}
    >
      {/* Fach-Dot */}
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: state.color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BookOpen size={14} strokeWidth={2.4} color={subjectForeground} />
      </View>

      <View style={{ flexShrink: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {state.kind === 'in-lesson' && !state.cancelled ? <LivePulse color={state.color} size={6} /> : null}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{ color: islandText, fontSize: 12.5, fontWeight: '800', letterSpacing: -0.1 }}
          >
            {state.title}
          </Text>
          {state.changed ? (
            <View
              style={{
                backgroundColor: tint(colors.accent.amber, 0.2),
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 7,
              }}
            >
              <Text style={{ color: colors.accent.amber, fontSize: 9, fontWeight: '800' }}>
                {state.cancelled ? 'AUSFALL' : 'GEÄNDERT'}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: islandTrack, marginTop: 4, overflow: 'hidden', minWidth: 96 }}>
          <View
            style={{
              width: `${Math.round(state.progress * 100)}%`,
              height: 3,
              borderRadius: 2,
              backgroundColor: urgent ? colors.accent.amber : state.color,
            }}
          />
        </View>
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: urgent ? colors.accent.amber : islandSub,
          fontSize: 11.5,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
          maxWidth: 150,
        }}
      >
        {state.statusLabel.split('·')[0].trim()}
      </Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={islandSub} />
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Detailkarte */

function IslandCard({ state, onClose }: { state: IslandState; onClose: () => void }) {
  const { colors } = useThemeColors();
  const islandText = colors.on.charcoal;
  const islandSub = tint(colors.on.charcoal, 0.72);
  const islandTrack = tint(colors.on.charcoal, 0.14);
  const subjectForeground = foregroundOn(state.color, colors);
  const router = useRouter();
  const { lesson } = state;

  return (
    <View
      style={{
        // Phase 13: die Karte sitzt über der Pille und klappt nach oben auf.
        marginBottom: 8,
        alignSelf: 'stretch',
        backgroundColor: colors.charcoal,
        borderRadius: 24,
        padding: 16,
        shadowColor: colors.charcoal,
        shadowOpacity: 0.35,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            backgroundColor: state.color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BookOpen size={22} strokeWidth={2.2} color={subjectForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={{ color: islandText, fontSize: 16, fontWeight: '800', lineHeight: 19 }}>
            {lesson.subject}
          </Text>
          <Text style={{ color: islandSub, fontSize: 12, fontVariant: ['tabular-nums'] }}>
            {lesson.hour}. Stunde · {lesson.start}–{lesson.end} Uhr
          </Text>
        </View>
        <PressableOpacity onPress={onClose} hitSlop={13} accessibilityLabel="Zuklappen">
          <Ionicons name="close" size={18} color={islandSub} />
        </PressableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {lesson.room ? <MetaChip colors={colors} icon="location-outline" label={lesson.room} /> : null}
        {lesson.teacher ? <MetaChip colors={colors} icon="person-outline" label={lesson.teacher} /> : null}
        <MetaChip
          icon="time-outline"
          label={
            state.kind === 'in-lesson'
              ? `läuft — ${state.statusLabel.split('·')[0].trim()}`
              : state.statusLabel
          }
          accent
          colors={colors}
        />
      </View>

      {lesson.state !== 'regular' ? (
        <View
          style={{
            marginTop: 12,
            borderRadius: 12,
            backgroundColor: state.cancelled ? tint(colors.danger, 0.16) : tint(colors.success, 0.14),
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: state.cancelled ? colors.danger : colors.success, fontSize: 11.5, fontWeight: '700' }}>
            {state.cancelled
              ? `Entfällt${lesson.originalTeacher ? ` (statt ${lesson.originalTeacher})` : ''}`
              : lesson.state === 'substitution'
                ? `Vertretung${lesson.originalSubject ? ` für ${lesson.originalSubject}` : ''}${lesson.comment ? ` — ${lesson.comment}` : ''}`
                : `Raumwechsel → ${lesson.room ?? 'neuer Raum'}`}
          </Text>
        </View>
      ) : null}

      <View style={{ height: 5, borderRadius: 3, backgroundColor: islandTrack, marginTop: 14, overflow: 'hidden' }}>
        <View
          style={{
            width: `${Math.round(state.progress * 100)}%`,
            height: 5,
            borderRadius: 3,
            backgroundColor: state.color,
          }}
        />
      </View>

      <PressableScale
        onPress={() => {
          hapticLight();
          onClose();
          // Haupt-Tab gezielt aktivieren statt einen zweiten Stack-Eintrag zu
          // erzeugen: Rückweg und Scrollposition des Stundenplans bleiben intakt.
          router.navigate('/timetable');
        }}
        scale={0.97}
        style={{
          marginTop: 14,
          backgroundColor: tint(colors.on.charcoal, 0.10),
          borderRadius: 14,
          paddingVertical: 9,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Ionicons name="calendar-outline" size={14} color={islandText} />
        <Text style={{ color: islandText, fontSize: 12.5, fontWeight: '800' }}>Stundenplan öffnen</Text>
      </PressableScale>
    </View>
  );
}

function MetaChip({
  colors,
  icon,
  label,
  accent = false,
}: {
  colors: ReturnType<typeof useThemeColors>['colors'];
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: accent ? tint(colors.accent.amber, 0.16) : tint(colors.on.charcoal, 0.08),
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
      }}
    >
      <Ionicons name={icon} size={11} color={accent ? colors.accent.amber : tint(colors.on.charcoal, 0.72)} />
      <Text style={{ color: accent ? colors.accent.amber : tint(colors.on.charcoal, 0.72), fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
