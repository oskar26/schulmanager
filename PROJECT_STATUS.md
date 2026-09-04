# PROJECT_STATUS.md — SchulFlow Design-Relaunch

> **Single Source of Truth** für den UI-Relaunch. Diese Datei wird zu Beginn jeder
> Session gelesen und nach jeder erledigten Phase aktualisiert.
> Letztes Update: 2026-09-04 · Status: **Farbflächen-Redesign · Phase 1 ✅**
>
> **Neu ab 2026-09-04:** Der weitere Fahrplan lebt in
> [`docs/redesign-phasen.md`](docs/redesign-phasen.md) („Farbflächen-Stil“,
> 9 Phasen mit Akzeptanzkriterien). Die dortigen Phasen 1–9 lösen die alte
> Nummerierung unten ab; Abschnitt 2 (Tokens) wird dort fortgeschrieben.

---

## 1. Zielbild

Ein **modernes, kontrastreiches Mobile-Design** (1:1 an den Referenz-Screenshots):

- Warmes Creme-Canvas statt kaltem Grau, kräftige Farbblöcke statt Pastell-Wäsche.
- Abgerundete Form-Cards (Radii 20–28 px) in Reinweiß oder als fette Akzent-Flächen.
- Fette, prägnante Typografie (700/800) in Anthrazit — **niemals abgeschnittener Text**.
- Schwebende, dunkle Kapsel-Bottom-Nav (`#18191C`), die Inhalte **niemals verdeckt**.
- Klare visuelle Hierarchie: Wichtiges ist farbig & groß, Nebensächliches ruhig & klein.

**Anti-Ziel (aktuell, wird entfernt):** ausgewaschene Pastell-Pillows, gleichförmige
Pillen-Hierarchie, überlagerte Bottom-Nav, lila Header-Konflikt, Text-Truncation.

---

## 2. Design-Tokens (verbindlich)

### 2.1 Farbpalette

| Token | Wert (Light) | Einsatz |
|---|---|---|
| `canvas` | `#F6F4EE` | App-Hintergrund (warmes Off-White/Hellcreme) |
| `surface` | `#FFFFFF` | Karten auf dem Creme-Canvas |
| `charcoal` | `#18191C` | Primärtext, Header, Bottom-Nav, dunkle Karten |
| `charcoalElevated` | `#232428` | Erhöhte dunkle Flächen (Nav-Buttons, Chips) |
| `ink` | `#18191C` | Fließtext / Headlines |
| `muted` | `#5C5F66` | Sekundärtext |
| `faint` | `#9A9DA6` | Tertiärtext, Platzhalter |
| `line` | `#E8E5DC` | Hairlines/Borders auf Creme |
| `accent.amber` | `#FF8C38` | **Accent 1:** Hauptkarten, Progress, Hervorhebungen |
| `accent.amberDeep` | `#F27244` | Amber-Variante für Gradients/Segmente |
| `accent.violet` | `#635BFF` | **Accent 2:** Feature-Cards (z. B. Übungsblöcke) |
| `accent.lime` | `#C3F073` | **Accent 3:** Erfolge, Noten, Bestätigungen (Fläche) |
| `accent.limeDeep` | `#A3E635` | Lime-Variante (Progress/Badges auf Lime) |
| `accent.coral` | `#E05353` | **Accent 4:** Dringende Aufgaben, Abgabefristen |
| `onAmber` | `#2B1600` | Text auf Amber-Flächen |
| `onLime` | `#1F2A00` | Text auf Lime-Flächen |
| `onViolet` | `#FFFFFF` | Text auf Violet-Flächen |
| `onCoral` | `#FFFFFF` | Text auf Coral-Flächen |
| `onCharcoal` | `#FFFFFF` | Text auf Charcoal-Flächen |
| `success` | `#3E9B5A` | Positive Status-Badges |
| `warning` | `#E89C1E` | Warn-Status |
| `danger` | `#E05353` | Fehler/Frist-Status (≡ Coral) |

**Dark-Mode-Ableitung** (Phase 2): Canvas `#101114`, Surface `#18191C`,
Amber/Violet/Lime leicht aufgehellt, Text invertiert. Kein zweites Pastell-Set —
dieselben Akzentfarben, dunklere Flächen.

### 2.2 Formen & Abstände

