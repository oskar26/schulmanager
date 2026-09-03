/** Basis-Bausteine der Schulflow-Oberfläche (NativeWind + gluestack). */
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { shadow } from '@/design/tokens';
import { tint } from '@/design/subjects';
import { useLayout } from '@/lib/breakpoints';

/* ------------------------------------------------------------------ Text */

type TxtProps = React.ComponentProps<typeof Text> & { className?: string };

export const Txt = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[15px] text-ink ${className}`} />
);

export const Muted = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[13px] text-muted ${className}`} />
);

export const Display = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[32px] font-extrabold tracking-tight text-ink ${className}`} />
);

export const Title = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[21px] font-bold tracking-tight text-ink ${className}`} />
);

export const Label = ({ className = '', ...props }: TxtProps) => (
  <Text
    {...props}
    className={`text-[11px] font-bold uppercase tracking-[1.4px] text-faint ${className}`}
  />
);

/* ------------------------------------------------------------------ Layout */

export function Screen({
  children,
  className = '',
  edges = ['top'],
  adaptive,
}: {
  children: React.ReactNode;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /**
   * `adaptive` zentriert und begrenzt den Inhalt auf Tablets/Desktop:
   * · 'content'   → Lesebreite (~1120 dp)
   * · 'dashboard' → volle Kartenbreite (~1280–1440 dp)
   * · 'narrow'    → Dialogbreite (~640 dp), z. B. Formulare und Suche
   * Auf Phones ist die Prop ein No-Op.
   */
  adaptive?: 'content' | 'dashboard' | 'narrow';
}) {
  const layout = useLayout();
  const wide = layout.navigation !== 'bottom';

  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-bg ${className}`}>
      {adaptive && wide ? (
        <AdaptiveContent
          dashboard={adaptive === 'dashboard'}
          narrow={adaptive === 'narrow'}
          style={{ flex: 1 }}
        >
          {children}
        </AdaptiveContent>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

/**
 * Breiten-Wrapper für Inhalte: Auf Tablets/Desktop bleibt der Inhalt lesbar
 * zentriert, statt sich endlos in die Breite zu strecken. `narrow` eignet sich
 * für Formulare und Dialoge (Krankmeldung, Suche …).
 */
export function AdaptiveContent({
  children,
  className = '',
  narrow = false,
  dashboard = false,
  style,
  ...rest
}: ViewProps & {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  /** Layout-Maß des Dashboards (breiter als normale Lesespalten). */
  dashboard?: boolean;
}) {
  const layout = useLayout();
  const maxWidth = narrow ? 640 : dashboard ? layout.dashboardMaxWidth : layout.contentMaxWidth;
  return (
    <View
      {...rest}
      style={[
        {
          width: '100%',
          maxWidth: layout.isPhone ? undefined : maxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.isPhone ? 0 : layout.gutter,
        },
        style,
      ]}
      className={className}
    >
      {children}
    </View>
  );
}

export function Card({
  children,
  className = '',
  padded = true,
  floating = false,
  style,
  ...rest
}: ViewProps & { children: React.ReactNode; className?: string; padded?: boolean; floating?: boolean }) {
  return (
    <View
      {...rest}
      style={[floating ? shadow.float : shadow.card, style]}
      className={`rounded-3xl bg-surface ${padded ? 'p-4' : ''} ${className}`}
    >
      {children}
    </View>
  );
}

export function Row({ children, className = '', ...rest }: ViewProps & { className?: string }) {
  return (
    <View {...rest} className={`flex-row items-center ${className}`}>
      {children}
    </View>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <View className={`h-[1px] w-full bg-line ${className}`} />;
}

export function SectionHeader({
  title,
  action,
  onAction,
  emoji,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  emoji?: string;
}) {
  return (
    <Row className="mb-3 mt-6 justify-between px-1">
      <Row className="gap-2">
        {emoji ? <Text className="text-[16px]">{emoji}</Text> : null}
        <Text className="text-[17px] font-bold tracking-tight text-ink">{title}</Text>
      </Row>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-[13px] font-semibold text-brand">{action}</Text>
        </Pressable>
      ) : null}
    </Row>
  );
}

/* ------------------------------------------------------------------ Chips */

export function Chip({
  label,
  color,
  emoji,
  tone = 'tint',
  className = '',
}: {
  label: string;
  color?: string;
  emoji?: string;
  tone?: 'tint' | 'solid' | 'outline';
  className?: string;
}) {
  const base = color ?? '#6C5CE7';
  const style =
    tone === 'solid'
      ? { backgroundColor: base }
      : tone === 'outline'
        ? { borderWidth: 1, borderColor: base, backgroundColor: 'transparent' }
        : { backgroundColor: tint(base, 0.14) };

  return (
    <View style={style} className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${className}`}>
      {emoji ? <Text className="text-[11px]">{emoji}</Text> : null}
      <Text
        className="text-[11px] font-bold"
        style={{ color: tone === 'solid' ? '#FFFFFF' : base }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function Badge({ count, className = '' }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <View className={`min-w-[20px] items-center justify-center rounded-full bg-coral px-1.5 py-0.5 ${className}`}>
      <Text className="text-[11px] font-bold text-white">{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ States */

export function Skeleton({ className = '' }: { className?: string }) {
  return <View className={`overflow-hidden rounded-2xl bg-line/70 ${className}`} />;
}

export function EmptyState({
  emoji = '🌱',
  title,
  hint,
}: {
  emoji?: string;
  title: string;
  hint?: string;
}) {
  return (
    <View className="items-center justify-center gap-2 px-8 py-12">
      <Text className="text-[40px]">{emoji}</Text>
      <Text className="text-center text-[16px] font-bold text-ink">{title}</Text>
      {hint ? <Text className="text-center text-[13px] leading-5 text-muted">{hint}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Controls */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View className="flex-row rounded-2xl bg-line/60 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 ${
              active ? 'bg-surface' : ''
            }`}
            style={active ? shadow.card : undefined}
          >
            <Text
              className={`text-[13px] font-semibold ${active ? 'text-ink' : 'text-muted'}`}
              numberOfLines={1}
            >
              {option.label}
            </Text>
            {option.badge ? <Badge count={option.badge} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
  danger,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const content = (
    <Row className="gap-3 px-4 py-3.5">
      {icon ? (
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: tint(iconColor ?? '#6C5CE7', 0.14) }}
        >
          <Ionicons name={icon} size={18} color={iconColor ?? '#6C5CE7'} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className={`text-[15px] font-semibold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[12px] text-muted">{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={17} color="#9CA2B6" /> : null)}
    </Row>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} className="active:bg-line/40">
      {content}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = '#121422',
  background = 'bg-surface',
  size = 40,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size }}
      className={`items-center justify-center rounded-2xl active:opacity-70 ${background}`}
    >
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ Sheet */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const layout = useLayout();

  if (layout.isDesktop || layout.isTablet) {
    // Großer Screen ⇒ zentrierter Dialog statt Bottom-Sheet.
    return (
      <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
        <View className="flex-1 items-center justify-center bg-black/45 p-6">
          <Pressable accessibilityLabel="Schließen" onPress={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View
            className="max-h-[86%] w-full max-w-[560px] rounded-[28px] bg-surface pb-6"
            style={shadow.float}
          >
            {title ? (
              <Row className="justify-between px-5 pb-1 pt-4">
                <Title>{title}</Title>
                <IconButton icon="close" onPress={onClose} background="bg-line/50" size={34} color="#6A7086" />
              </Row>
            ) : null}
            <ScrollView className="px-5" contentContainerClassName="pb-6">
              {children}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40" />
      <View className="max-h-[82%] rounded-t-[30px] bg-surface pb-8" style={shadow.float}>
        <View className="items-center py-3">
          <View className="h-1.5 w-11 rounded-full bg-line" />
        </View>
        {title ? (
          <Row className="justify-between px-5 pb-2">
            <Title>{title}</Title>
            <IconButton icon="close" onPress={onClose} background="bg-line/50" size={34} color="#6A7086" />
          </Row>
        ) : null}
        <ScrollView className="px-5" contentContainerClassName="pb-6">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export { Ionicons };
