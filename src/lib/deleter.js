import { detectProvider } from "./registry.js";
import { report } from "./shared.js";

/**
 * Delete all chats on the current supported AI site.
 * @param {object} options
 * @param {string} [options.url] - page URL (defaults to location.href in content script)
 * @param {(event: object) => void} [options.onProgress]
 * @param {number} [options.delayMs]
 * @param {typeof fetch} [options.fetchFn]
 */
export async function deleteAllChats({
  url = typeof location !== "undefined" ? location.href : "",
  onProgress,
  delayMs = 300,
  fetchFn = fetch,
} = {}) {
  const provider = detectProvider(url);
  if (!provider) {
    throw new Error(
      "Unsupported site. Open Claude, ChatGPT, Gemini, grok.com, or x.com/i/grok."
    );
  }

  report(onProgress, {
    type: "status",
    message: `${provider.name}: initializing…`,
    overall: 0,
  });

  try {
    const result = await provider.deleteAll({ onProgress, delayMs, fetchFn, url });

    const deleted = result.deleted ?? 0;
    const total = result.total ?? deleted;
    const msg =
      deleted === "all"
        ? `${provider.name}: all chats deleted (${result.method || "ok"}).`
        : `${provider.name}: deleted ${deleted} of ${total} (${result.method || "ok"}).`;

    report(onProgress, {
      type: "complete",
      message: msg,
      overall: 100,
      deleted,
      total,
      provider: provider.id,
      method: result.method,
    });

    return { ...result, provider: provider.id };
  } catch (error) {
    report(onProgress, { type: "error", message: error.message });
    throw error;
  }
}

export { detectProvider, isSupportedUrl, supportedSitesLabel } from "./registry.js";
