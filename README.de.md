# AI Chat Cleaner (ACC)

<p align="center">
  <img src="assets/acc-logo.png" alt="AI Chat Cleaner Logo" width="128" height="128">
</p>

**Alle KI-Chats auf einmal löschen — ein Klick, fünf Plattformen.**

[English](README.md) · [Releases](https://github.com/benjarogit/claudedeleter/releases) · [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/) · [Sunny C.](https://sunnyc.de)

Open-Source-Browser-Erweiterung (MIT). Löscht den gesamten Chat-Verlauf auf Claude, ChatGPT, Gemini, Grok und Grok auf X — ohne jeden Chat einzeln durchzuklicken.

---

## Unterstützte Seiten

| Plattform | URL |
|-----------|-----|
| Claude | [claude.ai](https://claude.ai) |
| ChatGPT | [chatgpt.com](https://chatgpt.com) |
| Gemini | [gemini.google.com](https://gemini.google.com) |
| Grok | [grok.com](https://grok.com) |
| Grok auf X | [x.com/i/grok](https://x.com/i/grok) |

---

## Installation

### Firefox (Desktop & Android)

Drei Wege — je nach Vorliebe:

| Methode | Für wen | Link |
|---------|---------|------|
| **Add-ons für Firefox (AMO)** | Die meisten Nutzer — Auto-Updates, ein Klick | [Bei AMO installieren](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/) |
| **GitHub Release (.xpi)** | Sideload ohne Store | [acc-firefox.xpi](https://github.com/benjarogit/claudedeleter/releases/latest) |
| **Entpackt laden** | Entwickler / Test der neuesten Version | `npm ci && npm run build` → `dist/firefox/` in `about:debugging` laden |

> **Hinweis AMO:** Ist die Store-Seite noch nicht erreichbar, läuft die Prüfung noch — bis dahin `.xpi` aus Releases oder entpackt laden.

**Android:** Über AMO in Firefox für Android installieren, oder `.xpi` sideloaden (Einstellungen → Add-ons → Zahnrad → Aus Datei installieren).

### Chrome / Edge

1. [`acc-chrome.zip`](https://github.com/benjarogit/claudedeleter/releases/latest) (Chrome) oder [`acc-edge.zip`](https://github.com/benjarogit/claudedeleter/releases/latest) (Edge) herunterladen.
2. Entpacken, `chrome://extensions` bzw. `edge://extensions` öffnen.
3. **Entwicklermodus** → **Entpackte Erweiterung laden** → entpackten Ordner wählen.

### Ohne Erweiterung (Bookmarklet / Konsole)

[`acc-console.js`](https://github.com/benjarogit/claudedeleter/releases/latest) in die DevTools-Konsole auf einer unterstützten Seite einfügen, oder `dist/bookmarklet.txt` als Lesezeichen-URL nutzen.

---

## Bedienung

1. Unterstützte Seite öffnen und **einloggen**.
2. **ACC**-Symbol in der Toolbar → **Delete all chats** → bestätigen.
3. Tab offen lassen, bis die Fortschrittsanzeige fertig ist (Fallbacks können zu Einstellungsseiten navigieren).

---

## Funktionsweise

Pro Plattform zuerst die **interne API**, bei Fehler **DOM-Fallbacks**.

| Plattform | Primär | Fallback |
|-----------|--------|----------|
| Claude | REST API (`DELETE` pro Chat) | Sidebar-Papierkorb |
| ChatGPT | `PATCH /backend-api/conversation/{id}` pro Chat | Einstellungen |
| Gemini | `batchexecute` RPC (Page-Kontext) | Sidebar-Löschen |
| Grok.com | `DELETE /rest/app-chat/conversations` | Verlauf-UI (Mehr → Löschen) |
| Grok auf X | GraphQL-Löschen (wenn Op in Page gefunden) | Chatverlauf → Mehr → Löschen |

Universelle DE/EN-Schlüsselwörter (Verlauf, Chatverlauf, Einstellungen, …) — Fallbacks funktionieren unabhängig von der Oberflächensprache.

---

## Datenschutz

- **Keine Datenerhebung** — nichts wird an den Entwickler gesendet (`data_collection_permissions: none` bei Firefox).
- Löschvorgänge laufen **nur lokal im Browser** auf den jeweiligen Seiten.
- Kein Konto oder Login bei uns nötig.

---

## Aus Quellcode bauen

```bash
git clone https://github.com/benjarogit/claudedeleter.git
cd claudedeleter
npm ci && npm run build
```

Artefakte in `dist/`: `acc-firefox.zip`, `acc-firefox.xpi`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`.

---

## Credits

Fork von [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), weiterentwickelt von **[Sunny C.](https://sunnyc.de)**.

## Lizenz

MIT — Copyright (c) 2026 Sunny C.
