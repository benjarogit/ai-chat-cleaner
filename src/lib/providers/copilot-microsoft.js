import {
  countCopilotMicrosoftSidebarChats,
  deleteCopilotMicrosoftViaSidebar,
  findCopilotMicrosoftChatLinks,
} from "../dom.js";

async function assertGone() {
  const domCount = countCopilotMicrosoftSidebarChats();
  if (domCount > 0) {
    throw new Error(`Microsoft Copilot chats still remain (${domCount} visible in sidebar)`);
  }
}

async function deleteSidebarDom(onProgress) {
  const estimated = Math.max(countCopilotMicrosoftSidebarChats(), 1);
  if (!findCopilotMicrosoftChatLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deleteCopilotMicrosoftViaSidebar(onProgress);
  if (!deleted) throw new Error("No Microsoft Copilot sidebar delete controls found");

  await assertGone();
  return { deleted, total: estimated };
}

/** ACC delete provider (public API). */

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

  /** Live: dom-sidebar only (conversations API lists nothing / DELETE 404 on current UI) */
  async getDeleteMethods(ctx) {
    const domCount = countCopilotMicrosoftSidebarChats();

    if (!domCount) {
      return [{ name: "noop", step: null, fn: () => ({ deleted: 0, total: 0 }) }];
    }

    return [
      {
        name: "dom-sidebar",
        step: null,
        fn: () => deleteSidebarDom(ctx.onProgress),
      },
    ];
  },

  async verifyGone() {
    await assertGone();
  },
};
