# Schulflow-Relay (Web-Version)

Die Web-App darf die Schulmanager-API **nicht** direkt aus dem Browser ansprechen:
`login.schulmanager-online.de` sendet keine
`Access-Control-Allow-Origin`-Header, also blockt jeder Browser die Anfrage.
Nativ (APK/iPA) gibt es diese Sperre nicht — deshalb funktioniert die
Anbindung in der installierten App, im Browser aber nicht.

Dieses Verzeichnis enthält den fehlenden dritten Hop: **Browser → Relay → API**.

## Woher der Begriff „Umweg“ in der App kommt

In den Einstellungen → Konto zeigt die **Verbindungs-Karte**, welchen Weg die App
gerade nutzt:

| Anzeige | Bedeutung |
|---|---|
| `Durchreicher dieser Installation` | Die Auslieferung selbst reicht `/sm-api/*` und `/sm-storage/*` durch (Dev-Server oder `npm run serve:web`). |
| `Eigener Umweg (Relay)` | Eine in den Einstellungen hinterlegte Adresse (z. B. dieser Worker). |
| `Build-Adresse (EXPO_PUBLIC_SM_API_BASE)` | Beim Bauen gesetzt; übersteuert alles außer dem manuellen Umweg. |
| `Kein Weg durch den Browser` | Nichts davon vorhanden — die App versucht Requests gar nicht erst und erklärt den Zustand, statt in Timeouts zu laufen. |

Die Prüfung läuft pro Session **einmal** über `GET …/__health` (1,5 s). Ein
Datei-Server, der auf unbekannte Pfade mit `index.html` antwortet (GitHub Pages),
fällt dabei nicht als „vorhanden“ durch.

## Relay ausliefern (Cloudflare Workers, kostenlos)

```bash
cd scripts/relay
npx wrangler deploy            # einmalig einloggen, dann steht der Worker
```

oder per Hand: <https://dash.cloudflare.com> → *Workers & Pages* → *Create* →
*Worker* → Inhalt von `schulflow-relay.worker.js` einfügen → **Deploy**.

Dann in Schulflow (Web) unter *Einstellungen → Verbindung → Umweg (Relay)*:

```
https://schulflow-relay.DEIN-NAME.workers.dev/sm-api
```

`…/sm-api` ist optional — die App erkennt Worker-Root und Mount-Pfad.

## Was das Relay tut und was nicht

* leitet **ausschließlich** `/sm-api/*` → `login.schulmanager-online.de` und
  `/sm-storage/*` → `storage.schulmanager-online.de` weiter (Pfad, Methode,
  Body und `Authorization` unverändert; `User-Agent` setzt es auf den
  Schulflow-Client, weil Browser das selbst nicht dürfen).
* antwortet auf `/__health` mit `{ "ok": true, "proxy": "schulflow-relay" }`.
* schickt **keine** Cookies mit, loggt keine Bodies und cacht keine Antworten.
* begrenzt auf Wunsch die erlaubten Herkunften: Variable `ALLOWED_ORIGINS`
  (Komma-getrennt) im Worker setzen — empfohlen, sonst ist der Worker ein
  offener Proxy für die API.

## Datenschutz-Hinweis (steht auch in der App)

Ein Relay sieht bei jedem request **das JWT der Schulmanager-Anmeldung**. Deshalb:
die Adresse selbst betreiben (Worker gehört dem eigenen Account) und keinen
beliebigen öffentlichen CORS-Proxy eintragen. Wer das nicht möchte, nutzt die
installierte App — die braucht kein Relay.
