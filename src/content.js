import { deleteAllChats, detectProvider, tryResumeDelete } from "./lib/deleter.js";
import { ext, onRuntimeMessage, sendRuntimeMessage } from "./lib/api.js";
import { debugLog, debugLogError, getDebugReport } from "./lib/debug-log.js";

console.log("[ACC] content script loaded");

function accVersion() {
  try {
    return ext.runtime.getManifest().version;
  } catch {
    return "unknown";
  }
}

function buildDebugReport(error) {
  const provider = detectProvider(location.href);
  return getDebugReport({
    version: accVersion(),
    url: location.href,
    provider: provider?.id,
    error,
  });
}

function sendError(error) {
  debugLogError(error);
  sendRuntimeMessage({
    action: "error",
    error: error.message,
    debugReport: buildDebugReport(error),
  });
}

function wireProgress(onProgress) {
  return (event) => {
    if (event.type === "complete") {
      sendRuntimeMessage({ action: "complete", ...event });
    } else if (event.type === "error") {
      sendRuntimeMessage({
        action: "error",
        error: event.message,
        debugReport: event.debugReport || buildDebugReport({ message: event.message, name: "Error" }),
      });
    } else {
      sendRuntimeMessage({ action: "updateProgress", ...event });
    }
  };
}

async function runDelete(options = {}) {
  return deleteAllChats({
    ...options,
    onProgress: wireProgress(options.onProgress),
  }).catch((error) => {
    if (error.name === "NavigationResumeError") {
      const msg =
        error.step === "verify"
          ? "Refreshing page to verify deletion…"
          : error.step === "continue-delete"
            ? "Verify failed — trying next delete method…"
            : "Navigating… will continue automatically.";
      debugLog("nav", msg, { step: error.step });
      sendRuntimeMessage({
        action: "updateProgress",
        message: msg,
        overall: error.step === "verify" ? 95 : 15,
      });
      return;
    }
    console.error("[ACC]", error);
    sendError(error);
  });
}

function resumeDelete() {
  return tryResumeDelete({ onProgress: wireProgress() }).catch((error) => {
    if (error?.name === "NavigationResumeError") return;
    // Storage/resume glitches on load should not flash errors in the popup.
    if (/storage|pending/i.test(error?.message || "")) {
      debugLog("warn", `resume skipped: ${error.message}`);
      return;
    }
    console.error("[ACC] resume", error);
    sendError(error);
  });
}

onRuntimeMessage((request, _sender, sendResponse) => {
  if (request.action === "deleteAll") {
    runDelete();
    sendResponse({ started: true });
    return true;
  }

  if (request.action === "checkResume") {
    resumeDelete();
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === "getDebugLog") {
    sendResponse({ debugReport: buildDebugReport() });
    return true;
  }
});

resumeDelete();
