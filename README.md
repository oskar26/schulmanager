<div align="center">

<img src="assets/logos/preview-wordmark.png" alt="Schulflow" width="420">

**Ein kompletter Neubau des Schulmanager-Online-Clients — minimalistisch, verspielt, modern.**

React Native (Expo SDK 54) · NativeWind v4 · gluestack-ui v2 · Tamagui · TypeScript

<img src="assets/logos/preview-01-flow.png" width="84"> <img src="assets/logos/preview-02-bookmark.png" width="84"> <img src="assets/logos/preview-03-bubble-grid.png" width="84"> <img src="assets/logos/preview-04-pencil-clock.png" width="84"> <img src="assets/logos/preview-05-owl.png" width="84">

</div>

---

## Warum Schulflow?

Die offizielle App ist im Kern ein WebView-Wrapper: Modulkacheln, viele Taps bis zur
Information, kein echtes Dashboard, keine sinnvollen Benachrichtigungen, keine Widgets.

Schulflow beantwortet stattdessen **eine** Frage sofort:

> **Was ist heute und morgen wichtig?**

Alles andere — Stundenplan, Aufgaben, Noten, Briefe, Fehlzeiten — ist maximal einen Tap entfernt.

| Prinzip | Umsetzung |
|---|---|
| **Minimalistisch** | Viel Weißraum, eine Primäraktion pro Screen, keine Kachelwüste |
| **Verspielt** | Runde Formen, Fach-Farben + Emoji, Micro-Animationen, Feier-Momente bei „alles erledigt“ |
| **Modern** | Große Typo, Soft-Shadows, Dark Mode, Haptics, Skeletons statt Spinner |
| **Ehrlich** | Module, die die Schule nicht gebucht hat, werden ausgeblendet statt als Fehler gezeigt |

---

## ⚠️ Wichtiger Hinweis (bitte zuerst lesen)

Schulflow ist ein **inoffizieller Drittanbieter-Client**. Es besteht keinerlei Verbindung zur
Schulmanager Online GmbH; Namen und Marken gehören ihren jeweiligen Inhabern.

* Die App spricht die **private JSON-API** von `login.schulmanager-online.de`. Diese API ist
  nicht dokumentiert und kann sich **jederzeit ohne Ankündigung ändern**.
