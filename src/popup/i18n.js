/**
 * @file Popup UI strings — English / German.
 *
 * Language resolution order:
 *  1. localStorage key `acc-lang` (manual user override)
 *  2. navigator.language (browser locale)
 *  3. fallback: "en"
 */

/** Supported locale codes. */
export const LOCALES = /** @type {const} */ (["en", "de"]);

const STRINGS = {
  en: {
    subtitle: "Bulk-delete AI chat history",
    statusUnsupported: (sites) => `Open a supported site: ${sites}.`,
    statusWrongPath: (name, url) => `On ${name}. Open ${url} first.`,
    statusReady: (name) => `Ready on ${name}.`,
    deleteAll: "Delete all chats",
    overall: "Overall",
    currentChat: "Current chat",
    copyDebug: "Copy debug report",
    reportGithub: "Report on GitHub",
    debugHint: "Safe to share — tokens, emails & chat IDs are redacted.",
    confirmTitle: "Confirm deletion",
    confirmBody: "Delete all conversations? This cannot be undone.",
    confirmYes: "Yes, delete all",
    confirmNo: "Cancel",
    footerIdeas: "Ideas",
    footerGithub: "GitHub",
    footerSupport: "Support",
    footerKofi: "Ko-fi",
    footerPatreon: "Patreon",
    logUnsupported: "Unsupported tab.",
    logWrongPath: (url) => `Open ${url} on this site.`,
    logReady: (id) => `Ready (${id}).`,
    logCancelled: "Cancelled.",
    logStarted: "Deletion started.",
    logCompleted: "Completed.",
    logCopied: "Debug report copied to clipboard.",
    logClipboardFail: "Clipboard failed — try Copy debug report again.",
    logGithubOpened: "Opened GitHub issue form.",
    logError: (msg) => `Error: ${msg}`,
    starting: "Starting…",
    errorNoTab: "No active tab.",
    errorUnreachable: (msg) =>
      `Page script unreachable: ${msg}. Reload the tab and try again.`,
    langToggle: "DE",
  },
  de: {
    subtitle: "KI-Chat-Verlauf massenhaft löschen",
    statusUnsupported: (sites) => `Unterstützte Seite öffnen: ${sites}.`,
    statusWrongPath: (name, url) => `Auf ${name}. Bitte zuerst ${url} öffnen.`,
    statusReady: (name) => `Bereit auf ${name}.`,
    deleteAll: "Alle Chats löschen",
    overall: "Gesamt",
    currentChat: "Aktueller Chat",
    copyDebug: "Debug-Bericht kopieren",
    reportGithub: "Auf GitHub melden",
    debugHint: "Unbedenklich teilen — Tokens, E-Mails & Chat-IDs werden geschwärzt.",
    confirmTitle: "Löschen bestätigen",
    confirmBody: "Alle Unterhaltungen löschen? Das kann nicht rückgängig gemacht werden.",
    confirmYes: "Ja, alle löschen",
    confirmNo: "Abbrechen",
    footerIdeas: "Ideen",
    footerGithub: "GitHub",
    footerSupport: "Unterstützen",
    footerKofi: "Ko-fi",
    footerPatreon: "Patreon",
    logUnsupported: "Tab nicht unterstützt.",
    logWrongPath: (url) => `Auf dieser Seite ${url} öffnen.`,
    logReady: (id) => `Bereit (${id}).`,
    logCancelled: "Abgebrochen.",
    logStarted: "Löschen gestartet.",
    logCompleted: "Fertig.",
    logCopied: "Debug-Bericht in Zwischenablage kopiert.",
    logClipboardFail: "Zwischenablage fehlgeschlagen — erneut versuchen.",
    logGithubOpened: "GitHub-Issue-Formular geöffnet.",
    logError: (msg) => `Fehler: ${msg}`,
    starting: "Starte…",
    errorNoTab: "Kein aktiver Tab.",
    errorUnreachable: (msg) =>
      `Seiten-Skript nicht erreichbar: ${msg}. Tab neu laden und erneut versuchen.`,
    langToggle: "EN",
  },
};

/**
 * Returns the active locale, checking manual override first.
 *
 * @returns {"en"|"de"}
 */
export function pickLocale() {
  try {
    const saved = localStorage.getItem("acc-lang");
    if (saved === "de" || saved === "en") return saved;
    return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
  } catch {
    return "en";
  }
}

/**
 * Persists a manual locale preference.
 *
 * @param {"en"|"de"} locale
 * @returns {void}
 */
export function setLocale(locale) {
  try {
    if (locale === "de" || locale === "en") {
      localStorage.setItem("acc-lang", locale);
    }
  } catch {
    /* storage unavailable */
  }
}

/**
 * Returns the string map for the given locale.
 *
 * @param {"en"|"de"} [locale]
 * @returns {typeof STRINGS["en"]}
 */
export function t(locale = pickLocale()) {
  return STRINGS[locale] ?? STRINGS.en;
}
