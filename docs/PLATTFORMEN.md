# Schulflow auf Web, Tablets & der Live-Island

Diese Doku erklärt, wie Schulflow sich an **Web, Phone, Tablet und Desktop** anpasst,
wie die **Live-Island** (unsere Dynamic-Island-Antwort) auf jeder Plattform funktioniert
und was bei **Xiaomi (HyperOS), iPhone und iPad** zu beachten ist.

---

## 1. Ein Code, vier Formfaktoren

Quelle: `src/lib/breakpoints.ts`. Gemessen wird die echte Fenstergröße — auf Geräten mit
Fenster-Modi (iPad Stage Manager, Xiaomi HyperOS Freeform, Split-Screen, DeX) schaltet die
App live um, **ohne dass man sie neu starten muss**.

| Formfaktor | Fensterbreite | Navigation | Inhalt |
|---|---|---|---|
| **Phone** (`phone`) | < 600 dp | Bottom-Tab-Bar | 1 Spalte, volle Breite |
| **Tablet** (`tablet`) | 600–1199 dp | **Icon-Rail links** (88 dp) | bis 2 Spalten, Lesebreite ~1120 dp, Sheets werden Dialoge |
| **Desktop** (`desktop`) | ≥ 1200 dp | **Sidebar links** (264 dp) mit Labels & Konto-Fuß | bis 3 Spalten, Dashboard ~1280 dp, Stundenplan als Zeitraster |
| **Wide** (`wide`) | ≥ 1600 dp | Sidebar | 3 Spalten, Dashboard ~1440 dp |

Was sich jenseits der Navigation ändert (`src/ui/shell.tsx`, `src/ui/primitives.tsx`):

* **Sidebar (Desktop):** Hauptnavigation mit Badges, Schnellzugriff auf Suche &
  Einstellungen, Konto-Karte (Name, Schule, Demo-Status).
* **Icon-Rail (Tablet):** kompakte Leiste — Platz für Inhalte, aber kein gestretchter Phone-Look.
* **Dashboard:** Widgets fließen als **Responsives Raster** (`flexBasis`/`flexGrow`),
  nicht als gestretchte Liste. Kopfbereich größer, Spaltenindikator im Header.
* **Stundenplan (Desktop):** echtes **Zeitraster** mit Uhrzeiten links,
  Jetzt-Linie (rot) im heutigen Tag, Stunden-Längen proportional zur Dauer.
* **Dialoge statt Sheets:** Bottom-Sheets (`Sheet` in `primitives.tsx`) werden auf
  Tablets/Desktop automatisch zu zentrierten Modal-Dialogen (~560 dp).
* **Formular-Screens** (Krankmeldung, Beurlaubung, Wahl, Suche, Thread) bleiben
  schmal zentriert (`adaptive='narrow'`) — das liest sich wie ein Dialog, nicht wie
  eine in die Breite gezogene Telefon-Seite.
* **Lesescreens** (Kalender, Fehlzeiten, Zahlungen, Briefe, Einstellungen …) laufen
  zentriert auf ~1120 dp (`adaptive='content'`).

> Wichtig: Die Breakpoints sind **dp**, nicht physische Pixel — und `tablet` beginnt
> bei 600 dp, genau wie Androids `sw600dp`-Konvention. So zählt auch ein Xiaomi Pad 6
> im Hochformat (654 dp) oder das Innendisplay eines Foldables als Tablet; ein
> Smartphone im Querformat (meist ≥ 800 dp) fällt ebenfalls in das Rail-Layout.
> Ein Xiaomi Pad 6 im Querformat (~1450 dp) bekommt die volle Desktop-Shell.

---

## 2. Web-App („funktioniert mit allem")

### 2.1 Was kaputt war — und jetzt geht

1. **Crash `Zahlungen` & `Elternsprechtag`:** Der Demo-Datensatz lieferte volle
   ISO-Timestamps, `formatDay()` erwartete `YYYY-MM-DD` und knallte.
   `src/lib/date.ts` ist jetzt timestamp-tolerant (nur die ersten 10 Zeichen zählen)
   und gibt bei ungültigen Daten Rohtext zurück statt abzustürzen.
2. **CORS:** Die API `login.schulmanager-online.de` sendet keine
   `Access-Control-Allow-Origin`-Header — jeder Browser-Aufruf wäre blockiert worden.
   Der Dev-Server (`metro.config.js → server.enhanceMiddleware`) reicht alle Aufrufe
   unter **`…/sm-api/*`** durch, der Export-Server zusätzlich **`…/sm-storage/*`**
   (Datei-Anhänge).
