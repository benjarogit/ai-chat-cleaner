import { deleteAllChats, detectProvider, isSupportedUrl, supportedSitesLabel } from "../lib/deleter.js";
import { ext, getActiveTab, onRuntimeMessage, sendTabMessage } from "../lib/api.js";
import { buildGithubBugUrl } from "../lib/github-report.js";
import { pickLocale, t } from "./i18n.js";

function detectExtensionSurface() {
  try {
    const manifest = ext.runtime.getManifest();
    if (manifest.browser_specific_settings?.gecko) return "Firefox extension";
    if (/Edg\//.test(navigator.userAgent)) return "Edge extension";
    return "Chrome extension";
  } catch {
    return "Other";
  }
}

const $ = (id) => document.getElementById(id);
const locale = pickLocale();
const i18n = t(locale);
document.documentElement.lang = locale;

const deleteButton = $("deleteAll");
const confirmYes = $("confirmYes");
const confirmNo = $("confirmNo");
const status = $("status");
const errorEl = $("error");
const logEl = $("log");
const debugActions = $("debugActions");
const copyDebugBtn = $("copyDebug");
const reportGithubBtn = $("reportGithub");
const overallBar = $("overallProgress");
const currentBar = $("currentProgress");
const overallText = $("overallProgressText");
const currentText = $("currentProgressText");
const progressBlock = document.querySelector(".progress-block");
const mainPage = $("mainPage");
const confirmPage = $("confirmPage");

const popupLog = [];
let lastDebugReport = "";
let activeProviderId = null;

function applyStaticI18n() {
  $("subtitle").textContent = i18n.subtitle;
  deleteButton.textContent = i18n.deleteAll;
  document.querySelector(".progress-block label:first-of-type").childNodes[0].textContent =
    `${i18n.overall} `;
  document.querySelector(".progress-block label:last-of-type").childNodes[0].textContent =
    `${i18n.currentChat} `;
  copyDebugBtn.textContent = i18n.copyDebug;
  reportGithubBtn.textContent = i18n.reportGithub;
  document.querySelector(".debug-hint").textContent = i18n.debugHint;
  $("confirmTitle").textContent = i18n.confirmTitle;
  $("confirmBody").textContent = i18n.confirmBody;
  confirmYes.textContent = i18n.confirmYes;
  confirmNo.textContent = i18n.confirmNo;
  $("footerIdeas").textContent = i18n.footerIdeas;
  $("footerGithub").textContent = i18n.footerGithub;
  $("footerSupport").textContent = i18n.footerSupport;
  $("footerKofi").textContent = i18n.footerKofi;
  $("footerPatreon").textContent = i18n.footerPatreon;
}

applyStaticI18n();

function accVersion() {
  try {
    return ext.runtime.getManifest().version;
  } catch {
    return "unknown";
  }
}

function addLog(message) {
  const line = `${new Date().toLocaleTimeString()} — ${message}`;
  popupLog.push(line);
  const entry = document.createElement("div");
  entry.textContent = line;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function buildPopupDebugReport(errorMessage) {
  const lines = [
    "=== AI Chat Cleaner — debug report (redacted) ===",
    `version: ${accVersion()}`,
    `generated: ${new Date().toISOString()}`,
    `surface: popup`,
    "",
    "--- popup log ---",
    ...popupLog,
  ];
  if (errorMessage) {
    lines.push("", "--- error ---", errorMessage);
  }
  if (lastDebugReport) {
    lines.push("", "--- content script report ---", lastDebugReport);
  }
  lines.push("", "=== end ===");
  return lines.join("\n");
}

function showDebugActions() {
  debugActions.hidden = false;
}

function hideDebugActions() {
  debugActions.hidden = true;
  debugActions.classList.remove("copied");
}

async function gatherDebugReport() {
  let report = lastDebugReport;
  if (!report) {
    const tab = await getActiveTab();
    if (tab?.id) {
      try {
        const response = await sendTabMessage(tab.id, { action: "getDebugLog" });
        report = response?.debugReport || "";
        if (report) lastDebugReport = report;
      } catch {
        /* content script unavailable */
      }
    }
  }
  if (!report) {
    report = buildPopupDebugReport(errorEl.textContent || undefined);
  }
  return report;
}

async function copyDebugReport() {
  const report = await gatherDebugReport();
  try {
    await navigator.clipboard.writeText(report);
    debugActions.classList.add("copied");
    addLog(i18n.logCopied);
    return report;
  } catch {
    addLog(i18n.logClipboardFail);
    return report;
  }
}

async function reportOnGitHub() {
  const report = await copyDebugReport();
  const url = buildGithubBugUrl({
    report,
    providerId: activeProviderId,
    surface: detectExtensionSurface(),
  });
  try {
    await ext.tabs.create({ url });
    addLog(i18n.logGithubOpened);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

function setError(message, debugReport) {
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    hideDebugActions();
    lastDebugReport = "";
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = message;
  if (debugReport) {
    lastDebugReport = debugReport;
  }
  showDebugActions();
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
  activeProviderId = provider?.id ?? null;

  if (!tab?.url || !isSupportedUrl(tab.url)) {
    deleteButton.disabled = true;
    status.textContent = i18n.statusUnsupported(supportedSitesLabel());
    addLog(i18n.logUnsupported);
    return;
  }

  deleteButton.disabled = false;
  status.textContent = i18n.statusReady(provider.name);
  addLog(i18n.logReady(provider.id));
}

deleteButton.addEventListener("click", () => {
  mainPage.hidden = true;
  confirmPage.hidden = false;
});

confirmNo.addEventListener("click", () => {
  confirmPage.hidden = true;
  mainPage.hidden = false;
  addLog(i18n.logCancelled);
});

copyDebugBtn.addEventListener("click", () => {
  copyDebugReport();
});

reportGithubBtn.addEventListener("click", () => {
  reportOnGitHub();
});

confirmYes.addEventListener("click", async () => {
  confirmPage.hidden = true;
  mainPage.hidden = false;
  deleteButton.disabled = true;
  progressBlock.hidden = false;
  setError("");
  lastDebugReport = "";
  resetProgress();
  status.textContent = i18n.starting;
  addLog(i18n.logStarted);

  const tab = await getActiveTab();
  if (!tab?.id) {
    setError(i18n.errorNoTab);
    deleteButton.disabled = false;
    return;
  }

  try {
    await sendTabMessage(tab.id, { action: "deleteAll" });
  } catch (err) {
    const msg = i18n.errorUnreachable(err.message);
    setError(msg, buildPopupDebugReport(msg));
    deleteButton.disabled = false;
    addLog(i18n.logError(err.message));
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
    addLog(i18n.logCompleted);
  }

  if (request.action === "error") {
    deleteButton.disabled = false;
    setError(request.error, request.debugReport);
    addLog(i18n.logError(request.error));
  }
});

init();
