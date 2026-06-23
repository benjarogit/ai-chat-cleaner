# AI Chat Cleaner (ACC)

[Deutsch](README.de.md) · [Sunny C.](https://sunnyc.de)

Bulk-delete all conversations on supported AI chat sites.

| Site | URL |
|------|-----|
| Claude | [claude.ai](https://claude.ai) |
| ChatGPT | [chatgpt.com](https://chatgpt.com) |
| Gemini | [gemini.google.com](https://gemini.google.com) |
| Grok | [grok.com](https://grok.com) |
| Grok on X | [x.com/i/grok](https://x.com/i/grok) |

Fork of [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), maintained by **Sunny C.**

## How it works

Each platform uses **API first**, then **DOM fallbacks** if the internal API fails:

| Platform | Primary | Fallback |
|----------|---------|----------|
| Claude | REST API | — |
| ChatGPT | `PATCH /backend-api/conversations` (bulk) | Settings → Delete all chats |
| Gemini | `batchexecute` RPC | Sidebar delete buttons |
| Grok.com | Settings bulk delete (DOM) | History item delete |
| Grok on X | Settings bulk delete | GraphQL list + delete, history UI |

## Downloads

[GitHub Releases](https://github.com/benjarogit/claudedeleter/releases) — `acc-firefox.zip`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`

## Usage

1. Open a supported site (logged in).
2. Click ACC → **Delete all chats** → confirm.
3. Stay on the tab until finished (DOM fallbacks may navigate to settings).

## Mozilla AMO

Upload **`acc-firefox.zip`**. Check Firefox + Firefox for Android. ID: `aichatcleaner@sunnyc.de`.

## Build

```bash
npm ci && npm run build
```

## License

MIT — Copyright (c) 2026 [Sunny C.](https://sunnyc.de)
