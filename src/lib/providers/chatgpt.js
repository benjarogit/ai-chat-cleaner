import { clickKeywords, confirmDialogs, KW } from "../dom.js";
import { navigateTo } from "../navigate.js";
import { assertRemaining, report, runDeleteLoop, tryMethods } from "../shared.js";

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

async function countVisibleChats(fetchFn) {
  try {
    return (await listConversationIds(fetchFn)).length;
  } catch {
    return document.querySelectorAll('a[href*="/c/"]').length;
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
    const domCount = document.querySelectorAll('a[href*="/c/"]').length;
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

  await assertRemaining(() => countVisibleChats(fetchFn), 0, "ChatGPT chats");
  return result;
}

async function deleteAllDom(ctx) {
  const onSettings =
    location.hash.includes("settings") || location.pathname.includes("/settings");

  if (!onSettings && ctx.step !== "settings-delete") {
    await navigateTo(`${ORIGIN}/#settings/DataControls`, {
      providerId: "chatgpt",
      step: "settings-delete",
      method: "dom-settings",
      tabId: ctx.tabId,
    });
  }

  await clickKeywords(KW.data, { timeout: 8000 });
  const clicked = await clickKeywords(KW.deleteAll, { timeout: 12000 });
  if (!clicked) throw new Error("ChatGPT delete-all control not found");

  await confirmDialogs();
  return { deleted: "all", total: "all" };
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
      return { ...(await deleteAllDom(ctx)), method: "dom-settings", provider: "chatgpt" };
    }

    const result = await tryMethods(
      [
        {
          name: "api-individual",
          step: null,
          fn: () => deleteAllOneByOne(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
        },
        { name: "dom-settings", step: "settings-delete", fn: () => deleteAllDom(ctx) },
      ],
      ctx
    );

    return { ...result, provider: "chatgpt" };
  },
};
