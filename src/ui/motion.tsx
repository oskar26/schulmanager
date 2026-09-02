/**
 * Motion-Layer — hier wird Tamagui eingesetzt: Tokens + Animations-Treiber.
 * Der Rest der App bleibt bei NativeWind-Klassen, animiert aber über diese Bausteine.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, View, type PressableProps, type ViewStyle } from 'react-native';
import { Stack } from 'tamagui';

type MotionProps = {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
  className?: string;
};

/** Sanftes Einfliegen von unten — für Listen und Dashboard-Karten. */
export function FadeInUp({ children, delay = 0, distance = 14, style, className }: MotionProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <View style={style} className={className}>
      <Stack animation="lazy" opacity={shown ? 1 : 0} y={shown ? 0 : distance}>
        {children}
      </Stack>
    </View>
  );
}

/** Verspielter Druckpunkt: Karte „drückt sich ein". */
export function PressableScale({
  children,
  scale = 0.97,
  className,
  style,
  ...rest
}: PressableProps & { children: React.ReactNode; scale?: number; className?: string }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      {...rest}
      onPressIn={(event) => {
        setPressed(true);
        rest.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        rest.onPressOut?.(event);
      }}
      style={style}
      className={className}
    >
      <Stack animation="bouncy" scale={pressed ? scale : 1}>
        {children}
      </Stack>
    </Pressable>
  );
}

/** Pulsierender Punkt für „läuft gerade" / „live". */
export function LivePulse({ color = '#22B07A', size = 8 }: { color?: string; size?: number }) {
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
