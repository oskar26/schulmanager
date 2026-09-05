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
import { FadeInUp, PressableOpacity, PressableScale } from '@/ui/motion';
import { Illustration, type IllustrationName } from '@/ui/illustrations';

/**
 * Phase 4 · Touch-Targets: Kleine visuelle Flächen bekommen automatisch genug
 * `hitSlop`, damit die effektive Trefferfläche ≥ 44 px bleibt (HIG/Material).
 */
const touchSlopFor = (size: number) => (size >= 44 ? 0 : Math.ceil((44 - size) / 2));

/* ------------------------------------------------------------------ Text */
/*
 * Typo-Skala (Redesign Phase 1 · `typeScale` in design/tokens.ts):
 * Display 38/800 · Title 28/800 · Headline 18/700 · Body 15/500 ·
 * Caption 12/600 · Label 10.5/800 uppercase · Stat-Zahlen 44/56 px.
 */

type TxtProps = React.ComponentProps<typeof Text> & { className?: string };

export const Txt = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[15px] font-medium text-ink ${className}`} />
);

export const Muted = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[13px] font-medium text-muted ${className}`} />
);

export const Display = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[38px] font-extrabold leading-[43px] tracking-[-1px] text-ink ${className}`} />
);

export const Title = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[28px] font-extrabold leading-[33px] tracking-[-0.6px] text-ink ${className}`} />
);

export const Headline = ({ className = '', ...props }: TxtProps) => (
  <Text {...props} className={`text-[18px] font-bold leading-[24px] tracking-[-0.2px] text-ink ${className}`} />
);

export const Label = ({ className = '', ...props }: TxtProps) => (
  <Text
    {...props}
    className={`text-[10.5px] font-extrabold uppercase tracking-[1.4px] text-faint ${className}`}
  />
);

/**
 * Riesige Stat-Zahl („Statistiken als riesige Zahl + kleine Caption“).
 * `size="lg"` für Hero-Zahlen (Gesamtschnitt, Countdown), Standard für Kacheln.
 */
export const StatNumber = ({
  size = 'md',
  className = '',
  ...props
}: TxtProps & { size?: 'md' | 'lg' }) => (
  <Text
    {...props}
    className={
      size === 'lg'
        ? `text-[56px] font-extrabold leading-[58px] tracking-[-1.5px] ${className}`
        : `text-[44px] font-extrabold leading-[47px] tracking-[-1.2px] ${className}`
    }
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

/**
 * Einheitlicher Kopf aller Haupt-Tabs (Redesign Phase 2): großer 28/800-Titel
 * links, eine optionale Aktion rechts und derselbe vertikale Rhythmus auf
 * Phone, Rail und Sidebar. Inhalte wie Segment-Controls bleiben bewusst
 * außerhalb der Kopfzeile, damit die Titelbasis auf jedem Screen identisch ist.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
  className = '',
  style,
  ...rest
}: ViewProps & {
  title: string;
  subtitle?: string;
  /** Icon-, Pill- oder Switch-Aktion am rechten Rand. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      {...rest}
      className={className}
      style={[
        {
          // Die adaptive Inhaltsbreite sitzt außen; innerhalb davon beginnen
          // Header und Scroll-Content immer auf derselben 16-dp-Kante.
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
        },
        style,
      ]}
    >
      {/*
       * Phase 10 · Struktur-Härtung: Die Kopfzeile trägt ihre Achsen bewusst
       * **inline** *und* als Klasse. Der Header ist die einzige Stelle, an der
       * eine verlorene Klasse nicht „nur“ falsch aussieht, sondern Elemente
       * physisch überlappt (gemeldetes Symptom auf dem Start-Screen: Such- und
       * Einstellungs-Icon über dem Begrüßungstext). Typografie bleibt dagegen
       * ausschließlich klassenbasiert — 45 Screens überschreiben die Größen der
       * Text-Bausteine per className, und inline würde jede diese Entscheidungen
       * still aushebeln.
       */}
      <Row
        className="min-h-[48px] justify-between gap-4"
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 48 }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Title numberOfLines={1}>{title}</Title>
          {subtitle ? <Muted className="mt-0.5" numberOfLines={1}>{subtitle}</Muted> : null}
        </View>
        {action ? <View style={{ flexShrink: 0 }}>{action}</View> : null}
      </Row>
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
      className={`rounded-[28px] bg-surface ${padded ? 'p-[18px]' : ''} ${className}`}
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

