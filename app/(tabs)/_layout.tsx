import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { Home, CalendarDays, ListChecks, BarChart3, Inbox } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { ThemePalette } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { useSnapshot, useModuleActive } from '@/data/queries';
import { useLayout } from '@/lib/breakpoints';
import { AdaptiveTabBar } from '@/ui/shell';
import { PressableScale } from '@/ui/motion';
import { hapticLight } from '@/lib/haptics';

/**
 * Icons pro Tab — nur Lucide-Vektoren. Reine Icons ohne Text-Labels
 * auf der schwebenden Kapsel (schwarze Pill-Nav laut Redesign-Vorgabe).
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

  const inboxBadge =
    (data?.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed).length ?? 0) +
    (data?.threads.reduce((sum, thread) => sum + thread.unreadCount, 0) ?? 0);
  const openTasks = data?.homework.filter((item) => !item.done).length ?? 0;

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
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 14),
        alignItems: 'center',
      }}
    >
      {/* Schwebende Kapsel: Charcoal (#18191C), Pill-Form, weicher Schatten */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          backgroundColor: colors.charcoal,
          borderRadius: 36,
          paddingVertical: 8,
          paddingHorizontal: 8,
          shadowColor: colors.charcoal,
          shadowOpacity: 0.35,
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
    activeVal.value = withSpring(active ? 1 : 0, { damping: 18, stiffness: 260 });
  }, [active, activeVal]);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activeVal.value }],
    opacity: activeVal.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activeVal.value }],
    opacity: activeVal.value,
  }));

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      scale={0.92}
      style={{ alignItems: 'center', justifyContent: 'center', width: 56, height: 52 }}
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
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 22,
              backgroundColor: colors.charcoalElevated,
            },
            bgStyle,
          ]}
        />
        <Icon
          size={22}
          strokeWidth={active ? 2.6 : 2}
          color={active ? colors.on.charcoal : colors.faint}
        />
      </View>

      {/* Farblicher Akzent-Punkt für den aktiven Tab (Redesign-Spezifikation) */}
      <Animated.View
        style={[
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.accent.amber,
            marginTop: 2,
          },
          dotStyle,
        ]}
      />

      {item.badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 4,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: 9,
            backgroundColor: colors.accent.coral,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.on.coral, fontSize: 10, fontWeight: '800' }}>
            {item.badge > 99 ? '99+' : item.badge}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
