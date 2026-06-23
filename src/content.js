import { deleteAllChats, tryResumeDelete } from "./lib/deleter.js";
import { onRuntimeMessage, sendRuntimeMessage } from "./lib/api.js";

console.log("[ACC] content script loaded");

function wireProgress(onProgress) {
  return (event) => {
    if (event.type === "complete") {
      sendRuntimeMessage({ action: "complete", ...event });
    } else if (event.type === "error") {
      sendRuntimeMessage({ action: "error", error: event.message });
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
      sendRuntimeMessage({
        action: "updateProgress",
        message: "Navigating… will continue automatically.",
        overall: 15,
      });
      return;
    }
    console.error("[ACC]", error);
    sendRuntimeMessage({ action: "error", error: error.message });
  });
}

onRuntimeMessage((request, _sender, sendResponse) => {
  if (request.action === "deleteAll") {
    runDelete();
    sendResponse({ started: true });
    return true;
  }

  if (request.action === "checkResume") {
    tryResumeDelete({ onProgress: wireProgress() });
    sendResponse({ ok: true });
    return true;
  }
});

tryResumeDelete({ onProgress: wireProgress() });
