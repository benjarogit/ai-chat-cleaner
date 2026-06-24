import {
  clickClaudeOverflowDeletes,
  claudeRecentsSelectAll,
  confirmDialogs,
  countUniqueChatLinks,
  enterClaudeRecentsSelectMode,
  findClaudeRecentsBulkDelete,
  isClaudeRecentsSelectMode,
} from "../dom.js";
import { navigateTo } from "../navigate.js";
import { report, runDeleteLoop, sleep } from "../shared.js";

const ORIGIN = "https://claude.ai";

function parseChatList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.conversations)) return data.conversations;
  return [];
}

async function getOrganizations(fetchFn) {
  const response = await fetchFn(`${ORIGIN}/api/organizations`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`organizations HTTP ${response.status}`);
  const data = await response.json();
  if (!data?.length) throw new Error("No organizations found");
  return data;
}

async function getChatIdsForOrg(orgId, fetchFn) {
  const response = await fetchFn(
    `${ORIGIN}/api/organizations/${orgId}/chat_conversations`,
    { credentials: "include", headers: { Accept: "application/json" } }
  );
  if (!response.ok) throw new Error(`chat list HTTP ${response.status}`);
  return parseChatList(await response.json()).map((c) => c.uuid).filter(Boolean);
}

/** All chats across orgs the user can access. */
async function getAllChatsWithOrg(fetchFn) {
  const orgs = await getOrganizations(fetchFn);
  const chats = [];

  for (const org of orgs) {
    try {
      const ids = await getChatIdsForOrg(org.uuid, fetchFn);
      for (const chatId of ids) {
        chats.push({ orgId: org.uuid, chatId });
      }
    } catch {
      /* org without chat permission — skip */
    }
  }

  return chats;
}

async function countApiChats(fetchFn) {
  const chats = await getAllChatsWithOrg(fetchFn);
  return chats.length;
}

/** Live claude.ai/recents: /chat/{uuid} links; API can lag behind DOM (3 DOM vs 2 API on test). */
async function assertAllGone(fetchFn) {
  const apiCount = await countApiChats(fetchFn);
  const domCount = countUniqueChatLinks();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in UI`);
  if (parts.length) {
    throw new Error(`Claude chats still remain (${parts.join(", ")})`);
  }
}

async function deleteAllApi(fetchFn, onProgress, delayMs) {
  const chats = await getAllChatsWithOrg(fetchFn);
  if (!chats.length) {
    const domCount = countUniqueChatLinks();
    if (domCount > 0) {
      throw new Error(`API listed 0 chats but ${domCount} visible in UI`);
    }
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids: chats,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: async ({ orgId, chatId }) => {
      const response = await fetchFn(
        `${ORIGIN}/api/organizations/${orgId}/chat_conversations/${chatId}`,
        { method: "DELETE", credentials: "include", headers: { Accept: "application/json" } }
      );
      if (!response.ok && response.status !== 204) {
        throw new Error(`delete ${chatId} HTTP ${response.status}`);
      }
      const remaining = await getChatIdsForOrg(orgId, fetchFn);
      if (remaining.includes(chatId)) {
        throw new Error(`chat ${chatId} still in API after DELETE`);
      }
    },
  });

  await assertAllGone(fetchFn);
  return result;
}

async function deleteRecentsBulk(ctx) {
  if (!location.pathname.startsWith("/recents")) {
    await navigateTo(`${ORIGIN}/recents`, {
      providerId: "claude",
      step: "dom-recents",
      method: "dom-recents",
      tabId: ctx.tabId,
      methodIndex: ctx.methodIndex,
    });
  }

  await sleep(800);

  if (!isClaudeRecentsSelectMode()) {
    const started = await enterClaudeRecentsSelectMode();
    if (!started) throw new Error("Recents select-mode entry not found");
    await sleep(400);
  }

  const selectAll = await claudeRecentsSelectAll();
  if (!selectAll) throw new Error("Recents select-all not found");
  await sleep(400);

  const deleteBtn = findClaudeRecentsBulkDelete();
  if (!deleteBtn) throw new Error("Recents bulk delete button not found");
  deleteBtn.click();
  await sleep(500);
  await confirmDialogs();
  await sleep(1200);

  await assertAllGone(ctx.fetchFn);
  return { deleted: "all", total: "all" };
}

async function deleteViaOverflow(ctx) {
  const before = countUniqueChatLinks();
  if (!before) return { deleted: 0, total: 0 };

  const deleted = await clickClaudeOverflowDeletes({ max: before + 10, delayMs: 450 });
  if (!deleted) throw new Error("No Claude ⋮→Löschen menus found");

  await assertAllGone(ctx.fetchFn);
  return { deleted, total: before };
}

export const claudeProvider = {
  id: "claude",
  name: "Claude",
  match(url) {
    try {
      return new URL(url).hostname === "claude.ai";
    } catch {
      return false;
    }
  },

  /** Best first: recents bulk → API → overflow menus */
  async getDeleteMethods(ctx) {
    return [
      { name: "dom-recents", step: "dom-recents", fn: () => deleteRecentsBulk(ctx) },
      { name: "api", step: null, fn: () => deleteAllApi(ctx.fetchFn, ctx.onProgress, ctx.delayMs) },
      { name: "dom-overflow", step: "dom-overflow", fn: () => deleteViaOverflow(ctx) },
    ];
  },

  async verifyGone(ctx) {
    await assertAllGone(ctx.fetchFn);
  },
};
