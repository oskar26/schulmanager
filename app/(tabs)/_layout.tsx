import { Tabs } from 'expo-router';
import { Platform, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette } from '@/design/tokens';
import { useSnapshot } from '@/data/queries';
import { useSettings } from '@/state/settings';

export default function TabsLayout() {
  const system = useColorScheme();
  const theme = useSettings((state) => state.settings.theme);
  const dark = (theme === 'system' ? system : theme) === 'dark';
  const { data } = useSnapshot();

  const inboxBadge =
    (data?.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed).length ?? 0) +
    (data?.threads.reduce((sum, thread) => sum + thread.unreadCount, 0) ?? 0);

  const openTasks = data?.homework.filter((item) => !item.done).length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? '#8A7CFF' : palette.brand,
        tabBarInactiveTintColor: dark ? '#6C748E' : palette.faint,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
        tabBarStyle: {
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
