import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import * as esbuild from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

const BROWSERS = [
  { id: "chrome", manifest: "chrome.json", zip: "acc-chrome.zip" },
  { id: "edge", manifest: "chrome.json", zip: "acc-edge.zip", readme: "edge" },
  { id: "firefox", manifest: "firefox.json", zip: "acc-firefox.zip", xpi: true },
];

function bundle(entry, outfile) {
  return esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["chrome109", "firefox109"],
    logLevel: "silent",
  });
}

function writeIcons(dir) {
  mkdirSync(join(dir, "icons"), { recursive: true });
  for (const size of [16, 48, 128]) {
    execSync(
      `convert -size ${size}x${size} xc:'#d97757' -fill white -gravity center -pointsize ${
        Math.max(8, Math.floor(size / 3))
      } -annotate 0 'A' ${join(dir, "icons", `icon-${size}.png`)}`,
      { stdio: "ignore" }
    );
  }
}

function writeIconsFallback(dir) {
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const buf = Buffer.from(pngBase64, "base64");
  mkdirSync(join(dir, "icons"), { recursive: true });
  for (const size of [16, 48, 128]) {
    writeFileSync(join(dir, "icons", `icon-${size}.png`), buf);
  }
}

function hasConvert() {
  try {
    execSync("which convert", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function buildExtension({ id, manifest, zip, xpi, readme }) {
  const out = join(dist, id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "popup"), { recursive: true });

  await bundle(join(root, "src/content.js"), join(out, "content.js"));
  await bundle(join(root, "src/background.js"), join(out, "background.js"));
  await bundle(join(root, "src/popup/popup.js"), join(out, "popup/popup.js"));

  copyFileSync(join(root, "src/popup/popup.html"), join(out, "popup/popup.html"));
  copyFileSync(join(root, "src/popup/popup.css"), join(out, "popup/popup.css"));
  copyFileSync(join(root, "manifests", manifest), join(out, "manifest.json"));

  try {
    if (hasConvert()) writeIcons(out);
    else writeIconsFallback(out);
  } catch {
    writeIconsFallback(out);
  }

  if (readme) {
    writeFileSync(
      join(out, "INSTALL-EDGE.txt"),
      "Microsoft Edge uses the same Chromium extension format as Chrome.\n" +
        "Install via edge://extensions → Developer mode → Load unpacked (this folder).\n"
    );
  }

  const zipPath = join(dist, zip);
  rmSync(zipPath, { force: true });
  execSync(`cd "${out}" && zip -r "${zipPath}" .`, { stdio: "ignore" });
  console.log(`Built ${zip}`);

  if (xpi) {
    const xpiPath = zipPath.replace(/\.zip$/, ".xpi");
    copyFileSync(zipPath, xpiPath);
    console.log(`Built ${xpiPath.split("/").pop()}`);
  }
}

async function buildConsole() {
  const out = join(dist, "acc-console.js");
  await esbuild.build({
    entryPoints: [join(root, "src/console.js")],
    outfile: out,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["chrome109", "firefox109"],
    logLevel: "silent",
  });

  const source = readFileSync(out, "utf8");
  const minified = await esbuild.transform(source, { minify: true });
  const bookmarklet = `javascript:${minified.code}`;
  writeFileSync(join(dist, "bookmarklet.txt"), bookmarklet + "\n");
  writeFileSync(
    join(dist, "CONSOLE-README.txt"),
    [
      "AI Chat Cleaner — console script (no extension)",
      "Supported: claude.ai, chatgpt.com, gemini.google.com, grok.com, x.com/i/grok",
      "2. Open DevTools → Console",
      "3. Paste acc-console.js and press Enter",
      "",
      "Bookmarklet: copy bookmarklet.txt into a bookmark URL field.",
    ].join("\n") + "\n"
  );
  console.log("Built acc-console.js + bookmarklet.txt");
}

async function main() {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  for (const browser of BROWSERS) {
    await buildExtension(browser); // eslint-disable-line no-await-in-loop
  }

  await buildConsole();

  writeFileSync(
    join(dist, "AMO-README.txt"),
    [
      "Mozilla AMO upload — acc-firefox.zip",
      "",
      "Upload: acc-firefox.zip (or acc-firefox.xpi — identical)",
      "Check: Firefox AND Firefox for Android",
      "",
      "Manifest must include gecko.data_collection_permissions.",
      "ACC uses required: [\"none\"] — no data sent to the developer.",
      "New add-on ID: aichatcleaner@sunnyc.de",
      "(If you started an upload with the old ID, cancel and upload as new add-on.)",
      "",
      "Source code (bundled JS):",
      "  https://github.com/benjarogit/claudedeleter",
      "  npm ci && npm run build",
      "",
      "Author: Sunny C. — https://sunnyc.de",
    ].join("\n") + "\n"
  );

  writeFileSync(
    join(dist, "MOBILE-README.txt"),
    [
      "Mobile extension support",
      "",
      "Supported:",
      "  Firefox for Android 113+ (check in AMO upload)",
      "",
      "Not supported by platform:",
      "  Chrome for Android — no arbitrary extensions (desktop only)",
      "  Edge mobile — no extension sideloading",
      "  Safari iOS — no WebExtension sideloading like desktop",
      "",
      "On Firefox Android: install from AMO after approval, open claude.ai,",
      "tap the ACC icon in the browser menu.",
    ].join("\n") + "\n"
  );

  writeFileSync(
    join(dist, "SAFARI-README.txt"),
    [
      "Safari Web Extension (macOS):",
      "1. npm run build",
      "2. xcrun safari-web-extension-converter dist/chrome --app-name 'AI Chat Cleaner'",
      "3. Xcode: set Signing Team, build & run",
      "4. Safari → Settings → Extensions → enable ACC",
    ].join("\n") + "\n"
  );

  console.log("Done. Artifacts in dist/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
