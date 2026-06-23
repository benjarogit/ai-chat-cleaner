import { clickEachTrash, clickKeywords, confirmDialogs, KW } from "../dom.js";
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

function normalizeGeminiId(id) {
  if (!id) return null;
  return id.startsWith("c_") ? id : `c_${id}`;
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
    if (match) {
      const normalized = normalizeGeminiId(match[1]);
      if (normalized) ids.add(normalized);
    }
  }
  return [...ids];
}

async function listChatIds(fetchFn) {
  const payloads = [50, 100, 25];
  for (const size of payloads) {
    try {
      const data = await batchExecute("MaZiqc", [size], fetchFn);
      const fromApi = extractChatIdsFromBatch(data);
      if (fromApi.length) return fromApi;
    } catch {
      /* try next payload */
    }
  }
  return listChatIdsFromDom();
}

async function deleteChatId(cid, fetchFn) {
  const id = normalizeGeminiId(cid);
  await batchExecute("GzXR5e", [id], fetchFn);
  try {
    await batchExecute("GzXR5e", [id, [1, null, 0, 1]], fetchFn);
  } catch {
    /* optional second RPC */
  }
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
  await clickKeywords(KW.history, { timeout: 8000 });

  let deleted = await clickEachTrash({ max: 150, delayMs: 500 });
  if (!deleted) {
    const bulk = await clickKeywords(KW.deleteAll, { timeout: 5000 });
    if (bulk) {
      await confirmDialogs();
      return { deleted: "all", total: "all" };
    }
  }

  if (!deleted) throw new Error("No Gemini delete controls found");
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
        {
          name: "api-batchexecute",
          step: null,
          fn: () => deleteAllApi(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
        },
        { name: "dom-sidebar", step: "dom-sidebar", fn: deleteAllDom },
      ],
      ctx
    );

    return { ...result, provider: "gemini" };
  },
};
