import React from 'react';
import { Stack } from 'expo-router';

/**
 * Settings-Drilldown (Phase 14): eigene Stack-Navigation statt einer langen
 * Scroll-Liste. Jede Kategorie bleibt dadurch deep-linkbar und bekommt beim
 * Öffnen/Zurückgehen dieselbe native Transition wie der Rest der App.
 */
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 260,
      }}
    />
  );
}
