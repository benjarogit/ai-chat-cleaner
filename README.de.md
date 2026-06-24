# AI Chat Cleaner (ACC)

<p align="center">
  <img src="assets/acc-logo.png" alt="AI Chat Cleaner Logo" width="128" height="128">
</p>

**Alle KI-Chats auf einmal löschen — ein Klick, 17 Plattformen.**

[English](README.md) · [Releases](https://github.com/benjarogit/claudedeleter/releases) · [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/) · [Sunny C.](https://sunnyc.de)

Open-Source-Browser-Erweiterung (MIT). Löscht den gesamten Chat-Verlauf auf unterstützten KI-Seiten — ohne jeden Chat einzeln durchzuklicken.

---

## Unterstützte Seiten

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
| Suno (Clips/Songs) | [suno.com](https://suno.com) |
| Manus | [manus.im/app](https://manus.im/app) |
| AgentGPT | [agentgpt.reworkd.ai](https://agentgpt.reworkd.ai) |
| CrewAI | [app.crewai.com/studio](https://app.crewai.com/studio) |

> **Suno** löscht Library-Clips/Songs, keine Chats. **CrewAI** löscht Studio-Automations-Projekte.

---

## Installation

### Firefox (Desktop & Android)

| Methode | Für wen | Link |
|---------|---------|------|
| **Add-ons für Firefox (AMO)** | Die meisten Nutzer | [Bei AMO installieren](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/) |
| **GitHub Release (.xpi)** | Sideload | [acc-firefox.xpi](https://github.com/benjarogit/claudedeleter/releases/latest) |
| **Entpackt laden** | Entwickler | `npm ci && npm run build` → `dist/firefox/` |

**Android:** AMO oder `.xpi` sideloaden.

### Chrome / Edge

1. [`acc-chrome.zip`](https://github.com/benjarogit/claudedeleter/releases/latest) oder [`acc-edge.zip`](https://github.com/benjarogit/claudedeleter/releases/latest) herunterladen.
2. Entpacken → `chrome://extensions` oder `edge://extensions` → **Entwicklermodus** → **Entpackte Erweiterung laden**.

### Ohne Erweiterung (Bookmarklet / Konsole)

[`acc-console.js`](https://github.com/benjarogit/claudedeleter/releases/latest) in die DevTools-Konsole einfügen. GitHub Copilot funktioniert ohne Erweiterung (iframe-fetch-Bypass).

---

## Nutzung

1. Unterstützte Seite öffnen und **einloggen**.
2. **ACC** → **Delete all chats** → bestätigen.
3. Tab offen lassen, bis die Fortschrittsanzeige fertig ist.

---

## Funktionsweise

API zuerst, DOM-Fallbacks wenn nötig. Siehe [README.md](README.md) für die vollständige Methoden-Tabelle.

---

## Datenschutz

- **Keine Datenerhebung** — nichts wird an den Entwickler gesendet.
- Löschungen laufen **nur im Browser** auf den jeweiligen Seiten.

---

## Aus dem Quellcode bauen

```bash
git clone https://github.com/benjarogit/claudedeleter.git
cd claudedeleter
npm ci && npm run build
```

Artefakte in `dist/`: `acc-firefox.zip`, `acc-firefox.xpi`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`.

---

## Credits

Fork von [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), erweitert von **[Sunny C.](https://sunnyc.de)**.

## Lizenz

MIT — Copyright (c) 2026 Sunny C.
