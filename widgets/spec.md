# Schulflow Home-Screen-Widgets — Spezifikation & Bridge

> Master-Dokument für die nativen Home-Screen-Widgets (Phase E, Punkt 1).
> Gemeinsamer Datenspeicher: die App schreibt nach jedem Sync ein kompaktes
> JSON, das Widget-Extension (iOS WidgetKit / Android Glance) nur *lesen* muss.
> Die Extensions rendern kein React — sie zeichnen Vektor-Views aus JSON.

---

## 1. Datenfluss

```
Snapshot (react-query)
   │  src/data/queries.ts — nach jedem Sync (auch Demo-Modus)
   ▼
buildWidgetSnapshot()                src/features/widgets/snapshot.ts
   │  reines JSON, schemaVersion-geschützt
   ▼
writeWidgetData()                    src/features/widgets/bridge.ts
   ├─► AsyncStorage  schulflow.widgets.snapshot   (alle Plattformen, Debug-Zugang)
   └─► natives Modul  modules/schulflow-widgets   (nur Dev-Builds)
         ├─ Android: SharedPreferences `schulflow_widget_data` → Key `snapshot`
         │           + Broadcast `app.schulflow.client.widget.REFRESH`
         └─ iOS:     App-Group `group.app.schulflow.client`
                     (Datei `SharedData.json`) — JS-Seite folgt demselben
                     Modul-Vertrag; in Expo Go ist nichts verlinkt.
```

**Update-Policy (Fair-Use):** Widgets werden nur bei echten Snapshot-Änderungen
geschrieben (gleiche Throttle-Logik wie Notifications: 5-Min-Mindestintervall im
Sync) und über den Refresh-Broadcast sofort geweckt — kein Polling in der
Extension, kein `TimelineReloadPolicy.afterNext`.

## 2. JSON-Schema (Schema-Version 1)

Produziert von `buildWidgetSnapshot()` — diese Datei ist die *einzige* Wahrheit
für die nativen Targets. `schemaVersion` erlauben inkompatible Änderungen.

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2026-09-03T14:30:00.000Z",   // „Stand von …" in der Ecke
  "demo": false,
  "student": { "name": "Mara Hoffmann", "className": "10b" },
  "nextLesson": {
    "subject": "Mathematik",
    "emoji": "📐",           // System-Oberfläche — Emoji erlaubt (s. UI-REBUILD §0)
    "color": "#635BFF",      // Fach-Farbe aus src/design/subjects.ts
    "start": "08:00", "end": "09:00",
    "room": "R. 208", "teacher": "Herr Brandt",
    "state": "regular",      // regular | substitution | cancelled | room-change
    "label": "noch 23 min"
  },
  "homework": { "open": 2, "total": 5,
    "items": [ { "subject": "Deutsch", "color": "#E05353", "due": "2026-09-04", "text": "…" } ] },
  "nextExam": { "subject": "Physik", "color": "#635BFF", "date": "2026-09-06", "days": 3, "type": "Klausur" },
  "grades": { "average": 2.14, "recent": [ { "subject": "Englisch", "value": "2", "color": "#A3E635" } ] },
  "inbox": { "lettersPending": 1, "unreadMessages": 2 },
  "board": { "title": "Wandertag", "excerpt": "Start am Freitag 07:45 …" },
  "insight": { "title": "Morgen 45 min länger schlafen", "body": "…", "tone": "positive" },
  "schoolOver": false
}
```

**Fallback-Regeln für die nativen Targets:**
* Feld fehlt / `null` → den Widget-Bereich *ausblenden*, nie „—“ zeichnen.
* `generatedAt` älter als 24 h → Zeitstempel rot markieren („veraltet").
* `nextLesson.state = "cancelled"` → durchgestrichen + „entfällt" (kein Grün-Rot-Chaos:
  Farbe `#E05353` auf dem Label).
* Dark Mode: Fach-Farben bleiben, Canvas-Wechsel über `ColorScheme`/`glance Theme`.

## 3. Design-Sprache (aus `docs/UI-REBUILD.md` §2)

* Kacheln: Radius 28–32 (iOS: `.containerBackground` + 28 dp), Buttons/Pills `9999`.
* Padding 20–24, Gaps 12–16, Überschriften `weight 800`, Untertitel klein/reduziert.
* Fach-Farben + `tint()`-Äquivalent (14–18 % Alpha) als farbiger Block.
* **Icons: SF-Symbols (iOS) bzw. Android-Vector-Drawables (Glance)** — dieselben
  Motive wie lucide (Buch, Glocke, Hausaufgabe, Ziel). Keine Emojis in Kacheln,
  außer das Fach-Emoji der `nextLesson` (gewollt, s. §2).
* Font-Skalierung: iOS `@Environment(\.dynamicTypeSize)` respektieren;
  Glance: `Font.Body/TitleMedium` des System-Fonts.

