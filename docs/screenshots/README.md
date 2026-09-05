# Abschluss-Snapshots — Phase 4 (UX-Polishing & Abnahme)

Statische Aufzeichnungen der **real gerenderten Web-App** nach Abschluss von Phase 4.

## Was ist das?

Jede `*.html`-Datei ist ein vollständiger DOM-Snapshot der App **nach dem Render**,
erzeugt von `scripts/smoke.mjs` (`--html-out`):

- gerendert in jsdom aus dem echten Metro-Bundle (gleicher Pfad wie die Smoke-Tests),
- inkl. vollständigem CSS (Tamagui-Variablen + NativeWind-Utilities aus dem Web-Export),
- Dark-Mode-Varianten über `html.dark` + `.dark`-Regeln,
- Hover-/Press-Regeln sind im CSS enthalten (`hover\:…:hover`), im statischen
  Snapshot aber naturgemäß ohne Interaktion.

## Warum HTML statt PNG?

In der CI-Sandbox ist kein Browser-Binary verfügbar (Chromium-/Playwright-CDN
blockiert). Die Snapshots sind trotzdem **eins zu eins das echte Rendering** —
einfach im Browser öffnen. Phone-Aufnahmen liegen als 390×844-Kachel auf
neutralem Untergrund vor.

> Frische Screenshots nach weiteren Änderungen:
> ```bash
> EXPO_OFFLINE=1 npx expo start --port 8081 &   # Metro
> node scripts/smoke.mjs / --width=390 --html-out=docs/screenshots/dashboard-phone-light.html
> ```

## Live erleben (Micro-Interactions!)

Hover-, Press- und Layout-Animationen leben nur in der echten App:

```bash
npx expo export --platform web && node scripts/web-proxy.mjs   # → http://localhost:8080
```

Im Onboarding „Los geht’s“ → „Mit Beispieldaten“ wählen, dann z. B. in
**Aufgaben** eine Hausaufgabe abhaken (Karte rutscht per Spring in „Erledigt“)
oder auf dem Desktop mit der Maus über Karten und Listen streichen.

## Bestand (Phase 4, 2026-09-03)

| Datei | Szene |
|---|---|
| `dashboard-phone-light/dark.html` | Dashboard, 390 px, hell/dunkel |
| `timetable-phone-light/dark.html` | Stundenplan-Tages-Timeline, 390 px |
| `tasks-phone-light/dark.html` | Aufgaben, 390 px |
| `grades-phone-light/dark.html` | Noten (Lime-Hero), 390 px |
| `inbox-phone-light/dark.html` | Postfach, 390 px |
| `dashboard-desktop-light.html` | Dashboard mit Sidebar, 1600 px |
| `timetable-desktop-light.html` | Stundenplan-Zeitraster, 1600 px |
| `tasks-desktop-dark.html` | Aufgaben dunkel mit Sidebar, 1600 px |
