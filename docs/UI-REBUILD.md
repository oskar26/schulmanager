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
  `ListRow`, `Sheet`, `Skeleton`, `EmptyState`, `SegmentedControl`, `IconButton`, `BentoCard`, `Pill`, `RoundActionButton`).
- `src/ui/shell.tsx` — adaptive Navigation (Bottom-Tabs via @react-navigation default,
  Rail links / Sidebar auf Tablet/Desktop).
- `src/ui/motion.tsx` — `FadeInUp`, `FadeInDown`, `PressableScale`, `LivePulse` mit `react-native-reanimated` (Spring-Physik, 60/120fps).
- `src/ui/gluestack/*` — Button, Switch/Spinner/Progress/Avatar.
- `app/(tabs)/_layout.tsx` — `<Tabs>`; Floating Bottom Navigation Bar (`FloatingTabBar`) mit Reanimated Spring-Tab-Indikatoren.

**Screens:** `index` (Dashboard, header + Widget-Stack), `timetable`, `tasks`, `grades`,
`inbox` (Tabs) + `settings`, `calendar`, `attendance`, `documents`, `search`, `thread`,
`payments`, `parent-talks`, `electives`, `allday`, `sick-note`, `exemption` (Modal/Stack).

---

## 2. Design-System-Spezifikation (verbatim aus Bildanalyse)

### 2.1 Farbpalette / Color-Blocking

| Rolle | Light (Canvas/Kacheln) | Dark |
|---|---|---|
| **Canvas-Hintergrund** | Warmes Off-White/Creme `#F6F5F2` | Tiefes Slate-Navy `#0F172A` / `#111827` |
| **Hero / Noten / Haupt-Subjects** | Periwinkle `#8C8EFF` / `#EDE9FE` | akzentuiert leuchtend (`#2B2B52`) |
| **Status / Fristen / Kurse** | Warm Amber `#FFC83B` / `#FEF3C7` | `#FFC83B`-Leuchten auf dunkel (`#383015`) |
| **Erledigt / positive Quote** | Soft Mint `#10B981` / `#D1FAE5` | `#10B981` (`#163C29`) |
| **Dringend / Fehler** | Terracotta/Coral `#E0564C` / `#FEE2E2` | `#E0564C` (`#3F1D1D`) |
| **Fokus-Kacheln & Bottom-Nav** | Charcoal `#18181B` / `#111827` | `#111827` (+ Karten `#1E293B`/`#334155`) |

---

## 3. Umsetzungsphasen & Dateizuordnung

### Phase A — Grundlage & APK-Stabilität (abgeschlossen)
- [x] Root-Start härten in `app/_layout.tsx`: `flex:1` + `width/height:'100%'`, echter Canvas-Hintergrund, BootScreen-Kapsel gegen "leeren APK-Start".
- [x] Design-Tokens erweitern (`src/design/tokens.ts`, `global.css`, `tailwind.config.js`).
- [x] `lucide-react-native` verankern: Icon-Helper in `src/ui/icon.tsx`.
- [x] Root-Container (`Screen`, `SafeAreaView`, `ScrollView`) auf `flex:1` + `width:'100%'` geprüft.

### Phase B — Onboarding & Auth-Flow (abgeschlossen)
- [x] `app/onboarding.tsx`: 3-Karten Welcome-Carousel mit Reanimated Paging + Wahl-Screen (Schulmanager Online verbinden vs. Demo-Modus).
- [x] Gate in `app/_layout.tsx`: Ohne angemeldete Session & Onboarding → Onboarding anzeigen; nach Wahl in `(tabs)`.
- [x] Status (Angemeldet/Demo) in `settings.tsx` und `onboarding.tsx` jederzeit wechselbar.

### Phase C — Bento-Redesign Kern (abgeschlossen)
- [x] `app/(tabs)/_layout.tsx`: schwebende Floating Bottom Nav (lucide, `#111827`, `borderRadius 36`, rote Badge-Pills).
- [x] `src/ui/primitives.tsx`: `BentoCard`, `BentoGrid`, `Pill`, `RoundActionButton`, `AvatarStack`.
- [x] Home `app/(tabs)/index.tsx`: neuer Header, Fortschritts-Pill, `BentoGrid`-Raster.
- [x] Widgets `src/features/dashboard/widgets.tsx`: Bento-Anatomie, lucide-Header-Icons, Status-Pills.
- [x] Screens: `timetable`, `tasks`, `grades`, `inbox`, `settings` auf gestapelte Farb-Kacheln umgestellt.

### Phase D — Dark Mode & Micro-Interactions (abgeschlossen)
- [x] Theme-System konsolidieren (Light `#F6F5F2`+Pastell / Dark Slate-Navy `#0F172A`/`#1E293B`/`#334155`) — `settings.theme` (`system|light|dark`) auf ALLE Komponenten und Screens angewendet. `resolveTone` in `primitives.tsx` passt Pastelltöne automatisch an den Dark Mode an.
- [x] Entrance: Karten/Widgets `FadeInDown` / `FadeInUp` mit `springify()` und `react-native-reanimated` (60/120fps).
- [x] Touch: interaktive Kacheln, BentoCards, Buttons mit `PressableScale` (`withSpring scale:0.97`).
- [x] Sanfte Tab-Übergänge: `FloatingTabBar` mit reanimated `useSharedValue` + `withSpring` Skalierung für aktiven Tab-Hintergrund und Badge-Indikator.

### Phase E — Features darauf
- [ ] Home-Screen-Widgets / Live Activities Integration.
- [ ] Sämtliche restlichen System-Emojis entfernt & durch lucide Vektor-Icons ersetzt.

---

## 6. Verifikation & Abnahmekriterien
- `npm run typecheck` grün (0 Fehler).
- Theme-Wechsel (Hell / Dunkel / System) reagiert sofort in allen Screens.
- Micro-Interactions: Smooth spring feedback beim Tappen von Kacheln und Tabs.

_Ende Fahrplan._
