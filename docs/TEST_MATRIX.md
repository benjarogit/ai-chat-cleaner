# ACC v1.0.0 — Provider test matrix

## Phase 2A — Automated probes

| Check | Status | Notes |
|-------|--------|-------|
| `scripts/validate-release.mjs` | PASS | 18 providers, v1.0.0, Kagi manifests, URLs |
| `npm run build` | PASS | chrome/edge/firefox zips + xpi + console |
| `scripts/e2e-probe.js` | Ready | In-page script; run in logged-in DevTools |
| `scripts/live-probe-new-sites.js` | Ready | New sites baseline; run in logged-in DevTools |

## Phase 2B — Full live protocol (18 × methods)

Protocol: baseline → 2 ACC test items → one method → reload → verify 0.

| # | Provider | Status | Notes |
|---|----------|--------|-------|
| 1 | Claude | PASS | dom-recents, api, dom-overflow |
| 2 | ChatGPT | PASS | settings-bulk, api, sidebar |
| 3 | Gemini | PASS | sidebar, batchexecute, myactivity |
| 4 | Grok.com | PASS | bulk-api, api-individual, history-dom |
| 5 | Grok X | PASS | history-dom, graphql, settings |
| 6 | DeepSeek | PASS | bulk-api, api-individual, sidebar |
| 7 | Perplexity | Deferred | Confirm before run (real threads) |
| 8 | GitHub Copilot | PASS | bulk-api, api-individual, manage |
| 9 | Microsoft Copilot | PASS | api-individual, sidebar |
| 10 | Mistral | PASS | trpc, sidebar |
| 11 | Pi | PASS | api, conversation-options |
| 12 | Meta AI | PASS | sidebar |
| 13 | Poe | PASS | sidebar |
| 14 | Kagi | PASS | sidebar |
| 15 | Suno | PASS | api-individual via `/api/gen/trash` |
| 16 | Manus | PASS | rpc, sidebar |
| 17 | AgentGPT | PASS | sidebar |
| 18 | CrewAI | PASS | api-individual (CSRF), dom-studio |
