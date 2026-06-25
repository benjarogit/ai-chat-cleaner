# ACC v1.0.0 — Audit FINDINGS

Audit date: 2026-06-23. Lenses: Architecture, Performance, Security, Quality.

## Blockers (fixed in v1.0.0)

| Sev | File | Issue | Fix |
|-----|------|-------|-----|
| HIGH | `manifests/*.json` | Kagi (`assistant.kagi.com`) missing from host_permissions/content_scripts | Added |
| HIGH | `src/popup/popup.js` | GitHub issue URL used `body=` not `fields[debug_report]` | `github-report.js` |
| HIGH | `.github/ISSUE_TEMPLATE/bug_report.yml` | Kagi missing from platform list | Added |
| MED | README, manifests | "17 platforms" vs 18 in registry | Updated to 18 |
| MED | `package.json` | description still "claude.ai only" | Updated |

## Architecture

| Sev | Finding | Action |
|-----|---------|--------|
| LOW | Repeated `assertGone` in providers | Keep — extraction not worth churn for v1.0.0 |
| LOW | `dom.js` ~1500 LOC | No split in v1.0.0; track for v1.1 |
| OK | Pipeline → provider → dom layering | Clear boundaries |

## Performance

| Sev | Finding | Action |
|-----|---------|--------|
| MED | `runDeleteLoop` default delay 300ms | Kept — balances rate limits vs speed |
| LOW | DOM loops re-query each iteration | Required for live DOM after delete |
| OK | esbuild single bundle for content | Acceptable for MV3 |

## Security

| Sev | Finding | Action |
|-----|---------|--------|
| MED | Debug redaction missing CSRF/JWT patterns | Extended in `debug-log.js` |
| OK | No remote telemetry | AMO `data_collection_permissions: none` |
| OK | Confirm before bulk delete | AMO/CWS policy alignment |

## Quality

| Sev | Finding | Action |
|-----|---------|--------|
| MED | Console script no GitHub report on error | Added in `console.js` |
| OK | CrewAI CSRF + Suno `/api/gen/trash` | Verified in prior live tests |

## Store compliance

See [STORE_COMPLIANCE.md](./STORE_COMPLIANCE.md).
