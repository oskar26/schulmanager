/**
 * gluestack-ui Button, mit NativeWind gestylt (gluestack-v2-Muster:
 * unstyled Primitive + tva-Varianten).
 */
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { createButton } from '@gluestack-ui/button';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { withStyleContext, useStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';

const SCOPE = 'BUTTON';

const Root = withStyleContext(Pressable, SCOPE);

const UIButton = createButton({
  Root: Root as any,
  Text,
  Group: View,
  Spinner: ActivityIndicator,
  Icon: View,
});

const buttonStyle = tva({
  // Buttons sind Pillen (Kernprinzip 3/6) statt abgerundeter Rechtecke.
  base: 'flex-row items-center justify-center gap-2 rounded-full hover:opacity-90 active:opacity-80',
  variants: {
    action: {
      primary: 'bg-accent-amber',
      secondary: 'bg-accent-amber/15',
      ghost: 'bg-transparent',
      surface: 'bg-surface',
      danger: 'bg-danger',
      success: 'bg-success',
    },
    size: {
      // Phase 4: auch „sm“ erfüllt die 44-px-Touch-Target-Regel.
      sm: 'h-11 px-4',
      md: 'h-12 px-5',
      lg: 'h-14 px-6',
      icon: 'h-11 w-11 px-0',
    },
    block: { true: 'w-full', false: '' },
    disabled: { true: 'opacity-40 hover:opacity-40 active:opacity-40', false: '' },
  },
  defaultVariants: { action: 'primary', size: 'md', block: false },
});

const buttonTextStyle = tva({
  base: 'font-semibold',
  parentVariants: {
    action: {
      primary: 'text-on-amber',
      secondary: 'text-on-amber',
      ghost: 'text-accent-amber-deep',
      surface: 'text-ink',
      danger: 'text-on-coral',
      success: 'text-on-lime',
    },
    size: { sm: 'text-[13px]', md: 'text-[15px]', lg: 'text-[16px]', icon: 'text-[15px]' },
  },
});

export type ButtonProps = React.ComponentProps<typeof UIButton> & {
  action?: 'primary' | 'secondary' | 'ghost' | 'surface' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  block?: boolean;
  className?: string;
};

export const Button = React.forwardRef<React.ElementRef<typeof UIButton>, ButtonProps>(
  ({ className, action = 'primary', size = 'md', block = false, ...props }, ref) => (
    <UIButton
      ref={ref as any}
      {...props}
      // @ts-expect-error – gluestack reicht den Kontext an die Kinder weiter
      context={{ action, size }}
      className={buttonStyle({ action, size, block, class: className })}
    />
  ),
);
Button.displayName = 'Button';

export type ButtonTextProps = React.ComponentProps<typeof UIButton.Text> & { className?: string };

export const ButtonText = React.forwardRef<React.ElementRef<typeof UIButton.Text>, ButtonTextProps>(
  ({ className, ...props }, ref) => {
    const { action, size } = useStyleContext(SCOPE);
    return (
      <UIButton.Text
        ref={ref as any}
        {...props}
        className={buttonTextStyle({ parentVariants: { action, size }, class: className })}
      />
    );
  },
);
ButtonText.displayName = 'ButtonText';

export const ButtonSpinner = UIButton.Spinner;
export const ButtonGroup = UIButton.Group;
