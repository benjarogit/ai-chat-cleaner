/**
 * Standalone script for DevTools console on https://claude.ai
 * Build output: dist/console-deleter.js + dist/bookmarklet.txt
 */
import { deleteAllChats, isClaudeUrl } from "./lib/deleter.js";

async function runConsoleDeleter() {
  if (!isClaudeUrl(location.href)) {
    console.error("[Claude Deleter] Open https://claude.ai and run again.");
    return;
  }

  const confirmed = confirm(
    "Delete ALL Claude conversations?\n\nThis cannot be undone."
  );
  if (!confirmed) {
    console.log("[Claude Deleter] Cancelled.");
    return;
  }

  console.log("[Claude Deleter] Starting…");

  try {
    const result = await deleteAllChats({
      delayMs: 300,
      onProgress: (event) => {
        if (event.message) {
          console.log(
            `[Claude Deleter] ${event.message}`,
            event.overall != null ? `(${Math.round(event.overall)}%)` : ""
          );
        }
      },
    });
    console.log(`[Claude Deleter] Done. Deleted ${result.deleted} chat(s).`);
  } catch (error) {
    console.error("[Claude Deleter] Failed:", error.message);
  }
}

runConsoleDeleter();
