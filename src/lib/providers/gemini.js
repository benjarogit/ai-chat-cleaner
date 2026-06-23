import {
  clickKeywords,
  confirmDialogs,
  countGeminiSidebarChats,
  countMyActivityItems,
  findGeminiSidebarChatLinks,
  findGeminiSidebarOverflowButtons,
  findMyActivityBulkDeleteDropdown,
  findMyActivityConfirmDelete,
  findMyActivityItemDeleteButton,
  findOpenMenuDeleteItem,
  pickMyActivityDeleteRange,
  waitFor,
} from "../dom.js";
import { geminiBatchInPage } from "../gemini-page.js";
import { navigateTo } from "../navigate.js";
import { report, runDeleteLoop, sleep, tryMethods } from "../shared.js";

const GEMINI_ORIGIN = "https://gemini.google.com";
const MYACTIVITY_URL = "https://myactivity.google.com/product/gemini?utm_source=gemini";

function normalizeGeminiId(id) {
  if (!id) return null;
  return id.startsWith("c_") ? id : `c_${id}`;
}

function extractChatIdsFromBatch(data) {
  const ids = new Set();
  const walk = (node) => {
    if (typeof node === "string") {
      if (/^c_[a-zA-Z0-9_-]+$/.test(node)) ids.add(node);
      else if (/^[a-f0-9]{12,}$/i.test(node)) ids.add(`c_${node}`);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === "object") {
      Object.values(node).forEach(walk);
    }
  };
  try {
    walk(JSON.parse(data?.[0]?.[2] || "[]"));
  } catch {
    walk(data);
  }
  return [...ids];
}

function listChatIdsFromDom() {
  const ids = new Set();
  for (const a of document.querySelectorAll('a[href*="/app/"]')) {
    const match = a.href.match(/\/app\/([a-zA-Z0-9_-]+)/);
    if (!match) continue;
    const raw = match[1];
    if (/signout|options|search/i.test(raw)) continue;
    if (!/^[a-z0-9_]{8,}$/i.test(raw)) continue;
    const normalized = normalizeGeminiId(raw);
    if (normalized) ids.add(normalized);
  }
  return [...ids];
}

async function assertGeminiGone() {
  let apiCount = null;
  try {
    if (location.hostname === "gemini.google.com") {
      apiCount = (await listChatIds()).length;
    }
  } catch {
    /* batchexecute unavailable */
  }

  const domCount = Math.max(listChatIdsFromDom().length, countGeminiSidebarChats());
  const activityCount =
    location.hostname === "myactivity.google.com" ? countMyActivityItems() : null;

  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (activityCount > 0) parts.push(`${activityCount} in My Activity`);
  if (parts.length) {
    throw new Error(`Gemini chats still remain (${parts.join(", ")})`);
  }
}

async function goToGeminiForVerify() {
  if (location.hostname !== "gemini.google.com") {
    location.assign(`${GEMINI_ORIGIN}/app`);
    await sleep(2500);
  }
}

async function deleteChatId(cid) {
  const id = normalizeGeminiId(cid);
  await geminiBatchInPage("GzXR5e", [id]);
  try {
    await geminiBatchInPage("GzXR5e", [id, [1, null, 0, 1]]);
  } catch {
    /* optional second RPC */
  }
}

async function deleteAllApi(onProgress, delayMs) {
  const ids = await listChatIds();
  if (!ids.length) {
    const domCount = Math.max(listChatIdsFromDom().length, countGeminiSidebarChats());
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: (id) => deleteChatId(id),
  });

  await assertGeminiGone();
  return result;
}

async function listChatIds() {
  const withTimeout = (promise, ms = 12000) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini API timeout")), ms)),
    ]);

  const payloads = [100, 50, 25];
  for (const size of payloads) {
    try {
      const data = await withTimeout(geminiBatchInPage("MaZiqc", [size]));
      const fromApi = extractChatIdsFromBatch(data);
      if (fromApi.length) return fromApi;
    } catch {
      /* try next payload */
    }
  }
  return listChatIdsFromDom();
}

async function openSidebarOverflowForLink(link) {
  const row =
    link.closest('[role="listitem"]') ||
    link.closest("li") ||
    link.parentElement?.parentElement ||
    link.parentElement;
  for (const el of [row, link]) {
    el?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    el?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  }
  await sleep(250);

  const inRow = row
    ? [...row.querySelectorAll("button")].filter((b) => {
        const aria = b.getAttribute("aria-label") || "";
        return /(?:more|weitere)\s+options?\s+(?:for|für)\s+/i.test(aria);
      })
    : [];

  if (inRow.length) return inRow[0];

  const menus = findGeminiSidebarOverflowButtons();
  return menus[0] ?? null;
}

async function deleteSidebarMenus(onProgress) {
  const estimated = Math.max(countGeminiSidebarChats(), listChatIdsFromDom().length, 1);
  let deleted = 0;

  for (let i = 0; i < 150; i++) {
    const links = findGeminiSidebarChatLinks();
    if (!links.length) break;

    report(onProgress, {
      type: "status",
      message: `Deleting chat ${deleted + 1} via sidebar menu…`,
      overall: Math.min(10 + ((deleted + 1) / estimated) * 85, 95),
      current: 40,
    });

    let menu = await openSidebarOverflowForLink(links[0]);
    if (!menu) {
      links[0].click();
      await sleep(900);
      menu = findGeminiSidebarOverflowButtons()[0] ?? null;
    }
    if (!menu) break;

    menu.click();
    await sleep(400);
    const del = findOpenMenuDeleteItem();
    if (!del) break;

    del.click();
    await sleep(300);
    await confirmDialogs();
    deleted++;

    report(onProgress, {
      type: "status",
      message: `Deleted ${deleted} via sidebar menu`,
      overall: Math.min(10 + (deleted / estimated) * 85, 95),
      current: 100,
    });
    await sleep(450);
  }

  if (!deleted) throw new Error("No Gemini sidebar delete menus found");
  return { deleted, total: deleted };
}