3. **User-Agent:** Browser dürfen ihn nicht setzen — der Durchreicher setzt ihn serverseitig.
4. **Der Web-Bug (Redesign Phase 11):** Der Mount war als **Wurzel-Pfad** `/sm-api`
   verdrahtet. Ausgeliefert wird auf GitHub Pages — ein reiner Datei-Server unter der
   Basis `/schulmanager/`. `POST /sm-api/api/calls` antwortete dort mit 404 und HTML,
   der JSON-Parse scheiterte, die Screens blieben leer. Die APK funktionierte, weil sie
   gar keinen Umweg braucht.
   Heute löst `src/api/transport.ts` den Weg pro Session **einmal** auf und prüft ihn mit
   `GET …/__health` (1,5 s), in dieser Reihenfolge: manueller Umweg (Einstellungen) →
   `EXPO_PUBLIC_SM_API_BASE` → same-origin Durchreicher **relativ zur App-Basis**
   (`document.baseURI`, damit `/`, `/schulmanager/` und jeder Unterpfad gleich laufen) →
   Direktaufruf. Ein 200 mit `text/html` (SPA-Fallback) gilt ausdrücklich als *kein*
   Durchreicher. Findet sich nichts, meldet die App **„Kein Weg durch den Browser“**,
   bevor überhaupt ein Request losgeschickt wird — kein 30-Sekunden-Timeout, kein
   rätselhaftes „Keine Verbindung“. Einstellungen → Konto zeigt die
   **Verbindungs-Karte** (aktiver Weg, Latenz, Eingabefeld für den Umweg, „Neu prüfen“).
5. **Reines Static-Hosting braucht einen dritten Hop:** `scripts/relay/` enthält einen
   Cloudflare-Worker mit genau diesem Vertrag (`/__health`, `/sm-api`, `/sm-storage`,
   optional `ALLOWED_ORIGINS`). Deployen, URL in die Einstellungen — die Web-Version ist
   repariert, ohne neuen App-Build.

### 2.2 Entwickeln

```bash
npm run web          # Dev-Server inkl. /sm-api-Proxy
```

### 2.3 Produktiv ausliefern

```bash
npm run export:web   # statischer Export nach dist/
npm run serve:web    # liefert dist/ + /sm-api-Proxy aus (Port 8080, $PORT überschreibbar)
```

`scripts/web-proxy.mjs` ist bewusst null-Abhängigkeiten-Node (Statik + SPA-Fallback + Proxy).

`scripts/web-proxy.mjs` ist bewusst null-Abhängigkeiten-Node (Statik + SPA-Fallback +
Durchreicher) und funktioniert jetzt unabhängig vom Auslieferungspfad
(`SERVE_DIR=web-build PORT=8080 node scripts/web-proxy.mjs`).

Eigener Reverse-Proxy (nginx/Caddy)? Dann muss nur `…/sm-api/*` auf
`https://login.schulmanager-online.de/*` (und `…/sm-storage/*` auf den Storage-Host)
weitergeleitet werden — oder `EXPO_PUBLIC_SM_API_BASE` auf einen beliebigen Basis-URL
zeigen. Beides entfällt, wenn Nutzer:innen den Umweg selbst eintragen:
*Einstellungen → Verbindung → Umweg (Relay)* liegt im Browserspeicher, gilt sofort und
braucht keinen neuen Build (Empfehlung für GitHub Pages: der Worker aus `scripts/relay/`).

### 2.5 APK-Styling-Pipeline (Redesign Phase 10)

Ein Styling-Ausfall im **installierten Build** ist praktisch unsichtbar: Er taucht in
keinem Typecheck auf, nicht im Web-Bundle und nicht in den Screens. Ursache war eine
doppelte NativeWind-Laufzeit — `react-native-css-interop` einmal als eigener Pin
(0.1.22), einmal als Dependency von `nativewind@4.2.6` (0.2.6). Babel injiziert in jede
Screen-Datei `require("react-native-css-interop/jsx-runtime")`, aufgelöst aus `app/` →
die 0.1.22-Kopie; der kompilierte CSS-Payload läuft über das generierte
`.cache/android.js` → die 0.2.6-Laufzeit. Zwei Registries: **nativ** löst sich jedes
`className` ins Leere auf (nur inline gesetzte `style`-Props überleben — genau das
gemeldete „nur die Hälfte ist gestylt“), **Web** bleibt unauffällig, weil dort das
echte CSS-Stylesheet im DOM greift.

Deshalb gilt jetzt:

* `package.json` pinnt `react-native-css-interop` auf exakt die Version, die nativewind
  verlangt, und setzt dieselbe Version als `overrides` → eine Kopie, für alle.
* `npm run doctor` (`scripts/style-pipeline-check.mjs`) prüft 14 Invarianten der
  Pipeline, darunter die **Auflösungs-Symmetrie** (Screen-Runtime == Payload-Runtime)
  und mit `--built=android` die Größe des kompilierten nativen StyleSheets.
