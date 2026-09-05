# Schulflow – Redesign-Phasenplan („Farbflächen-Stil“)

> **Master-Dokument für den Redesign-Auftrag.** Verbindliche Planungs- und
> Abnahmequelle für alle Phasen (1–9 Grundredesign, 10–15 Ergänzung aus
> „Redesign-Auftrag Teil 2“). Status wird nach jeder abgeschlossenen Phase
> hier aktualisiert; funktional entscheidende Punkte werden im
> **Entscheidungs-Log** (unten) dokumentiert.
>
> Auftrag: Schulflow visuell an vier Referenz-Screens angleichen
> (Bildungs-App-Dashboard, Kalender-/Task-App, Chat-App, Job-App). Alle vier
> teilen dieselbe Design-Sprache: **Farbflächen statt Umrandungen, große fette
> Typografie, riesige Radien, Icon-Badges, Pill-Tags, schwarze Pill-Nav,
> weiche Schatten.**
>
> Stand: 2026-09-05 · **Phasen 1–9 umgesetzt ✅ · Phase 10 ✅ · Phase 11 ✅ ·
> Phase 12 teilweise ✅ (Haptik, Screen-Transitionen) · Phase 13 teilweise ✅
> (Island: Web-Pille über der Tab-Bar, nativ abgeschaltet) · Phasen 14–15 geplant.**
>
> Die Phasen 10–15 kommen aus dem Auftrag „Teil 2 (Bugfixes & neue
> Anforderungen)“ und sind die Fortsetzung dieses Dokuments: 10 APK-Styling &
> Layout, 11 Schulmanager-API im Browser, 12 Grundqualität & Bugs, 13 Live
> Island → Live Activities, 14 Einstellungen-Umbau, 15 Stundenplan-Umschalter.

---

## 0. Zielstil – Kernprinzipien (für alle Phasen verbindlich)

| # | Prinzip | Konkretisierung |
|---|---------|-----------------|
| 1 | **Farbflächen statt Umrandungen** | Karten sind vollflächig eingefärbt (satte Pastell- oder Vollfarben aus der Block-Palette). Weiße Karten mit dünnem Rand (`border border-line`) sind auf Standardkarten **verboten** — nur noch weiche Schatten. |
| 2 | **Große, fette Überschriften** | Screen-Titel 28 px / weight 800. Keine kleinen Labels als Überschrift. |
| 3 | **Große Eck-Radien** | 28 px auf großen Karten (32 px auf Hero-Blöcken), 20 px auf Chips/Pills, voll rund bei Avataren/Nav/Icon-Badges. |
| 4 | **Statistiken als riesige Zahl + Caption** | Zahl 34–56 px / 800, Caption 10–11 px uppercase. Kein Fließtext für Zahlen. |
| 5 | **Icon-Badges** | Farbigem Kreis mit zentriertem Icon — **eine** einheitliche Komponente (`IconBadge`), überall wiederverwendet. Keine nackten Icons, keine eckigen Icon-Kacheln mehr. |
| 6 | **Pill-/Chip-Tags** | Für Kategorie, Priorität, Status: `Pill`/`Chip` mit 20-px-Radius, fett, optional mit Icon. |
| 7 | **Schwarze Pill-Bottom-Nav** | Bleibt schwarze (Charcoal-)Kapsel mit reinen Icons; Active-Tab farbiger Punkt/Glow (Phase 2). |
| 8 | **Weiche Schatten statt Trennlinien** | `shadow.card`/`shadow.float`; `Divider` nur noch ausnahmsweise innerhalb von Gruppen. |
| 9 | **Verspielte Illustrationen** | Leerer Zustand mit kleiner SVG-Illustration statt nur Icon+Text (ab Phase 3, final Phase 9). |

### Design-System-Vorgaben (verbindlich, umgesetzt in Phase 1)

- **Radius:** `card = 28 px`, `cardLg = 32 px` (Heroes), `cardSm = 24 px`,
  `chip = 20 px`, `pill/avatar/nav = voll rund (999)`.
- **Farben:**
  - **Feste Fachfarben-Palette** (`palette.blocks`, 13 Farbfamilien mit
    passendem Vordergrund `onBlocks` und Dark-Varianten): `violet, lavender,
    sky, teal, mint, lime, sun, amber, apricot, coral, pink, slate, charcoal`.
  - **Feste Prioritätsfarben** (`palette.priority`): `urgent = Coral`,
    `soon = Amber`, `ok = Lime` — für Dringlichkeits-Ampeln überall identisch.
  - **Kategorie-Farbfamilie** für Sektions-/Brett-Karten (Phase 3/7):
    Elternbriefe = Lavendel, Klassenarbeiten = Mint, Postfach = Apricot,
    Sekretariat = Sky (Blau), Bibliothek = Mint (Grün), AG-Anmeldung = Violet
    (Lila), Fundsachen = Amber (Orange).
- **Typografie:** `typeScale` — `display 38/800`, `title 28/800`,
  `stat 44/800`, `statLg 56/800`, `headline 18/700`, `body 15/500`,
  `caption 12/600`, `label 10.5/800 uppercase`. Fließtext reduziert (max. 2
  Zeilen Hint pro Karte).
- **Schatten:** weich (`shadow.card` für Karten, `shadow.float` für
  schwebende Elemente) — **kein sichtbarer Rand mehr auf Standardkarten**.
- **Icon-Badges:** `IconBadge` (Kreis, Farbe, Icon zentriert; Größen
  sm 28 / md 36 / lg 44 / xl 56; Varianten `solid` = Vollfarbe und `tint` =
  14-%-Tönung).
- **Bottom-Nav:** schwarze Pill bleibt; Active-Tab farbiger Punkt + Glow
  (Umsetzung in Phase 2).

### Wiederverwendbare Kern-Komponenten (Phase 1)

| Komponente | Zweck | Ersatz für |
|---|---|---|
| `ColorBlockCard` | Vollflächige Farbkarte (Radius 28, Schatten, kein Rand, optional pressbar); stellt Context für automatische Vordergrundfarbe bereit (`useBlockInk`, `BlockText`, `BlockCaption`) | weiße Karte + Farbrand |
| `IconBadge` | Einheitlicher farbiger Icon-Kreis (`solid`/`tint`, 4 Größen) | alle handgebauten Icon-Kacheln |
| `Pill` / `Chip` | Fette Tag-Pills (Radius 20, optional Icon, `tint`/`solid`/`outline`) | duenne Text-Chips |
| `StatCard` / `StatNumber` | Riesige Zahl + kleine Caption (plain oder als Farbblock) | Fließtext-Statistiken |
| `SegmentedControl` | Größer/fetter (min-h 48, runde Track-Pille, aktives Segment weiß + Schatten) | schmale Tabs |
| `Card` | Weiße Surface-Karte **ohne Rand**, Radius 28, weicher Schatten | Karte mit `border-line` |

---

## Phase 1 — Design-System-Fundament

**Status: ✅ umgesetzt (2026-09-04)**

### Ziel

Das Fundament für alle Folgephasen: verbindliche Farb-, Radius-, Typo- und
Spacing-Tokens sowie die wiederverwendbaren Kern-Komponenten
(`ColorBlockCard`, `IconBadge`, `Pill`, `StatCard`, `SegmentedControl`) — in
allen drei Ebenen gepflegt (RN-Tokens `src/design/tokens.ts`, CSS-Variablen
`global.css`, Tailwind `tailwind.config.js`; Tamagui-Konfiguration
mitgezogen).

### Betroffene Dateien / Komponenten

- `src/design/tokens.ts` — Block-Palette (13 Farbfamilien + `onBlocks` +
  Dark-Varianten), `priority`-Tokens, Radius-Skala (28/24/20/999),
  `typeScale`, erweitertes `space`, `foregroundOn`/`resolveThemeColor` für
  Blocks.
- `global.css` + `tailwind.config.js` — `--sf-block-*`, `--sf-priority-*`,
  `--sf-on-block-*`; Tailwind-Farben `block.*`, `priority.*`; Radius-Skala.
- `src/design/tamagui.config.ts` — Blocks & Priority als Tamagui-Tokens.
- `src/design/subjects.ts` — feste Fachfarben-Palette auf Basis der Blocks
  (kuratiert für die häufigsten deutschen Schulfächer), deterministischer
  Fallback über die volle Palette, `tint()`-Härtung.
- `src/design/categories.ts` — **neu**: Kategorie→Block-Zuordnung
  (Sekretariat/Bibliothek/AG/Fundsachen/…) für Phasen 3 & 7.
- `src/ui/primitives.tsx` — `Card` (randlos, 28), `Title`/`Display`
  (größer/fetter), **neu:** `IconBadge`, `ColorBlockCard` (+ `useBlockInk`,
  `BlockText`, `BlockCaption`), `StatCard`, `StatNumber`; `Pill`/`Chip`
  (Radius 20, fetter, Icon-fähig), `SegmentedControl` (min-h 48, Pille),
  `SectionHeader`/`ListRow`/`EmptyState` auf `IconBadge` umgestellt,
  `EmptyState.illustration`-Hook für Phase 3/9.
- `src/features/dashboard/widgets.tsx` — **nur** `WidgetHeader` +
  Schnellaktionen-Kreise auf `IconBadge` umgestellt (geteilter Baustein, kein
  Screen-Redesign).

### Akzeptanzkriterien

- [x] Block-Palette mit 13 Farbfamilien existiert in Light **und** Dark,
      inkl. passender Vordergrundfarben (`onBlocks`) und ist über
      `foregroundOn()`/`resolveThemeColor()` robust auflösbar.
- [x] `priority = { urgent: Coral, soon: Amber, ok: Lime }` ist als Token
      (RN/CSS/Tailwind) verfügbar.
- [x] Radius-Skala: `card 28 / cardLg 32 / cardSm 24 / chip 20 / pill 999`
      in Tokens, Tailwind und Tamagui.
- [x] `typeScale` dokumentiert alle Textstufen; `Title` = 28 px / 800,
      `Display` = 38 px / 800, Stat-Zahlen-Komponenten (44/56 px) vorhanden.
- [x] `Card` hat keinen sichtbaren Rand mehr, Radius 28, weichen Schatten.
- [x] `IconBadge` ist die einzige Icon-Kachel-Komponente; `SectionHeader`,
      `ListRow`, `EmptyState`, `WidgetHeader` und die Schnellaktionen nutzen
      sie.
- [x] `ColorBlockCard` rendert vollflächige Farbkarten ohne Rand, mit
      Schatten, optional pressbar (Press-Scale) und stellt die
      Vordergrundfarbe über Context bereit.
- [x] `Pill`/`Chip`: Radius 20, fetter Text, optionales Icon,
      `tint/solid/outline`.
- [x] `StatCard` zeigt Zahl groß + Caption klein, plain und als Farbblock.
- [x] `SegmentedControl` min-h 48 px, runde Pille, aktives Segment weiß mit
      Schatten, Label fetter.
- [x] Fachfarben: kuratierte Map auf Block-Basis; gleiches Fach ⇒ gleiche
      Farbe; Fallback zyklisch über die ganze Palette.
- [x] Kein neuer sichtbarer Rand auf Standardkarten; bestehende Screens
      brechen nichts (keine API-Breaks außer Optik).
- [x] `npm run typecheck` grün; Smoke-Test (Web-Bundle) rendert App ohne
      Laufzeitfehler in Light **und** Dark.

### Behobene Bugs (Phase 1)

- `subjects.ts`: Englisch-Emoji war ein halbes Regional-Indicator-Zeichen
  (`'🇬'`, rendert als kaputte Flagge/tofu) → vollständiges `🇬🇧`.
- `tint()` erzeugte bei ungültigen Hex-Werten `rgba(NaN, …)`-Styles
  (unsichtbarer Fehler) → Härtung mit Fallback auf transparent.
- `foregroundOn()` kannte die neuen Block-Farben nicht → explizite
  Block-Prüfung mit `onBlocks` (kein Rückfall auf Heuristik).
