import { clickEachTrash, clickKeywords, confirmDialogs, KW } from "../dom.js";
import { assertRemaining, report, runDeleteLoop, sleep, tryMethods } from "../shared.js";

const ORIGIN = "https://claude.ai";

async function getOrganizationId(fetchFn) {
  const response = await fetchFn(`${ORIGIN}/api/organizations`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`organizations HTTP ${response.status}`);
  const data = await response.json();
  if (!data?.length) throw new Error("No organizations found");
  return data[0].uuid;
}

async function getChatIds(orgId, fetchFn) {
  const response = await fetchFn(
    `${ORIGIN}/api/organizations/${orgId}/chat_conversations`,
    { credentials: "include", headers: { Accept: "application/json" } }
  );
  if (!response.ok) throw new Error(`chat list HTTP ${response.status}`);
  const data = await response.json();
  return data.map((c) => c.uuid);
}

async function countChats(fetchFn) {
  try {
    const orgId = await getOrganizationId(fetchFn);
    return (await getChatIds(orgId, fetchFn)).length;
  } catch {
    return document.querySelectorAll('[data-testid="chat-item"], a[href*="/chat/"]').length;
  }
}

async function deleteAllApi(fetchFn, onProgress, delayMs) {
  const orgId = await getOrganizationId(fetchFn);
  const chatIds = await getChatIds(orgId, fetchFn);
  if (!chatIds.length) {
    const domCount = document.querySelectorAll(
      '[data-testid="chat-item"], a[href*="/chat/"]'
    ).length;
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids: chatIds,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: async (chatId) => {
      const response = await fetchFn(
        `${ORIGIN}/api/organizations/${orgId}/chat_conversations/${chatId}`,
        { method: "DELETE", credentials: "include", headers: { Accept: "application/json" } }
      );
      if (!response.ok) throw new Error(`delete ${chatId} HTTP ${response.status}`);
    },
  });

  await assertRemaining(() => countChats(fetchFn), 0, "Claude chats");
  return result;
}

async function deleteAllDom() {
  await clickKeywords(KW.history, { timeout: 5000 });
  await sleep(600);

  let deleted = await clickEachTrash({ max: 200, delayMs: 400 });
  if (!deleted) {
    deleted = await clickEachTrash({ max: 50, delayMs: 500 });
  }
  if (!deleted) throw new Error("No Claude delete controls in sidebar");
  return { deleted, total: deleted };
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

  async deleteAll(ctx) {
    report(ctx.onProgress, { type: "status", message: "Claude: starting…", overall: 5 });

    const result = await tryMethods(
      [
        { name: "api", step: null, fn: () => deleteAllApi(ctx.fetchFn, ctx.onProgress, ctx.delayMs) },
        { name: "dom-sidebar", step: "dom-sidebar", fn: deleteAllDom },
      ],
      ctx
    );

    return { ...result, provider: "claude" };
  },
};
