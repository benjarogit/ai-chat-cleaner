/** In-page: delete all Claude chats via REST API (api method). */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ORIGIN = "https://claude.ai";

  function parseChatList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.conversations)) return data.conversations;
    return [];
  }

  async function getOrganizations() {
    const r = await fetch(`${ORIGIN}/api/organizations`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) throw new Error(`organizations HTTP ${r.status}`);
    return (await r.json()) || [];
  }

  async function getChatIdsForOrg(orgId) {
    const r = await fetch(`${ORIGIN}/api/organizations/${orgId}/chat_conversations`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) throw new Error(`chat list HTTP ${r.status}`);
    return parseChatList(await r.json()).map((c) => c.uuid).filter(Boolean);
  }

  async function getAllChats() {
    const orgs = await getOrganizations();
    const chats = [];
    for (const org of orgs) {
      try {
        for (const chatId of await getChatIdsForOrg(org.uuid)) {
          chats.push({ orgId: org.uuid, chatId });
        }
      } catch {
        /* skip org */
      }
    }
    return chats;
  }

  function countDom() {
    const seen = new Set();
    for (const a of document.querySelectorAll('a[href*="/chat/"]')) {
      const m = a.href.match(/\/chat\/([0-9a-f-]{36})/i);
      if (m) seen.add(m[1]);
    }
    return seen.size;
  }

  const chats = await getAllChats();
  if (!chats.length) {
    return { ok: countDom() === 0, deleted: 0, apiLeft: 0, domLeft: countDom(), method: "api" };
  }

  let deleted = 0;
  for (const { orgId, chatId } of chats) {
    const r = await fetch(`${ORIGIN}/api/organizations/${orgId}/chat_conversations/${chatId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!r.ok && r.status !== 204) throw new Error(`delete ${chatId} HTTP ${r.status}`);
    deleted++;
    await sleep(200);
  }

  await sleep(1500);
  const apiLeft = (await getAllChats()).length;
  const domLeft = countDom();
  return { ok: apiLeft === 0 && domLeft === 0, deleted, apiLeft, domLeft, method: "api" };
})();