* Der Workflow (`android-apk.yml`, Vorlage in `scripts/github-workflow-vorlage.yml`)
  läuft den Doctor **vor** `expo prebuild`, verwirft Metro-/NativeWind-Cache vor Gradle
  und bestätigt nach dem Build die kompilierten Styles. Ein ungestyltes APK kann so
  nicht mehr unbemerkt veröffentlicht werden.
* `src/ui/style-guard.tsx` mißt zur Laufzeit nach (ein View, dessen Größe nur aus
  `w-24 h-24` kommt) und meldet einen Ausfall in der App statt im Logcat.
* `className` bleibt die einzige Quelle für Typografie; **Struktur** (Achsen und Abstände
  im `ScreenHeader`) ist zusätzlich inline gesetzt, damit eine verlorene Klasse nichts
  überlappen kann.

Prüfen nach jedem Pull von Dependency-Änderungen:

```bash
npm ci && npm run doctor    # 14 Invarianten; Exit != 0 = Build würde ungestylt
```

### 2.4 PWA (installierbar)

* `public/index.html` (Expo-Template) bringt Manifest, `apple-mobile-web-app-*`-Meta,
  `theme-color` (hell/dunkel), `viewport-fit=cover` und einen kleinen Boot-Splash mit.
* `public/manifest.webmanifest` + Icons (512/192/maskable) → Chrome/Edge/Android bieten
  **„App installieren"** an; iOS: Teilen → „Zum Home-Bildschirm".
* Offline-Daten kommen wie in der nativen App aus der react-query-Persistenz
  (`AsyncStorage` → `localStorage`). Ein Service-Worker für das JS-Bundle ist bewusst
  noch nicht dabei (siehe Roadmap im README).

---

## 3. Live-Island 🏝️

Bestandteile (`src/features/island/`):

| Baustein | Datei | Aufgabe |
|---|---|---|
| State | `use-island.ts` | „Was zeigt die Insel?" — laufende Stunde (Restzeit) oder nächste ≤ 60 min (Countdown) |
| In-App-UI | `LiveIsland.tsx` | Kapsel oben mittig, Tap → Detailkarte (Fach, Raum, Lehrkraft, Änderungen, Fortschritt, Sprung zum Stundenplan) |
| System-Effekte | `effects.ts` | Web-Tab-Titel, Android-Notification, Deduplizierung |
| Native Brücke | `bridge.ts` / `bridge.web.ts` | Optional native Insel; Web-Stub hält Natives aus dem Web-Bundle |
| Android-Modul | `modules/schulflow-live-island/` | Lokales Expo-Modul (Kotlin): dauerhafte Fortschritts-Notification |

Verhalten je Plattform:

### Android (Dev-Build) — „Live Update" & HyperOS-HyperIsland

Das lokale Modul postet eine Notification mit
`setOngoing(true)` + `CATEGORY_PROGRESS` + Fortschrittsbalken +
`FLAG_ONGOING_EVENT` + (per Reflexion, ab Android 15/16) `setRequestPromotedOngoing(true)`
und aktualisiert sie unter derselben ID im Insel-Takt.

* **Stock Android 15/16:** wird als **Live-Update** behandelt (Statusbar-Chip über der
  Statusleiste, prominent im Shade; Fortschritt sichtbar).
* **Xiaomi HyperOS (Phones & Pads):** Genau diese Notification-Klasse (laufend +
  Fortschritt) stuft HyperOS automatisch zur **Fokus-Notification** hoch — der
  inselartigen Darstellung um die Punch-Hole-Kamera, gemeinhin „HyperIsland" genannt.

> ⚠️ **Warum kein Xiaomi-SDK?** Das proprietäre Miui-Fokus-Protokoll von HyperOS
> (Broadcast-Protocol für reichere Inseln) ist nicht öffentlich lizenzierbar und vor
> allem auf Xiaomi-System-Apps und zertifizierte Partner beschränkt. Der saubere,
> dokumentierte Weg — ongoing Progress Notification — löst auf HyperOS dieselbe
> Systembehandlung aus und funktioniert gleichermaßen auf Pixels, Samsungs, Oppos …

* **Expo Go:** Das native Modul ist nicht verlinkt. Schulflow fällt dann auf eine
  stille, minütlich aktualisierte Notification über `expo-notifications` zurück
  (Kanal „Nächste Stunde · Live", Importance LOW) — gleiche Info, ohne System-Chic.

Für die volle Variante braucht es einen **Dev-Build** (lokal oder EAS):

```bash
npx expo prebuild --clean        # erzeugt android/ – das Modul wird per Autolinking gelinkt
npx expo run:android             # oder: eas build --profile development --platform android
```

Damit die Insel auf HyperOS **zuverlässig** tickt, gehört außerdem zu Xiaomi-Realität:
in den Systemeinstellungen der App *Benachrichtigungen* erlauben + „**Autostart**"
aktivieren + Akku-Optimierung auf „**Keine Einschränkungen**" (sonst pausiert MIUI/
HyperOS Hintergrund-Updates gern). HyperOS 2: „Fokus-Benachrichtigungen" des Systems
aktiviert lassen (Standard: an).

