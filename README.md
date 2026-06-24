# AI Chat Cleaner (ACC)

<p align="center">
  <img src="assets/acc-logo.png" alt="AI Chat Cleaner logo" width="128" height="128">
</p>

**Bulk-delete all your AI chat history — one click, 17 platforms.**

[Deutsch](README.de.md) · [Releases](https://github.com/benjarogit/claudedeleter/releases) · [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-chat-cleaner1/) · [Sunny C.](https://sunnyc.de)

Open-source browser extension (MIT). Delete every conversation on supported AI sites without clicking through each chat individually.

---

## Supported sites

| Platform | URL |
|----------|-----|
| Claude | [claude.ai](https://claude.ai) |
| ChatGPT | [chatgpt.com](https://chatgpt.com) |
| Gemini | [gemini.google.com](https://gemini.google.com) |
| Grok | [grok.com](https://grok.com) |
| Grok on X | [x.com/i/grok](https://x.com/i/grok) |
| DeepSeek | [chat.deepseek.com](https://chat.deepseek.com) |
| Perplexity | [perplexity.ai](https://www.perplexity.ai) |
| GitHub Copilot | [github.com/copilot](https://github.com/copilot) |
| Microsoft Copilot | [copilot.microsoft.com](https://copilot.microsoft.com) |
| Mistral | [chat.mistral.ai](https://chat.mistral.ai) |
| Pi | [pi.ai/talk](https://pi.ai/talk) |
| Meta AI | [meta.ai](https://www.meta.ai) |
| Poe | [poe.com](https://poe.com) |
| Suno (clips/songs) | [suno.com](https://suno.com) |
| Manus | [manus.im/app](https://manus.im/app) |
| AgentGPT | [agentgpt.reworkd.ai](https://agentgpt.reworkd.ai) |
| CrewAI | [app.crewai.com/studio](https://app.crewai.com/studio) |

> **Suno** deletes library clips/songs, not chat threads. **CrewAI** deletes Studio automation projects.

---

## Install

### Firefox (desktop & Android)

| Method | Best for | Link |
|--------|----------|------|
| **Add-ons for Firefox (AMO)** | Most users — auto-updates | [Install on AMO](https://addons.mozilla.org/en-US/firefox/addon/ai-chat-cleaner1/) |
| **GitHub Release (.xpi)** | Sideloading | [acc-firefox.xpi](https://github.com/benjarogit/claudedeleter/releases/latest) |
| **Load unpacked** | Developers | `npm ci && npm run build` → `dist/firefox/` in `about:debugging` |

**Android:** Install from AMO or sideload the `.xpi`.

### Chrome / Edge

1. Download [`acc-chrome.zip`](https://github.com/benjarogit/claudedeleter/releases/latest) or [`acc-edge.zip`](https://github.com/benjarogit/claudedeleter/releases/latest).
2. Unzip → `chrome://extensions` or `edge://extensions` → **Developer mode** → **Load unpacked**.

### Without an extension (bookmarklet / console)

Paste [`acc-console.js`](https://github.com/benjarogit/claudedeleter/releases/latest) into DevTools on a supported site, or use `dist/bookmarklet.txt`.

GitHub Copilot works via console/bookmarklet (iframe fetch bypass) — no extension required.

---

## Usage

1. Open a supported site and **log in**.
2. Click **ACC** → **Delete all chats** → confirm.
3. Keep the tab open until the progress bar finishes.

---

## How it works

API-first on every platform; DOM fallbacks if the internal API is unavailable.

| Platform | Primary | Fallback |
|----------|---------|----------|
| Claude | Recents bulk select → API | Overflow menu |
| ChatGPT | Settings bulk delete | Per-chat API → Sidebar |
| Gemini | Sidebar | batchexecute API → My Activity |
| Grok.com | Bulk API | Individual API → History UI |
| Grok on X | History DOM | GraphQL → Settings |
| DeepSeek | Bulk API | Individual API → Sidebar |
| Perplexity | Individual API | Sidebar Session actions |
| GitHub Copilot | Bulk API | Individual API → Manage chat |
| Microsoft Copilot | Individual API | Sidebar |
| Mistral | tRPC chat.delete | Sidebar |
| Pi | REST DELETE | Conversation options |
| Meta AI | Sidebar More options | — |
| Poe | Sidebar | — |
| Suno | Clip API | Library menu |
| Manus | Connect-RPC DeleteSession | Sidebar |
| AgentGPT | Sidebar | — |
| CrewAI | DELETE projects | Studio menu |

---

## Privacy

- **No data collection** — nothing is sent to the developer.
- Deletions run **only in your browser** on the respective sites.

---

## Build from source

```bash
git clone https://github.com/benjarogit/claudedeleter.git
cd claudedeleter
npm ci && npm run build
```

Artifacts in `dist/`: `acc-firefox.zip`, `acc-firefox.xpi`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`.

---

## Credits

Fork of [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), extended by **[Sunny C.](https://sunnyc.de)**.

## License

MIT — Copyright (c) 2026 Sunny C.
