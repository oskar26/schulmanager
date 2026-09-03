import React from 'react';
import type { LucideIcon } from 'lucide-react-native';

/**
 * Zentrale Lucide-Icon-Stelle (Phase A/C): Größe, Strichstärke und Farbe für die
 * ganze App konsistent aus einer Datei setzen. Farbe ist bewusst optional —
 * ist sie nicht gesetzt, erbt das Icon `currentColor` (z. B. aus einem farbigen
 * `<Text>`), damit es im Light- UND Dark-Mode passt.
 */
export function Icon({
  icon: IconComponent,
  size = 20,
  strokeWidth = 2.1,
  color,
}: {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  return <IconComponent size={size} strokeWidth={strokeWidth} color={color} />;
}

export type { LucideIcon };
