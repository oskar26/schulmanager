import React, { useEffect } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { Home, CalendarDays, ListChecks, BarChart3, Inbox } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useSnapshot, useModuleActive } from '@/data/queries';
import { useSettings } from '@/state/settings';
import { useLayout } from '@/lib/breakpoints';
import { AdaptiveTabBar } from '@/ui/shell';
import { PressableScale } from '@/ui/motion';

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
  const system = useColorScheme();
  const theme = useSettings((state) => state.settings.theme);
  const dark = (theme === 'system' ? system : theme) === 'dark';
  const layout = useLayout();

  const gradesOn = useModuleActive('grades');
  const wide = layout.navigation !== 'bottom';

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props: BottomTabBarProps) =>
        wide ? <AdaptiveTabBar {...props} layout={layout} /> : <FloatingTabBar {...props} dark={dark} />
      }
      screenOptions={{
        sceneStyle: wide ? { marginLeft: layout.navigationWidth } : { backgroundColor: dark ? '#0F172A' : '#F6F5F2' },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Start' }} />
      <Tabs.Screen name="timetable" options={{ title: 'Plan' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Aufgaben' }} />
      <Tabs.Screen
        name="grades"
        options={{ title: 'Noten', href: gradesOn ? undefined : null }}
      />
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

function FloatingTabBar({ state, navigation, descriptors, dark }: BottomTabBarProps & { dark: boolean }) {
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
      {/* Schwebende dunkle Kapsel (Soft-Brutalism-Taskbar) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          backgroundColor: '#111827',
          borderRadius: 36,
          paddingVertical: 10,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOpacity: 0.28,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 18,
          maxWidth: 460,
          width: '100%',
        }}
      >
        {items.map((item) => {
          const active = item.activeKey;
          const routeKey = state.routes.find((r) => r.name === item.name)?.key ?? item.name;
          const label = String(descriptors[routeKey]?.options.title ?? item.name);

          return (
            <AnimatedTabItem
              key={item.name}
              item={item}
              active={active}
              dark={dark}
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
  dark,
  label,
  onPress,
}: {
  item: TabSpec;
  active: boolean;
  dark: boolean;
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
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 22,
              backgroundColor: dark ? '#334155' : '#1E293B',
            },
            bgStyle,
          ]}
        />
        <Icon
          size={22}
          strokeWidth={active ? 2.5 : 2}
          color={active ? '#FFFFFF' : dark ? '#8A90AA' : '#64748B'}
        />
      </View>

      {item.badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: 9,
            backgroundColor: '#EF4444',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
            {item.badge > 99 ? '99+' : item.badge}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
