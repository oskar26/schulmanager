# Schulflow — "Bento Grid / Soft Brutalism" Rebuild: Fahrplan & Design-System

> Master-Dokument für die komplette visuelle + technische Überarbeitung.
> Zielbild: **High-End Bento Grid mit Soft-Brutalism-Touch** (große Radien, modular
> gestapelte, farbig geblockte Kacheln, klare Hierarchien, kaum Emojis, nur Vektor-Icons).
>
> Stand dieser Datei: Basierend auf den schriftlichen Design-Direktiven des Auftragsgebers.
> Die Referenzbilder und der APK-Bug-Screenshot lagen dem Bearbeiter **nicht als
> Pixel** vor (kein Vision-Zugriff im Sandbox-Turn) — das MD kodiert daher die
> extrahierten Layout-/Styling-Spezifikationen verbatim, damit ein späterer Turn die
> Optik exakt treffen kann.

---

## 0. Leitsätze (aus Auftrag + Bildanalyse extrahiert)

1. **Emoji-Verbot (hart):** Kein System-Emoji in Texten, Headern, Buttons, Listen.
   Stattdessen sparsame Vektor-Icons aus `lucide-react-native`.
2. **Radien extrem groß:** Kacheln/Container `borderRadius 28–32`; Buttons/Pills/Badges
   `9999` (`rounded-full`).
3. **Abstände großzügig:** Innen `padding 20–24`, Raster-Abstand `gap 12–16`.
4. **Typography:** Fette Überschriften `weight 800`, `text-xl`…`2xl`; Untertitel klein,
   reduziert-opak. Kein freischwebender Text — alles in Karten.
5. **Icons sparsam & nur wo sie Orientierung schaffen.** Auf Karten: runde
   Action-Buttons (`44×44`, `borderRadius 22`) mit Pfeil-/Arrow-icon in der Ecke.
6. **Status-Pills** (Metadaten: "Priority 1", "Fällig morgen", Raum …) als farbige
   `rounded-full`-Tags.
7. **Überlappende Avatare** mit weißem Ring und `marginRight: -8`.
8. **Dynamisches Theme** (Light/Dark/System) — jede Komponente reagiert sofort.
9. **Animationen** via `react-native-reanimated` (`FadeInDown.springify()`,
   Touch `withSpring scale:0.97`, sanfte Tab-Übergänge).
10. **APK-Stabilität:** Root-Container mit `flex:1` + `width/height:100%`, alle
    Ladezustände sauber abgefangen, nie ein leerer Startbildschirm.

---

## 1. Verifizierter Ist-Stand (Stand dieses Turns)

**Stack (bereits in `package.json` & verdrahtet):**
- `nativewind` ^4.2.6 (Tailwind v3), `global.css` + `tailwind.config.js` vorhanden.
- `react-native-reanimated` ~4.1.1 (+ `react-native-worklets` 0.5.1, Babel-Plugin aktiv).
- `react-native-gesture-handler` ~2.28 (Root vorhanden).
- `expo-router` ~6.0.24; Router unter `app/`, Tabs unter `app/(tabs)/`.
- `react-native-svg` ^15.12 (via `@expo/vector-icons` schon genutzt).
- Persistenz: `@react-native-async-storage/async-storage` + `expo-secure-store`
  (Keychain/Keystore) über `src/lib/storage.ts` (`KEYS`, `secureStorage`, `storage`).
- State: `zustand` (`src/state/session.ts`, `src/state/settings.ts`).
- **`lucide-react-native` v1.40.0 wurde installiert** (PascalCase-SVG-Komponenten,
  z. B. `<Home size color strokeWidth/>`).

**Design-Tokens:** `src/design/tokens.ts` (JS `palette`), `global.css` (CSS-Variablen),
`tailwind.config.js` (NativeWind-Farb-Layer), `src/design/subjects.ts` (Fachfarben,
`tint()`, `subjectStyle`), `src/design/tamagui.config.ts` (Tamagui, nur Motion/Stack).

**UI-Schicht:**
- `src/ui/primitives.tsx` (Text-, `Screen`, `AdaptiveContent`, `Card`, `Row`, Chips,
  `ListRow`, `Sheet`, `Skeleton`, `EmptyState`, `SegmentedControl`, `IconButton`, …) —
  nutzt **Ionicons**.
- `src/ui/shell.tsx` — adaptive Navigation (Bottom-Tabs via @react-navigation default,
  Rail links / Sidebar auf Tablet/Desktop) — nutzt **Ionicons**.
