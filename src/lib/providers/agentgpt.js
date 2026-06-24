import {
  clickEachMoreDelete,
  clickEachTrash,
  confirmDialogs,
  countAgentGptSidebarItems,
  deleteAgentGptViaSidebar,
  findAgentGptSidebarLinks,
} from "../dom.js";

function encodeTrpcInput(json) {
  return encodeURIComponent(JSON.stringify({ "0": { json } }));
}

async function listAgentIds(fetchFn) {
  const input = encodeTrpcInput(null);
  const response = await fetchFn(`/api/trpc/agent.getAll?batch=1&input=${input}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  const agents = data?.[0]?.result?.data?.json || [];
  return agents.map((a) => a.id).filter(Boolean);
}

async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listAgentIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countAgentGptSidebarItems();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`AgentGPT runs still remain (${parts.join(", ")})`);
  }
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countAgentGptSidebarItems(), 1);
  if (!findAgentGptSidebarLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deleteAgentGptViaSidebar(onProgress);
  if (!deleted) deleted = await clickEachTrash({ max: 80, delayMs: 450 });
  if (!deleted) deleted = await clickEachMoreDelete({ max: 80, delayMs: 450 });
  if (!deleted) throw new Error("No AgentGPT delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

export const agentGptProvider = {
  id: "agentgpt",
  name: "AgentGPT",
  match(url) {
    try {
      return new URL(url).hostname === "agentgpt.reworkd.ai";
    } catch {
      return false;
    }
  },

  /** Live: dom-sidebar (no confirmed delete tRPC — DOM primary). */
  async getDeleteMethods(ctx) {
    let apiIds = [];
    try {
      apiIds = await listAgentIds(ctx.fetchFn);
    } catch {
      /* session */
    }
    const domCount = countAgentGptSidebarItems();

    if (!apiIds.length && !domCount) {
      return [{ name: "noop", step: null, fn: () => ({ deleted: 0, total: 0 }) }];
    }

    return [
      {
        name: "dom-sidebar",
        step: null,
        fn: () => deleteSidebarDom(ctx.fetchFn, ctx.onProgress),
      },
    ];
  },

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
