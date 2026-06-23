import { detectProvider, providers } from "./registry.js";
import {
  clearPending,
  getPending,
  getTabId,
  NavigationResumeError,
  setPending,
} from "./navigate.js";
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

function formatCompleteMessage(provider, result) {
  const deleted = result.deleted ?? 0;
  const total = result.total ?? deleted;
  if (deleted === "all") {
    return `${provider.name}: all chats deleted (${result.method || "ok"}).`;
  }
  return `${provider.name}: deleted ${deleted} of ${total} (${result.method || "ok"}).`;
}

function reportComplete(ctx, provider, result) {
  report(ctx.onProgress, {
    type: "complete",
    message: formatCompleteMessage(provider, result),
    overall: 100,
    current: 100,
    deleted: result.deleted,
    total: result.total,
    provider: provider.id,
    method: result.method,
  });
}

async function beginPostVerify(ctx, provider, result) {
  await setPending({
    providerId: provider.id,
    step: "verify",
    tabId: ctx.tabId,
    result: {
      deleted: result.deleted,
      total: result.total,
      method: result.method,
    },
  });

  report(ctx.onProgress, {
    type: "status",
    message: `${provider.name}: refreshing page to verify…`,
    overall: 95,
  });

  location.reload();
  throw new NavigationResumeError("verify");
}

async function runPostVerify(ctx, provider, pending) {
  report(ctx.onProgress, {
    type: "status",
    message: `${provider.name}: verifying deletion…`,
    overall: 92,
  });

  if (typeof provider.verifyGone !== "function") {
    throw new Error(`${provider.name}: verify not implemented`);
  }

  await provider.verifyGone(ctx);
  await clearPending();
  reportComplete(ctx, provider, pending.result);
  return pending.result;
}

export async function tryResumeDelete(options = {}) {
  const tabId = await getTabId();
  const pending = await getPending(tabId);
  if (!pending) return null;

  const provider = providers.find((p) => p.id === pending.providerId);
  if (!provider) return null;

  const ctx = await buildCtx(options);

  if (pending.step === "verify") {
    if (!provider.match(location.href)) return null;
    try {
      return await runPostVerify(ctx, provider, pending);
    } catch (error) {
      await clearPending();
      report(ctx.onProgress, { type: "error", message: error.message });
      throw error;
    }
  }

  if (!provider.match(location.href)) return null;

  await clearPending();
  report(ctx.onProgress, {
    type: "status",
    message: `${provider.name}: resuming after navigation…`,
    overall: 20,
  });

  const result = await provider.deleteAll({
    ...ctx,
    step: pending.step,
    resumeMethod: pending.method,
  });

  return beginPostVerify(ctx, provider, result);
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
    return await beginPostVerify(ctx, provider, result);
  } catch (error) {
    if (error instanceof NavigationResumeError) {
      throw error;
    }
    report(ctx.onProgress, { type: "error", message: error.message });
    throw error;
  }
}

export { detectProvider, isSupportedUrl, supportedSitesLabel } from "./registry.js";
