import { clickEachTrash, clickKeywords, confirmDialogs, KW } from "../dom.js";
import { geminiBatchInPage } from "../gemini-page.js";
import { assertRemaining, report, runDeleteLoop, tryMethods } from "../shared.js";

const ORIGIN = "https://gemini.google.com";

function normalizeGeminiId(id) {
  if (!id) return null;
  return id.startsWith("c_") ? id : `c_${id}`;
}

function extractChatIdsFromBatch(data) {
  const ids = new Set();
  const walk = (node) => {
    if (typeof node === "string") {
      if (/^c_[a-zA-Z0-9_-]+$/.test(node)) ids.add(node);
      else if (/^[a-f0-9]{12,}$/i.test(node)) ids.add(`c_${node}`);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === "object") {
      Object.values(node).forEach(walk);
    }
  };
  try {
    walk(JSON.parse(data?.[0]?.[2] || "[]"));
  } catch {
    walk(data);
  }
  return [...ids];
}

function listChatIdsFromDom() {
  const ids = new Set();
  for (const a of document.querySelectorAll('a[href*="/app/"]')) {
    const match = a.href.match(/\/app\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const normalized = normalizeGeminiId(match[1]);
      if (normalized) ids.add(normalized);
    }
  }
  return [...ids];
}

async function listChatIds() {
  const payloads = [50, 100, 25];
  for (const size of payloads) {
    try {
      const data = await geminiBatchInPage("MaZiqc", [size]);
      const fromApi = extractChatIdsFromBatch(data);
      if (fromApi.length) return fromApi;
    } catch {
      /* try next payload */
    }
  }
  return listChatIdsFromDom();
}

async function countChats() {
  try {
    return (await listChatIds()).length;
  } catch {
    return listChatIdsFromDom().length;
  }
}

async function deleteChatId(cid) {
  const id = normalizeGeminiId(cid);
  await geminiBatchInPage("GzXR5e", [id]);
  try {
    await geminiBatchInPage("GzXR5e", [id, [1, null, 0, 1]]);
  } catch {
    /* optional second RPC */
  }
}

async function deleteAllApi(onProgress, delayMs) {
  const ids = await listChatIds();
  if (!ids.length) {
    const domCount = listChatIdsFromDom().length;
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: (id) => deleteChatId(id),
  });

  await assertRemaining(countChats, 0, "Gemini chats");
  return result;
}

async function deleteAllDom() {
  await clickKeywords(KW.history, { timeout: 8000 });

  let deleted = await clickEachTrash({ max: 150, delayMs: 500 });
  if (!deleted) {
    const bulk = await clickKeywords(KW.deleteAll, { timeout: 5000 });
    if (bulk) {
      await confirmDialogs();
      return { deleted: "all", total: "all" };
    }
  }

  if (!deleted) throw new Error("No Gemini delete controls found");
  await confirmDialogs();
  return { deleted, total: deleted };
}

export const geminiProvider = {
  id: "gemini",
  name: "Gemini",
  match(url) {
    try {
      return new URL(url).hostname === "gemini.google.com";
    } catch {
      return false;
    }
  },

  async deleteAll(ctx) {
    report(ctx.onProgress, { type: "status", message: "Gemini: starting…", overall: 5 });

    const result = await tryMethods(
      [
        {
          name: "api-batchexecute",
          step: null,
          fn: () => deleteAllApi(ctx.onProgress, ctx.delayMs),
        },
        { name: "dom-sidebar", step: "dom-sidebar", fn: deleteAllDom },
      ],
      ctx
    );

    return { ...result, provider: "gemini" };
  },
};
