# Schulflow — Plan für die neue Schulmanager-App

> Arbeitstitel: **Schulflow** · Ein kompletter Neubau des Schulmanager-Online-Clients als
> React-Native-App (Expo) — minimalistisch, verspielt, modern.

---

## 1. Ziel & Leitidee

Die offizielle Schulmanager-Online-App ist ein WebView-Wrapper: langsam, unübersichtlich,
kein echtes Dashboard, keine Insights, keine Widgets, keine sinnvollen Notifications
(App-Store-Bewertung ~2,3/5). Schulflow macht daraus eine native, schnelle App mit
**einem Dashboard, das die Frage „Was ist heute wichtig?" in 3 Sekunden beantwortet**.

Design-Prinzipien:

| Prinzip | Umsetzung |
|---|---|
| **Minimalistisch** | Viel Weißraum, max. 1 Primäraktion pro Screen, keine Modulkacheln-Wüste |
| **Verspielt** | Runde Formen (Radius 20–28), Squircle-Icons, Micro-Animationen, Konfetti bei „alles erledigt", Fach-Farben, Emoji-Akzente |
| **Modern** | Große Typo, Soft-Shadows, Glass-/Tint-Cards, Dark Mode, Haptics, Skeletons statt Spinner |
| **Ehrlich** | Jedes Modul, das die Schule nicht gebucht hat, wird ausgeblendet statt mit Fehler gezeigt (`main/get-active-modules`) |

---

## 2. Tech-Stack (wie gefordert)

```
Expo SDK 54  ·  React Native 0.81  ·  TypeScript  ·  expo-router (file based)
├── NativeWind v4        → Utility-Styling, Dark Mode, Theming über CSS-Variablen
├── gluestack-ui v2      → Komponenten-Layer (Button, Card, Sheet, Toast, Avatar,
│                          Progress, Badge, Skeleton …) auf unstyled Primitives + NativeWind
├── Tamagui              → Design-Tokens, Animationen (moti-artig), performante
│                          Sheet-/Stack-Primitives, Theme-Bridge zu NativeWind
├── @tanstack/react-query→ Caching, Offline-Persistenz, Background-Refetch, Retry
├── zustand              → App-State (Session, Settings, Widget-Layout)
├── expo-secure-store    → E-Mail/Passwort + JWT + userDevice verschlüsselt auf dem Gerät
├── expo-notifications   → lokale, smarte Notifications (siehe §6)
└── expo-crypto/quick-crypto → PBKDF2-SHA512 für den Login-Hash
```

**Warum drei Styling-Systeme koexistieren können:** NativeWind liefert die Utility-Klassen,
gluestack-ui v2 ist *selbst* NativeWind-basiert (keine Runtime-Kollision), Tamagui wird
bewusst nur für Tokens + Animation-Driver benutzt. Alle drei lesen dieselben Design-Tokens
aus `src/design/tokens.ts` — eine Quelle der Wahrheit.

---

## 3. Die API (recherchiert)

