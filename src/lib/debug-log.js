/** @file Session debug log with redaction for user-facing bug reports. */

const MAX_ENTRIES = 80;
const entries = [];
let runId = null;
let runMeta = {};

const REDACT = [
  [/Bearer\s+[A-Za-z0-9%._+/=-]+/gi, "Bearer [REDACTED]"],
  [/((?:at|SNlM0e|ct0|f\.req|auth|token)=)([^&\s"']+)/gi, "$1[REDACTED]"],
  [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]"],
  [/\/c\/[0-9a-f-]{36}/gi, "/c/[id]"],
  [/\/app\/[a-zA-Z0-9_-]{8,}/gi, "/app/[id]"],
  [/\/chat\/[a-f0-9-]{36}/gi, "/chat/[id]"],
  [/\/studio\/v2\/projects\/[0-9a-f-]{36}/gi, "/studio/v2/projects/[id]"],
  [/\/api\/(?:clip|gen)\/[A-Za-z0-9_-]{8,}/gi, (m) => m.replace(/\/[^/]+$/, "/[id]")],
  [/[?&](?:rid|uuid|token|key|csrf|session)=[^&\s#]+/gi, (m) => m.replace(/=.*/, "=[REDACTED]")],
  [/x-csrf-token:\s*[^\s"']+/gi, "x-csrf-token: [REDACTED]"],
  [/csrf-token["']?\s*(?:content|:)\s*["']?[A-Za-z0-9+/=_-]{16,}/gi, "csrf-token [REDACTED]"],
  [/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[JWT]"],
  [/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[uuid]"],
];

/** Redact sensitive substrings from log lines. @param {*} value @returns {string} */
export function redact(value) {
  if (value == null) return "";
  let text = String(value);
  for (const [pattern, replacement] of REDACT) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

function push(level, data) {
  entries.push({ t: new Date().toISOString(), level, ...data });
  while (entries.length > MAX_ENTRIES) entries.shift();
}

/** Start a new delete-run log session. @param {object} [meta] */
export function debugLogStart(meta = {}) {
  entries.length = 0;
  runId = Date.now().toString(36);
  runMeta = { ...meta };
  push("info", { message: "delete run started", ...meta });
}

/** Append a redacted log entry. @param {string} level @param {string} message @param {object} [extra] */
export function debugLog(level, message, extra = {}) {
  push(level, { message: redact(message), ...extra });
}

/** Log an error with redacted stack. @param {Error} error @param {object} [extra] */
export function debugLogError(error, extra = {}) {
  push("error", {
    message: redact(error?.message || String(error)),
    name: error?.name || "Error",
    stack: redact(error?.stack || ""),
    ...extra,
  });
}

export function debugLogProgress(payload = {}) {
  if (payload.type === "complete") {
    push("complete", {
      message: redact(payload.message || "done"),
      method: payload.method,
      provider: payload.provider,
    });
    return;
  }
  if (payload.type === "error") {
    push("error", { message: redact(payload.message) });
    return;
  }
  if (!payload.message) return;
  push("status", {
    message: redact(payload.message),
    overall: payload.overall,
    method: payload.method,
    provider: payload.provider,
  });
}

export function formatDebugReport({ version, url, provider, error } = {}) {
  const lines = [
    "=== AI Chat Cleaner — debug report (redacted) ===",
    `version: ${version || "unknown"}`,
    `generated: ${new Date().toISOString()}`,
    `run: ${runId || "none"}`,
    `provider: ${provider || runMeta.provider || "unknown"}`,
    `url: ${redact(url || runMeta.url || (typeof location !== "undefined" ? location.href : ""))}`,
    `userAgent: ${typeof navigator !== "undefined" ? redact(navigator.userAgent) : "n/a"}`,
  ];

  if (error) {
    lines.push("", "--- error ---", `name: ${error.name || "Error"}`, `message: ${redact(error.message)}`);
    if (error.stack) lines.push("", "stack:", redact(error.stack));
  }

  lines.push("", "--- session log ---");
  for (const entry of entries) {
    const parts = [entry.t, `[${entry.level}]`];
    if (entry.message) parts.push(entry.message);
    if (entry.method) parts.push(`(method: ${entry.method})`);
    if (entry.name && entry.level === "error" && entry.name !== "Error") {
      parts.push(`(${entry.name})`);
    }
    lines.push(parts.join(" "));
    if (entry.stack) {
      for (const line of entry.stack.split("\n").slice(0, 8)) {
        if (line.trim()) lines.push(`  ${line.trim()}`);
      }
    }
  }

  lines.push("", "=== end ===", "Note: tokens, emails, and chat IDs are redacted.");
  return lines.join("\n");
}

/** Format the current session as a shareable debug report. @param {object} [extra] @returns {string} */
export function getDebugReport(extra = {}) {
  return formatDebugReport(extra);
}
