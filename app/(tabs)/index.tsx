import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Settings } from 'lucide-react-native';

import { useSnapshot } from '@/data/queries';
import { WIDGET_COMPONENTS } from '@/features/dashboard/widgets';
import { greeting, formatLongDay, formatTimeAgo, toISO } from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import { Avatar } from '@/ui/gluestack/feedback';
import { AdaptiveContent, Card, Muted, Row, Screen, Skeleton } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useSettings } from '@/state/settings';

function HeaderAction({
  onPress,
  dark,
  children,
}: {
  onPress: () => void;
  dark: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.96 : 1 }],
        backgroundColor: dark ? '#1E293B' : '#FFFFFF',
        shadowColor: '#18181B',
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      })}
    >
      {children}
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const system = useColorScheme();
  const theme = useSettings((state) => state.settings.theme);
  const dark = (theme === 'system' ? system : theme) === 'dark';
  const { data, isLoading, refetch, isRefetching, isDemo } = useSnapshot();
  const widgets = useSettings((state) => state.settings.widgets);
  const layout = useLayout();
  const wide = layout.navigation !== 'bottom';

  const enabled = useMemo(() => widgets.filter((widget) => widget.enabled), [widgets]);
  const name = data?.student?.firstname ?? 'Schulflow';

  const iconColor = dark ? '#94A3B8' : '#6E6C66';
  const chipBg = dark ? '#1E293B' : '#FFFFFF';

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: wide ? 0 : 18, paddingTop: 6, paddingBottom: 132 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor="#6C5CE7" />}
      >
        <AdaptiveContent dashboard>
          {/* Kopf: Begrüßung + Datum, rechts Aktionen */}
          <Row className="justify-between pt-2">
            <View className="flex-1 pr-3">
              <Row className="gap-2">
                <Avatar name={`${data?.student?.firstname ?? 'S'} ${data?.student?.lastname ?? 'F'}`} size={34} />
                <Text className={`flex-1 font-semibold text-muted ${wide ? 'text-[15px]' : 'text-[13px]'}`} numberOfLines={1}>
                  {greeting()}, {name}
                </Text>
              </Row>
              <Text
                className={`mt-1.5 font-extrabold tracking-tight text-ink ${
                  layout.isDesktop ? 'text-[36px]' : 'text-[27px]'
                }`}
                numberOfLines={1}
              >
                {formatLongDay(toISO(new Date()))}
              </Text>
            </View>
            {/* Auf großen Screens leben Suche & Einstellungen in der Sidebar. */}
            {!wide ? (
              <Row className="gap-2">
                <HeaderAction dark={dark} onPress={() => router.push('/search')}>
                  <Search size={20} strokeWidth={2.1} color={iconColor} />
                </HeaderAction>
                <HeaderAction dark={dark} onPress={() => router.push('/settings')}>
                  <Settings size={20} strokeWidth={2.1} color={iconColor} />
                </HeaderAction>
              </Row>
            ) : null}
          </Row>

          {/* Schul-/Status-Pill */}
          <View
            style={{ backgroundColor: chipBg, marginTop: 14, marginBottom: 18, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}
          >
            <Muted className="text-[12px]" numberOfLines={1}>
              {data?.institution?.name ?? 'Schule'}
              {data?.student?.className ? ` · Klasse ${data.student.className}` : ''}
            </Muted>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dark ? '#475569' : '#D6D3D1' }} />
            {isDemo ? (
              <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>DEMO</Text>
              </View>
            ) : (
              <Muted className="text-[11px]">{formatTimeAgo(data?.fetchedAt)}</Muted>
            )}
          </View>

          {isLoading || !data ? (
            <View className="gap-4">
              <Skeleton className="h-40 rounded-[28px]" />
              <Skeleton className="h-48 rounded-[28px]" />
              <Skeleton className="h-56 rounded-[28px]" />
            </View>
          ) : (
            <View
              className="gap-4"
              style={layout.columns > 1 ? { flexDirection: 'row', flexWrap: 'wrap' } : undefined}
            >
              {enabled.map((widget, index) => {
                const Component = WIDGET_COMPONENTS[widget.id as keyof typeof WIDGET_COMPONENTS];
                if (!Component) return null;
                return (
                  <FadeInUp
                    key={widget.id}
                    delay={Math.min(index, 10) * 45}
                    style={
                      layout.columns > 1
                        ? { flexGrow: 1, flexBasis: layout.columns === 3 ? 300 : 360, maxWidth: '100%' }
                        : undefined
                    }
                  >
                    <View className="h-full">
                      <Component snapshot={data} />
                    </View>
                  </FadeInUp>
                );
              })}

              <View
                style={
                  layout.columns > 1
                    ? { flexGrow: 1, flexBasis: layout.columns === 3 ? 300 : 360, maxWidth: '100%' }
                    : undefined
                }
              >
                <Card className="h-full items-center bg-periwinkle-soft" style={{ borderRadius: 28, padding: 22 }}>
                  <Text className="text-center text-[15px] font-extrabold text-indigo-900">
                    Dashboard anpassen
                  </Text>
                  <Muted className="mt-1 text-center text-[13px] leading-5">
                    Bestimme, welche Karten hier erscheinen und in welcher Reihenfolge.
                  </Muted>
                  <HeaderAction dark={dark} onPress={() => router.push('/settings')}>
                    <Settings size={19} strokeWidth={2.1} color="#6C5CE7" />
                  </HeaderAction>
                </Card>
              </View>
            </View>
          )}
        </AdaptiveContent>
      </ScrollView>
    </Screen>
  );
}
