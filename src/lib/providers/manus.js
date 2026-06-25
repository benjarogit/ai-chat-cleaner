import {
  clickEachMoreDelete,
  confirmDialogs,
  countManusSidebarSessions,
  deleteManusViaSidebar,
  findManusSidebarSessionLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const API = "https://api.manus.im";

function getManusAuthHeader() {
  const token = decodeURIComponent(
    (document.cookie.match(/(?:^|;\s*)session_id=([^;]+)/) || [])[1] || ""
  );
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function connectHeaders(extra = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "connect-protocol-version": "1",
    ...getManusAuthHeader(),
    ...extra,
  };
}

async function listSessionIds(fetchFn) {
  const response = await fetchFn(`${API}/session.v1.SessionService/ListSessions`, {
    method: "POST",
    credentials: "include",
    headers: connectHeaders(),
    body: JSON.stringify({ pageSize: 50 }),
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  const sessions = data.sessions || data.items || [];
  return sessions.map((s) => s.uid || s.sessionUid || s.sessionId || s.id).filter(Boolean);
}

async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listSessionIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countManusSidebarSessions();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`Manus sessions still remain (${parts.join(", ")})`);
  }
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listSessionIds(fetchFn);
  if (!ids.length) {
    const domCount = countManusSidebarSessions();
    if (domCount > 0) throw new Error(`API listed 0 sessions but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "session",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${API}/session.v1.SessionService/DeleteSession`, {
        method: "POST",
        credentials: "include",
        headers: connectHeaders(),
        body: JSON.stringify({ sessionUid: id }),
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertGone(fetchFn);
  return result;
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countManusSidebarSessions(), 1);
  if (!findManusSidebarSessionLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deleteManusViaSidebar(onProgress);
  if (!deleted) deleted = await clickEachMoreDelete({ max: 80, delayMs: 450 });
  if (!deleted) throw new Error("No Manus sidebar delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

/** ACC delete provider (public API). */

export const manusProvider = {
  id: "manus",
  name: "Manus",
  match(url) {
    try {
      const u = new URL(url);
      return u.hostname === "manus.im" && u.pathname.startsWith("/app");
    } catch {
      return false;
    }
  },

  /** Live: api-individual (Connect-RPC) → dom-sidebar */
  async getDeleteMethods(ctx) {
    let apiIds = [];
    try {
      apiIds = await listSessionIds(ctx.fetchFn);
    } catch {
      /* auth */
    }
    const domCount = countManusSidebarSessions();

    if (!apiIds.length && !domCount) {
      return [{ name: "noop", step: null, fn: () => ({ deleted: 0, total: 0 }) }];
    }

    const methods = [];
    if (apiIds.length > 0) {
      methods.push({
        name: "api-individual",
        step: null,
        fn: () => deleteAllOneByOne(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
      });
    }
    if (domCount > 0) {
      methods.push({
        name: "dom-sidebar",
        step: null,
        fn: () => deleteSidebarDom(ctx.fetchFn, ctx.onProgress),
      });
    }
    return methods;
  },

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
