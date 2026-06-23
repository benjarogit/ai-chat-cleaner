import { ext } from "./api.js";

const SESSION_KEY = "accPending";
const PENDING_TTL_MS = 120_000;

export class NavigationResumeError extends Error {
  constructor(step) {
    super(`Navigation pending for step: ${step}`);
    this.name = "NavigationResumeError";
    this.step = step;
  }
}

export async function setPending({ providerId, step, method, tabId, result }) {
  await ext.storage.session.set({
    [SESSION_KEY]: {
      providerId,
      step,
      method,
      tabId,
      result,
      at: Date.now(),
    },
  });
}

export async function getPending(tabId) {
  const data = await ext.storage.session.get(SESSION_KEY);
  const pending = data[SESSION_KEY];
  if (!pending) return null;
  if (Date.now() - pending.at > PENDING_TTL_MS) {
    await clearPending();
    return null;
  }
  if (tabId != null && pending.tabId != null && pending.tabId !== tabId) {
    return null;
  }
  return pending;
}

export async function clearPending() {
  await ext.storage.session.remove(SESSION_KEY);
}

export async function navigateTo(url, pending) {
  await setPending(pending);
  location.assign(url);
  throw new NavigationResumeError(pending.step);
}

export async function getTabId() {
  return new Promise((resolve) => {
    ext.runtime.sendMessage({ action: "getTabId" }, (response) => {
      resolve(response?.tabId ?? null);
    });
  });
}
