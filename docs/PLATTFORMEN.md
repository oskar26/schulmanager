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
   Seit diesem Update proxyt der Dev-Server (`metro.config.js → server.enhanceMiddleware`)
   alle Aufrufe unter **`/sm-api/*`** an die API weiter; im Web-Bundle ruft
   `src/api/client.ts` deshalb automatisch diesen Same-Origin-Pfad auf.
3. **User-Agent:** Browser dürfen ihn nicht setzen — der Proxy setzt ihn serverseitig.

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

Eigener Reverse-Proxy (nginx/Caddy)? Dann muss nur `/sm-api/*` auf
`https://login.schulmanager-online.de/*` weitergeleitet werden — oder die Env-Variable
`EXPO_PUBLIC_SM_API_BASE` auf einen beliebigen Basis-URL zeigen, dann ignoriert der
Client den eingebauten Pfad.

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
  eigener Signatur ist. Der vorgesehene Weg (Roadmap):
  1. `npx react-native-targets` / `expo-apple-targets` Widget-Extension „LiveIsland",
  2. `Activity<LiveIslandAttributes>` mit Verweis auf `ls -la modules/` API,
  3. `modules/schulflow-live-island` bekommt eine `ios`-Swift-Seite, die
     `Activity.request/update/end` aufruft — die JS-API (`show/hide`) ist schon
     darauf ausgelegt.

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

* Datei-Downloads (`storage.schulmanager-online.de`) können im Web je nach
  Server-Konfiguration am selben CORS-Problem hängen; sie laufen aus der nativen
  App und im Demo fehlerfrei.
* Kein echter Push (by design, siehe README); die Island aktualisiert sich, solange
  die App lebt bzw. im Hintergrund laufen darf.
* iOS: Live Activities bis zur WidgetKit-Extension nur In-App.
