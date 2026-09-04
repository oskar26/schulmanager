/**
 * Fehler-Grenzschicht.
 *
 * Wirft ein Screen einen Laufzeitfehler, zeigt diese Grenze einen ruhigen,
 * deutschen Fallback-Screen statt eines Absturzes — mit Neustart-Möglichkeit.
 * Expo Router liest `ErrorBoundary`-Exports aus Route-Dateien; diese Komponente
 * wird dort und als Wrap um Widgets benutzt.
 */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AlertCircle, ShieldCheck } from 'lucide-react-native';

import { palette } from '@/design/tokens';
import { PressableOpacity, PressableScale } from '@/ui/motion';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Auf welchem Screen trat der Fehler auf — für den Klartext. */
  label?: string;
  /** Statt des ganzen Fallback-Screens nur ein dezent ersetztes Kind (für Widgets). */
  inline?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // Kein Crash-Reporting — die App sendet grundsätzlich nichts.
    if (__DEV__) console.warn('[Schulflow] Fehler abgefangen:', error?.message);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.inline) {
      return (
        <View className="rounded-[28px] bg-surface p-4">
          <Text className="text-[14px] font-semibold text-ink">Diese Karte konnte nicht geladen werden.</Text>
          <PressableOpacity onPress={this.reset} hitSlop={12} accessibilityRole="button">
            <Text className="mt-1 text-[13px] font-semibold text-accent-amber-deep">Erneut versuchen</Text>
          </PressableOpacity>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-danger/15">
          <AlertCircle size={32} strokeWidth={2} color={palette.danger} />
        </View>
        <Text className="mt-4 text-center text-[20px] font-bold tracking-tight text-ink">
          Da ist Schulflow gestolpert
        </Text>
        <Text className="mt-1 text-center text-[13px] leading-5 text-muted">
          {this.props.label ? `In „${this.props.label}“` : 'Hier'} ist ein Fehler aufgetreten. Deine Daten sind
          unberührt — probiere den Bildschirm neu zu laden.
        </Text>
        {__DEV__ && error?.message ? (
          <ScrollView className="mt-3 max-h-32 rounded-[20px] bg-surface p-3" contentContainerStyle={{ flexGrow: 0 }}>
            <Text className="text-[11px] text-muted">{error.message}</Text>
          </ScrollView>
        ) : null}
        <PressableScale
          onPress={this.reset}
          scale={0.97}
          hoverScale={1.01}
          className="mt-5 rounded-full bg-accent-amber px-6 py-3.5"
        >
          <Text className="text-[15px] font-bold text-on-amber">Neu versuchen</Text>
        </PressableScale>
        <Row className="mt-3 items-center gap-1.5">
          <ShieldCheck size={13} strokeWidth={2} color={palette.faint} />
          <Text className="text-[11px] text-faint">Der Fehler wurde nur lokal protokolliert.</Text>
        </Row>
      </View>
    );
  }
}

function Row({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`flex-row items-center ${className}`}>{children}</View>;
}
