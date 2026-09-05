/**
 * App-Shell: adaptive Navigation.
 *
 * · Phone    → schwebende Charcoal-Kapsel (in app/(tabs)/_layout.tsx)
 * · Tablet   → ruhige Icon-Rail links
 * · Desktop  → volle Sidebar mit Labels, Werkzeugen und Konto-Fuß
 *
 * Rail und Sidebar teilen bewusst dieselben Bausteine: IconBadge, Amber-aktive
 * Pill und kompakte, begrenzte Zähler. So wechselt nur die Informationsdichte,
 * nicht die visuelle Sprache.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  BarChart3,
  CalendarDays,
  GraduationCap,
  Home,
  Inbox,
  ListChecks,
  Search,
  Settings,
  type LucideIcon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { blockTint, radius, shadow } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import type { LayoutInfo } from '@/lib/breakpoints';
import { useSnapshot } from '@/data/queries';
import { hapticLight } from '@/lib/haptics';
import { IconBadge, Pill } from '@/ui/primitives';
import { formatNavBadge, normaliseBadgeCount } from '@/ui/navigation';
import { PressableScale } from '@/ui/motion';

function useBadges(): { tasks: number; inbox: number } {
  const { data } = useSnapshot();
  if (!data) return { tasks: 0, inbox: 0 };
  return {
    tasks: normaliseBadgeCount(data.homework.filter((item) => !item.done).length),
    inbox: normaliseBadgeCount(
      data.letters.filter((letter) => letter.requiresConfirmation && !letter.confirmed).length +
        data.threads.reduce((sum, thread) => sum + normaliseBadgeCount(thread.unreadCount), 0),
    ),
  };
}

interface NavItemSpec {
  key: string;
  name: string;
  title: string;
  icon: LucideIcon;
  badge: number;
}

const ICONS: Record<string, LucideIcon> = {
  index: Home,
  timetable: CalendarDays,
  tasks: ListChecks,
  grades: BarChart3,
  inbox: Inbox,
};

/**
 * Zähler für Navigationseinträge (max. 99+). In der vollen Sidebar sitzt das
 * Badge per `marginLeft: auto` **ganz rechts** im Nav-Item (space-between) und
 * kann Icon oder Label nicht mehr überlagern; auf der Rail schwebt es oben
 * rechts am Icon.
 */
