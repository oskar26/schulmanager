/** gluestack-ui Progress + Spinner + Switch + Avatar, NativeWind-gestylt. */
import React from 'react';
import { ActivityIndicator, Image, Switch as RNSwitch, Text, View } from 'react-native';
import { createProgress } from '@gluestack-ui/progress';
import { createSpinner } from '@gluestack-ui/spinner';
import { createSwitch } from '@gluestack-ui/switch';
import { createAvatar } from '@gluestack-ui/avatar';

import { foregroundOn, resolveThemeColor } from '@/design/tokens';
import { useThemeColors } from '@/design/theme';

const UIProgress = createProgress({ Root: View, FilledTrack: View });

export type ProgressProps = {
  value: number;
  className?: string;
  trackClassName?: string;
  color?: string;
};

export function Progress({ value, className, trackClassName, color }: ProgressProps) {
  const { colors, isDark } = useThemeColors();
  return (
    <UIProgress
      value={Math.max(0, Math.min(100, value))}
      className={`h-2 w-full overflow-hidden rounded-full bg-line ${className ?? ''}`}
    >
      <UIProgress.FilledTrack
        className={`h-full rounded-full ${trackClassName ?? 'bg-accent-amber'}`}
        style={color ? { backgroundColor: resolveThemeColor(color, isDark) } : undefined}
      />
    </UIProgress>
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
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useThemeColors();
  return (
    <UISwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
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
