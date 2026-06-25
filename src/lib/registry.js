/** @file Provider registry — URL matching and site labels. */

import { agentGptProvider } from "./providers/agentgpt.js";
import { chatgptProvider } from "./providers/chatgpt.js";
import { claudeProvider } from "./providers/claude.js";
import { copilotGithubProvider } from "./providers/copilot-github.js";
import { copilotMicrosoftProvider } from "./providers/copilot-microsoft.js";
import { crewAiProvider } from "./providers/crewai.js";
import { deepseekProvider } from "./providers/deepseek.js";
import { geminiProvider } from "./providers/gemini.js";
import { grokComProvider } from "./providers/grok-com.js";
import { grokXProvider } from "./providers/grok-x.js";
import { kagiProvider } from "./providers/kagi.js";
import { manusProvider } from "./providers/manus.js";
import { metaAiProvider } from "./providers/meta-ai.js";
import { mistralProvider } from "./providers/mistral.js";
import { perplexityProvider } from "./providers/perplexity.js";
import { piProvider } from "./providers/pi.js";
import { poeProvider } from "./providers/poe.js";
import { sunoProvider } from "./providers/suno.js";

/** All supported AI chat providers (order = fallback priority). */
export const providers = [
  claudeProvider,
  chatgptProvider,
  geminiProvider,
  grokComProvider,
  grokXProvider,
  deepseekProvider,
  perplexityProvider,
  copilotGithubProvider,
  copilotMicrosoftProvider,
  mistralProvider,
  piProvider,
  metaAiProvider,
  poeProvider,
  sunoProvider,
  manusProvider,
  agentGptProvider,
  crewAiProvider,
  kagiProvider,
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
    "DeepSeek",
    "Perplexity",
    "GitHub Copilot",
    "Microsoft Copilot",
    "Mistral",
    "Pi",
    "Meta AI",
    "Poe",
    "Suno (clips)",
    "Manus",
    "AgentGPT",
    "CrewAI",
    "Kagi Assistant",
  ].join(", ");
}
