# 📱 Schulflow ohne PC testen — Anleitung fürs Smartphone

Du brauchst **keinen Computer**. Alles läuft über die GitHub-Website im Handy-Browser
(oder die GitHub-App). Es gibt zwei Testwege — beide kostenlos:

| Weg | Was ist das? | Aufwand |
|---|---|---|
| **1. Web-App** | Die App läuft direkt im Handy-Browser (Chrome). Sofort startklar. | 2 Klicks, einmalig |
| **2. Echte APK** | Installierbare Android-App (wie aus dem Play Store). Notifications, Biometrie, alles echt. | Einmal Datei anlegen, danach automatisch |

---

## Weg 1: Web-App (2 Klicks)

Der Web-Build liegt schon fertig im Branch `gh-pages`. Du musst nur einmal die Seite aktivieren:

1. Öffne im Browser: **github.com/oskar26/schulmanager** (am besten im Desktop-Modus der
   Browser-App — in Chrome: Menü ⋮ → „Desktop-Site").
2. Tab **Settings** → links **Pages**.
3. Bei **Build and deployment → Source**: „Deploy from a branch" wählen.
4. Branch: **gh-pages**, Ordner: **/ (root)** → **Save**.
5. Nach ~1 Minute ist die App hier erreichbar:

   ### 🌐 https://oskar26.github.io/schulmanager/

   Link als Startseite/Homescreen-Symbol hinzufügen → fühlt sich fast wie eine App an.

> Hinweis: Im Browser gibt es einige Handy-Features nicht (Benachrichtigungen,
> Keychain-verschlüsselter Speicher). Die Web-Version ist perfekt zum schnellen
> Ausprobieren — die **APK** ist die volle App.

---

## Weg 2: Echte APK (einmal 2 Minuten, danach automatisch)

GitHub kann die APK automatisch bei jedem Update bauen. Dafür muss einmal eine
kleine Datei im Repo angelegt werden:

1. Öffne **github.com/oskar26/schulmanager** im Browser (Desktop-Site an).
2. Stelle sicher, dass du auf dem Branch **`arena/01a0661f-schulmanager`** bist
   (Branch-Auswahl oben links) — oder lege die Datei auf `main` an, dann wirkt sie überall.
3. Tippe auf **Add file → Create new file**.
4. Als Dateiname eingeben (der Punkt am Anfang ist wichtig):
   ```
   .github/workflows/android-apk.yml
   ```
5. Kopiere den **kompletten Inhalt** der Datei
   [`scripts/github-workflow-vorlage.yml`](scripts/github-workflow-vorlage.yml)
   in dieses Repo hinein und füge ihn im Editor ein.
   (Tipp: Die Vorlage in einem zweiten Browser-Tab öffnen, alles markieren, kopieren.)
6. Ganz unten auf **Commit changes** tippen.

**Was passiert jetzt?**

- GitHub startet automatisch einen Build (dauert ~15–20 Minuten).
- Fertig ist die APK hier:
  - **Release-Seite (einfachster Download, ohne Login):**
    **github.com/oskar26/schulmanager/releases/latest** → `Schulflow-….apk`
  - Alternativ im **Actions**-Tab auf den letzten Lauf → **Artifacts**.
- **Jedes künftige Update** (auch wenn die KI Änderungen in den Branch pusht) baut
  automatisch eine neue APK. Die Versionsnummer steigt dabei automatisch, du kannst
  die neue APK immer einfach über die alte drüberinstallieren.

### APK installieren

1. `Schulflow-….apk` von der Release-Seite herunterladen
   (Chrome-Warnung „Diese Datei kann Schaden anrichten" → **Trotzdem behalten**).
2. Datei öffnen → „Aus dieser Quelle installieren **erlauben**" → **Installieren**.
3. Fertig. Die App startet im **Demo-Modus** — zum Verbinden mit echten Daten:
   Einstellungen → Konto → Schulmanager-Zugangsdaten.

---

## FAQ

**Kann ich das auch in Termux/Acode auf dem Handy bauen?**
Nein — ein Android-Build braucht das komplette Android-SDK + Gradle (mehrere GB).
Auf dem Smartphone ist das nicht praktikabel. Genau dafür ist der GitHub-Cloud-Build da:
Der läuft auf GitHub-Servern, dein Handy braucht nur den Browser.

**Was ist mit Expo Snack?**
Snack kann dieses Projekt nicht ausführen: Der Snack-Git-Import ist aktuell defekt
(Asset-Upload wirft serverseitig `"$": Required`), und Snack unterstützt
expo-router/NativeWind/Tamagui/gluestack nur stark eingeschränkt. Die APK über
GitHub Actions ist der saubere Weg — und zusätzlich läuft die Web-Version im Browser.

**Die Web-Seite zeigt nichts?**
Nach dem Aktivieren von Pages 1–2 Minuten warten und die Seite neu laden.
Bei jedem neuen Build (Weg 2) aktualisiert sich die Web-Version automatisch mit.
