/**
 * Paste in DevTools on each site (or run via browser CDP evaluate).
 * Returns baseline + optional isolated delete test for one chat.
 */
(async function accLiveProbeNewSites(opts = {}) {
  const { doDeleteOne = false } = opts;
  const host = location.hostname;
  const R = { site: host, url: location.href, ts: Date.now() };

  if (host === "chat.deepseek.com") {
    const token = JSON.parse(localStorage.getItem("userToken") || "{}").value;
    R.hasToken = !!token;
    const hdr = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const list = await fetch("/api/v0/chat_session/fetch_page?count=50", {
      credentials: "include",
      headers: hdr,
    }).then((r) => r.json());
    const chats = list?.data?.biz_data?.chat_sessions || [];
    R.apiListCount = chats.length;
    R.apiIds = chats.map((c) => c.id);
    R.domLinks = [...document.querySelectorAll('a[href*="/a/chat/s/"]')].map((a) => a.href);
    R.domCount = R.domLinks.length;

    if (doDeleteOne && chats[0]) {
      const id = chats[0].id;
      const del = await fetch("/api/v0/chat_session/delete", {
        method: "POST",
        credentials: "include",
        headers: hdr,
        body: JSON.stringify({ chat_session_id: id }),
      });
      R.deleteOne = { id, status: del.status, body: await del.text() };
      const list2 = await fetch("/api/v0/chat_session/fetch_page?count=50", {
        credentials: "include",
        headers: hdr,
      }).then((r) => r.json());
      R.afterApiCount = (list2?.data?.biz_data?.chat_sessions || []).length;
    }
    return R;
  }

  if (host === "www.perplexity.ai" || host === "perplexity.ai") {
    const list = await fetch("/rest/thread/list_recent?limit=50", {
      credentials: "include",
      headers: { Accept: "application/json" },
    }).then((r) => r.json());
    R.apiListCount = list.length;
    R.apiIds = list.map((t) => t.uuid);
    R.domLinks = [...document.querySelectorAll('a[href*="/search/"]')]
      .map((a) => a.href)
      .filter((h) => /\/search\/[0-9a-f-]{36}/i.test(h));
    R.domCount = R.domLinks.length;

    if (list[0]) {
      const th = await fetch(
        `/rest/thread/${list[0].uuid}?version=2.18&source=default`,
        { credentials: "include" }
      ).then((r) => r.json());
      R.hasReadWriteToken = !!th?.entries?.[0]?.read_write_token;
    }

    if (doDeleteOne && list[0]) {
      const id = list[0].uuid;
      const th = await fetch(`/rest/thread/${id}?version=2.18&source=default`, {
        credentials: "include",
      }).then((r) => r.json());
      const rw = th?.entries?.[0]?.read_write_token;
      const del = await fetch(
        "/rest/thread/delete_thread_by_entry_uuid?version=2.18&source=default",
        {
          method: "DELETE",
          credentials: "include",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ entry_uuid: id, read_write_token: rw }),
        }
      );
      R.deleteOne = { id, status: del.status, body: await del.text() };
      const list2 = await fetch("/rest/thread/list_recent?limit=50", {
        credentials: "include",
      }).then((r) => r.json());
      R.afterApiCount = list2.length;
    }
    return R;
  }

  if (host === "github.com" && location.pathname.startsWith("/copilot")) {
    const token = JSON.parse(localStorage.getItem("COPILOT_AUTH_TOKEN") || "{}").value;
    R.hasToken = !!token;
    const hit = [...document.querySelectorAll("script")]
      .map((s) => s.textContent)
      .find((t) => t && t.includes("apiURL"));
    const apiURL =
      hit?.match(/"apiURL":"([^"]+)"/)?.[1] || "https://api.individual.githubcopilot.com";
    const apiVersion = hit?.match(/"apiVersion":"([^"]+)"/)?.[1] || null;
    R.apiURL = apiURL;
    R.apiVersion = apiVersion;
    R.domLinks = [...document.querySelectorAll('a[href*="/copilot/c/"]')].map((a) => a.href);
    R.domCount = R.domLinks.length;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const nf = iframe.contentWindow.fetch.bind(iframe.contentWindow);
    const hdr = {
      Accept: "application/json",
      Authorization: `GitHub-Bearer ${token}`,
      "copilot-integration-id": "copilot-chat",
    };
    if (apiVersion) hdr["x-github-api-version"] = apiVersion;

    const listRes = await nf(`${apiURL}/github/chat/threads?`, {
      method: "GET",
      credentials: "include",
      headers: hdr,
    });
    R.apiListStatus = listRes.status;
    const listJson = await listRes.json();
    const threads = listJson.threads || [];
    R.apiListCount = threads.length;
    R.apiIds = threads.map((t) => t.id);
    iframe.remove();

    if (doDeleteOne && threads[0]) {
      const id = threads[0].id;
      const iframe2 = document.createElement("iframe");
      iframe2.style.display = "none";
      document.body.appendChild(iframe2);
      const nf2 = iframe2.contentWindow.fetch.bind(iframe2.contentWindow);
      const del = await nf2(`${apiURL}/github/chat/threads/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: hdr,
      });
      R.deleteOne = { id, status: del.status, body: await del.text() };
      const listRes2 = await nf2(`${apiURL}/github/chat/threads?`, {
        method: "GET",
        credentials: "include",
        headers: hdr,
      });
      const j2 = await listRes2.json();
      R.afterApiCount = (j2.threads || []).length;
      iframe2.remove();
    }
    return R;
  }

  if (host === "copilot.microsoft.com") {
    const list = await fetch("/c/api/conversations?types=chat,character,xbox,group", {
      credentials: "include",
    }).then((r) => r.json());
    R.apiListCount = (list.results || []).length;
    R.apiIds = (list.results || []).map((c) => c.id);
    R.domCount = document.querySelectorAll('a[href*="/chats/"]').length;
    if (doDeleteOne && list.results?.[0]) {
      const id = list.results[0].id;
      const del = await fetch(`/c/api/conversations/${id}`, { method: "DELETE", credentials: "include" });
      R.deleteOne = { id, status: del.status };
      const list2 = await fetch("/c/api/conversations?types=chat,character,xbox,group", {
        credentials: "include",
      }).then((r) => r.json());
      R.afterApiCount = (list2.results || []).length;
    }
    return R;
  }

  if (host === "chat.mistral.ai") {
    const input = encodeURIComponent(
      JSON.stringify({
        "0": {
          json: {
            chatVisibility: "private",
            chatPermission: "write",
            includeProjectChats: false,
            productType: location.pathname.startsWith("/work") ? "work" : "chat",
            direction: "forward",
            limit: 50,
          },
        },
      })
    );
    const list = await fetch(`/api/trpc/chat.last?batch=1&input=${input}`, {
      credentials: "include",
    }).then((r) => r.json());
    const items = list?.[0]?.result?.data?.json?.items || [];
    R.apiListCount = items.length;
    R.apiIds = items.map((c) => c.id);
    R.domCount = document.querySelectorAll('a[href*="/chat/"]').length;
    return R;
  }

  if (host === "pi.ai") {
    const list = await fetch("/api/conversations?includeDeleted=false", {
      credentials: "include",
    }).then((r) => r.json());
    R.apiListCount = (list.results || []).length;
    R.apiIds = (list.results || []).map((c) => c.id);
    R.domCount = document.querySelectorAll('button[aria-label*="Conversation"]').length;
    return R;
  }

  if (host === "www.meta.ai" || host === "meta.ai") {
    R.domCount = document.querySelectorAll('a[href*="/prompt/"]').length;
    R.domLinks = [...document.querySelectorAll('a[href*="/prompt/"]')].map((a) => a.href);
    return R;
  }

  if (host === "poe.com") {
    R.domCount = document.querySelectorAll('a[href*="/chat/"]').length;
    return R;
  }

  if (host === "suno.com") {
    R.domCount = document.querySelectorAll('[data-testid*="clip"], article').length;
    R.hasClerk = !!window.Clerk;
    return R;
  }

  if (host === "manus.im") {
    const listRes = await fetch("https://api.manus.im/session.v1.SessionService/ListSessions", {
      method: "POST",
      credentials: "include",
      headers: {
        "connect-protocol-version": "1",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ pageSize: 50 }),
    });
    R.apiListStatus = listRes.status;
    if (listRes.ok) {
      const data = await listRes.json();
      const sessions = data.sessions || data.items || [];
      R.apiListCount = sessions.length;
      R.apiIds = sessions.map((s) => s.sessionId || s.id);
    }
    R.domCount = document.querySelectorAll("[data-session-item]").length;
    return R;
  }

  if (host === "agentgpt.reworkd.ai") {
    const input = encodeURIComponent(JSON.stringify({ "0": { json: null } }));
    const list = await fetch(`/api/trpc/agent.getAll?batch=1&input=${input}`, {
      credentials: "include",
    }).then((r) => r.json());
    const agents = list?.[0]?.result?.data?.json || [];
    R.apiListCount = agents.length;
    R.domCount = document.querySelectorAll(
      '.mb-2.mr-2.flex-1 button, [class*="overflow-ellipsis"] button'
    ).length;
    return R;
  }

  if (host === "app.crewai.com") {
    const list = await fetch("/studio/v2/projects", { credentials: "include" }).then((r) => r.json());
    const projects = Array.isArray(list) ? list : list.projects || [];
    R.apiListCount = projects.length;
    R.apiIds = projects.map((p) => p.id);
    R.domCount = document.querySelectorAll(".project-card:not(.project-card-create)").length;
    return R;
  }

  if (host === "assistant.kagi.com") {
    const list = await fetch("/api/conversations", { credentials: "include" }).then((r) => r.json());
    R.apiListCount = (list.items || []).length;
    R.apiIds = (list.items || []).map((c) => c.uuid);
    R.domCount = document.querySelectorAll('a[href*="/chat/"]').length;
    if (doDeleteOne && list.items?.[0]) {
      const id = list.items[0].uuid;
      const del = await fetch(`/api/conversations/${id}`, { method: "DELETE", credentials: "include" });
      R.deleteOne = { id, status: del.status, body: await del.text() };
      const list2 = await fetch("/api/conversations", { credentials: "include" }).then((r) => r.json());
      R.afterApiCount = (list2.items || []).length;
    }
    return R;
  }

  R.error = "unsupported host";
  return R;
})();