/* ------------------------------------------------- IconBadge (Phase 1) */

const ICON_BADGE_SIZES = { sm: 28, md: 36, lg: 44, xl: 56 } as const;
const ICON_BADGE_ICONS = { sm: 14, md: 18, lg: 22, xl: 27 } as const;
export type IconBadgeSize = keyof typeof ICON_BADGE_SIZES;

/**
 * IconBadge — DIE einheitliche Icon-Kachel des Farbflächen-Stils: vollrunder
 * Kreis in Vollfarbe mit zentriertem, kontrastsicherem Icon (`solid`) oder in
 * 14-%-Tönung mit farbigem Icon (`tint`, für ruhige Kontexte).
 * Ersetzt alle handgebauten Icon-Kacheln (Header, Listen, Widgets, Empty
 * States).
 */
export function IconBadge({
  icon: IconComponent,
  color,
  size = 'md',
  tone = 'solid',
  strokeWidth = 2.2,
  className = '',
  style,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  /** Kreisfarbe (Light- oder Dark-Hex); Default Violet. */
  color?: string;
  size?: IconBadgeSize;
  tone?: 'solid' | 'tint';
  strokeWidth?: number;
  className?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const base = resolveThemeColor(color ?? colors.accent.violet, isDark);
  const box = ICON_BADGE_SIZES[size];
  const iconSize = ICON_BADGE_ICONS[size];
  return (
    <View
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      className={`items-center justify-center ${className}`}
      style={[
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor: tone === 'tint' ? tint(base, 0.14) : base,
        },
        style,
      ]}
    >
      <IconComponent
        size={iconSize}
        strokeWidth={strokeWidth}
        color={tone === 'tint' ? base : foregroundOn(base, colors)}
      />
    </View>
  );
}

/* ------------------------------------------- ColorBlockCard (Phase 1) */

/** Context der aufgelösten Farbfläche — Kinder bekommen die passende Textfarbe. */
const ColorBlockContext = React.createContext<{ fg: string } | null>(null);

/**
 * Vordergrundfarbe innerhalb einer `ColorBlockCard`: kontrastsicher zur
 * Flächenfarbe (inkl. Dark-Mode-Auflösung). Außerhalb eines Blocks: Ink.
 */
export function useBlockInk(): string {
  const { colors } = useThemeColors();
  const context = React.useContext(ColorBlockContext);
  return context?.fg ?? colors.ink;
}

/** Text auf einer Farbfläche — erbt automatisch die kontrastsichere Farbe. */
export const BlockText = ({ className = '', ...props }: TxtProps) => {
  const fg = useBlockInk();
  return <Text {...props} style={[{ color: fg }, props.style]} className={`text-[15px] font-semibold ${className}`} />;
};

/** Sekundärtext auf einer Farbfläche — gleiche Farbe, reduzierte Deckkraft. */
export const BlockCaption = ({ className = '', ...props }: TxtProps) => {
  const fg = useBlockInk();
  return (
    <Text
      {...props}
      style={[{ color: fg, opacity: 0.72 }, props.style]}
      className={`text-[13px] font-medium ${className}`}
    />
  );
};

/**
 * ColorBlockCard — die Farbflächen-Karte des Redesigns: vollflächig eingefärbt
 * (Fach-, Kategorie- oder Prioritätsfarbe), Radius 28, weicher Schatten,
 * **kein Rand**. Optional pressbar (Press-Scale). Kinder nutzen `BlockText`/
 * `BlockCaption` oder `useBlockInk()` für Textfarben.
 */