- Karten-Radii: `card = 24px`, `cardLg = 28px`, `cardSm = 20px`, `pill = 999px`.
- Karten-Spacing: 16 px seitlich, 14–16 px Gap zwischen Karten.
- Innen-Padding Karten: 16–20 px.
- Bottom-Nav: dunkle Kapsel (`charcoal`), horizontal 16 px Float-Margin,
  Radius `pill`/24 px, **Content-Reserve unter jedem Scroll-Container: 100 px**.

### 2.3 Typografie

| Style | Spec |
|---|---|
| Display (Welcome) | 30–34 px / 800 / `-0.5px` Tracking / charcoal |
| Titel (Screen-Header) | 24–26 px / 800 / charcoal |
| Card-Headline | 17–18 px / 700 |
| Body | 14–15 px / 500 / ink |
| Caption/Badge | 11–12 px / 700, ggf. Uppercase (+0.4px Tracking) |

**Truncation-Regel:** Keine einzeiligen `numberOfLines={1}`-Ketten mehr.
Lange Datumsangaben → **vertikal stacken** (Wochentag fett, Datum darunter)
oder horizontales Shrink-wrap. Fächernamen → bis 2 Zeilen mit `numberOfLines={2}`
oder verkürzte Anzeige + Vollname im Detail. Tab-/Section-Header → nie abschneiden.

---

## 3. Mängelliste (Review des aktuellen Stands)

| # | Mangel | Ort | Phase |
|---|---|---|---|
| M1 | ~~Bottom-Nav (schwarz) verdeckt Seiteninhalt~~ **✅ gefixt** — `useTabNavReserve()` (min. 100 px bzw. Safe-Area + 88 px) in allen 5 Tab-Screens | alle Tab-Screens | 1 ✅ |
| M2 | ~~Lila/Pastell-Header-Fläche widerspricht Ziel-Look~~ **✅ gefixt** — Canvas-/Charcoal-Header, Amber/Violet nur als gezielte Akzente | Dashboard, Tabs, Onboarding | 2 ✅ |
| M3 | ~~Datum „Donnerstag, 3. …" abgeschnitten~~ **✅ gefixt** — Dashboard stapelt Wochentag (27 px/800) + Datum darunter | Dashboard-Header | 1 ✅ |
| M4 | ~~Fächernamen „Mathe…" abgeschnitten~~ **✅ gefixt** — Stundenplan-Kacheln 2-zeilig bzw. shrink-to-fit; Dashboard/Inbox/Noten 2-zeilig | Timetable, Widgets, Listen | 1 ✅ |
| M5 | ~~Tab-Header „Hausaufga…" abgeschnitten~~ **✅ gefixt** — `SegmentedControl` 12,5 px + shrink-to-fit + kompaktere Badges | Tasks & Inbox | 1 ✅ |
| M6 | ~~Alles ist gleichförmige Pastell-Pille → keine Hierarchie~~ **✅ Grundlage gefixt** — weiße Form-Cards, starke Akzentflächen und kontrastreiche Chips | global | 2 ✅ |
| M7 | ~~Pastell-Tokens (periwinkle-soft etc.) wirken „AI-Slop"~~ **✅ gefixt** — alte Utility-/Runtime-Werte auditiert und abgelöst | Tokens, UI, Bootstrap | 2 ✅ |

---

## 4. Phasen-Checkliste

### Phase 1 — Setup & Globales Layout-Fixing ✅ *abgeschlossen (2026-09-03)*
- [x] `PROJECT_STATUS.md` angelegt (Zielbild, Tokens, Roadmap)
- [x] Globales Scroll-Container-Padding: neue zentrale Reserve `src/ui/nav-reserve.ts`
      (`TAB_NAV_RESERVE = 100`, Hook `useTabNavReserve()` = max(100 px, Safe-Area + 88 px)),
      angewendet in **allen 5 Tab-Screens** (index, timetable ×3 ScrollViews, tasks, inbox, grades)
      — hartcodierte 110/132-px-Werte komplett entfernt