async function confirmMyActivityModal() {
  await sleep(700);
  const confirmBtn = findMyActivityConfirmDelete();
  if (confirmBtn) {
    confirmBtn.click();
    return true;
  }
  return clickKeywords(
    ["löschen", "delete", "supprimer", "eliminar", "confirm", "bestätigen"],
    { timeout: 8000 }
  );
}

async function deleteMyActivityDom(ctx) {
  const onMyActivity =
    location.hostname === "myactivity.google.com" && location.pathname.includes("/product/gemini");

  if (!onMyActivity && ctx.step !== "myactivity-delete") {
    report(ctx.onProgress, {
      type: "status",
      message: "Gemini: opening My Activity…",
      overall: 15,
    });
    await navigateTo(MYACTIVITY_URL, {
      providerId: "gemini",
      step: "myactivity-delete",
      method: "dom-myactivity",
      tabId: ctx.tabId,
    });
  }

  const ready = await waitFor(() => !!findMyActivityBulkDeleteDropdown(), {
    timeout: 20000,
    interval: 500,
  });
  if (!ready) throw new Error("My Activity bulk delete dropdown not found");

  const deleteDropdown = findMyActivityBulkDeleteDropdown();
  deleteDropdown.click();
  await sleep(700);

  const picked = await pickMyActivityDeleteRange();

  if (!picked) {
    const before = countMyActivityItems();
    if (!before) return { deleted: 0, total: 0 };
    for (let i = 0; i < before + 5; i++) {
      const itemBtn = findMyActivityItemDeleteButton();
      if (!itemBtn) break;
      itemBtn.click();
      await sleep(400);
      await confirmMyActivityModal();
      await sleep(500);
    }
    if (countMyActivityItems() > 0) {
      throw new Error("My Activity individual delete did not clear all items");
    }
    await goToGeminiForVerify();
    await assertGeminiGone();
    return { deleted: before, total: before };
  }

  await sleep(900);
  const confirmed = await confirmMyActivityModal();
  if (!confirmed) throw new Error("My Activity delete confirmation not found");

  await waitFor(() => countMyActivityItems() === 0, { timeout: 30000, interval: 1000 });
  await sleep(1000);
  await goToGeminiForVerify();
  await sleep(2000);

  try {
    await assertGeminiGone();
  } catch {
    await sleep(3000);
    await assertGeminiGone();
  }

  return { deleted: "all", total: "all" };
}

function geminiHasSidebarTargets() {
  return (
    countGeminiSidebarChats() > 0 ||
    listChatIdsFromDom().length > 0 ||
    findGeminiSidebarOverflowButtons().length > 0
  );
}

function buildGeminiMethods(ctx) {
  const onGemini = location.hostname === "gemini.google.com";
  const onMyActivity =
    location.hostname === "myactivity.google.com" && location.pathname.includes("/product/gemini");

  if (ctx.step === "myactivity-delete" || onMyActivity) {
    return [
      { name: "dom-myactivity", step: "myactivity-delete", fn: () => deleteMyActivityDom(ctx) },
    ];
  }

  const methods = [];

  if (onGemini && geminiHasSidebarTargets()) {
    methods.push({
      name: "dom-sidebar",
      step: null,
      fn: async () => {
        const r = await deleteSidebarMenus(ctx.onProgress);
        await assertGeminiGone();
        return r;
      },
    });
  }

  methods.push({
    name: "api-batchexecute",
    step: null,
    fn: () => {
      report(ctx.onProgress, {
        type: "status",
        message: "Gemini: deleting via API…",
        overall: 12,
      });
      return deleteAllApi(ctx.onProgress, ctx.delayMs);
    },
  });

  methods.push({
    name: "dom-myactivity",
    step: "myactivity-delete",
    fn: () => deleteMyActivityDom(ctx),
  });

  return methods;
}

export const geminiProvider = {
  id: "gemini",
  name: "Gemini",
  match(url) {
    try {
      const u = new URL(url);
      if (u.hostname === "gemini.google.com") return true;
      return u.hostname === "myactivity.google.com" && u.pathname.includes("/product/gemini");
    } catch {
      return false;
    }
  },

  async deleteAll(ctx) {
    report(ctx.onProgress, { type: "status", message: "Gemini: starting…", overall: 5 });

    if (ctx.step === "myactivity-delete") {
      return { ...(await deleteMyActivityDom(ctx)), method: "dom-myactivity", provider: "gemini" };
    }

    const result = await tryMethods(buildGeminiMethods(ctx), ctx);

    return { ...result, provider: "gemini" };
  },

  async verifyGone(ctx) {
    if (location.hostname === "myactivity.google.com") {
      const activityCount = countMyActivityItems();
      if (activityCount > 0) {
        throw new Error(`${activityCount} Gemini items still remain in My Activity`);
      }
    }
    if (location.hostname !== "gemini.google.com") {
      location.assign(`${GEMINI_ORIGIN}/app`);
      await sleep(2500);
    }
    await assertGeminiGone();
  },
};
