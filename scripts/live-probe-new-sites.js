/**
 * Paste in DevTools on GitHub Copilot or Microsoft Copilot.
 * Returns baseline + optional isolated delete test for one chat.
 */
(async function accLiveProbeNewSites(opts = {}) {
  const { doDeleteOne = false } = opts;
  const host = location.hostname;
  const R = { site: host, url: location.href, ts: Date.now() };

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

  if (host === "copilot.microsoft.com" || host === "copilot.com" || host === "www.copilot.com") {
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

  R.error = "unsupported host";
  return R;
})();
