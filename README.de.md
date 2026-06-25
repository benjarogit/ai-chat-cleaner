# AI Chat Cleaner (ACC)

<p align="center">
  <img src="assets/acc-logo.png" alt="AI Chat Cleaner Logo" width="128" height="128">
</p>

[![Release](https://img.shields.io/github/v/release/benjarogit/ai-chat-cleaner?label=Release)](https://github.com/benjarogit/ai-chat-cleaner/releases)
[![Firefox AMO](https://img.shields.io/amo/v/ai-chat-cleaner1?label=Firefox%20AMO)](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/)
[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)

**KI-Chat-Verlauf massenhaft löschen — ein Klick, 18 Plattformen.**

[English](README.md) · [Releases](https://github.com/benjarogit/ai-chat-cleaner/releases) · [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/) · [Sunny C.](https://sunnyc.de)

Open-Source-Browsererweiterung (MIT). Alle Unterhaltungen auf unterstützten KI-Seiten löschen, ohne jeden Chat einzeln anzuklicken.

---

## Unterstützte Seiten (18)

| Plattform | URL |
|-----------|-----|
| Claude | [claude.ai](https://claude.ai) |
| ChatGPT | [chatgpt.com](https://chatgpt.com) |
| Gemini | [gemini.google.com](https://gemini.google.com) |
| Grok | [grok.com](https://grok.com) |
| Grok auf X | [x.com/i/grok](https://x.com/i/grok) |
| DeepSeek | [chat.deepseek.com](https://chat.deepseek.com) |
| Perplexity | [perplexity.ai](https://www.perplexity.ai) |
| GitHub Copilot | [github.com/copilot](https://github.com/copilot) |
| Microsoft Copilot | [copilot.microsoft.com](https://copilot.microsoft.com) |
| Mistral | [chat.mistral.ai](https://chat.mistral.ai) |
| Pi | [pi.ai/talk](https://pi.ai/talk) |
| Meta AI | [meta.ai](https://www.meta.ai) |
| Poe | [poe.com](https://poe.com) |
| Kagi Assistant | [assistant.kagi.com](https://assistant.kagi.com) |
| Suno (Clips/Songs) | [suno.com](https://suno.com) |
| Manus | [manus.im/app](https://manus.im/app) |
| AgentGPT | [agentgpt.reworkd.ai](https://agentgpt.reworkd.ai) |
| CrewAI | [app.crewai.com/studio/v2](https://app.crewai.com/studio/v2) |

> **Suno** löscht Bibliotheks-Clips/Songs, keine Chat-Threads. **CrewAI** löscht Studio-Automatisierungsprojekte.

---

## Installation

### Firefox (Desktop & Android)

| Methode | Für wen | Link |
|---------|---------|------|
| **Add-ons for Firefox (AMO)** | Die meisten Nutzer — Auto-Updates | [Bei AMO installieren](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/) |
| **GitHub Release (.xpi)** | Sideload | [acc-firefox.xpi](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) |
| **Entpackt laden** | Entwickler | `npm ci && npm run build` → `dist/firefox/` in `about:debugging` |

**Android:** Installation über AMO oder Sideload der `.xpi`.

### Chrome / Edge

1. [`acc-chrome.zip`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) oder [`acc-edge.zip`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) herunterladen.
2. Entpacken → `chrome://extensions` oder `edge://extensions` → **Entwicklermodus** → **Entpackte Erweiterung laden**.

### Ohne Erweiterung (Bookmarklet / Konsole)

[`acc-console.js`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) in die DevTools-Konsole einfügen. GitHub Copilot funktioniert ohne Erweiterung (iframe-fetch-Bypass).

---

## Nutzung

1. Unterstützte Seite öffnen und **einloggen**.
2. **ACC** klicken → **Alle Chats löschen** → bestätigen.
3. Tab offen lassen, bis die Fortschrittsanzeige fertig ist.

Bei Fehlern: **Debug-Bericht kopieren** oder **Auf GitHub melden** im Popup. Berichte sind geschwärzt (keine Tokens, E-Mails oder Chat-IDs).

---

## Datenschutz

- **Keine Datensammlung** — nichts wird automatisch an den Entwickler gesendet.
- Löschungen laufen **nur in deinem Browser** auf den jeweiligen Seiten.
- Debug-Berichte entstehen nur bei Kopieren/Melden eines Fehlers und werden lokal geschwärzt.

---

## Projekt unterstützen

ACC ist kostenlos und Open Source. Optionale Unterstützung hilft bei der Pflege von 18 Plattformen:

- [Ko-fi](https://ko-fi.com/aichatcleaner) — Einmal-Spenden
- [Patreon](https://patreon.com/aichatcleaner) — Supporter-Stufe (3 €/Monat)

Fehler und Ideen: [GitHub Issues](https://github.com/benjarogit/ai-chat-cleaner/issues).

---

## Build aus Quellcode

```bash
git clone https://github.com/benjarogit/ai-chat-cleaner.git
cd ai-chat-cleaner
npm ci && npm run build
```

Artefakte in `dist/`: `acc-firefox.zip`, `acc-firefox.xpi`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`.

Siehe [CHANGELOG.md](CHANGELOG.md).

---

## Credits

Fork von [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), erweitert von **[Sunny C.](https://sunnyc.de)**.

## Lizenz

MIT — Copyright (c) 2025–2026 Sunny C.
