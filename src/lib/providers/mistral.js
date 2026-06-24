import {
  confirmDialogs,
  countMistralSidebarChats,
  deleteMistralViaSidebar,
  findMistralSidebarChatLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

function mistralProductType() {
  return location.pathname.startsWith("/work") ? "work" : "chat";
}

function encodeTrpcInput(json) {
  return encodeURIComponent(JSON.stringify({ "0": { json } }));
}

function parseTrpcItems(data) {
  return data?.[0]?.result?.data?.json?.items || [];
}

async function listChatIds(fetchFn) {
  const input = encodeTrpcInput({
    chatVisibility: "private",
    chatPermission: "write",
    includeProjectChats: false,
    productType: mistralProductType(),
    direction: "forward",
    limit: 50,
  });

  const response = await fetchFn(`/api/trpc/chat.last?batch=1&input=${input}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  return parseTrpcItems(data).map((c) => c.id).filter(Boolean);
}

async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listChatIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countMistralSidebarChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`Mistral chats still remain (${parts.join(", ")})`);
  }
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listChatIds(fetchFn);
  if (!ids.length) {
    const domCount = countMistralSidebarChats();
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn("/api/trpc/chat.delete?batch=1", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ "0": { json: { id } } }),
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
      const data = await response.json();
      const err = data?.[0]?.error;
      if (err) throw new Error(err.message || `delete ${id} failed`);
    },
  });

  await assertGone(fetchFn);
  return result;
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countMistralSidebarChats(), 1);
  if (!findMistralSidebarChatLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deleteMistralViaSidebar(onProgress);
  if (!deleted) throw new Error("No Mistral sidebar delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

export const mistralProvider = {
  id: "mistral",
  name: "Mistral",
  match(url) {
    try {
      return new URL(url).hostname === "chat.mistral.ai";
    } catch {
      return false;
    }
  },

  /** Live: api-individual (tRPC) → dom-sidebar */
  async getDeleteMethods(ctx) {
    let apiIds = [];
    try {
      apiIds = await listChatIds(ctx.fetchFn);
    } catch {
      /* session */
    }
    const domCount = countMistralSidebarChats();

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