Basis: [SchmueI/Schulmanager-API](https://github.com/SchmueI/Schulmanager-API) (Selenium-Scraper)
— zeigt *welche* Daten es gibt. Die eigentliche JSON-API haben wir aus der rekonstruierten
OpenAPI-Beschreibung ([tyrann0us/schulmanager-api](https://github.com/tyrann0us/schulmanager-api),
715 Endpunkte in 39 Namespaces) und der Home-Assistant-Integration abgeleitet. Wir sprechen die
**echte JSON-API** statt zu scrapen — schneller, stabiler, ohne Headless-Browser.

### 3.1 Authentifizierung

```
POST /api/get-salt        { emailOrUsername, mobileApp: true }        → "<salt>"
   ↓ PBKDF2-SHA512(password, salt, 99_999 Iterationen, 512 Byte) → 1024 hex chars
POST /api/login           { emailOrUsername, password, hash, mobileApp: true }
   → { jwt, user, userDevice }                     ← Erfolg
   → { multipleAccounts: [...] }                   ← Account-Auswahl (mehrere Kinder/Schulen)
   → { requireTwoFactorEmailCode | requireTOTP }   ← 2FA
POST /api/login-with-user-device  { device }       → frisches JWT (kein Passwort nötig)
POST /api/delete-user-device      { device }       → Logout
POST /api/login-status            {}               → billigster Token-Check
```

Header `x-new-bearer-token` in *jeder* Antwort ⇒ Token rotieren.
`x-user-device-doesnt-exist` ⇒ hart ausloggen.

### 3.2 Der RPC-Gateway

Fast alles läuft über **einen** Endpunkt:

```jsonc
POST /api/calls
{ "bundleVersion": "3505280ee7",        // Pflicht, Wert wird nicht geprüft
  "requests": [ { "moduleName": "letters", "endpointName": "get-letters", "parameters": {…} } ] }
→ { "results": [ { "status": 200, "data": … } ] }   // positionell zugeordnet!
```

Fallstricke, die der Client kennen muss (alle im Code abgebildet):
* `results` wird **positionell** gematcht — keine Correlation-ID.
* Ein Fehler hat **kein `data`-Feld**: `{ status, userError: { germanErrorMessage } }`.
* **`429` kann als Result-Status in einer HTTP-200-Antwort stecken.**
* `403` = „Rolle darf nicht" **oder** „Schule hat das Modul nicht gebucht" — nicht unterscheidbar.
  Einzige Autorität: `main/get-active-modules`.
* `500` = Parameterfehler, nicht Serverfehler.
* Rate-Limit-Header `x-ratelimit-*` ohne `Retry-After` ⇒ eigener Token-Bucket im Client.

### 3.3 Endpoint-Mapping (was Schulflow nutzt)

| Feature | Modul / Endpoint |
|---|---|
| Stundenplan + Vertretung | `main/poqa` → `main/lesson`, `main/class-hour`, `main/course`, `main/room`, `main/subject`, `main/term` · zusätzlich `schedules/get-actual-lessons` (wo erlaubt) |
| Hausaufgaben | `classbook/get-homework` |
| Klassenarbeiten | `exams/get-exams` |
| Noten | `grades/get-grading-information-for-student` |
| Elternbriefe | `letters/get-letters`, `letters/confirm` |
| Nachrichten | `messenger/get-subscriptions`, `get-messages-by-subscription`, `send-message`, `create-thread`, `count-new-messages`, `set-subscription-read` |
| Kalender | `calendar/get-events-for-user`, `get-event-categories`, `get-ical-token` |
| Fehlzeiten | `classbook/get-history-absences-list`, `get-statistics`, `get-entry-statistics` |
| Krankmeldung | `sick/create-sick-note` + `poqa main modules/sick/sick-note` |
| Beurlaubung | `exemptions/request-exemption` |
| Schwarzes Brett | `main/get-tiles` |
| Schule / Module / Settings | `main/get-institution`, `main/get-active-modules`, `main/get-settings` |
| Dokumente | `documents/get-root-folder`, `get-folder-contents` |
| Elterngespräche / Sprechtag | `parenttalks/get-available-proposals`, `book-proposal` |
| Ganztag | `allday/get-allday-offers`, `get-allday-messages`, `submit-allday-message` |
| Wahlfächer | `electives/is-election-editable`, `save-priorities` |
| Dateien | `POST /api/upload-file`, `GET {storage}/download-file/{b64}` (AES, client-seitig) |
| iCal-Feeds | `/ical/calendar/{token}`, `/ical/schedules/{token}` |

**Ethik/Fair Use:** eigener User-Agent (`Schulflow/1.0 (+github…)`), Request-Coalescing
(alle Calls einer Bildschirmaktion in *einem* Batch), Mindest-Refresh-Intervall,
exponentielles Backoff, kein Polling im Hintergrund unter 15 min. Steht so in der README.

---

## 4. Feature-Matrix

### 4.1 Nachgebaut (Schulmanager-Parität)

1. **Dashboard / Schwarzes Brett** — Tiles, Termine, Vertretungen
2. **Stundenplan** — Woche + Tag, Vertretung (grün), Entfall (rot durchgestrichen), Raumwechsel
3. **Hausaufgaben** — pro Fach & Datum, abhakbar (lokal)
4. **Klassenarbeiten** — Liste + Countdown
5. **Noten** — pro Fach, Notenschnitt, Gewichtungen, 1–6 und 0–15 Punkte
6. **Elternbriefe** — lesen, Anhänge, **Lesebestätigung**, Umfragen beantworten
7. **Nachrichten** — Threads, senden, Anhänge, ungelesen-Zähler
8. **Kalender** — Monat/Woche/Liste, Kategorien, Ferien
9. **Fehlzeiten** — Übersicht, entschuldigt/unentschuldigt, Statistik
10. **Krankmeldung** — Kind krankmelden (Formular + Bestätigung)
11. **Beurlaubung** — Antrag stellen, Status (offen/genehmigt/abgelehnt)
12. **Dokumente** — Ordnerbaum, Download
13. **Elternsprechtag / Sprechstunde** — Termine buchen
14. **Ganztag** — Angebote, Nachricht an Betreuung (z. B. „wird heute abgeholt")
15. **Wahlfächer** — Prioritäten setzen
16. **Zahlungen** — offene Beträge + berechneter Verwendungszweck (Base-9 + Damm-Prüfziffern)
17. **Mehrere Kinder / Accounts** — Profil-Switcher oben rechts

### 4.2 Neu erdacht (das, was die Original-App nicht kann)

| # | Feature | Nutzen |
|---|---|---|
| N1 | **Smart Insights** — Regel-Engine auf allen Daten: „Morgen 1. Stunde entfällt → 45 min länger schlafen", „3 Klausuren in 5 Tagen", „Sportzeug einpacken", „Elternbrief seit 4 Tagen unbestätigt", „Fehlzeiten steigen" | Der Kern der App |
| N2 | **Freistunden-/Heute-Timeline** mit Live-„Jetzt"-Marker & Countdown bis zur Pause | Orientierung in Sekunden |
| N3 | **Notenrechner „Was brauche ich?"** — Zielnote eingeben → nötige Note in der nächsten Arbeit | Schülerliebling |
| N4 | **Lernplaner** — Klausur + verfügbare Tage → automatisch verteilte Lernblöcke im Kalender |
| N5 | **Packliste für morgen** — aus Stundenplan + Hausaufgaben + Fach-Regeln (Sport → Sportzeug) |
| N6 | **Offline-First** — alles gecacht, App startet ohne Netz mit letztem Stand + „Stand von …" |
| N7 | **Anpassbares Dashboard** — Widgets per Drag&Drop an-/abschalten und sortieren |
| N8 | **Quick Actions** — Krankmeldung in 2 Taps vom Sperrbildschirm/Long-Press-Menü |
| N9 | **Wochenrückblick (Sonntag 18:00)** — Noten, Fehlzeiten, erledigte HA, kommende Woche |
| N10 | **Fach-Farben & Emojis** automatisch, manuell überschreibbar |
| N11 | **Elternmodus / Schülermodus** — unterschiedliche Startscreens & Aktionen |
| N12 | **Suche über alles** (⌘K-artig) — Fächer, Briefe, Termine, Lehrkräfte |
| N13 | **Export** — Stundenplan/Termine als .ics abonnieren, Noten als PDF/CSV |
| N14 | **Datenschutz-Modus** — Noten verschwommen bis Face-ID / Blur beim App-Switcher |
| N15 | **Demo-Modus** — vollständiger Datensatz ohne Login, für Screenshots & Entwicklung |

---

## 5. Informationsarchitektur

```
(tabs)
├── index        Dashboard      → Hero-Karte „Heute", Widget-Grid, Insights, Infos
├── timetable    Stundenplan    → Woche (Swipe), Tag-Detail-Sheet
├── tasks        Aufgaben       → Hausaufgaben · Klausuren · Lernplan (Segmented)
├── grades       Noten          → Fächer, Schnitt, Rechner
└── inbox        Postfach       → Elternbriefe · Nachrichten · Schwarzes Brett (Badge)

modal/stack
├── settings                    → Konto (E-Mail + Passwort), Kinder, Benachrichtigungen,
│                                 Erscheinungsbild, Dashboard-Widgets, Datenschutz, Über
├── absence/new                 → Krankmeldung
├── exemption/new               → Beurlaubung
├── calendar                    → Kalender
├── documents                   → Dokumente
├── attendance                  → Fehlzeiten
├── search                      → Globale Suche
└── onboarding                  → 3 Screens + Login
```

**Einstellungen → Konto** enthält wie gefordert **E-Mail und Passwort** (SecureStore,
Passwort nie im Klartext im State, „Verbindung testen"-Button, Sitzungs-/Geräte-Liste).

---

## 6. Notifications (lokal geplant, serverlos)

| Trigger | Beispiel | Standard |
|---|---|---|
| Vertretung/Entfall erkannt | „🎉 Morgen fällt Mathe (1. Std.) aus" | an |
| Erste Stunde entfällt | „Ausschlafen: Schule startet erst 9:45" | an |
| Hausaufgabe fällig | Abends 18:00 vorher | an |
| Klausur | 7 / 3 / 1 Tag(e) vorher | an |
| Neuer Elternbrief | sofort + Erinnerung nach 48 h ohne Bestätigung | an |
| Neue Nachricht | sofort | an |
| Neue Note | „Neue Note in Englisch: 2" | an |
| Morgen-Briefing | 07:00: Stunden, Aufgaben, Packliste | an |
| Abend-Check | 20:00: „Alles für morgen erledigt?" | aus |
| Wochenrückblick | So 18:00 | an |
| Unentschuldigte Fehlzeit | sofort | an |

Umsetzung: `expo-notifications` + `expo-background-task` (min. 15 min), Diff-Engine
(`src/features/notifications/diff.ts`) vergleicht neuen Snapshot mit letztem und erzeugt
nur *echte* Änderungen. Ruhezeiten, Kanäle (Android), Pro-Kind-Filter.

---

## 7. Widgets

* **In-App-Widgets** (sofort nutzbar): Dashboard-Grid aus 10 Widget-Typen
  (Nächste Stunde, Heute-Timeline, Hausaufgaben, Klausur-Countdown, Notenschnitt,
  Elternbriefe, Mensa, Fehlzeiten, Zitat/Motivation, Schnellaktionen) — an/aus + Reihenfolge.
* **Home-Screen-Widgets**: gemeinsamer Datenspeicher (`SharedData.json` via App Group
  `group.app.schulflow` bzw. Android `SharedPreferences`), geschrieben nach jedem Sync.
  Native Ziele über `@bacons/apple-targets` (WidgetKit, 3 Größen + Lock-Screen-Complication)
  und `react-native-android-widget` (Glance). Layout-Spezifikation + Bridge-Code liegen in
  `widgets/` und sind in der README dokumentiert (Build erfordert Dev-Client, nicht Expo Go).

---

## 8. Logos

5 eigenständige SVG-Konzepte in `assets/logos/`, jeweils mit Varianten
(Full-Color, Mono, Dark, Icon-only, App-Icon 1024):

1. **Flow** — Stundenplan-Raster, dessen Zeilen zu einer Welle werden
2. **Bookmark** — Lesezeichen + Häkchen, Squircle
3. **Bubble Grid** — 2×2 Kacheln mit Sprechblase (Nachrichten/Board)
4. **Pencil Clock** — Stift als Uhrzeiger („Stundenplan")
5. **Owl** — verspielte geometrische Eule aus Kreisen und Bögen

---

## 9. Projektstruktur

```
app/                      expo-router Routen
src/
├── api/schulmanager/     client.ts · auth.ts · rpc.ts · poqa.ts · endpoints/*.ts · types.ts
├── data/                 react-query Hooks, Query-Keys, Persistenz, Demo-Datensatz
├── features/             dashboard/ timetable/ tasks/ grades/ inbox/ absence/ insights/
│                         notifications/ widgets/
├── design/               tokens.ts · theme.ts · tamagui.config.ts · subjectColors.ts
├── ui/                   gluestack-basierte Komponenten (Button, Card, Sheet, …)
└── lib/                  date.ts · html.ts · storage.ts · crypto.ts · haptics.ts
assets/logos/             15 SVG-Dateien (5 Konzepte × Varianten)
widgets/                  Home-Screen-Widget-Spezifikation & Bridge
```

---

## 10. Umsetzungsschritte

1. ✅ Recherche API + Feature-Set
2. Scaffold Expo + expo-router + NativeWind + Tamagui + gluestack-Layer
3. Design-System (Tokens, Fach-Farben, UI-Komponenten)
4. API-Client (Auth, RPC, poqa, Endpoints, Rate-Limit, Fehlerklassen)
5. Demo-Datensatz + Data-Layer (react-query, Offline-Persistenz)
6. Insights-Engine
7. Screens: Dashboard → Stundenplan → Aufgaben → Noten → Postfach → Einstellungen
8. Krankmeldung/Beurlaubung, Kalender, Fehlzeiten, Dokumente
9. Notifications + Widgets
10. Logos (SVG) + README
