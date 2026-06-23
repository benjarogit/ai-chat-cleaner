import { sleep } from "./shared.js";

/** Universal keyword buckets — match substrings case-insensitively. */
export const KW = {
  delete: [
    "delete", "löschen", "loeschen", "entfernen", "remove", "supprimer", "eliminar",
    "unterhaltung löschen", "chat löschen", "conversation löschen", "delete conversation",
  ],
  deleteAll: [
    "delete all", "clear all", "remove all", "alle löschen", "alle unterhaltungen",
    "alle chats", "alle chats löschen", "gesamten verlauf", "conversation history", "delete conversation history",
    "delete all conversations", "delete all chats", "clear history", "verlauf löschen",
    "unterhaltungen löschen", "chats löschen", "delete all chats and conversations",
  ],
  confirm: [
    "confirm", "bestätigen", "bestaetigen", "yes", "ja", "ok", "delete", "löschen",
    "continue", "fortfahren", "permanently", "dauerhaft",
  ],
  history: [
    "history", "verlauf", "chatverlauf", "grok-verlauf", "recent", "recents", "chats",
    "aktivität", "activity", "conversations", "unterhaltungen",
  ],
  settings: [
    "settings", "einstellungen", "preferences", "account", "konto", "profil", "profile",
  ],
  data: [
    "data controls", "data control", "datenkontrolle", "daten", "privacy", "datenschutz",
    "privacy and safety", "privacy & safety",
  ],
  more: [
    "mehr", "more", "more actions", "weitere", "options", "aktionen",
    "conversation options", "open conversation", "chat options",
  ],
  grok: ["grok", "third-party", "third party", "collaborators"],
  selectChats: ["chats auswählen", "select chats"],
  selectAll: ["alles auswählen", "select all"],
  cancel: ["abbrechen", "cancel"],
};

function norm(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isVisible(el) {
  if (!el || el.disabled) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function elementText(el) {
  return norm(
    [el.textContent, el.getAttribute("aria-label"), el.getAttribute("title"), el.value]
      .filter(Boolean)
      .join(" ")
  );
}

function matchesKeywords(el, keywords) {
  const hay = elementText(el);
  return keywords.some((k) => hay.includes(norm(k)));
}

export function queryClickables(root = document) {
  return [
    ...root.querySelectorAll(
      'button, a[href], [role="button"], [role="menuitem"], [role="option"], input[type="button"], input[type="submit"]'
    ),
  ].filter(isVisible);
}

export function findByKeywords(keywords, root = document) {
  return queryClickables(root).find((el) => matchesKeywords(el, keywords)) ?? null;
}

export function findAllByKeywords(keywords, root = document) {
  return queryClickables(root).filter((el) => matchesKeywords(el, keywords));
}

export function findTrashControls(root = document) {
  const selectors = [
    '[aria-label*="delete" i]',
    '[aria-label*="lösch" i]',
    '[aria-label*="remove" i]',
    '[aria-label*="entfern" i]',
    '[data-testid*="delete" i]',
    '[data-testid*="trash" i]',
    'button[class*="trash" i]',
  ];
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el && isVisible(el)) return el;
  }
  return findByKeywords(KW.delete, root);
}

export async function clickKeywords(keywords, { timeout = 15000, root = document } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = findByKeywords(keywords, root);
    if (el) {
      el.click();
      await sleep(450);
      return true;
    }
    await sleep(200);
  }
  return false;
}

export async function clickEachTrash({ max = 150, delayMs = 500 } = {}) {
  let deleted = 0;
  for (let i = 0; i < max; i++) {
    const btn = findTrashControls();
    if (!btn) break;
    btn.click();
    await sleep(300);
    await confirmDialogs();
    deleted++;
    await sleep(delayMs);
  }
  return deleted;
}

/** X/Grok-style: Mehr → Löschen per history row. */
export async function clickEachMoreDelete({ max = 100, delayMs = 450 } = {}) {
  let deleted = 0;
  for (let i = 0; i < max; i++) {
    const mehr = findByKeywords(KW.more);
    if (!mehr) break;
    mehr.click();
    await sleep(350);
    const del = findByKeywords(KW.delete);
    if (!del) break;
    del.click();
    await sleep(250);
    await confirmDialogs();
    deleted++;
    await sleep(delayMs);
  }
  return deleted;
}

export async function confirmDialogs() {
  for (let i = 0; i < 3; i++) {
    const ok = await clickKeywords(KW.confirm, { timeout: 2000 });
    if (!ok) break;
    await sleep(350);
  }
}

export async function openOverflowMenus(root = document) {
  const menus = root.querySelectorAll(
    '[aria-label*="more" i], [aria-label*="menu" i], [aria-label*="options" i], [aria-label*="aktionen" i], [data-testid*="more" i], button:has(svg)'
  );
  for (const btn of menus) {
    if (isVisible(btn)) {
      btn.click();
      await sleep(200);
    }
  }
}

export async function waitFor(condition, { timeout = 15000, interval = 250 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await sleep(interval);
  }
  return false;
}

/** Unique Claude/ChatGPT-style chat IDs from visible /chat/ links. */
export function countUniqueChatLinks() {
  const ids = new Set();
  for (const a of document.querySelectorAll('a[href*="/chat/"]')) {
    const match = a.href.match(/\/chat\/([a-f0-9-]+)/i);
    if (match && match[1] !== "new") ids.add(match[1]);
  }
  return ids.size;
}

/** Claude sidebar/recents: ⋮ → Löschen per row. */
export async function clickClaudeOverflowDeletes({ max = 120, delayMs = 500 } = {}) {
  let deleted = 0;
  for (let i = 0; i < max; i++) {
    const menus = [
      ...document.querySelectorAll(
        'button[aria-label*="Weitere Optionen" i], button[aria-label*="More options" i]'
      ),
    ].filter(isVisible);
    if (!menus.length) break;

    menus[0].click();
    await sleep(350);
    const del = findByKeywords(KW.delete);
    if (!del) break;

    del.click();
    await sleep(300);
    await confirmDialogs();
    deleted++;
    await sleep(delayMs);
  }
  return deleted;
}

export function findToolbarButton(keywords) {
  return (
    queryClickables().find((el) => {
      if (el.disabled) return false;
      const hay = elementText(el);
      return keywords.some((k) => hay === norm(k) || hay.includes(norm(k)));
    }) ?? null
  );
}
