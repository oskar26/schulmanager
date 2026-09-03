/**
 * App-Shell: Adaptive Navigation.
 *
 * · Phone    → klassische Bottom-Tab-Bar (unverändert)
 * · Tablet   → schmale Icon-Rail links (Xiaomi Pad, iPad im Hochformat)
 * · Desktop  → volle Sidebar mit Labels, Schnellaktionen und Konto-Fuß
 *
 * Die Shell wird als `tabBar` des (tabs)-Navigators gerendert; die Screens
 * selbst bleiben unverändert, der Navigator bekommt nur einen linken
 * Sicherheitsabstand (`sceneContainerStyle`).
 */
import React from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';

import { palette } from '@/design/tokens';
import type { LayoutInfo } from '@/lib/breakpoints';
import { useSnapshot } from '@/data/queries';
import { useSettings } from '@/state/settings';

const ACTIVE_BG_LIGHT = 'rgba(108,92,231,0.12)';
const ACTIVE_BG_DARK = 'rgba(138,124,255,0.16)';

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
  const system = useColorScheme();
  const theme = useSettings((store) => store.settings.theme);
  const dark = (theme === 'system' ? system : theme) === 'dark';
  const { data, isDemo } = useSnapshot();

  const full = layout.navigation === 'sidebar';
  const rail = layout.navigation === 'rail';

  const accent = dark ? '#8A7CFF' : palette.brand;
  const inactive = dark ? '#8A90AA' : palette.faint;
  const surface = dark ? palette.darkSurface : palette.surface;
  const line = dark ? palette.darkLine : palette.line;

  const badges = useBadges();

  const items: NavItemSpec[] = state.routes
    // href: null versteckt Tabs (z. B. Noten ohne gebuchtes Modul) aus der Leiste.
    // expo-router hängt `href` an die Screen-Options — im RN-Typ fehlt es, daher der Cast.
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
      navigation.navigate(name);
    }
  };

  const Pill = ({ count }: { count: number }) =>
    count > 0 ? (
      <View
        style={{
          minWidth: 22,
          paddingHorizontal: 7,
          paddingVertical: 3,
          borderRadius: 11,
          backgroundColor: palette.coral,
          alignItems: 'center',
          marginLeft: full ? 8 : 0,
          marginTop: rail ? 2 : 0,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{count > 99 ? '99+' : count}</Text>
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
        backgroundColor: surface,
        borderRightWidth: 1,
        borderRightColor: line,
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
              backgroundColor: palette.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles" size={19} color="#FFFFFF" />
          </View>
          {full ? (
            <View>
              <Text style={{ fontSize: 17, fontWeight: '800', letterSpacing: -0.4, color: dark ? palette.darkInk : palette.ink }}>
                Schulflow
              </Text>
              <Text style={{ fontSize: 10.5, fontWeight: '600', color: dark ? '#8A90AA' : palette.muted }}>
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
            color: dark ? '#6C748E' : palette.faint,
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
              onPress={() => goTab(item.name, key)}
              className="hover:bg-line/40 active:bg-line/60"
              style={{
                flexDirection: full ? 'row' : 'column',
                alignItems: 'center',
                gap: full ? 12 : 4,
                paddingVertical: full ? 11 : 9,
                paddingHorizontal: full ? 12 : 4,
                borderRadius: 16,
                backgroundColor: active ? (dark ? ACTIVE_BG_DARK : ACTIVE_BG_LIGHT) : 'transparent',
              }}
            >
              <Ionicons name={active ? item.iconActive : item.icon} size={21} color={active ? accent : inactive} />
              <Text
                style={{
                  fontSize: full ? 14.5 : 10,
                  fontWeight: active ? '800' : '600',
                  color: active ? accent : inactive,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {full ? <View style={{ flex: 1 }} /> : null}
              <Pill count={item.badge} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Werkzeuge */}
      <View style={{ gap: 4, paddingHorizontal: full ? 12 : 10 }}>
        <ToolButton
          icon="search"
          label="Suche"
          full={full}
          dark={dark}
          onPress={() => router.push('/search')}
        />
        <ToolButton
          icon="settings-outline"
          label="Einstellungen"
          full={full}
          dark={dark}
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
            borderColor: line,
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
              backgroundColor: dark ? 'rgba(138,124,255,0.18)' : 'rgba(108,92,231,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15 }}>🎒</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontWeight: '700', color: dark ? palette.darkInk : palette.ink }}
            >
              {data?.student ? `${data.student.firstname} ${data.student.lastname}` : 'Nicht verbunden'}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, color: dark ? '#8A90AA' : palette.muted }}>
              {isDemo ? 'Demo-Modus' : data?.institution?.name ?? 'Schule verbinden …'}
            </Text>
          </View>
          {isDemo ? (
            <View style={{ backgroundColor: 'rgba(250,199,72,0.25)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: palette.warning }}>DEMO</Text>
            </View>
          ) : null}
        </Pressable>
      ) : (
        <View style={{ marginTop: 10, alignItems: 'center' }}>
          {isDemo ? (
            <View style={{ backgroundColor: 'rgba(250,199,72,0.25)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: palette.warning }}>DEMO</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function ToolButton({
  icon,
  label,
  full,
  dark,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  full: boolean;
  dark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
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
      <Ionicons name={icon} size={20} color={dark ? '#8A90AA' : palette.muted} />
      <Text style={{ fontSize: full ? 14 : 9.5, fontWeight: '600', color: dark ? '#8A90AA' : palette.muted }}>
        {label}
      </Text>
    </Pressable>
  );
}
