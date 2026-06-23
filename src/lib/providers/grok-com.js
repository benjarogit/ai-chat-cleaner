import { clickByText, confirmDialogs } from "../dom.js";
import { report, tryMethods } from "../shared.js";

const ORIGIN = "https://grok.com";

async function deleteAllDom() {
  const onSettings = location.pathname.includes("settings") || location.hash.includes("settings");

  if (!onSettings) {
    const profile = await clickByText(["profile", "account", "settings", "einstellungen"]);
    if (!profile) {
      location.href = `${ORIGIN}/`;
      await new Promise((r) => setTimeout(r, 2000));
    }
    await clickByText(["settings", "einstellungen"]);
    await new Promise((r) => setTimeout(r, 1000));
  }

  await clickByText(["data", "data controls", "daten"]);
  const bulk =
    (await clickByText(["delete all conversations", "delete all", "alle unterhaltungen löschen"])) ||
    (await clickByText(["delete all conversation", "delete all your conversation"]));

  if (!bulk) throw new Error("Grok.com bulk-delete control not found");

  await confirmDialogs();
  await confirmDialogs();
  return { deleted: "all", total: "all" };
}

async function deleteHistoryItemsDom() {
  await clickByText(["history", "verlauf", "recent"]);
  await new Promise((r) => setTimeout(r, 800));

  let deleted = 0;
  for (let i = 0; i < 100; i++) {
    const btn = document.querySelector(
      'button[aria-label*="Delete"], button[aria-label*="delete"], [data-testid*="delete"]'
    );
    if (!btn) break;
    btn.click();
    await confirmDialogs();
    deleted++;
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!deleted) throw new Error("No Grok.com history items found");
  return { deleted, total: deleted };
}

export const grokComProvider = {
  id: "grok-com",
  name: "Grok",
  match(url) {
    try {
      return new URL(url).hostname === "grok.com";
    } catch {
      return false;
    }
  },

  async deleteAll(ctx) {
    report(ctx.onProgress, { type: "status", message: "Grok.com: starting…", overall: 5 });

    const result = await tryMethods(
      [
        { name: "dom-bulk-settings", fn: deleteAllDom },
        { name: "dom-history-items", fn: deleteHistoryItemsDom },
      ],
      ctx
    );

    return { ...result, provider: "grok-com" };
  },
};
