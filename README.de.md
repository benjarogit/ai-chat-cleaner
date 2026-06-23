# AI Chat Cleaner (ACC)

[English](README.md) · [Sunny C.](https://sunnyc.de)

Alle Chats auf unterstützten KI-Seiten gesammelt löschen.

| Seite | URL |
|-------|-----|
| Claude | [claude.ai](https://claude.ai) |
| ChatGPT | [chatgpt.com](https://chatgpt.com) |
| Gemini | [gemini.google.com](https://gemini.google.com) |
| Grok | [grok.com](https://grok.com) |
| Grok auf X | [x.com/i/grok](https://x.com/i/grok) |

Fork von [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), weiterentwickelt von **Sunny C.**

## Funktionsweise

Pro Plattform: **API zuerst**, dann **DOM-Fallbacks**:

| Plattform | Primär | Fallback |
|-----------|--------|----------|
| Claude | REST API | — |
| ChatGPT | Bulk-`PATCH /backend-api/conversations` | Einstellungen → Alle Chats löschen |
| Gemini | `batchexecute` RPC | Sidebar-Löschen |
| Grok.com | Einstellungen „Alle löschen“ | Einzelne History-Einträge |
| Grok auf X | Einstellungen Bulk-Löschen | GraphQL + History-UI |

## Downloads

[GitHub Releases](https://github.com/benjarogit/claudedeleter/releases) — `acc-firefox.zip`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`

## Bedienung

1. Unterstützte Seite öffnen (eingeloggt).
2. ACC → **Delete all chats** → bestätigen.
3. Tab offen lassen bis fertig (DOM-Fallbacks können zu Einstellungen navigieren).

## Mozilla AMO

**`acc-firefox.zip`** hochladen. Firefox + Firefox für Android ankreuzen. ID: `aichatcleaner@sunnyc.de`.

## Build

```bash
npm ci && npm run build
```

## Lizenz

MIT — Copyright (c) 2026 [Sunny C.](https://sunnyc.de)
