#!/usr/bin/env node
/** Static release validation — provider count, manifests, URLs, version. */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { detectProvider, providers, supportedSitesLabel } from "../src/lib/registry.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const REQUIRED_HOSTS = [
  "claude.ai",
  "chatgpt.com",
  "gemini.google.com",
  "grok.com",
  "x.com",
  "github.com/copilot",
  "api.individual.githubcopilot.com",
  "copilot.microsoft.com",
  "cursor.com",
  "myactivity.google.com",
];

const FORBIDDEN_HOSTS = [
  "chat.deepseek.com",
  "perplexity.ai",
  "chat.mistral.ai",
  "pi.ai",
  "meta.ai",
  "poe.com",
  "suno.com",
  "manus.im",
  "agentgpt.reworkd.ai",
  "app.crewai.com",
  "assistant.kagi.com",
  "agent.minimax.io",
  "chat.z.ai",
];

const MATCH_CASES = [
  ["https://claude.ai/new", "claude"],
  ["https://chatgpt.com/", "chatgpt"],
  ["https://chat.openai.com/", "chatgpt"],
  ["https://gemini.google.com/app", "gemini"],
  ["https://myactivity.google.com/product/gemini", "gemini"],
  ["https://grok.com/", "grok-com"],
  ["https://www.grok.com/", "grok-com"],
  ["https://x.com/i/grok", "grok-x"],
  ["https://x.com/settings/grok_settings", "grok-x"],
  ["https://github.com/copilot", "copilot-github"],
  ["https://github.com/copilot/c/abc", "copilot-github"],
  ["https://copilot.microsoft.com/", "copilot-microsoft"],
  ["https://cursor.com/agents", "cursor"],
  ["https://cursor.com/agents/bc-1", "cursor"],
];

const REJECT_CASES = [
  "https://claude.ai.evil.com/",
  "https://chat.deepseek.com/",
  "https://www.perplexity.ai/",
  "https://github.com/",
  "https://github.com/features/copilot",
  "https://x.com/home",
  "https://cursor.com/",
  "https://cursor.com/dashboard",
  "https://myactivity.google.com/",
  "https://poe.com/",
  "https://assistant.kagi.com/",
];

if (providers.length !== 8) {
  errors.push(`Expected 8 providers in registry, found ${providers.length}`);
}

const label = supportedSitesLabel();
for (const name of ["Claude", "ChatGPT", "Gemini", "Grok", "Grok on X", "GitHub Copilot", "Microsoft Copilot", "Cursor"]) {
  if (!label.includes(name)) errors.push(`supportedSitesLabel missing ${name}`);
}
for (const name of ["DeepSeek", "Perplexity", "Mistral", "Kagi", "Suno", "MiniMax"]) {
  if (label.includes(name)) errors.push(`supportedSitesLabel still lists ${name}`);
}

for (const [url, id] of MATCH_CASES) {
  const found = detectProvider(url);
  if (!found || found.id !== id) {
    errors.push(`detectProvider(${url}) => ${found?.id ?? "null"}, expected ${id}`);
  }
}
for (const url of REJECT_CASES) {
  const found = detectProvider(url);
  if (found) errors.push(`detectProvider(${url}) should be null, got ${found.id}`);
}

for (const manifest of ["manifests/chrome.json", "manifests/firefox.json"]) {
  const json = JSON.parse(read(manifest));
  if (json.version !== "1.1.0") errors.push(`${manifest}: version must be 1.1.0`);
  if (manifest.includes("chrome") && json.description.length > 132) {
    errors.push(`${manifest}: description ${json.description.length} chars (CWS max 132)`);
  }
  const hosts = JSON.stringify(json.host_permissions);
  const matches = JSON.stringify(json.content_scripts);
  for (const host of REQUIRED_HOSTS) {
    if (!hosts.includes(host)) errors.push(`${manifest}: missing host_permissions ${host}`);
  }
  for (const host of ["claude.ai", "chatgpt.com", "gemini.google.com", "grok.com", "x.com/i/grok", "github.com/copilot", "copilot.microsoft.com", "cursor.com/agents", "myactivity.google.com", "x.com/settings"]) {
    if (!matches.includes(host)) errors.push(`${manifest}: missing content_scripts ${host}`);
  }
  for (const host of FORBIDDEN_HOSTS) {
    if (hosts.includes(host) || matches.includes(host)) {
      errors.push(`${manifest}: still grants ${host}`);
    }
  }
}

const pkg = JSON.parse(read("package.json"));
if (pkg.version !== "1.1.0") errors.push(`package.json version is ${pkg.version}`);

const staleUrlFiles = ["README.md", "README.de.md", "src/popup/popup.html", "scripts/build.mjs"];
for (const f of staleUrlFiles) {
  const content = read(f);
  if (content.includes("benjarogit/claudedeleter")) {
    errors.push(`${f}: still references benjarogit/claudedeleter`);
  }
  for (const host of ["chat.deepseek.com", "assistant.kagi.com", "agent.minimax.io", "chat.z.ai"]) {
    if (content.includes(host)) errors.push(`${f}: still mentions ${host}`);
  }
}

const bugTpl = read(".github/ISSUE_TEMPLATE/bug_report.yml");
for (const labelName of ["Claude (claude.ai)", "Cursor (cursor.com/agents)", "GitHub Copilot (github.com/copilot)"]) {
  if (!bugTpl.includes(labelName)) errors.push(`bug_report.yml: missing ${labelName}`);
}
if (bugTpl.includes("Kagi Assistant") || bugTpl.includes("DeepSeek")) {
  errors.push("bug_report.yml: still lists a removed platform");
}

const providerFiles = readdirSync(join(root, "src/lib/providers")).filter((f) => f.endsWith(".js"));
if (providerFiles.length !== 8) {
  errors.push(`Expected 8 provider files, found ${providerFiles.length}: ${providerFiles.join(", ")}`);
}

if (errors.length) {
  console.error("Validation FAILED:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log("Validation OK: 8 providers, v1.1.0, URL match contract, CWS description ≤132.");
