# Schulflow — Redesign Phasenplan (9 Phasen)

> **Verbindlicher Master-Plan** für das Redesign von Schulflow nach den vier Referenz-Screens
> (Bildungs-Dashboard, Kalender/Task-App, Chat-App, Job-App).
> 
> Leitmotiv: **Satte Farbflächen statt dünner Umrandungen**, große Eck-Radien (28px / 20px / voll rund),
> riesige Stat-Zahlen, Icon-Badges im farbigen Kreis, Pill-Tags und eine schwebende schwarze Pill-Nav.

---

## 0. Ziel-Designsprache & Kernprinzipien

| Prinzip | Spezifikation & Umsetzung |
|---|---|
| **Farbflächen statt Umrandungen** | Karten sind vollflächig in satten Pastell- oder Akzenttönen eingefärbt (Fachfarben, Kategorie-Töne, Dringlichkeits-Farben) — keine weißen Karten mit dünnen 1px-Borders mehr. |
| **Große, fette Typografie** | Überschriften 800/Extrabold, Stat-Zahlen riesig (32–44px) + prägnante kleine Captions (11–13px) statt langer Fließtexte. |
| **Radien & Formen** | Große Karten: `borderRadius: 28px` (`cardLg`). Pills/Chips: `20px` (`rounded-full`). Avatare, Icon-Badges, Checkboxen, Nav: voll rund. |
| **Icon-Badges** | Einheitliche Komponente: Vollfarbiger Kreis (`w-10 h-10` bis `w-12 h-12`) mit zentriertem Lucide-Vektor-Icon in abgestimmter Kontrastfarbe. |
| **Pill- & Chip-Tags** | Kompakte Tags mit abgerundeten Ecken für Fächer, Fälligkeiten, Prioritäten, Raum und Vertretung. |
| **Schwarze Pill-Bottom-Nav** | Schwebende Kapsel (`#18191C`), reine Vektor-Icons, aktiver Tab mit farbigem Akzentpunkt/Glow und weicher Reanimated-Federung. |
| **Weiche Schatten** | Subtile, warme Schatten (`shadow.card` / `shadow.float`) zur Tiefenstaffelung ohne harte Trennlinien. |
| **Verspielte Details** | Kleine Vektor-Grafiken / Illustrationen bei leeren Zuständen („Kein Unterricht heute“), Konfetti/Fülleffekte beim Erledigen. |

---

## Phasen-Übersicht & Abhängigkeiten

```
[Phase 1: Design-System-Fundament]
       │
       ▼
[Phase 2: Navigation & App-Shell]
       │
       ├───────────────────┬───────────────────┬───────────────────┐
       ▼                   ▼                   ▼                   ▼
[Phase 3: Dashboard]   [Phase 4: Stundenplan]  [Phase 5: Aufgaben] [Phase 6: Noten]
       │                   │                   │                   │
       └───────────────────┼───────────────────┴───────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
[Phase 7: Postfach]                    [Phase 8: Einstellungen]
       │                                       │
       └───────────────────┬───────────────────┘
                           │
                           ▼
               [Phase 9: Politur & Regression]
```

---

## Phase 1: Design-System-Fundament

### Ziel
Bereitstellung der erweiterten Design-Tokens, Farbpaletten (inkl. satter Kategoriestile und Fachfarben), Typografie-Skala und wiederverwendbarer UI-Primitives für das gesamte Farbflächen-System.

### Betroffene Dateien & Komponenten
- `src/design/tokens.ts` (Erweiterte Farb-Tokens, Kategorie-Farben, Radien, Typo-Tokens, Kontrastberechnungen)
- `src/design/subjects.ts` (Sattere Fachfarben, Fach-Icon-Zuordnung für Badges, Kontrastvordergründe)
- `src/ui/primitives.tsx`:
  - `ColorBlockCard` (Vollflächige Farbkarte mit Radius 28px, automatischer Kontrastanpassung, weichem Schatten, optionalem Pressable-Effekt)
  - `IconBadge` (Kreisförmiger Icon-Container mit anpassbarer Hintergrundfarbe, Icon-Größe und zentriertem Lucide-Icon)
  - `StatCard` (Riesige Zahl 32–44px fett + kleine Caption + optionales Icon-Badge / Progress)
  - `Pill` & `Chip` (Farbige Status-Pills mit soliden und getönten Varianten)
  - `SegmentedControl` (Farbflächen-optimiert, klare aktive Segmente)
