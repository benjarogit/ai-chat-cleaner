import {
  confirmDialogs,
  countPerplexitySidebarChats,
  deletePerplexityViaSessionActions,
  findPerplexitySidebarChatLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const ORIGIN = "https://www.perplexity.ai";
const QUERY = "?version=2.18&source=default";

async function listThreadIds(fetchFn) {
  const response = await fetchFn(`${ORIGIN}/rest/thread/list_recent?limit=50`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);
  const list = await response.json();
  return list.map((t) => t.uuid).filter(Boolean);
}

async function getReadWriteToken(fetchFn, entryUuid) {
  const response = await fetchFn(`${ORIGIN}/rest/thread/${entryUuid}${QUERY}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`thread ${entryUuid} HTTP ${response.status}`);
  const data = await response.json();
  const token = data?.entries?.[0]?.read_write_token;
  if (!token) throw new Error(`read_write_token missing for ${entryUuid}`);
  return token;
}

async function assertPerplexityGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listThreadIds(fetchFn)).length;
  } catch {
    /* DOM only */
  }

  const domCount = countPerplexitySidebarChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`Perplexity threads still remain (${parts.join(", ")})`);
  }
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listThreadIds(fetchFn);
  if (!ids.length) {
    const domCount = countPerplexitySidebarChats();
    if (domCount > 0) throw new Error(`API listed 0 threads but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "thread",
    onProgress,
    deleteOne: async (id) => {
      const readWriteToken = await getReadWriteToken(fetchFn, id);
      const response = await fetchFn(
        `${ORIGIN}/rest/thread/delete_thread_by_entry_uuid${QUERY}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ entry_uuid: id, read_write_token: readWriteToken }),
        }
      );
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertPerplexityGone(fetchFn);
  return result;
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countPerplexitySidebarChats(), 1);
  if (!findPerplexitySidebarChatLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deletePerplexityViaSessionActions(onProgress);
  if (!deleted) throw new Error("No Perplexity Session actions → Delete controls found");

  await assertPerplexityGone(fetchFn);
  return { deleted, total: estimated };
}

export const perplexityProvider = {
  id: "perplexity",
  name: "Perplexity",
  match(url) {
    try {
      const h = new URL(url).hostname;
      return h === "www.perplexity.ai" || h === "perplexity.ai";
    } catch {
      return false;
    }
  },

  /** Live: api-individual → dom-sidebar (Session actions → Delete). */
  async getDeleteMethods(ctx) {
    const apiIds = await listThreadIds(ctx.fetchFn);
    const domCount = countPerplexitySidebarChats();

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
    await assertPerplexityGone(ctx.fetchFn);
  },
};
