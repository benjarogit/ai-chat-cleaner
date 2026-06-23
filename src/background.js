// MV3 background — keepalive + tab id helper + resume coordination.
const api = globalThis.browser ?? globalThis.chrome;
const ALARM_NAME = "acc-keepalive";
const PENDING_KEY = "accPending";

function storageArea() {
  return api.storage?.session ?? api.storage?.local;
}

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTabId") {
    sendResponse({ tabId: sender.tab?.id ?? null });
    return true;
  }

  if (message.action === "pendingGet") {
    storageArea()
      .get(PENDING_KEY)
      .then((data) => sendResponse({ pending: data[PENDING_KEY] ?? null }))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  if (message.action === "pendingSet") {
    storageArea()
      .set({ [PENDING_KEY]: message.pending })
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  if (message.action === "pendingClear") {
    storageArea()
      .remove(PENDING_KEY)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  if (message.action === "deleteAll" || message.action === "updateProgress") {
    api.alarms.create(ALARM_NAME, { periodInMinutes: 0.4 });
  }
  if (message.action === "complete" || message.action === "error") {
    api.alarms.clear(ALARM_NAME);
    storageArea().remove(PENDING_KEY).catch(() => {});
  }
});

api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log("[ACC] keepalive");
  }
});

api.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "complete") {
    api.tabs.sendMessage(tabId, { action: "checkResume" }).catch(() => {});
  }
});