- `src/ui/icon.tsx` (Typen & Icon-Helper)
- `global.css` & `tailwind.config.js` (CSS-Variablen & Utility-Klassen synchronisieren)

### Akzeptanzkriterien
1. `ColorBlockCard`, `IconBadge`, `StatCard`, `Pill`, `SegmentedControl` sind sauber typisiert und exportiert.
2. Alle Farbflächen berechnen Text- und Icon-Farben automatisch kontraststark (`foregroundOn`).
3. Farbpalette unterstützt Light- und Dark-Mode harmonisch.
4. `npm run typecheck` ist fehlerfrei.

### Abhängigkeiten
Keine — Basis für alle weiteren Phasen.

---

## Phase 2: Navigation & App-Shell

### Ziel
Schärfung der schwebenden schwarzen Pill-Bottom-Nav (Aktiver Tab mit farbigem Akzent-Dot/Glow), einheitliche Header-Patterns und Härtung des Routings.

### Betroffene Dateien & Komponenten
- `app/(tabs)/_layout.tsx` (FloatingTabBar mit Glow/Akzent-Dot, sauberer Reserve-Höhe, Haptik)
- `src/ui/shell.tsx` (Tablet-Rail & Desktop-Sidebar anpassen)
- `src/ui/nav-reserve.ts` (Zentrale Reserve-Höhe zur Vermeidung von Content-Überlagerungen)

### Akzeptanzkriterien
1. Schwebende Bottom-Nav hat eine klare schwarze Kapselform mit zentrierten Icons.
2. Aktiver Tab besitzt einen dezenten Akzent-Hintergrund + leuchtenden Akzent-Dot darunter.
3. Tab-Wechsel federt sanft (`withSpring`) und liefert leichtes haptisches Feedback.
4. Scroll-Container in allen Tabs haben genügend Bottom-Padding (kein Abschneiden hinter der Nav).

### Abhängigkeiten
Basiert auf Phase 1.

---

## Phase 3: Dashboard / Home

### Ziel
Vollflächiges Redesign des Dashboard-Feeds: Hero-Block beibehalten & schärfen, Sektionskarten in satten Kategorie-Farbblöcken (Lavendel, Mint, Apricot, etc.), riesige Stat-Zahlen, große Icon-Badges im farbigen Kreis und ansprechender Empty State („Kein Unterricht heute“ mit Illustration).

### Betroffene Dateien & Komponenten
- `app/(tabs)/index.tsx` (Dashboard Hauptscreen, Hero-Banner, Begrüßung, Heute-Zusammenfassung)
- `src/features/dashboard/widgets.tsx` (Widgets für Nächste Stunde, Stundenliste, Klassenarbeiten, Noten, Elternbriefe, Schwarzes Brett, Schnellaktionen)
- Bugfixes auf dem Dashboard (Layout-Sprünge, Datumsanzeigen, Leere Widgets)

### Akzeptanzkriterien
1. Hero-Karte zeigt Wochentag/Datum fett, Fortschrittsbalken und Heute-Statistiken in großen Zahlen.
2. Nächste Stunde & Widget-Karten sind als vollflächige Farbblöcke (Lavendel für Briefe, Mint für Arbeiten, Apricot/Orange für Termine/Postfach) gestaltet.
3. Jede Sektion besitzt ein großes `IconBadge` im runden Kreis.
4. Wenn kein Unterricht stattfindet, erscheint eine verspielte grafische Leer-Illustration.

### Abhängigkeiten
Basiert auf Phase 1 & 2.

---

## Phase 4: Stundenplan (inkl. 2-Wochen-Stack-Ansicht)

### Ziel
**Wichtigste Neuerung:** Beide Wochen (Woche 1 & Woche 2) werden gestapelt gleichzeitig als zwei horizontale Tage-Streifen dargestellt. Kein Pfeil-Wechsel mehr nötig — voller 14-Tage-Überblick auf einen Blick. Stunden-Karten als vollflächige Fach-Farbblöcke mit auffälligen Status-Badges (Vertretung/Ausfall).

