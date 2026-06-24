import { debugLog } from "./debug-log.js";
import { clearPending, getPending, NavigationResumeError, setPending } from "./navigate.js";
import { report } from "./shared.js";

/**
 * Best method first; after each attempt: reload → verify.
 * Verify fail → next fallback. Method throw → next fallback (no reload).
 */
export async function runDeletePipeline(ctx, provider, { beginPostVerify }) {
  const methods = await provider.getDeleteMethods(ctx);
  if (!methods.length) {
    return { deleted: 0, total: 0, method: "none", provider: provider.id };
  }

  const activeMethods = ctx.onlyMethod
    ? methods.filter((m) => m.name === ctx.onlyMethod)
    : methods;
  if (ctx.onlyMethod && !activeMethods.length) {
    throw new Error(`Method "${ctx.onlyMethod}" not available for ${provider.name}`);
  }
  const runMethods = activeMethods.length ? activeMethods : methods;

  let startIndex = ctx.methodIndex ?? 0;
  if (ctx.nextMethod) {
    const byName = runMethods.findIndex((m) => m.name === ctx.nextMethod);
    if (byName >= 0) startIndex = byName;
  }

  for (let i = startIndex; i < runMethods.length; i++) {
    const method = runMethods[i];
    if (ctx.step && method.step !== ctx.step) continue;

    ctx.methodIndex = i;
    debugLog("method", `trying ${method.name}`, { method: method.name });
    report(ctx.onProgress, {
      type: "status",
      message: `${provider.name}: ${method.name}…`,
      overall: Math.min(8 + (i / runMethods.length) * 12, 20),
      method: method.name,
    });

    try {
      const result = await method.fn(ctx);
      return beginPostVerify(ctx, provider, { ...result, method: method.name }, i);
    } catch (error) {
      if (error.name === "NavigationResumeError") throw error;
      debugLog("method-fail", `${method.name}: ${error.message}`, { method: method.name });
    }
  }

  throw new Error(
    `All delete methods failed for ${provider.name} (${runMethods.map((m) => m.name).join(" → ")})`
  );
}

export async function resumePipelineMethod(ctx, provider, pending, { beginPostVerify }) {
  const methods = await provider.getDeleteMethods(ctx);
  let index = pending.methodIndex;
  if (index == null && pending.step) {
    index = methods.findIndex((m) => m.step === pending.step);
  }
  if (index == null || index < 0) index = 0;

  const method = methods[index];
  if (!method) {
    throw new Error(`Resume method index ${index} invalid`);
  }

  ctx.methodIndex = index;
  ctx.step = pending.step;

  report(ctx.onProgress, {
    type: "status",
    message: `${provider.name}: resuming ${method.name}…`,
    overall: 20,
    method: method.name,
  });

  const result = await method.fn(ctx);
  return beginPostVerify(ctx, provider, { ...result, method: method.name }, index);
}

export async function handleVerifyFailure(ctx, provider, pending, error) {
  const methods = await provider.getDeleteMethods(ctx);
  const nextIndex = (pending.methodIndex ?? 0) + 1;

  if (nextIndex >= methods.length) {
    throw error;
  }

  const next = methods[nextIndex];
  debugLog("verify-fail", `${pending.result?.method}: ${error.message} → ${next.name}`, {
    method: next.name,
  });

  report(ctx.onProgress, {
    type: "status",
    message: `${provider.name}: verify failed, trying ${next.name}…`,
    overall: 15,
    method: next.name,
  });

  await setPending({
    providerId: provider.id,
    step: "continue-delete",
    nextMethod: next.name,
    methodIndex: nextIndex,
    tabId: ctx.tabId,
    lastError: error.message,
  });

  location.reload();
  throw new NavigationResumeError("continue-delete");
}

export async function readContinueDeleteIndex(tabId) {
  const pending = await getPending(tabId);
  if (pending?.step !== "continue-delete") return null;
  const methodIndex = pending.methodIndex ?? 0;
  const nextMethod = pending.nextMethod ?? null;
  await clearPending();
  return { methodIndex, nextMethod };
}

export function isNavigationStep(step) {
  return step && step !== "verify" && step !== "continue-delete";
}
