import React, { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { Home, CalendarDays, ListChecks, BarChart3, Inbox } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { ThemePalette } from '@/design/tokens';
import { whiteOn } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { useSnapshot, useModuleActive } from '@/data/queries';
import { useLayout } from '@/lib/breakpoints';
import { AdaptiveTabBar } from '@/ui/shell';
import { PressableScale } from '@/ui/motion';
import { hapticLight } from '@/lib/haptics';
import { formatNavBadge, normaliseBadgeCount } from '@/ui/navigation';

/**
 * Icons pro Tab — nur Lucide-Vektoren. Bewusst sparsam: ein Icon, keine Labels
 * auf der schwebenden Leiste (das Mobile-Hauptziel dieses Designs).
 */
const ICONS: Record<string, LucideIcon> = {
  index: Home,
  timetable: CalendarDays,
  tasks: ListChecks,
  grades: BarChart3,
  inbox: Inbox,
};

export default function TabsLayout() {
  const { colors } = useThemeColors();
  const layout = useLayout();
  const gradesOn = useModuleActive('grades');
  const wide = layout.navigation !== 'bottom';

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props: BottomTabBarProps) =>
        wide ? <AdaptiveTabBar {...props} layout={layout} /> : <FloatingTabBar {...props} colors={colors} />
      }
      screenOptions={{
        sceneStyle: wide ? { marginLeft: layout.navigationWidth } : { backgroundColor: colors.canvas },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Start' }} />
      <Tabs.Screen name="timetable" options={{ title: 'Plan' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Aufgaben' }} />
      <Tabs.Screen name="grades" options={{ title: 'Noten', href: gradesOn ? undefined : null }} />
      <Tabs.Screen name="inbox" options={{ title: 'Postfach' }} />
    </Tabs>
  );
}

/* ------------------------------------------------------------------ Floating Bar */

interface TabSpec {
  name: string;
  icon: LucideIcon;
  badge: number;
  activeKey: boolean;
}

function FloatingTabBar({ state, navigation, descriptors, colors }: BottomTabBarProps & { colors: ThemePalette }) {
  const insets = useSafeAreaInsets();
  const { data } = useSnapshot();

  const inboxBadge = normaliseBadgeCount(
    (data?.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed).length ?? 0) +
      (data?.threads.reduce((sum, thread) => sum + normaliseBadgeCount(thread.unreadCount), 0) ?? 0),
  );
  const openTasks = normaliseBadgeCount(data?.homework.filter((item) => !item.done).length);

  const items: TabSpec[] = state.routes
    .filter(
      (route) =>
        ICONS[route.name] &&
        (descriptors[route.key]?.options as { href?: string | null } | undefined)?.href !== null,
    )
    .map((route) => ({
      name: route.name,
      icon: ICONS[route.name],
      badge: route.name === 'tasks' ? openTasks : route.name === 'inbox' ? inboxBadge : 0,
      activeKey: route.key === state.routes[state.index]?.key,
    }));

  const goTab = (name: string, key: string) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (state.routes[state.index]?.key !== key && !event.defaultPrevented) {
      hapticLight();
      navigation.navigate(name);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        // Phasen-10-Härtigung: seitlich die Safe-Area dazurechnen, damit die
        // Kapsel in Landscape und auf Geräten mit Notch/Punch-Hole nicht vom
        // Gehäuserand angeschnitten oder unter die Systemuhr geschoben wird.
        left: 16 + insets.left,
        right: 16 + insets.right,
        bottom: Math.max(insets.bottom, 14),
        alignItems: 'center',
      }}
    >
      {/* Schwebende dunkle Kapsel: immer Charcoal, nie lila/pastellig. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          backgroundColor: colors.charcoal,
          borderRadius: 36,
          paddingVertical: 10,
          paddingHorizontal: 8,
          shadowColor: colors.charcoal,
          shadowOpacity: 0.3,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
          maxWidth: 460,
          width: '100%',
        }}
      >
        {items.map((item) => {
          const active = item.activeKey;
          const routeKey = state.routes.find((route) => route.name === item.name)?.key ?? item.name;
          const label = String(descriptors[routeKey]?.options.title ?? item.name);

          return (
            <AnimatedTabItem
              key={item.name}
              item={item}
              active={active}
              colors={colors}
              label={label}
              onPress={() => goTab(item.name, routeKey)}
            />
          );
        })}
      </View>
    </View>
  );
}

function AnimatedTabItem({
  item,
  active,
  colors,
  label,
  onPress,
}: {
  item: TabSpec;
  active: boolean;
  colors: ThemePalette;
  label: string;
  onPress: () => void;
}) {
  const Icon = item.icon;
  const activeVal = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    activeVal.value = withSpring(active ? 1 : 0, { damping: 16, stiffness: 240 });
  }, [active, activeVal]);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activeVal.value }],
    opacity: activeVal.value,
  }));

  // Amber bleibt ein Akzent statt eines zweiten Tabs-Hintergrunds: ein weicher
  // Halo und ein kleiner Punkt machen den aktiven Tab auf der schwarzen Pill
  // sofort erkennbar, während die übrigen Icons bewusst ruhig bleiben.
  //
  // Phase 10 · Android-Korrektur: Diese Deko-Ebenen hatten `elevation`. Auf
  // Android bestimmt Elevation die **Reihenfolge** im Draw-Pass — die Halo- und
  // Hintergrund-Ebenen landeten *über* dem Icon, der Halo „pulsierte“ also als
  // fremder Fleck auf dem Icon. Ohne elevation gilt Quellreihenfolge (Deko vor
  // Icon), auf iOS ersetzt ein echter Schatten die Tiefenwirkung.
  const iosGlowShadow = Platform.select({
    ios: {
      shadowColor: colors.accent.amber,
      shadowOpacity: 0.62,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 3 },
    },
    default: {},
  });
  const glowStyle = useAnimatedStyle(() => ({
    opacity: activeVal.value,
    transform: [{ scale: 0.82 + activeVal.value * 0.18 }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: activeVal.value,
    transform: [{ scale: 0.55 + activeVal.value * 0.45 }],
  }));

  const badgeLabel = formatNavBadge(item.badge);

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      scale={0.92}
      style={{ alignItems: 'center', justifyContent: 'center', width: 56, height: 48 }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 2,
              left: 2,
              right: 2,
              bottom: 2,
              borderRadius: 20,
              backgroundColor: `${colors.accent.amber}2B`,
              zIndex: 0,
            },
            iosGlowShadow,
            glowStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 22,
              backgroundColor: colors.charcoalElevated,
              zIndex: 1,
            },
            bgStyle,
          ]}
        />
        <View style={{ zIndex: 2 }}>
          <Icon
            size={22}
            strokeWidth={active ? 2.5 : 2}
            color={active ? colors.accent.amber : colors.faint}
          />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              bottom: -3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.accent.amber,
              zIndex: 3,
            },
            Platform.select({
              ios: {
                shadowColor: colors.accent.amber,
                shadowOpacity: 0.85,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              },
              default: {},
            }),
            dotStyle,
          ]}
        />
      </View>

      {badgeLabel ? (
        <View
          accessibilityLabel={`${badgeLabel} neue Einträge`}
          style={{
            position: 'absolute',
            top: 0,
            right: -1,
            minWidth: badgeLabel === '99+' ? 30 : 18,
            height: 18,
            paddingHorizontal: badgeLabel === '99+' ? 5 : 4,
            borderRadius: 9,
            // AA: Fläche abgedunkelt, bis Weiß ≥ 4,5:1 hält (Phase 17).
            backgroundColor: whiteOn(colors.accent.coral, false),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', lineHeight: 12 }}>
            {badgeLabel}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