function NavBadge({ count, compact = false }: { count: number; compact?: boolean }) {
  const { colors } = useThemeColors();
  const label = formatNavBadge(count);
  if (!label) return null;

  return (
    <View
      accessibilityLabel={`${label} neue Einträge`}
      style={{
        position: compact ? 'absolute' : 'relative',
        top: compact ? -6 : undefined,
        right: compact ? -10 : undefined,
        minWidth: label === '99+' ? 30 : 20,
        height: 20,
        paddingHorizontal: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.status.urgent,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: compact ? 0 : 'auto',
        flexShrink: 0,
        borderWidth: compact ? 2 : 0,
        borderColor: colors.surface,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', lineHeight: 13 }}>
        {label}
      </Text>
    </View>
  );
}

export function AdaptiveTabBar(props: BottomTabBarProps & { layout: LayoutInfo }) {
  const { state, navigation, layout } = props;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const { data, isDemo } = useSnapshot();

  const full = layout.navigation === 'sidebar';
  const rail = layout.navigation === 'rail';
  const badges = useBadges();

  const items: NavItemSpec[] = state.routes
    // href: null versteckt Tabs (z. B. Noten ohne gebuchtes Modul) aus der
    // Navigation. Der Screen selbst leitet Deep-Links sicher zurück (grades.tsx).
    .filter(
      (route) =>
        ICONS[route.name] &&
        (props.descriptors[route.key]?.options as { href?: string | null } | undefined)?.href !== null,
    )
    .map((route) => ({
      key: route.key,
      name: route.name,
      title: String(props.descriptors[route.key]?.options.title ?? route.name),
      icon: ICONS[route.name],
      badge: route.name === 'tasks' ? badges.tasks : route.name === 'inbox' ? badges.inbox : 0,
    }));

  const activeKey = state.routes[state.index]?.key;

  const goTab = (name: string, key: string) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    // Tab-Routen werden mit `navigate`, nicht per Stack-Push gewechselt. Dadurch
    // bleibt die gemountete Scrollposition beim Wechsel zwischen Haupt-Tabs intakt.
    if (state.routes[state.index]?.key !== key && !event.defaultPrevented) {
      hapticLight();
      navigation.navigate(name);
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: layout.navigationWidth,
        backgroundColor: colors.surface,
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, 12),
        borderRightWidth: 1,
        borderRightColor: colors.line,
        ...shadow.card,
      }}
    >
      {/* Marke */}
      <View
        style={{
          paddingTop: 18,
          paddingBottom: 18,
          paddingHorizontal: full ? 20 : 0,
          alignItems: full ? 'flex-start' : 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBadge icon={GraduationCap} color={colors.accent.violet} size="lg" tone="solid" accessibilityLabel="Schulflow" style={{ borderRadius: 12 }} />
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
            paddingBottom: 8,
          }}
        >
          Menü
        </Text>
      ) : null}

      {/* Hauptnavigation */}
      <View style={{ gap: 8, paddingHorizontal: full ? 12 : 12, alignItems: full ? 'stretch' : 'center' }}>
        {items.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          return (
            <PressableScale
              key={item.key}
              scale={0.95}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.title}
              onPress={() => goTab(item.name, item.key)}
              style={{
                // .nav-item: flex · align-items center · space-between · 12/16 padding · 100 % breit
                minHeight: full ? 48 : 62,
                minWidth: full ? undefined : 62,
                width: full ? '100%' : 62,
                flexDirection: full ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: full ? 'space-between' : 'center',
                gap: full ? 12 : 4,
                paddingVertical: full ? 12 : 7,
                paddingHorizontal: full ? 16 : 4,
                borderRadius: full ? radius.md : radius.pill,
                backgroundColor: active ? blockTint(colors.accent.violet, isDark) : 'transparent',
              }}
            >
              <View style={{ position: 'relative', flexShrink: 0 }}>
                <IconBadge
                  icon={Icon}
                  color={active ? colors.accent.violet : colors.muted}
                  size="md"
                  tone={active ? 'solid' : 'tint'}
                  strokeWidth={active ? 2.5 : 2}
                  style={{ borderRadius: 10 }}
                />
                {rail ? <NavBadge count={item.badge} compact /> : null}
              </View>
              {full ? (
                <Text
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14.5,
                    fontWeight: active ? '800' : '600',
                    color: active ? colors.accent.violet : colors.ink,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.title}
                </Text>
              ) : null}
              {full ? <NavBadge count={item.badge} /> : null}
            </PressableScale>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Werkzeuge */}
      <View style={{ gap: 8, paddingHorizontal: full ? 12 : 12, alignItems: full ? 'stretch' : 'center' }}>
        <ToolButton icon={Search} label="Suche" full={full} onPress={() => router.push('/search')} />
        <ToolButton icon={Settings} label="Einstellungen" full={full} onPress={() => router.push('/settings')} />
      </View>

      {/* Konto-Fuß (nur Desktop) */}
      {full ? (
        <PressableScale
          onPress={() => router.push('/settings')}
          scale={0.98}
          hoverScale={1.01}
          style={{
            marginTop: 16,
            marginHorizontal: 12,
            padding: 12,
            borderRadius: radius.md,
            backgroundColor: colors.canvas,
            borderWidth: 1,
            borderColor: colors.line,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <IconBadge icon={GraduationCap} color={colors.accent.violet} size="md" tone="tint" style={{ borderRadius: 10 }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>
              {data?.student ? `${data.student.firstname} ${data.student.lastname}` : 'Nicht verbunden'}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>
              {isDemo ? 'Demo-Modus' : data?.institution?.name ?? 'Schule verbinden …'}
            </Text>
          </View>
          {isDemo ? <DemoPill /> : null}
        </PressableScale>
      ) : (
        <View style={{ marginTop: 14, alignItems: 'center' }}>{isDemo ? <DemoPill /> : null}</View>
      )}
    </View>
  );
}

function DemoPill() {
  const { colors } = useThemeColors();
  return <Pill label="DEMO" color={colors.accent.amber} tone="tint" className="px-2 py-1" />;
}

function ToolButton({
  icon: Icon,
  label,
  full,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  full: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scale={0.95}
      style={{
        minHeight: full ? 48 : 58,
        minWidth: full ? undefined : 58,
        width: full ? '100%' : 58,
        flexDirection: full ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: full ? 'flex-start' : 'center',
        gap: full ? 12 : 4,
        paddingHorizontal: full ? 16 : 4,
        borderRadius: full ? radius.md : radius.pill,
      }}
    >
      <IconBadge icon={Icon} color={colors.muted} size="md" tone="tint" style={{ borderRadius: 10 }} />
      {full ? <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted }} numberOfLines={1}>{label}</Text> : null}
    </PressableScale>
  );
}
