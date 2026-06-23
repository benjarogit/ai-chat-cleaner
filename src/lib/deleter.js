/**
 * Core Claude.ai bulk-delete logic — no browser extension APIs.
 * Used by content script and console/bookmarklet builds.
 */
export const CLAUDE_ORIGIN = "https://claude.ai";

export function isClaudeUrl(url) {
  try {
    return new URL(url).origin === CLAUDE_ORIGIN;
  } catch {
    return false;
  }
}

export async function getOrganizationId(fetchFn = fetch) {
  const response = await fetchFn(`${CLAUDE_ORIGIN}/api/organizations`, {
    method: "GET",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch organization ID (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("No organizations found");
  }

  return data[0].uuid;
}

export async function getChatIds(orgId, fetchFn = fetch) {
  const response = await fetchFn(
    `${CLAUDE_ORIGIN}/api/organizations/${orgId}/chat_conversations`,
    {
      method: "GET",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch chat list (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.map((chat) => chat.uuid);
}

export async function deleteChat(orgId, chatId, fetchFn = fetch) {
  const response = await fetchFn(
    `${CLAUDE_ORIGIN}/api/organizations/${orgId}/chat_conversations/${chatId}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete chat ${chatId} (HTTP ${response.status})`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} options
 * @param {(event: object) => void} [options.onProgress]
 * @param {number} [options.delayMs] - pause between deletes (rate limiting)
 * @param {typeof fetch} [options.fetchFn]
 */
export async function deleteAllChats({ onProgress, delayMs = 300, fetchFn = fetch } = {}) {
  const report = (payload) => onProgress?.(payload);

  report({ type: "status", message: "Initializing…", overall: 0 });

  const orgId = await getOrganizationId(fetchFn);
  report({ type: "status", message: "Fetching chat list…", overall: 10 });

  const chatIds = await getChatIds(orgId, fetchFn);

  if (chatIds.length === 0) {
    report({ type: "complete", message: "No chats found.", overall: 100, deleted: 0 });
    return { deleted: 0, total: 0 };
  }

  report({
    type: "status",
    message: `Found ${chatIds.length} chat(s). Deleting…`,
    overall: 10,
    total: chatIds.length,
    deleted: 0,
  });

  for (let i = 0; i < chatIds.length; i++) {
    const chatId = chatIds[i];
    const overall = 10 + ((i + 1) / chatIds.length) * 90;

    report({
      type: "status",
      message: `Deleting ${i + 1} of ${chatIds.length}…`,
      overall,
      current: 50,
      chatId,
      index: i + 1,
      total: chatIds.length,
      deleted: i,
    });

    await deleteChat(orgId, chatId, fetchFn);

    report({
      type: "status",
      message: `Deleted ${i + 1} of ${chatIds.length}`,
      overall,
      current: 100,
      chatId,
      index: i + 1,
      total: chatIds.length,
      deleted: i + 1,
    });

    if (delayMs > 0 && i < chatIds.length - 1) {
      await sleep(delayMs);
    }
  }

  report({
    type: "complete",
    message: `All ${chatIds.length} chat(s) deleted.`,
    overall: 100,
    deleted: chatIds.length,
    total: chatIds.length,
  });

  return { deleted: chatIds.length, total: chatIds.length };
}
