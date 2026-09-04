# Schulflow – Redesign-Phasenplan („Farbflächen-Stil“)

> **Master-Dokument für den Redesign-Auftrag.** Verbindliche Planungs- und
> Abnahmequelle für alle 9 Phasen. Status wird nach jeder abgeschlossenen Phase
> hier aktualisiert; funktional entscheidende Punkte werden im
> **Entscheidungs-Log** (unten) dokumentiert.
>
> Auftrag: Schulflow visuell an vier Referenz-Screens angleichen
> (Bildungs-App-Dashboard, Kalender-/Task-App, Chat-App, Job-App). Alle vier
> teilen dieselbe Design-Sprache: **Farbflächen statt Umrandungen, große fette
> Typografie, riesige Radien, Icon-Badges, Pill-Tags, schwarze Pill-Nav,
> weiche Schatten.**
>
> Stand: 2026-09-04 · Phasen 1–5 **umgesetzt ✅** (siehe Status je Phase)

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

**Status: ⬜ offen**

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

- [ ] Fach-Karten nutzen gesättigte Blockfarben (kein 14-%-Tint mehr als
      Hauptfläche).
- [ ] Jede Fach-Karte hat ein Fach-Icon-Badge (Lucide-Icon je Fach, deterministisch).
- [ ] Notenzahl je Fach visuell größer/gewichtiger als die Noten-Chips.
- [ ] Fächer mit ≥ 3 datierten Noten zeigen eine Mini-Trendlinie; Balken
      bleibt Fallback.
- [ ] Schnitt-Simulation/Rechner-Sheet funktioniert weiter und folgt dem
      neuen Stil.
- [ ] Noten-Bugs behoben (u. a.: „verbergen“-Toggle, Schnitt-Rundung,
      leere Fächer).

### Abhängigkeiten

Benötigt Phase 1 (Blocks, IconBadge, StatCard).

---

## Phase 7 — Postfach

**Status: ⬜ offen**

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

- [ ] Brett-Karten sind vollflächig nach Kategorie eingefärbt (Zuordnung aus
      `categories.ts`, Titel-Schlüsselwörter erkannt).
- [ ] Brief-Karten sind Farbflächen (Lavendel-Familie); Randfarbe-Only ist
      entfernt.
- [ ] Bestätigen-Flow unverändert funktional (Confirm → Erfolg → Badge sinkt).
- [ ] Nachrichten-Tab: unread hervorgehoben (farbiger Block/Punkt),
      Avatare voll rund.
- [ ] Postfach-Bugs behoben (u. a.: Tab-Badges, Anhang-Download,
      Bestätigungs-Race-Condition).

### Abhängigkeiten

Benötigt Phase 1 (categories.ts, ColorBlockCard) + Phase 2 (SegmentedControl
neu ist Teil Phase 1, Header aus Phase 2).

---

## Phase 8 — Einstellungen

**Status: ⬜ offen**

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

- [ ] Jede Sektion ist eine farbige Karte (ColorBlockCard) mit IconBadge ≥
      lg; keine Android-Settings-Listenoptik mehr.
- [ ] Farbschema-Segmented-Control und Modul-Chips funktional unverändert,
      aber fetter/größer.
- [ ] Toggle-Zeilen: ≥ 56 px Höhe, mehr Weißraum, gruppiert in Karten;
      keine dünnen Trennlinien zwischen Gruppen.
- [ ] Fach-Farb-Overrides (falls vorhanden) folgen der neuen Palette.
- [ ] Einstellungs-Bugs behoben (u. a.: Theme-Wechsel-Immediate,
      Widget-Sortierung, Persistenz).

### Abhängigkeiten

Benötigt Phase 1 (IconBadge, ColorBlockCard, SegmentedControl).

---

## Phase 9 — Politur & Regression

**Status: ⬜ offen**

### Ziel

Micro-Interactions, Empty States mit Illustrationen überall,
Cross-Screen-Konsistenz-Check, verbleibende Bugs.

### Betroffene Screens / Komponenten

- Alle Screens; `src/ui/motion.tsx` (Press/Hover-Feinschliff),
  `EmptyState` (Illustrationen überall), Konsistenz-Audit gegen
  Kernprinzipien-Tabelle oben.

### Akzeptanzkriterien

- [ ] Jede Karte/Interaktion hat konsistente Press-Scale- und
      Fade-In-Animationen.
- [ ] Alle Empty States haben Illustrationen + fette Headline + kurzen Hint.
- [ ] Cross-Screen-Check: Radius, Schatten, Pill-Stile, Icon-Badges,
      Typografie überall identisch (Audit-Liste im Doc abgehakt).
- [ ] Dark-Mode-Audit über alle Screens.
- [ ] Smoke-Test-Matrix (`npm run smoke:matrix`) grün; `typecheck` grün.
- [ ] Keine bekannten funktionalen Bugs mehr offen (Liste in
      PROJECT_STATUS.md abgearbeitet).

### Abhängigkeiten

Benötigt Phasen 1–8 (finaler Durchlauf über alles).

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
