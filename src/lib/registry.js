/** @file Provider registry — URL matching and site labels. */

import { chatgptProvider } from "./providers/chatgpt.js";
import { claudeProvider } from "./providers/claude.js";
import { copilotGithubProvider } from "./providers/copilot-github.js";
import { copilotMicrosoftProvider } from "./providers/copilot-microsoft.js";
import { cursorProvider } from "./providers/cursor.js";
import { geminiProvider } from "./providers/gemini.js";
import { grokComProvider } from "./providers/grok-com.js";
import { grokXProvider } from "./providers/grok-x.js";

/** Supported AI chat providers (order = fallback priority). */
export const providers = [
  claudeProvider,
  chatgptProvider,
  geminiProvider,
  grokComProvider,
  grokXProvider,
  copilotGithubProvider,
  copilotMicrosoftProvider,
  cursorProvider,
];

/** @param {string} url @returns {object|null} Provider descriptor or null. */
export function detectProvider(url) {
  return providers.find((p) => p.match(url)) ?? null;
}

/** @param {string} url @returns {boolean} */
export function isSupportedUrl(url) {
  return Boolean(detectProvider(url));
}

/**
 * Hosts where the content script is injected for SPA navigations, but only
 * one path is a supported chat surface.
 */
const PATH_HINTS = [
  { hosts: ["x.com"], name: "Grok on X", open: "https://x.com/i/grok" },
  { hosts: ["github.com", "www.github.com"], name: "GitHub Copilot", open: "https://github.com/copilot" },
  { hosts: ["cursor.com", "www.cursor.com"], name: "Cursor", open: "https://cursor.com/agents" },
];

/**
 * Classify a tab URL for the popup.
 * @param {string} url
 * @returns {{ state: "ready"|"wrong-path"|"unsupported", provider: object|null, name: string|null, open: string|null }}
 */
export function supportHint(url) {
  const provider = detectProvider(url);
  if (provider) {
    return { state: "ready", provider, name: provider.name, open: null };
  }
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return { state: "unsupported", provider: null, name: null, open: null };
  }
  const hint = PATH_HINTS.find((entry) => entry.hosts.includes(host));
  if (hint) {
    return { state: "wrong-path", provider: null, name: hint.name, open: hint.open };
  }
  return { state: "unsupported", provider: null, name: null, open: null };
}

/** Human-readable comma-separated list of supported platforms. @returns {string} */
export function supportedSitesLabel() {
  return [
    "Claude",
    "ChatGPT",
    "Gemini",
    "Grok",
    "Grok on X",
    "GitHub Copilot",
    "Microsoft Copilot",
    "Cursor",
  ].join(", ");
}
