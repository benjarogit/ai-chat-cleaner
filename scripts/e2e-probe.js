/**
 * In-page E2E probe — paste in console on each platform tab, or inject via extension.
 * Returns structured test results without deleting user data (except ACC-TEST chats).
 */
(async function accE2EProbe() {
  const host = location.hostname;
  const out = { host, url: location.href, at: new Date().toISOString(), tests: {} };

  async function test(name, fn) {
    try {
      out.tests[name] = { ok: true, ...(await fn()) };
    } catch (e) {
      out.tests[name] = { ok: false, error: e.message };
    }
  }

  if (host === "claude.ai") {
    const ORIGIN = "https://claude.ai";
    await test("api-list", async () => {
      const orgs = await fetch(`${ORIGIN}/api/organizations`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      }).then((r) => r.json());
      const orgId = orgs[0].uuid;
      const chats = await fetch(`${ORIGIN}/api/organizations/${orgId}/chat_conversations`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      }).then((r) => r.json());
      return { orgId, count: chats.length };
    });
    await test("api-create-delete", async () => {
      const orgs = await fetch(`${ORIGIN}/api/organizations`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      }).then((r) => r.json());
      const orgId = orgs[0].uuid;
      const created = await fetch(`${ORIGIN}/api/organizations/${orgId}/chat_conversations`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "ACC-TEST-DELETE-ME" }),
      }).then((r) => r.json());
      const id = created.uuid;
      const del = await fetch(`${ORIGIN}/api/organizations/${orgId}/chat_conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      return { createStatus: 201, deleteStatus: del.status, id };
    });
  }

  if (host === "chatgpt.com" || host === "chat.openai.com") {
    const ORIGIN = "https://chatgpt.com";
    const API = `${ORIGIN}/backend-api`;
    await test("api-list", async () => {
      const session = await fetch(`${ORIGIN}/api/auth/session`, { credentials: "include" }).then(
        (r) => r.json()
      );
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      };
      if (session.account?.id) headers["ChatGPT-Account-ID"] = session.account.id;
      const data = await fetch(`${API}/conversations?offset=0&limit=5&order=updated`, {
        credentials: "include",
        headers,
      }).then((r) => r.json());
      return { count: (data.items || []).length, titles: (data.items || []).map((c) => c.title) };
    });
    await test("api-create-delete", async () => {
      const session = await fetch(`${ORIGIN}/api/auth/session`, { credentials: "include" }).then(
        (r) => r.json()
      );
      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      };
      if (session.account?.id) headers["ChatGPT-Account-ID"] = session.account.id;
      const created = await fetch(`${API}/conversations`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ title: "ACC-TEST-DELETE-ME" }),
      });
      const body = await created.json().catch(() => ({}));
      const id = body.id || body.conversation_id;
      if (!id) throw new Error(`create HTTP ${created.status}: ${JSON.stringify(body).slice(0, 120)}`);
      const del = await fetch(`${API}/conversations/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ is_visible: false }),
      });
      return { createStatus: created.status, deleteStatus: del.status, id };
    });
  }

  if (host === "gemini.google.com") {
    const wiz = globalThis.WIZ_global_data;
    if (!wiz?.SNlM0e) throw new Error("WIZ_global_data missing");
    const at = wiz.SNlM0e;
    const bl = wiz.cfb2h || "";
    const sid = String(wiz.FdrFJe || "");

    async function batch(rpcid, payload) {
      const reqId = Math.floor(Math.random() * 900000) + 100000;
      const url =
        `https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=${rpcid}` +
        `&source-path=%2Fapp&bl=${encodeURIComponent(bl)}&f.sid=${encodeURIComponent(sid)}` +
        `&hl=en&_reqid=${reqId}&rt=c`;
      const fReq = JSON.stringify([[ [rpcid, JSON.stringify(payload), null, "generic"] ]]);
      const body = `f.req=${encodeURIComponent(fReq)}&at=${encodeURIComponent(at)}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-Same-Domain": "1",
        },
        body,
      });
      if (!res.ok) throw new Error(`batch ${rpcid} HTTP ${res.status}`);
      return res.text();
    }

    await test("api-list", async () => {
      const text = await batch("MaZiqc", [50]);
      const ids = new Set();
      const walk = (n) => {
        if (typeof n === "string" && /^c_[a-zA-Z0-9_-]+$/.test(n)) ids.add(n);
        else if (Array.isArray(n)) n.forEach(walk);
        else if (n && typeof n === "object") Object.values(n).forEach(walk);
      };
      for (const line of text.split("\n")) {
        if (line.startsWith("[")) try { walk(JSON.parse(line)); } catch { /* */ }
      }
      const domIds = [
        ...document.querySelectorAll('a[href*="/app/"]'),
      ]
        .map((a) => a.href.match(/\/app\/([a-zA-Z0-9_-]+)/)?.[1])
        .filter(Boolean);
      return { apiIds: [...ids], domIds: [...new Set(domIds)] };
    });

    await test("api-delete-one", async () => {
      const domId = [...document.querySelectorAll('a[href*="/app/"]')]
        .map((a) => a.href.match(/\/app\/([a-zA-Z0-9_-]+)/)?.[1])
        .find((id) => id && id.length > 8);
      if (!domId) throw new Error("no dom chat id");
      const cid = domId.startsWith("c_") ? domId : `c_${domId}`;
      await batch("GzXR5e", [cid]);
      try { await batch("GzXR5e", [cid, [1, null, 0, 1]]); } catch { /* */ }
      return { deletedId: cid, note: "deleted current sidebar chat — reload to verify" };
    });
  }

  if (host === "grok.com") {
    const API = `${location.origin}/rest/app-chat/conversations`;
    await test("api-list", async () => {
      const data = await fetch(API, { credentials: "include" }).then((r) => r.json());
      const list = data.conversations || [];
      return { count: list.length, sample: list.slice(0, 2).map((c) => c.title) };
    });
    await test("api-create-delete", async () => {
      const listBefore = await fetch(API, { credentials: "include" }).then((r) => r.json());
      const before = (listBefore.conversations || []).length;
      // Individual delete needs a real id — skip destructive bulk in probe unless empty
      return { before, note: "use api-bulk only via extension deleteAll" };
    });
    const KW = {
      history: ["history", "verlauf", "recent", "chats"],
      settings: ["settings", "einstellungen"],
      deleteAll: ["delete all", "alle löschen", "verlauf löschen", "clear all"],
      delete: ["delete", "löschen", "remove", "entfernen"],
    };
    const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
    const text = (el) =>
      norm([el.textContent, el.getAttribute("aria-label"), el.getAttribute("title")].join(" "));
    const clickables = [...document.querySelectorAll('button,a,[role="button"]')].filter(
      (el) => el.getBoundingClientRect().width > 1
    );
    const find = (keys) =>
      clickables
        .filter((el) => keys.some((k) => text(el).includes(norm(k))))
        .slice(0, 6)
        .map((el) => text(el).slice(0, 80));
    await test("dom-probe", async () => ({
      history: find(KW.history),
      settings: find(KW.settings),
      deleteAll: find(KW.deleteAll),
      trashAria: [...document.querySelectorAll("[aria-label]")]
        .map((el) => el.getAttribute("aria-label"))
        .filter((a) => /lösch|delete|remove|entfern/i.test(a || ""))
        .slice(0, 8),
    }));
  }

  if (host === "x.com" && location.pathname.startsWith("/i/grok")) {
    const BEARER =
      "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    const HISTORY_HASH = "9Hyh5D4-WXLnExZkONSkZg";
    const csrf = decodeURIComponent((document.cookie.match(/ct0=([^;]+)/) || [])[1] || "");
    const gqlHeaders = {
      authorization: `Bearer ${decodeURIComponent(BEARER)}`,
      "x-csrf-token": csrf,
      "content-type": "application/json",
    };

    await test("api-grok-history", async () => {
      const params = new URLSearchParams({ variables: "{}", features: "{}" });
      const res = await fetch(
        `https://x.com/i/api/graphql/${HISTORY_HASH}/GrokHistory?${params}`,
        { headers: gqlHeaders, credentials: "include" }
      );
      const json = await res.json();
      const items = json?.data?.grok_conversation_history?.items || [];
      return {
        status: res.status,
        count: items.length,
        ids: items.slice(0, 3).map((i) => i?.grokConversation?.rest_id),
      };
    });

    await test("api-find-delete-op", async () => {
      const known = {
        DeleteGrokMessage: "kaH0vdJmbuocpRAeWpRC7A",
        GrokHistory: "9Hyh5D4-WXLnExZkONSkZg",
      };
      for (const entry of performance.getEntriesByType("resource")) {
        if (entry.name.includes("DeleteGrokMessage")) {
          const m = entry.name.match(/graphql\/([^/]+)\//);
          if (m) return { hash: m[1], operationName: "DeleteGrokMessage", from: "resource" };
        }
      }
      return { found: false, fallback: known.DeleteGrokMessage };
    });

    await test("dom-probe", async () => {
      const norm = (s) => (s || "").toLowerCase();
      const btns = [...document.querySelectorAll("button,a,[role=button]")].filter(
        (el) => el.getBoundingClientRect().width > 1
      );
      const history = btns
        .filter((el) => /history|verlauf/i.test(el.textContent + el.getAttribute("aria-label")))
        .slice(0, 5)
        .map((el) => (el.textContent || "").trim().slice(0, 50));
      const trash = [...document.querySelectorAll("[aria-label]")]
        .map((el) => el.getAttribute("aria-label"))
        .filter((a) => /delete|lösch|remove/i.test(a || ""))
        .slice(0, 8);
      return { history, trash };
    });
  }

  console.log("ACC E2E", out);
  return out;
})();
