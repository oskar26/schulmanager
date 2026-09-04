/**
 * Schulflow UI-Primitives (Design-System Fundament).
 *
 * Vollflächige Farbflächen (ColorBlockCard), kreisförmige Icon-Badges (IconBadge),
 * riesige Stat-Karten (StatCard), Status-Pills (Pill), griffige Segmented Controls
 * und adaptive Shell-Container.
 */
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpRight, ChevronRight, type LucideIcon } from 'lucide-react-native';

import {
  foregroundOn,
  palette,
  radius,
  resolveThemeColor,
  shadow,
  type ThemePalette,
} from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { tint } from '@/design/subjects';
import { useLayout } from '@/lib/breakpoints';
import { PressableOpacity, PressableScale } from '@/ui/motion';

/**
 * Touch-Targets: Kleine visuelle Flächen bekommen automatisch genug
 * `hitSlop`, damit die effektive Trefferfläche ≥ 44 px bleibt (HIG/Material).
 */
export const touchSlopFor = (size: number) => (size >= 44 ? 0 : Math.ceil((44 - size) / 2));

/* ------------------------------------------------------------------ Typography */

type TxtProps = React.ComponentProps<typeof Text> & { className?: string };

export const Txt = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[15px] font-medium text-ink ${className}`} />
);

export const Muted = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[13px] font-medium text-muted ${className}`} />
);

export const Display = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[34px] font-extrabold tracking-[-0.6px] text-ink ${className}`} />
);

export const Title = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[26px] font-extrabold tracking-[-0.5px] text-ink ${className}`} />
);

