import {
  clickEachMoreDelete,
  countPoeSidebarChats,
  deletePoeViaSidebar,
  findPoeSidebarChatLinks,
} from "../dom.js";

async function assertGone(fetchFn) {
  const domCount = countPoeSidebarChats();
  if (domCount > 0) {
    throw new Error(`Poe chats still remain (${domCount} visible in sidebar)`);
  }
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countPoeSidebarChats(), 1);
  if (!findPoeSidebarChatLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deletePoeViaSidebar(onProgress);
  if (!deleted) deleted = await clickEachMoreDelete({ max: 100, delayMs: 450 });
  if (!deleted) throw new Error("No Poe sidebar delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

/** ACC delete provider (public API). */

export const poeProvider = {
  id: "poe",
  name: "Poe",
  match(url) {
    try {
      return new URL(url).hostname === "poe.com";
    } catch {
      return false;
    }
  },

  /** Live: dom-sidebar (GraphQL gql_POST — page context only). */
  async getDeleteMethods(ctx) {
    const domCount = countPoeSidebarChats();

    if (!domCount) {
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
