import {
  confirmDialogs,
  countSunoLibraryClips,
  deleteSunoViaClipMenu,
  findSunoClipElements,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const STUDIO_API = "https://studio-api-prod.suno.com";

async function getSunoAuthHeader(fetchFn) {
  if (window.Clerk?.session?.getToken) {
    const token = await window.Clerk.session.getToken();
    if (token) return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function listClipIds(fetchFn) {
  const auth = await getSunoAuthHeader(fetchFn);
  const response = await fetchFn(
    `${STUDIO_API}/api/project/me?page=1&sort=max_created_at_last_updated_clip&show_trashed=false`,
    {
      credentials: "include",
      headers: { Accept: "application/json", ...auth },
    }
  );
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  const clips = [];
  for (const project of data.projects || data || []) {
    for (const clip of project.clips || project.project_clips || []) {
      const id = clip.id || clip.clip_id;
      if (id) clips.push(id);
    }
  }
  if (clips.length) return clips;

  const feed = await fetchFn(`${STUDIO_API}/api/feed/v2?page=0`, {
    credentials: "include",
    headers: { Accept: "application/json", ...auth },
  });
  if (feed.ok) {
    const feedData = await feed.json();
    for (const clip of feedData.clips || feedData || []) {
      const id = clip.id || clip.clip_id;
      if (id) clips.push(id);
    }
  }
  return clips;
}

async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listClipIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countSunoLibraryClips();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in library`);
  if (parts.length) {
    throw new Error(`Suno clips still remain (${parts.join(", ")})`);
  }
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listClipIds(fetchFn);
  if (!ids.length) {
    const domCount = countSunoLibraryClips();
    if (domCount > 0) throw new Error(`API listed 0 clips but ${domCount} visible in library`);
    return { deleted: 0, total: 0 };
  }

  const auth = await getSunoAuthHeader(fetchFn);

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "clip",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${STUDIO_API}/api/gen/trash`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...auth },
        body: JSON.stringify({ trash: true, clip_ids: [id] }),
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertGone(fetchFn);
  return result;
}

async function deleteLibraryDom(fetchFn, onProgress) {
  const estimated = Math.max(countSunoLibraryClips(), 1);
  if (!findSunoClipElements().length) return { deleted: 0, total: 0 };

  let deleted = await deleteSunoViaClipMenu(onProgress);
  if (!deleted) throw new Error("No Suno clip More options → Delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

/** ACC delete provider (public API). */

export const sunoProvider = {
  id: "suno",
  name: "Suno",
  match(url) {
    try {
      return new URL(url).hostname === "suno.com";
    } catch {
      return false;
    }
  },

  /** Songs/clips in library — not chat threads. api-individual → dom-library */
  async getDeleteMethods(ctx) {
    let apiIds = [];
    try {
      apiIds = await listClipIds(ctx.fetchFn);
    } catch {
      /* Clerk token */
    }
    const domCount = countSunoLibraryClips();

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
        name: "dom-library",
        step: null,
        fn: () => deleteLibraryDom(ctx.fetchFn, ctx.onProgress),
      });
    }
    return methods;
  },

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
