import {
  clickEachTrash,
  clickKeywords,
  confirmDialogs,
  countGrokXHistoryItems,
  findGrokXHistoryMehr,
  findGrokXHistoryRoot,
  findGrokXSettingsDeleteButton,
  findOpenMenuDeleteItem,
  KW,
} from "../dom.js";
import { navigateTo } from "../navigate.js";
import { report, sleep } from "../shared.js";

const BEARER =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const GROK_SETTINGS_URL = "https://x.com/settings/grok_settings";

/** Fallback hashes from X webpack (see fa0311/TwitterInternalAPIDocument). */
const KNOWN_GROK_OPS = {
  GrokHistory: "9Hyh5D4-WXLnExZkONSkZg",
};

const EMPTY_HISTORY = [
  "kein chatverlauf",
  "no chat history",
  "no conversation history",
  "no grok history",
];

const FEATURES = {
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: false,
};

function csrf() {
  const match = document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/);
  if (!match) throw new Error("X CSRF token missing — log in to x.com");
  return decodeURIComponent(match[1]);
}

function gqlHeaders() {
  return {
    authorization: `Bearer ${decodeURIComponent(BEARER)}`,
    "x-csrf-token": csrf(),
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-active-user": "yes",
    "content-type": "application/json",
  };
}

async function gqlGet(hash, operationName, variables, fetchFn) {
  const params = new URLSearchParams({
    variables: JSON.stringify(variables),
    features: JSON.stringify(FEATURES),
  });
  const url = `https://x.com/i/api/graphql/${hash}/${operationName}?${params}`;
  const response = await fetchFn(url, {
    method: "GET",
    headers: gqlHeaders(),
    credentials: "include",
  });
  if (!response.ok) throw new Error(`${operationName} HTTP ${response.status}`);
  return response.json();
}

function scanWebpackForGrokOp(operationName) {
  const chunk = globalThis.webpackChunk_twitter_responsive_web;
  if (!chunk) return null;

  const re = new RegExp(`queryId:"([^"]+)",operationName:"${operationName}"`);
  for (const [, mods] of chunk) {
    for (const id of Object.keys(mods)) {
      const match = mods[id].toString().match(re);
      if (match) return { hash: match[1], operationName };
    }
  }
  return null;
}

