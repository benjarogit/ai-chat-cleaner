# Claude Deleter

[Deutsch](README.de.md)

Bulk-delete all conversations on [claude.ai](https://claude.ai).

Fork of [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), modernized for Manifest V3 with builds for Chrome, Firefox, Edge, and a standalone console script.

## Downloads

Pre-built packages are attached to [GitHub Releases](https://github.com/benjarogit/claudedeleter/releases) (tag `v1.0.0` and later):

| File | Browser |
|------|---------|
| `claude-deleter-chrome.zip` | Google Chrome |
| `claude-deleter-firefox.zip` | Mozilla Firefox |
| `claude-deleter-edge.zip` | Microsoft Edge |
| `console-deleter.js` | Any browser (no extension) |
| `bookmarklet.txt` | Bookmarklet URL (optional) |

## Manual installation

### Google Chrome

1. Download `claude-deleter-chrome.zip` from [Releases](https://github.com/benjarogit/claudedeleter/releases) and unzip it.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder (it must contain `manifest.json`).
5. Pin the extension via the puzzle icon in the toolbar.

**Alternative:** After `npm run build`, load the folder `dist/chrome` the same way.

> Chrome may show “This extension is not from the Chrome Web Store” — that is normal for manual installs.

### Microsoft Edge

1. Download `claude-deleter-edge.zip` (same Chromium format as Chrome) and unzip.
2. Open `edge://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the unzipped folder.
5. Confirm if Edge asks about extensions from outside the store.

### Mozilla Firefox

**Temporary (for testing)**

1. Download and unzip `claude-deleter-firefox.zip`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and pick `manifest.json` inside the folder.
4. The add-on is removed when Firefox closes.

**Persistent (unsigned, Firefox ESR / Developer Edition)**

Firefox Release only allows signed add-ons. For a permanent unsigned install you need Firefox Developer Edition or ESR with `xpinstall.signatures.required` set to `false` in `about:config`, then load via `about:debugging` as above. For everyday use, publish on [addons.mozilla.org](https://addons.mozilla.org) (see store notes below).

### Safari (macOS only)

1. Build or download the Chrome extension folder (`dist/chrome` or unzipped chrome zip).
2. On a Mac with Xcode installed, run in Terminal:

   ```bash
   xcrun safari-web-extension-converter dist/chrome --app-name "Claude Deleter"
   ```

3. Open the generated Xcode project, set your **Signing Team**, build and run once.
4. In Safari → **Settings** → **Extensions**, enable **Claude Deleter**.

See also `dist/SAFARI-README.txt` after a local build.

### Console script (no extension)

1. Sign in at [claude.ai](https://claude.ai).
2. Open **DevTools** (F12) → **Console**.
3. Copy the full contents of `console-deleter.js` from Releases, paste into the console, press Enter.
4. Confirm the deletion dialog.

**Bookmarklet:** Create a bookmark whose URL is the single line from `bookmarklet.txt`. Open claude.ai, click the bookmark. Some browsers limit bookmark URL length.

## Usage

1. Open any `https://claude.ai/*` page while logged in.
2. Click the extension icon → **Delete all chats** → confirm.
3. Wait until the progress bar shows completion.

The extension uses the same authenticated API as the Claude website. A short pause between deletes reduces rate-limit risk.

## Build from source

```bash
npm ci
npm run build
```

Artifacts land in `dist/`:

- `chrome/`, `firefox/`, `edge/` — unpacked extensions
- `*.zip` — release packages
- `console-deleter.js`, `bookmarklet.txt`

## Project layout

- `src/lib/deleter.js` — shared delete logic
- `src/content.js` — content script on claude.ai
- `src/popup/` — toolbar UI
- `src/background.js` — MV3 service worker
- `src/console.js` — standalone console entry
- `scripts/build.mjs` — bundle + zip
- `.github/workflows/build.yml` — CI builds on push; Release assets on version tags

## License

MIT — see [LICENSE](LICENSE).
