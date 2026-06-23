import {
  clickEachTrash,
  clickKeywords,
  confirmDialogs,
  findAllByKeywords,
  findByKeywords,
  KW,
} from "../dom.js";
import { navigateTo } from "../navigate.js";
import { report, runDeleteLoop, sleep, tryMethods } from "../shared.js";

const BEARER =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const HISTORY_HASH = "9Hyh5D4-WXLnExZkONSkZg";

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

async function findDeleteQueryId() {
  const names = [
    "GrokConversationDelete",
    "DeleteGrokConversation",
    "GrokDeleteConversation",
    "GrokConversationRemove",
  ];

  for (const entry of performance.getEntriesByType("resource")) {
    for (const name of names) {
      if (!entry.name.includes(name)) continue;
      const match = entry.name.match(/graphql\/([^/]+)\//);
      if (match) return { hash: match[1], operationName: name };
    }
  }

  const scripts = document.querySelectorAll('script[src*="main"]');
  for (const script of scripts) {
    if (!script.src) continue;
    try {
      const text = await fetch(script.src).then((r) => r.text());
      for (const name of names) {
        const match = text.match(new RegExp(`queryId:"([^"]+)",operationName:"${name}"`));
        if (match) return { hash: match[1], operationName: name };
      }
    } catch {
      /* continue */
    }
  }
  return null;
}

async function gqlPost(hash, operationName, variables, fetchFn) {
  const url = `https://x.com/i/api/graphql/${hash}/${operationName}`;
  const response = await fetchFn(url, {
    method: "POST",
    headers: gqlHeaders(),
    credentials: "include",
    body: JSON.stringify({ variables, queryId: hash }),
  });
  if (!response.ok) throw new Error(`${operationName} HTTP ${response.status}`);
  return response.json();
}

async function listGrokConversationIds(fetchFn) {
  const all = [];
  let cursor = null;

  for (let page = 0; page < 30; page++) {
    const variables = cursor ? { cursor } : {};
    const json = await gqlGet(HISTORY_HASH, "GrokHistory", variables, fetchFn);
    const history = json?.data?.grok_conversation_history;
    const items = history?.items || [];
    if (!items.length) break;

    for (const item of items) {
      const id = item?.grokConversation?.rest_id;
      if (id) all.push(id);
    }

    if (!history?.cursor) break;
    cursor = history.cursor;
    await sleep(300);
  }

  return all;
}

function isGrokHistoryEmptyDom() {
  const text = document.body.innerText.toLowerCase();
  return EMPTY_HISTORY.some((phrase) => text.includes(phrase));
}

function countGrokHistoryDom() {
  if (isGrokHistoryEmptyDom()) return 0;
  return findAllByKeywords(KW.more).length;
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

async function deleteAllViaGraphql(fetchFn, onProgress, delayMs) {
  const op = await findDeleteQueryId();
  if (!op) throw new Error("Grok delete GraphQL operation not found in page bundles");

  const ids = await listGrokConversationIds(fetchFn);
  if (!ids.length) {
    await openHistoryPanel();
    if (countGrokHistoryDom() > 0) {
      throw new Error("API listed 0 Grok chats but history UI still has items");
    }
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "Grok chat",
    onProgress,
    deleteOne: async (id) => {
      const payloads = [{ restId: id }, { rest_id: id }, { conversationId: id }];
      let lastErr;
      for (const variables of payloads) {
        try {
          await gqlPost(op.hash, op.operationName, variables, fetchFn);
          return;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    },
  });

  await assertGrokGone(fetchFn);
  return result;
}

async function openHistoryPanel() {
  if (!location.pathname.startsWith("/i/grok")) {
    location.assign("https://x.com/i/grok");
    await sleep(2500);
  }

  const opened = await clickKeywords(KW.history, { timeout: 8000 });
  if (!opened) throw new Error("Grok history panel not found (Chatverlauf / Verlauf)");
  await sleep(700);
}

async function deleteHistoryDom(fetchFn, onProgress) {
  await openHistoryPanel();

  const estimated = Math.max(countGrokHistoryDom(), 1);
  let deleted = 0;

  for (let i = 0; i < 120; i++) {
    const mehr = findByKeywords(KW.more);
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
    const del = findByKeywords(KW.delete);
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
  const onGrokSettings =
    location.pathname.includes("/settings") && location.href.toLowerCase().includes("grok");

  if (!onGrokSettings && ctx.step !== "settings-delete") {
    await navigateTo("https://x.com/settings/privacy_and_safety", {
      providerId: "grok-x",
      step: "settings-delete",
      method: "dom-settings",
      tabId: ctx.tabId,
    });
  }

  await clickKeywords([...KW.grok, ...KW.data], { timeout: 12000 });
  const bulk = await clickKeywords(KW.deleteAll, { timeout: 12000 });
  if (!bulk) throw new Error("X Grok bulk-delete button not found in settings");

  await confirmDialogs();
  await assertGrokGone(ctx.fetchFn);
  return { deleted: "all", total: "all" };
}

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

  async deleteAll(ctx) {
    report(ctx.onProgress, { type: "status", message: "Grok on X: starting…", overall: 5 });

    if (ctx.step === "settings-delete") {
      return { ...(await deleteAllSettingsDom(ctx)), method: "dom-settings", provider: "grok-x" };
    }

    const result = await tryMethods(
      [
        {
          name: "api-graphql-individual",
          step: null,
          fn: () => deleteAllViaGraphql(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
        },
        {
          name: "dom-history",
          step: "dom-history",
          fn: () => deleteHistoryDom(ctx.fetchFn, ctx.onProgress),
        },
        { name: "dom-settings", step: "settings-delete", fn: () => deleteAllSettingsDom(ctx) },
      ],
      ctx
    );

    return { ...result, provider: "grok-x" };
  },
};
