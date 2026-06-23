/** Cross-browser WebExtension API (chrome / browser). */
export const ext =
  typeof globalThis.browser !== "undefined"
    ? globalThis.browser
    : globalThis.chrome;

export function sendRuntimeMessage(message) {
  return ext.runtime.sendMessage(message).catch(() => {});
}

export function onRuntimeMessage(listener) {
  ext.runtime.onMessage.addListener(listener);
}

export async function getActiveClaudeTab() {
  const tabs = await ext.tabs.query({ active: true, currentWindow: true });
  return tabs[0] ?? null;
}

export async function sendTabMessage(tabId, message) {
  return ext.tabs.sendMessage(tabId, message);
}
