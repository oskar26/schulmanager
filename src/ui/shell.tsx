/**
 * App-Shell: adaptive Navigation.
 *
 * · Phone    → schwebende Charcoal-Kapsel (in app/(tabs)/_layout.tsx)
 * · Tablet   → schmale Icon-Rail links
 * · Desktop  → volle Sidebar mit Labels, Schnellaktionen und Konto-Fuß
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { GraduationCap } from 'lucide-react-native';

import type { ThemePalette } from '@/design/tokens';
import { foregroundOn } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { tint } from '@/design/subjects';
import type { LayoutInfo } from '@/lib/breakpoints';
import { useSnapshot } from '@/data/queries';
import { hapticLight } from '@/lib/haptics';

function useBadges(): { tasks: number; inbox: number } {
  const { data } = useSnapshot();
  if (!data) return { tasks: 0, inbox: 0 };
  return {
    tasks: data.homework.filter((item) => !item.done).length,
    inbox:
      data.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed).length +
      data.threads.reduce((sum, thread) => sum + thread.unreadCount, 0),
  };
}

interface NavItemSpec {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  badge: number;
}

const ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = {
  index: { icon: 'sparkles-outline', iconActive: 'sparkles' },
  timetable: { icon: 'calendar-outline', iconActive: 'calendar' },
  tasks: { icon: 'checkbox-outline', iconActive: 'checkbox' },
  grades: { icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  inbox: { icon: 'mail-outline', iconActive: 'mail' },
};

export function AdaptiveTabBar(props: BottomTabBarProps & { layout: LayoutInfo }) {
  const { state, navigation, layout } = props;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { data, isDemo } = useSnapshot();

  const full = layout.navigation === 'sidebar';
  const rail = layout.navigation === 'rail';
  const activeColor = colors.accent.amberDeep;
  const inactive = colors.faint;
  const badges = useBadges();

  const items: NavItemSpec[] = state.routes
    // href: null versteckt Tabs (z. B. Noten ohne gebuchtes Modul) aus der Leiste.
    .filter(
      (route) =>
        ICONS[route.name] &&
        (props.descriptors[route.key]?.options as { href?: string | null } | undefined)?.href !== null,
    )
    .map((route) => ({
      name: route.name,
      title: String(props.descriptors[route.key]?.options.title ?? route.name),
      icon: ICONS[route.name].icon,
      iconActive: ICONS[route.name].iconActive,
      badge: route.name === 'tasks' ? badges.tasks : route.name === 'inbox' ? badges.inbox : 0,
    }));

  const activeKey = state.routes[state.index]?.key;

  const goTab = (name: string, key: string) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (state.routes[state.index]?.key !== key && !event.defaultPrevented) {
      hapticLight();
      navigation.navigate(name);
    }
  };

  const BadgePill = ({ count }: { count: number }) =>
    count > 0 ? (
      <View
        style={{
          minWidth: 22,
          paddingHorizontal: 7,
          paddingVertical: 3,
          borderRadius: 11,
          backgroundColor: colors.accent.coral,
          alignItems: 'center',
          marginLeft: full ? 8 : 0,
          marginTop: rail ? 2 : 0,
        }}
      >
        <Text style={{ color: colors.on.coral, fontSize: 10.5, fontWeight: '800' }}>
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    ) : null;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: layout.navigationWidth,
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.line,
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      {/* Marke */}
      <View
        style={{
          paddingTop: 18,
          paddingBottom: 14,
          paddingHorizontal: full ? 20 : 0,
          alignItems: full ? 'flex-start' : 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              backgroundColor: colors.accent.amber,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles" size={19} color={colors.on.amber} />
          </View>
          {full ? (
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', letterSpacing: -0.4, color: colors.ink }}>
                Schulflow
              </Text>
              <Text style={{ fontSize: 10.5, fontWeight: '600', color: colors.muted }}>
                inoffizieller Client
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {full ? (
        <Text
          style={{
            fontSize: 10.5,
            fontWeight: '800',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: colors.faint,
            paddingHorizontal: 22,
            paddingBottom: 6,
          }}
        >
          Menü
        </Text>
      ) : null}

      {/* Hauptnavigation */}
      <View style={{ gap: 4, paddingHorizontal: full ? 12 : 10 }}>
        {items.map((item) => {
          const key = state.routes.find((route) => route.name === item.name)?.key ?? item.name;
          const active = key === activeKey;
          return (
            <Pressable
              key={item.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.title}
              onPress={() => goTab(item.name, key)}
              className="hover:bg-line/40 active:bg-line/60"
              style={{
                flexDirection: full ? 'row' : 'column',
                alignItems: 'center',
                gap: full ? 12 : 4,
                paddingVertical: full ? 11 : 9,
                paddingHorizontal: full ? 12 : 4,
                borderRadius: 16,
                backgroundColor: active ? tint(colors.accent.amber, 0.16) : 'transparent',
              }}
            >
              <Ionicons name={active ? item.iconActive : item.icon} size={21} color={active ? activeColor : inactive} />
              <Text
                style={{
                  fontSize: full ? 14.5 : 10,
                  fontWeight: active ? '800' : '600',
                  color: active ? activeColor : inactive,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {full ? <View style={{ flex: 1 }} /> : null}
              <BadgePill count={item.badge} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Werkzeuge */}
      <View style={{ gap: 4, paddingHorizontal: full ? 12 : 10 }}>
        <ToolButton icon="search" label="Suche" full={full} colors={colors} onPress={() => router.push('/search')} />
        <ToolButton
          icon="settings-outline"
          label="Einstellungen"
          full={full}
          colors={colors}
          onPress={() => router.push('/settings')}
        />
      </View>

      {/* Konto-Fuß (nur Desktop) */}
      {full ? (
        <Pressable
          onPress={() => router.push('/settings')}
          className="hover:bg-line/40 active:bg-line/60"
          style={{
            marginTop: 12,
            marginHorizontal: 12,
            padding: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.line,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              backgroundColor: tint(colors.accent.amber, 0.16),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={18} strokeWidth={2} color={colors.accent.amberDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>
              {data?.student ? `${data.student.firstname} ${data.student.lastname}` : 'Nicht verbunden'}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>
              {isDemo ? 'Demo-Modus' : data?.institution?.name ?? 'Schule verbinden …'}
            </Text>
          </View>
          {isDemo ? <DemoPill colors={colors} /> : null}
        </Pressable>
      ) : (
        <View style={{ marginTop: 10, alignItems: 'center' }}>{isDemo ? <DemoPill colors={colors} /> : null}</View>
      )}
    </View>
  );
}

function DemoPill({ colors }: { colors: ThemePalette }) {
  return (
    <View style={{ backgroundColor: tint(colors.accent.amber, 0.18), paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
      <Text style={{ fontSize: 9.5, fontWeight: '800', color: foregroundOn(colors.accent.amber, colors) }}>DEMO</Text>
    </View>
  );
}

function ToolButton({
  icon,
  label,
  full,
  colors,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  full: boolean;
  colors: ThemePalette;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="hover:bg-line/40 active:bg-line/60"
      style={{
        flexDirection: full ? 'row' : 'column',
        alignItems: 'center',
        gap: full ? 12 : 4,
        paddingVertical: full ? 10 : 8,
        paddingHorizontal: full ? 12 : 4,
        borderRadius: 16,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.muted} />
      <Text style={{ fontSize: full ? 14 : 9.5, fontWeight: '600', color: colors.muted }}>{label}</Text>
    </Pressable>
  );
}
