import { clickAllMatching, clickByText, confirmDialogs } from "../dom.js";
import { report, runDeleteLoop, tryMethods } from "../shared.js";

const ORIGIN = "https://gemini.google.com";
const BATCH_URL = `${ORIGIN}/_/BardChatUi/data/batchexecute`;

function getWiz() {
  const wiz = globalThis.WIZ_global_data;
  if (!wiz?.SNlM0e) throw new Error("Gemini session tokens not found — reload page");
  return {
    at: wiz.SNlM0e,
    bl: wiz.cfb2h || "",
    sid: String(wiz.FdrFJe || ""),
  };
}

function parseBatchText(text) {
  for (const line of text.split("\n")) {
    if (!line.startsWith("[")) continue;
    try {
      return JSON.parse(line);
    } catch {
      /* next */
    }
  }
  throw new Error("Invalid Gemini batch response");
}

async function batchExecute(rpcid, payloadArray, fetchFn) {
  const { at, bl, sid } = getWiz();
  const reqId = Math.floor(Math.random() * 900000) + 100000;
  const url =
    `${BATCH_URL}?rpcids=${encodeURIComponent(rpcid)}&source-path=%2Fapp` +
    `&bl=${encodeURIComponent(bl)}&f.sid=${encodeURIComponent(sid)}` +
    `&hl=en&_reqid=${reqId}&rt=c`;

  const fReq = JSON.stringify([[ [rpcid, JSON.stringify(payloadArray), null, "generic"] ]]);
  const body = `f.req=${encodeURIComponent(fReq)}&at=${encodeURIComponent(at)}`;

  const response = await fetchFn(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "X-Same-Domain": "1",
    },
    body,
  });

  if (!response.ok) throw new Error(`batchexecute HTTP ${response.status}`);
  return parseBatchText(await response.text());
}

function extractChatIdsFromBatch(data) {
  const ids = new Set();
  const walk = (node) => {
    if (typeof node === "string" && /^c_[a-zA-Z0-9_-]+$/.test(node)) {
      ids.add(node);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === "object") {
      Object.values(node).forEach(walk);
    }
  };
  try {
    const inner = JSON.parse(data?.[0]?.[2] || "[]");
    walk(inner);
  } catch {
    walk(data);
  }
  return [...ids];
}

function listChatIdsFromDom() {
  const ids = new Set();
  for (const a of document.querySelectorAll('a[href*="/app/"]')) {
    const match = a.href.match(/\/app\/([a-zA-Z0-9_-]+)/);
    if (match) ids.add(match[1]);
  }
  return [...ids];
}

async function listChatIds(fetchFn) {
  try {
    const data = await batchExecute("MaZiqc", [50], fetchFn);
    const fromApi = extractChatIdsFromBatch(data);
    if (fromApi.length) return fromApi;
  } catch {
    /* fallback */
  }
  return listChatIdsFromDom();
}

async function deleteChatId(cid, fetchFn) {
  await batchExecute("GzXR5e", [cid], fetchFn);
}

async function deleteAllApi(fetchFn, onProgress, delayMs) {
  const ids = await listChatIds(fetchFn);
  if (!ids.length) return { deleted: 0, total: 0 };

  return runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: (id) => deleteChatId(id, fetchFn),
  });
}

async function deleteAllDom() {
  const menuClicked = await clickByText(["recent", "history", "verlauf", "chats"]);
  if (menuClicked) await new Promise((r) => setTimeout(r, 800));

  let deleted = await clickAllMatching(
    ["delete", "löschen", "remove", "trash"],
    { max: 150, delayMs: 450 }
  );

  if (!deleted) {
    const bulk = await clickByText([
      "delete all",
      "clear history",
      "alle löschen",
      "alle chats löschen",
    ]);
    if (bulk) {
      await confirmDialogs();
      return { deleted: "all", total: "all" };
    }
    throw new Error("No Gemini delete controls found");
  }

  await confirmDialogs();
  return { deleted, total: deleted };
}

export const geminiProvider = {
  id: "gemini",
  name: "Gemini",
  match(url) {
    try {
      return new URL(url).hostname === "gemini.google.com";
    } catch {
      return false;
    }
  },

  async deleteAll(ctx) {
    report(ctx.onProgress, { type: "status", message: "Gemini: starting…", overall: 5 });

    const result = await tryMethods(
      [
        { name: "api-batchexecute", fn: () => deleteAllApi(ctx.fetchFn, ctx.onProgress, ctx.delayMs) },
        { name: "dom-sidebar", fn: deleteAllDom },
      ],
      ctx
    );

    return { ...result, provider: "gemini" };
  },
};
