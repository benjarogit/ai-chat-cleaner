/** In-page: delete all Gemini chats via batchexecute (api-batchexecute method). */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function parseBatch(text) {
    for (const line of text.split("\n")) {
      if (!line.startsWith("[")) continue;
      try {
        return JSON.parse(line);
      } catch {
        /* next */
      }
    }
    throw new Error("Invalid batch response");
  }

  async function batch(rpcid, payload) {
    const wiz = globalThis.WIZ_global_data;
    if (!wiz?.SNlM0e) throw new Error("WIZ_global_data missing — reload gemini.google.com/app");
    const at = wiz.SNlM0e;
    const bl = wiz.cfb2h || "";
    const sid = String(wiz.FdrFJe || "");
    const req = Math.floor(Math.random() * 900000) + 100000;
    const url =
      `https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=${encodeURIComponent(rpcid)}` +
      `&source-path=%2Fapp&bl=${encodeURIComponent(bl)}&f.sid=${encodeURIComponent(sid)}` +
      `&hl=en&_reqid=${req}&rt=c`;
    const fReq = JSON.stringify([[ [rpcid, JSON.stringify(payload), null, "generic"] ]]);
    const body = `f.req=${encodeURIComponent(fReq)}&at=${encodeURIComponent(at)}`;
    const r = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "X-Same-Domain": "1" },
      body,
    });
    if (!r.ok) throw new Error(`batchexecute HTTP ${r.status}`);
    return parseBatch(await r.text());
  }

  function extractIds(data) {
    const ids = new Set();
    const walk = (node) => {
      if (typeof node === "string") {
        if (/^c_[a-zA-Z0-9_-]+$/.test(node)) ids.add(node);
        else if (/^[a-f0-9]{12,}$/i.test(node)) ids.add(`c_${node}`);
      } else if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === "object") Object.values(node).forEach(walk);
    };
    try {
      walk(JSON.parse(data?.[0]?.[2] || "[]"));
    } catch {
      walk(data);
    }
    return [...ids];
  }

  async function listIds() {
    for (const size of [100, 50, 25]) {
      try {
        const data = await batch("MaZiqc", [size]);
        const ids = extractIds(data);
        if (ids.length) return ids;
      } catch {
        /* try next */
      }
    }
    const dom = [...document.querySelectorAll('a[href*="/app/"]')]
      .map((a) => a.href.match(/\/app\/([a-zA-Z0-9_-]+)/)?.[1])
      .filter((id) => id && /^[a-z0-9_]{8,}$/i.test(id))
      .map((id) => (id.startsWith("c_") ? id : `c_${id}`));
    return [...new Set(dom)];
  }

  function countDom() {
    const seen = new Set();
    for (const a of document.querySelectorAll('a[href*="/app/"]')) {
      const m = a.href.match(/\/app\/([a-zA-Z0-9_-]+)/);
      if (!m || /signout|options|search/i.test(m[1])) continue;
      if (/^[a-z0-9_]{8,}$/i.test(m[1])) seen.add(m[1]);
    }
    return seen.size;
  }

  const ids = await listIds();
  if (!ids.length) return { ok: true, deleted: 0, method: "api-batchexecute", note: "no ids" };

  let deleted = 0;
  for (const raw of ids) {
    const id = raw.startsWith("c_") ? raw : `c_${raw}`;
    await batch("GzXR5e", [id]);
    try {
      await batch("GzXR5e", [id, [1, null, 0, 1]]);
    } catch {
      /* optional */
    }
    deleted++;
    await sleep(300);
  }

  await sleep(2000);
  const apiLeft = (await listIds()).length;
  const domLeft = countDom();
  return {
    ok: apiLeft === 0 && domLeft === 0,
    deleted,
    apiLeft,
    domLeft,
    method: "api-batchexecute",
  };
})();
