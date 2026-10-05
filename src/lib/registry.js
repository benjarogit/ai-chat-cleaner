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
