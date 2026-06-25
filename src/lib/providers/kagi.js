import {
  countKagiSidebarChats,
  deleteKagiViaSidebar,
  findKagiSidebarChatLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

async function listConversationIds(fetchFn) {
  const response = await fetchFn("/api/conversations", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  return (data.items || []).map((c) => c.uuid || c.id).filter(Boolean);
}

async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listConversationIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countKagiSidebarChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`Kagi threads still remain (${parts.join(", ")})`);
  }
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listConversationIds(fetchFn);
  if (!ids.length) {
    const domCount = countKagiSidebarChats();
    if (domCount > 0) throw new Error(`API listed 0 threads but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "thread",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`/api/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertGone(fetchFn);
  return result;
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countKagiSidebarChats(), 1);
  if (!findKagiSidebarChatLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deleteKagiViaSidebar(onProgress);
  if (!deleted) throw new Error("No Kagi sidebar More options → Delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

/** ACC delete provider (public API). */

export const kagiProvider = {
  id: "kagi",
  name: "Kagi Assistant",
  match(url) {
    try {
      return new URL(url).hostname === "assistant.kagi.com";
    } catch {
      return false;
    }
  },

  /** Live: api-individual → dom-sidebar */
  async getDeleteMethods(ctx) {
    let apiIds = [];
    try {
      apiIds = await listConversationIds(ctx.fetchFn);
    } catch {
      /* session */
    }
    const domCount = countKagiSidebarChats();

    if (!apiIds.length && !domCount) {
      return [{ name: "noop", step: null, fn: () => ({ deleted: 0, total: 0 }) }];
    }

    const methods = [];
    if (apiIds.length > 0) {
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
        fn: () => deleteSidebarDom(ctx.fetchFn, ctx.onProgress),
      });
    }
    return methods;
  },

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
