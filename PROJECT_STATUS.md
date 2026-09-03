# PROJECT_STATUS.md — SchulFlow Design-Relaunch

> **Single Source of Truth** für den UI-Relaunch. Diese Datei wird zu Beginn jeder
> Session gelesen und nach jeder erledigten Phase aktualisiert.
> Letztes Update: 2026-09-03 · Status: **Phase 1 — abgeschlossen ✅ (wartet auf GO für Phase 2)**

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
| M2 | Lila/Pastell-Header-Fläche widerspricht Ziel-Look | Dashboard & Tabs | 2 |
| M3 | ~~Datum „Donnerstag, 3. …" abgeschnitten~~ **✅ gefixt** — Dashboard stapelt Wochentag (27 px/800) + Datum darunter | Dashboard-Header | 1 ✅ |
| M4 | ~~Fächernamen „Mathe…" abgeschnitten~~ **✅ gefixt** — Stundenplan-Kacheln 2-zeilig bzw. shrink-to-fit; Dashboard/Inbox/Noten 2-zeilig | Timetable, Widgets, Listen | 1 ✅ |
| M5 | ~~Tab-Header „Hausaufga…" abgeschnitten~~ **✅ gefixt** — `SegmentedControl` 12,5 px + shrink-to-fit + kompaktere Badges | Tasks & Inbox | 1 ✅ |
| M6 | Alles ist gleichförmige Pastell-Pille → keine Hierarchie | global | 2/3 |
| M7 | Pastell-Tokens (periwinkle-soft etc.) wirken „AI-Slop" | tokens/tailwind/global.css | 2 |

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

### Phase 2 — Design-System & Theme 🔄
- [ ] Neue Tokens in `src/design/tokens.ts`, `tailwind.config.js`, `global.css`
      (Creme-Canvas, Charcoal, Amber/Violet/Lime/Coral; alte Pastell-Tokens raus)
- [ ] Globale Card-Styles überarbeiten: Radii 20–28, Reinweiß-Flächen,
      kontrastreiche Badges (Charcoal-Chip / Amber-Chip / Lime-Chip)
- [ ] Dark-Mode-Ableitung der neuen Palette
- [ ] Lila Header-Flächen entfernen/ersetzen

### Phase 3 — Komponentenseiten-Redesign 🔄
- [ ] **Dashboard/Home:** fettes Welcome-Banner (Charcoal- oder Amber-Fläche),
      klare Progress-Anzeige, Hero-Karten im Referenz-Stil
- [ ] **Stundenplan:** vertikale Tages-Timeline + horizontale Tages-Pills,
      Fächer voll lesbar (keine Minikachel-Truncation)
- [ ] **Aufgaben & Postfach:** farbcodierte Prioritäts-Karten
      (Coral = dringend, Amber = bald, Lime = erledigt/ok) mit Action-Buttons
- [ ] Noten-Seite an Lime/Erfolgs-Farben anpassen

### Phase 4 — UX-Polishing & Abnahme 🔄
- [ ] Micro-Interactions: Press-States (Scale/Opacity), Hover (Web), sanfte
      Layout-Animationen (`@legendapp/motion` vorhanden)
- [ ] Abstände/Touch-Targets auf Mobile prüfen (≥44 px)
- [ ] Dark-Mode-Stichprobe, typecheck + smoke
- [ ] Status hier auf **„Ready ✅"** setzen + Abschluss-Screenshots

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
| 2026-09-03 | Phase 1 | ✅ Abgeschlossen: `src/ui/nav-reserve.ts` (globale Bottom-Nav-Reserve ≥100 px, M1) + Truncation-Fixes M3/M4/M5 in Dashboard, Stundenplan, Aufgaben, Postfach, Noten, Widgets, LiveIsland, Kalender, Suche, Thread. Typecheck + Smoke (Phone & Desktop) grün. Nächster Schritt: GO für Phase 2 (Design-Tokens/Theme). |
