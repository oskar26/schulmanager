import { Tabs } from 'expo-router';
import { Platform, useColorScheme, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { palette } from '@/design/tokens';
import { useSnapshot, useModuleActive } from '@/data/queries';
import { useSettings } from '@/state/settings';
import { useLayout } from '@/lib/breakpoints';
import { AdaptiveTabBar } from '@/ui/shell';

export default function TabsLayout() {
  const system = useColorScheme();
  const theme = useSettings((state) => state.settings.theme);
  const dark = (theme === 'system' ? system : theme) === 'dark';
  const { data } = useSnapshot();
  const layout = useLayout();

  const inboxBadge =
    (data?.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed).length ?? 0) +
    (data?.threads.reduce((sum, thread) => sum + thread.unreadCount, 0) ?? 0);

  const openTasks = data?.homework.filter((item) => !item.done).length ?? 0;

  // Noten-Tab nur an Schulen mit gebuchtem Noten-Modul — das offizielle Menü
  // macht es genauso. (href: null entfernt den Eintrag komplett aus der Leiste.)
  const gradesOn = useModuleActive('grades');

  const wide = layout.navigation !== 'bottom';

  return (
    <Tabs
      // Ab Tablet zusammengelegt: Icon-Rail, ab Desktop volle Sidebar links.
      tabBar={(props: BottomTabBarProps) =>
        wide ? <AdaptiveTabBar {...props} layout={layout} /> : <BottomTabBar {...props} />
      }
      // Linker Rand für die Sidebar — sonst läge sie über dem Inhalt.
      screenOptions={{
        sceneStyle: wide ? { marginLeft: layout.navigationWidth } : undefined,
        headerShown: false,
        tabBarActiveTintColor: dark ? '#8A7CFF' : palette.brand,
        tabBarInactiveTintColor: dark ? '#6C748E' : palette.faint,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
        tabBarStyle: wide
          ? { display: 'none' }
          : {
              position: 'absolute',
              borderTopWidth: 0,
              elevation: 0,
              height: Platform.OS === 'ios' ? 84 : 66,
              paddingTop: 8,
              paddingBottom: Platform.OS === 'ios' ? 26 : 10,
              backgroundColor: dark ? 'rgba(20,24,40,0.94)' : 'rgba(255,255,255,0.94)',
            },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              borderTopWidth: 1,
              borderTopColor: dark ? '#272D44' : '#E8EAF3',
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Aufgaben',
          tabBarBadge: openTasks > 0 ? openTasks : undefined,
          tabBarBadgeStyle: { backgroundColor: palette.coral, fontSize: 10 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Noten',
          href: gradesOn ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Postfach',
          tabBarBadge: inboxBadge > 0 ? inboxBadge : undefined,
          tabBarBadgeStyle: { backgroundColor: palette.coral, fontSize: 10 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'mail' : 'mail-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
