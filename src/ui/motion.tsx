/**
 * Motion-Layer — react-native-reanimated + Tamagui:
 * 60/120fps native Spring-Physik für Karte-Einfliegen, Touch-Scale,
 * Hover-/Press-Zustände und sanfte Layout-Übergänge.
 *
 * Phase 4 (UX-Polishing):
 * · `PressableScale` reagiert jetzt auch auf Hover (Web) und `disabled`.
 * · `PressableOpacity` ist der Standard für Text-Links und kleine Chips.
 * · `FadeInUp`/`FadeInDown` animieren Layout-Änderungen (Listen rutschen
 *   sanft nach, wenn ein Eintrag verschwindet) statt hart umzuspringen.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeInUp as ReanimatedFadeInUp,
  FadeInDown as ReanimatedFadeInDown,
  LinearTransition,
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

/** Sanfte Spring-Physik für Layout-Übergänge (Listen-Reflow). */
const layoutSpring = LinearTransition.springify().damping(20).stiffness(220);

/** Sanftes Einfliegen von unten mit Spring-Physik — für Listen und Dashboard-Karten. */
export function FadeInUp({ children, delay = 0, style, className }: MotionProps) {
  return (
    <Animated.View
      entering={ReanimatedFadeInUp.springify().damping(18).stiffness(200).delay(delay)}
      layout={layoutSpring}
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
      layout={layoutSpring}
      style={style}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Verspielter Druckpunkt: Karte „drückt sich ein" mit reanimated Spring.
 * Auf Web (Hover) hebt sich das Element minimal an, statt stumm zu bleiben;
 * `disabled` Elemente geben keinerlei Feedback.
 */
export function PressableScale({
  children,
  scale = 0.97,
  hoverScale,
  className,
  style,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...rest
}: PressableProps & {
  children: React.ReactNode;
  scale?: number;
  /** Zusätzliches Hover-Lift auf Web (z. B. 1.01 für Karten). Default: aus. */
  hoverScale?: number;
  className?: string;
}) {
  const pressed = useSharedValue(1);
  const hovered = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value * hovered.value }],
  }));

  const canInteract = !disabled;

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPress={onPress}
      onPressIn={(event) => {
        if (canInteract) pressed.value = withSpring(scale, { damping: 16, stiffness: 320 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (canInteract) pressed.value = withSpring(1, { damping: 16, stiffness: 320 });
        onPressOut?.(event);
      }}
      onHoverIn={(event) => {
        if (canInteract && hoverScale != null) {
          hovered.value = withSpring(hoverScale, { damping: 18, stiffness: 260 });
        }
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        if (canInteract && hoverScale != null) {
          hovered.value = withSpring(1, { damping: 18, stiffness: 260 });
        }
        onHoverOut?.(event);
      }}
      style={style}
      className={className}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

/**
 * Dezenter Press-/Hover-Zustand über Opacity — der Standard für Text-Links
 * („Alle ansehen", „Bestätigen"), Segment-Chips und kleine Trefferflächen,
 * wo ein Scale wackeln würde. Auf Web dimmt Hover leicht vor.
 */
export function PressableOpacity({
  children,
  pressedOpacity = 0.65,
  hoverOpacity = 0.8,
  className,
  style,
  disabled,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...rest
}: PressableProps & {
  children: React.ReactNode;
  pressedOpacity?: number;
  hoverOpacity?: number;
  className?: string;
  style?: ViewStyle | ((state: { pressed: boolean }) => ViewStyle);
}) {
  const opacity = useSharedValue(1);
  const canInteract = !disabled;

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      className={className}
      onPressIn={(event) => {
        if (canInteract) opacity.value = withTiming(pressedOpacity, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (canInteract) opacity.value = withTiming(1, { duration: 140 });
        onPressOut?.(event);
      }}
      onHoverIn={(event) => {
        if (canInteract) opacity.value = withTiming(hoverOpacity, { duration: 110 });
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        if (canInteract) opacity.value = withTiming(1, { duration: 140 });
        onHoverOut?.(event);
      }}
      style={style}
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
