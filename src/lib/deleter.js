/** @file ACC entry — delete orchestration, resume after navigation, debug reports. */
import { detectProvider, providers, supportedSitesLabel } from "./registry.js";
import {
  clearPending,
  getPending,
  getTabId,
  NavigationResumeError,
  setPending,
} from "./navigate.js";
import {
  handleVerifyFailure,
  isNavigationStep,
  readContinueDeleteIndex,
  resumePipelineMethod,
  runDeletePipeline,
} from "./pipeline.js";
import { debugLog, debugLogError, debugLogStart, getDebugReport } from "./debug-log.js";
import { createCopilotFetch } from "./copilot-fetch.js";
import { report } from "./shared.js";
import { ext } from "./api.js";

function accVersion() {
  try {
    return ext.runtime.getManifest().version;
  } catch {
    return "unknown";
  }
}

function debugContext(ctx, provider) {
  return {
    version: accVersion(),
    url: ctx.url || (typeof location !== "undefined" ? location.href : ""),
    provider: provider?.id,
  };
}

function errorPayload(error, ctx, provider) {
  return {
    type: "error",
    message: error.message,
    debugReport: getDebugReport(debugContext(ctx, provider)),
  };
}

async function buildCtx(options) {
  const tabId = await getTabId();
  const url = options.url ?? location.href;
  let fetchFn = options.fetchFn ?? fetch;
  if (!options.fetchFn) {
    try {
      const u = new URL(url);
      if (u.hostname === "github.com" && u.pathname.startsWith("/copilot")) {
        fetchFn = createCopilotFetch();
      }
    } catch {
      /* default fetch */
    }
  }
  return {
    url,
    onProgress: options.onProgress,
    delayMs: options.delayMs ?? 300,
    fetchFn,
    tabId,
    step: options.step ?? null,
    methodIndex: options.methodIndex ?? null,
    nextMethod: options.nextMethod ?? null,
    onlyMethod: options.onlyMethod ?? null,
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

async function beginPostVerify(ctx, provider, result, methodIndex) {
  await setPending({
    providerId: provider.id,
    step: "verify",
    methodIndex,
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
    method: result.method,
  });

  location.reload();
  throw new NavigationResumeError("verify");
}

const pipelineHooks = {
  beginPostVerify,
};

async function runPostVerify(ctx, provider, pending) {
  report(ctx.onProgress, {
    type: "status",
    message: `${provider.name}: verifying deletion…`,
    overall: 92,
    method: pending.result?.method,
  });

  if (typeof provider.verifyGone !== "function") {
    throw new Error(`${provider.name}: verify not implemented`);
  }

  try {
    await provider.verifyGone(ctx);
  } catch (error) {
    await handleVerifyFailure(ctx, provider, pending, error);
  }

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
      if (error instanceof NavigationResumeError) throw error;
      await clearPending();
      debugLogError(error);
      report(ctx.onProgress, errorPayload(error, ctx, provider));
      throw error;
    }
  }

  if (pending.step === "continue-delete") {
    if (!provider.match(location.href)) return null;
    const cont = await readContinueDeleteIndex(tabId);
    if (!cont) return null;
    ctx.methodIndex = cont.methodIndex;
    ctx.nextMethod = cont.nextMethod;
    try {
      return await runDeletePipeline(ctx, provider, pipelineHooks);
    } catch (error) {
      if (error instanceof NavigationResumeError) throw error;
      await clearPending();
      debugLogError(error);
      report(ctx.onProgress, errorPayload(error, ctx, provider));
      throw error;
    }
  }

  if (isNavigationStep(pending.step)) {
    if (!provider.match(location.href)) return null;
    try {
      return await resumePipelineMethod(ctx, provider, pending, pipelineHooks);
    } catch (error) {
      if (error instanceof NavigationResumeError) throw error;
      await clearPending();
      debugLogError(error);
      report(ctx.onProgress, errorPayload(error, ctx, provider));
      throw error;
    }
  }

  return null;
}

/**
 * Delete all chats on the current supported AI site.
 * Each method: execute → reload → verify → fallback on failure.
 */
export async function deleteAllChats(options = {}) {
  const ctx = await buildCtx(options);
  const provider = detectProvider(ctx.url);

  if (!provider) {
    throw new Error(`Unsupported site. Open ${supportedSitesLabel()}.`);
  }

  if (options.methodIndex == null && !options.nextMethod) {
    await clearPending();
    report(ctx.onProgress, {
      type: "status",
      message: `${provider.name}: initializing…`,
      overall: 0,
    });
    debugLogStart({
      provider: provider.id,
      url: ctx.url,
      step: ctx.step,
    });
  }

  try {
    return await runDeletePipeline(ctx, provider, pipelineHooks);
  } catch (error) {
    if (error instanceof NavigationResumeError) {
      throw error;
    }
    debugLogError(error);
    report(ctx.onProgress, errorPayload(error, ctx, provider));
    throw error;
  }
}

export { detectProvider, isSupportedUrl, supportedSitesLabel } from "./registry.js";
