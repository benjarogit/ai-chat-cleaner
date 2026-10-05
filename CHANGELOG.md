# Changelog

All notable changes to AI Chat Cleaner (ACC) are documented here.

## [1.1.0] — 2026-10-05

### Changed

- Supported set is now **8 platforms**: Claude, ChatGPT, Gemini, Grok, Grok on X, GitHub Copilot, Microsoft Copilot, and Cursor.
- Removed DeepSeek, Perplexity, Mistral, Pi, Meta AI, Poe, Kagi Assistant, Suno, Manus, AgentGPT, CrewAI, MiniMax, and Z.ai.
- Content scripts stay on the eight products. On x.com, github.com, and cursor.com they inject for the whole domain so in-page navigation still reaches `/i/grok`, `/copilot`, and `/agents`. The popup names the path to open when the tab is on the right host but the wrong page.
- Microsoft Copilot also matches `copilot.com`, which is where `copilot.microsoft.com` currently opens in the browser.

## [1.0.0] — 2026-06-25

### Fixed

- Chrome Web Store: manifest `description` shortened to **≤132 characters** (CWS reject at 145 chars).

---

## [1.0.0] — 2026-06-23

First public SemVer release. Supersedes the pre-release `v2.0.0` tag.

### Added

- Support for **20 platforms** including Kagi Assistant (`assistant.kagi.com`).
- Popup **DE/EN** localization via `navigator.language`.
- GitHub issue form prefill (`fields[debug_report]`, platform, surface).
- Console script debug report + GitHub link on failure.
- Ko-fi and Patreon support links in popup footer and README.
- Extended debug log redaction (CSRF, JWT, UUID paths, CrewAI/Suno IDs).

### Fixed

- Kagi missing from extension manifests (store blocker).
- Suno delete API (`POST /api/gen/trash`).
- CrewAI project delete (CSRF header + DOM confirm flow).

### Changed

- Repository renamed to [`ai-chat-cleaner`](https://github.com/benjarogit/ai-chat-cleaner).
- Version reset to **1.0.0** (clean SemVer baseline).
