/**
 * Motion-Layer — react-native-reanimated + Tamagui:
 * 60/120fps native Spring-Physik für Karte-Einfliegen, Touch-Scale und Pulse.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInUp as ReanimatedFadeInUp,
  FadeInDown as ReanimatedFadeInDown,
} from 'react-native-reanimated';
import { Stack } from 'tamagui';

import { palette } from '@/design/tokens';

type MotionProps = {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
  className?: string;
};

/** Sanftes Einfliegen von unten mit Spring-Physik — für Listen und Dashboard-Karten. */
export function FadeInUp({ children, delay = 0, style, className }: MotionProps) {
  return (
    <Animated.View
      entering={ReanimatedFadeInUp.springify().damping(18).stiffness(200).delay(delay)}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

/** Sanftes Einfliegen von oben mit Spring-Physik. */
export function FadeInDown({ children, delay = 0, style, className }: MotionProps) {
  return (
    <Animated.View
      entering={ReanimatedFadeInDown.springify().damping(18).stiffness(200).delay(delay)}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

/** Verspielter Druckpunkt: Karte „drückt sich ein" mit reanimated Spring. */
export function PressableScale({
  children,
  scale = 0.97,
  className,
  style,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: PressableProps & { children: React.ReactNode; scale?: number; className?: string }) {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      onPressIn={(event) => {
        pressed.value = withSpring(scale, { damping: 16, stiffness: 320 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withSpring(1, { damping: 16, stiffness: 320 });
        onPressOut?.(event);
      }}
      style={style}
      className={className}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

/** Pulsierender Punkt für „läuft gerade" / „live". */
export function LivePulse({ color = palette.success, size = 8 }: { color?: string; size?: number }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setOn((value) => !value), 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <Stack
      animation="lazy"
      width={size}
      height={size}
      borderRadius={size}
      backgroundColor={color}
      opacity={on ? 0.35 : 1}
      scale={on ? 1.35 : 1}
    />
  );
}