* Bevor du Schulflow gegen einen echten Schul-Account betreibst: **kläre das mit deiner Schule
  und im Zweifel mit der Schulmanager Online GmbH ab.** Der Autor der Referenz-Doku
  ([SchmueI/Schulmanager-API](https://github.com/SchmueI/Schulmanager-API)) weist ausdrücklich
  darauf hin, dass der Einsatz von Fremdsoftware vorher abgestimmt werden sollte und dass
  exzessive Zugriffe ernste Konsequenzen haben können.
* Der Client identifiziert sich per User-Agent, drosselt sich selbst (Token-Bucket) und ruft
  nur Daten ab, die im UI auch angezeigt werden. **Bitte nicht als Scraper missbrauchen.**
* **Zum Ausprobieren ist kein Account nötig:** Schulflow startet im **Demo-Modus** mit einem
  vollständigen, erfundenen Schuljahr.

---

## Features

### Dashboard (Startseite)
Ein Feed aus **konfigurierbaren Widgets** — Reihenfolge und Sichtbarkeit stellst du in den
Einstellungen ein (↑/↓ + Schalter):

| Widget | Inhalt |
|---|---|
| ⏭️ Nächste Stunde | Live-Countdown, Raum, Lehrkraft, Vertretungs-/Ausfall-Hinweis |
| ✨ Smart Insights | Automatische Hinweise aus **allen** Daten (siehe unten) |
| 🕒 Heute-Timeline | Der komplette Tag mit „Jetzt“-Marker |
| 📝 Hausaufgaben | Offene Aufgaben nach Fälligkeit, abhaken direkt im Widget |
| 📊 Arbeiten | Countdown zu Klassenarbeiten und Tests |
| ✉️ Elternbriefe | Ungelesene und **unbestätigte** Briefe |
| 🎓 Noten | Schnitt + letzte Noten (auf Wunsch verborgen) |
| 📌 Schwarzes Brett | Aushänge der Schule |
| 🩺 Fehlzeiten | Offene, unentschuldigte Stunden |
| ⚡ Schnellaktionen | Krankmeldung, Beurlaubung, Kalender, Suche |

### Smart Insights (die Engine, die die offizielle App nicht hat)
`src/features/insights/engine.ts` kombiniert Stundenplan, Hausaufgaben, Arbeiten, Briefe,
Noten und Fehlzeiten zu handlungsrelevanten Karten:

* „Morgen 1. Stunde fällt aus — du kannst ausschlafen 😴“
* „In 2 Tagen Mathe-Arbeit, 2 Hausaufgaben in dem Fach noch offen“
* „2 Elternbriefe warten seit 4 Tagen auf Bestätigung“
* „Mit einer 2 in der nächsten Arbeit steht in Physik eine 2,7“
* **Packliste** für morgen aus Fächern + Aufgaben (Sportsachen, Taschenrechner, Zirkel …)

### Alle Schulmanager-Module, sinnvoll integriert

| Modul | In Schulflow |
|---|---|
| Stundenplan + Vertretungsplan | Wochenraster & Tagesliste, Vertretung/Ausfall/Raumwechsel farbig, Lesson-Sheet mit Details |
| Hausaufgaben (Klassenbuch) | Tab „Aufgaben“, Fortschrittsbalken, Abhaken, Gruppierung nach Fälligkeit |
| Klassenarbeiten / Leistungsnachweise | Countdown, Typ, Thema — plus automatischer **Lernplan** |
| Noten | Schnitt, bestes Fach & größter Hebel, Notenrechner, **Zielnoten-Simulator**, 1–6 *und* 0–15 Punkte |
| Elternbriefe | Lesen, Anhänge, **Lesebestätigung** direkt in der App |
| Nachrichten (Messenger) | Threads, ungelesen-Badges |
| Schwarzes Brett (Kacheln) | HTML-Aushänge sauber als Text gerendert |
| Kalender / Termine | Listen- und Monatsansicht, Termine + Arbeiten + Ferien zusammengeführt |
| Krankmeldung | Zeitraum wählen, betroffene Stunden werden vorher angezeigt |
| Beurlaubung | Antrag mit Begründung, bisherige Anträge inkl. Status (offen/genehmigt/abgelehnt) |
| Fehlzeiten | Statistik + Einzelliste, mit den **echten Entschuldigungsregeln** des Servers |
| Elternsprechtag, Ganztag, Wahlfächer, Zahlungen, Dokumente | Datenmodell + Endpunkte vorhanden, UI folgt (siehe Roadmap) |

### Zusätzlich (gibt es im Original nicht)

* 🔍 **Globale Suche** über Stunden, Aufgaben, Arbeiten, Fächer, Briefe, Nachrichten, Termine, Aushänge
* 🧠 **Automatischer Lernplan** — verteilt Lernblöcke rückwärts ab dem Prüfungstermin,
  gewichtet nach Arbeitstyp, Tag davor = Wiederholung, überladene Schultage werden übersprungen
* 🎯 **Notenrechner**: „Welche Note brauche ich für eine 2,0?“ + Simulation
* 🔔 **12 smarte Benachrichtigungsregeln** mit Ruhezeiten (siehe unten)
* 🏝️ **Live-Island** — unsere Dynamic-Island-Antwort für den Schulalltag (siehe unten)
* 💻 **Volle Web-App** — PWA-installierbar, Desktop-Sidebar, inkl. CORS-Proxy (siehe unten)
* 🖥️ **Echte Tablet- & Desktop-Layouts** — nicht gestretcht, sondern umgebaut (siehe unten)
* 🧩 **Modul-bewusst**: Was deine Schule nicht gebucht hat, verschwindet komplett —
  Tabs (z. B. Noten), Schnellaktionen, Postfach-Sparten und Einstellungen richten
  sich exakt nach eurem offiziellen Schulmanager-Menü
* 🎨 **Anpassbar**: Widget-Reihenfolge, Theme hell/dunkel/System, kompakter Stundenplan,
  Wochenende ein/aus, Haptik
* 🔒 **Privatsphäre**: Noten verbergen (Screenshot-/Bus-Modus), Biometrie-Sperre,
  „alle lokalen Daten löschen“
* 📴 **Offline**: react-query-Persistenz — die App zeigt beim Start sofort den letzten Stand

---

## 💻 Web, Tablet & Desktop — eine App, vier Formfaktoren

Schulflow reagiert auf die **echte Fenstergröße** (dp) — auf iPad Stage Manager, Xiaomi
Freeform, Split-Screen und Faltphones schaltet das Layout live um:

| Formfaktor | Fensterbreite | Navigation | Inhalt |
|---|---|---|---|
| **Phone** | < 600 dp | Bottom-Tab-Bar | 1 Spalte |
| **Tablet** | 600–1199 dp | Icon-Rail links | 2-Spalten-Widgets, Dialoge statt Sheets |
| **Desktop** | ≥ 1200 dp | Sidebar mit Labels & Konto-Karte | 3-Spalten-Dashboard, Stundenplan als Zeitraster mit Jetzt-Linie |
| **Wide** | ≥ 1600 dp | Sidebar | 3 Spalten auf ~1440 dp |

Die Web-App ist eine **installierbare PWA** mit allem, was die native App kann
(gleiche Screens, gleiche Datenquelle, adaptiertes Layout) — inklusive
`start_url`-Manifest, Homescreen-Icons, Boot-Splash und Sophora-freiem Boot.

> 📑 Details, Screenshots-Referenz und technische Tiefe: **[docs/PLATTFORMEN.md](docs/PLATTFORMEN.md)**.

---

## 🏝️ Live-Island — die Insel für die Schulstunde

Oben mittig schwebt eine Kapsel wie Apples Dynamic Island: **laufende Stunde mit
Restzeit und Fortschrittsbalken** oder **nächste Stunde mit Countdown** (ab 60 min
vorher) — inklusive Vertretungs-/Ausfall-Hinweis. Antippen klappt die Detailkarte
auf (Raum, Lehrkraft, Änderung, Sprung zum Stundenplan).

Je Plattform tut die Insel mehr:

| Plattform | Verhalten |
|---|---|
| **In-App (alle)** | Kapsel mit Live-Countdown, Fortschritt, Detailkarte |
| **Android (Dev-Build)** | dauerhafte Fortschritts-**Notification** im Shade; auf Android 15/16 als **Live-Update**-Statuschip (inkl. lokalem Kotlin-Modul `modules/schulflow-live-island`) |
| **Xiaomi HyperOS** | HyperOS stuft laufende Fortschritts-Notifications automatisch zur **Fokus-Notification** hoch — der inselartigen Darstellung um die Punch-Hole-Kamera („HyperIsland"), ohne Xiaomi-interne SDKs |
| **Expo Go** | JS-Fallback: stille Notification via `expo-notifications`, aktualisiert im Insel-Takt |
| **iOS** | In-App-Kapsel; Live Activities (Lockscreen/Dynamic Island) per WidgetKit-Extension auf der Roadmap |
| **Web** | In-App-Kapsel + **Browser-Tab-Titel** mit Countdown (`📐 Mathe · noch 23 min — Schulflow`) |

Schalter: **Einstellungen → Live-Island**. Unter Android fragt der Schalter beim
Aktivieren die Benachrichtigungs-Erlaubnis an (Tipp für HyperOS: „Autostart" +
„Akku: keine Einschränkungen" freischalten).

### Benachrichtigungen

Alle Regeln sind **lokal geplant** (kein Server, keine Push-Infrastruktur, keine Daten bei Dritten)
und einzeln abschaltbar: Vertretung/Ausfall · 1. Stunde fällt aus („Ausschlafen“) · Hausaufgaben
fällig · Arbeits-Countdown (7/3/1 Tage) · neuer Elternbrief · Erinnerung an unbestätigte Briefe ·
neue Nachricht · neue Note · Morgen-Briefing · Abend-Check · Wochenrückblick · unentschuldigte
Fehlzeit. Dazu **Ruhezeiten** (Standard 21:30–06:30) und eine frei wählbare Briefing-Uhrzeit.

### Home-Screen-Widgets

Die App schreibt nach jedem Sync ein kompaktes **Widget-JSON** (nächste Stunde mit
Fach-Farbe/-Emoji, offene Hausaufgaben, nächste Arbeit, Notenschnitt, Postfach,
Top-Insight, „Stand von …") in den gemeinsamen Datenspeicher:

* **Quelle:** `src/features/widgets/snapshot.ts` (reiner Builder, `schemaVersion`-geschützt)
* **Bridge:** `src/features/widgets/bridge.ts` → AsyncStorage (alle Builds) + natives
  Modul `modules/schulflow-widgets` (nur Dev-Builds: Android SharedPreferences +
  REFRESH-Broadcast für Glance, iOS App-Group `group.app.schulflow.client` für
  WidgetKit)
* **Layout-Spezifikation:** `widgets/spec.md` — iOS WidgetKit (Small/Medium/Large +
  Lock-Screen-Complication), Android Glance (1×1, 2×1), Fallback-Regeln, Update-Policy
* **Build:** Dev-Client erforderlich (`npx expo prebuild && npx expo run:…`),
  iOS-Widgets zusätzlich per `expo-apple-targets` — kein Expo Go

---

## Screens

```
app/
├── (tabs)/index.tsx      Dashboard (Widget-Feed)
├── (tabs)/timetable.tsx  Stundenplan (Woche/Tag)
├── (tabs)/tasks.tsx      Hausaufgaben · Arbeiten · Lernplan
├── (tabs)/grades.tsx     Noten + Rechner/Simulator
├── (tabs)/inbox.tsx      Briefe · Nachrichten · Schwarzes Brett
├── settings.tsx          Konto · Schule · Widgets · Notifications · Design · Datenschutz
├── calendar.tsx          Kalender (Liste/Monat)
├── attendance.tsx        Fehlzeiten
├── sick-note.tsx         Krankmeldung
├── exemption.tsx         Beurlaubung
└── search.tsx            Globale Suche
```

---

## Schnellstart

> 📘 **Ausführliche Schritt-für-Schritt-Anleitung inkl. Expo Go, Emulator, Dev-Build und
> Testtour durch alle Features: [AUSFÜHREN.md](AUSFÜHREN.md)**

```bash
npm install
npm run web          # Browser (Dev-Server proxyt /sm-api automatisch an die Schul-API)
npm start            # Expo Dev Server (Expo Go / Dev Client)
npm run android      # Android
npm run ios          # iOS
```

Web-App **produktiv ausliefern**:

```bash
npm run export:web   # statischer Export nach dist/
npm run serve:web    # node scripts/web-proxy.mjs — Statik + API-Proxy, fertige Web-App ab Port 8080
```

Die App startet im **Demo-Modus**. Für echte Daten: **Einstellungen → Konto → E-Mail + Passwort → Verbinden**
(2-Faktor-Code und Mehrfach-Accounts werden unterstützt).

Nützliche Skripte:

```bash
npm run typecheck      # tsc --noEmit
npm run smoke          # rendert die App headless (jsdom) und prüft jede Route auf Laufzeitfehler
npm run smoke:matrix   # alle Routes × Phone/Tablet/Desktop (Layout-Regressionstest)
npm run icons          # rendert assets/icon.png & Logo-Previews aus den SVGs
```

`npm run smoke [route]` lädt das echte Web-Bundle vom laufenden Dev-Server in jsdom, rendert es
und schlägt fehl, sobald ein Fehler in der Konsole landet oder nichts gerendert wird:

```bash
npm run web &
node scripts/smoke.mjs /grades --width=1600 --expect="Noten"
node scripts/smoke.mjs / --width=1024 --expect="2 Spalten"   # Vorhandenes Tablet-Raster prüfen
```

---

## Architektur

```
src/
├── api/          client.ts (RPC-Gateway, Rate-Limit, Web-CORS-Proxy-Basis) · auth.ts (PBKDF2-Login)
│                 poqa.ts (ORM-Gateway) · endpoints.ts (typisierte Aufrufe) · types.ts
├── data/         demo.ts (kompletter Demo-Datensatz) · queries.ts (react-query-Hooks)
├── features/     insights/ · dashboard/widgets.tsx · tasks/studyplan.ts ·
│                 grades/calculator.ts · notifications/scheduler.ts ·
│                 island/ (Live-Island: State, Kapsel-UI, System-Effekte, native Brücke)
├── design/       tokens.ts (Single Source of Truth) · subjects.ts (Fach-Farben) · tamagui.config.ts
├── state/        settings.ts (zustand, persistiert) · session.ts (Login/JWT)
├── ui/           primitives.tsx (inkl. AdaptiveContent, Dialog-Sheets) · shell.tsx (Sidebar/Rail)
│                 motion.tsx · gluestack/ (Button, Progress, Switch, Avatar …)
├── lib/          date.ts · html.ts · storage.ts · breakpoints.ts (Formfaktoren)
modules/
└── schulflow-live-island/  lokales Expo-Modul (Kotlin): Android-ongoing-/Live-Update-
                            /HyperOS-Fokus-Notification für die Insel
scripts/
├── smoke.mjs / smoke-matrix.mjs   Web-Bundle in jsdom, Layout-aware (--width/--height/--expect)
├── sm-api-proxy.cjs               geteilter CORS-Proxy (Metro-Dev + Export-Server)
└── web-proxy.mjs                  Produktiv-Server: dist/ + /sm-api
public/             index.html (PWA-Template) · manifest.webmanifest · Icons
```

**Warum drei Styling-Systeme koexistieren:** NativeWind liefert die Utility-Klassen,
gluestack-ui v2 ist selbst NativeWind-basiert (keine Runtime-Kollision), Tamagui steuert
Tokens + Animations-Driver. Alle drei lesen dieselben Werte aus `src/design/tokens.ts`.

### Die API in Kurzform

```
POST /api/get-salt   → PBKDF2-SHA512, 99 999 Runden, 512 Byte, Hex
POST /api/login      → { jwt, user, userDevice } | multipleAccounts | 2FA-Anforderung
POST /api/calls      → EIN Gateway für alles: { requests: [{ moduleName, endpointName, parameters }] }
```

Fallstricke, die der Client bereits abfängt (alle im Code kommentiert):

* `results` werden **positionell** zugeordnet — keine Correlation-ID.
* Ein Fehler-Result hat **kein `data`-Feld**, sondern `{ status, userError.germanErrorMessage }`.
* `429` kann als Result-Status **innerhalb einer HTTP-200-Antwort** stecken.
* `403` heißt „Rolle darf nicht“ **oder** „Modul nicht gebucht“ — nur `main/get-active-modules` klärt das.
* `500` ist ein **Parameterfehler**, kein Serverfehler.
* `x-new-bearer-token` ⇒ Token rotieren, `x-user-device-doesnt-exist` ⇒ hart ausloggen.
* Für Eltern ist `schedules/*` gesperrt ⇒ Stundenplan über `main/poqa` (`main/lesson` + `class-hour`
  + `course` + `room` + `subject`) inklusive Gültigkeits-Filterung mehrerer Plangenerationen.
* Entschuldigungslogik: Krankmeldung **ohne** Attest-Typ entschuldigt formal nichts;
  Attest oder Beurlaubung schon. `ExemptionRequest.granted` ist **dreiwertig** (`null` = offen).

Quellen der Recherche: [tyrann0us/schulmanager-api](https://github.com/tyrann0us/schulmanager-api)
(rekonstruierte OpenAPI, 715 Endpunkte) und [SchmueI/Schulmanager-API](https://github.com/SchmueI/Schulmanager-API).

### Sicherheit & Datenschutz

* E-Mail, Passwort, JWT und `userDevice` liegen in **expo-secure-store** (Keychain / Keystore);
  im Web im Browser-Storage — dort ist der Login bewusst als „weniger sicher“ gekennzeichnet.
* Es gibt **keinen Schulflow-Server**. Der einzige Netzwerk-Empfänger ist
  `login.schulmanager-online.de`. Keine Analytics, kein Crash-Reporting, keine Push-Server.
* Optionale Biometrie-Sperre beim Öffnen, „Noten verbergen“ und „alle lokalen Daten löschen“.

---

## Logos

Fünf eigenständige Konzepte, jeweils als sauberes, handgeschriebenes SVG (512 × 512, Squircle):

| Datei | Konzept | Idee |
|---|---|---|
| `assets/logos/01-flow.svg` | **Flow** ✅ (gewählte Primärmarke)  | Stundenplan-Raster, dessen Zeilen zu einer Welle werden |
| `assets/logos/02-bookmark.svg` | **Bookmark** | Lesezeichen + Häkchen — gemerkt & erledigt |
| `assets/logos/03-bubble-grid.svg` | **Bubble Grid** | Vier Kacheln, eine wird zur Sprechblase |
| `assets/logos/04-pencil-clock.svg` | **Pencil Clock** | Bleistift als Uhrzeiger — die Schulstunde |
| `assets/logos/05-owl.svg` | **Owl** | Geometrische Eule aus Kreisen und Bögen |

Dazu `mark-mono.svg` (einfarbig über `currentColor`, für Tab-Bar/Print) und `wordmark.svg`
(horizontale Wortmarke). `npm run icons` rastert daraus `assets/icon.png` (1024 px),
`assets/favicon.png` und die Previews.

---

## Roadmap

- [x] Web-App: eigenständig lauffähig (CORS-Proxy), installierbare PWA, Desktop-Sidebar
- [x] Tablet- & Desktop-Layouts (Rail/Sidebar, Widget-Raster, Zeitraster-Stundenplan)
- [x] Live-Island: In-App-Kapsel + Android-Benachrichtigung (HyperOS-Fokus / Android-Live-Update)
- [ ] iOS Live Activities (Dynamic Island + Lockscreen) via WidgetKit-Extension
- [ ] Service-Worker für den Web-Bundle-Cache (Daten hält schon der Query-Persist vor)
- [ ] Master-Detail im Postfach ab Desktop-Breite (Liste links, Brief rechts)
- [x] Zusatzmodule: Zahlungen, Elternsprechtag-Buchung, Wahlfächer, Ganztag, Dokumente —
      erscheinen automatisch nur, wenn die Schule sie gebucht hat
- [ ] Native Home-Screen-Widgets (WidgetKit / Android Glance) — noch nicht implementiert
- [x] iCal-Link des Kalenders teilen (`calendar/get-ical-token`, Kalender → Teilen)
- [x] Datei-Downloads inkl. clientseitiger AES-256-Entschlüsselung (Brief-Anhänge, Dokumente)
- [ ] Mehrere Kinder in einem Elternkonto parallel im Dashboard

---

## Lizenz & Marken

Privates Lernprojekt. „Schulmanager Online“ ist eine Marke der Schulmanager Online GmbH —
dieses Projekt steht in keiner Verbindung zu ihr und wird von ihr weder unterstützt noch geprüft.
