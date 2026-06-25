/** @file GitHub issue form URLs for ACC bug reports (redacted debug prefill). */

export const GITHUB_REPO = "https://github.com/benjarogit/ai-chat-cleaner";
export const GITHUB_BUG_BASE = `${GITHUB_REPO}/issues/new?template=bug_report.yml&labels=bug`;

/** Maps provider id → bug_report.yml platform dropdown label. */
const PLATFORM_LABELS = {
  claude: "Claude (claude.ai)",
  chatgpt: "ChatGPT (chatgpt.com)",
  gemini: "Gemini (gemini.google.com)",
  "grok-com": "Grok (grok.com)",
  "grok-x": "Grok on X (x.com/i/grok)",
  deepseek: "DeepSeek (chat.deepseek.com)",
  perplexity: "Perplexity (perplexity.ai)",
  "copilot-github": "GitHub Copilot (github.com/copilot)",
  "copilot-microsoft": "Microsoft Copilot (copilot.microsoft.com)",
  mistral: "Mistral (chat.mistral.ai)",
  pi: "Pi (pi.ai)",
  "meta-ai": "Meta AI (meta.ai)",
  poe: "Poe (poe.com)",
  suno: "Suno (suno.com — clips/songs)",
  manus: "Manus (manus.im)",
  agentgpt: "AgentGPT (agentgpt.reworkd.ai)",
  crewai: "CrewAI (app.crewai.com)",
  kagi: "Kagi Assistant (assistant.kagi.com)",
  minimax: "MiniMax (agent.minimax.io)",
  zai: "Z.ai (chat.z.ai)",
};

/**
 * Build a GitHub issue form URL with optional pre-filled fields.
 * @param {{ report?: string, providerId?: string, surface?: string }} opts
 * @returns {string}
 */
export function buildGithubBugUrl({ report, providerId, surface } = {}) {
  const params = new URLSearchParams();
  if (report) {
    params.set("fields[debug_report]", report.slice(0, 6500));
  }
  const platform = providerId ? PLATFORM_LABELS[providerId] : null;
  if (platform) {
    params.set("fields[platform]", platform);
  }
  if (surface) {
    params.set("fields[surface]", surface);
  }
  const q = params.toString();
  return q ? `${GITHUB_BUG_BASE}&${q.replace(/\+/g, "%20")}` : GITHUB_BUG_BASE;
}

/** @param {string} [providerId] */
export function platformLabelForProvider(providerId) {
  return PLATFORM_LABELS[providerId] ?? null;
}