- [x] Truncation-Fixes überall:
      Dashboard-Datum gestapelt (Wochentag fett + Datum) · `SegmentedControl` shrink-to-fit
      (M5) · Stundenplan-`LessonCell` 2-zeilig/shrink (M4) · Dashboard-Widgets
      (nächste Stunde, Stundenliste, Arbeiten, Noten, Briefe, Aushänge) 2-zeilig ·
      Inbox-Brieftitel 2-zeilig · erledigte Aufgaben 2-zeilig · LiveIsland-Fach
      shrink/2-zeilig · Kalender-/Such-/Thread-Titel 2-zeilig
- [x] Kontrolle: `npm run typecheck` ✅ + Smoke ✅ (`/`, `/timetable`, `/tasks`, `/inbox`,
      `/grades`, `/calendar` @ 390×844; `/` @ 1600×900 mit Sidebar)

### Phase 2 — Design-System & Theme ✅ *abgeschlossen (2026-09-03)*
- [x] Verbindliche Palette dreifach synchronisiert: `global.css` → `tailwind.config.js`
      → `src/design/tokens.ts` (Creme-Canvas, Charcoal, Amber/Violet/Lime/Coral;
      keine alten Periwinkle-/Pastell-Utilities mehr).
- [x] Globale Kartenanatomie in `src/ui/primitives.tsx`: weiße `surface`-Flächen,
      20/24/28-px-Radien, warme Linien und semantische, kontrastberechnete Chips/Badges.
- [x] Dark-Ableitung implementiert: Canvas `#101114`, Surface `#18191C`, invertierte
      Textfarben und dieselbe, behutsam aufgehellte Akzentfamilie. `useThemeColors()`
      versorgt imperative React-Native-Farben neben NativeWind.
- [x] Lila Header-/Pastellflächen ersetzt: Tabs, alle Detail-Screens, Onboarding,
      Dashboard-Widgets und Live-Island nutzen Canvas/Charcoal mit gezielten Akzenten;
      PWA-/Native-Bootstrap und Marken-Assets wurden passend nachgezogen.
- [x] Audit & Verifikation: `npm run typecheck` ✅ · `npm run export:web` ✅ ·
      `npm run smoke:matrix` ✅ (17 Routen × Phone/Tablet/Desktop = 51 Kombinationen)
      sowie ein zusätzlicher Dark-Mode-Render-Smoke aller 17 Routen auf Phone-Breite ✅.

### Phase 3 — Komponentenseiten-Redesign ✅ *abgeschlossen (2026-09-03)*
- [x] **Dashboard/Home:** fettes Welcome-Banner — Charcoal-Hero-Karte (`#18191C`)
      mit gestapeltem Datum, Fortschritts-Anzeige („x von y Hausaufgaben erledigt“)
      und Heute-Statistik-Kacheln (Stunden heute / Aufgaben offen / Tage bis Arbeit).
      Kopfzeile oben links gerückt, Suche/Einstellungen als helle Glas-Buttons
      direkt im Hero (Phone), Schul-Pill zentriert. Kein Truncation mehr.
- [x] **Stundenplan:** auf Phones ersetzt die vertikale **Tages-Timeline** (Zeitspalte,
      farbige Spur mit Tageslinie, große voll lesbare Fach-Karten mit 2-zeiligen
      Namen) das alte Mini-Kachel-Raster inkl. der Tages-/Wochen-Ansicht-Pille —
      „Keine Minikachel-Truncation“ erreicht. Horizontale **Tages-Pills** (56×62 px)
      mit Datum + Stundendot; Tageskopf mit Datum + Änderungs-Chips; Status-Chips
      (Entfall/Vertretung/Raumwechsel) + Jetzt-Marker. Tablet behält Wahlmöglichkeit
      Wochen-/Tagesraster, Desktop behält das große Zeitraster.
- [x] **Aufgaben & Postfach:** farbcodierte Prioritäts-Karten — Hausaufgaben:
      Coral = überfällig/heute, Amber = bald (1–3 Tage), Violet = entspannt,
      Lime-Fläche + grüner Haken = erledigt. Action-Buttons: direktes Abhaken an der
      Karte, Detail-Sheet mit „Als erledigt markieren“; Arbeiten mit Dringlichkeits-
      Tönung (Coral/Amber/Lime) + Pfeil in den Lernplan. Postfach: Briefe mit
      Amber-Karte + Inline-„Bestätigen“-Button (Coral = neu/ungelesen, Lime =
      bestätigt), Threads mit Coral-„Neu“-Rahmen.
