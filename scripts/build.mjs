import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { deflateSync } from "node:zlib";
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

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Solid RGB PNG — no ImageMagick required (CI-safe). */
function solidPng(width, height, r, g, b) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = 1 + width * 3;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const o = row + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function writeIcons(dir) {
  mkdirSync(join(dir, "icons"), { recursive: true });
  const srcIcons = join(root, "src", "icons");
  for (const size of [16, 48, 128]) {
    const src = join(srcIcons, `icon-${size}.png`);
    const dest = join(dir, "icons", `icon-${size}.png`);
    if (existsSync(src)) {
      copyFileSync(src, dest);
    } else {
      writeFileSync(dest, solidPng(size, size, 217, 119, 87));
    }
  }
}

async function buildExtension({ id, manifest, zip, xpi, readme }) {
  const out = join(dist, id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "popup"), { recursive: true });

  await bundle(join(root, "src/content.js"), join(out, "content.js"));
  await bundle(join(root, "src/background.js"), join(out, "background.js"));
  await bundle(join(root, "src/popup/popup.js"), join(out, "popup/popup.js"));
  copyFileSync(join(root, "src/page-main.js"), join(out, "page-main.js"));

  copyFileSync(join(root, "src/popup/popup.html"), join(out, "popup/popup.html"));
  copyFileSync(join(root, "src/popup/popup.css"), join(out, "popup/popup.css"));
  copyFileSync(join(root, "manifests", manifest), join(out, "manifest.json"));

  writeIcons(out);

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
      "Supported: claude.ai, chatgpt.com, gemini.google.com, grok.com, x.com/i/grok, chat.deepseek.com, perplexity.ai, github.com/copilot",
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
      "  https://github.com/benjarogit/ai-chat-cleaner",
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
      "  Firefox for Android 142+ (check in AMO upload)",
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

  console.log("Done. Artifacts in dist/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
