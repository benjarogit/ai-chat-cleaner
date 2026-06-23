// MV3 service worker — keeps the worker alive during long delete runs.
const ALARM_NAME = "claude-deleter-keepalive";

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "deleteAll" || message.action === "updateProgress") {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.4 });
  }
  if (message.action === "complete" || message.action === "error") {
    chrome.alarms.clear(ALARM_NAME);
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log("[Claude Deleter] keepalive");
  }
});
