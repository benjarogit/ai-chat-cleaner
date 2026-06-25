# Ko-fi & Patreon setup (ACC v1.0.0)

Placeholder URLs in popup/README until accounts are live:

- Ko-fi: https://ko-fi.com/aichatcleaner
- Patreon: https://patreon.com/aichatcleaner (Supporter 3 €/month)

## Ko-fi checklist

1. Account type: **Creator**
2. Page name: **AI Chat Cleaner (ACC)**
3. Enable one-time donations
4. Add GitHub + store links in bio
5. Copy final page URL → update `src/popup/popup.html`, README.md, README.de.md

## Patreon checklist

1. Create page for ACC
2. Tier: **Supporter** — 3 €/month
3. About: bulk-delete on 18 AI platforms, MIT, no tracking
4. Links: GitHub releases, AMO listing
5. Copy final URL → same files as above

After URLs are confirmed, run `npm run build` and optionally patch-release **1.0.1** if stores already shipped 1.0.0 with placeholders.
