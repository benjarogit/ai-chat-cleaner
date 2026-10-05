# AI Chat Cleaner (ACC)

<p align="center">
  <img src="assets/acc-logo.png" alt="AI Chat Cleaner logo" width="128" height="128">
</p>

[![Release](https://img.shields.io/github/v/release/benjarogit/ai-chat-cleaner?label=release)](https://github.com/benjarogit/ai-chat-cleaner/releases)
[![Firefox AMO](https://img.shields.io/amo/v/ai-chat-cleaner1?label=Firefox%20AMO)](https://addons.mozilla.org/en-US/firefox/addon/ai-chat-cleaner1/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Bulk-delete all your AI chat history — one click, 8 platforms.**

[Deutsch](README.de.md) · [Releases](https://github.com/benjarogit/ai-chat-cleaner/releases) · [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-chat-cleaner1/) · [Sunny C.](https://sunnyc.de)

Open-source browser extension (MIT). Delete every conversation on supported AI sites without clicking through each chat individually.

---

## Supported sites (8)

| Platform | URL |
|----------|-----|
| Claude | [claude.ai](https://claude.ai) |
| ChatGPT | [chatgpt.com](https://chatgpt.com) |
| Gemini | [gemini.google.com](https://gemini.google.com) |
| Grok | [grok.com](https://grok.com) |
| Grok on X | [x.com/i/grok](https://x.com/i/grok) |
| GitHub Copilot | [github.com/copilot](https://github.com/copilot) |
| Microsoft Copilot | [copilot.microsoft.com](https://copilot.microsoft.com) (also [copilot.com](https://copilot.com)) |
| Cursor | [cursor.com/agents](https://cursor.com/agents) · [50% off referral](https://cursor.com/referral?code=UW6WJZLB8ECL) |

---

## Install

### Firefox (desktop & Android)

| Method | Best for | Link |
|--------|----------|------|
| **Add-ons for Firefox (AMO)** | Most users — auto-updates | [Install on AMO](https://addons.mozilla.org/en-US/firefox/addon/ai-chat-cleaner1/) |
| **GitHub Release (.xpi)** | Sideloading | [acc-firefox.xpi](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) |
| **Load unpacked** | Developers | `npm ci && npm run build` → `dist/firefox/` in `about:debugging` |

**Android:** Install from AMO or sideload the `.xpi`.

### Chrome / Edge

1. Download [`acc-chrome.zip`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) or [`acc-edge.zip`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest).
2. Unzip → `chrome://extensions` or `edge://extensions` → **Developer mode** → **Load unpacked**.

### Without an extension (bookmarklet / console)

Paste [`acc-console.js`](https://github.com/benjarogit/ai-chat-cleaner/releases/latest) into DevTools on a supported site, or use `dist/bookmarklet.txt`.

GitHub Copilot works via console/bookmarklet (iframe fetch bypass) — no extension required.

---

## Usage

1. Open a supported site and **log in**.
2. Click **ACC** → **Delete all chats** → confirm.
3. Keep the tab open until the progress bar finishes.

If deletion fails, use **Copy debug report** or **Report on GitHub** in the popup. Reports are redacted (no tokens, emails, or chat IDs).

---

## Privacy

ACC does **not** collect, store, or transmit any personal data.

| What | Details |
|------|---------|
| **Data collection** | None. No analytics, no telemetry, no tracking. |
| **Network access** | Only to the AI platforms you actively use (to call their deletion APIs). |
| **Local storage** | User preferences only (language, deletion method). Never chat content or credentials. |
| **Debug reports** | Created only when you explicitly click "Copy debug report" or "Report on GitHub". All tokens, email addresses, chat IDs, and UUIDs are redacted locally before anything is shown. |
| **Third parties** | No data is sold or shared with any third party. |
| **Open source** | Full source code is auditable at [github.com/benjarogit/ai-chat-cleaner](https://github.com/benjarogit/ai-chat-cleaner). |

Permissions used: `storage` (preferences), `alarms` (batch deletion scheduling), host permissions for each supported platform (content-script injection and API calls).

---

## Support the project

ACC is free and open source. Optional support helps maintenance across 8 platforms:

- [Ko-fi](https://ko-fi.com/aichatcleaner) — one-time tips
- [Patreon](https://www.patreon.com/SunnyCueq) — Supporter tier (3 €/month)

Bug reports and feature ideas: [GitHub Issues](https://github.com/benjarogit/ai-chat-cleaner/issues).

---

## How it works

API-first on every platform; DOM fallbacks if the internal API is unavailable.

| Platform | Primary | Fallback |
|----------|---------|----------|
| Claude | Recents bulk select | API → Overflow menu |
| ChatGPT | Settings bulk delete | Per-chat API → Sidebar |
| Gemini | batchexecute API | Sidebar → My Activity |
| Grok.com | Bulk API | Individual API → History UI |
| Grok on X | History DOM | Settings (delete all) |
| GitHub Copilot | Bulk API | Individual API → Manage chat |
| Microsoft Copilot | Sidebar DOM | — |
| Cursor | DOM-read + API archive | Sidebar DOM |

---

## Build from source

```bash
git clone https://github.com/benjarogit/ai-chat-cleaner.git
cd ai-chat-cleaner
npm ci && npm run build
```

Artifacts in `dist/`: `acc-firefox.zip`, `acc-firefox.xpi`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`.

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

## Built with Cursor

This project was built entirely with **[Cursor](https://cursor.com/referral?code=UW6WJZLB8ECL)** — the AI-first code editor. If you're a developer looking for a smarter coding workflow, Cursor offers a **50 % discount** via the link above.

## Credits

Fork of [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), extended by **[Sunny C.](https://sunnyc.de)**.

## License

MIT — Copyright (c) 2025–2026 Sunny C.
