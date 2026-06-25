import {
  countCopilotGithubSidebarChats,
  deleteCopilotGithubViaManageChat,
  findCopilotGithubChatLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const DEFAULT_API = "https://api.individual.githubcopilot.com";

function getCopilotConfig() {
  const hit = [...document.querySelectorAll("script")]
    .map((s) => s.textContent)
    .find((t) => t && t.includes("apiURL"));
  return {
    apiURL: hit?.match(/"apiURL":"([^"]+)"/)?.[1] || DEFAULT_API,
    apiVersion: hit?.match(/"apiVersion":"([^"]+)"/)?.[1] || null,
  };
}

function getCopilotToken() {
  try {
    return JSON.parse(localStorage.getItem("COPILOT_AUTH_TOKEN") || "{}").value || null;
  } catch {
    return null;
  }
}

function copilotHeaders(token, apiVersion) {
  const version = apiVersion || "2025-05-01";
  return {
    Accept: "application/json",
    Authorization: `GitHub-Bearer ${token}`,
    "copilot-integration-id": "copilot-chat",
    "x-github-api-version": version,
  };
}

function chatApiBase() {
  const { apiURL } = getCopilotConfig();
  return `${apiURL}/github/chat`;
}

async function listThreadIds(fetchFn) {
  const token = getCopilotToken();
  if (!token) throw new Error("COPILOT_AUTH_TOKEN not found — open github.com/copilot");

  const { apiVersion } = getCopilotConfig();
  const response = await fetchFn(`${chatApiBase()}/threads?`, {
    credentials: "include",
    headers: copilotHeaders(token, apiVersion),
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  return (data.threads || []).map((t) => t.id).filter(Boolean);
}

async function assertCopilotGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listThreadIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countCopilotGithubSidebarChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`GitHub Copilot chats still remain (${parts.join(", ")})`);
  }
}

async function deleteAllBulk(fetchFn) {
  const ids = await listThreadIds(fetchFn);
  if (!ids.length) return { deleted: 0, total: 0 };

  const token = getCopilotToken();
  const { apiVersion } = getCopilotConfig();
  const response = await fetchFn(`${chatApiBase()}/threads`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...copilotHeaders(token, apiVersion),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ threadIDs: ids }),
  });
  if (!response.ok) throw new Error(`bulk delete HTTP ${response.status}`);

  await assertCopilotGone(fetchFn);
  return { deleted: ids.length, total: ids.length };
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listThreadIds(fetchFn);
  if (!ids.length) {
    const domCount = countCopilotGithubSidebarChats();
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const token = getCopilotToken();
  const { apiVersion } = getCopilotConfig();

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${chatApiBase()}/threads/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: copilotHeaders(token, apiVersion),
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertCopilotGone(fetchFn);
  return result;
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countCopilotGithubSidebarChats(), 1);
  if (!findCopilotGithubChatLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deleteCopilotGithubViaManageChat(onProgress);
  if (!deleted) throw new Error("No GitHub Copilot Manage chat → Delete controls found");

  await assertCopilotGone(fetchFn);
  return { deleted, total: estimated };
}

/** ACC delete provider (public API). */

export const copilotGithubProvider = {
  id: "copilot-github",
  name: "GitHub Copilot",
  match(url) {
    try {
      const u = new URL(url);
      return u.hostname === "github.com" && u.pathname.startsWith("/copilot");
    } catch {
      return false;
    }
  },

  /** Live: api-bulk → api-individual → dom-sidebar (Manage chat → Delete). */
  async getDeleteMethods(ctx) {
    let apiIds = [];
    try {
      apiIds = await listThreadIds(ctx.fetchFn);
    } catch {
      /* token/API unavailable — DOM */
    }
    const domCount = countCopilotGithubSidebarChats();

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
        fn: () => deleteSidebarDom(ctx.fetchFn, ctx.onProgress),
      });
    }
    return methods;
  },

  async verifyGone(ctx) {
    await assertCopilotGone(ctx.fetchFn);
  },
};
