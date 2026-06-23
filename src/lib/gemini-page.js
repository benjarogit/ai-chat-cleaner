let reqId = 0;

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

/** Direct batchexecute when WIZ_global_data is in this JS realm (console / MAIN). */
async function batchExecuteDirect(rpcid, payloadArray) {
  const wiz = globalThis.WIZ_global_data;
  if (!wiz?.SNlM0e) throw new Error("Gemini session tokens not found — reload page");

  const at = wiz.SNlM0e;
  const bl = wiz.cfb2h || "";
  const sid = String(wiz.FdrFJe || "");
  const req = Math.floor(Math.random() * 900000) + 100000;
  const url =
    `https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=${encodeURIComponent(rpcid)}` +
    `&source-path=%2Fapp&bl=${encodeURIComponent(bl)}&f.sid=${encodeURIComponent(sid)}` +
    `&hl=en&_reqid=${req}&rt=c`;

  const fReq = JSON.stringify([[ [rpcid, JSON.stringify(payloadArray), null, "generic"] ]]);
  const body = `f.req=${encodeURIComponent(fReq)}&at=${encodeURIComponent(at)}`;

  const response = await fetch(url, {
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

/** Call Gemini batchexecute — direct in MAIN world, else via page-main.js bridge. */
export function geminiBatchInPage(rpcid, payload) {
  if (globalThis.WIZ_global_data?.SNlM0e) {
    return batchExecuteDirect(rpcid, payload);
  }

  return new Promise((resolve, reject) => {
    const id = ++reqId;
    const onResp = (ev) => {
      if (ev.detail?.id !== id) return;
      window.removeEventListener("acc-gemini-response", onResp);
      if (ev.detail.ok) resolve(ev.detail.result);
      else reject(new Error(ev.detail.error || "Gemini page bridge failed"));
    };
    window.addEventListener("acc-gemini-response", onResp);
    window.dispatchEvent(
      new CustomEvent("acc-gemini-request", { detail: { id, rpcid, payload } })
    );
    setTimeout(() => {
      window.removeEventListener("acc-gemini-response", onResp);
      reject(new Error("Gemini page bridge timeout — reload tab"));
    }, 120000);
  });
}
