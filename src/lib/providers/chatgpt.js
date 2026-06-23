import { clickKeywords, confirmDialogs, KW } from "../dom.js";
import { navigateTo } from "../navigate.js";
import { report, runDeleteLoop, tryMethods } from "../shared.js";

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
      `${API}/conversations?offset=${offset}&limit=28&order=updated`,
      { credentials: "include", headers }
    );
    if (!response.ok) throw new Error(`list HTTP ${response.status}`);
    const data = await response.json();
    const page = data.items || [];
    if (!page.length) break;
    ids.push(...page.filter((c) => !c.is_archived).map((c) => c.id));
    offset += page.length;
    if (typeof data.total === "number" && offset >= data.total) break;
  }

  return ids;
}

async function deleteAllBulk(fetchFn) {
  const headers = await authHeaders(fetchFn);
  const response = await fetchFn(`${API}/conversations`, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify({ is_visible: false }),
  });
  if (!response.ok) throw new Error(`bulk delete HTTP ${response.status}`);
  return { deleted: "all", total: "all" };
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const headers = await authHeaders(fetchFn);
  const ids = await listConversationIds(fetchFn);
  if (!ids.length) return { deleted: 0, total: 0 };

  return runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${API}/conversations/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ is_visible: false }),
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });
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
        { name: "api-bulk", step: null, fn: () => deleteAllBulk(ctx.fetchFn) },
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