- [x] Noten-Seite an Lime/Erfolgs-Farben angepasst: großer **Lime-Hero** (Ø-Schnitt,
      Noten-Anzahl, stärkstes Fach & größter Hebel in einer Karte).

### Phase 4 — UX-Polishing & Abnahme ✅ *abgeschlossen (2026-09-03)*
- [x] **Micro-Interactions:** `src/ui/motion.tsx` ausgebaut —
      · `PressableScale` mit Hover-Lift (Web, `hoverScale`) und sauberem
        `disabled`-Verhalten (BentoCards heben sich dezent an),
      · neu `PressableOpacity` (Spring-Opacity) als Standard für Text-Links und
        kleine Chips (Section-Header-Aktionen, „Alle ansehen", Widget-Links),
      · `FadeInUp`/`FadeInDown` tragen jetzt `LinearTransition`-Layout-Springs —
        Listen rutschen sanft nach, wenn Einträge abgehakt/verschoben werden.
      Fahrplan-Notiz: als Animations-Driver dient konsequent reanimated (wie in
      Phase 2/3); `@legendapp/motion` wurde bewusst *nicht* zusätzlich
      eingeführt, um kein zweites Motion-System zu schaffen.
- [x] **Hover (Web) überall:** NativeWind-`hover:`-Klassen auf Listenzeilen
      (ListRow, Widgets, Anhänge), Segment-Inaktiv-Chips, Fach-/Timetable-Karten,
      gluestack-Buttons (`hover:opacity-90`), Such-Chips, Kalender-Zellen,
      Retry-/Lock-Screens. Phone-Tab-Kapsel + Rail/Sidebar: haptisches Feedback
      (`hapticLight`) beim Tab-Wechsel.
- [x] **Touch-Targets ≥ 44 px:** zentrale Regel `touchSlopFor()` im `IconButton`
      (hitSlop ergänzt automatisch bis 44 px), `SegmentedControl`-Optionen
      `min-h-[44px]`, gluestack `sm` auf `h-11`, Noten-Rechner-Pills (Ziel +
      Simulation) auf 44 px, „Heute“-/Ansicht-Toggle im Stundenplan, Theme-
      Segmente, Krankmeldungs-/Beurlaubungs-Chips, Such-Vorschläge (hitSlop),
      Passwort-Augen (hitSlop 12), HA-Check-Button (hitSlop), Live-Island-Close
      (hitSlop 13). Sweep-Check: keine interaktive Fläche < 44 px (inkl. hitSlop).
- [x] **Dark-Mode-Stichprobe:** neues `--dark`-Flag in `scripts/smoke.mjs`
      (matchMedia → prefers-color-scheme) — alle 17 Routen auf Phone-Breite
      rendern fehlerfrei im dunklen Theme.
- [x] **Verifikation:** `npm run typecheck` ✅ · `npm run export:web` ✅ ·
      `npm run smoke:matrix` ✅ (17 Routen × Phone/Tablet/Desktop = 51 Kombinationen).
- [x] **Abschluss-Aufzeichnungen:** `docs/screenshots/` — 13 statische
      DOM-Snapshots des echten Renderings (5 Tabs × light/dark @ Phone,
      Dashboard/Stundenplan @ Desktop, Aufgaben dunkel @ Desktop; `--html-out`
      in smoke.mjs). Browser-Binary war in der Sandbox nicht installierbar
      (CDNs blockiert) — Live-Erlebnis der Micro-Interactions über
      `npm run serve:web` bzw. `npx expo start`.
- [x] Status auf **„Ready ✅"** gesetzt.

---

## 5. Technische Ankerpunkte (Repo-Karte)

| Datei | Zweck |
|---|---|
| `global.css` | CSS-Variablen (Light/Dark) — Palette primär hier pflegen (Web) |
| `tailwind.config.js` | NativeWind-Tokens (`canvas`, `surface`, `accent.*`, Radii) |
| `src/design/tokens.ts` | RN-Seitiges `palette`-Objekt (Shell, Detail-Screens) |
| `src/design/subjects.ts` | Fach-Farben (an neue Akzentpalette angleichen) |
| `src/ui/shell.tsx` | Bottom-Tab-Bar (Phone), Rail (Tablet), Sidebar (Desktop) |
| `app/(tabs)/_layout.tsx` | Tab-Navigator (Screens: index, timetable, tasks, grades, inbox) |
| `app/(tabs)/*.tsx` | Die 5 Haupt-Views |
| `app/*.tsx` | Detail-Screens (calendar, documents, settings, …) |
| `src/ui/primitives.tsx` | Wiederverwendbare UI-Bausteine (Cards, Badges, …) |

**Konvention:** Farb-Änderungen immer **drei**-fach pflegen:
`global.css` (CSS-Vars) → `tailwind.config.js` (Klassen) → `src/design/tokens.ts` (RN-Werte).

---

## 6. Verlauf / Session-Log

| Datum | Session | Ergebnis |
|---|---|---|
| 2026-09-03 | Relaunch-Kickoff | Briefing erhalten, `PROJECT_STATUS.md` angelegt, Warten auf GO für Phase-1-Code |
| 2026-09-03 | Phase 1 | ✅ Abgeschlossen: `src/ui/nav-reserve.ts` (globale Bottom-Nav-Reserve ≥100 px, M1) + Truncation-Fixes M3/M4/M5 in Dashboard, Stundenplan, Aufgaben, Postfach, Noten, Widgets, LiveIsland, Kalender, Suche, Thread. Typecheck + Smoke (Phone & Desktop) grün. |
| 2026-09-03 | Phase 2 | ✅ Abgeschlossen: Creme/Charcoal + Amber/Violet/Lime/Coral in CSS, NativeWind und RN-Tokens synchronisiert; globale Card-/Badge-Kontraste, Dark-Mode-Bridge und alle Detail-Screens einschließlich Onboarding/Live-Island migriert. PWA-/Native-Farben und Marken-Assets aktualisiert. Typecheck, Web-Export und vollständige 51er Smoke-Matrix grün. |
| 2026-09-03 | Phase 3 | ✅ Abgeschlossen: Dashboard-Welcome-Banner (Charcoal-Hero + Fortschritt + Heute-Statistik), Stundenplan als vertikale Tages-Timeline mit Tages-Pills (Phone; kein Mini-Kachel-Raster mehr), farbcodierte Prioritäts-Karten mit Action-Buttons in Aufgaben (Coral/Amber/Lime/Violet, direktes Abhaken, Detail-Sheet) und Postfach (Briefe mit Inline-Bestätigen, Neu-Akzente), Noten-Hero auf Lime. Typecheck + Smoke-Matrix (quick 18 Kombinationen + alle 5 Screens inkl. Tablets/Desktop + Nachrichten-Tab) grün. |
| 2026-09-03 | Phase 4 | ✅ **Ready.** Motion-Layer ausgebaut (PressableScale mit Hover/Disabled, neues PressableOpacity, LinearTransition-Layout-Springs in FadeInUp/Down), Hover-States webweit, Touch-Targets systematisch auf ≥ 44 px (touchSlopFor, min-h, hitSlop), Tab-Wechsel mit Haptik. Verifikation: typecheck ✅ · export:web ✅ · Smoke-Matrix 51/51 ✅ · Dark-Mode-Stichprobe 17/17 ✅ (neues `--dark`-Flag). Abschluss-Aufzeichnungen in `docs/screenshots/` (13 statische DOM-Snapshots). |
| 2026-09-04 | Farbflächen-Redesign Phase 1 | ✅ **Design-System-Fundament** (`docs/redesign-phasen.md`): feste Block-Palette (13 Farbfamilien + `onBlocks` + Dark-Varianten) und Prioritäts-Ampel (Coral/Amber/Lime) in RN-Tokens/CSS/Tailwind/Tamagui; Radius-Skala 28/24/20/999; `typeScale`; neue Komponenten `IconBadge`, `ColorBlockCard` (+`BlockText`/`BlockCaption`/`useBlockInk`), `StatCard`/`StatNumber`; `Pill`/`Chip` fetter mit Radius 20 + Icon; `SegmentedControl` 48 px/Pillen-Track; `Card`/`BentoCard` randlos; Fachfarben auf Block-Palette + `categories.ts`; Emoji-/`tint()`-Bugs gefixt. Typecheck ✅ · Smoke-Matrix (quick, 18 Kombis) + Dark-Stichproben ✅. |