### Betroffene Dateien & Komponenten
- `app/(tabs)/timetable.tsx` (Haupt-Stundenplan-Screen, 2-Wochen-Header, vertikale Timeline, Detail-Sheet)
- `src/features/island/LiveIsland.tsx` (Live-Island-Kapsel)
- Bugfixes (Tageswechsel, Feiertage/Wochenenden, Raum-/Lehrkraftanzeige bei Vertretungen)

### Akzeptanzkriterien
1. Auf Phones sind Woche 1 und Woche 2 als zwei direkt untereinanderliegende horizontale Wochentag-Streifen sichtbar.
2. Jeder Wochentag-Pill zeigt Wochentag, Datum und Status-Punkte (grün = Vertretung, grau = Ausfall).
3. Der ausgewählte Tag hat eine volle Orange-Füllung (`#FF8C38`) mit weißem/dunklem Text.
4. Stundenkarten sind vollflächige Farbblöcke in der jeweiligen Fachfarbe.
5. Vertretungen und Entfälle sind mit auffälligen, farbigen Badges sofort erkennbar.

### Abhängigkeiten
Basiert auf Phase 1 & 2.

---

## Phase 5: Aufgaben (Hausaufgaben / Arbeiten / Lernplan)

### Ziel
Aufgaben-Tabs zu vollflächigen Farbblöcken umbauen: Hausaufgaben in Fachfarben mit großer runder Checkbox & Fülleffekt; Arbeiten mit gesättigter Dringlichkeits-Ampel (Coral / Amber / Lime) + Fach-Icon-Badges; Lernplan mit fetter Dauer-Pill.

### Betroffene Dateien & Komponenten
- `app/(tabs)/tasks.tsx` (Segmented Tabs: Hausaufgaben, Klassenarbeiten, Lernplan, Detail-Sheets)
- `src/features/tasks/studyplan.ts` (Lernplan-Berechnung)
- Bugfixes (Checkbox-Hitbox, Fälligkeits-Filter, Status-Aktualisierung)

### Akzeptanzkriterien
1. Hausaufgaben-Karten sind vollflächige Fachfarb-Blöcke; Fälligkeit oben rechts ist fett hervorgehoben.
2. Checkbox ist groß, voll rund und animiert beim Abhaken mit sanftem Fülleffekt.
3. Klassenarbeiten zeigen eine kräftig gesättigte Ampel (Coral für <3 Tage, Amber für bald, Lime für entspannt) + Fach-Icon-Badge.
4. Lernplan-Einheiten sind konsistent als Farbblöcke mit fetter Zeit-/Dauer-Pill gestaltet.

### Abhängigkeiten
Basiert auf Phase 1 & 2.

---

## Phase 6: Noten

### Ziel
Feinschliff der Notenübersicht: Großer grüner Stat-Block oben veredeln, Notenkarten der Fächer in satteren Pastelltönen mit Fach-Icon-Badges und extra großen Notenzahlen; Mini-Trendanzeige/Entwicklung je Fach.

### Betroffene Dateien & Komponenten
- `app/(tabs)/grades.tsx` (Notenübersicht, Fachdetail-Modal, Notenrechner & Simulator)
- `src/features/grades/calculator.ts` (Schnitt- & Zielnoten-Berechnung)
- Bugfixes (Gewichtungsanzeige, Datenschutz-Blur, Dezimalstellen)

### Akzeptanzkriterien
1. Grüner Gesamtnoten-Hero-Block hebt Schnitt und Hebel mit riesigen Zahlen hervor.
2. Jede Fachkarte besitzt ein farbiges `IconBadge` und eine große, fette Notenziffer.
3. Notenverlauf/Trend ist visuell durch einen Fortschrittsbalken oder Mini-Trendline dargestellt.
4. Notenrechner („Welche Note brauche ich?“) und Simulator funktionieren nahtlos.

### Abhängigkeiten
Basiert auf Phase 1 & 2.

---

## Phase 7: Postfach

### Ziel
Umbau des Postfachs (Elternbriefe, Nachrichten, Schwarzes Brett): Schwarzes Brett nach Kategorien vollflächig einfärben (Sekretariat = Blau, Bibliothek = Grün, AG = Lila, Fundsachen = Orange); Briefe als vollflächige Farbflächen mit integriertem Bestätigen-Button; Nachrichten-Threads mit klaren Indikatoren.

