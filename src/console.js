/**
 * Standalone console script — run on a supported AI chat tab.
 */
import { deleteAllChats, detectProvider, isSupportedUrl, supportedSitesLabel } from "./lib/deleter.js";

async function runConsoleCleaner() {
  if (!isSupportedUrl(location.href)) {
    console.error(`[ACC] Unsupported site. Open ${supportedSitesLabel()}.`);
    return;
  }

  const provider = detectProvider(location.href);
  const onlyMethod =
    globalThis.__accOnlyMethod ||
    new URLSearchParams(location.search).get("acc_method") ||
    null;

  const confirmed = confirm(
    onlyMethod
      ? `Delete ALL ${provider.name} chats via method "${onlyMethod}"?\n\nThis cannot be undone.`
      : `Delete ALL ${provider.name} conversations?\n\nThis cannot be undone.`
  );
  if (!confirmed) {
    console.log("[ACC] Cancelled.");
    return;
  }

  console.log(
    `[ACC] Starting on ${provider.name}${onlyMethod ? ` (only: ${onlyMethod})` : ""}…`
  );

  try {
    const result = await deleteAllChats({
      delayMs: 300,
      onlyMethod,
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
