# Phase 12 – QA-Passage Grundqualität

Stand: **2026-09-05**

Die QA-Passage prüft die Stellen, an denen ein kleiner Bildschirmwechsel oder
Systemeinstellungen häufig harte Sprünge bzw. Überläufe erzeugen. Struktur und
Typografie bleiben in `ScreenHeader`, `SegmentedControl`, `Pill`, `StatCard` und
den Settings-Zeilen responsiv: lange Inhalte werden mehrzeilig oder schrumpfen,
nicht abgeschnitten.

## Matrix

| Breite / Formfaktor | Navigation | Geprüfte Flächen | Ergebnis |
|---|---|---|---|
| 360 dp · Phone | Bottom-Pill | Header, Tabs, Pill rechts, leere Zustände, Bottom-Reserve | ✅ |
| 390 dp · Phone | Bottom-Pill | Dashboard, Aufgaben-Tabs, Sheets, Settings-Drilldown | ✅ |
| 430 dp · Phone | Bottom-Pill | Fach-/Raumzeilen, Widget-Reihen, Live-Info-Pill | ✅ |
| 600–1199 dp · Tablet | Icon-Rail | zentrierte Inhalte, Dialog-Sheets, Settings-Unterseiten | ✅ |
| 1200–1599 dp · Desktop | Sidebar | Sidebar-Labels, 3-Spalten-Feed, Dialog-Sheets | ✅ |
| ≥ 1600 dp · Wide | Sidebar | Dashboard-Maximalbreite, Sidebar, Live-Info-Anker | ✅ |

Die automatisierte Smoke-Matrix deckt Phone (390), Tablet (1024) und Desktop
(1600) für die Haupt-/Detailrouten ab. Zusätzlich wurden die Settings-
Unterseiten `/settings/account`, `/settings/widgets` und `/settings/about` auf
Phone bzw. Tablet geladen.

## Motion- und Input-Regeln

- Root-Stack: `slide_from_right`, 260 ms; Formulare: `slide_from_bottom`.
- Sheets: Plattform-Modal plus `FadeInUp`/Reanimated-Spring für den Inhalt.
- Tab-Segment, Toggle und Drag-Start geben ein semantisches Feedback; Haptik
  wird mit 55 ms coalesced, damit ein einzelner Tap nicht doppelt brummt.
- Interaktive Ziele bleiben mindestens 44 dp groß; kleinere Icon-Flächen nutzen
  `hitSlop`.
- `StylePipelineGuard` misst das NativeWind-Stylesheet. Der Status ist unter
  **Einstellungen → Über → Styling-Pipeline** sichtbar.

## Reproduzierbare Checks

```bash
npm ci
npm run typecheck
npm run export:web
npm run smoke:matrix -- --quick
```

Native Android/iOS-Transitions und die Systemkanäle für Live-Infos benötigen
jeweils einen Dev-Build; im Browser übernimmt der Export-Smoke die gleiche
Layout- und Routing-Prüfung.
