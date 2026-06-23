/**
 * Standalone console script — run on a supported AI chat tab.
 */
import { deleteAllChats, detectProvider, isSupportedUrl } from "./lib/deleter.js";

async function runConsoleCleaner() {
  if (!isSupportedUrl(location.href)) {
    console.error(
      "[ACC] Unsupported site. Open Claude, ChatGPT, Gemini, grok.com, or x.com/i/grok."
    );
    return;
  }

  const provider = detectProvider(location.href);
  const confirmed = confirm(
    `Delete ALL ${provider.name} conversations?\n\nThis cannot be undone.`
  );
  if (!confirmed) {
    console.log("[ACC] Cancelled.");
    return;
  }

  console.log(`[ACC] Starting on ${provider.name}…`);

  try {
    const result = await deleteAllChats({
      delayMs: 300,
      onProgress: (event) => {
        if (event.message) {
          console.log(
            `[ACC] ${event.message}`,
            event.overall != null ? `(${Math.round(event.overall)}%)` : ""
          );
        }
      },
    });
    console.log(`[ACC] Done.`, result);
  } catch (error) {
    console.error("[ACC] Failed:", error.message);
  }
}

runConsoleCleaner();
