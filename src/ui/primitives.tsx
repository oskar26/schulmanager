/** Basis-Bausteine der Schulflow-Oberfläche (NativeWind + gluestack). */
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

import { foregroundOn, radius, resolveThemeColor, shadow } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';
import { tint } from '@/design/subjects';
import { useLayout } from '@/lib/breakpoints';
import { PressableScale } from '@/ui/motion';

/* ------------------------------------------------------------------ Text */

type TxtProps = React.ComponentProps<typeof Text> & { className?: string };

export const Txt = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[15px] font-medium text-ink ${className}`} />
);

export const Muted = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[13px] font-medium text-muted ${className}`} />
);

export const Display = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[32px] font-extrabold tracking-[-0.5px] text-ink ${className}`} />
);

export const Title = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[25px] font-extrabold tracking-[-0.5px] text-ink ${className}`} />
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
      className={`rounded-[24px] border border-line/70 bg-surface ${padded ? 'p-[18px]' : ''} ${className}`}
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
  icon,
  iconColor,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  /** Lucide-Icon in getönter Kachel (die App-Oberfläche bleibt emoji-frei). */
  icon?: LucideIcon;
  iconColor?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const resolvedIconColor = resolveThemeColor(iconColor ?? colors.accent.violet, isDark);
  const IconComponent = icon;
  return (
    <Row className="mb-3 mt-6 justify-between px-1">
      <Row className="flex-1 gap-2">
        {IconComponent ? (
          <View
            className="h-8 w-8 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: tint(resolvedIconColor, 0.14) }}
          >
            <IconComponent size={16} strokeWidth={2.2} color={resolvedIconColor} />
          </View>
        ) : null}
        <Text className="flex-shrink text-[18px] font-bold tracking-tight text-ink">{title}</Text>
      </Row>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-[13px] font-bold text-accent-amber-deep">{action}</Text>
        </Pressable>
      ) : null}
    </Row>
  );
}

/* ------------------------------------------------------------------ Chips */

type ChipVariant = 'charcoal' | 'amber' | 'lime' | 'violet' | 'coral';

function variantColor(variant: ChipVariant, colors: ReturnType<typeof useThemeColors>['colors']): string {
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

/**
 * Kontraststarker Status-Chip. `variant` deckt die verbindlichen Charcoal-,
 * Amber- und Lime-Chips ab; `color` bleibt für Fachfarben und Semantik offen.
 */
export function Chip({
  label,
  color,
  variant = 'amber',
  tone = 'tint',
  className = '',
}: {
  label: string;
  color?: string;
  variant?: ChipVariant;
  tone?: 'tint' | 'solid' | 'outline';
  className?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const base = resolveThemeColor(color ?? variantColor(variant, colors), isDark);
  const style: ViewStyle =
    tone === 'solid'
      ? { backgroundColor: base }
      : tone === 'outline'
        ? { borderWidth: 1, borderColor: base, backgroundColor: 'transparent' }
        : { backgroundColor: tint(base, 0.14) };

  return (
    <View style={style} className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${className}`}>
      <Text
        className="flex-shrink text-[11px] font-extrabold"
        style={{ color: tone === 'solid' ? foregroundOn(base, colors) : base }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
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
  icon,
  iconColor,
  title,
  hint,
}: {
  /** Lucide-Icon in einer getönten Kachel (die App-Oberfläche bleibt emoji-frei). */
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  hint?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const resolvedIconColor = resolveThemeColor(iconColor ?? colors.accent.violet, isDark);
  const IconComponent = icon;
  return (
    <View className="items-center justify-center gap-2 px-8 py-12">
      {IconComponent ? (
        <View
          className="h-14 w-14 items-center justify-center rounded-[20px]"
          style={{ backgroundColor: tint(resolvedIconColor, 0.14) }}
        >
          <IconComponent size={26} strokeWidth={2} color={resolvedIconColor} />
        </View>
      ) : null}
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
            className={`flex-1 flex-row items-center justify-center gap-1 rounded-xl px-1 py-2 ${
              active ? 'bg-surface' : ''
            }`}
            style={active ? shadow.card : undefined}
          >
            {/* Phase 1 · M5: Label darf schrumpfen statt abzuschneiden („Hausaufga…“). */}
            <Text
              className={`text-[12.5px] font-semibold ${active ? 'text-ink' : 'text-muted'}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
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
  /** Lucide-Icon-Komponente in getönter Kachel (Emoji-frei). */
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
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: tint(resolvedIconColor, 0.14) }}
        >
          <IconComponent size={18} strokeWidth={2.1} color={resolvedIconColor} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className={`text-[15px] font-semibold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[12px] text-muted">{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={17} strokeWidth={2.2} color={colors.faint} /> : null)}
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

/* ------------------------------------------------------------------ Bento (Phase 2) */

/**
 * Kompatibler Name für bestehende Bento-Aufrufe: Light-Töne werden im Dark
 * Theme automatisch in ihre definierte neue Ableitung überführt.
 */
export function resolveTone(tone?: string, isDark = false): string | undefined {
  return tone ? resolveThemeColor(tone, isDark) : undefined;
}

/**
 * Status-Pill — farbige, runde Markierung für Metadaten wie „Fällig morgen“,
 * „Raum“ oder „Vertretung“. Charcoal, Amber und Lime stehen als Varianten
 * bereit; Fach- und Semantikfarben können weiterhin explizit übergeben werden.
 */
export function Pill({
  label,
  color,
  variant = 'amber',
  tone = 'tint',
  className = '',
}: {
  label: string;
  color?: string;
  variant?: ChipVariant;
  tone?: 'tint' | 'solid' | 'outline';
  className?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const base = resolveThemeColor(color ?? variantColor(variant, colors), isDark);
  const style: ViewStyle =
    tone === 'solid'
      ? { backgroundColor: base }
      : tone === 'outline'
        ? { borderWidth: 1, borderColor: base, backgroundColor: 'transparent' }
        : { backgroundColor: tint(base, 0.14) };

  return (
    <View style={style} className={`flex-row items-center rounded-full px-3 py-1.5 ${className}`}>
      <Text
        className="flex-shrink text-[11px] font-extrabold"
        style={{ color: tone === 'solid' ? foregroundOn(base, colors) : base }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

/** Runde Action-Ecke: 44×44, klarer Charcoal-Kontrast statt pastelliger Blase. */
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
      <IconComponent size={Math.round(size * 0.42)} strokeWidth={2.2} color={resolvedColor} />
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

/** Überlappende Avatare mit Oberflächen-Ring (marginRight: -8) — für Gruppen/Kurse. */
export function AvatarStack({
  items,
  size = 30,
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
 * Bento-Kachel: große, klare Formkarte (24–28 px), optionaler Farbblock und
 * dezenter Schatten. Ohne `tone` ist sie immer eine Reinweiß-/Surface-Karte.
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
  const { colors, isDark } = useThemeColors();
  const resolvedTone = resolveTone(tone, isDark);

  const boxStyle: ViewStyle = {
    borderRadius: cardRadius,
    overflow: 'hidden',
    ...shadow.card,
    borderWidth: resolvedTone ? 0 : 1,
    borderColor: colors.line,
    ...(resolvedTone ? { backgroundColor: resolvedTone } : {}),
  };
  const inner = (
    <View
      {...rest}
      style={[boxStyle, style]}
      className={`bg-surface ${padded ? 'p-5' : ''} ${className}`}
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
      style={{ borderRadius: cardRadius }}
    >
      {inner}
    </PressableScale>
  );
}

/** Einfacher Raster-Wrapper mit einheitlichem Abstand (flex-row + wrap). */
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