async function findGrokGraphqlOp(operationName) {
  const known = KNOWN_GROK_OPS[operationName];
  if (known) return { hash: known, operationName };

  const fromWebpack = scanWebpackForGrokOp(operationName);
  if (fromWebpack) return fromWebpack;

  for (const entry of performance.getEntriesByType("resource")) {
    if (!entry.name.includes(operationName)) continue;
    const match = entry.name.match(/graphql\/([^/]+)\//);
    if (match) return { hash: match[1], operationName };
  }

  for (const script of document.querySelectorAll('script[src*="client-web"]')) {
    if (!script.src) continue;
    try {
      const text = await fetch(script.src).then((r) => r.text());
      const match = text.match(
        new RegExp(`queryId:"([^"]+)",operationName:"${operationName}"`)
      );
      if (match) return { hash: match[1], operationName };
    } catch {
      /* continue */
    }
  }
  return null;
}

async function listGrokConversationIds(fetchFn) {
  const historyOp = await findGrokGraphqlOp("GrokHistory");
  if (!historyOp) throw new Error("GrokHistory GraphQL operation not found");

  const ids = [];
  const seen = new Set();
  let cursor = null;

  for (let page = 0; page < 30; page++) {
    const variables = cursor ? { cursor } : {};
    const json = await gqlGet(historyOp.hash, "GrokHistory", variables, fetchFn);
    const history = json?.data?.grok_conversation_history;
    const items = history?.items || [];
    if (!items.length) break;

    for (const item of items) {
      const conversationId = item?.grokConversation?.rest_id;
      if (!conversationId || seen.has(conversationId)) continue;
      seen.add(conversationId);
      ids.push(conversationId);
    }

    if (!history?.cursor) break;
    cursor = history.cursor;
    await sleep(300);
  }

  return ids;
}

function isGrokHistoryEmptyDom() {
  const text = document.body.innerText.toLowerCase();
  return EMPTY_HISTORY.some((phrase) => text.includes(phrase));
}

/**
 * Live x.com/i/grok: count only history-panel "Mehr" rows (not nav "Mehr Menübefehle").
 * GrokHistory GraphQL returned 0 while DOM had 5 chats on test account.
 */
function countGrokHistoryDom() {
  if (isGrokHistoryEmptyDom()) return 0;
  return countGrokXHistoryItems();
}

async function assertGrokGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listGrokConversationIds(fetchFn)).length;
  } catch {
    /* GraphQL unavailable — rely on DOM */
  }

  const domCount = countGrokHistoryDom();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in history UI`);
  if (parts.length) {
    throw new Error(`Grok chats still remain (${parts.join(", ")})`);
  }
}

async function openHistoryPanel() {
  if (!location.pathname.startsWith("/i/grok")) {
    location.assign("https://x.com/i/grok");
    await sleep(2500);
  }

  if (findGrokXHistoryRoot()) return;

  const opened = await clickKeywords(KW.history, { timeout: 8000 });
  if (!opened && !findGrokXHistoryRoot()) {
    throw new Error("Grok history panel not found (Chatverlauf / Verlauf)");
  }
  await sleep(700);
}

async function deleteHistoryDom(fetchFn, onProgress) {
  await openHistoryPanel();

  const estimated = Math.max(countGrokHistoryDom(), 1);
  let deleted = 0;

  for (let i = 0; i < 120; i++) {
    const mehr = findGrokXHistoryMehr();
    if (!mehr) break;

    const overall = 10 + ((deleted + 1) / estimated) * 85;
    report(onProgress, {
      type: "status",
      message: `Deleting Grok chat ${deleted + 1}…`,
      overall: Math.min(overall, 95),
      current: 40,
    });

    mehr.click();
    await sleep(350);
    const del = findOpenMenuDeleteItem();
    if (!del) break;

    del.click();
    await sleep(250);
    await confirmDialogs();
    deleted++;

    report(onProgress, {
      type: "status",
      message: `Deleted ${deleted} Grok chat(s)…`,
      overall: Math.min(10 + (deleted / estimated) * 85, 95),
      current: 100,
    });
    await sleep(450);
  }

  if (!deleted) {
    deleted = await clickEachTrash({ max: 100, delayMs: 500 });
  }
  if (!deleted) throw new Error("No deletable Grok items in X history UI");

  await assertGrokGone(fetchFn);
  return { deleted, total: deleted };
}

async function deleteAllSettingsDom(ctx) {
  const onGrokSettings = location.pathname.includes("/settings/grok");

  if (!onGrokSettings && ctx.step !== "settings-delete") {
    await navigateTo(GROK_SETTINGS_URL, {
      providerId: "grok-x",
      step: "settings-delete",
      method: "dom-settings",
      tabId: ctx.tabId,
      methodIndex: ctx.methodIndex,
    });
  }

  await sleep(1500);

  const bulk = findGrokXSettingsDeleteButton();
  if (bulk) {
    bulk.click();
  } else if (!(await clickKeywords(KW.deleteAll, { timeout: 12000 }))) {
    throw new Error("X Grok bulk-delete button not found in settings");
  }

  await confirmDialogs();
  await assertGrokGone(ctx.fetchFn);
  return { deleted: "all", total: "all" };
}

/** ACC delete provider (public API). */

export const grokXProvider = {
  id: "grok-x",
  name: "Grok on X",
  match(url) {
    try {
      const u = new URL(url);
      return (
        u.hostname === "x.com" &&
        (u.pathname.startsWith("/i/grok") ||
          u.pathname.includes("/settings") ||
          u.pathname.includes("grok"))
      );
    } catch {
      return false;
    }
  },

  /** Best first: history panel ⋮ → settings bulk (DeleteGrokMessage is rate-limited on X). */
  async getDeleteMethods(ctx) {
    return [
      {
        name: "dom-history",
        step: "dom-history",
        fn: () => deleteHistoryDom(ctx.fetchFn, ctx.onProgress),
      },
      { name: "dom-settings", step: "settings-delete", fn: () => deleteAllSettingsDom(ctx) },
    ];
  },

  async verifyGone(ctx) {
    await openHistoryPanel();
    await assertGrokGone(ctx.fetchFn);
  },
};