- `Chip`/`Pill`-Text konnte bei langen Labels ohne `numberOfLines`-Schutz
  aus der Pill laufen → einzeilig geklemmt (bleibt).

### Abhängigkeiten

Keine — Phase 1 ist Fundament für **alle** Folgephasen (2–9 nutzen
Tokens + Komponenten).

---

## Phase 2 — Navigation & App-Shell

**Status: ✅ umgesetzt (2026-09-04)**

### Umsetzung

- `ScreenHeader` als gemeinsames Tab-Pattern ergänzt und auf Start,
  Stundenplan, Aufgaben, Noten und Postfach angewendet.
- Mobile Floating-Nav mit animiertem Amber-Halo + Aktivpunkt ergänzt; Rail
  und Sidebar teilen nun `IconBadge`, Amber-Active-Pill und dieselbe
  Zählerformatierung.
- `useSafeBack()` sichert modal geöffnete Deep-Links mit einem Start-/Postfach-
  Fallback ab; bekannte Haupt-Tabs werden gezielt per `navigate` statt Stack-
  Push aktiviert.

### Ziel

Bottom-Nav-Feinschliff und ein einheitliches Header-Pattern pro Screen; alle
Routing-/Navigations-Bugs fixen. Die App-Shell sieht auf allen Screens
identisch aus.

### Betroffene Screens / Komponenten

- `app/(tabs)/_layout.tsx` — `FloatingTabBar`, `AnimatedTabItem`.
- `src/ui/shell.tsx` — Rail/Sidebar (Tablet/Desktop), Markenblock.
- `src/ui/primitives.tsx` — `ScreenHeader`-Pattern (neu oder konsolidiert):
  großer Screen-Titel (28/800) + optionale Kopfaktion rechts.
- Alle Tab-Screens (`index`, `timetable`, `tasks`, `grades`, `inbox`) —
  Header-Vereinheitlichung.
- Navigations-Bugs: Deep-Links/`router.push`-Ziele, Back-Behavior bei
  Modals, `href: null`-Handling (Noten ohne Modul), Badge-Zähler-Stand.

### Akzeptanzkriterien

- [x] Active-Tab der schwarzen Pill-Nav hat einen farbigen Punkt und einen
      sanften Amber-Glow; inaktive Icons bleiben ruhig.
- [x] Badges (Aufgaben/Postfach) werden zentral bereinigt, zeigen maximal
      „99+“ und liegen in Bottom-Nav, Rail und Sidebar positionssicher.
- [x] Einheitlicher `ScreenHeader`: Titel 28/800 links, Kopfaktion (Icon,
      Pill oder Switch) rechts, identischer vertical rhythm auf allen 5 Tabs.
- [x] Rail (Tablet) und Sidebar (Desktop) folgen demselben Stil (`IconBadge`,
      Active-Pill mit Amber-Tönung, Schattenkante statt dünner Trennlinie).
- [x] Routing-Bugs behoben: Tab-Ziele nutzen `navigate` und erhalten dadurch
      ihre Scrollposition; `useSafeBack()` schließt modale Deep-Links sicher;
      `href: null` bei Noten leitet direkte Ziele zurück und wird weder über
      Suche noch Dashboard-Insights angeboten.
- [x] Jeder Tab-Scrollbereich einschließlich Dashboard nutzt die bestehende
      Bottom-Nav-Reserve; kein Inhalt wird von der schwebenden Nav verdeckt.

### Abhängigkeiten

Benötigt Phase 1 (IconBadge, Tokens). Blockiert Phase 3–8 (Header-Pattern
wird von allen Screens genutzt).

---

## Phase 3 — Dashboard / Home

**Status: ✅ umgesetzt (2026-09-04)**

### Umsetzung

- Das gesamte Widget-Registry rendert jetzt randlose `ColorBlockCard`-
  Farbflächen. Elternbriefe sind Lavendel, Klassenarbeiten Mint, die nächste
  Stunde übernimmt die Fachfarbe und Brett-Aushänge leiten ihre Farbe über
  `categories.ts` ab.
- Dashboard-Icons laufen über `IconBadge` in Größe lg/xl; die großen Zahlen
  im Hero sowie Arbeiten und Fehlzeiten sind `StatCard`s.
- Die SVG-Illustration `NoLessonsIllustration` ersetzt den alten reinen
  „Kein Unterricht“-Iconzustand in beiden Stundenplan-Widgets.

### Ziel

Redesign des Dashboards auf Farbflächen-Prinzip: jede Sektionskarte erhält
eine eigene satte Hintergrundfarbe je Kategorie; Icon-Badges vergrößert;
Stat-Zahlen größer/fetter; Leerer-Zustand „Kein Unterricht“ mit kleiner
Illustration. Hero-Block (Begrüßung, %, Stats) bleibt im Wesentlichen.

### Betroffene Screens / Komponenten

- `app/(tabs)/index.tsx` — WelcomeBanner (Feinschliff), Schul-Pill.
- `src/features/dashboard/widgets.tsx` — **alle** Widgets:
  - `NextLessonWidget` — Fachfarbe als vollflächiger Block (`ColorBlockCard`),
    IconBadge auf Fachfarbe, Vertretungs-/Ausfall-Badge statt Textzeile.
  - `LettersWidget` — Lavendel-Block (Elternbriefe).
  - `ExamsWidget` — Mint-Block (Klassenarbeiten), Tage als riesige Zahl
    (`StatCard`).
  - `BoardWidget` — Kategorie-Einfärbung via `categories.ts`.
  - `HomeworkWidget`/`TodayTimelineWidget`/`InsightsWidget`/`GradesWidget`/
    `AttendanceWidget`/`QuickActionsWidget` — Farbblock-Logik bzw.
    Icon-Badges, „Für morgen einpacken“-Chips bleiben.
- Leerer Zustand „Kein Unterricht“ — kleine Illustration (SVG,
  `react-native-svg`) statt nur Icon+Text.

### Akzeptanzkriterien

- [x] Jede Sektionskarte ist vollflächig in ihrer Kategoriefarbe eingefärbt
      (Elternbriefe = Lavendel, Klassenarbeiten = Mint, nächste Stunde =
      Fachfarbe, Brett nach Kategorie, …) — keine weißen Listenkarten mit
      Rand mehr auf dem Dashboard.
- [x] Dashboard-Icon-Badges laufen überall auf einem farbigen Kreis, mindestens
      Größe lg (44 px; Hero-Subject-Badge xl).
- [x] Stat-Zahlen (Stunden heute, Aufgaben offen, Tage bis Arbeit) sind riesige
      Zahl + kleine Caption (`StatCard`); Klassenarbeiten und Fehlzeiten nutzen
      dasselbe Muster.
- [x] „Kein Unterricht“-Leerzustand zeigt eine kleine verspielte Inline-SVG-
      Illustration statt eines reinen Icons.
- [x] Dark Mode: alle Flächen erhalten über Block-/Fach-/Kategorie-Tokens ihre
      Dark-Varianten; `ColorBlockCard`/`BlockText` und `StatCard` lösen den
      kontrastsicheren Vordergrund auf.
- [x] Widget-Reihenfolge/-Sichtbarkeit aus Einstellungen bleibt unverändert;
      die farbige „Dashboard anpassen“-Karte führt weiterhin zu Einstellungen.
- [x] Dashboard-Bugs behoben: iOS- und Android-RefreshControl nutzen Amber,
      die Demo-Markierung ist eine echte Pill und die Ladeskelette folgen dem
      Farbflächen-Stil.

### Abhängigkeiten

Benötigt Phase 1 (Komponenten) + Phase 2 (Header-Pattern).

---

## Phase 4 — Stundenplan (inkl. 2-Wochen-Ansicht) — wichtigste Änderung

**Status: ✅ umgesetzt (2026-09-04)**

### Umsetzung

- Zwei **Wochen-Streifen** („Diese Woche“ / „Nächste Woche“) liegen
  übereinander und sind ohne jede Navigation gleichzeitig sichtbar; jeder Tag
  beider Streifen ist eine eigene antippbare Pille (Auswahl = volle
  Amber-Füllung). Der Streifen zeigt die Datums-Range; bei Bedarf läuft die
  Pille-Reihe horizontal (Scroll statt Umbruch, auch auf Tablet/Desktop).
- Die **„Heute“-Pille** im Header ersetzt die alten `< Heute >`-Pfeile; die
  Wochenwahl entfällt. Die Auswahl bleibt beim Tab-Wechsel/App-Wechsel
  erhalten (`lastSelectedDay`-Modulspeicher) und wird beim Wochenumbruch auf
  heute zurückgesetzt (Wochengrenzen-Bug).
- **Tages-Pillen:** gewählter Tag volle Amber-Füllung, „Heute“ unabhängig von
  der Auswahl als Ring markiert (auch wenn ein Tag der anderen Woche aktiv
  ist). Status-Punkte in der Pille nach Entscheidungs-Log #6: grün =
  Vertretung, coral = Entfall einzelner Stunden, grau = kompletter Ausfall-Tag.
- **Stunden-Karten** sind vollflächige `ColorBlockCard`s in Fachfarbe (Entfall
  als Coral-Block), ohne Rand und ohne linken Streifen; Zeit/Raum/Stunde als
  Pillen im Block, Vertretung/Entfall/Raumwechsel als auffällige Solid-Pillen
  mit Icon, „läuft gerade“ mit Live-Puls. Fächer tragen jetzt deterministische
  **Lucide-Fach-Icons** (`subjectIcon`, neu in `src/design/subjects.ts`) im
  `IconBadge`.
