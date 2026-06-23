# Claude Deleter

[English](README.md)

Alle Unterhaltungen auf [claude.ai](https://claude.ai) gesammelt löschen.

Fork von [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), modernisiert für Manifest V3 mit Builds für Chrome, Firefox, Edge und ein eigenständiges Konsolen-Skript.

## Downloads

Fertige Pakete liegen bei [GitHub Releases](https://github.com/benjarogit/claudedeleter/releases) (Tag `v1.0.0` und neuer):

| Datei | Browser |
|-------|---------|
| `claude-deleter-chrome.zip` | Google Chrome |
| `claude-deleter-firefox.zip` | Mozilla Firefox |
| `claude-deleter-edge.zip` | Microsoft Edge |
| `console-deleter.js` | Beliebiger Browser (ohne Erweiterung) |
| `bookmarklet.txt` | Bookmarklet-URL (optional) |

## Manuelle Installation

### Google Chrome

1. `claude-deleter-chrome.zip` von [Releases](https://github.com/benjarogit/claudedeleter/releases) herunterladen und entpacken.
2. `chrome://extensions` öffnen.
3. **Entwicklermodus** aktivieren (oben rechts).
4. **Entpackte Erweiterung laden** klicken und den entpackten Ordner wählen (mit `manifest.json` darin).
5. Erweiterung über das Puzzle-Symbol anheften.

**Alternativ:** Nach `npm run build` den Ordner `dist/chrome` auf dieselbe Weise laden.

> Hinweis „Diese Erweiterung stammt nicht aus dem Chrome Web Store“ ist bei manueller Installation normal.

### Microsoft Edge

1. `claude-deleter-edge.zip` herunterladen und entpacken (gleiches Format wie Chrome).
2. `edge://extensions` öffnen.
3. **Entwicklermodus** aktivieren.
4. **Entpackte Erweiterung laden** und den Ordner auswählen.
5. Bestätigen, falls Edge nach Erweiterungen außerhalb des Stores fragt.

### Mozilla Firefox

**Temporär (zum Testen)**

1. `claude-deleter-firefox.zip` entpacken.
2. `about:debugging#/runtime/this-firefox` öffnen.
3. **Temporäres Add-on laden…** → `manifest.json` im Ordner wählen.
4. Das Add-on verschwindet beim Schließen von Firefox.

**Dauerhaft (unsigniert, nur ESR / Developer Edition)**

Die normale Firefox-Version erlaubt nur signierte Add-ons. Für dauerhafte unsignierte Nutzung: Firefox Developer Edition oder ESR, in `about:config` `xpinstall.signatures.required` auf `false`, dann wie oben laden. Für den Alltag: Veröffentlichung auf [addons.mozilla.org](https://addons.mozilla.org) (siehe Store-Hinweise unten in der Chat-Antwort).

### Safari (nur macOS)

1. Chrome-Build besorgen (`dist/chrome` oder entpacktes Chrome-Zip).
2. Auf dem Mac mit Xcode in Terminal:

   ```bash
   xcrun safari-web-extension-converter dist/chrome --app-name "Claude Deleter"
   ```

3. Xcode-Projekt öffnen, **Signing Team** setzen, einmal bauen und starten.
4. Safari → **Einstellungen** → **Erweiterungen** → **Claude Deleter** aktivieren.

Nach lokalem Build auch `dist/SAFARI-README.txt` lesen.

### Konsolen-Skript (ohne Erweiterung)

1. Auf [claude.ai](https://claude.ai) einloggen.
2. **Entwicklertools** (F12) → **Konsole**.
3. Gesamten Inhalt von `console-deleter.js` einfügen, Enter.
4. Lösch-Dialog bestätigen.

**Bookmarklet:** Lesezeichen anlegen, URL = eine Zeile aus `bookmarklet.txt`. Auf claude.ai das Lesezeichen anklicken. Manche Browser begrenzen die URL-Länge.

## Bedienung

1. Beliebige `https://claude.ai/*`-Seite geöffnet und eingeloggt.
2. Erweiterungs-Icon → **Delete all chats** → bestätigen.
3. Fortschrittsanzeige abwarten.

Die Erweiterung nutzt dieselbe API wie die Website (`credentials: include`). Kurze Pause zwischen Löschvorgängen schützt vor Rate-Limits.

## Aus Quellcode bauen

```bash
npm ci
npm run build
```

Ergebnis in `dist/`:

- `chrome/`, `firefox/`, `edge/` — entpackte Erweiterungen
- `*.zip` — Release-Pakete
- `console-deleter.js`, `bookmarklet.txt`

## Projektstruktur

- `src/lib/deleter.js` — gemeinsame Lösch-Logik
- `src/content.js` — Content Script auf claude.ai
- `src/popup/` — Toolbar-UI
- `src/background.js` — MV3 Service Worker
- `src/console.js` — Konsolen-Einstieg
- `scripts/build.mjs` — Bundle + ZIP
- `.github/workflows/build.yml` — CI bei Push; Release-Artefakte bei Versions-Tags

## Lizenz

MIT — siehe [LICENSE](LICENSE).
