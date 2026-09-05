import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';

import { foregroundOn, resolveThemeColor } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { tint } from '@/design/subjects';
import { hapticToggle } from '@/lib/haptics';
import { useSafeBack } from '@/ui/navigation';
import { PressableOpacity, PressableScale } from '@/ui/motion';
import {
  BlockCaption,
  BlockText,
  Card,
  ColorBlockCard,
  Divider,
  IconBadge,
  IconButton,
  Muted,
  Row,
  Screen,
  Title,
} from '@/ui/primitives';
import { Switch } from '@/ui/gluestack/feedback';

/** Gemeinsamer Header für alle Settings-Unterseiten. */
export function SettingsHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const back = useSafeBack('/settings');
  const { colors } = useThemeColors();
  return (
    <Row className="gap-3 px-4 pb-2 pt-2">
      <IconButton
        icon="chevron-back"
        onPress={back}
        color={colors.muted}
        background="bg-line/50"
        size={40}
      />
      <View className="min-w-0 flex-1">
        <Title numberOfLines={1}>{title}</Title>
        {subtitle ? <Muted numberOfLines={1}>{subtitle}</Muted> : null}
      </View>
    </Row>
  );
}

/** Scroll-/Safe-Area-Rahmen jeder Kategorie. Die Reserve hält den Footer frei. */
export function SettingsPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Screen adaptive="content">
      <SettingsHeader title={title} subtitle={subtitle} />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Screen>
  );
}

/** Farbiger Abschnittskopf aus Phase 8, jetzt auch in den Drilldowns. */
export function SectionBlock({
  icon,
  color,
  title,
  hint,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  hint?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const tone = resolveThemeColor(color, isDark);
  const ink = tone;
  return (
    <ColorBlockCard
      color={tone}
      className="mb-2.5 mt-4"
      style={{ paddingHorizontal: 18, paddingVertical: 16 }}
    >
      <Row className="gap-3.5">
        <IconBadge icon={icon} color={ink} tone="tint" size="lg" />
        <View className="min-w-0 flex-1">
          <BlockText className="text-[19px] font-extrabold leading-6" numberOfLines={2}>
            {title}
          </BlockText>
          {hint ? (
            <BlockCaption className="mt-0.5 text-[12.5px] leading-[17px]" numberOfLines={3}>
              {hint}
            </BlockCaption>
          ) : null}
        </View>
      </Row>
    </ColorBlockCard>
  );
}

/** Kategorie-Karte: der einzige Inhalt der neuen Settings-Hauptseite. */
export function CategoryCard({
  icon,
  color,
  title,
  hint,
  onPress,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const tone = resolveThemeColor(color, isDark);
  const ink = tone;
  return (
    <PressableScale
      onPress={onPress}
      scale={0.985}
      hoverScale={1.01}
      accessibilityRole="button"
      accessibilityLabel={`${title} öffnen`}
      className="mb-3"
    >
      <ColorBlockCard color={tone} style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
        <Row className="gap-3.5">
          <IconBadge icon={icon} color={ink} tone="tint" size="lg" />
          <View className="min-w-0 flex-1">
            <BlockText className="text-[18px] font-extrabold leading-[22px]" numberOfLines={2}>
              {title}
            </BlockText>
            <BlockCaption className="mt-0.5 text-[12.5px] leading-[17px]" numberOfLines={2}>
              {hint}
            </BlockCaption>
          </View>
          <ChevronRight color={ink} size={22} strokeWidth={2.5} />
        </Row>
      </ColorBlockCard>
    </PressableScale>
  );
}

/** Toggle mit Plattform-Animation und semantischem Haptik-Feedback. */
export function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  icon,
  iconColor,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  icon?: LucideIcon;
  iconColor?: string;
}) {
  return (
    <Row className="min-h-[56px] gap-3 px-4 py-3.5">
      {icon ? <IconBadge icon={icon} color={iconColor} tone="tint" size="md" /> : null}
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-bold text-ink">{title}</Text>
        {subtitle ? <Muted className="mt-0.5 text-[12px] leading-[16px]">{subtitle}</Muted> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(next) => {
          hapticToggle(next);
          onValueChange(next);
        }}
        accessibilityLabel={title}
      />
    </Row>
  );
}

export function InfoRow({
  title,
  subtitle,
  icon,
  iconColor,
  onPress,
  danger,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useThemeColors();
  const content = (
    <Row className="min-h-[56px] gap-3 px-4 py-3.5">
      {icon ? <IconBadge icon={icon} color={danger ? colors.danger : iconColor} tone="tint" size="md" /> : null}
      <View className="min-w-0 flex-1">
        <Text className={`text-[15px] font-bold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</Text>
        {subtitle ? <Muted className="mt-0.5 text-[12px] leading-[16px]">{subtitle}</Muted> : null}
      </View>
      {onPress ? <ChevronRight color={colors.faint} size={18} /> : null}
    </Row>
  );
  if (!onPress) return content;
  return (
    <PressableOpacity onPress={onPress} accessibilityRole="button" className="hover:bg-line/40 active:bg-line/60">
      {content}
    </PressableOpacity>
  );
}

/** Trennlinien bleiben innerhalb einer zusammengehörigen Gruppe. */
export function SettingsGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <Card padded={false} className={`mb-2.5 overflow-hidden ${className}`}>
      {rows.map((row, index) => (
        <View key={index}>
          {index > 0 ? <Divider className="ml-4" /> : null}
          {row}
        </View>
      ))}
    </Card>
  );
}

/** Kleine Status-/Erklärungskarte, damit leere Unterseiten nicht nackt wirken. */
export function SettingsNote({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <Card className="mb-2.5" style={color ? { backgroundColor: tint(color, 0.12) } : undefined}>
      <Muted className="text-[12.5px] leading-[18px]">{children}</Muted>
    </Card>
  );
}

export function SettingButton({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const { colors } = useThemeColors();
  return (
    <PressableOpacity
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-[48px] items-center justify-center rounded-[20px] bg-canvas px-4"
    >
      <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>{children}</Text>
    </PressableOpacity>
  );
}
