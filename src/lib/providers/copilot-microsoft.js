import {
  confirmDialogs,
  countCopilotMicrosoftSidebarChats,
  deleteCopilotMicrosoftViaSidebar,
  findCopilotMicrosoftChatLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const API = "https://copilot.microsoft.com/c/api/conversations";

async function listConversationIds(fetchFn) {
  const response = await fetchFn(`${API}?types=chat,character,xbox,group`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  return (data.results || []).map((c) => c.id).filter(Boolean);
}

async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listConversationIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countCopilotMicrosoftSidebarChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`Microsoft Copilot chats still remain (${parts.join(", ")})`);
  }
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listConversationIds(fetchFn);
  if (!ids.length) {
    const domCount = countCopilotMicrosoftSidebarChats();
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

  await assertGone(fetchFn);
  return result;
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countCopilotMicrosoftSidebarChats(), 1);
  if (!findCopilotMicrosoftChatLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deleteCopilotMicrosoftViaSidebar(onProgress);
  if (!deleted) throw new Error("No Microsoft Copilot sidebar delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

export const copilotMicrosoftProvider = {
  id: "copilot-microsoft",
  name: "Microsoft Copilot",
  match(url) {
    try {
      return new URL(url).hostname === "copilot.microsoft.com";
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
      /* cookie session unavailable */
    }
    const domCount = countCopilotMicrosoftSidebarChats();

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
