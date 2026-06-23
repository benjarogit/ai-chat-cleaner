import {
  clickEachMoreDelete,
  clickEachTrash,
  clickKeywords,
  confirmDialogs,
  countGrokComSidebarChats,
  findGrokComHeaderMore,
  findGrokComSidebarChatLinks,
  findGrokComSidebarOptionsButton,
  findOpenMenuDeleteItem,
  KW,
} from "../dom.js";
import { report, runDeleteLoop, sleep, tryMethods } from "../shared.js";

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

async function assertGrokComGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listConversationIds(fetchFn)).length;
  } catch {
    /* API unavailable — rely on DOM */
  }

  const domCount = countGrokComSidebarChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`Grok.com chats still remain (${parts.join(", ")})`);
  }
}

async function deleteAllBulk(fetchFn) {
  const ids = await listConversationIds(fetchFn);
  if (!ids.length) throw new Error("Grok.com API listed 0 conversations for bulk delete");

  const response = await fetchFn(API, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`bulk delete HTTP ${response.status}`);

  await assertGrokComGone(fetchFn);
  return { deleted: ids.length, total: ids.length };
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listConversationIds(fetchFn);
  if (!ids.length) {
    const domCount = countGrokComSidebarChats();
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

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

  await assertGrokComGone(fetchFn);
  return result;
}

async function openGrokDeleteMenu(link) {
  const row = link.closest("li") || link.parentElement;
  row?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
  await sleep(150);

  const options = findGrokComSidebarOptionsButton(row);
  if (options) {
    options.click();
    return true;
  }

  link.click();
  await sleep(900);
  const mehr = findGrokComHeaderMore();
  if (!mehr) return false;
  mehr.click();
  return true;
}

/** Sidebar Optionen → Chat löschen; fallback open chat → header Mehr. */
async function deleteViaSidebarOrHeader(onProgress) {
  const estimated = Math.max(countGrokComSidebarChats(), 1);
  let deleted = 0;

  for (let i = 0; i < 150; i++) {
    const links = findGrokComSidebarChatLinks();
    if (!links.length) break;

    report(onProgress, {
      type: "status",
      message: `Deleting Grok chat ${deleted + 1}…`,
      overall: Math.min(10 + ((deleted + 1) / estimated) * 85, 95),
      current: 40,
    });

    const opened = await openGrokDeleteMenu(links[0]);
    if (!opened) break;

    await sleep(350);
    const del = findOpenMenuDeleteItem();
    if (!del) break;

    del.click();
    await sleep(250);
    await confirmDialogs();
    deleted++;

    report(onProgress, {
      type: "status",
      message: `Deleted ${deleted} Grok chat(s)…`,
      overall: Math.min(10 + (deleted / estimated) * 85, 95),
      current: 100,
    });
    await sleep(450);
  }

  return deleted;
}

async function deleteHistoryDom(fetchFn, onProgress) {
  const sidebarCount = countGrokComSidebarChats();
  if (!sidebarCount) return { deleted: 0, total: 0 };

  if (!findGrokComSidebarChatLinks().length) {
    await clickKeywords(KW.history, { timeout: 10000 });
    await sleep(600);
  }

  let deleted = await deleteViaSidebarOrHeader(onProgress);
  if (!deleted) deleted = await clickEachTrash({ max: 150, delayMs: 450 });
  if (!deleted) deleted = await clickEachMoreDelete({ max: 100, delayMs: 450 });

  if (!deleted) throw new Error("No Grok.com delete controls found");
  await assertGrokComGone(fetchFn);
  return { deleted, total: deleted };
}

/**
 * Live grok.com: API returned 0 chats while sidebar had 25 — API bulk lies on this account.
 * Pick methods based on what actually has data.
 */
async function deleteGrokComAll(ctx) {
  const apiIds = await listConversationIds(ctx.fetchFn);
  const domCount = countGrokComSidebarChats();

  if (!apiIds.length && !domCount) return { deleted: 0, total: 0 };

  const methods = [];
  if (apiIds.length > 0) {
    methods.push({ name: "api-bulk", step: null, fn: () => deleteAllBulk(ctx.fetchFn) });
    methods.push({
      name: "api-individual",
      step: null,
      fn: () => deleteAllOneByOne(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
    });
  }
  if (domCount > 0) {
    methods.push({
      name: "dom-history",
      step: "dom-history",
      fn: () => deleteHistoryDom(ctx.fetchFn, ctx.onProgress),
    });
  }

  return tryMethods(methods, ctx);
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

    if (ctx.step === "dom-history") {
      return {
        ...(await deleteHistoryDom(ctx.fetchFn, ctx.onProgress)),
        method: "dom-history",
        provider: "grok-com",
      };
    }

    const result = await deleteGrokComAll(ctx);
    return { ...result, provider: "grok-com" };
  },

  async verifyGone(ctx) {
    await assertGrokComGone(ctx.fetchFn);
  },
};
