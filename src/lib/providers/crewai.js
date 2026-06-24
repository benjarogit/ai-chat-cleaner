import {
  clickEachMoreDelete,
  confirmDialogs,
  countCrewAiProjects,
  deleteCrewAiViaProjectMenu,
  findCrewAiProjectElements,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

async function listProjectIds(fetchFn) {
  const response = await fetchFn("/studio/v2/projects", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`list HTTP ${response.status}`);

  const data = await response.json();
  const projects = Array.isArray(data) ? data : data.projects || [];
  return projects.map((p) => p.id).filter(Boolean);
}

async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listProjectIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countCrewAiProjects();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in studio`);
  if (parts.length) {
    throw new Error(`CrewAI projects still remain (${parts.join(", ")})`);
  }
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listProjectIds(fetchFn);
  if (!ids.length) {
    const domCount = countCrewAiProjects();
    if (domCount > 0) throw new Error(`API listed 0 projects but ${domCount} visible in studio`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "project",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`/studio/v2/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertGone(fetchFn);
  return result;
}

async function deleteStudioDom(fetchFn, onProgress) {
  const estimated = Math.max(countCrewAiProjects(), 1);
  if (!findCrewAiProjectElements().length) return { deleted: 0, total: 0 };

  let deleted = await deleteCrewAiViaProjectMenu(onProgress);
  if (!deleted) deleted = await clickEachMoreDelete({ max: 80, delayMs: 450 });
  if (!deleted) throw new Error("No CrewAI project delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

export const crewAiProvider = {
  id: "crewai",
  name: "CrewAI",
  match(url) {
    try {
      const u = new URL(url);
      return u.hostname === "app.crewai.com" && u.pathname.startsWith("/studio");
    } catch {
      return false;
    }
  },

  /** Studio automations/projects — api-individual → dom-studio */
  async getDeleteMethods(ctx) {
    let apiIds = [];
    try {
      apiIds = await listProjectIds(ctx.fetchFn);
    } catch {
      /* session */
    }
    const domCount = countCrewAiProjects();

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
        name: "dom-studio",
        step: null,
        fn: () => deleteStudioDom(ctx.fetchFn, ctx.onProgress),
      });
    }
    return methods;
  },

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