### Betroffene Dateien & Komponenten
- `app/(tabs)/inbox.tsx` (Tabs: Briefe, Nachrichten, Schwarzes Brett, Detail-Modal)
- `app/thread.tsx` (Nachrichten-Verlauf)
- Bugfixes (Lesebestätigung senden, Anhänge öffnen, Ungelesen-Zähler)

### Akzeptanzkriterien
1. Brief-Karten nutzen vollflächige Farbtöne (z. B. Amber bei offener Bestätigung, Lime bei erledigt).
2. Der „Bestätigen“-Button ist direkt auf der Karte und im Detail-Sheet erreichbar.
3. Aushänge auf dem Schwarzen Brett sind nach Kategorie in Blau, Grün, Lila oder Orange vollflächig eingefärbt.
4. Nachrichten-Threads besitzen große Icon-Badges / Avatare und klare Ungelesen-Pills.

### Abhängigkeiten
Basiert auf Phase 1 & 2.

---

## Phase 8: Einstellungen

### Ziel
Modernisierung der Einstellungen weg vom generischen Android-Listen-Look: Jede Sektion (Erscheinungsbild, Datenschutz, Module, Konto, Info) wird zur farbig hinterlegten Karte mit großem Icon-Badge; Toggle-Zeilen mit großzügigem Weißraum ohne dünne Linien; vergrößerte Segmented Controls und Modul-Chips.

### Betroffene Dateien & Komponenten
- `app/settings.tsx` (Einstellungen, Untermenüs, Theme-Wahl, Modul-Schalter, Konto)
- `app/onboarding.tsx` (Onboarding-Karten im neuen Farbflächen-Stil)
- Bugfixes (Theme-Umschaltung ohne Flackern, SecureStore-Speicherung, Reset-Aktionen)

### Akzeptanzkriterien
1. Einstellungen sind in thematische `ColorBlockCard`-Sektionen gegliedert.
2. Jede Sektion trägt ein markantes `IconBadge` im farbigen Kreis.
3. Schalter und Toggles sind mit ausreichend Spacing gruppiert, ohne 1px-Trennlinien.
4. Theme-Auswahl (Hell / Dunkel / System) ist als große, griffige Segment-Pill ausgeführt.

### Abhängigkeiten
Basiert auf Phase 1 & 2.

---

## Phase 9: Politur, Cross-Screen-Konsistenz & Regression

### Ziel
Abschließende Qualitätsprüfung über die gesamte App: Micro-Animations-Feinschliff, einheitliche Empty States auf allen Screens, Sweep gegen verbleibende visuelle oder funktionale Bugs, Verifikation der automatisierten Testsuite.

### Betroffene Dateien & Komponenten
- Alle Modal- und Stack-Screens (`calendar.tsx`, `attendance.tsx`, `documents.tsx`, `search.tsx`, `sick-note.tsx`, `exemption.tsx`, `parent-talks.tsx`, `payments.tsx`)
- `src/ui/motion.tsx` (Spring-Interaktionen, Übergänge)
- Test-Skripte (`scripts/smoke.mjs`, `scripts/smoke-matrix.mjs`)

### Akzeptanzkriterien
1. Konsistente Designsprache über alle Tabs und Modal-Screens (keine vergessenen weißen 1px-Listenkarten).
2. Alle Touch-Targets ≥ 44px, weiche Hover- und Pressable-Feedbacks.
3. `npm run typecheck` fehlerfrei (0 Fehler).
4. `npm run export:web` baut ohne Warnungen/Fehler.
5. Smoke-Matrix läuft über alle 17 Routen und Breakpoints vollständig grün durch.

---

## Status-Tracking

| Phase | Bezeichnung | Status |
|---|---|---|
| Phase 1 | Design-System-Fundament | ⏳ In Bearbeitung |
| Phase 2 | Navigation & App-Shell | ⏹️ Ausstehend |
| Phase 3 | Dashboard / Home | ⏹️ Ausstehend |
| Phase 4 | Stundenplan (2-Wochen-Stack) | ⏹️ Ausstehend |
| Phase 5 | Aufgaben (HA, Arbeiten, Lernplan) | ⏹️ Ausstehend |
| Phase 6 | Noten | ⏹️ Ausstehend |
| Phase 7 | Postfach | ⏹️ Ausstehend |
| Phase 8 | Einstellungen | ⏹️ Ausstehend |
| Phase 9 | Politur & Regression | ⏹️ Ausstehend |