- `WeekGrid`/`TimeGrid`/Ansicht-Toggle wurden durch die einheitliche
  Zwei-Wochen-Liste ersetzt (Entscheidungs-Log #11) — auf breiten Screens als
  zentrierte, ~780 dp breite Lesespalte.
- Detail-Sheet: Kopf als `ColorBlockCard` in Fachfarbe mit Icon-Badge und
  Status-Pill; Änderungs-/Hausaufgaben-/Arbeiten-Infos als runde Inset-Flächen.

### Ziel

Zwei Wochen gleichzeitig sichtbar, gestapelt: Woche 1 als horizontaler
Tage-Streifen, direkt darunter Woche 2 als zweiter Streifen — kein
Pfeil-Wechsel mehr. Beide Wochen direkt antippbar. Stunden-Karten werden
vollflächige Farbblöcke je Fach.

### Betroffene Screens / Komponenten

- `app/(tabs)/timetable.tsx` — komplette Neustrukturierung:
  - **2-Wochen-Stack:** zwei horizontale Day-Pill-Streifen (Woche 1 / Woche
    2) übereinander; Auswahl eines Tages lädt dessen Stundenliste.
  - **Tag-Pills:** ausgewählter Tag = volle Amber-Füllung; „Heute“-Ring in
    beiden Streifen; Status-Punkte in der Pille (Regel: Entscheidungs-Log #6).
  - **Stunden-Karten:** vollflächiger Farbblock je Fach (Fachfarbe als
    Hintergrund, `ColorBlockCard`), Zeit/Raum als Pill im Block.
  - **Vertretung/Ausfall/Raumwechsel:** auffälliger Badge (Solid-Pill mit
    Icon) statt reiner Textzeile.
- `src/design/subjects.ts` — neu: deterministische `subjectIcon()`-Map
  (Lucide je Fach) für die Icon-Badges auf Stundenplan- und Aufgaben-Karten.
- Wochen-Logik: nutzt die vorhandene Montag-Verankerung (`startOfWeek` in
  `src/lib/date.ts`); der alte `weekOffset`-Wechsel (Pfeile) entfällt,
  Feiertags-/Ferienlogik bleibt unberührt.

### Akzeptanzkriterien

- [x] Beide Wochen sind ohne Navigation gleichzeitig sichtbar (gestapelt).
- [x] Jeder Tag beider Wochen ist direkt antippbar; Auswahl sofort sichtbar
      (volle Orange-Füllung + fetter Wochentagskürzel).
- [x] „Heute“ ist in beiden Streifen markiert (Punkt/Ring), auch wenn die
      andere Woche ausgewählt ist.
- [x] Vertretungs-/Ausfall-Tage zeigen farbige Punkte in der Tages-Pille.
- [x] Stunden-Karten sind vollflächige Farbblöcke in Fachfarbe — kein weißer
      Kartenumriss, kein linker Farbrand mehr.
- [x] Vertretung/Ausfall/Raumwechsel haben auffällige Badges (Pill + Icon).
- [x] Pfeil-Navigation (`< Heute >`) ist entfernt bzw. durch
      „Heute“-Sprung-Button ersetzt.
- [x] Landschaft/Tablet: Streifen bleiben nutzbar (Scroll statt Umbruch).
- [x] Stundenplan-Bugs behoben (u. a.: Wochengrenze, Auswahl-Reset beim
      App-Wechsel, leere Tage).

### Abhängigkeiten

Benötigt Phase 1 (Blocks/Pill/ColorBlockCard). Unabhängig von Phase 3, aber
gleiches Header-Pattern aus Phase 2.

---

## Phase 5 — Aufgaben (Hausaufgaben / Arbeiten / Lernplan)

**Status: ✅ umgesetzt (2026-09-04)**

### Umsetzung

- **Hausaufgaben** sind vollflächige `ColorBlockCard`s in Fachfarbe (auch
  „Erledigt“, dort gedimmt auf 55 % – lesbar, aber klar abgesetzt). Aufbau:
  große **runde Checkbox (30 px)** links mit animiertem Fülleffekt + Häkchen
  (Reanimated-Spring; Haptik bleibt), oben **Fälligkeits-Pill** in den
  `priority`-Tokens (Coral/Amber/Lime, `solid`, mit Icon), Fachname +
  Fach-Icon-Badge, Aufgaben-Text und Lehrer-/Aufgabe-Metazeile. Wenn die
  Ampel- und die Fachfarbe dieselbe Familie sind, bekommt die Pille einen
  weißen Ring (`Pill`/`Chip` akzeptieren dafür jetzt optional `style`).
- **Fortschritts-Block** als Lime-Fläche mit violettem Fortschrittsbalken,
  „x von y erledigt“ und großer Prozentzahl (StatCard-Logik).
- **Arbeiten** sind vollflächige **Ampel-Blöcke** (Coral ≤ 1 Tag, Amber
  ≤ 5 Tage, Lime sonst): Tagen-Countdown als riesige Zahl (52 px) + Caption,
  Fach-Icon-Badge im Ink-Tint, Datum/Zeit, Typ-/Lernblock-Pills, Kommentar,
  Pfeil in den Lernplan. Darüber eine Ampel-Legende mit denselben Tokens.
- **Lernplan** nutzt dieselbe Farbblock-Logik: violette Erklär-Karte +
  je Lernblock eine Fachfarben-Karte mit fetter Dauer-Pill („45 min“,
  `solid`, mit Icon). Gruppierung nach Datum, „Überfällig“-Gruppen oben.
- **Detail-Sheet** im neuen Stil: Kopf als `ColorBlockCard` in Fachfarbe mit
  Icon-Badge und Fälligkeits-Pill; Aufgabe + Metadaten als runde Inset-Fläche;
  Bestätigen-Button bleibt.
- Bugs adressiert: Überfälliges sortiert zuoberst (Gruppen aufsteigend nach
  ISO-Datum, innerhalb eines Tags stabil nach Fach), Toggle-Persistenz über
  den `useHomeworkDone`-Store (AsyncStorage) unverändert robust.

### Ziel

Aufgaben-Karten werden vollflächige Farbblöcke je Fach (bisherige
Fachfarben aus den Pills werden Kartenhintergrund). Checkbox größer/runder
mit Fülleffekt, Fälligkeits-Badge oben rechts fetter, Arbeiten-Ampel
gesättigter, Lernplan gleiche Logik.

### Betroffene Screens / Komponenten

- `app/(tabs)/tasks.tsx`:
  - **Hausaufgaben:** `ColorBlockCard` in Fachfarbe, Fachname + IconBadge,
    Fälligkeits-Pill oben rechts (`priority`-Farben), große runde Checkbox
    mit Fill-Animation beim Abhaken (Reanimated + Haptik bleibt).
  - **Arbeiten:** Dringlichkeits-Ampel mit `priority`-Tokens
    (Coral/Amber/Lime) stärker gesättigt als Hintergrundblock, Fach-Icon-
    Badge ergänzt, Countdown als riesige Zahl.
  - **Lernplan:** gleiche Farbblock-Logik wie Hausaufgaben, Dauer-Pill
    fetter.
- `src/features/tasks/studyplan.ts` — nur wenn Layout-Daten fehlen (Dauer
  als strukturiertes Feld).

### Akzeptanzkriterien

- [x] Alle Aufgaben-Karten (offen **und** erledigt) sind vollflächige
      Farbblöcke in Fachfarbe; kein Rand, kein linker Streifen.
- [x] Checkbox ≥ 28 px, voll rund, mit animiertem Fülleffekt + Häkchen beim
      Abhaken; erledigte Karten gedimmt aber lesbar.
- [x] Fälligkeits-Badge oben rechts, fetter als Fachname-Pill, Farbe aus
      `priority`-Tokens (überfällig/heute = Coral, morgen/bald = Amber,
      entspannt = Lime).
- [x] Arbeiten-Tab: Ampel deutlich gesättigt (Coral/Amber/Lime als
      Blockfarben), Fach-Icon-Badge vorhanden, Tagen-Countdown riesig.
- [x] Lernplan-Tab: Farbblock je Fach, Dauer-Pill fett (Icon + „45 min“).
- [x] Detail-Sheet im neuen Stil (ColorBlockCard-Kopf mit Fachfarbe).
- [x] Aufgaben-Bugs behoben (u. a.: Toggle-Persistenz, Gruppierung nach
      Datum, Überfällig-Sortierung oben).

### Abhängigkeiten

Benötigt Phase 1 (Blocks, priority, ColorBlockCard, Pill).

---

## Phase 6 — Noten (Feinschliff)

**Status: ✅ umgesetzt (2026-09-04)**

### Umsetzung

- `app/(tabs)/grades.tsx` neu aufgebaut: Lime-Hero (Radius 32) mit
  `StatNumber size="lg"` für den Gesamtschnitt, Notenanzahl als zweite
  Riesenzahl und „Stärkstes Fach“/„Größter Hebel“ als getönte Innenkacheln.
- Fach-Karten sind jetzt `ColorBlockCard` in der **gesättigten** Fachfarbe
  (kein 14-%-Tint mehr) mit `IconBadge lg` (Fach-Icon aus `subjectIcon`),
  riesiger Notenzahl (`StatNumber`), Trend-Pill und Noten-Chips im 20er-Radius.
- **Neu** `src/features/grades/sparkline.tsx`: `Sparkline` (geglättete SVG-
  Kurve, `react-native-svg`) ab 3 datierten Noten, `QualityBar` als
  Balken-Fallback. Beide zeichnen in der Vordergrundfarbe der Fläche und sind
  **qualitätsnormalisiert** (oben/voll = besser) — Noten 1–6 und Punkte 0–15
  lesen sich damit identisch.
- `src/features/grades/calculator.ts`: `datedSeries()`, `gradeTrend()`
  (Vergleich jüngere vs. ältere Hälfte, `direction` normalisiert) und
  `gradeRatio()`.
- Detail-Sheet: Kopf als `ColorBlockCard` in Fachfarbe mit Icon-Badge, großer
  Sparkline und Trend-Text; Rechner-Pills auf Radius 20/voll rund.
- `Switch` akzeptiert jetzt `accessibilityLabel` (der „verbergen“-Toggle im
  Header hat kein sichtbares Label).

### Behobene Bugs (Phase 6)

- **Gesamtschnitt-Rundung:** Der Schnitt mittelte bereits gerundete
  Fachschnitte; jetzt ein Durchgang, Rundung nur in der Ausgabe.
- **Systeme gemischt:** Punkte-Fächer (0–15) und Noten-Fächer (1–6) flossen in
  denselben Schnitt. Jetzt wird nur das dominante System gemittelt.
- **`worst !== best`** verglich Objektidentität — bei genau einem bewerteten
  Fach stand dasselbe Fach zweimal im Hero. Jetzt über die Position im Ranking.
- **Leere Fächer** liefen als „–“-Karten mit; sie stehen jetzt in einer eigenen
  ruhigen Gruppe „Noch ohne Note“.
- **Rechner-Zustand** blieb beim Fachwechsel stehen (Simulation eines anderen
  Fachs); wird jetzt beim Wechsel zurückgesetzt, Zielschnitt-Default folgt dem
  Notensystem.
- **„verbergen“-Toggle** maskierte die Einzelnoten im Detail-Sheet nicht.

### Ziel

Kein Neubau — Sättigung der Pastelltöne erhöhen, Fach-Icon-Badges ergänzen,
Notenzahl je Fach größer, Mini-Trendlinie statt nur Balken (wenn machbar).

### Betroffene Screens / Komponenten

- `app/(tabs)/grades.tsx`:
  - Großer grüner Gesamtschnitt-Block bleibt (Lime-Block), Zahl noch größer
    (`StatNumber`).
  - Fach-Karten: sattere Pastelltöne (Block-Palette statt Tint),
    Fach-Icon-Badge, Noten-Anzahl größer.
  - Mini-Trendlinie (Sparkline, `react-native-svg`) je Fach, wenn ≥ 3 Noten
    mit Datum; sonst Balken.
- `src/features/grades/calculator.ts` — Trend-Berechnung (Delta über Zeit),
  wenn nötig.

### Akzeptanzkriterien

- [x] Fach-Karten nutzen gesättigte Blockfarben (kein 14-%-Tint mehr als
      Hauptfläche).
- [x] Jede Fach-Karte hat ein Fach-Icon-Badge (Lucide-Icon je Fach, deterministisch).
- [x] Notenzahl je Fach visuell größer/gewichtiger als die Noten-Chips.
- [x] Fächer mit ≥ 3 datierten Noten zeigen eine Mini-Trendlinie; Balken
      bleibt Fallback.
- [x] Schnitt-Simulation/Rechner-Sheet funktioniert weiter und folgt dem
      neuen Stil.
- [x] Noten-Bugs behoben (u. a.: „verbergen“-Toggle, Schnitt-Rundung,
      leere Fächer).

### Abhängigkeiten

Benötigt Phase 1 (Blocks, IconBadge, StatCard).

---

## Phase 7 — Postfach

**Status: ✅ umgesetzt (2026-09-04)**

### Umsetzung

- `app/(tabs)/inbox.tsx` komplett auf Farbflächen umgestellt:
  - **Brett:** `BoardCard` leitet die Kategorie **je Eintrag** über
    `categoryFromText()` ab (Entscheidung #10) und füllt die Karte mit
    `categoryColor()`; Icon-Badge und Kategorie-Pill kommen aus den neuen
    Helfern `categoryIcon()` / `categoryLabel()` in `categories.ts`.
  - **Briefe:** `LetterCard` als `ColorBlockCard` — Lavendel als
    Grundfamilie, Coral bei offener Bestätigung, Mint nach Bestätigung.
    Randfarbe-Only (`borderWidth` + 4-px-Streifen) ist entfernt; die
    Bestätigen-Zeile sitzt als getönte Fläche im selben Block.
  - **Nachrichten:** ungelesene Threads sind ein **Charcoal-Block** mit
    Amber-Avatar und „N neu“-Pill, gelesene eine ruhige Surface-Karte;
    Avatare sind voll rund.
- `app/thread.tsx` im Chat-App-Stil: runder Avatar im Kopf, Bubbles mit
  Radius 24 (eigene Nachrichten = Amber-Block mit angehefteter Ecke unten
  rechts, fremde = Surface mit Ecke unten links), Empfänger-Karte als
  Slate-Block, Antwortfeld als weiche Fläche mit rundem Amber-Sendeknopf
  statt Trennlinie.
- `src/design/categories.ts`: `categoryIcon()` und `categoryLabel()` ergänzt.

### Behobene Bugs (Phase 7)

- **`categoryBlock()`-Fallback** gab `'general'` (einen *Kategorie*-Schlüssel)
  statt eines Block-Namens zurück — `blocks['general']` ist `undefined`, die
  Fläche wurde unsichtbar. Fallback ist jetzt die Lavendel-Familie.
- **Tab-Badges** zählten `requiresConfirmation`/`confirmed` ohne Normalisierung
  (String/`0` vom Server zählte als „offen“); jetzt strikt über `Boolean()`
  und memoisiert.
- **Bestätigungs-Race:** Doppeltippen feuerte zwei `confirm`-Mutationen; die
  zweite lief in einen Serverfehler und zeigte trotz Erfolg einen Alert.
  Guard in Listenkarte **und** Sheet.
- **Anhang-Download:** Mehrfachtippen startete denselben Download parallel;
  jetzt gesperrt, solange ein Download läuft (andere Zeilen sichtbar
  ausgegraut).
- **Brief-Detail-Race:** Beim schnellen Wechsel zwischen zwei Briefen konnte
  die langsamere Antwort die neuere überschreiben — Effekt räumt jetzt per
  `cancelled`-Flag auf und leert den Inhalt beim Wechsel.
- **`markThreadRead`** wurde bei jedem Tap erneut gefeuert; der Badge sprang
  zurück. Jetzt nur, wenn keine Mutation läuft.

### Ziel

Segmented-Tabs (Briefe/Nachrichten/Brett) bleiben; Brief-Karten bekommen
Farbfläche statt nur Randfarbe; das komplett flache „Brett“ wird nach
Kategorie eingefärbt.

### Betroffene Screens / Komponenten

- `app/(tabs)/inbox.tsx`:
  - **Brett:** Kategorie-Einfärbung über `src/design/categories.ts`
    (Sekretariat = Sky/Blau, Bibliothek = Mint/Grün, AG-Anmeldung =
    Violet/Lila, Fundsachen = Amber/Orange; Fallback Lavendel).
  - **Briefe:** `ColorBlockCard` in Lavendel (bzw. Bestätigungspflicht =
    Coral-Akzent); „Bestätigen“-Button bleibt funktional wie er ist.
  - **Nachrichten:** Avatar-Thread-Karten im Farbflächen-Stil (Charcoal-
    Block für unread, Surface für gelesen).
- `app/thread.tsx` — Chat-Detail im gleichen Stil (Chat-App-Referenz:
    Bubbles voll rund, eigene Nachrichten Amber-Block).

### Akzeptanzkriterien

- [x] Brett-Karten sind vollflächig nach Kategorie eingefärbt (Zuordnung aus
      `categories.ts`, Titel-Schlüsselwörter erkannt).
- [x] Brief-Karten sind Farbflächen (Lavendel-Familie); Randfarbe-Only ist
      entfernt.
- [x] Bestätigen-Flow unverändert funktional (Confirm → Erfolg → Badge sinkt).
- [x] Nachrichten-Tab: unread hervorgehoben (farbiger Block/Punkt),
      Avatare voll rund.
- [x] Postfach-Bugs behoben (u. a.: Tab-Badges, Anhang-Download,
      Bestätigungs-Race-Condition).

### Abhängigkeiten

Benötigt Phase 1 (categories.ts, ColorBlockCard) + Phase 2 (SegmentedControl
neu ist Teil Phase 1, Header aus Phase 2).

---

## Phase 8 — Einstellungen

**Status: ✅ umgesetzt (2026-09-04)**

### Umsetzung

- `app/settings.tsx` neu strukturiert um drei lokale Bausteine:
  - `SectionBlock` — jede Sektion ist eine **vollflächige Farbkarte** mit
    `IconBadge lg`, fettem 19er-Titel und kurzem Hint: Konto = Mint,
    Schule = Sky, Dashboard = Violet, Benachrichtigungen = Apricot,
    Live-Island = Lavendel, Erscheinungsbild = Amber, Datenschutz =
    Charcoal, Über = Slate.
  - `SettingsGroup` — weiße Gruppenkarte; `Divider` **nur** zwischen ihren
    eigenen Zeilen, nie zwischen Gruppen (Kernprinzip 8).
  - `ToggleRow` / `InfoRow` — min. 56 px Höhe, mehr Weißraum, optionales
    Icon-Badge, `accessibilityLabel` am Switch.
- Farbschema nutzt jetzt das gemeinsame `SegmentedControl` (min-h 48, runde
  Pille) statt drei eigener Pressables; der Wechsel greift unverändert sofort.
- Modul-Liste als fette `Pill`s statt dünner Chips; „Über“-Badges ebenso.
- Eingabefelder randlos auf Canvas (Radius 20, min-h 52) statt
  `border-line`-Kästen; Label als 10,5-px-Uppercase.

### Behobene Bugs (Phase 8)

- **Widget-Sortierung:** `moveWidget` tauschte blind mit dem Nachbarn im
  Gesamt-Array — bei ausgeblendeten Widgets (z. B. „Noten“ ohne Modul) wirkte
  ein Klick folgenlos. `moveWidget(id, dir, visibleIds)` sucht jetzt den
  nächsten **sichtbaren** Nachbarn (additive, optionale API).
- **Persistenz „Lokale Daten löschen“:** `update(DEFAULT_SETTINGS)` setzte auch
  `onboarded` zurück; beim nächsten Start landete man im Onboarding. Der
  Onboarding-Status bleibt jetzt erhalten.
- **Screenreader:** Die Toggle-Zeilen im neuen Stil haben kein Label am Switch
  selbst — `Switch` bekam dafür `accessibilityLabel` (auch von Phase 6 genutzt).

### Ziel

Der am weitesten vom Zielstil entfernte Screen: jede Sektion
(Erscheinungsbild, Datenschutz, Module) wird zur farbig hinterlegten Karte
mit größerem Icon-Badge; Segmented-Control und Modul-Chips bleiben, nur
größer/fetter; Toggle-Zeilen mit mehr Weißraum, gruppiert statt durch dünne
Linien getrennt.

### Betroffene Screens / Komponenten

- `app/settings.tsx` — Sektionskarten (Erscheinungsbild = Amber-Block,
  Datenschutz = Sky/Charcoal, Module = Violet, Konto = Mint …),
  IconBadge lg je Sektion, gruppierte Toggle-Zeilen (eigene `Card` je
  Gruppe, Divider nur innerhalb), Farbschema-Segmented-Control bleibt
  (bereits Phase-1-Stil), Modul-Chips als fette Pills.
- `src/state/settings.ts` — nur wenn Toggle-Bugs Data-seitig sind.

### Akzeptanzkriterien

- [x] Jede Sektion ist eine farbige Karte (ColorBlockCard) mit IconBadge ≥
      lg; keine Android-Settings-Listenoptik mehr.
- [x] Farbschema-Segmented-Control und Modul-Chips funktional unverändert,
      aber fetter/größer.
- [x] Toggle-Zeilen: ≥ 56 px Höhe, mehr Weißraum, gruppiert in Karten;
      keine dünnen Trennlinien zwischen Gruppen.
- [x] Fach-Farb-Overrides (falls vorhanden) folgen der neuen Palette.
- [x] Einstellungs-Bugs behoben (u. a.: Theme-Wechsel-Immediate,
      Widget-Sortierung, Persistenz).

### Abhängigkeiten

Benötigt Phase 1 (IconBadge, ColorBlockCard, SegmentedControl).

---

## Phase 9 — Politur & Regression

**Status: ✅ umgesetzt (2026-09-04)**

### Umsetzung

- **Illustrations-Bibliothek** `src/ui/illustrations.tsx` (neu): 12 kleine,
  emoji-freie Inline-SVGs (`free-day`, `all-done`, `empty-inbox`,
  `no-messages`, `no-grades`, `no-results`, `search`, `empty-folder`,
  `no-events`, `no-absences`, `locked`, `nothing-here`) auf einheitlicher
  126×88-Bühne. Sie zeichnen ausschließlich in der Vordergrundfarbe ihrer
  Umgebung (`ink`-Prop aus `useBlockInk()`) und funktionieren dadurch in Light
  **und** Dark sowie auf allen 13 Blockfarben — ohne eigene Farbtabelle.
- **`EmptyState` akzeptiert jetzt einen Illustrationsnamen**
  (`illustration="all-done"`) statt nur einen SVG-Node und fadet über
  `FadeInUp` ein. **Alle 24 Leerzustände** der App nutzen Illustration + fette
  Headline + kurzen Hint; kein Leerzustand ist mehr ein nacktes Icon, jeder hat
  einen Hint bekommen. Die lokale `NoLessonsIllustration` aus den
  Dashboard-Widgets ist in die Bibliothek gewandert (`free-day`).
- **Motion-Konsistenz:** Sämtliche rohen `<Pressable>`-Interaktionen in Screens
  und Shell laufen jetzt über `PressableScale` (Karten, Nav, Buttons) bzw.
  `PressableOpacity` (Listenzeilen, Chips, Text-Links, Segmente) — inkl.
  Dashboard-Insets, Postfach-Karten, Kalender, Suche, Einstellungen,
  Onboarding, Live-Island, Error-Boundaries und Lock-Gate. Handgeschriebene
  `active:opacity-*`/`hover:opacity-*`-Klassen und `({ pressed }) => …`-Styles
  wurden dabei entfernt (Log #19). `<Pressable>` bleibt nur noch für
  unsichtbare Sheet-/Modal-Backdrops in `primitives.tsx`.
- **Doppelte Press-Ebenen aufgelöst:** Die Stundenplan-Karte war ein Pressable
  *um* eine `ColorBlockCard`; sie nutzt jetzt deren eigenen Press-Scale
  (eine Interaktion pro Karte).
- **Listen-Einblendungen vervollständigt:** Erledigte Hausaufgaben und
  Lernplan-Blöcke fehlten in der gestaffelten `FadeInUp`-Sequenz.
- **Cross-Screen-Audit** (siehe Tabelle unten) durchgezogen: Radien,
  Schatten, Pill-Stile, Icon-Badges und Typografie überall auf die
  Kernprinzipien gebracht.

### Audit-Liste (Kernprinzipien-Check über alle Screens)

| # | Prinzip | Befund & Behebung |
|---|---|---|
| 1 | Farbflächen statt Umrandungen | Letzte Ränder entfernt: Zahlungen-Hero (`border-warning/40`) ist jetzt eine **Amber-Farbfläche**, seine Zeilentrennung ein gruppeninterner `Divider`; randlose Textareas in Krankmeldung/Beurlaubung; Suchfeld ohne Rand, dafür `shadow.card`; Sprechtags-Lehrerauswahl als gefüllte Pille; `Button`-Variante `surface` ohne Rand. **Kein `border-line` mehr in der gesamten App.** |
| 2 | Große, fette Überschriften | Unverändert: alle Tab-Screens nutzen `ScreenHeader` (28/800). |
| 3 | Große Eck-Radien | Sämtliche `rounded-xl/2xl/3xl` (28 Fundstellen) durch Skalenwerte ersetzt: 28 px Karten, 24 px Skeletons, 20 px Insets/Felder/Chips, voll rund bei Icon-Kacheln, `IconButton` und Buttons. Tailwind-Kurzformen kommen im UI nicht mehr vor. |
| 4 | Riesige Zahl + Caption | Bestandsaufnahme ok; Zahlungen-Hero nutzt jetzt ebenfalls eine große fette Betragszahl. |
| 5 | Icon-Badges | Letzte handgebaute Icon-Kacheln ersetzt: Fehlzeiten-Liste, Krankmeldung (2×), Beurlaubung, Fehler-/Lock-Screens; Rang-Kreise in Wahlfächern und Trefferkacheln der Suche sind rund statt eckig. |
| 6 | Pill-/Chip-Tags | Sprechtags-Slots und Konto-Auswahl sind Pillen; keine dünnen Text-Chips mehr. |
| 7 | Schwarze Pill-Bottom-Nav | Unverändert; Rail/Sidebar-Items animieren jetzt zusätzlich mit Press-Scale. |
| 8 | Weiche Schatten statt Trennlinien | Nur noch gruppeninterne `Divider` (Einstellungen, Listen, Zahlungen-Positionen). |
| 9 | Verspielte Illustrationen | 24/24 Leerzustände mit Illustration + Headline + Hint. |

### Ziel

Micro-Interactions, Empty States mit Illustrationen überall,
Cross-Screen-Konsistenz-Check, verbleibende Bugs.

### Betroffene Screens / Komponenten

- Alle Screens; `src/ui/motion.tsx` (Press/Hover-Feinschliff),
  `EmptyState` (Illustrationen überall), Konsistenz-Audit gegen
  Kernprinzipien-Tabelle oben.

### Akzeptanzkriterien

- [x] Jede Karte/Interaktion hat konsistente Press-Scale- und
      Fade-In-Animationen (`PressableScale`/`PressableOpacity` überall; nur
      unsichtbare Modal-Backdrops bleiben rohe Pressables).
- [x] Alle Empty States haben Illustrationen + fette Headline + kurzen Hint
      (24/24, zentrale Bibliothek `src/ui/illustrations.tsx`).
- [x] Cross-Screen-Check: Radius, Schatten, Pill-Stile, Icon-Badges,
      Typografie überall identisch (Audit-Liste oben abgehakt).
- [x] Dark-Mode-Audit über alle Screens (17 Routen mit `--dark` grün;
      Illustrationen erben die kontrastsichere Blockfarbe).
- [x] Smoke-Test-Matrix (`npm run smoke:matrix`, 17 Routen × 3 Formfaktoren
      = 51 Kombinationen) grün; `typecheck` grün.
- [x] Keine bekannten funktionalen Bugs mehr offen (Liste in
      PROJECT_STATUS.md abgearbeitet).

### Behobene Bugs (Phase 9)

- Stundenplan-Karte: verschachtelte Press-Flächen (Pressable um
  `ColorBlockCard`) — Doppel-Feedback und doppelte a11y-Rolle „button“.
- Erledigte Hausaufgaben und Lernblöcke sprangen ohne Animation in die Liste,
  während alle Nachbarlisten gestaffelt einblendeten.
- Onboarding-Buttons animierten über `({ pressed }) => transform`-Styles am
  JS-Thread statt über den Reanimated-Motion-Layer.
- Leerzustände ohne Hint („Keine Elternbriefe“, „Kein Aushang“, „Keine
  Termine“, „Noch keine Note“) ließen offen, warum die Liste leer ist.
- Toter Code: unbenutzte `gradeColor`-Berechnung im Noten-Sheet und
  unbenutzte `ink`-Auflösung in der Thread-Karte.

### Abhängigkeiten

Benötigt Phasen 1–8 (finaler Durchlauf über alles).

---

## Phase 10 — APK-Styling & Layout-Fix (aus „Teil 2“, Punkt 1)

**Status: ✅ umgesetzt (2026-09-05) — die On-Device-Abnahme erfolgt mit dem nächsten CI-Build**

### Diagnose (zuerst geführt, wie beauftragt)

Symptom war nicht „CSS fehlt komplett“, sondern **selektiv**: Bottom-Nav,
Tages-Pillen, Switches und die Hero-Card waren gestylt, Titel, Abschnittslabels,
Farbflächen-Padding, Typografie und Abstände nicht. Dieses Muster hat nur eine
Erklärung: alles **inline** Gesetzte (`style={{ … }}` aus `tokens.ts`) überlebt,
alles **klassenbasierte** (`className`, also praktisch das gesamte Redesign aus
Phase 1–9) nicht.

Nachgewiesene Ursache — eine **doppelte NativeWind-Laufzeit**:

| Prüfschritt | Befund |
|---|---|
| `npm ls react-native-css-interop` | `nativewind@4.2.6 → 0.2.6` **und** eigene, obere Pin `react-native-css-interop@^0.1.22` → zwei Kopien im Baum |
| `createRequire('app/_layout.tsx').resolve('react-native-css-interop/jsx-runtime')` | landete in **0.1.22** (hoisted) |
| Auflösung aus dem von NativeWind generierten StyleSheet-Modul (`node_modules/react-native-css-interop/.cache/android.js`) | landete in **0.2.6** (verschachtelt unter `nativewind`) |
| Babel-Nachbau (`babel-preset-expo` + `nativewind/babel`) auf einer Testdatei | injiziert in **jede Screen-Datei** `require("react-native-css-interop/jsx-runtime")` — ein leerer Specifier, also aus `app/` aufgelöst |
| `expo export --platform android` (lesbar, `--no-bytecode --no-minify`) | vorher 13.696.698 Zeichen, Runtime-Marker `verifyData`/`verifyJSX` 7×, `injectData` 9×; nachher 13.583.138 Zeichen (−111 KB), 4× bzw. 5× → genau eine Runtime |

Kette: Der Metro-Transformer schreibt das kompilierte Stylesheet über
`injectData(…)` in die Laufzeit, die **aus dem `.cache`-Modul** aufgelöst wird
(0.2.6). Babel verdrahtet jedes `className` mit der Laufzeit, die **aus der
Screen-Datei** aufgelöst wird (0.1.22). Zwei Registry-Instanzen → die Screens
fragen in einer leeren Tabelle nach → auf nativ kein Styling. Auf Web blieb es
unsichtbar, weil dort echte CSS-Klassen im DOM greifen, und im Dev-Modus, weil
das Stylesheet dort über den Middleware-Pfad nachgeliefert wird.

Verworfen wurden nach dieser Messung: „global.css nicht eingebunden“,
WebView-Ladereihenfolge, Screens auf alten Render-Pfaden (kein einziger betroffener
Screen nutzt alte Komponenten) und WebView-Timing.

### Umsetzung

- **Ursache behoben:** `package.json` pinnt `react-native-css-interop` jetzt auf
  exakt die Version, die `nativewind@4.2.6` verlangt (`0.2.6`), plus
  `"overrides": { "react-native-css-interop": "0.2.6" }`. Ergebnis: eine Kopie,
  Deduping erzwungen, `app/` und `.cache` resolving identisch.
- **`scripts/style-pipeline-check.mjs` (neu) → `npm run doctor`:** prüft 14
  Invarianten der Pipeline — genau eine Kopie, Versionsparity zu nativewind,
  **Auflösungs-Symmetrie** (der eigentliche Bug), `jsxImportSource`,
  `withNativeWind`-Input, `global.css`-Import im Root, Tailwind-`content`-Globs
  (+ Warnung, wenn `className` außerhalb der Globs auftaucht), mit `--built=<platform>`
  zusätzlich die Größe des kompilierten nativen StyleSheets.
  Negativtest (zweite Kopie simuliert) schlägt korrekt mit Exit 1 auf.
- **CI (`android-apk.yml` + `scripts/github-workflow-vorlage.yml`, identisch):**
  `npm run doctor` als Blocker **vor** `expo prebuild`, Metro-/NativeWind-Cache
  wird vor Gradle verworfen (`--rerun-tasks`, kein halbfertiges Bundle), nach dem
  Build prüft `--built=android`, und der Web-Job läuft den Doctor ebenfalls.
  Ein ungestyltes APK kann damit nicht mehr unbemerkt veröffentlicht werden.
- **Laufzeit-Sonde `src/ui/style-guard.tsx` (neu), gemountet in `app/_layout.tsx`:**
  ein View, dessen Größe ausschließlich aus `w-24 h-24` kommt; mißt `onLayout`
  statt 96 px deutlich weniger, meldet die App „Styling-Bundle unvollständig“ als
  abbestellbare Karte (bewusst **nur Inline-Styles**, weil sie ja funktioniert,
  wenn Klassen tot sind) inkl. Build-Version und Hinweis auf `npm run doctor`.
  Kein Blocker: Navigation und Daten bleiben nutzbar. `useStylePipelineHealth()`
  stellt den Zustand für Diagnose-Anzeigen bereit (Phase 12/14: „Über“-Abschnitt).
- **Bottom-Nav (gemeldetes „Glow-Icon verdeckt ein Icon“):** die Deko-Ebenen des
  aktiven Tabs trugen `elevation`. Auf Android bestimmt Elevation die
  **Zeichenreihenfolge** — Halo und Hintergrund landeten *über* dem Icon, der
  Amber-Halo pulsierte also auf dem Icon. Jetzt: `elevation` raus, Tiefenwirkung
  auf iOS über echte Schatten (`Platform.select`), explizite `zIndex`-Schichtfolge
  Deko → Hintergrund → Icon → Punkt → Badge.
- **Safe-Areas im nativen Kontext:** die schwebende Kapsel rechnet
  `insets.left`/`insets.right` ein (Landscape, Notch/Punch-Hole, drei Buttons),
  damit sie weder angeschnitten noch unter der Systemuhr verschwindet; die
  Scroll-Reserve unten bleibt `max(100 px, insets.bottom + 88 px)`
  (`useTabNavReserve`, unverändert, aber jetzt wieder sichtbar korrekt).
- **Header-Überlappung auf Start:** `ScreenHeader` trägt seine Kopfzeilen-Struktur
  (`flexDirection`, `alignItems`, `justifyContent`, `gap`, `minHeight`) jetzt
  inline *und* als Klasse. Der Header war die einzige Stelle, an der eine
  verlorene Klasse nicht nur „hässlich“, sondern physisch überlappend war
  (Such-/Einstellungs-Icon über dem Begrüßungstext). Typografie bleibt bewusst
  klassenbasiert — 45 Screens überschreiben die Größen der Text-Bausteine per
  `className`, und inline würde jede dieser Entscheidungen still aushebeln.

### Akzeptanzkriterien

- [x] Eine `react-native-css-interop`-Kopie im Abhängigkeitsbaum; Auflösung aus
      `app/` und aus dem generierten StyleSheet-Modul zeigt in dieselbe Runtime
      (dokumentierter Nachweis oben).
- [x] Android-Bundle enthält eine gefüllte native StyleSheet-Registry
      (`.cache/android.js` 23.024 Byte; `npm run doctor --built=android`).
- [x] `npm run doctor` blockiert in CI vor `prebuild` und meldet die Ursache
      auf Deutsch statt eines Build-Abbruchs ins Blaue; Negativtest liefert Exit 1.
- [x] Styling-Verlust ist nicht mehr stumm: Laufzeit-Sonde meldet ihn in der App.
- [x] Bottom-Nav ohne `elevation`-Z-Order-Konflikt (Glow über Icon), Kapsel
      safe-area-korrekt in Landscape/Notch.
- [x] `ScreenHeader` strukturell ausfallsicher; keine Überlappung von
      Kopfaktion und Titel möglich.
- [x] `npm run typecheck` und Smoke-Matrix (17 Routen × 3 Formfaktoren) grün.
- [ ] **Auf dem Gerät nach dem nächsten Build abzunehmen:** Stundenplan
      (Titel/Labels/Stundenliste), Aufgaben-Tabs als Segmented-Control,
      Postfach-Tabs, Noten-Titel/-Empty-State, Start ohne Icon-Überlappung —
      jeweils 1:1 wie Web, ohne Überlappungen, mit Safe-Area-Abstand zu
      Statusleiste/Home-Indicator. Liste dafür: `HANDY-TESTEN.md` §„Abnahme
      Phase 10“.

### Abhängigkeiten

Keine neue — Phase 10 ist Voraussetzung für die Abnahme aller visuellen Folgen
(12–15), weil deren Wirkung sonst in der installierten App unsichtbar bleibt.

---

## Phase 11 — Schulmanager-Online-API im Browser (aus „Teil 2“, Punkt 2)

**Status: ✅ umgesetzt (2026-09-05)**

### Diagnose

Die Anbindung war nicht „kaputt“, sondern **für die Auslieferungsart falsch adressiert**:

- `src/api/client.ts` setzte im Browser `/sm-api` als **Wurzel-Pfad** fest.
  Den Durchreicher gibt es aber nur im Dev-Server (`metro.config.js`) und in
  `scripts/web-proxy.mjs`.
- Ausgeliefert wird die Web-Version auf GitHub Pages — ein reiner Datei-Server
  unter der Basis `/schulmanager/`. `POST /schulmanager/sm-api/api/calls` (zuvor
  sogar `POST /sm-api/api/calls`)antwortete dort mit **404 und HTML**; der
  JSON-Parse scheiterte, die Screens blieben leer.
- Nativ (APK) existiert das Problem nicht: React Native hat kein CORS, die App
  spricht `login.schulmanager-online.de` direkt an. Genau deshalb „functioniert
  sie nur in der installierten App“.
- Elternbriefe/Anhänge hingen am gleichen Problem (Storage-Host
  `storage.schulmanager-online.de`, siehe `docs/PLATTFORMEN.md` §6).

### Umsetzung

- **`src/api/transport.ts` (neu)** — eine Schicht, die pro Session **einmal**
  den Weg zur API festlegt und ihn danach allen Konsumenten liefert:
  1. manueller Umweg aus den Einstellungen (persistiert, `KEYS.smRelay`),
  2. Build-Override `EXPO_PUBLIC_SM_API_BASE`,
  3. same-origin Durchreicher — **relativ zur App-Basis** über
     `document.baseURI`, funktioniert also unter `/`, `/schulmanager/` und jedem
     Unterpfad,
  4. Direktaufruf als letzte Chance (falls die API je CORS öffnet).
  Jeder Kandidat wird mit einem `GET …/__health` in 1,5 s geprüft; ein 200 mit
  `text/html` (SPA-Fallback eines Datei-Servers) gilt als *kein* Durchreicher.
  Findet sich nichts, ist der Zustand `blocked` — und Anfragen werden erst gar
  nicht mehr geschickt (kein 30-s-Timeout, kein „Keine Verbindung“-Raten).
- **`src/api/client.ts`** löst die Basis jetzt pro Anfrage auf
  (`resolveSmTransport()`), `post()` wirft bei `blocked` eine
  `SchulmanagerError` mit der **Handlungsansage** im `userMessage`
  („… Einstellungen → Verbindung …“). Nativ unverändert direkt.
- **Einstellungen → Konto: `src/ui/connection-card.tsx` (neu)** mit
  `useSmTransport()` (`src/api/use-transport.ts`): aktuelle Route inkl.
  gemessener Latenz, Eingabefeld für die Umweg-Adresse (akzeptiert Worker-Root
  *oder* `…/sm-api`, normalisiert beides), Speichern & prüfen / Entfernen /
  Neu prüfen, plus der blockierte Hinweis mit Verweis auf `scripts/relay/`.
  Wirkt ohne neuen Build, weil die Adresse im Browserspeicher liegt.
  `WEB_USES_CORS_PROXY` (statisch, irreführend) ist daraus verschwunden.
- **Durchreicher erweitert** (`scripts/sm-api-proxy.cjs`, `metro.config.js`,
  `scripts/web-proxy.mjs`): Prefix-Erkennung am **Suffix** statt am Wurzel-Pfad,
  neuer Mount `/sm-storage` für Datei-Anhänge, `/__health` als Ein-Request-Fähigkeits-
  nachweis, `SERVE_DIR` für den Export-Server.
- **Relay für rein statisches Hosting:** `scripts/relay/schulflow-relay.worker.js`
  (+ `wrangler.toml`, `scripts/relay/README.md`) — derselbe Vertrag wie der
  lokale Durchreicher, `ALLOWED_ORIGINS`-Beschränkung, nur die zwei Upstreams,
  keine Logs von Bodies/Tokens, `Vary: Origin`. Damit ist der Browser-Weg auch
  auf GitHub Pages reparierbar, ohne dass Schulflow einen fremden
  öffentlichen Proxy mit dem Schul-Login füttert.
- **Downloads** (`src/api/downloads.ts`) laufen auf Web über denselben Umweg
  (`rewriteStorageUrlForWeb`).

### Akzeptanzkriterien

- [x] Browser-Datenfluss hängt nicht mehr an einem Root-Pfad; die App leitet
      `/sm-api` und `/sm-storage` aus ihrer eigenen Basis ab (Subpfad-tolerant).
- [x] Einmalige, gepufferte Fähigkeitsprüfung pro Session statt Rate hängender
      Requests; `blocked` wird vor dem ersten fetch erkannt.
- [x] Nutzer:innen können den Umweg ohne Build in den Einstellungen setzen und
      sehen sofort Status + Latenz.
- [x] Fehlermeldung im blockierten Zustand erklärt Ursache und Ausweg (auch im
      Login-Formular, das denselben Client nutzt). Auch der letzte Direktaufruf
      wird nicht als kryptische `TypeError` durchgereicht: schlägt er fehl,
      nennt die App CORS als Grund und den Weg in die Einstellungen; ein
      wiederholt leerer Health-Check des Relays meldet die geprüfte Adresse.
- [x] Relais-Implementierung liegt im Repo und ist in einer Minute deploybar;
      der lokale Export-Server bedient denselben Vertrag (Health + Storage).
- [x] `typecheck` grün; Web-Smoke-Matrix unverändert grün (kein Render-Fehler
      durch die neue Transport-Schicht).
- [ ] Auf Pages nach dem nächsten Web-Deploy zu prüfen: mit eingetragenem Relay
      laden Stundenplan/Aufgaben/Noten/Postfach; ohne Relay erscheint die
      Verbindungs-Karte mit der Erklärung statt leerer Screens.

### Abhängigkeiten

Unabhängig von Phase 10 (läuft auch mit ungestyltem APK), liefert aber den
Nachweis für Phase 12/14: Die Verbindungs-Karte ist der Keim für den
Drilldown-Punkt „Konto & Verbindung“.

---

## Phase 12 — Grundqualität & Bugs (aus „Teil 2“, Punkt 3)

**Status: 🟡 teilweise umgesetzt (Haptik ✅, Rest geplant)**

### Umsetzung (bereits erfolgt)

- **`src/lib/haptics.ts` komplett umgestellt.** Android nutzte
  `impactAsync`/`notificationAsync` — expo-haptics simuliert diese Stile dort mit
  `Vibrator` + `VibrationEffect.createOneShot(...)`: ein langes, brummendes
  Muster, genau die Rückmeldung aus dem Auftrag. Jetzt:
  `performAndroidHapticsAsync(...)` mit den Systemkonstanten
  (`SEGMENT_TICK` für Ticks, `CONTEXT_CLICK` für Taps, `VIRTUAL_KEY` für
  Auswahl, `TOGGLE_ON/OFF`, `CONFIRM`, `REJECT`, `LONG_PRESS`) — kurze, vom
  Hersteller auf die eigene Vibrations-Spule kalibrierte Impulse, ohne
  `VIBRATE`-Permission, mit kurzem `impactAsync(Light)`-Fallback auf alten ROMs.
  iOS bleibt bei `UIImpactFeedbackGenerator` (`.light`/`.medium`/`.heavy`) und
  `UINotificationFeedbackGenerator` für Erfolg/Fehler.
- **Coalescing (55 ms):** zwei Feedbacks im selben Frame (Checkbox-Toggle +
  Listen-Reflow) zählen als ein Tipp — kein Rattern mehr beim schnellen Abhaken.
- Neue, semantische Aufrufe: `hapticTap()`, `hapticToggle(on)`,
  `hapticSelection()`, `hapticHeavy()`; `hapticLight()` bleibt als Tick erhalten.
- **Screen-Wechsel:** der Root-`Stack` animiert jetzt einheitlich
  (`animation: 'slide_from_right'`, `animationDuration: 260 ms` — kürzer als der
  Systemdefault, die App fühlt sich direkt an), die sechs modalen Formulare
  kommen von unten (`slide_from_bottom`), `settings` als Card mit Slide.
  Toggle-Switches brauchen nichts: `Switch` ist der Plattform-Switch
  (`RNSwitch` via gluestack) und animiert bereits auf beiden Systemen.

### Noch offen (geplant)

- **Übergänge, zweite Runde:** `LinearTransition` an den Aufgaben-Tabs und an
  der neuen Stundenplan-Umschaltung (Phase 15), Karten-Expand der Sheets
  (`Sheet` mit `entering`/`exiting` + Spring statt Sprung),
  Tab-Wechsel-Querblende (braucht einen eigenen Scene-Wrapper —
  Bottom-Tabs haben keine Szenen-Animation), alles auf 120-Hz-Ablauf prüfen.
- **QA-Passage Alignment/Größen:** 360/390/430 dp × Phone/Tablet/Desktop,
  System-Schriftgröße 1,3, RTL-ignorierend; Fokus auf Basislinien in
  `ScreenHeader`, `SectionHeader`, Zeilen mit `Pill` rechts (Abschneiden bei
  langen Fächernukrzel) und auf Zeilenumbrüche in `StatCard`-Captions.
- **Haptik-Qualität:** optionale dünne native Brücke (`modules/schulflow-haptics`)
  für `VibrationEffect.EFFECT_TICK` ab API 30 mit sauberem Fallback, damit auch
  Geräte ohne Systemkonstanten einen Klick statt eines Summens spüren.
- Diagnose-Anzeige `useStylePipelineHealth()` im „Über“-Abschnitt (nutzt Phase-10-Sonde).

### Akzeptanzkriterien

- [x] Kein langes Vibrationsmuster mehr: Android nutzt
      `VibrationEffect`-Systemeffekte, iOS `.light`/`.medium`; Doppel-Feedback
      unter 55 ms wird verworfen.
- [x] Screen-Wechsel animieren einheitlich (Root-Stack 260 ms, Modals von unten);
      Switches sind Plattform-Animationen und bleiben unverändert.
- [ ] Jeder interaktive Baustein (Screen-/Tab-Wechsel, Karten-Expand, Checkbox,
      Toggle, Sheet) animiert mit identischem Timing; kein harter Sprung.
- [ ] QA-Passage dokumentiert (Tabelle je Formfaktor), alle Funde behoben.
- [ ] `npm run smoke:matrix` und `typecheck` grün.

### Abhängigkeiten

Benötigt Phase 10 (Sonst sind Motion-Änderungen im APK nicht sichtbar).
Hängt mit Phase 13/14 zusammen (Bottom-Bar-Pill, Drilldown-Transitionen).

---

## Phase 13 — „Live Island“ → Live Activities (aus „Teil 2“, Punkt 4)

**Status: 🟡 teilweise umgesetzt (2026-09-05): In-App-Kapsel ist von oben nach
unten gewandert und auf nativ abgeschaltet; die System-Kanäle bestehen, der
iOS-WidgetKit-Target und die Telemetrie-Feinschritte fehlen noch. Teilschritt
„Glow in der Bottom-Nav“ wurde bereits in Phase 10 behoben.**

### Umsetzung (bereits erfolgt)

- `src/features/island/LiveIsland.tsx` rendert **auf nativ `null`** — die
  Kapsel oben am Bildschirm (Statusleiste, Notch, Dynamic Island) gibt es nicht
  mehr. Live-Infos laufen dort über die bestehenden System-Mechanismen
  (`useLiveIslandEffects`: Android-Fortschritts-Notification → Live-Update bzw.
  HyperOS-Fokus-Notification, Expo-Go-Fallback über `expo-notifications`).
- Auf **Web** ist dieselbe Pille jetzt die **Erweiterung über der Tab-Bar**:
  Verankerung `bottom = max(useTabNavReserve(), insets.bottom + 92)` — sie sitzt
  in der ohnehin freien Reserve, kein Screen-Inhalt wird verdeckt; auf
  Rail/Desktop rückt sie an den unteren Rand des Inhaltsbereichs
  (`left: layout.navigationWidth`).
- Detailkarte klappt zur neuen Position hin **nach oben** auf (`marginBottom`
  statt `marginTop`), Zuklappen bei Kontextwechsel und Haptik unverändert.
- `app/_layout.tsx`: Kommentar/Mount dokumentieren den neuen Zustand; die
  Effekte (`effects.ts`) laufen weiterhin plattformunabhängig.

### Noch offen (geplant)

- iOS: WidgetKit-/ActivityKit-Target bauen (`npx expo-apple-targets`,
  `LiveIslandAttributes.swift` übernehmen, App-Group) → echte Live Activity.
- Android: promoted-Ongoing nur auf API ≥ 35 absichern, Ticker nur bei
  Änderung (Dedup existiert), „Akute Hausaufgaben-Erinnerung“ als zweiter
  Live-Update-Inhalt (heute: Stunde/Countdown).

### Ziel

Kein eigenes In-App-Island-UI mehr oben am Bildschirm. Installierte Apps spielen
Live-Infos über **native Mechanismen** aus, die Web-Version zeigt sie als
**Pill über der Bottom-Tab-Bar**.

### Betroffene Screens / Komponenten

- `src/features/island/LiveIsland.tsx` — In-App-Kapsel oben **entfällt** auf
  nativ; auf Web wird sie zur Tab-Bar-Erweiterung umgebaut (neue Komponente
  `IslandBarPill`, verankert über `useTabNavReserve()` in
  `app/(tabs)/_layout.tsx`, also *oberhalb* der schwarzen Kapsel, nicht am
  oberen Rand).
- `app/_layout.tsx` — `IslandHost` rendert die Kapsel nur noch auf Web.
- `modules/schulflow-live-island/` — Android: bestehende
  ongoing/Progress-Notification bleibt der Kanal (Live-Update auf Stock-Android,
  Fokus-Notification auf HyperOS); `setRequestPromotedOngoing` bleibt reflexiv.
  iOS: ActivityKit-`LiveIslandAttributes` + WidgetKit-Extension bauen
  (`npx expo-apple-targets`, App-Group, `expo run:ios`) → echte Live Activity auf
  Lockscreen/Dynamic Island statt In-App-Kapsel.
- `src/features/island/bridge.ts` / `bridge.web.ts` — Bridge bekommt
  `startLiveActivity`/`updateLiveActivity`/`endLiveActivity` (nativ) und
  `barPill`-Modus (web); `effects.ts` liefert den Tab-Titel weiterhin.
- Bottom-Nav-Bereinigung: `elevation`-Z-Order ist in Phase 10 gefallen; hier
  entfällt der Rest (die Kapsel über der Bar braucht dieselbe Reserve, damit kein
  Inhalt davon verdeckt wird).

### Akzeptanzkriterien

- [x] Oben am Bildschirm ist in der installierten App keine Island mehr sichtbar
      — weder als Kapsel noch als Overlay über dem Statuszeilenbereich.
- [x] Web: Pille unmittelbar über der Tab-Bar, keine Verdeckung von Inhalt,
      Detailkarte klappt nach oben auf.
- [ ] Android zeigt die Live-Info als Live-Update/Fokus-Notification
      (laufende Stunde, Restzeit, Fortschritt), mit Stiller-Notification-Fallback
      in Expo Go.
- [ ] iOS zeigt eine echte Live Activity (ActivityKit), sobald der
      WidgetKit-Target gebaut ist; ohne Target bleibt die App frei von
      Eigenbau-Inseln.
- [x] Gleiche Infos wie zuvor (Fach, Restzeit/Fortschritt, Countdown,
      Änderung/Ausfall-Markierung), Tap klappt die Detailkarte auf.
- [ ] Aktivierung bleibt in den Einstellungen (Phase 14: eigener Punkt
      „Live-Infos“), Erlaubnisabfrage auf Android unverändert.

### Abhängigkeiten

Benötigt Phase 10 (Sichtbarkeit im APK) und Phase 14 (Einstellungs-Drilldown für
„Live-Infos“). Blockiert nicht 15.

---

## Phase 14 — Einstellungen-Umbau (aus „Teil 2“, Punkt 5)

**Status: 🟡 geplant**

### Ziel

Von der langen Liste zum **Drilldown**: Die Hauptseite zeigt Kategorien als
Farbkarten (Phase-8-Stil), jede Kategorie öffnet eine Unterseite mit den
Details. Dashboard-Widgets werden per **Drag-and-Drop** sortiert.

### Betroffene Screens / Komponenten

- Routing: `app/settings.tsx` → `app/settings/_layout.tsx` +
  `app/settings/index.tsx` (Kategorien) + Unterseiten `appearance.tsx`,
  `privacy.tsx`, `notifications.tsx`, `widgets.tsx`, `modules.tsx`,
  `account.tsx` (enthält die Verbindungs-Karte aus Phase 11), `live-island.tsx`,
  `about.tsx`. Deep-Links bleiben erhalten: alte hrefs mappen per
  `expo-router`-Redirect auf die Unterseite.
- `src/state/settings.ts` — bleibt die einzige Quelle; Unterseiten lesen/schreiben
  denselben Store (keine zweiten Zustände).
- Neue Kategorie-Karten nutzen das `SectionBlock`-Muster aus Phase 8 (Farbfläche +
  `IconBadge lg` + Chevron), Reihenfolge: Konto & Verbindung, Schule,
  Erscheinungsbild, Dashboard-Widgets, Benachrichtigungen, Live-Infos, Datenschutz,
  Module, Über.
- Widget-Sortierung: `SettingsGroup` + neue `DraggableWidgetRow` mit
  `react-native-gesture-handler` (`Gesture.Pan`) + Reanimated
  (`LinearTransition`/`withSpring`), Lift-Schatten, Ablageziel-Pill;
  Persistenz über `useSettings.moveWidget` bzw. neues `setWidgetOrder(ids)`
  (additiv, `moveWidget` bleibt für Kompatibilität).
- `about.tsx` zeigt Styling-Pipeline-Status (`useStylePipelineHealth()`),
  Build-/Relay-Infos aus Phase 10/11.

### Akzeptanzkriterien

- [ ] Hauptseite nennt nur Kategorien (≤ 10 Karten, keine Toggle, keine
      Eingabefelder); jede Unterseite hat `ScreenHeader` + eigene Scroll-Reserve.
- [ ] Zurück-Navigation aus jeder Unterseite funktioniert aus jedem Zustand
      (`useSafeBack`, Deep-Link-kompatibel).
- [ ] Umschalten (Theme, Module, Datenschutz, Live-Island, Benachrichtigungen)
      wirkt sofort und persistiert wie bisher.
- [ ] Drag-and-Drop: Ziehen, Einsortieren, Loslassen; Reihenfolge nach
      Neustart identisch; ausgeblendete Widgets nehmen keinen Platz ein
      (Log #8 aus Phase 8 bleibt gewahrt); „nach oben/unten“-Buttons sind weg.
- [ ] Kein Regressions-Risiko für Dashboard und Screens: Widget-Reihenfolge ist
      dieselbe Datenstruktur wie vorher.

### Abhängigkeiten

Benötigt Phase 1 (Komponenten), 2 (Header-Pattern), 8 (Sektionskarten), 10
( damit es im APK sichtbar wird) und 13 (Einstiegspunkt „Live-Infos“).

---

## Phase 15 — Stundenplan: Listen- ↔ Kalenderansicht (aus „Teil 2“, Punkt 6)

**Status: 🟡 geplant**

### Ziel

Die 2-Wochen-Stack-Ansicht aus Phase 4 wird **optional**. Der Stundenplan bekommt
einen Umschalter zwischen

1. **Liste** (bestehend: Tages-Pillen + Stundenliste) und
2. **Kalender** (neu: Wochenraster — Wochentage als Spalten Mo–Fr, Zeitachse
   links, farbige vertikale Blöcke exakt über ihrer Zeitspanne, kompakte Kürzel
   für Fach/Lehrer/Raum, Freistunden bleiben sichtbar als Lücke).

### Betroffene Screens / Komponenten

- `app/(tabs)/timetable.tsx` — `SegmentedControl` „Liste / Kalender“ direkt unter
  `ScreenHeader`; die Wochen-Streifen bleiben nur in der Listenansicht, der
  Kalender zeigt beide Wochen nicht gestapelt, sondern die gewählte Woche als
  Raster mit seitlichem Wochen-Pfeil (der alte `weekOffset`-Mechanismus kehrt
  dafür in reduzierter Form zurück).
- Neue `src/ui/timetable-week-grid.tsx`: Raster aus `hours × days`, Zeithöhe aus
  `min(start/end)`-Dauer (Grundraster 44 px/h), Überlappungen nebenseitig
  (Vertretung direkt nach der Originalstunde), Freistunde = leere Zelle mit
  1-px-Innenlinie **nur** innerhalb des Rasters (Kernprinzip 8 bleibt gelten —
  das Raster ist die Ausnahme, in der Trennlinien Struktur tragen).
- Block-Inhalte: Fach-Kürzel (max. 3 Zeichen), Lehrer-Kürzel, Raum;
  Hintergrund = Fachfarbe über `subjectColor()`, Entfall = Coral mit
  Durchstreichung, Vertretung = grüner Rand-Punkt + `Pill`; Tap öffnet das
  bestehende Detail-Sheet (Phase 4), identische Datenquelle `useSnapshot()`.
- `src/state/settings.ts` — neues Feld `timetableMode: 'list' | 'calendar'`
  (persistiert, Default `list`), damit die Wunschansicht bleibt.
- `src/lib/date.ts` — nutzt weiter die Montag-Verankerung;
  `startOfWeek`/`addDays` decken den Kalender ohne neue Logik ab.

### Akzeptanzkriterien

- [ ] Beide Ansichtentypen sind umschaltbar, Auswahl wird über Tab-/App-Wechsel
      und Neustart behalten.
- [ ] Kalender: jede Stunde sitzt pixelgenau in ihrer Zeitspanne (Stunde =
      Rasterhöhe), Blöcke tragen Fach/Lehrer/Raum als Kürzel, Freistunden sind als
      Lücke sichtbar, Überlappungen seitlich geteilt statt übereinander.
- [ ] Deutlich kompakter als die Listenansicht (ganze Woche auf einem Schirm,
      ohne Scrollen in Höhe ≤ 844 dp für eine Normalwoche).
- [ ] Vertretung/Entfall/Raumwechsel im Raster ebenso erkennbar wie in der Liste
      (Fach-Kürzel + Status-Punkt), Tap öffnet dasselbe Detail-Sheet.
- [ ] Phone (360–430 dp), Tablet-Rail und Desktop-Sidebar: Spaltenzahl bleibt
      Mo–Fr (Wochenende optional nach Einstellung), Scrollen nur vertikal,
      Zeitachse sticky links.
- [ ] „2 Wochen gestapelt“ ist nicht mehr die einzige Ansicht (Auftrag: raus aus
      dem Standardweg, erhalten als Liste).

### Abhängigkeiten

Benötigt Phase 1 (Blocks/Pill/SegmentedControl), 4 (Stunden-Datenmodell,
Detail-Sheet, `subjectIcon`) und 10 (Kalender-Optik im APK). Empfohlen nach
Phase 14 (Settings-Feld `timetableMode` im neuen „Erscheinungsbild“-Zweig).

---

## Abhängigkeitsgraph (Kurzform)

```
Phase 1 (Fundament)
 ├── Phase 2 (Shell/Header) ──┬── Phase 3 (Dashboard)
 │                            ├── Phase 4 (Stundenplan)
 │                            ├── Phase 5 (Aufgaben)
 │                            ├── Phase 6 (Noten)
 │                            └── Phase 7 (Postfach)
 │                                 (3–7 sind untereinander unabhängig,
 │                                  empfohlene Reihenfolge wie nummeriert)
 └── Phase 8 (Einstellungen) — nur Phase 1 nötig
Phase 9 (Politur) — benötigt 1–8

Teil 2 (Bugfixes & neue Anforderungen):
Phase 10 (APK-Styling-Pipeline) — keine Vorbedingung; **Vorbedingung für die
  Sichtbarkeit** aller visuellen Folgenphasen im installierten Build
Phase 11 (API im Browser) — unabhängig (Transport-Schicht, kein UI- Zwang)
Phase 12 (Grundqualität)      — benötigt 10; hängt mit 13/14 zusammen
Phase 13 (Live Activities)     — benötigt 10, mündet in 14 („Live-Infos“)
Phase 14 (Einstellungen-Drilldown) — benötigt 1, 2, 8, 10, 13
Phase 15 (Stundenplan-Ansichten)   — benötigt 1, 4, 10; empfohlen nach 14
```

---

## Entscheidungs-Log (bei Unklarheiten getroffene Entscheidungen)

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **Fachfarben werden auf eine feste 13-Farb-Block-Palette** (`violet … charcoal`) gemappt statt freie Hex-Werte | Vorgabe „feste Fachfarben-Palette“; deterministisch, dark-mode-fähig, konsistent zwischen Screens. |
| 2 | **Priorität**: `urgent = Coral`, `soon = Amber`, `ok = Lime` (nicht limeDeep) | Brief nennt Coral/Amber/Lime ausdrücklich; Lime ist die hellste, positivste Fläche und wird im Noten-Hero schon als Block genutzt. |
| 3 | **Radius-Skala**: `card 28` (statt 24) als Standard, `cardLg 32` für Heroes, `chip 20` | Vorgabe „28 px große Karten, 20 px Chips/Pills, ~24–32 px Karten“ — 28 ist der verbindliche Kartenwert, 32 die obere Kante für Heroes. |
| 4 | **Charcoal als Fachfarbe** nur für Informatik (kuratiert), **nicht** im Fallback-Zyklus | Dunkler Block auf dunklem Canvas wäre ohne Rand schlecht erkennbar; als bewusste Ausnahme („Code-Editor-Optik“) in Light mode kontrolliert einsetzbar. |
| 5 | **`Card` behält weiße Surface**, wird aber randlos (28, Schatten) | Nicht jede Karte soll Farbfläche sein (Listen, Sheets); Farbflächen kommen über `ColorBlockCard`. Weiß bleibt eine gültige „Farbe“ des Stils. |
| 6 | **Status-Punkt in der Tages-Pille (final, Phase 4):** grün = mind. eine Vertretung, coral = mind. eine entfallene Stunde, grau = kompletter Ausfall-Tag (alle eingetragenen Stunden entfallen). Bei Vertretung **und** Entfall am selben Tag erscheinen beide Punkte | Der Brief nennt „grün = Vertretung, grau = Ausfall“; das Datenmodell kennt nur `substitution`/`cancelled`. Coral behält die Bedeutung der Entfall-Chips (Coral = Warnzustand, überall in der App identisch), grau markiert den ganzen Tag als ausgefallen. In Phase 4 feinabgestimmt und so umgesetzt. |
| 7 | **Illustrationen** als kleine Inline-SVGs (`react-native-svg`), keine Emoji-Wiederkehr | App bleibt emoji-frei (UI-REBUILD-Leitsatz); „verspielt“ erreichen wir über Formen statt Emojis. |
| 8 | **Phase-1-Komponenten sind additive APIs** — bestehende Screens laufen unverändert weiter | Jeder Screen wird erst in seiner Phase umgebaut; keine Big-Bang-Migration, Regressionsrisiko minimal. |
| 9 | **Haupt-Tabs werden per `navigate`, Detail-/Modalziele per `push` geöffnet** | Ein Tabwechsel legt keinen neuen Stack-Eintrag an und lässt die gemountete Scrollposition bestehen; Modals behalten ihren erwarteten Zurückweg. `useSafeBack()` fängt direkt geöffnete Deep-Links auf. |
| 10 | **Brett-Aushänge erhalten je Eintrag statt nur je Widget eine Kategorie-Fläche** | Ein Widget kann Sekretariat, Bibliothek und Fundsachen gleichzeitig enthalten. Die individuelle Ableitung über `categories.ts` macht die Farbcodierung auch bei gemischten Aushängen wahr. |
| 11 | **Phase 4 ersetzt Wochen-/Zeitraster (Tablet `WeekGrid`, Desktop `TimeGrid`) durch die einheitliche Zwei-Wochen-Liste** | Die Phase schreibt „beide Wochen ohne Navigation sichtbar“ und „Pfeil-Navigation entfernt“ für den ganzen Screen vor. Ein einziges Interaktionsmuster (2 Streifen + Tagesliste, auf breiten Screens als zentrierte ~780-dp-Spalte) hält Stil und Code konsistent; ein zusätzliches Zeitraster kann Phase 9 als Politur wiederbeleben. |
| 12 | **Fälligkeits-/Ampel-Pillen sind `solid` in den `priority`-Tokens; bei gleicher Farbfamilie wie die Fachfläche bekommen sie einen weißen Ring** | Auf einem vollflächigen Fachblock darf die Fälligkeit nie in der Fläche verschwinden. `Pill`/`Chip` akzeptieren dafür ein optionales `style` (additive API). |
| 13 | **Sparkline-Y-Achse ist qualitätsnormalisiert** (oben = bessere Note), nicht wertnormalisiert | Noten 1–6 (klein = gut) und Punkte 0–15 (groß = gut) müssen dieselbe Lesart haben: „Linie steigt ⇒ es wird besser“. Sonst bedeutete dieselbe Kurvenform in zwei Fächern das Gegenteil. |
| 14 | **Der Gesamtschnitt mittelt nur das dominante Notensystem** statt alle Fächer | Ein Mittel aus „2,0“ (Note) und „12 P“ (Punkte) ist rechnerisch sinnlos. Das seltenere System bleibt auf seinen Fach-Karten korrekt sichtbar. |
| 15 | **Sparkline & Qualitätsbalken zeichnen in der Vordergrundfarbe der Fläche** (`useBlockInk`), nicht in der Notenampel-Farbe | Auf 13 gesättigten Blockfarben × Light/Dark ist nur die zugehörige `onBlocks`-Farbe garantiert lesbar. Die Notenqualität trägt die Zahl, nicht die Linienfarbe. |
| 16 | **Ungelesene Threads sind ein Charcoal-Block, gelesene eine weiße Surface-Karte** | Die Chat-App-Referenz nutzt maximalen Kontrast für „neu“. Charcoal ist die einzige Familie, die in Light und Dark gleich stark „vorne“ steht, ohne mit den Prioritätsfarben (Coral/Amber/Lime) zu kollidieren. |
| 17 | **Brief-Karten wechseln die Familie nach Status** (Lavendel → Coral offen → Mint bestätigt) statt nur einen Akzent zu setzen | Die Vorgabe nennt Lavendel als Grundfamilie und „Bestätigungspflicht = Coral-Akzent“. Auf einer vollflächigen Karte ist ein Akzent zu leise — der Statuswechsel der *ganzen* Fläche macht offene Aufgaben auf Scroll-Distanz sichtbar und folgt der Ampel-Semantik der App. |
| 18 | **Einstellungs-Sektionen sind Farbkarten *über* weißen Gruppenkarten**, nicht farbige Karten mit Inhalt darin | Toggle-Zeilen brauchen ruhigen Hintergrund für Lesbarkeit und Switch-Kontrast. Der Farbblock trägt Identität und Icon-Badge, die Gruppe darunter den Inhalt — Divider bleiben so sauber gruppenintern (Kernprinzip 8). |
| 19 | **Rohe `<Pressable>` sind in Screens verboten**; Interaktionen laufen über `PressableScale` (Flächen/Karten/Buttons) oder `PressableOpacity` (Zeilen, Chips, Text-Links). Ausnahme: unsichtbare Modal-/Sheet-Backdrops | Press-Feedback lief bisher teils über NativeWind-Klassen (`active:opacity-*`, nicht animiert, auf Web inkonsistent), teils über Reanimated. Ein Layer bedeutet identisches Timing, Hover-Verhalten auf Web und `disabled`-Handling überall. |
| 21 | **Phase 10 setzt bei „APK ohne Styling“ zuerst die Pipeline messbar aufs Papier (npm ls + createRequire + Bundle-Diff), bevor irgendetwas umgebaut wird** | Die Symptome sahen nach „Stylesheet fehlt“, nach „Screens nutzen alte Komponenten“ oder nach WebView-Timing aus. Alles drei war falsch; die Messung (zwei `react-native-css-interop`-Kopien, divergierende Auflösung von `app/` vs. `.cache`) war in Minuten erledigt und hat einen Umbau von 20 Screens überflüssig gemacht. Diagnose zuerst ist hier keine Formalie, sondern der Unterschied zwischen einem Fix und einem Monatsprojekt. |
| 22 | **Verteidigung der Styling-Pipeline = drei Ebenen: eine Runtime (Pin + overrides), ein CI-Blocker (`npm run doctor`), eine Laufzeit-Sonde** | Eine reine Versionserhöhung wäre still zurückfallbar gewesen (jemand pinnt erneut eine Version, niemand merkt es). Der CI-Guard fängt Konfigurationsdrift ab, die Sonde meldet den Fall, in dem trotzdem etwas kippt — und zwar bei der Person, die es sieht, statt im Logcat. |
| 23 | **Struktur wird inline gehärtet, Typografie bleibt klassenbasiert** | Der Header-Bug (Icons über dem Titel) war der einzige Fall, in dem eine fehlende Klasse *überlappend* statt nur „zu wenig Padding“ bedeutet. 45 Screens überschreiben die Textgrößen der Bausteine per `className`; inline gesetzte Typografie hätte jede dieser Entscheidungen ausgehebelt (Inline gewinnt gegen Klassen). Härtung dort, wo Überlappung entsteht; partout nicht dort, wo Screens variieren. |
| 24 | **Auf Android wird `elevation` von Deko-Ebenen entfernt, nicht die Deko selbst** | Elevation bestimmt auf Android die *Zeichenreihenfolge* — der Amber-Halo lag über dem Icon, deshalb „verdeckt das pulsierende Glow-Icon ein Icon“ (Auftrag Punkt 4). Der Halo ist als getönte Fläche weiter sichtbar; iOS bekommt seinen echten Schatten per `Platform.select`. |
| 25 | **Phase 11 führt keinen öffentlichen CORS-Proxy als Standard ein, sondern eine Fähigkeitsprüfung + selbst gehosteten Umweg** | Die API schickt keine `Access-Control-Allow-Origin`-Header; ein öffentlicher Relay würde Schul-Login und Noten an Dritte geben. Der Transport prüft deshalb erst, ob die *eigene* Installation durchreichen kann (suffix-basiert, subpfad-tolerant), und lässt sich sonst eine eigene Relay-Adresse hinterlegen. Der blockierte Zustand wird vor dem ersten Request erkannt und erklärt — nicht nach 30 s Timeout als „Keine Verbindung“ missdeutet. |
| 26 | **Der Umweg wird in den Einstellungen gespeichert, nicht als Build-Variable** | Ein Build-Override (`EXPO_PUBLIC_SM_API_BASE`) zwingt jede Nutzerin/jeden Nutzer zu einem eigenen Web-Build. Im Browserspeicher gesetzt wirkt er sofort, pro Auslieferung und ohne dass Schulflow-Deployment Secrets braucht. |
| 27 | **Haptik: Android-Auswahl fällt auf `performAndroidHapticsAsync`, nicht auf `Vibrator`-Simulation** | expo-haptics dokumentiert `impactAsync`/`notificationAsync` auf Android als „simulated using Vibrator“ — genau das lange Brummen aus dem Auftrag. Die Systemkonstanten (`EFFECT_CLICK`-Familie) sind kurz, herstellerspezifisch kalibriert und brauchen keine `VIBRATE`-Permission; ein kurzes `impactAsync(Light)` bleibt als Fallback für Geräte ohne Effect-Tabelle. |
| 20 | **Illustrationen zeichnen in `useBlockInk()`, nicht in einer eigenen Farbpalette** | Ein Leerzustand kann auf Creme-Canvas *oder* mitten in einer von 13 Blockfarben × Light/Dark stehen. Nur die zugehörige Vordergrundfarbe ist überall garantiert lesbar; Tönungen (13 %/8 %) erzeugen die Flächenwirkung. `illustrations.tsx` importiert deshalb bewusst **nicht** aus `primitives.tsx` (Zyklus-frei) und bekommt `ink` als Prop. |
