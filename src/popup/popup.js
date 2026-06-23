import { isClaudeUrl } from "../lib/deleter.js";
import { ext, getActiveClaudeTab, onRuntimeMessage, sendTabMessage } from "../lib/api.js";

const $ = (id) => document.getElementById(id);

const deleteButton = $("deleteAll");
const confirmYes = $("confirmYes");
const confirmNo = $("confirmNo");
const status = $("status");
const errorEl = $("error");
const logEl = $("log");
const overallBar = $("overallProgress");
const currentBar = $("currentProgress");
const overallText = $("overallProgressText");
const currentText = $("currentProgressText");
const progressBlock = document.querySelector(".progress-block");
const mainPage = $("mainPage");
const confirmPage = $("confirmPage");

function addLog(message) {
  const entry = document.createElement("div");
  entry.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function setError(message) {
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = message;
}

function resetProgress() {
  overallBar.style.width = "0%";
  currentBar.style.width = "0%";
  overallText.textContent = "0%";
  currentText.textContent = "0%";
}

async function init() {
  const tab = await getActiveClaudeTab();
  if (!tab?.url || !isClaudeUrl(tab.url)) {
    deleteButton.disabled = true;
    status.textContent = "Open claude.ai in this tab first.";
    addLog("Not on claude.ai — extension disabled.");
    return;
  }

  deleteButton.disabled = false;
  status.textContent = "Ready on claude.ai.";
  addLog("Ready.");
}

deleteButton.addEventListener("click", () => {
  mainPage.hidden = true;
  confirmPage.hidden = false;
  addLog("Confirmation shown.");
});

confirmNo.addEventListener("click", () => {
  confirmPage.hidden = true;
  mainPage.hidden = false;
  addLog("Cancelled.");
});

confirmYes.addEventListener("click", async () => {
  confirmPage.hidden = true;
  mainPage.hidden = false;
  deleteButton.disabled = true;
  progressBlock.hidden = false;
  setError("");
  resetProgress();
  status.textContent = "Starting…";
  addLog("Deletion started.");

  const tab = await getActiveClaudeTab();
  if (!tab?.id) {
    setError("No active tab.");
    deleteButton.disabled = false;
    return;
  }

  try {
    await sendTabMessage(tab.id, { action: "deleteAll" });
  } catch (err) {
    setError(`Could not reach page script: ${err.message}. Reload claude.ai and try again.`);
    deleteButton.disabled = false;
    addLog(`Error: ${err.message}`);
  }
});

onRuntimeMessage((request) => {
  if (request.action === "updateProgress") {
    if (request.overall != null) {
      overallBar.style.width = `${request.overall}%`;
      overallText.textContent = `${Math.round(request.overall)}%`;
    }
    if (request.current != null) {
      currentBar.style.width = `${request.current}%`;
      currentText.textContent = `${Math.round(request.current)}%`;
    }
    if (request.message) {
      status.textContent = request.message;
      addLog(request.message);
    }
  }

  if (request.action === "complete") {
    deleteButton.disabled = false;
    status.textContent = request.message || "Done.";
    addLog("Completed.");
  }

  if (request.action === "error") {
    deleteButton.disabled = false;
    setError(request.error);
    addLog(`Error: ${request.error}`);
  }
});

init();