- `src/ui/motion.tsx` — `FadeInUp`, `PressableScale`, `LivePulse` auf Tamagui-Animation.
- `src/ui/gluestack/*` — Button, Switch/Spinner/Progress/Avatar.
- `app/(tabs)/_layout.tsx` — `<Tabs>`; Bottom-Tab-Bar = @react-navigation `BottomTabBar`.

**Screens:** `index` (Dashboard, header + Widget-Stack), `timetable`, `tasks`, `grades`,
`inbox` (Tabs) + `settings`, `calendar`, `attendance`, `documents`, `search`, `thread`,
`payments`, `parent-talks`, `electives`, `allday`, `sick-note`, `exemption` (Modal/Stack).

**Dashboard-Widgets** (`src/features/dashboard/widgets.tsx`, Registry `WIDGET_COMPONENTS`):
`next-lesson`, `insights`, `today-timeline`, `homework`, `exams`, `grades`, `letters`,
`attendance`, `board`, `quick-actions`. Reihenfolge/Sichtbarkeit aus `settings.widgets`
(auch Quelle für künftige Home-Screen-Widgets). Steuerbar & sortierbar in `settings.tsx`.

**Auth:** `useSession` (connect/restore/disconnect/setDemo/2FA/Device-Refresh),
`useSettings` (email/hasPassword/demoMode/theme/…). **Demo-Modus** lädt
`buildDemoSnapshot()` (`src/data/demo.ts`). Es existiert **noch kein Onboarding-Gate** —
die App landet bei `demoMode: true` direkt im Hauptbereich.

**Bekannte Altlasten (dieses Rebuild zu beheben):**
- Kein strukturiertes Onboarding (Welcome + Authentifizierungs-Wahl) vor App-Zugriff.
- Bottom-Tab-Bar ist nicht die geforderte schwebende dunkle Kapsel.
- Ionicons statt lucide; viele Emojis in Text (vollständige Liste am Ende).
- Settings-Sektionen teils flache `ListRow`-Reihen statt Bento-Karten.
- Root-Start nicht explizit gegen "leeren APK-Start" gehärtet.

---

## 2. Design-System-Spezifikation (verbatim aus Bildanalyse)

### 2.1 Farbpalette / Color-Blocking

| Rolle | Light (Canvas/Kacheln) | Dark |
|---|---|---|
| **Canvas-Hintergrund** | Warmes Off-White/Creme `#F6F5F2` | Tiefes Slate-Navy `#0F172A` / `#111827` |
| **Hero / Noten / Haupt-Subjects** | Periwinkle `#8C8EFF` / `#EDE9FE` | akzentuiert leuchtend |
| **Status / Fristen / Kurse** | Warm Amber `#FFC83B` / `#FEF3C7` | `#FFC83B`-Leuchten auf dunkel |
| **Erledigt / positive Quote** | Soft Mint `#10B981` / `#D1FAE5` | `#10B981` |
| **Dringend / Fehler** | Terracotta/Coral `#E0564C` / `#FEE2E2` | `#E0564C` |
| **Fokus-Kacheln & Bottom-Nav** | Charcoal `#18181B` / `#111827` | `#111827` (+ Karten `#1E293B`/`#334155`) |

**Regel:** Nie zwei gleiche Farbkacheln direkt nebeneinander; jede Sektion besitzt ihre
eigene pastellige/dunkle Hintergrundkachel. Akzente (Noten/Fächer) im Dark Mode
leuchtend auf den abgedunkelten Karten (`#1E293B`/`#334155`).

### 2.2 Geometrie & Radien

- Kacheln/Container: `borderRadius 28–32` (NativeWind `rounded-3xl`/`rounded-[28px]`/`[32px]`).
- Buttons/Pills/Badges: `rounded-full` (`9999`).
- Innenabstand Karten `20–24`; Raster-`gap` `12–16`.
- runde Action-Buttons auf Karten: `44×44`, `radius 22`, weißer/dunkler Grund, `→`/`↗`.

### 2.3 Bento-Kachel-Anatomie

1. Header-Zeile innerhalb der Karte: Label oben (klein, Kapsel), Hauptzahl/-titel,
   Ecken-Action-Button (`↗`).
2. Status-Pill(s) für Metadaten.
3. Overlapping-Avatare (weißer Ring, `marginRight:-8`).
4. Farbblöcke decken die Karte (nicht nur Ränder).

### 2.4 Floating Bottom Navigation Bar

- `position:absolute`, `bottom:24`, `left:16`, `right:16` (≈ `marginHorizontal:16`).
- Dunkler Anthrazit `#111827`, `borderRadius:36`, dezenter Schatten.
- Aktiver Tab = kontrastreicher heller/dunkler Kreis hinter dem Lucide-Icon; rote
  Badge-Pill oben rechts (Notizen/Postfach). Keine Text-Labels.
