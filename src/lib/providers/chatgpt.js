import {
  confirmDialogs,
  countChatGptNavChats,
  findChatGptConversationOptionsButton,
  findChatGptSettingsBulkDelete,
  findOpenMenuDeleteItem,
} from "../dom.js";
import { navigateTo } from "../navigate.js";
import { report, runDeleteLoop, sleep } from "../shared.js";

const ORIGIN = "https://chatgpt.com";
const API = `${ORIGIN}/backend-api`;
const PAGE_SIZE = 100;

async function authHeaders(fetchFn) {
  const session = await fetchFn(`${ORIGIN}/api/auth/session`, {
    credentials: "include",
  }).then((r) => r.json());

  if (!session?.accessToken) {
    throw new Error("ChatGPT session not found — log in first");
  }

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  };
  if (session.account?.id) {
    headers["ChatGPT-Account-ID"] = session.account.id;
  }
  return headers;
}

/** Paginate with limit=100 — language-neutral API. */
async function listConversationIds(fetchFn) {
  const headers = await authHeaders(fetchFn);
  const ids = [];
  let offset = 0;
  let total = null;

  while (true) {
    const response = await fetchFn(
      `${API}/conversations?offset=${offset}&limit=${PAGE_SIZE}&order=updated&is_archived=false`,
      { credentials: "include", headers }
    );
    if (!response.ok) throw new Error(`list HTTP ${response.status}`);
    const data = await response.json();
    const page = data.items || [];
    if (typeof data.total === "number") total = data.total;
    if (!page.length) break;
    ids.push(...page.filter((c) => !c.is_archived).map((c) => c.id));
    offset += page.length;
    if (total != null && offset >= total) break;
    if (page.length < PAGE_SIZE) break;
  }

  return ids;
}

/**
 * Live: PATCH is_visible:false clears API but sidebar link may remain — check both.
 */
async function assertChatGptGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listConversationIds(fetchFn)).length;
  } catch {
    /* session/API unavailable */
  }

  const navCount = countChatGptNavChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (navCount > 0) parts.push(`${navCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`ChatGPT chats still remain (${parts.join(", ")})`);
  }
}

async function hideConversation(fetchFn, headers, id) {
  const response = await fetchFn(`${API}/conversation/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify({ is_visible: false }),
  });
  if (!response.ok) throw new Error(`hide ${id} HTTP ${response.status}`);
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const headers = await authHeaders(fetchFn);
  const ids = await listConversationIds(fetchFn);
  if (!ids.length) {
    const navCount = countChatGptNavChats();
    if (navCount > 0) throw new Error(`API listed 0 chats but ${navCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: (id) => hideConversation(fetchFn, headers, id),
  });

  await assertChatGptGone(fetchFn);
  return result;
}

async function deleteAllSettingsDom(ctx) {
  const onSettings =
    location.hash.includes("DataControls") || location.hash.includes("settings");

  if (!onSettings && ctx.step !== "settings-delete") {
    await navigateTo(`${ORIGIN}/#settings/DataControls`, {
      providerId: "chatgpt",
      step: "settings-delete",
      method: "dom-settings",
      tabId: ctx.tabId,
      methodIndex: ctx.methodIndex,
    });
  }

  await sleep(1200);

  const bulkBtn = findChatGptSettingsBulkDelete();
  if (!bulkBtn) throw new Error("ChatGPT settings bulk delete button not found");
  bulkBtn.click();

  await sleep(500);
  await confirmDialogs();
  await sleep(1000);
  await assertChatGptGone(ctx.fetchFn);

  return { deleted: "all", total: "all" };
}

async function deleteSidebarMenus(onProgress, fetchFn) {
  const estimated = Math.max(countChatGptNavChats(), 1);
  let deleted = 0;

  for (let i = 0; i < 200; i++) {
    const optionsBtn = findChatGptConversationOptionsButton();
    if (!optionsBtn) break;

    report(onProgress, {
      type: "status",
      message: `Deleting chat ${deleted + 1} via menu…`,
      overall: Math.min(10 + ((deleted + 1) / estimated) * 85, 95),
      current: 40,
    });

    optionsBtn.click();
    await sleep(450);
    const del = findOpenMenuDeleteItem();
    if (!del) break;

    del.click();
    await sleep(350);
    await confirmDialogs();
    deleted++;

    report(onProgress, {
      type: "status",
      message: `Deleted ${deleted} via sidebar menu`,
      overall: Math.min(10 + (deleted / estimated) * 85, 95),
      current: 100,
    });
    await sleep(450);
  }

  if (!deleted) throw new Error("No ChatGPT sidebar delete menus found");
  await assertChatGptGone(fetchFn);
  return { deleted, total: deleted };
}

/** ACC delete provider (public API). */

export const chatgptProvider = {
  id: "chatgpt",
  name: "ChatGPT",
  match(url) {
    try {
      const h = new URL(url).hostname;
      return h === "chatgpt.com" || h === "chat.openai.com";
    } catch {
      return false;
    }
  },

  /** Best first: settings bulk → API hide → sidebar menus */
  async getDeleteMethods(ctx) {
    return [
      { name: "dom-settings", step: "settings-delete", fn: () => deleteAllSettingsDom(ctx) },
      {
        name: "api-individual",
        step: null,
        fn: () => deleteAllOneByOne(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
      },
      {
        name: "dom-sidebar",
        step: null,
        fn: () => deleteSidebarMenus(ctx.onProgress, ctx.fetchFn),
      },
    ];
  },

  async verifyGone(ctx) {
    await assertChatGptGone(ctx.fetchFn);
  },
};
