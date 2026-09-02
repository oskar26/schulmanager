# Schulflow ausführen & testen

Diese Anleitung führt dich Schritt für Schritt von „frisch geklont“ bis „läuft auf meinem Handy“.
Du brauchst **keinen Schulmanager-Account** – die App startet im **Demo-Modus** mit einem
kompletten, erfundenen Schuljahr.

Inhalt:

1. [Voraussetzungen](#1-voraussetzungen)
2. [Installation](#2-installation)
3. [Variante A – im Browser (schnellster Weg)](#3-variante-a--im-browser-schnellster-weg)
4. [Variante B – auf dem echten Handy mit Expo Go](#4-variante-b--auf-dem-echten-handy-mit-expo-go)
5. [Variante C – Android-Emulator / iOS-Simulator](#5-variante-c--android-emulator--ios-simulator)
6. [Variante D – eigener Dev-Build (für Notifications & Widgets)](#6-variante-d--eigener-dev-build-für-notifications--widgets)
7. [Was du in der App ausprobieren solltest](#7-was-du-in-der-app-ausprobieren-solltest)
8. [Echten Schulmanager-Account verbinden](#8-echten-schulmanager-account-verbinden)
9. [Automatische Tests (Typecheck & Smoke-Test)](#9-automatische-tests-typecheck--smoke-test)
10. [Problemlösungen](#10-problemlösungen)

---

## 1. Voraussetzungen

| Was | Version | Prüfen mit |
|---|---|---|
| **Node.js** | 20 LTS oder 22 LTS | `node -v` |
| **npm** | ≥ 10 | `npm -v` |
| **Git** | beliebig | `git --version` |
| Handy (optional) | iOS 15+ / Android 8+ mit App **Expo Go** | – |

Node bekommst du unter <https://nodejs.org> (LTS-Version wählen).
Für das Handy: **Expo Go** aus dem App Store bzw. Google Play installieren.

> Es wird **kein** Xcode und **kein** Android Studio benötigt, solange du im Browser oder mit
> Expo Go testest.

---

## 2. Installation

```bash
git clone https://github.com/oskar26/schulmanager.git
cd schulmanager
git checkout arena/01a063b4-schulmanager   # der Branch mit Schulflow
npm install
```

`npm install` dauert beim ersten Mal 1–3 Minuten.

---

## 3. Variante A – im Browser (schnellster Weg)

```bash
npm run web
```

Der Dev-Server startet und zeigt:

```
› Web is waiting on http://localhost:8081
```

Öffne <http://localhost:8081> im Browser. Fertig. 🎉

Tipps:

* Mit **F12 → Gerätesimulation (Strg/Cmd + Shift + M)** und einem Profil wie „iPhone 14 Pro“
  siehst du das echte Mobil-Layout.
* Änderungen an Dateien werden **live neu geladen** (Fast Refresh).
* Beenden mit `Strg + C` im Terminal.

---

## 4. Variante B – auf dem echten Handy mit Expo Go

Das ist die Variante, die sich am meisten nach „echter App“ anfühlt.

1. **Expo Go** auf dem Handy installieren (App Store / Google Play).
2. Handy und Computer ins **gleiche WLAN** bringen.
3. Im Projektordner starten:

   ```bash
   npm start
   ```

4. Im Terminal erscheint ein **QR-Code**:
   * **Android:** Expo Go öffnen → „Scan QR code“ → Code scannen.
   * **iOS:** die normale **Kamera-App** öffnen, QR-Code scannen, auf die Einblendung tippen.
5. Beim ersten Start lädt Expo das JavaScript-Bundle (ein paar Sekunden), danach startet Schulflow.

**Nützliche Tasten im Terminal** (während `npm start` läuft):

| Taste | Wirkung |
|---|---|
| `w` | im Browser öffnen |
| `a` | Android-Emulator starten |
| `i` | iOS-Simulator starten (nur macOS) |
| `r` | App neu laden |
| `j` | Debugger öffnen |
| `Strg + C` | Server beenden |

**Im gleichen WLAN geht nichts?** Dann Firmen-/Gäste-WLAN oder Firewall blockt. Nutze einen Tunnel:

```bash
npx expo start --tunnel
```

Beim ersten Mal fragt Expo, ob `@expo/ngrok` installiert werden darf → mit `y` bestätigen.
Der Tunnel funktioniert auch über Mobilfunk.

**Auf dem Handy schütteln** (oder mit drei Fingern tippen) öffnet das Expo-Entwicklermenü –
dort gibt es „Reload“ und „Toggle performance monitor“.

---

## 5. Variante C – Android-Emulator / iOS-Simulator

Nur nötig, wenn du kein Handy nutzen willst.

**Android** (Android Studio installiert, ein AVD angelegt, Emulator läuft):

```bash
npm run android
```

**iOS** (nur macOS, Xcode + Command Line Tools installiert):

```bash
npm run ios
```

Beim ersten Aufruf installiert Expo automatisch Expo Go im Emulator/Simulator.

---

## 6. Variante D – eigener Dev-Build (für Notifications & Widgets)

Expo Go ist eine fremde Hülle – ein paar Dinge kann sie prinzipbedingt nicht:

| Funktion | Expo Go | Eigener Dev-Build |
|---|---|---|
| Alle Screens, Demo-Daten, Login | ✅ | ✅ |
| Geplante lokale Benachrichtigungen | ⚠️ eingeschränkt (Android: ja, iOS: nur im Vordergrund zuverlässig) | ✅ |
| Home-Screen-Widgets | ❌ | ✅ |
| Face ID / Fingerabdruck-Sperre | ⚠️ teilweise | ✅ |
| Secure-Store (Keychain/Keystore) | ✅ | ✅ |

So baust du einen eigenen Build – **kein Mac nötig**, das läuft in der Cloud:

```bash
npm i -g eas-cli
eas login                 # kostenloser Expo-Account
eas build:configure
eas build --profile development --platform android   # oder: ios
```

Nach ein paar Minuten bekommst du einen Download-Link (Android: `.apk` direkt installierbar).
Danach startest du den Dev-Server mit

```bash
npx expo start --dev-client
```

und öffnest die installierte Schulflow-App statt Expo Go.

Eine installierbare Test-Version für andere:

```bash
eas build --profile preview --platform android
```

---

## 7. Was du in der App ausprobieren solltest

Eine kleine Testtour durch die Features – alles funktioniert im Demo-Modus:

1. **Dashboard**
   * Karte „Nächste Stunde“ mit Countdown ansehen.
   * **Smart Insights** durchlesen – die Hinweise sind aus Stundenplan, Aufgaben, Arbeiten,
     Briefen und Noten berechnet.
   * Ganz unten die **Schnellaktionen** (Krankmeldung, Beurlaubung, Kalender, Suche).
2. **Stundenplan** → oben zwischen **Woche** und **Tag** umschalten; eine Stunde antippen →
   Detail-Sheet mit Lehrkraft, Raum, Vertretungsinfo.
3. **Aufgaben** → Hausaufgaben abhaken (Fortschrittsbalken reagiert) → Tab **Arbeiten** →
   Tab **Lernplan**: der automatisch erzeugte Lernplan zählt rückwärts ab dem Prüfungstermin.
4. **Noten** → ein Fach antippen:
   * **Zielnote** wählen → „Welche Note brauche ich?“
   * Im **Simulator** eine hypothetische Note wählen → neuer Schnitt inkl. Differenz.
   * Oben rechts **„verbergen“** – der Bus-/Screenshot-Modus.
5. **Postfach** → **Briefe / Nachrichten / Brett** umschalten; einen Brief mit
   „Bestätigung nötig“ öffnen und **Lesebestätigung** senden.
6. **Einstellungen** (Zahnrad oben rechts auf dem Dashboard):
   * **Dashboard-Widgets** mit ↑/↓ umsortieren und ein-/ausschalten → zurück zum Dashboard,
     die Reihenfolge ist sofort übernommen und wird gespeichert.
   * **Benachrichtigungen**: 12 Regeln, Ruhezeiten, Briefing-Uhrzeit → „Zeitplan neu berechnen“.
   * **Erscheinungsbild**: Hell / Dunkel / System, verspielte Animationen, kompakter Stundenplan,
     Wochenende ein-/ausblenden.
   * **Datenschutz**: Noten verbergen, Biometrie-Sperre, lokale Daten löschen.
7. **Krankmeldung** → Zeitraum wählen: die betroffenen Unterrichtsstunden werden **vorher**
   angezeigt. (Im Demo-Modus wird nichts übertragen.)
8. **Beurlaubung** → Antrag mit Begründung; unten die bisherigen Anträge mit Status
   offen / genehmigt / abgelehnt.
9. **Kalender** → **Liste** und **Monat**; Termine, Arbeiten und Ferien sind zusammengeführt.
10. **Fehlzeiten** → Statistik und Einzelliste mit den echten Entschuldigungsregeln.
11. **Suche** (Lupe im Dashboard) → z. B. `Mathe`, `Klassenarbeit`, `Elternabend` eingeben –
    sucht gleichzeitig in Stunden, Aufgaben, Noten, Briefen, Nachrichten, Terminen, Aushängen.

---

## 8. Echten Schulmanager-Account verbinden

> ⚠️ Bitte zuerst den Hinweis im [README](README.md#️-wichtiger-hinweis-bitte-zuerst-lesen) lesen:
> Schulflow ist ein **inoffizieller** Client. Kläre den Einsatz mit deiner Schule ab.

1. **Einstellungen → Konto**
2. E-Mail-Adresse und Passwort deines Schulmanager-Zugangs eintragen → **Verbinden**.
3. Sonderfälle werden unterstützt:
   * **Zwei-Faktor-Code**: Feld erscheint automatisch, wenn der Server ihn verlangt.
   * **Mehrere Kinder / Accounts**: Auswahlliste erscheint, gewünschten Account antippen.
4. **Demo-Modus** aus- oder wieder einschalten: gleicher Bildschirm, Schalter „Demo-Modus“.

Zugangsdaten und Token liegen in `expo-secure-store` (Keychain / Android-Keystore); im Browser
im lokalen Speicher. Es gibt keinen Schulflow-Server – die App spricht ausschließlich mit
`login.schulmanager-online.de`.

Abmelden: **Einstellungen → Konto → Verbindung trennen**, komplettes Aufräumen über
**Datenschutz → Alle lokalen Daten löschen**.

---

## 9. Automatische Tests (Typecheck & Smoke-Test)

```bash
npm run typecheck     # TypeScript: muss ohne Ausgabe durchlaufen
```

Der Smoke-Test rendert die App **headless** (Node + jsdom) mit dem echten Web-Bundle und
schlägt fehl, sobald ein Laufzeitfehler auftritt oder ein Screen leer bleibt:

```bash
npm run web &         # Dev-Server muss laufen
npm run smoke         # Startseite
node scripts/smoke.mjs /grades     # einzelne Route
```

Alle Routen auf einmal:

```bash
for r in / /timetable /tasks /grades /inbox /settings /calendar /attendance /search /sick-note /exemption; do
  node scripts/smoke.mjs "$r" | tail -1
done
```

Icons/Logos neu rendern (nach Änderungen an den SVGs):

```bash
npm run icons
```

---

## 10. Problemlösungen

| Symptom | Lösung |
|---|---|
| `TypeError: fetch failed` beim Start | Kein/eingeschränkter Internetzugang. Start mit `EXPO_OFFLINE=1 EXPO_NO_TELEMETRY=1 npx expo start --web` – dann überspringt Expo die Versionsprüfung. |
| Weißer Bildschirm oder alte Version | Cache leeren: `npx expo start --clear` |
| „Port 8081 already in use“ | `npx expo start --port 8082` oder alten Prozess beenden (`lsof -ti:8081 \| xargs kill`) |
| Handy findet den Server nicht | Gleiches WLAN? Sonst `npx expo start --tunnel` |
| Expo Go zeigt „Incompatible SDK“ | Expo Go im App Store aktualisieren (Projekt nutzt **SDK 54**) |
| Merkwürdige Modul-Fehler nach `git pull` | `rm -rf node_modules package-lock.json && npm install` |
| `ENOSPC: System limit for number of file watchers` (Linux) | `echo fs.inotify.max_user_watches=524288 \| sudo tee -a /etc/sysctl.conf && sudo sysctl -p` |
| Notifications kommen nicht | In Expo Go eingeschränkt – siehe [Variante D](#6-variante-d--eigener-dev-build-für-notifications--widgets). Außerdem Systemberechtigung prüfen und die Ruhezeiten in den Einstellungen. |
| Login schlägt mit 403 fehl | Der Server meldet „untrusted network“ oder die Schule hat das Modul nicht gebucht. Einmal im Browser bei Schulmanager anmelden und dann erneut versuchen. |

Wenn gar nichts hilft: `npm run typecheck` und `npm run smoke` ausführen – die Ausgaben zeigen
meistens genau, welche Datei Ärger macht.
