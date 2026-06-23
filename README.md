# AI Chat Cleaner (ACC)

**Bulk-delete all your AI chat history — one click, five platforms.**

[Deutsch](README.de.md) · [Releases](https://github.com/benjarogit/claudedeleter/releases) · [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ai-chat-cleaner1/) · [Sunny C.](https://sunnyc.de)

Open-source browser extension (MIT). Delete every conversation on Claude, ChatGPT, Gemini, Grok, and Grok on X without clicking through each chat individually.

---

## Supported sites

| Platform | URL |
|----------|-----|
| Claude | [claude.ai](https://claude.ai) |
| ChatGPT | [chatgpt.com](https://chatgpt.com) |
| Gemini | [gemini.google.com](https://gemini.google.com) |
| Grok | [grok.com](https://grok.com) |
| Grok on X | [x.com/i/grok](https://x.com/i/grok) |

---

## Install

### Firefox (desktop & Android)

Three ways to install — pick what fits you:

| Method | Best for | Link |
|--------|----------|------|
| **Add-ons for Firefox (AMO)** | Most users — auto-updates, one click | [Install on AMO](https://addons.mozilla.org/en-US/firefox/addon/ai-chat-cleaner1/) |
| **GitHub Release (.xpi)** | Sideloading without the store | [acc-firefox.xpi](https://github.com/benjarogit/claudedeleter/releases/latest) |
| **Load unpacked** | Developers / testing latest `main` | `npm ci && npm run build` → load `dist/firefox/` in `about:debugging` |

> **AMO note:** If the store page is not live yet, the add-on is still in review — use the `.xpi` from Releases or load unpacked in the meantime.

**Android:** Install from AMO in Firefox for Android, or sideload the `.xpi` (Settings → Add-ons → gear icon → Install from file).

### Chrome / Edge

1. Download [`acc-chrome.zip`](https://github.com/benjarogit/claudedeleter/releases/latest) (Chrome) or [`acc-edge.zip`](https://github.com/benjarogit/claudedeleter/releases/latest) (Edge).
2. Unzip, open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode** → **Load unpacked** → select the extracted folder.

### Without an extension (bookmarklet / console)

Paste [`acc-console.js`](https://github.com/benjarogit/claudedeleter/releases/latest) into the DevTools console on a supported site, or use `dist/bookmarklet.txt` as a bookmark URL.

---

## Usage

1. Open a supported site and **log in**.
2. Click the **ACC** toolbar icon → **Delete all chats** → confirm.
3. Keep the tab open until the progress bar finishes (some fallbacks navigate to settings pages).

---

## How it works

API-first on every platform; DOM fallbacks if the internal API is unavailable.

| Platform | Primary | Fallback |
|----------|---------|----------|
| Claude | REST API (`DELETE` per chat) | Sidebar trash |
| ChatGPT | Bulk `PATCH /backend-api/conversations` | Per-chat API → Settings UI |
| Gemini | `batchexecute` RPC | Sidebar delete |
| Grok.com | `DELETE /rest/app-chat/conversations` | History UI (Mehr → Löschen) |
| Grok on X | GraphQL delete (when op found in page) | Chatverlauf → Mehr → Delete |

Universal DE/EN UI keywords (Verlauf, Chatverlauf, Einstellungen, …) so fallbacks work regardless of interface language.

---

## Privacy

- **No data collection** — nothing is sent to the developer (`data_collection_permissions: none` on Firefox).
- Deletions run **only in your browser** on the respective sites.
- No account or signup with us.

---

## Build from source

```bash
git clone https://github.com/benjarogit/claudedeleter.git
cd claudedeleter
npm ci && npm run build
```

Artifacts land in `dist/`: `acc-firefox.zip`, `acc-firefox.xpi`, `acc-chrome.zip`, `acc-edge.zip`, `acc-console.js`.

---

## Credits

Fork of [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), extended and maintained by **[Sunny C.](https://sunnyc.de)**.

## License

MIT — Copyright (c) 2026 Sunny C.
