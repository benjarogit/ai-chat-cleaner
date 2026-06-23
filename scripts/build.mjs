import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import * as esbuild from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

const BROWSERS = [
  { id: "chrome", manifest: "chrome.json", zip: "claude-deleter-chrome.zip" },
  { id: "edge", manifest: "chrome.json", zip: "claude-deleter-edge.zip", readme: "edge-README.txt" },
  { id: "firefox", manifest: "firefox.json", zip: "claude-deleter-firefox.zip" },
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
    } -annotate 0 'C' ${join(dir, "icons", `icon-${size}.png`)}`,
    { stdio: "ignore" }
  );
  }
}

function writeIconsFallback(dir) {
  // Minimal 1x1 PNG (orange) scaled via SVG if ImageMagick missing
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

async function buildExtension({ id, manifest, zip, readme }) {
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
        "Install via edge://extensions → Developer mode → Load unpacked (this folder),\n" +
        "or load the Chrome zip if sideloading is enabled.\n"
    );
  }

  const zipPath = join(dist, zip);
  rmSync(zipPath, { force: true });
  execSync(`cd "${out}" && zip -r "${zipPath}" .`, { stdio: "ignore" });
  console.log(`Built ${zip}`);
}

async function buildConsole() {
  const out = join(dist, "console-deleter.js");
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
      "Manual console usage (no extension):",
      "1. Log in at https://claude.ai",
      "2. Open DevTools → Console",
      "3. Paste the contents of console-deleter.js and press Enter",
      "",
      "Bookmarklet: copy bookmarklet.txt into a bookmark URL field.",
    ].join("\n") + "\n"
  );
  console.log("Built console-deleter.js + bookmarklet.txt");
}

async function main() {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  for (const browser of BROWSERS) {
    await buildExtension(browser); // eslint-disable-line no-await-in-loop
  }

  await buildConsole();

  writeFileSync(
    join(dist, "SAFARI-README.txt"),
    [
      "Safari Web Extension (manual):",
      "1. Build Chrome extension: npm run build",
      "2. On macOS with Xcode: run",
      "   xcrun safari-web-extension-converter dist/chrome --app-name 'Claude Deleter'",
      "3. Open the generated Xcode project, set your Team for signing, build & run.",
      "4. Enable the extension in Safari → Settings → Extensions.",
      "",
      "GitHub Actions cannot ship a signed Safari .app; Apple requires local signing.",
    ].join("\n") + "\n"
  );

  console.log("Done. Artifacts in dist/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