## 4. iOS — WidgetKit (Target „SchulflowWidgets")

Zwei Targets, beide via `npx expo-apple-targets` (Dev-Client, nicht Expo Go):

| Target | Typ | Inhalt |
|---|---|---|
| `SchulflowWidgets` | Widget-Extension | 3 Home-Screen-Größen + Lock-Screen-Complication |
| `LiveIsland` | Widget-Extension | Dynamic Island / Lockscreen-Live-Activity (`modules/schulflow-live-island/ios/`) |

### 4.1 Home-Screen

* **Small (170×170 pt):** `nextLesson` — Fach-Emoji + Fach-Farbblock, Fachname
  (800), `label` (Pill), „Stand von …" (9 pt, 40 % Opazität). Kein `nextLesson` →
  `schoolOver`-Kachel („Schule ist aus" + Check) oder Top-Insight.
* **Medium (364×170 pt):** links `nextLesson`, rechts 2-Zeilen-Stack:
  `homework.open` („2 Aufgaben") + `nextExam` („Physik in 3 Tagen").
* **Large (364×382 pt):** Kopfzeile `student.name` + `generatedAt`;
  darunter `nextLesson`-Kachel (volle Breite), dann Grid 2×2:
  Hausaufgaben · nächste Arbeit · Notenschnitt · Postfach (`inbox`).
* **Lock-Screen (accessory):** `accessoryCircular` = Fortschritt `nextLesson`,
  `accessoryRectangular` = Fach-Emoji + Fachname + Uhrzeit,
  `accessoryInline` = „📐 Mathe · noch 23 min".
* Timeline: `.atEnd`-Eintrag + Reload nach REFRESH-Broadcast
  (`WidgetCenter.shared.reloadTimelines` aus der App nach dem Schreiben).

### 4.2 App-Group

`NSAppGroupContainers: ["group.app.schulflow.client"]` (beide Targets).
Die App schreibt `SharedData.json` in den Group-Container (Bridge:
`modules/schulflow-widgets`, iOS-Seite analog zur Android-Kotlin-Seite).

## 5. Android — Glance (Dev-Build)

* Abhängigkeit im App-Modul: `androidx.glance:glance:1.0.0` +
  `androidx.glance-appwidget:glance-appwidget`.
* Zwei `Widget`-Kompositionen: `SchulflowSmall` (1×1) = `nextLesson`,
  `SchulflowMedium` (2×1) = `nextLesson` + Homework/Exam-Stack.
* Datenquelle: `SharedPreferences("schulflow_widget_data")["snapshot"]`
  (Kontext-Abgleich über `createGlanceAppWidget` + StateReader).
* Sofort-Refresh: BroadcastReceiver auf `app.schulflow.client.widget.REFRESH`
  (von `modules/schulflow-widgets` gesendet) → `WidgetContext.requestUpdate()`.
* `glanceAppWidget`-Receiver in `AndroidManifest.xml`,
  `initialLayout` auf `@layout/…`-Standard, Update-Intervall 30 min
  (`UPDATE_PERIODICALLY`-Minimum).

### Referenz-Implementierung (Kurzform)

```kotlin
@GlanceAppWidget
class SchulflowSmall : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context) {
    val json = context.getSharedPreferences("schulflow_widget_data", 0)
      .getString("snapshot", null) ?: return
    val lesson = parseNextLesson(json) ?: return
    SchulflowSmallWidget(lesson).render(context)
  }
  companion object {
    val receiver: BroadcastReceiver = createGlanceAppWidgetReceiver {
      SchulflowSmallWidget(parseNextLesson(it.readSharedSnapshot())!!)
    }
  }
}

@Composable
fun SchulflowSmallWidget(lesson: NextLesson) {
  Row(Modifier.fillMaxSize().background(Color(0xFFF6F4EE)).clip(RoundedCornerShape(28.dp))) {
    // Fach-Emoji-Kachel (Farbblock tint 16 %), dann Titel(800) + Label-Pill
  }
}
```

*(Vollständiger Code folgt, sobald das Glance-Target im Dev-Build verdrahtet ist —
diese Datei ist bis dahin die verbindliche Layout-Spezifikation.)*

## 6. Verdrahten (Beide Plattformen)

```bash
# Android
npx expo prebuild --clean
npx expo run:android          # Module werden per Autolinking gelinkt

# iOS (Widget-Targets anlegen, dann)
npx expo-apple-targets list   # „SchulflowWidgets" + „LiveIsland"
npx expo run:ios
```

* **Expo Go:** keine Widgets (kein eigenes Binary) — die JS-Brücke liefert
  `isSupported() = false`, die App bleibt unverändert lauffähig.
* **In-App-Vorschau:** Einstellungen → Dashboard zeigt dieselben Daten (gleiche
  Quelle), der DevTools-Zugriff liegt unter AsyncStorage-Key
  `schulflow.widgets.snapshot`.