export function ColorBlockCard({
  children,
  color,
  onPress,
  accessibilityLabel,
  accessibilityRole,
  padded = true,
  radius: cardRadius = radius.card,
  elevated = false,
  dim = false,
  className = '',
  style,
  ...rest
}: ViewProps & {
  /** Flächenfarbe (Light- oder Dark-Hex; wird theme-aufgelöst). */
  color: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
  padded?: boolean;
  radius?: number;
  /** Starkere Schattenfläche für Hero-Blöcke. */
  elevated?: boolean;
  /** Reduzierte Deckkraft (z. B. erledigte Aufgaben). */
  dim?: boolean;
  className?: string;
}) {
  const { colors, isDark } = useThemeColors();
  const base = resolveThemeColor(color, isDark);
  const fg = foregroundOn(base, colors);
  const boxStyle: ViewStyle = {
    borderRadius: cardRadius,
    overflow: 'hidden',
    backgroundColor: base,
    opacity: dim ? 0.55 : 1,
    ...(elevated ? shadow.float : shadow.card),
  };

  const inner = (
    <ColorBlockContext.Provider value={{ fg }}>
      <View
        {...rest}
        style={[boxStyle, style]}
        className={`${padded ? 'p-5' : ''} ${className}`}
      >
        {children}
      </View>
    </ColorBlockContext.Provider>
  );

  if (!onPress) return inner;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      scale={0.97}
      hoverScale={1.008}
      style={{ borderRadius: cardRadius }}
    >
      {inner}
    </PressableScale>
  );
}

/* ------------------------------------------------- StatCard (Phase 1) */

/**
 * StatCard — „Statistiken als riesige Zahl + kleine Caption, statt
 * Fließtext“. Plain auf Surface oder als vollflächiger Farbblock (`block`).
 */
