import {
  clickKeywords,
  confirmDialogs,
  findByKeywords,
  findToolbarButton,
  KW,
} from "../dom.js";
import { navigateTo } from "../navigate.js";
import { report, runDeleteLoop, sleep, tryMethods } from "../shared.js";

const ORIGIN = "https://chatgpt.com";
const API = `${ORIGIN}/backend-api`;

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

async function listConversationIds(fetchFn) {
  const headers = await authHeaders(fetchFn);
  const ids = [];
  let offset = 0;

  while (true) {
    const response = await fetchFn(
      `${API}/conversations?offset=${offset}&limit=28&order=updated&is_archived=false`,
      { credentials: "include", headers }
    );
    if (!response.ok) throw new Error(`list HTTP ${response.status}`);
    const data = await response.json();
    const page = data.items || [];
    if (!page.length) break;
    ids.push(...page.filter((c) => !c.is_archived).map((c) => c.id));
    offset += page.length;
    if (typeof data.total === "number" && offset >= data.total) break;
    if (page.length < 28) break;
  }

  return ids;
}

function countDomChats() {
  const ids = new Set();
  for (const a of document.querySelectorAll('a[href*="/c/"]')) {
    const match = a.href.match(/\/c\/([a-f0-9-]+)/i);
    if (match) ids.add(match[1]);
  }
  return ids.size;
}

async function countApiChats(fetchFn) {
  try {
    return (await listConversationIds(fetchFn)).length;
  } catch {
    return null;
  }
}

/** API list and sidebar must both be empty — PATCH hide clears API but UI stays stale. */
async function assertChatGptGone(fetchFn) {
  const apiCount = await countApiChats(fetchFn);
  const domCount = countDomChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
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
    const domCount = countDomChats();
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
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
    });
  }

  await sleep(1200);

  let clicked = false;
  const bulkBtn = findToolbarButton(["alle löschen", "delete all"]);
  if (bulkBtn) {
    bulkBtn.click();
    clicked = true;
  } else {
    clicked = await clickKeywords(KW.deleteAll, { timeout: 12000 });
  }
  if (!clicked) throw new Error("ChatGPT “Alle löschen” not found in Datenkontrollen");

  await sleep(400);
  await confirmDialogs();
  await sleep(800);
  await assertChatGptGone(ctx.fetchFn);

  return { deleted: "all", total: "all" };
}

/** Sidebar ⋮ → Löschen per chat (slow fallback). */
async function deleteSidebarMenus(onProgress, fetchFn) {
  const estimated = Math.max(countDomChats(), 1);
  let deleted = 0;

  for (let i = 0; i < 150; i++) {
    const mehr = findByKeywords(KW.more);
    if (!mehr) break;

    report(onProgress, {
      type: "status",
      message: `Deleting chat ${deleted + 1} via menu…`,
      overall: Math.min(10 + ((deleted + 1) / estimated) * 85, 95),
      current: 40,
    });

    mehr.click();
    await sleep(400);
    const del = findByKeywords(KW.delete);
    if (!del) break;

    del.click();
    await sleep(300);
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

  async deleteAll(ctx) {
    report(ctx.onProgress, { type: "status", message: "ChatGPT: starting…", overall: 5 });

    if (ctx.step === "settings-delete") {
      return { ...(await deleteAllSettingsDom(ctx)), method: "dom-settings", provider: "chatgpt" };
    }

    const result = await tryMethods(
      [
        { name: "dom-settings", step: "settings-delete", fn: () => deleteAllSettingsDom(ctx) },
        {
          name: "api-individual",
          step: null,
          fn: () => deleteAllOneByOne(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
        },
        {
          name: "dom-sidebar",
          step: null,
          fn: async () => deleteSidebarMenus(ctx.onProgress, ctx.fetchFn),
        },
      ],
      ctx
    );

    return { ...result, provider: "chatgpt" };
  },
};
