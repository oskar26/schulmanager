# Schulflow — Design-System „Playful Modern Canvas“

> Stand: 2026-09-05 · löst den „Farbflächen-Stil“ (docs/redesign-phasen.md) ab.
> Umsetzung des UI/UX-Briefings: neues Farb-/Design-System, Rebuild der
> Kalender-Wochenansicht, Modal-Fix, 12-Spalten-Bento-Dashboard, Sidebar-Badges.

## 1. Philosophie

Vorher: komplette Container in hochgesättigten Volltönen (Violett, Rot, Neon-Grün)
→ Kontrastprobleme, gequetschter Text, unruhige Oberfläche.

Jetzt: **Soft Bento-Grid mit gezielten Pop-Akzenten.**

| Ebene | Regel |
|---|---|
| Basis | App-Hintergrund `#F6F8FD`, Karten Reinweiß, Rand `#E2E8F0`, Text Deep-Slate `#0F172A` / Muted `#64748B` |
| Flächen | Fach-/Kategorieflächen nur als **Pastell-Tint** (8–12 %): `palette.blockTints`, `subjectTint()`, `blockTint()` |
| Akzente | Kräftige Töne (`palette.blocks`, `subjectColor()`) **nur** für 4-px-Left-Border, Icons, Pills, Fortschritt, Buttons |
| Radii | Outer Cards **20** · Sub-Cards/Modals **14** · Buttons/Badges **8** oder Pill |
| Schatten | `shadow.card` ≈ `0 4px 20px -2px rgba(15,23,42,.04)` · `shadow.float` für Hero/Modals |
| Hover | Karten: `translateY(-2px) scale(1.02)` (`PressableScale hoverLift hoverScale={1.02}`) |

## 2. Tokens — drei synchron gepflegte Ebenen

* `src/design/tokens.ts` — JS-Quelle (`palette`, `darkPalette`, `blockTint()`, `mixHex()`, `radius`, `shadow`)
* `global.css` — CSS-Variablen `--sf-*` (inkl. neuer `--sf-tint-*`, `--sf-info`)
* `tailwind.config.js` — Utilities `bg-tint-*`, `text-info`, `rounded-sm|md|lg`

### Fächer-Palette

| Fach-Familie | Primary | Tint | Token |
|---|---|---|---|
| Mathe / Informatik (MINT) | `#6366F1` | `#EEF2FF` | `violet` |
| Deutsch | `#F43F5E` | `#FFF1F2` | `coral` |
| Englisch / Fremdsprachen | `#0EA5E9` | `#F0F9FF` | `sky` |
| Bio / Chemie | `#10B981` | `#ECFDF5` | `mint` |
| Physik | `#14B8A6` | `#F0FDFA` | `teal` |
| Geschichte / Erdkunde / Politik | `#F97316` | `#FFF7ED` | `amber` |
| Sport / Kunst / Musik | `#EC4899` | `#FDF2F8` | `pink` |
| Religion / Ethik / Elternbriefe | `#8B5CF6` | `#F5F3FF` | `lavender` |

Status: urgent `#EF4444` · warning `#F59E0B` · success `#22C55E` · info `#3B82F6`
(`palette.status`, `palette.priority`).

Dark Mode: Slate-Nacht (`#0B1220` / Karten `#111A2E`), Akzente eine Stufe heller,
Tints als 16 %-Mischung auf der Kartenfläche (`mixHex`).

## 3. Bausteine (src/ui/primitives.tsx)

* `Card` — weiße Bento-Karte (Radius 20, Rand, Schatten). `CardTitle` (18/700, einzeilig, Ellipsis), `CardSubtitle` (14, muted, mt-4px).
* `ColorBlockCard color variant="tint"|"surface"|"solid" accentBar` — Standard ist Tint + 4-px-Streifen links.
  Kinder: `BlockText` (Ink), `BlockCaption` (Muted), `useBlockAccent()` (Familienfarbe für Icons/Pills), `useBlockInk()`.
  `solid` bleibt nur für bewusste Pops (z. B. eigene Chat-Bubble).
* `StatCard` — Zahl im Akzentton auf Pastell; `glass` für die Hero-Pillen (`rgba(255,255,255,.08)`).
* `Sheet header={…}` — Modal mit `overflow: hidden` + `position: relative`; Header liegt **in** der Karte.
* `Badge` — `status.urgent`, `marginLeft: auto`.
* `PressableScale hoverLift` — Hover-Anhebung.

## 4. Dashboard (app/(tabs)/index.tsx)

* Ein Container (`maxWidth 1400`, gleiche Kante für Hero + Grid), `gap 20`.
* Hero (Span 12): Slate-Gradient-Optik (Licht-Blobs), Begrüßung links, 3 Glas-Pillen rechts (Phone: darunter).
* 12-Spalten-Packer `packRows()` mit Look-ahead: Widgets tragen `WIDGET_SPANS`
  (Nächster Unterricht 4 · Insights 5 · Stundenplan 3 · Hausaufgaben 7 · Arbeiten 5 · Briefe 4 · Noten 4 · Brett 4 · Schnellaktionen 5).
  Tablet: Spans ≥ 6 → 12, sonst 6. Phone: alles 12. Zeilenreste werden aufgefüllt → keine Whitespace-Löcher.
* „Dashboard anpassen“ = gestrichelter Slot, der den Rest der letzten Zeile belegt (oder eine 64-px-Zeile).
* Schnellaktionen = weißes Panel, 2-spaltiges Icon-Grid (36-px-Icon-Container, dunkler Text).

## 5. Kalender-Wochenansicht (src/ui/timetable-week-grid.tsx)

* Zeitachse 07–16 Uhr, 50 px, Marker `HH:00` linksbündig, gestrichelte Stundenlinien.
* Fach-Karte: `subjectTint()` + `borderLeft 4px subjectColor()`; Zeile 1 `subjectShortName()`
  („Mathe“, „Bio“, „Geschichte“ — nie mehr `slice(0,4)`), Zeile 2 `Raum · Zeit` 11 px muted.
* Status-Dots oben rechts: rot pulsierend (Entfall/Vertretung), gelb (Raumwechsel), grün (offene Hausaufgabe im Fach).
* `HOUR_HEIGHT 64` für zwei Textzeilen; Überlappungen weiterhin spaltenweise.

## 6. Detail-Modal (app/(tabs)/timetable.tsx → `LessonSheet`)

* `Sheet header={<LessonSheetHeader/>}`: Banner in Fachfarbe (Licht-Blob als Verlauf), `padding 20`,
  `flex space-between`, Titel einzeilig mit Ellipsis, ✕ oben rechts im `rgba(255,255,255,.2)`-Kreis.
* Inhalt: Fakten-Badges, dann `SheetSection`s (Änderung / Hausaufgaben / Arbeiten) auf `--bg-app`, Radius 14, Icon-Container.

## 7. Sidebar (src/ui/shell.tsx)

`.nav-item`: `flex-row · align-center · space-between · padding 12/16 · width 100 %` ·
`NavBadge`: `marginLeft: auto`, `status.urgent`, 11 px/700, Pill — überlagert kein Label mehr.
Rail-Modus: Badge absolut am Icon mit weißem Ring.

## 8. Prüfen

```bash
npm run typecheck
npm run doctor
EXPO_OFFLINE=1 npx expo start --web --port 8081 &   # Metro
node scripts/smoke.mjs / --width=1440 --height=900
node scripts/smoke.mjs /timetable --width=390 --dark
```
