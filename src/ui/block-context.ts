/**
 * Farbflächen-Context (Phase 1, ausgelagert in Phase 9).
 *
 * `ColorBlockCard` stellt hierüber die kontrastsichere Vordergrundfarbe ihrer
 * Fläche bereit. Der Context lebt in einem eigenen Modul, damit ihn auch
 * Bausteine *unterhalb* von `primitives.tsx` lesen können (z. B. die
 * Leerzustand-Illustrationen) ohne Import-Zyklus.
 */
import React from 'react';

export type BlockContextValue = { fg: string };

export const ColorBlockContext = React.createContext<BlockContextValue | null>(null);

/** Vordergrundfarbe der umgebenden Farbfläche — `null` außerhalb einer Fläche. */
export function useBlockContext(): BlockContextValue | null {
  return React.useContext(ColorBlockContext);
}
