/**
 * Live-Island — die schwebende Kapsel oben mittig.
 *
 * Funktioniert plattformübergreifend in-App (Phone, Tablet, Desktop, Web)
 * und ist die sichtbare Schwester der nativen Android-„Live Update"-
 * Benachrichtigung (modules/schulflow-live-island), die auf Xiaomi HyperOS
 * automatisch als Fokus-Notification um die Kamera gelegt wird.
 *
 * Inhalt: laufende Stunde mit Restzeit+Fortschritt oder die nächste Stunde
 * mit Countdown, sobald sie ≤ 60 Minuten weg ist. Antippen klappt Details auf.
 */
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BookOpen } from 'lucide-react-native';

import type { IslandState } from '@/features/island/use-island';
import { hapticLight } from '@/lib/haptics';
import { useLayout } from '@/lib/breakpoints';
import { tint } from '@/design/subjects';
import { LivePulse } from '@/ui/motion';

const ISLAND_BG = '#101018';
const ISLAND_TEXT = '#FFFFFF';
const ISLAND_SUB = 'rgba(255,255,255,0.72)';
const ISLAND_TRACK = 'rgba(255,255,255,0.14)';

export function LiveIsland({ state }: { state: IslandState | null }) {
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  // Zuklappen, sobald der Kontext wechselt (andere Stunde, Pause→Stunde …).
  const signature = state ? `${state.kind}:${state.lesson.id}` : 'none';
  useEffect(() => {
    setExpanded(false);
  }, [signature]);

  if (!state) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: (Platform.OS === 'web' ? 10 : insets.top + 6),
        left: layout.navigationWidth,
        right: 0,
        alignItems: 'center',
        zIndex: 60,
      }}
    >
      <View pointerEvents="box-none" style={{ width: '100%', maxWidth: 460, paddingHorizontal: 12, alignItems: 'center' }}>
        <IslandPill state={state} expanded={expanded} onToggle={() => { hapticLight(); setExpanded((v) => !v); }} />
        {expanded ? <IslandCard state={state} onClose={() => setExpanded(false)} /> : null}
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
  const urgent = state.kind === 'break' || state.kind === 'before-school';

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`${state.title}, ${state.statusLabel}`}
      className="active:opacity-90"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: ISLAND_BG,
        borderRadius: 999,
        paddingVertical: 7,
        paddingLeft: 8,
        paddingRight: 14,
        maxWidth: '100%',
        shadowColor: '#000',
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
          backgroundColor: tint(state.color, 0.22),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BookOpen size={14} strokeWidth={2.4} color={ISLAND_TEXT} />
      </View>

      <View style={{ flexShrink: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {state.kind === 'in-lesson' && !state.cancelled ? <LivePulse color={state.color} size={6} /> : null}
          <Text
            numberOfLines={1}
            style={{ color: ISLAND_TEXT, fontSize: 12.5, fontWeight: '800', letterSpacing: -0.1 }}
          >
            {state.title}
          </Text>
          {state.changed ? (
            <View
              style={{
                backgroundColor: 'rgba(255,209,102,0.2)',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 7,
              }}
            >
              <Text style={{ color: '#FFD166', fontSize: 9, fontWeight: '800' }}>
                {state.cancelled ? 'AUSFALL' : 'GEÄNDERT'}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: ISLAND_TRACK, marginTop: 4, overflow: 'hidden', minWidth: 96 }}>
          <View
            style={{
              width: `${Math.round(state.progress * 100)}%`,
              height: 3,
              borderRadius: 2,
              backgroundColor: urgent ? '#FFD166' : state.color,
            }}
          />
        </View>
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: urgent ? '#FFD166' : ISLAND_SUB,
          fontSize: 11.5,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
          maxWidth: 150,
        }}
      >
        {state.statusLabel.split('·')[0].trim()}
      </Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={ISLAND_SUB} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ Detailkarte */

function IslandCard({ state, onClose }: { state: IslandState; onClose: () => void }) {
  const router = useRouter();
  const { lesson } = state;

  return (
    <View
      style={{
        marginTop: 8,
        alignSelf: 'stretch',
        backgroundColor: ISLAND_BG,
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
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
            backgroundColor: tint(state.color, 0.22),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BookOpen size={22} strokeWidth={2.2} color={ISLAND_TEXT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: ISLAND_TEXT, fontSize: 16, fontWeight: '800' }}>
            {lesson.subject}
          </Text>
          <Text style={{ color: ISLAND_SUB, fontSize: 12, fontVariant: ['tabular-nums'] }}>
            {lesson.hour}. Stunde · {lesson.start}–{lesson.end} Uhr
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Zuklappen">
          <Ionicons name="close" size={18} color={ISLAND_SUB} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {lesson.room ? <MetaChip icon="location-outline" label={lesson.room} /> : null}
        {lesson.teacher ? <MetaChip icon="person-outline" label={lesson.teacher} /> : null}
        <MetaChip
          icon="time-outline"
          label={
            state.kind === 'in-lesson'
              ? `läuft — ${state.statusLabel.split('·')[0].trim()}`
              : state.statusLabel
          }
          accent
        />
      </View>

      {lesson.state !== 'regular' ? (
        <View
          style={{
            marginTop: 12,
            borderRadius: 12,
            backgroundColor: state.cancelled ? 'rgba(226,72,72,0.16)' : 'rgba(46,204,168,0.14)',
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: state.cancelled ? '#FF8E8E' : '#63E0BE', fontSize: 11.5, fontWeight: '700' }}>
            {state.cancelled
              ? `Entfällt${lesson.originalTeacher ? ` (statt ${lesson.originalTeacher})` : ''}`
              : lesson.state === 'substitution'
                ? `Vertretung${lesson.originalSubject ? ` für ${lesson.originalSubject}` : ''}${lesson.comment ? ` — ${lesson.comment}` : ''}`
                : `Raumwechsel → ${lesson.room ?? 'neuer Raum'}`}
          </Text>
        </View>
      ) : null}

      <View style={{ height: 5, borderRadius: 3, backgroundColor: ISLAND_TRACK, marginTop: 14, overflow: 'hidden' }}>
        <View
          style={{
            width: `${Math.round(state.progress * 100)}%`,
            height: 5,
            borderRadius: 3,
            backgroundColor: state.color,
          }}
        />
      </View>

      <Pressable
        onPress={() => {
          hapticLight();
          onClose();
          router.push('/timetable');
        }}
        className="active:opacity-85"
        style={{
          marginTop: 14,
          backgroundColor: 'rgba(255,255,255,0.10)',
          borderRadius: 14,
          paddingVertical: 9,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Ionicons name="calendar-outline" size={14} color={ISLAND_TEXT} />
        <Text style={{ color: ISLAND_TEXT, fontSize: 12.5, fontWeight: '800' }}>Stundenplan öffnen</Text>
      </Pressable>
    </View>
  );
}

function MetaChip({
  icon,
  label,
  accent = false,
}: {
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
        backgroundColor: accent ? 'rgba(255,209,102,0.16)' : 'rgba(255,255,255,0.08)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
      }}
    >
      <Ionicons name={icon} size={11} color={accent ? '#FFD166' : ISLAND_SUB} />
      <Text style={{ color: accent ? '#FFD166' : ISLAND_SUB, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
