# widgets/

Gemeinsamer Datenspeicher + native Home-Screen-Widgets (Phase E).

* **`spec.md`** — Verbindliche Layout-Spezifikation: iOS WidgetKit
  (Small/Medium/Large + Lock-Screen-Complication), Android Glance,
  JSON-Schema, Update-Policy, Verdrahtung im Dev-Build.
* **Bridge (JS):** `src/features/widgets/bridge.ts` + `snapshot.ts`
  (Payload-Builder) — die App schreibt das Widget-JSON nach jedem Sync.
* **Natives Modul:** `modules/schulflow-widgets` (Android:
  SharedPreferences + REFRESH-Broadcast) — nur in Dev-Builds aktiv.
* **Live Activities (iOS):** `modules/schulflow-live-island/ios/`
  (ActivityKit-Modul + Referenz-Extension).

Build: Dev-Client erforderlich (kein Expo Go) — Details in `spec.md` §6
und `README.md` („Home-Screen-Widgets").
