/**
 * Runs in the page MAIN world (manifest world: MAIN).
 * Gemini batchexecute needs WIZ_global_data from the real page context.
 */
(function accPageMain() {
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

  async function batchExecute(rpcid, payloadArray) {
    const wiz = globalThis.WIZ_global_data;
    if (!wiz?.SNlM0e) throw new Error("Gemini session tokens not found — reload page");

    const at = wiz.SNlM0e;
    const bl = wiz.cfb2h || "";
    const sid = String(wiz.FdrFJe || "");
    const reqId = Math.floor(Math.random() * 900000) + 100000;
    const url =
      `https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=${encodeURIComponent(rpcid)}` +
      `&source-path=%2Fapp&bl=${encodeURIComponent(bl)}&f.sid=${encodeURIComponent(sid)}` +
      `&hl=en&_reqid=${reqId}&rt=c`;

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

  window.addEventListener("acc-gemini-request", async (ev) => {
    const { id, rpcid, payload } = ev.detail || {};
    try {
      const result = await batchExecute(rpcid, payload);
      window.dispatchEvent(
        new CustomEvent("acc-gemini-response", { detail: { id, ok: true, result } })
      );
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent("acc-gemini-response", {
          detail: { id, ok: false, error: error.message },
        })
      );
    }
  });
})();
