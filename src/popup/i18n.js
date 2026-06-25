/** @file Popup UI strings (English / German). */

const STRINGS = {
  en: {
    subtitle: "Bulk-delete AI chat history",
    statusUnsupported: (sites) => `Open a supported site: ${sites}.`,
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
  },
  de: {
    subtitle: "KI-Chat-Verlauf massenhaft löschen",
    statusUnsupported: (sites) => `Unterstützte Seite öffnen: ${sites}.`,
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
  },
};

/** @returns {"en"|"de"} */
export function pickLocale() {
  try {
    return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
  } catch {
    return "en";
  }
}

/** @param {"en"|"de"} [locale] */
export function t(locale = pickLocale()) {
  return STRINGS[locale] ?? STRINGS.en;
}
