import { clickByText, confirmDialogs } from "../dom.js";
import { report, runDeleteLoop, sleep, tryMethods } from "../shared.js";

const BEARER =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const HISTORY_HASH = "9Hyh5D4-WXLnExZkONSkZg";
const DELETE_OPS = [
  "GrokConversationDelete",
  "DeleteGrokConversation",
  "GrokDeleteConversation",
  "GrokConversationRemove",
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

async function findQueryId(operationName) {
  for (const entry of performance.getEntriesByType("resource")) {
    const match = entry.name.match(
      new RegExp(`/graphql/([^/]+)/${operationName}`)
    );
    if (match) return match[1];
  }

  const scripts = document.querySelectorAll('script[src*="main"], link[as="script"][href*="main"]');
  for (const el of scripts) {
    const src = el.src || el.href;
    if (!src) continue;
    try {
      const text = await fetch(src).then((r) => r.text());
      const match = text.match(
        new RegExp(`queryId:"([^"]+)",operationName:"${operationName}"`)
      );
      if (match) return match[1];
    } catch {
      /* continue */
    }
  }
  return null;
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

async function deleteGrokConversationId(id, fetchFn) {
  for (const op of DELETE_OPS) {
    const hash = await findQueryId(op);
    if (!hash) continue;
    try {
      await gqlPost(hash, op, { restId: id, conversationId: id }, fetchFn);
      return;
    } catch {
      try {
        await gqlPost(hash, op, { rest_id: id }, fetchFn);
        return;
      } catch {
        /* try next op */
      }
    }
  }
  throw new Error(`No delete API for conversation ${id}`);
}

async function deleteAllApi(fetchFn, onProgress, delayMs) {
  const ids = await listGrokConversationIds(fetchFn);
  if (!ids.length) return { deleted: 0, total: 0 };

  return runDeleteLoop({
    ids,
    delayMs,
    label: "Grok chat",
    onProgress,
    deleteOne: (id) => deleteGrokConversationId(id, fetchFn),
  });
}

async function deleteAllSettingsDom() {
  if (!location.pathname.includes("/settings")) {
    location.href = "https://x.com/settings/privacy_and_safety";
    await sleep(2500);
  }

  await clickByText(["grok", "third-party", "third party"]);
  const bulk = await clickByText([
    "delete conversation history",
    "delete all conversation",
    "conversation history löschen",
    "verlauf löschen",
  ]);

  if (!bulk) throw new Error("X Grok bulk-delete button not found in settings");

  await confirmDialogs();
  await confirmDialogs();
  return { deleted: "all", total: "all" };
}

async function deleteHistoryDom() {
  if (!location.pathname.startsWith("/i/grok")) {
    location.href = "https://x.com/i/grok";
    await sleep(2500);
  }

  await clickByText(["history", "verlauf"]);
  await sleep(800);

  let deleted = 0;
  for (let i = 0; i < 100; i++) {
    let clicked = await clickByText(["delete"], { timeout: 1500 });
    if (!clicked) {
      const btn = document.querySelector('button[aria-label*="Delete"], button[aria-label*="delete"]');
      if (btn) {
        btn.click();
        clicked = true;
      }
    }
    if (!clicked) break;
    await confirmDialogs();
    deleted++;
    await sleep(400);
  }

  if (!deleted) throw new Error("No deletable Grok items in X history UI");
  return { deleted, total: deleted };
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

    const result = await tryMethods(
      [
        { name: "api-graphql-bulk-settings", fn: deleteAllSettingsDom },
        { name: "api-graphql-individual", fn: () => deleteAllApi(ctx.fetchFn, ctx.onProgress, ctx.delayMs) },
        { name: "dom-history", fn: deleteHistoryDom },
      ],
      ctx
    );

    return { ...result, provider: "grok-x" };
  },
};
