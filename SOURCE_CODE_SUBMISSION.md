# Source code submission — AI Chat Cleaner (ACC)

For Mozilla AMO reviewers. Extension JS is bundled with **esbuild** (not minified/obfuscated).

## Repository

https://github.com/benjarogit/claudedeleter

Tag **v1.3.2** matches the submitted XPI/ZIP.

## Build environment

- **OS:** Linux (Arch-based, x86_64). Reviewer default Ubuntu 24.04 LTS also works.
- **Node.js:** 20.x or 24.x (reviewer default: Node 24.14.0)
- **npm:** 10.x or 11.x (reviewer default: npm 11.9.0)
- **Other tools:** `zip` (for packaging only)

## Build instructions (reproduce submitted Firefox extension)

```bash
git clone https://github.com/benjarogit/claudedeleter.git
cd claudedeleter
git checkout v1.3.2
npm ci
npm run build
```

## Verify build matches submission

Submitted artifact: `dist/acc-firefox.zip` (identical to `dist/acc-firefox.xpi`).

Built extension files live in `dist/firefox/`. Compare to the uploaded archive:

```bash
unzip -p dist/acc-firefox.zip manifest.json
diff -ru <(unzip -l dist/acc-firefox.zip | awk '{print $4}' | sort) <(find dist/firefox -type f | sed 's|^dist/firefox/||' | sort)
# Or extract both and diff:
rm -rf /tmp/acc-submitted /tmp/acc-built
mkdir -p /tmp/acc-submitted /tmp/acc-built
unzip -q dist/acc-firefox.zip -d /tmp/acc-submitted
cp -a dist/firefox/. /tmp/acc-built/
diff -ru /tmp/acc-submitted /tmp/acc-built
```

Expected: **no differences** (except possibly zip metadata).

## What gets bundled

| Source | Output |
|--------|--------|
| `src/content.js` | `dist/firefox/content.js` |
| `src/background.js` | `dist/firefox/background.js` |
| `src/popup/popup.js` | `dist/firefox/popup/popup.js` |
| `manifests/firefox.json` | `dist/firefox/manifest.json` |
| `src/popup/popup.html`, `src/popup/popup.css` | copied as-is |
| `src/page-main.js` | `dist/firefox/page-main.js` (Gemini MAIN world) |
| `src/icons/icon-*.png` | `dist/firefox/icons/` (copied; fallback: Node PNG in build script) |

Bundler: **esbuild** v0.25.x (open source, runs locally via `npm ci`).

## Lockfile

`package-lock.json` is included — use `npm ci`, not `npm install`.

## Testing

1. Load `dist/firefox/` via `about:debugging` → Load Temporary Add-on.
2. Open a supported site (e.g. claude.ai), log in.
3. Click ACC toolbar icon → Delete all chats → confirm.

No login required to test popup UI; deletion requires an active session on the target site.

## Data collection

`data_collection_permissions.required: ["none"]` — no data sent to the developer.
