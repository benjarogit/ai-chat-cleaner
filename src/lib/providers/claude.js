import { report, runDeleteLoop, sleep } from "../shared.js";

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

  async deleteAll({ onProgress, delayMs, fetchFn = fetch }) {
    report(onProgress, { type: "status", message: "Claude: fetching chats…", overall: 5 });

    const orgId = await getOrganizationId(fetchFn);
    const chatIds = await getChatIds(orgId, fetchFn);

    if (chatIds.length === 0) {
      return { deleted: 0, total: 0, provider: "claude" };
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
        if (delayMs > 0) await sleep(0);
      },
    });

    return { ...result, provider: "claude", method: "api" };
  },
};
