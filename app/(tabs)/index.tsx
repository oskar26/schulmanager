import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useSnapshot } from '@/data/queries';
import { WIDGET_COMPONENTS } from '@/features/dashboard/widgets';
import { greeting, formatLongDay, formatTimeAgo, toISO } from '@/lib/date';
import { useLayout } from '@/lib/breakpoints';
import { Avatar } from '@/ui/gluestack/feedback';
import { AdaptiveContent, Card, IconButton, Muted, Row, Screen, Skeleton } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';
import { useSettings } from '@/state/settings';

export default function DashboardScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching, isDemo } = useSnapshot();
  const widgets = useSettings((state) => state.settings.widgets);
  const layout = useLayout();
  const wide = layout.navigation !== 'bottom';

  const enabled = useMemo(() => widgets.filter((widget) => widget.enabled), [widgets]);
  const name = data?.student?.firstname ?? 'Schulflow';

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: wide ? 0 : 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor="#6C5CE7" />}
      >
        <AdaptiveContent dashboard>
          {/* Kopf */}
          <Row className="justify-between pb-2 pt-2">
            <View className="flex-1">
              <Text className={`font-semibold text-muted ${wide ? 'text-[15px]' : 'text-[13px]'}`}>
                {greeting()}, {name} 👋
              </Text>
              <Text
                className={`mt-0.5 font-extrabold tracking-tight text-ink ${
                  layout.isDesktop ? 'text-[40px]' : 'text-[26px]'
                }`}
              >
                {formatLongDay(toISO(new Date()))}
              </Text>
            </View>
            {/* Auf großen Screens leben Suche & Einstellungen in der Sidebar. */}
            {!wide ? (
              <Row className="gap-2">
                <IconButton icon="search" onPress={() => router.push('/search')} color="#6A7086" />
                <IconButton icon="settings-outline" onPress={() => router.push('/settings')} color="#6A7086" />
              </Row>
            ) : null}
          </Row>

          {/* Schul-/Statuszeile */}
          <Row className="mb-4 gap-2">
            <Avatar name={`${data?.student?.firstname ?? 'S'} ${data?.student?.lastname ?? 'F'}`} size={26} />
            <Muted className="flex-1 text-[12px]" numberOfLines={1}>
              {data?.institution?.name ?? 'Schule'}
              {data?.student?.className ? ` · Klasse ${data.student.className}` : ''}
            </Muted>
            {isDemo ? (
              <View className="rounded-full bg-lemon/25 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-warning">DEMO</Text>
              </View>
            ) : (
              <Muted className="text-[11px]">{formatTimeAgo(data?.fetchedAt)}</Muted>
            )}
            {wide ? (
              <Muted className="text-[11px]" style={{ fontVariant: ['tabular-nums'] }}>
                {enabled.length} Widgets · {layout.columns} Spalten
              </Muted>
            ) : null}
          </Row>

          {isLoading || !data ? (
            <View className="gap-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-40" />
              <Skeleton className="h-56" />
            </View>
          ) : (
            <View
              className="gap-3"
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
                        ? { flexGrow: 1, flexBasis: layout.columns === 3 ? 310 : 360, maxWidth: '100%' }
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
                    ? { flexGrow: 1, flexBasis: layout.columns === 3 ? 310 : 360, maxWidth: '100%' }
                    : undefined
                }
              >
                <Card className="mt-0 h-full items-center bg-brand-soft" padded>
                  <Text className="text-center text-[13px] font-semibold text-brand-ink">
                    Dashboard anpassen
                  </Text>
                  <Muted className="mt-1 text-center text-[12px]">
                    In den Einstellungen legst du fest, welche Karten hier erscheinen — und in welcher
                    Reihenfolge.
                  </Muted>
                  <Row className="mt-3">
                    <IconButton
                      icon="options-outline"
                      onPress={() => router.push('/settings')}
                      background="bg-surface"
                      color="#6C5CE7"
                    />
                  </Row>
                </Card>
              </View>
            </View>
          )}
        </AdaptiveContent>
      </ScrollView>
    </Screen>
  );
}
