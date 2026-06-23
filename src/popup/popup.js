import { deleteAllChats, detectProvider, isSupportedUrl, supportedSitesLabel } from "../lib/deleter.js";
import { ext, getActiveTab, onRuntimeMessage, sendTabMessage } from "../lib/api.js";

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

function setProgress(overall, current) {
  if (overall != null) {
    overallBar.style.width = `${overall}%`;
    overallText.textContent = `${Math.round(overall)}%`;
  }
  if (current != null) {
    currentBar.style.width = `${current}%`;
    currentText.textContent = `${Math.round(current)}%`;
  }
}

async function init() {
  const tab = await getActiveTab();
  const provider = tab?.url ? detectProvider(tab.url) : null;

  if (!tab?.url || !isSupportedUrl(tab.url)) {
    deleteButton.disabled = true;
    status.textContent = `Open a supported site: ${supportedSitesLabel()}.`;
    addLog("Unsupported tab.");
    return;
  }

  deleteButton.disabled = false;
  status.textContent = `Ready on ${provider.name}.`;
  addLog(`Ready (${provider.id}).`);
}

deleteButton.addEventListener("click", () => {
  mainPage.hidden = true;
  confirmPage.hidden = false;
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

  const tab = await getActiveTab();
  if (!tab?.id) {
    setError("No active tab.");
    deleteButton.disabled = false;
    return;
  }

  try {
    await sendTabMessage(tab.id, { action: "deleteAll" });
  } catch (err) {
    setError(`Page script unreachable: ${err.message}. Reload the tab and try again.`);
    deleteButton.disabled = false;
    addLog(`Error: ${err.message}`);
  }
});

onRuntimeMessage((request) => {
  if (request.action === "updateProgress") {
    setProgress(request.overall, request.current);
    if (request.message) {
      status.textContent = request.message;
      addLog(request.message);
    }
  }

  if (request.action === "complete") {
    deleteButton.disabled = false;
    setProgress(request.overall ?? 100, request.current ?? 100);
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
