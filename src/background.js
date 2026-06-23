// MV3 background — keepalive + tab id helper + resume coordination.
const api = globalThis.browser ?? globalThis.chrome;
const ALARM_NAME = "acc-keepalive";

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTabId") {
    sendResponse({ tabId: sender.tab?.id ?? null });
    return true;
  }

  if (message.action === "deleteAll" || message.action === "updateProgress") {
    api.alarms.create(ALARM_NAME, { periodInMinutes: 0.4 });
  }
  if (message.action === "complete" || message.action === "error") {
    api.alarms.clear(ALARM_NAME);
    api.storage.session.remove("accPending");
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
