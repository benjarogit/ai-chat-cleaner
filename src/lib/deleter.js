import { detectProvider, providers } from "./registry.js";
import { clearPending, getPending, getTabId, NavigationResumeError } from "./navigate.js";
import { report } from "./shared.js";

async function buildCtx(options) {
  const tabId = await getTabId();
  return {
    url: options.url ?? location.href,
    onProgress: options.onProgress,
    delayMs: options.delayMs ?? 300,
    fetchFn: options.fetchFn ?? fetch,
    tabId,
    step: options.step ?? null,
  };
}

export async function tryResumeDelete(options = {}) {
  const tabId = await getTabId();
  const pending = await getPending(tabId);
  if (!pending) return null;

  const provider = providers.find((p) => p.id === pending.providerId);
  if (!provider?.match(location.href)) return null;

  await clearPending();
  report(options.onProgress, {
    type: "status",
    message: `${provider.name}: resuming after navigation…`,
    overall: 20,
  });

  return provider.deleteAll({
    ...(await buildCtx(options)),
    step: pending.step,
    resumeMethod: pending.method,
  });
}

/**
 * Delete all chats on the current supported AI site.
 */
export async function deleteAllChats(options = {}) {
  const ctx = await buildCtx(options);
  const provider = detectProvider(ctx.url);

  if (!provider) {
    throw new Error(
      "Unsupported site. Open Claude, ChatGPT, Gemini, grok.com, or x.com/i/grok."
    );
  }

  report(ctx.onProgress, {
    type: "status",
    message: `${provider.name}: initializing…`,
    overall: 0,
  });

  try {
    const result = await provider.deleteAll(ctx);

    const deleted = result.deleted ?? 0;
    const total = result.total ?? deleted;
    const msg =
      deleted === "all"
        ? `${provider.name}: all chats deleted (${result.method || "ok"}).`
        : `${provider.name}: deleted ${deleted} of ${total} (${result.method || "ok"}).`;

    report(ctx.onProgress, {
      type: "complete",
      message: msg,
      overall: 100,
      current: 100,
      deleted,
      total,
      provider: provider.id,
      method: result.method,
    });

    return { ...result, provider: provider.id };
  } catch (error) {
    if (error instanceof NavigationResumeError) {
      throw error;
    }
    report(ctx.onProgress, { type: "error", message: error.message });
    throw error;
  }
}

export { detectProvider, isSupportedUrl, supportedSitesLabel } from "./registry.js";
