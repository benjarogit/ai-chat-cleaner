import { claudeProvider } from "./providers/claude.js";
import { chatgptProvider } from "./providers/chatgpt.js";
import { geminiProvider } from "./providers/gemini.js";
import { grokComProvider } from "./providers/grok-com.js";
import { grokXProvider } from "./providers/grok-x.js";

export const providers = [
  claudeProvider,
  chatgptProvider,
  geminiProvider,
  grokComProvider,
  grokXProvider,
];

export function detectProvider(url) {
  return providers.find((p) => p.match(url)) ?? null;
}

export function isSupportedUrl(url) {
  return Boolean(detectProvider(url));
}

export function supportedSitesLabel() {
  return "Claude, ChatGPT, Gemini, Grok, Grok on X";
}
