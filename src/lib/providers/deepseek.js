import {
  countDeepseekSidebarChats,
  deleteDeepseekViaSidebar,
  findDeepseekSidebarChatLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const ORIGIN = "https://chat.deepseek.com";

function getToken() {
  try {
    return JSON.parse(localStorage.getItem("userToken") || "{}").value || null;
  } catch {
    return null;
  }
}

function authHeaders(token) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function listSessionIds(fetchFn) {
  const token = getToken();
  if (!token) throw new Error("DeepSeek userToken not found — reload and log in");

  const response = await fetchFn(`${ORIGIN}/api/v0/chat_session/fetch_page?count=50`, {
    credentials: "include",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  const chats = data?.data?.biz_data?.chat_sessions || [];
  return chats.map((c) => c.id).filter(Boolean);
}

async function assertDeepseekGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listSessionIds(fetchFn)).length;
  } catch {
    /* rely on DOM */
  }

  const domCount = countDeepseekSidebarChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`DeepSeek chats still remain (${parts.join(", ")})`);
  }
}

async function deleteAllBulk(fetchFn) {
  const token = getToken();
  if (!token) throw new Error("DeepSeek userToken not found");

  const before = await listSessionIds(fetchFn);
  if (!before.length) return { deleted: 0, total: 0 };

  const response = await fetchFn(`${ORIGIN}/api/v0/chat_session/delete_all`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(token),
    body: "{}",
  });
  if (!response.ok) throw new Error(`bulk delete HTTP ${response.status}`);

  await assertDeepseekGone(fetchFn);
  return { deleted: before.length, total: before.length };
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listSessionIds(fetchFn);
  if (!ids.length) {
    const domCount = countDeepseekSidebarChats();
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const token = getToken();
  if (!token) throw new Error("DeepSeek userToken not found");

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${ORIGIN}/api/v0/chat_session/delete`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(token),
        body: JSON.stringify({ chat_session_id: id }),
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertDeepseekGone(fetchFn);
  return result;
}

async function deleteAllViaDom(fetchFn, onProgress, delayMs) {
  const before = findDeepseekSidebarChatLinks().length;
  if (!before) return { deleted: 0, total: 0 };

  const deleted = await deleteDeepseekViaSidebar({ max: before + 5, delayMs });
  onProgress?.(`DOM: ${deleted}/${before} deleted`);
  if (deleted < before) {
    throw new Error(`DeepSeek DOM deleted ${deleted}/${before}`);
  }

  await assertDeepseekGone(fetchFn);
  return { deleted, total: before };
}

/** ACC delete provider (public API). */

export const deepseekProvider = {
  id: "deepseek",
  name: "DeepSeek",
  match(url) {
    try {
      return new URL(url).hostname === "chat.deepseek.com";
    } catch {
      return false;
    }
  },

  /** Live: api-bulk → api-individual → dom-sidebar. */
  async getDeleteMethods(ctx) {
    const apiIds = await listSessionIds(ctx.fetchFn);
    const domCount = countDeepseekSidebarChats();

    if (!apiIds.length && !domCount) {
      return [{ name: "noop", step: null, fn: () => ({ deleted: 0, total: 0 }) }];
    }

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
        name: "dom-sidebar",
        step: null,
        fn: () => deleteAllViaDom(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
      });
    }
    return methods;
  },

  async verifyGone(ctx) {
    await assertDeepseekGone(ctx.fetchFn);
  },
};
