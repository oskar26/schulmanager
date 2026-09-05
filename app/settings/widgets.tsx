import React, { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GripVertical, LayoutGrid } from 'lucide-react-native';

import { useModuleActive } from '@/data/queries';
import { hapticHeavy } from '@/lib/haptics';
import { useSettings, WIDGET_META, type WidgetId } from '@/state/settings';
import { useThemeColors } from '@/design/theme';
import { IconButton, Row } from '@/ui/primitives';
import { Switch } from '@/ui/gluestack/feedback';
import { SettingsGroup, SettingsNote, SettingsPage } from './_components';

const ROW_HEIGHT = 78;

/**
 * Eine echte Pan-Geste statt zweier „nach oben/unten“-Buttons. Die Reihe hebt
 * beim Ziehen ab; erst beim Loslassen wird die neue Reihenfolge atomar im
 * Settings-Store persistiert. Dadurch bleibt Dashboard und Store identisch.
 */
function DraggableWidgetRow({
  widget,
  onDrop,
  onToggle,
}: {
  widget: { id: WidgetId; enabled: boolean };
  onDrop: (id: WidgetId, offset: number) => void;
  onToggle: (id: WidgetId) => void;
}) {
  const { colors } = useThemeColors();
  const translateY = useSharedValue(0);
  const lifted = useSharedValue(0);
  const meta = WIDGET_META[widget.id];
  const gesture = Gesture.Pan()
    .minDistance(4)
    .onBegin(() => {
      'worklet';
      lifted.value = withSpring(1);
      runOnJS(hapticHeavy)();
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      const offset = Math.round(event.translationY / ROW_HEIGHT);
      translateY.value = withSpring(0);
      lifted.value = withSpring(0);
      runOnJS(onDrop)(widget.id, offset);
    })
    .onFinalize(() => {
      'worklet';
      translateY.value = withSpring(0);
      lifted.value = withSpring(0);
    });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: 1 + lifted.value * 0.015 }],
    zIndex: lifted.value ? 10 : 0,
    shadowOpacity: lifted.value * 0.16,
    shadowRadius: lifted.value * 12,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ minHeight: ROW_HEIGHT, backgroundColor: colors.surface, shadowColor: colors.charcoal }, animatedStyle]}>
        <Row className="min-h-[78px] gap-3 px-4 py-3.5">
          <GripVertical color={colors.faint} size={20} accessibilityLabel="Ziehen zum Sortieren" />
          <IconButton icon={LayoutGrid} size={36} background="bg-line/50" color={colors.blocks.violet} />
          <View className="min-w-0 flex-1">
            <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>{meta.title}</Text>
            <Text className="mt-0.5 text-[12px] leading-[16px] text-muted" numberOfLines={2}>{meta.description}</Text>
          </View>
          <Switch value={widget.enabled} onValueChange={() => onToggle(widget.id)} accessibilityLabel={`Widget ${meta.title} anzeigen`} />
        </Row>
      </Animated.View>
    </GestureDetector>
  );
}

export default function WidgetSettings() {
  const { colors } = useThemeColors();
  const { settings, setWidgetOrder, toggleWidget } = useSettings();
  const gradesOn = useModuleActive('grades');
  const visibleWidgets = useMemo(
    () => settings.widgets.filter((widget) => widget.id !== 'grades' || gradesOn),
    [gradesOn, settings.widgets],
  );
  const drop = useCallback((id: WidgetId, offset: number) => {
    if (!offset) return;
    const from = visibleWidgets.findIndex((widget) => widget.id === id);
    if (from < 0) return;
    const target = Math.max(0, Math.min(visibleWidgets.length - 1, from + offset));
    if (target === from) return;
    const next = visibleWidgets.map((widget) => widget.id);
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    setWidgetOrder(next);
  }, [setWidgetOrder, visibleWidgets]);

  return (
    <SettingsPage title="Dashboard-Widgets" subtitle="Ziehen, ablegen, fertig">
      <SettingsNote color={colors.blocks.violet}>
        Halte den Griff rechts bzw. links einer Karte und ziehe sie an die gewünschte Stelle. Ausgeblendete Karten werden auf dem Dashboard nicht gerendert und verbrauchen dort keinen Platz.
      </SettingsNote>
      <SettingsGroup>
        {visibleWidgets.map((widget) => (
          <DraggableWidgetRow key={widget.id} widget={widget} onDrop={drop} onToggle={toggleWidget} />
        ))}
      </SettingsGroup>
    </SettingsPage>
  );
}
