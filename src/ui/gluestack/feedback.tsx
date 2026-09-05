/** gluestack-ui Progress + Spinner + Switch + Avatar, NativeWind-gestylt. */
import React from 'react';
import { ActivityIndicator, Image, Switch as RNSwitch, Text, View } from 'react-native';
import { createSpinner } from '@gluestack-ui/spinner';
import { createSwitch } from '@gluestack-ui/switch';
import { createAvatar } from '@gluestack-ui/avatar';

import { foregroundOn, resolveThemeColor } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';

export type ProgressProps = {
  value: number;
  className?: string;
  trackClassName?: string;
  color?: string;
};

/**
 * Standard-Fortschrittsbalken (Phase 17). Eigene Implementierung statt
 * gluestack-`createProgress`: Deren FilledTrack mit ungestyltem View-Root
 * ignorierte `value` und zeigte bei 0 % einen vollflächigen Balken, der wie
 * ein Lade-Fehler wirkte. Hier wird die Breite explizit gesetzt — bei 0 %
 * bleibt ausschließlich der neutrale Track sichtbar.
 */
export function Progress({ value, className, trackClassName, color }: ProgressProps) {
  const { colors, isDark } = useThemeColors();
  const clamped = Math.max(0, Math.min(100, value));
  const fill = resolveThemeColor(color ?? colors.accent.amber, isDark);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      className={`h-2 w-full flex-row overflow-hidden rounded-full bg-line ${trackClassName ?? ''} ${className ?? ''}`}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: fill,
          opacity: clamped <= 0 ? 0 : 1,
        }}
      />
    </View>
  );
}

const UISpinner = createSpinner({ Root: ActivityIndicator });

export function Spinner({ size = 'small', color }: { size?: 'small' | 'large'; color?: string }) {
  const { colors, isDark } = useThemeColors();
  return <UISpinner size={size} color={resolveThemeColor(color ?? colors.accent.amber, isDark)} />;
}

const UISwitch = createSwitch({ Root: RNSwitch });

export function Switch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  /**
   * Redesign Phase 6/8: Toggles stehen im neuen Stil oft ohne sichtbares
   * Label direkt neben einer Überschrift — Screenreader brauchen dann eine
   * explizite Beschriftung.
   */
  accessibilityLabel?: string;
}) {
  const { colors } = useThemeColors();
  return (
    <UISwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.line, true: colors.accent.amber }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.line}
    />
  );
}

const UIAvatar = createAvatar({
  Root: View,
  Badge: View,
  Group: View,
  Image,
  FallbackText: Text,
});

export function Avatar({
  name,
  color,
  size = 40,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const { colors, isDark } = useThemeColors();
  const base = resolveThemeColor(color ?? colors.accent.violet, isDark);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <UIAvatar
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: base }}
    >
      <UIAvatar.FallbackText
        className="font-bold"
        style={{ fontSize: size * 0.38, color: foregroundOn(base, colors) }}
      >
        {initials || '?'}
      </UIAvatar.FallbackText>
    </UIAvatar>
  );
}