export const Headline = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[19px] font-bold tracking-tight text-ink ${className}`} />
);

export const Label = ({ className = '', ...props }: TxtProps) => (
  <Text
    {...props}
    className={`text-[11px] font-extrabold uppercase tracking-[1.2px] text-faint ${className}`}
  />
);

/* ------------------------------------------------------------------ IconBadge */

export interface IconBadgeProps {
  icon: LucideIcon;
  color?: string;
  iconColor?: string;
  size?: number;
  iconSize?: number;
  tone?: 'solid' | 'tint';
  className?: string;
  style?: ViewStyle;
}

/**
 * Icon-Badge: Farbiger Kreis mit zentriertem Vektor-Icon (Kernkomponente des Redesigns).
 */
export function IconBadge({
  icon: IconComponent,
  color,
  iconColor,
  size = 44,
  iconSize,
  tone = 'tint',
  className = '',
  style,
}: IconBadgeProps) {
  const { colors, isDark } = useThemeColors();
  const baseColor = resolveThemeColor(color ?? colors.accent.violet, isDark);
  const calculatedIconSize = iconSize ?? Math.round(size * 0.48);

  const bg =
    tone === 'solid'
      ? baseColor
      : tint(baseColor, isDark ? 0.28 : 0.16);

  const effectiveIconColor =
    iconColor ??
    (tone === 'solid'
      ? foregroundOn(baseColor, colors)
      : baseColor);

  return (
    <View
      className={`items-center justify-center ${className}`}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <IconComponent size={calculatedIconSize} strokeWidth={2.3} color={effectiveIconColor} />
    </View>
  );
}

/* ------------------------------------------------------------------ ColorBlockCard */

export interface ColorBlockCardProps extends ViewProps {
  children: React.ReactNode;
  color?: string;
  tone?: 'solid' | 'tint' | 'surface';
  onPress?: () => void;
  radius?: number;
  padded?: boolean;
  floating?: boolean;
  className?: string;
}

/**
 * ColorBlockCard: Vollflächige Farbkarte (Radius 28px) ohne dünne Umrandungen,
 * mit weichem Schatten und automatischer Kontrastanpassung.
 */
export function ColorBlockCard({
  children,
  color,
  tone = 'tint',
  onPress,
  radius: cardRadius = radius.cardLg,
  padded = true,
  floating = false,
  className = '',
  style,
  ...rest
}: ColorBlockCardProps) {
  const { colors, isDark } = useThemeColors();

  const baseColor = color ? resolveThemeColor(color, isDark) : undefined;
  let bg = colors.surface;
  let hasBorder = false;

  if (tone === 'solid' && baseColor) {
    bg = baseColor;
  } else if (tone === 'tint' && baseColor) {
    bg = tint(baseColor, isDark ? 0.22 : 0.14);
  } else if (tone === 'surface') {
    bg = colors.surface;
    hasBorder = false;
  }

  const boxStyle: ViewStyle = {
    borderRadius: cardRadius,
    overflow: 'hidden',
    backgroundColor: bg,
    ...(hasBorder ? { borderWidth: 1, borderColor: colors.line } : {}),
    ...(floating ? shadow.float : shadow.card),
  };

  const inner = (
    <View
      {...rest}
      style={[boxStyle, style]}
      className={`${padded ? 'p-5' : ''} ${className}`}
    >
      {children}
    </View>
  );

  if (!onPress) return inner;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      scale={0.97}
      hoverScale={1.008}
      style={{ borderRadius: cardRadius }}
    >
      {inner}
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ StatCard */

export interface StatCardProps extends ViewProps {
  value: string | number;
  label: string;
  subLabel?: string;
  icon?: LucideIcon;
  color?: string;
  tone?: 'solid' | 'tint' | 'surface';
  onPress?: () => void;
  className?: string;
}

/**
 * StatCard: Große fette Zahl (32–44px) + prägnante Caption + optionales Icon-Badge.
 */
export function StatCard({
  value,
  label,
  subLabel,
  icon: IconComponent,
  color,
  tone = 'tint',
  onPress,
  className = '',
  style,
  ...rest
}: StatCardProps) {
  const { colors, isDark } = useThemeColors();
  const baseColor = resolveThemeColor(color ?? colors.accent.amber, isDark);
  const textColor = tone === 'solid' ? foregroundOn(baseColor, colors) : colors.ink;
  const captionColor = tone === 'solid' ? foregroundOn(baseColor, colors) : colors.muted;

  return (
    <ColorBlockCard
      color={baseColor}
      tone={tone}
      onPress={onPress}
      className={`flex-1 ${className}`}
      style={style}
      {...rest}
    >
      <View className="flex-row items-center justify-between">
        <Text
          style={{ color: captionColor }}
          className="text-[12px] font-extrabold uppercase tracking-wider"
          numberOfLines={1}
        >
          {label}
        </Text>
        {IconComponent ? (
          <IconBadge
            icon={IconComponent}
            color={baseColor}
            tone={tone === 'solid' ? 'solid' : 'tint'}
            size={32}
            iconSize={16}
          />
        ) : null}
      </View>
      <Text
        style={{ color: textColor }}
        className="mt-2 text-[32px] font-extrabold tracking-tight"
        numberOfLines={1}
      >
        {value}
      </Text>
      {subLabel ? (
        <Text
          style={{ color: captionColor }}
          className="mt-0.5 text-[12px] font-medium opacity-90"
          numberOfLines={1}
        >
          {subLabel}
        </Text>
      ) : null}
    </ColorBlockCard>
  );
}

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
  adaptive?: 'content' | 'dashboard' | 'narrow';
}) {
  const layout = useLayout();
  const wide = layout.navigation !== 'bottom';

  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-canvas ${className}`}>
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
  color,
  tone = 'surface',
  style,
  ...rest
}: ViewProps & {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  floating?: boolean;
  color?: string;
  tone?: 'solid' | 'tint' | 'surface';
}) {
  const { colors, isDark } = useThemeColors();
  const baseColor = color ? resolveThemeColor(color, isDark) : undefined;

  let bg = colors.surface;
  if (tone === 'solid' && baseColor) bg = baseColor;
  else if (tone === 'tint' && baseColor) bg = tint(baseColor, isDark ? 0.22 : 0.14);

  return (
    <View
      {...rest}
      style={[
        floating ? shadow.float : shadow.card,
        { borderRadius: radius.cardLg, backgroundColor: bg },
        style,
      ]}
      className={`${padded ? 'p-[18px]' : ''} ${className}`}
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
  return <View className={`h-[1px] w-full bg-line/80 ${className}`} />;
}

export function SectionHeader({
  title,
  action,
  onAction,
  icon,
  iconColor,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  iconColor?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const resolvedIconColor = resolveThemeColor(iconColor ?? colors.accent.violet, isDark);
  const IconComponent = icon;
  return (
    <Row className="mb-3 mt-6 justify-between px-1">
      <Row className="flex-1 gap-2.5">
        {IconComponent ? (
          <IconBadge icon={IconComponent} color={resolvedIconColor} size={32} iconSize={16} />
        ) : null}
        <Text className="flex-shrink text-[19px] font-extrabold tracking-tight text-ink">{title}</Text>
      </Row>
      {action ? (
        <PressableOpacity onPress={onAction} hitSlop={14} accessibilityRole="button">
          <Text className="text-[13px] font-bold text-accent-amber-deep">{action}</Text>
        </PressableOpacity>
      ) : null}
    </Row>
  );
}

/* ------------------------------------------------------------------ Chips & Pills */

type ChipVariant = 'charcoal' | 'amber' | 'lime' | 'violet' | 'coral';

function variantColor(variant: ChipVariant, colors: ThemePalette): string {
  switch (variant) {
    case 'charcoal':
      return colors.charcoal;
    case 'lime':
      return colors.accent.lime;
    case 'violet':
      return colors.accent.violet;
    case 'coral':
      return colors.accent.coral;
    case 'amber':
    default:
      return colors.accent.amber;
  }
}

export function Chip({
  label,
  color,
  variant = 'amber',
  tone = 'tint',
  icon: IconComponent,
  className = '',
}: {
  label: string;
  color?: string;
  variant?: ChipVariant;
  tone?: 'tint' | 'solid' | 'outline';
  icon?: LucideIcon;
  className?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const base = resolveThemeColor(color ?? variantColor(variant, colors), isDark);
  const style: ViewStyle =
    tone === 'solid'
      ? { backgroundColor: base }
      : tone === 'outline'
        ? { borderWidth: 1.5, borderColor: base, backgroundColor: 'transparent' }
        : { backgroundColor: tint(base, isDark ? 0.25 : 0.16) };

  const textColor = tone === 'solid' ? foregroundOn(base, colors) : base;

  return (
    <View style={style} className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${className}`}>
      {IconComponent ? (
        <IconComponent size={12} strokeWidth={2.4} color={textColor} />
      ) : null}
      <Text
        className="flex-shrink text-[11px] font-extrabold tracking-wide"
        style={{ color: textColor }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function Pill({
  label,
  color,
  variant = 'amber',
  tone = 'tint',
  icon: IconComponent,
  className = '',
}: {
  label: string;
  color?: string;
  variant?: ChipVariant;
  tone?: 'tint' | 'solid' | 'outline';
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Chip
      label={label}
      color={color}
      variant={variant}
      tone={tone}
      icon={IconComponent}
      className={`px-3 py-1.5 ${className}`}
    />
  );
}

export function Badge({ count, className = '' }: { count: number; className?: string }) {
  const { colors } = useThemeColors();
  if (count <= 0) return null;
  return (
    <View
      className={`min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 ${className}`}
      style={{ backgroundColor: colors.accent.coral }}
    >
      <Text className="text-[11px] font-extrabold" style={{ color: colors.on.coral }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ States */

export function Skeleton({ className = '' }: { className?: string }) {
  return <View className={`overflow-hidden rounded-2xl bg-line/70 ${className}`} />;
}

export function EmptyState({
  icon: IconComponent,
  iconColor,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const resolvedIconColor = resolveThemeColor(iconColor ?? colors.accent.violet, isDark);
  return (
    <View className="items-center justify-center gap-3 px-8 py-12">
      {IconComponent ? (
        <IconBadge
          icon={IconComponent}
          color={resolvedIconColor}
          size={56}
          iconSize={26}
          tone="tint"
        />
      ) : null}
      <Text className="text-center text-[17px] font-extrabold text-ink">{title}</Text>
      {hint ? (
        <Text className="text-center text-[13px] leading-5 text-muted">{hint}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PressableScale
          onPress={onAction}
          className="mt-2 rounded-full bg-charcoal px-5 py-2.5 active:opacity-90"
        >
          <Text className="text-[13px] font-bold text-white">{actionLabel}</Text>
        </PressableScale>
      ) : null}
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
  const { colors } = useThemeColors();
  return (
    <View className="flex-row rounded-2xl bg-line/60 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-2 py-1 active:opacity-80 ${
              active ? 'bg-surface hover:bg-surface' : 'hover:bg-line'
            }`}
            style={active ? shadow.card : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              className={`text-[13px] font-bold ${active ? 'text-ink' : 'text-muted'}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {option.label}
            </Text>
            {option.badge ? <Badge count={option.badge} className="min-w-[18px]" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ListRow({
  icon: IconComponent,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
  danger,
}: {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors, isDark } = useThemeColors();
  const resolvedIconColor = resolveThemeColor(iconColor ?? colors.accent.violet, isDark);
  const content = (
    <Row className="gap-3 px-4 py-3.5">
      {IconComponent ? (
        <IconBadge icon={IconComponent} color={resolvedIconColor} size={38} iconSize={18} />
      ) : null}
      <View className="flex-1">
        <Text className={`text-[15px] font-bold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[12px] font-medium text-muted">{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={17} strokeWidth={2.4} color={colors.faint} /> : null)}
    </Row>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      className="hover:bg-line/40 active:bg-line/60"
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  background = 'bg-surface',
  size = 40,
}: {
  icon: keyof typeof Ionicons.glyphMap | LucideIcon;
  onPress?: () => void;
  color?: string;
  background?: string;
  size?: number;
}) {
  const { colors, isDark } = useThemeColors();
  const resolvedColor = resolveThemeColor(color ?? colors.charcoal, isDark);
  const isLucide = typeof icon === 'function' || typeof icon === 'object';
  const LucideComp = isLucide ? (icon as LucideIcon) : null;
  const ionName = !isLucide ? (icon as keyof typeof Ionicons.glyphMap) : null;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={touchSlopFor(size)}
      style={{ width: size, height: size }}
      scale={0.92}
      className={`items-center justify-center rounded-2xl ${background}`}
    >
      {LucideComp ? (
        <LucideComp size={Math.round(size * 0.52)} strokeWidth={2.2} color={resolvedColor} />
      ) : ionName ? (
        <Ionicons name={ionName} size={Math.round(size * 0.48)} color={resolvedColor} />
      ) : null}
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ Sheet & Modal */

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
                <IconButton icon="close" onPress={onClose} background="bg-line/50" size={34} />
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
            <IconButton icon="close" onPress={onClose} background="bg-line/50" size={34} />
          </Row>
        ) : null}
        <ScrollView className="px-5" contentContainerClassName="pb-6">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Action Buttons & Avatars */

export function resolveTone(tone?: string, isDark = false): string | undefined {
  return tone ? resolveThemeColor(tone, isDark) : undefined;
}

export function RoundActionButton({
  onPress,
  icon: IconComponent = ArrowUpRight,
  color,
  background,
  size = 44,
  accessibilityLabel,
}: {
  onPress?: () => void;
  icon?: LucideIcon;
  color?: string;
  background?: string;
  size?: number;
  accessibilityLabel?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const resolvedColor = resolveThemeColor(color ?? colors.charcoal, isDark);
  const resolvedBackground = resolveThemeColor(background ?? colors.surface, isDark);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      scale={0.93}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: resolvedBackground,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.charcoal,
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 4,
      }}
    >
      <IconComponent size={Math.round(size * 0.42)} strokeWidth={2.4} color={resolvedColor} />
    </PressableScale>
  );
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function AvatarStack({
  items,
  size = 32,
  ring,
}: {
  items: { name: string; color: string }[];
  size?: number;
  ring?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const resolvedRing = resolveThemeColor(ring ?? colors.surface, isDark);
  return (
    <View className="flex-row">
      {items.map((item, index) => (
        <View
          key={`${item.name}-${index}`}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: resolveThemeColor(item.color, isDark),
            borderWidth: 2,
            borderColor: resolvedRing,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: index < items.length - 1 ? -8 : 0,
            zIndex: items.length - index,
          }}
        >
          <Text
            style={{
              fontSize: Math.max(9, Math.round(size * 0.4)),
              fontWeight: '800',
              color: foregroundOn(resolveThemeColor(item.color, isDark), colors),
            }}
          >
            {initialsOf(item.name)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Bento-Kachel: Kompatibler Wrapper um ColorBlockCard.
 */
export function BentoCard({
  children,
  className = '',
  tone,
  onPress,
  radius: cardRadius = radius.cardLg,
  padded = true,
  style,
  ...rest
}: ViewProps & {
  children: React.ReactNode;
  className?: string;
  tone?: string;
  onPress?: () => void;
  radius?: number;
  padded?: boolean;
}) {
  return (
    <ColorBlockCard
      color={tone}
      tone={tone ? 'solid' : 'surface'}
      onPress={onPress}
      radius={cardRadius}
      padded={padded}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </ColorBlockCard>
  );
}

export function BentoGrid({
  children,
  gap = 14,
  className = '',
  style,
  ...rest
}: ViewProps & { children: React.ReactNode; gap?: number; className?: string }) {
  return (
    <View
      {...rest}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}
      className={className}
    >
      {children}
    </View>
  );
}

export { Ionicons };