### iOS (iPhone ab 14, iPad)

* In der App ist die Kapsel da — Countdown, Fortschritt, Detailkarte.
* **Echte Live Activities** (Lockscreen, Dynamic Island auf iPhone 14 Pro+) brauchen
  eine **WidgetKit-Extension** (eigenes Native-Target mit `ActivityKit`) — die lässt
  sich nicht in ein Expo-Modul packen, weil sie ein separates App-Extension-Binary mit
  eigener Signatur ist. Stand (2026-09-03): Die Swift-Seite existiert im Repo
  (`modules/schulflow-live-island/ios/` — ActivityKit-`show`/`hide` hinter der
  vorhandenen JS-API + `LiveIslandAttributes`/View/Timeline-Provider als
  Referenz-Extension). Es fehlt nur noch der Target-Build:
  1. `npx expo-apple-targets` → Widget-Extension „LiveIsland" anlegen,
  2. `LiveIslandAttributes.swift` (Attributes + View + Provider) in die Extension
     übernehmen, App-Group setzen,
  3. Dev-Build: `npx expo run:ios`.

### Web

* In-App-Insel + **Browser-Tab-Titel** tickt mit:
  `📐 Mathematik · noch 23 min — Schulflow`
  *(Emoji im Tab-Titel ist gewollt — System-Oberfläche ohne eigenes Icon,
  siehe Emoji-Regel in `docs/UI-REBUILD.md` §0.)*
* Installiert als PWA (siehe 2.4) macht das aus dem Browser-Tab eine Insel-App.

Einstellung: **Einstellungen → Live-Island** (an/aus). Unter Android fragt der
Schalter beim Aktivieren die Benachrichtigungs-Erlaubnis an.

---

## 4. Geräte-Notizen

| Gerät | Besonderheit |
|---|---|
| **iPhone** | Safe-Areas beachtet; Kapsel sitzt unter der Dynamic Island. `status-bar-style: black-translucent` + `viewport-fit=cover` lassen die PWA bis unters Notch laufen. |
| **iPad** | `supportsTablet: true`, `requireFullScreen: false` → Split View & Stage Manager schalten live zwischen Phone/Tablet/Desktop-Layout; Drehen erlaubt (`orientation: default`). |
| **Xiaomi Phone (HyperOS)** | Edge-to-edge, Punch-Hole-Safe-Area; Island-Notification wird Fokus-Notification (siehe 3). Schrift-Skalierung des Systems füllt unsere Flex-Layouts, keine harte Mindestbreite. |
| **Xiaomi Pad / Pad SE** | Tablets ab 600 dp bekommen die Rail, Querformat ≥ 1200 dp die Desktop-Shell; HyperOS-Freeform-Fenster schalten Layout beim Ziehen. |
| **Faltphones** | Schmale Außendisplays bleiben Phone-Layout, aufgeklappt Tablet — ohne Neustart. |

Statusleisten: `expo-status-bar` folgt dem App-Theme; Android läuft
`edgeToEdgeEnabled`.

---

## 5. Automatische Layout-Prüfung

```bash
node scripts/smoke.mjs /timetable --width=390                # ein Screen, Phone
node scripts/smoke-matrix.mjs --quick                        # Kern-Routen × 3 Formfaktoren
node scripts/smoke-matrix.mjs                                # alle 17 Routen × 3 Formfaktoren
```

Der Smoke-Test bettet das **echte Web-Bundle** in jsdom mit definierter
Fenstergröße ein (`visualViewport`-Stub) und schlägt fehl, wenn ein Screen wirft,
nichts rendert oder ein erwarteter Text fehlt (`--expect=…`).

---

## 6. Bekannte Grenzen (ehrlich)

* Datei-Downloads (`storage.schulmanager-online.de`) hingen im Web am selben
  CORS-Problem wie die API. Seit Phase 11 läuft der Download über den jeweils
  aktiven Umweg (`…/sm-storage/*`); ohne Durchreicher und ohne Relay bleibt er im
  Browser blockiert — nativ und im Demo fehlerfrei.
* Kein echter Push (by design, siehe README); die Island aktualisiert sich, solange
  die App lebt bzw. im Hintergrund laufen darf.
* iOS: Live Activities bis zur WidgetKit-Extension nur In-App.
