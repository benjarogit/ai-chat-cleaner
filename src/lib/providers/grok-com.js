import {
  clickEachMoreDelete,
  clickEachTrash,
  clickKeywords,
  confirmDialogs,
  findByKeywords,
  KW,
} from "../dom.js";
import { assertRemaining, report, runDeleteLoop, sleep, tryMethods } from "../shared.js";

const ORIGIN = "https://grok.com";
const API = `${ORIGIN}/rest/app-chat/conversations`;

function parseConversationList(data) {
  if (Array.isArray(data)) return data;
  return data.conversations || data.items || data.data?.conversations || [];
}

async function listConversationIds(fetchFn) {
  const response = await fetchFn(API, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  const list = parseConversationList(data);
  return list.map((c) => c.conversationId || c.id).filter(Boolean);
}

async function countConversations(fetchFn) {
  try {
    return (await listConversationIds(fetchFn)).length;
  } catch {
    return document.querySelectorAll('a[href*="/c/"]').length;
  }
}

async function deleteAllBulk(fetchFn) {
  const before = await countConversations(fetchFn);
  if (!before) {
    const domCount = document.querySelectorAll('a[href*="/c/"]').length;
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const response = await fetchFn(API, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`bulk delete HTTP ${response.status}`);

  await assertRemaining(() => countConversations(fetchFn), 0, "Grok.com chats");
  return { deleted: before, total: before };
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listConversationIds(fetchFn);
  if (!ids.length) return { deleted: 0, total: 0 };

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertRemaining(() => countConversations(fetchFn), 0, "Grok.com chats");
  return result;
}

async function deleteViaChatHeaderMenu() {
  const links = [...document.querySelectorAll('a[href*="/c/"]')].filter(
    (a) => a.href.includes("/c/") && !a.href.includes("/c/new")
  );

  let deleted = 0;
  for (const link of links.slice(0, 120)) {
    link.click();
    await sleep(900);

    const mehr = findByKeywords(KW.more);
    if (!mehr) continue;

    mehr.click();
    await sleep(350);

    const del = findByKeywords(KW.delete);
    if (!del) continue;

    del.click();
    await sleep(250);
    await confirmDialogs();
    deleted++;
    await sleep(400);
  }

  return deleted;
}

async function deleteHistoryDom() {
  await clickKeywords(KW.history, { timeout: 10000 });
  await sleep(600);

  let deleted = await clickEachTrash({ max: 150, delayMs: 450 });
  if (!deleted) deleted = await clickEachMoreDelete({ max: 100, delayMs: 450 });
  if (!deleted) deleted = await deleteViaChatHeaderMenu();

  if (!deleted) throw new Error("No Grok.com delete controls found");
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
        { name: "api-bulk", step: null, fn: () => deleteAllBulk(ctx.fetchFn) },
        {
          name: "api-individual",
          step: null,
          fn: () => deleteAllOneByOne(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
        },
        { name: "dom-history", step: "dom-history", fn: deleteHistoryDom },
      ],
      ctx
    );

    return { ...result, provider: "grok-com" };
  },
};