- Auf Tablet/Desktop bleibt die Sidebar (Rail/Sidebar) erhalten → `AdaptiveTabBar`.

### 2.5 Layout-Struktur (Home/Header)

- Header: Avatar links → Name/Greeting → kleiner Progress-Pill ("Fortschritt 76%").
  Glocken-/Einstellungen-Kreis-Kapsel rechts.
- Grid asymmetrisch: große 2/3-Kachel neben kleiner 1/3-Kachel; unten volle Breite.
- Listen (Aufgaben/Stundenplan) = gestapelte eigene Farb-Kacheln statt flacher Zeilen.

---

## 3. Umsetzungsphasen & Dateizuordnung

### Phase A — Grundlage & APK-Stabilität (dieser Turn begonnen)
- [ ] Root-Start härten in `app/_layout.tsx`:
  - äußerste Container `flex:1` + `width/height:'100%'`, echter Canvas-Hintergrund,
    damit nie "leer/transparent" beim nativen Start.
  - boot/Ladezustand an Root: erst Tabs rendern, wenn `settings.hydrate()` +
    initialer `session.restore()` durch sind (nicht abgefangene Ladezustände abfangen).
  - Expo `SplashScreen`/Boot-View mit Marke statt weißem Bildschirm; Fehlergrenze
    (ErrorBoundary) behalten & ent-emojifizieren.
- [ ] Design-Tokens erweitern (`src/design/tokens.ts`, `global.css`,
      `tailwind.config.js`): Creme-Canvas, Periwinkle/Amber/Mint/Coral/Charcoal +
      Dark-Slate-Navy-Tokens (`#0F172A` bg, `#1E293B`/`#334155` card).
- [ ] `lucide-react-native` verankern: Icon-Helper (Größe/Strichstärke/Farbe) in
      `src/ui/icon.tsx` als zentrale Quelle.
- [ ] Alle Root-Container prüfen (`Screen`, `SafeAreaView`, `ScrollView`) auf
      `flex:1` + `width:'100%'`.

### Phase B — Onboarding & Auth-Flow (neu)
Neue Routen unter `app/onboarding/`:
- [ ] `app/onboarding/index.tsx` → 2–3 Swipe-Welcome-Karten (lucide, `reanimated`
      Carousel/`FlatList pagingEnabled`): Kernfeatures erklären.
- [ ] `app/onboarding/auth.tsx` → Wahl-Screen:
  - **A "Mit Schulmanager Online verbinden"** → Eingabemaske Benutzername/E-Mail +
    Passwort; speichern via `setCredentials` → SecureStore/Keychain; `connect(...)`
    (bestehende `useSession` inkl. 2FA/Mehrfachkonto).
  - **B "Im Demo-Modus erkunden"** → `setDemo()` / `settings.demoMode=true` +
    `buildDemoSnapshot()`.
- [ ] Gate in `app/_layout.tsx`: ohne angemeldete Session **und** ohne getroffene
      Demo-Entscheidung → Onboarding zeigen; nach Wahl in `(tabs)`.
- [ ] Status (Angemeldet/Demo) in `settings.tsx` jederzeit wechselbar (Button
      "Abmelden → Demo" / "Mit Konto verbinden").

### Phase C — Bento-Redesign Kern (Screens/Shell/Widgets)
- [ ] `app/(tabs)/_layout.tsx`: schwebende Floating Bottom Nav (lucide, `#111827`,
      `borderRadius 36`, aktiver Kreis, rote Badge-Pills). Keine Labels. Beibehaltung
      `AdaptiveTabBar` für Rail/Sidebar.
- [ ] `src/ui/primitives.tsx` → lucide migrieren; neue Bausteine:
      `BentoCard`(Farblock, Radius 28/32, großes Padding), `BentoGrid`,
      `Pill`, `RoundActionButton`, `AvatarStack`.
- [ ] Home `app/(tabs)/index.tsx`: neuer Header (Avatar, Greeting, Progress-Pill,
      Einstellungs-Kapsel), asymmetrisches Bento-Raster. Widgets als farbige Blöcke.
- [ ] Widgets `src/features/dashboard/widgets.tsx`: jede Karte in Bento-Anatomie
      (Farblock, Ecken-Pfeil, Pills, keine Emojis).
- [ ] `timetable`, `tasks`, `grades`, `inbox`: Listen als gestapelte Farb-Kacheln.
- [ ] `settings.tsx`: Sektionen als strukturierte abgerundete Bento-Karten
      (kein freischwebender Text), Theme-Umschalter, Konto-/Demo-Wechsel.