export function StatCard({
  value,
  caption,
  color,
  block,
  icon,
  align = 'left',
  size = 'md',
  className = '',
  style,
}: {
  value: string | number;
  caption: string;
  /** Zahl-/Caption-Farbe (nur ohne `block`). */
  color?: string;
  /** Vollflächen-Farbe — Karte wird zum Farbblock. */
  block?: string;
  icon?: LucideIcon;
  align?: 'left' | 'center';
  size?: 'md' | 'lg';
  className?: string;
  style?: ViewStyle;
}) {
  const { colors, isDark } = useThemeColors();
  const blockFg = block ? foregroundOn(resolveThemeColor(block, isDark), colors) : undefined;

  const body = (
    <>
      {icon ? (
        <IconBadge
          icon={icon}
          color={block ?? color}
          tone={block ? 'solid' : 'tint'}
          size="sm"
          className={align === 'center' ? '' : 'mb-2'}
          style={{
            // Auf Vollton-Blöcken: transparent-abgedunkelter/aufgehellter Kreis
            // statt Vollfarbe, damit Zahl & Badge sich nicht beißen.
            backgroundColor: block ? (blockFg === '#FFFFFF' ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.55)') : undefined,
          }}
        />
      ) : null}
      <StatNumber
        size={size}
        className={align === 'center' ? 'text-center' : ''}
        style={{ color: blockFg ?? resolveThemeColor(color ?? colors.ink, isDark) }}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {value}
      </StatNumber>
      <Text
        className={`mt-0.5 text-[10.5px] font-extrabold uppercase tracking-[1.2px] ${align === 'center' ? 'text-center' : ''}`}
        style={{ color: blockFg ?? resolveThemeColor(color ?? colors.muted, isDark), opacity: block ? 0.72 : 1 }}
        numberOfLines={2}
      >
        {caption}
      </Text>
    </>
  );

  if (block) {
    return (
      <ColorBlockCard color={block} padded style={[{ paddingTop: 16, paddingBottom: 14, paddingHorizontal: 16 }, style]} className={className}>
        {body}
      </ColorBlockCard>
    );
  }

  return (
    <Card padded style={[{ paddingTop: 16, paddingBottom: 14, paddingHorizontal: 16 }, style]} className={className}>
      {body}
    </Card>
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
  /** Lucide-Icon im einheitlichen IconBadge (die App-Oberfläche bleibt emoji-frei). */
  icon?: LucideIcon;
  iconColor?: string;
}) {
  const IconComponent = icon;
  return (
    <Row className="mb-3 mt-6 justify-between px-1">
      <Row className="flex-1 gap-2.5">
        {IconComponent ? <IconBadge icon={IconComponent} color={iconColor} size="sm" /> : null}
        <Text className="flex-shrink text-[19px] font-extrabold tracking-[-0.3px] text-ink">{title}</Text>
      </Row>
      {action ? (
        <PressableOpacity onPress={onAction} hitSlop={14} accessibilityRole="button">
          <Text className="text-[13px] font-extrabold text-accent-amber-deep">{action}</Text>
        </PressableOpacity>
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

/** Gemeinsame Pill-/Chip-Optik des Farbflächen-Stils: Radius 20, fett, Icon-fähig. */
function PillBase({
  label,
  color,
  tone = 'tint',
  icon: IconComponent,
  iconSize = 13,
  textClassName = '',
  className = '',
  style,
}: {
  label: string;
  color: string;
  tone: 'tint' | 'solid' | 'outline';
  icon?: LucideIcon;
  iconSize?: number;
  textClassName: string;
  className: string;
  /** Optionaler Zusatz-Style (z. B. Ring, wenn Pill und Fläche dieselbe Farbe haben). */
  style?: ViewStyle;
}) {
  const { colors, isDark } = useThemeColors();
  const base = resolveThemeColor(color, isDark);
  const fg = tone === 'solid' ? foregroundOn(base, colors) : base;
  const boxStyle: ViewStyle =
    tone === 'solid'
      ? { backgroundColor: base }
      : tone === 'outline'
        ? { borderWidth: 1.5, borderColor: base, backgroundColor: 'transparent' }
        : { backgroundColor: tint(base, 0.15) };

  return (
    <View
      style={[boxStyle, style]}
      className={`flex-row items-center gap-1 rounded-[20px] self-start px-3 py-1.5 ${className}`}
    >
      {IconComponent ? <IconComponent size={iconSize} strokeWidth={2.6} color={fg} /> : null}
      <Text className={`flex-shrink font-extrabold ${textClassName}`} style={{ color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
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
  icon,
  className = '',
  style,
}: {
  label: string;
  color?: string;
  variant?: ChipVariant;
  tone?: 'tint' | 'solid' | 'outline';
  icon?: LucideIcon;
  className?: string;
  style?: ViewStyle;
}) {
  const { colors } = useThemeColors();
  return (
    <PillBase
      label={label}
      color={color ?? variantColor(variant, colors)}
      tone={tone}
      icon={icon}
      iconSize={12}
      textClassName="text-[11.5px]"
      className={`px-2.5 py-1 ${className}`}
      style={style}
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
  // Skeletons folgen dem Kartenradius des Farbflächen-Stils (Kernprinzip 3).
  return <View className={`overflow-hidden rounded-[24px] bg-line/70 ${className}`} />;
}

export function EmptyState({
  icon,
  iconColor,
  illustration,
  title,
  hint,
}: {
  /** Lucide-Icon im runden IconBadge — nur noch Fallback, wenn keine
   *  Illustration passt (die App-Oberfläche bleibt emoji-frei). */
  icon?: LucideIcon;
  iconColor?: string;
  /**
   * Leerzustand-Illustration (Phase 9): entweder der Name einer der
   * Standard-Illustrationen (`'free-day'`, `'all-done'`, …) oder ein eigener
   * SVG-Node. Ohne Angabe fällt der Zustand auf das IconBadge zurück.
   */
  illustration?: IllustrationName | React.ReactNode;
  title: string;
  hint?: string;
}) {
  const IconComponent = icon;
  // Außerhalb einer Farbfläche ist das einfach `colors.ink`; innerhalb einer
  // ColorBlockCard erbt der Leerzustand dagegen dieselbe kontraststarke Farbe
  // wie die übrigen Block-Texte.
  const ink = useBlockInk();
  const art =
    typeof illustration === 'string' ? (
      <Illustration name={illustration as IllustrationName} ink={ink} />
    ) : (
      illustration ?? null
    );

  return (
    <FadeInUp>
      <View className="items-center justify-center gap-2.5 px-8 py-12">
        {art ??
          (IconComponent ? <IconBadge icon={IconComponent} color={iconColor} size="xl" tone="tint" strokeWidth={2} /> : null)}
        <Text className="text-center text-[17px] font-extrabold tracking-[-0.2px]" style={{ color: ink }}>{title}</Text>
        {hint ? <Text className="text-center text-[13px] leading-5" style={{ color: ink, opacity: 0.72 }}>{hint}</Text> : null}
      </View>
    </FadeInUp>
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
    <View className="flex-row rounded-full bg-line/60 p-1.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`min-h-[48px] flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-2 py-1.5 ${
              active ? 'bg-surface hover:bg-surface' : 'hover:bg-line/60'
            }`}
            style={active ? shadow.card : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {/* Label darf schrumpfen statt abzuschneiden („Hausaufga…“);
                min-h 48 px — Segment-Buttons sind volle Touch-Targets. */}
            <Text
              className={`text-[13.5px] ${active ? 'font-extrabold text-ink' : 'font-semibold text-muted'}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {option.label}
            </Text>
            {option.badge ? <Badge count={option.badge} className="min-w-[18px]" /> : null}
          </PressableOpacity>
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
  /** Lucide-Icon-Komponente im runden IconBadge (Emoji-frei). */
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useThemeColors();
  const content = (
    <Row className="gap-3 px-4 py-3.5">
      {IconComponent ? <IconBadge icon={IconComponent} color={danger ? colors.danger : iconColor} size="md" /> : null}
      <View className="flex-1">
        <Text className={`text-[15px] font-semibold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[12px] text-muted">{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={17} strokeWidth={2.2} color={colors.faint} /> : null)}
    </Row>
  );

  if (!onPress) return content;
  return (
    <PressableOpacity
      onPress={onPress}
      className="hover:bg-line/40"
      accessibilityRole="button"
    >
      {content}
    </PressableOpacity>
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
      // Phase 4: kleine Icon-Buttons halten per hitSlop die 44-px-Regel ein.
      hitSlop={touchSlopFor(size)}
      style={{ width: size, height: size }}
      scale={0.92}
      className={`items-center justify-center rounded-full ${background}`}
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
 * Seit Phase 1 des Farbflächen-Redesigns: Radius 20, fetter Text (13 px),
 * optionales Lucide-Icon.
 */
export function Pill({
  label,
  color,
  variant = 'amber',
  tone = 'tint',
  icon,
  className = '',
  style,
}: {
  label: string;
  color?: string;
  variant?: ChipVariant;
  tone?: 'tint' | 'solid' | 'outline';
  icon?: LucideIcon;
  className?: string;
  style?: ViewStyle;
}) {
  const { colors } = useThemeColors();
  return (
    <PillBase
      label={label}
      color={color ?? variantColor(variant, colors)}
      tone={tone}
      icon={icon}
      iconSize={13}
      textClassName="text-[13px]"
      className={className}
      style={style}
    />
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
 * Bento-Kachel: große, klare Formkarte (Radius 28), optionaler Farbblock und
 * dezenter Schatten — seit Phase 1 des Farbflächen-Redesigns ohne sichtbaren
 * Rand. Ohne `tone` ist sie immer eine Reinweiß-/Surface-Karte; für echte
 * Farbflächen bevorzugt `ColorBlockCard` verwenden.
 */
export function BentoCard({
  children,
  className = '',
  tone,
  onPress,
  radius: cardRadius = radius.card,
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
  const { isDark } = useThemeColors();
  const resolvedTone = resolveTone(tone, isDark);

  const boxStyle: ViewStyle = {
    borderRadius: cardRadius,
    overflow: 'hidden',
    ...shadow.card,
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
      hoverScale={1.008}
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
