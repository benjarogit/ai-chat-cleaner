# AI Chat Cleaner (ACC)

<p align="center">
  <img src="assets/acc-logo.png" alt="AI Chat Cleaner Logo" width="128" height="128">
</p>

[![Release](https://img.shields.io/github/v/release/benjarogit/ai-chat-cleaner?label=release)](https://github.com/benjarogit/ai-chat-cleaner/releases)
[![Firefox AMO](https://img.shields.io/amo/v/ai-chat-cleaner1?label=Firefox%20AMO)](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/)
[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)

**KI-Chat-Verlauf massenweise löschen — ein Klick, 21 Plattformen.**

[English](README.md) · [Releases](https://github.com/benjarogit/ai-chat-cleaner/releases) · [Firefox Add-ons](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/) · [Sunny C.](https://sunnyc.de)

Open-Source-Browser-Erweiterung (MIT). Löscht alle Unterhaltungen auf unterstützten KI-Seiten — ohne jeden Chat einzeln anzuklicken.

---

## Unterstützte Plattformen (21)

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
| MiniMax | [agent.minimax.io](https://agent.minimax.io) |
| Z.ai | [chat.z.ai](https://chat.z.ai) |
| Cursor | [cursor.com/agents](https://cursor.com/agents) · [50% Rabatt Referral](https://cursor.com/referral?code=UW6WJZLB8ECL) |

> **Suno** löscht Bibliotheks-Clips/Songs, keine Chat-Threads. **CrewAI** löscht Studio-Automatisierungsprojekte.

---

## Installation

### Firefox (Desktop & Android)

| Methode | Empfohlen für | Link |
|---------|---------------|------|
| **Add-ons für Firefox (AMO)** | Die meisten Nutzer — automatische Updates | [Auf AMO installieren](https://addons.mozilla.org/de/firefox/addon/ai-chat-cleaner1/) |
| **GitHub Release (.xpi)** | Sideloading | [acc-firefox.xpi](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) |
| **Entpackt laden** | Entwickler | `npm ci && npm run build` → `dist/firefox/` in `about:debugging` |

**Android:** Über AMO installieren oder `.xpi` sideloaden.

### Chrome / Edge

1. [`acc-chrome.zip`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) oder [`acc-edge.zip`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) herunterladen.
2. Entpacken → `chrome://extensions` oder `edge://extensions` → **Entwicklermodus** → **Entpackte Erweiterung laden**.

### Ohne Erweiterung (Bookmarklet / Konsole)

[`acc-console.js`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) in den DevTools auf einer unterstützten Seite einfügen, oder `dist/bookmarklet.txt` verwenden.

GitHub Copilot funktioniert auch über die Konsole/Bookmarklet (iframe-Fetch-Bypass) — keine Erweiterung nötig.

---

## Verwendung

1. Eine unterstützte Seite öffnen und **einloggen**.
2. Auf **ACC** → **Alle Chats löschen** klicken → bestätigen.
3. Tab geöffnet lassen, bis der Fortschrittsbalken fertig ist.

Bei Fehlern: **Debug-Bericht kopieren** oder **Auf GitHub melden** im Popup verwenden. Berichte werden lokal geschwärzt (keine Tokens, E-Mails oder Chat-IDs).

---

## Datenschutz

ACC erhebt, speichert und überträgt **keinerlei persönliche Daten**.

| Was | Details |
|-----|---------|
| **Datenerhebung** | Keine. Keine Analyse, kein Telemetrie, kein Tracking. |
| **Netzwerkzugriff** | Nur auf die KI-Plattformen, die du aktiv nutzt (zum Aufruf ihrer Lösch-APIs). |
| **Lokale Speicherung** | Nur Nutzereinstellungen (Sprache, Löschmethode). Niemals Chat-Inhalte oder Anmeldedaten. |
| **Debug-Berichte** | Werden nur erstellt, wenn du ausdrücklich auf „Debug-Bericht kopieren" oder „Auf GitHub melden" klickst. Alle Tokens, E-Mail-Adressen, Chat-IDs und UUIDs werden lokal geschwärzt, bevor etwas angezeigt wird. |
| **Dritte** | Es werden keine Daten an Dritte verkauft oder weitergegeben. |
| **Open Source** | Der vollständige Quellcode ist einsehbar auf [github.com/benjarogit/ai-chat-cleaner](https://github.com/benjarogit/ai-chat-cleaner). |

Verwendete Berechtigungen: `storage` (Einstellungen), `alarms` (Batchlöschung), Host-Berechtigungen für jede unterstützte Plattform (Content-Script-Injektion und API-Aufrufe).

---

## Projekt unterstützen

ACC ist kostenlos und Open Source. Optionale Unterstützung hilft, 21 Plattformen aktuell zu halten:

- [Ko-fi](https://ko-fi.com/aichatcleaner) — Einmalige Unterstützung
- [Patreon](https://www.patreon.com/SunnyCueq) — Supporter-Tier (3 €/Monat)

Fehlerberichte und Feature-Ideen: [GitHub Issues](https://github.com/benjarogit/ai-chat-cleaner/issues).

---

## Funktionsweise

API-first auf jeder Plattform; DOM-Fallbacks wenn die interne API nicht verfügbar ist.

| Plattform | Primär | Fallback |
|-----------|--------|---------|
| Claude | Recents-Massenauswahl | API → Overflow-Menü |
| ChatGPT | Einstellungen Alle löschen | Per-Chat-API → Sidebar |
| Gemini | batchexecute API | Sidebar → Meine Aktivitäten |
| Grok.com | Bulk-API | Einzel-API → Verlaufs-UI |
| Grok auf X | Verlaufs-DOM | Einstellungen (Alle löschen) |
| DeepSeek | Bulk-API | Einzel-API → Sidebar |
| Perplexity | Einzel-API | Sidebar-Sitzungsaktionen |
| GitHub Copilot | Bulk-API | Einzel-API → Chat verwalten |
| Microsoft Copilot | Sidebar-DOM | — |
| Mistral | tRPC chat.delete | Sidebar |
| Pi | REST DELETE | Unterhaltungsoptionen |
| Meta AI | Sidebar Weitere Optionen | — |
| Poe | Verlaufsseite DOM | — |
| Kagi Assistant | REST DELETE | Sidebar |
| Suno | Clip-API (Clerk-Auth) | Bibliotheksmenü |
| Manus | Connect-RPC (wenn Auth) | Sidebar-DOM |
| AgentGPT | Sidebar-DOM | — |
| CrewAI | REST DELETE Projekte | Studio-Menü |
| MiniMax | REST-API | Sidebar-DOM |
| Z.ai | REST DELETE | Sidebar-DOM |
|| Cursor | DOM-lesen + API-Löschen | Sidebar-DOM |

---

## Aus dem Quellcode bauen

```bash
git clone https://github.com/benjarogit/ai-chat-cleaner.git
cd ai-chat-cleaner
npm ci && npm run build
```

Artefakte in `dist/`: `acc-firefox.zip`, `acc-firefox.xpi`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`.

Versionsverlauf: [CHANGELOG.md](CHANGELOG.md).

---

## Entwickelt mit Cursor

Dieses Projekt wurde vollständig mit **[Cursor](https://cursor.com/referral?code=UW6WJZLB8ECL)** entwickelt — dem KI-gestützten Code-Editor. Als Entwickler bekommst du über den obigen Link **50 % Rabatt** auf Cursor.

## Credits

Fork von [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), erweitert von **[Sunny C.](https://sunnyc.de)**.

## Lizenz

MIT — Copyright (c) 2025–2026 Sunny C.
