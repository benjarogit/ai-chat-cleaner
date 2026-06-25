# ACC v1.0.1 — Store Submit Guide

Artifacts (after `npm run build`):

| Store | File | Path |
|-------|------|------|
| Firefox AMO | `acc-firefox.xpi` | `dist/acc-firefox.xpi` |
| Chrome CWS | `acc-chrome.zip` | `dist/acc-chrome.zip` |
| Microsoft Edge | `dist/acc-edge.zip` | `dist/acc-edge.zip` |

Graphics: `assets/store-graphics/` — see [STORE_GRAPHICS.md](./STORE_GRAPHICS.md).

---

## Store Descriptions

### English (132 chars / CWS-safe)

**Short description (≤132 chars):**
```
Bulk-delete chats on 18 AI platforms — Claude, ChatGPT, Gemini, Grok, Copilot, DeepSeek, Perplexity, Poe, Kagi & more
```

**Full description (EN):**
```
AI Chat Cleaner (ACC) — Bulk-delete your chat history across 18 AI platforms with a single click.

Supported platforms:
Claude · ChatGPT · Gemini · Grok · Grok on X · DeepSeek · Perplexity · GitHub Copilot · Microsoft Copilot · Mistral · Pi · Meta AI · Poe · Suno · Manus · AgentGPT · CrewAI · Kagi Assistant

How it works:
1. Navigate to a supported AI chat site (while logged in)
2. Click the ACC extension icon in your browser toolbar
3. Confirm — ACC bulk-deletes all visible chats

Privacy:
• No data is sent to any server
• No personal data is collected or stored
• Only redacted debug logs on explicit user action (no chat content)
• Open-source — MIT license: github.com/benjarogit/ai-chat-cleaner

Notes:
• Requires an active, logged-in session on each platform
• Only deletes chats visible in the list — ACC does not modify hidden data
• Works on Firefox for Android (Firefox 109+)
```

---

### Deutsch

**Kurzbeschreibung (≤132 Zeichen):**
```
Chats auf 18 KI-Plattformen massenweise löschen — Claude, ChatGPT, Gemini, Grok, Copilot, DeepSeek, Perplexity, Poe, Kagi & mehr
```

**Vollständige Beschreibung (DE):**
```
AI Chat Cleaner (ACC) — Lösche deinen gesamten Chat-Verlauf auf 18 KI-Plattformen mit einem einzigen Klick.

Unterstützte Plattformen:
Claude · ChatGPT · Gemini · Grok · Grok on X · DeepSeek · Perplexity · GitHub Copilot · Microsoft Copilot · Mistral · Pi · Meta AI · Poe · Suno · Manus · AgentGPT · CrewAI · Kagi Assistant

So funktioniert es:
1. Öffne eine unterstützte KI-Chat-Seite (eingeloggt)
2. Klicke auf das ACC-Icon in der Symbolleiste
3. Bestätigen — ACC löscht alle sichtbaren Chats

Datenschutz:
• Keine Daten werden an Server gesendet
• Keine personenbezogenen Daten werden erfasst oder gespeichert
• Debug-Logs nur auf ausdrückliche Nutzeraktion (kein Chat-Inhalt)
• Open-Source — MIT-Lizenz: github.com/benjarogit/ai-chat-cleaner

Hinweise:
• Erfordert eine aktive, eingeloggte Session auf jeder Plattform
• Löscht nur sichtbare Chats in der Liste
• Unterstützt Firefox for Android (Firefox 109+)
```

---

## Firefox AMO

Add-on slug: **ai-chat-cleaner1** — do not create a new listing.

1. [Developer Hub](https://addons.mozilla.org/de/developers/) → **AI Chat Cleaner** → **Version hochladen**
2. Upload **`dist/acc-firefox.xpi`** (or `acc-firefox.zip`)
3. Compatibility: **Firefox** ✓ + **Firefox for Android** ✓
4. **Listing DE:** paste DE description above; **Listing EN:** paste EN description
5. **Privacy / data collection:** none — matches `data_collection_permissions.required: ["none"]`
6. **Permissions:** host access per AI domain for delete API + DOM fallback
7. **Source code:** Yes → link `https://github.com/benjarogit/ai-chat-cleaner` + `npm ci && npm run build`
8. **Release notes:** Fixed manifest description length; added 32/96px icons
9. **Reviewer notes:** Log in to claude.ai → open popup → confirm → deletes visible chats
10. **Screenshots:** upload from `assets/store-graphics/screenshot-{1,2,3}-popup-1280x800.png`
11. **Marketing icon:** `assets/store-graphics/amo-icon-512x512.png` (512×512)

---

## Chrome Web Store

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **AI Chat Cleaner** → **Package**
2. Upload **`dist/acc-chrome.zip`** (v1.0.1)
3. **Store listing:**
   - Description: paste EN description above (≤132 chars short, full in body)
   - Language: add DE listing with DE description
   - Screenshots: `assets/store-graphics/screenshot-{1,2,3}-popup-1280x800.png`
   - Small promo tile (440×280): `assets/store-graphics/cws-promo-small-440x280.png`
   - Marquee promo tile (1400×560): `assets/store-graphics/cws-promo-marquee-1400x560.png`
4. **Privacy:** single purpose (chat deletion); no user data collected; no remote code
5. **Permission justification:** host access needed to read chat list DOM + call deletion API per platform
6. **Distribution:** free, public
7. **Submit for review**

---

## Microsoft Edge

1. [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) → **Extensions**
2. Upload **`dist/acc-edge.zip`** (v1.0.1)
3. Reuse CWS text/screenshots

---

## After Submit

Update checkboxes in [STORE_COMPLIANCE.md](./STORE_COMPLIANCE.md) and track review feedback in GitHub Issues.