### Phase D — Dark Mode & Micro-Interactions
- [ ] Theme-System konsolidieren (Light `#F6F5F2`+Pastell / Dark Slate-Navy) —
      `settings.theme` vorhanden (`system|light|dark`), auf ALLE Komponenten anwenden.
- [ ] Entrance: Karten/Widgets `FadeInDown.springify()` beim Screen-Öffnen.
- [ ] Touch: interaktive Kacheln `useAnimatedStyle`+`withSpring scale:0.97`.
- [ ] Sanfte Tab-Übergänge.

### Phase E — Features darauf
- [ ] **Next-Class-Widget**, **Timetable-Today** kompakt als echte Home-Screen-Widget-
      Vorschau-Komponenten (`react-native-widget-extension` / Expo Config Plugin),
      gespeist aus `settings.widgets` (shared Registry).
- [ ] Wochen-Stundenplan-Widget; weitere aus Snapshot denkbare Widgets
      (Klassenarbeiten, Hausaufgaben, Fehlzeiten, Elternbriefe).
- [ ] Sämtliche Emojis entfernen (Scan-Liste unten) & durch lucide ersetzen.
- [ ] Vollständige Ionicons→lucide-Migration aller restlichen Screens.

---

## 4. Konkrete Aufräum-/Scan-Listen (Checklisten)

### 4.1 Emoji-Fundstellen (TSX, Scan dieses Turns)
```
app/(tabs)/grades.tsx 🔒🧮        app/(tabs)/inbox.tsx 💬📌📍📭
app/(tabs)/index.tsx 👋           app/(tabs)/tasks.tsx ✅📅🔥🗓😌🥳🧘
app/(tabs)/timetable.tsx 🌴📊📝   app/_layout.tsx 💫😵
app/allday.tsx 🧩                app/attendance.tsx 🎉🗂
app/calendar.tsx 📅              app/documents.tsx 🗂
app/electives.tsx 🗳              app/exemption.tsx 📨
app/parent-talks.tsx 🏫🗓🧑       app/payments.tsx ✓🧾
app/search.tsx 🔍🤷               app/settings.tsx 🎨🏝🏫🔐🔔🛡🧩
app/sick-note.tsx 🤒🩺           app/thread.tsx 💬
src/features/dashboard/widgets.tsx ✉✨🌤🎈🎒🎯📊📌📍📝🥳🩹
src/ui/error-boundary.tsx 💫😵    src/ui/lock-gate.tsx 🔒
src/ui/primitives.tsx 🌱         src/ui/shell.tsx 🎒
```

### 4.2 Ionicons→lucide (Icons-API-Umschlüsselung als Referenz)
| Zweck | Ionicons (alt) | lucide (neu) |
|---|---|---|
| Start/Hero | `sparkles(-outline)` | `Sparkles` |
| Stundenplan | `calendar(-outline)` | `CalendarDays`/`Calendar` |
| Aufgaben | `checkbox(-outline)` | `CheckSquare` / `ListChecks` |
| Noten | `stats-chart(-outline)` | `BarChart3` / `Gauge` |
| Postfach | `mail(-outline)` | `Inbox` / `Mail` |
| Einstellungen | `settings-outline` | `Settings` |
| Suche | `search(-outline)` | `Search` |
| Zurück | `chevron-back` | `ChevronLeft` |
| Weiter | `chevron-forward` | `ChevronRight` |
| Schließen | `close` | `X` |
| Glocke | `notifications(-outline)` | `Bell` / `BellRing` |
| Pfeil raus | — | `ArrowUpRight` / `ArrowRight` |
| Karte aktion | — | `ArrowUpRight` |

---

## 5. Native Konfiguration (Phase E)
- Home-Screen-Widgets / Live Activities:
  `react-native-widget-extension` (iOS) oder eigener Expo Config-Plugin-Weg; vorhandenes
  natives Modul `modules/schulflow-live-island` als Ankerpunkt für Android-Widget-Daten
  (`settings.widgets` + Snapshot-Persistenz wiederverwenden).
- Secure Storage / Keychain: bereits korrekt via `expo-secure-store` (`KEYS.credentials`,
  `KEYS.session`), `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.

---

## 6. Verifikation & Abnahmekriterien
- `npm run typecheck` grün nach jeder Phase.
- `npm run export:web` baut (kein nativer Build im Sandbox möglich — auf Gerät
  `npx expo run:android`/EAS-Build nötig zur Bestätigung des APK-Fixes).
- Manuell: kalter Start (kein leerer Screen), Demo-Start, echter Login, Theme-Wechsel,
  Onboarding erstmalig & nach "Lokale Daten löschen".

_Ende Fahrplan._
