/**
 * Web-Variante der Island-Brücke — kein natives Modul im Web-Bundle.
 * (Metro lädt diese Datei statt bridge.native.ts, wenn platform=web.)
 */
export interface LiveIslandNative {
  isSupported(): boolean;
  show(title: string, body: string, progress: number, targetAt: number): Promise<boolean>;
  hide(): Promise<void>;
}

export function getNativeIsland(): LiveIslandNative | null {
  return null;
}
