import { sleep } from "./shared.js";

/** Universal keyword buckets — match substrings case-insensitively. */
export const KW = {
  delete: [
    "delete", "löschen", "loeschen", "entfernen", "remove", "supprimer", "eliminar",
    "unterhaltung löschen", "chat löschen", "conversation löschen", "delete conversation",
    "delete chat",
  ],
  deleteAll: [
    "delete all", "clear all", "remove all", "alle löschen", "alle unterhaltungen",
    "alle chats", "alle chats löschen", "gesamten verlauf", "conversation history", "delete conversation history",
    "delete all conversations", "delete all chats", "clear history", "verlauf löschen",
    "unterhaltungen löschen", "chats löschen", "delete all chats and conversations",
    "supprimer tout", "eliminar todo", "eliminar todas", "tout supprimer",
    "konversationsprotokoll löschen", "delete conversation log", "conversation log",
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
    "privacy and safety", "privacy & safety", "contrôles des données", "controles de datos",
  ],
  more: [
    "mehr", "more", "more actions", "weitere", "options", "aktionen",
    "conversation options", "open conversation", "chat options",
  ],
  grok: ["grok", "third-party", "third party", "collaborators"],
  selectChats: [
    "chats auswählen", "select chats", "sélectionner les chats", "seleccionar chats",
    "seleziona chat", "chats selecteren",
  ],
  selectAll: [
    "alles auswählen", "select all", "tout sélectionner", "seleccionar todo",
    "seleziona tutto", "alles selecteren",
  ],
  cancel: ["abbrechen", "cancel", "annuler", "cancelar", "annulla"],
  allTime: [
    "gesamte zeit", "all time", "all-time", "toute la période", "todo el tiempo",
    "tutto il tempo", "gehele periode",
  ],
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

/** Claude overflow ⋮ — aria like "More options for …" / "Weitere Optionen für …". */
const CLAUDE_OVERFLOW_ARIA =
  /(?:more|weitere|plus|más|plus)\s+options?\s+(?:for|für|pour|para|per)\s+/i;

export function findClaudeOverflowButtons(root = document) {
  return queryVisible("button", root).filter((b) => {
    const aria = b.getAttribute("aria-label") || "";
    return CLAUDE_OVERFLOW_ARIA.test(aria);
  });
}

/** Gemini sidebar uses the same overflow aria pattern as Claude. */
export function findGeminiSidebarScope(root = document) {
  return (
    root.querySelector('nav[aria-label*="Seitliche" i], nav[aria-label*="Sidebar" i]') ||
    root.querySelector(
      '[role="navigation"][aria-label*="Seitliche" i], [role="navigation"][aria-label*="Sidebar" i]'
    ) ||
    root
  );
}

/** Overflow ⋮ in sidebar — include hover-hidden buttons (not only isVisible). */
export function findGeminiSidebarOverflowButtons(root = document) {
  const scope = findGeminiSidebarScope(root);
  return [...scope.querySelectorAll("button")].filter((b) => {
    const aria = b.getAttribute("aria-label") || "";
    return CLAUDE_OVERFLOW_ARIA.test(aria);
  });
}

export function findGeminiSidebarChatLinks(root = document) {
  const seen = new Set();
  const links = [];
  const scope = findGeminiSidebarScope(root);
  for (const a of scope.querySelectorAll('a[href*="/app/"]')) {
    const match = a.href.match(/\/app\/([a-zA-Z0-9_-]+)/);
    if (!match || seen.has(match[1])) continue;
    const raw = match[1];
    if (/signout|options|search/i.test(raw)) continue;
    if (!/^[a-z0-9_]{8,}$/i.test(raw)) continue;
    seen.add(match[1]);
    links.push(a);
  }
  return links;
}

/** Recents bulk mode: toolbar has cancel, or row checkboxes are visible. */
export function isClaudeRecentsSelectMode() {
  if (findToolbarButton(KW.cancel)) return true;
  const main = document.querySelector("main") || document.body;
  return queryVisible('[role="checkbox"]', main).some((cb) => {
    const label = (cb.getAttribute("aria-label") || "").toLowerCase();
    return /select|auswählen|sélectionner|seleccionar|seleziona/.test(label);
  });
}

export async function enterClaudeRecentsSelectMode() {
  if (isClaudeRecentsSelectMode()) return true;
  return clickKeywords(KW.selectChats, { timeout: 10000 });
}

/** Select all rows — toolbar button, or tick every recents checkbox. */
export async function claudeRecentsSelectAll() {
  if (await clickKeywords(KW.selectAll, { timeout: 4000 })) return true;

  const main = document.querySelector("main") || document.body;
  const boxes = queryVisible('[role="checkbox"]', main);
  if (!boxes.length) return false;

  for (const cb of boxes) {
    if (cb.getAttribute("aria-checked") !== "true" && !cb.checked) cb.click();
    await sleep(120);
  }
  return true;
}

/** Enabled bulk-delete in recents toolbar (not overflow menuitem). */
export function findClaudeRecentsBulkDelete() {
  const cancel = findToolbarButton(KW.cancel);
  if (!cancel) return findToolbarButton(KW.delete);

  const toolbar =
    cancel.closest('[role="toolbar"]') ||
    cancel.parentElement?.parentElement ||
    document;
  return queryClickables(toolbar).find((el) => {
    if (el.disabled) return false;
    const hay = elementText(el);
    return KW.delete.some((k) => hay === norm(k) || hay.includes(norm(k)));
  }) ?? null;
}

/** Delete action inside open overflow menu ([role=menuitem]). */
export function findOpenMenuDeleteItem() {
  const menu =
    document.querySelector('[role="menu"]') ||
    document.querySelector('[data-radix-menu-content]');
  const root = menu || document;
  const items = [...root.querySelectorAll('[role="menuitem"]')].filter(isVisible);
  return items.find((el) => matchesKeywords(el, KW.delete)) ?? findByKeywords(KW.delete, root);
}

/** My Activity per-item delete (not the bulk toolbar dropdown). */
const MYACTIVITY_ITEM_DELETE_ARIA =
  /^(aktivitätselement löschen|delete activity|eliminar actividad|supprimer l.activit)/i;

export function findMyActivityBulkDeleteDropdown(root = document) {
  return (
    queryVisible("button", root).find((b) => {
      const aria = b.getAttribute("aria-label") || "";
      if (MYACTIVITY_ITEM_DELETE_ARIA.test(aria)) return false;
      if (aria.toLowerCase().includes("aktivitäten vom heute")) return false;
      const text = (b.textContent || "").trim();
      if (/^(löschen|delete|supprimer|eliminar)$/i.test(text) && text === aria.trim()) {
        return true;
      }
      return (
        text.length <= 12 &&
        KW.delete.some((k) => norm(text) === norm(k) && norm(aria) === norm(k))
      );
    }) ?? null
  );
}

export function countMyActivityItems(root = document) {
  return queryVisible("button", root).filter((b) =>
    MYACTIVITY_ITEM_DELETE_ARIA.test(b.getAttribute("aria-label") || "")
  ).length;
}

export function findMyActivityItemDeleteButton(root = document) {
  return (
    queryVisible("button", root).find((b) =>
      MYACTIVITY_ITEM_DELETE_ARIA.test(b.getAttribute("aria-label") || "")
    ) ?? null
  );
}

/** Bulk dropdown: Gesamte Zeit / All time / Heute — [role=menuitem] or visible text. */
export async function pickMyActivityDeleteRange() {
  const labels = [
    "Gesamte Zeit",
    "All time",
    "All Time",
    "Toute la période",
    "Todo el tiempo",
    "Alle Aktivitäten vom Heute löschen",
    "Alle Aktivitäten vom Heute löschen.",
    "Delete all activity from today",
    "Letzter Tag",
    "Last day",
  ];
  if (await clickVisibleExactText(labels, { timeout: 8000 })) return true;
  if (await clickKeywords(KW.allTime, { timeout: 5000 })) return true;
  if (
    await clickKeywords(
      ["alle aktivitäten vom heute", "all activity from today", "delete all activity from today"],
      { timeout: 4000 }
    )
  ) {
    return true;
  }
  for (const el of document.querySelectorAll('[role="menuitem"]')) {
    if (!isVisible(el)) continue;
    const t = norm(el.textContent || "");
    if (
      KW.allTime.some((k) => t === norm(k) || t.includes(norm(k))) ||
      t.includes("heute") ||
      t.includes("today")
    ) {
      el.click();
      await sleep(450);
      return true;
    }
  }
  return false;
}

/** My Activity confirm modal — delete button, not cancel or per-item label. */
export function findMyActivityConfirmDelete() {
  const inDialog = document.querySelector('[role="dialog"]') || document;
  return (
    queryVisible("button", inDialog).find((b) => {
      const t = (b.textContent || "").trim();
      const aria = (b.getAttribute("aria-label") || "").toLowerCase();
      if (aria.includes("abbrechen") || aria.includes("cancel")) return false;
      if (MYACTIVITY_ITEM_DELETE_ARIA.test(b.getAttribute("aria-label") || "")) return false;
      return (
        (/^(löschen|delete|supprimer|eliminar)$/i.test(t) &&
          !aria.includes("aktivitätselement")) ||
        matchesKeywords(b, KW.delete)
      );
    }) ?? null
  );
}

export function countGeminiSidebarChats(root = document) {
  return findGeminiSidebarChatLinks(root).length;
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

/** Claude sidebar/recents: ⋮ → Löschen per row (language-neutral aria + menuitem). */
export async function clickClaudeOverflowDeletes({ max = 120, delayMs = 500 } = {}) {
  let deleted = 0;
  for (let i = 0; i < max; i++) {
    const menus = findClaudeOverflowButtons();
    if (!menus.length) break;

    menus[0].click();
    await sleep(350);
    const del = findOpenMenuDeleteItem();
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

/** Click first visible element whose trimmed text exactly matches (DE/EN). */
export async function clickVisibleExactText(texts, { timeout = 10000 } = {}) {
  const want = texts.map((t) => norm(t));
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const el of document.querySelectorAll(
      'li, [role="menuitem"], [role="option"], button, a, span, div'
    )) {
      if (!isVisible(el)) continue;
      const t = norm(el.textContent || "");
      if (want.some((w) => t === w)) {
        el.click();
        await sleep(450);
        return true;
      }
    }
    await sleep(200);
  }
  return false;
}

export function findByAriaIncludes(fragment, root = document) {
  const needle = fragment.toLowerCase();
  for (const el of root.querySelectorAll("[aria-label]")) {
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    if (aria.includes(needle) && isVisible(el)) return el;
  }
  return null;
}

export function queryVisible(selector, root = document) {
  return [...root.querySelectorAll(selector)].filter(isVisible);
}

/** Live chatgpt.com: aria "Open conversation options for …" (often EN even on DE UI). */
const CHATGPT_CONV_OPTIONS_ARIA =
  /conversation options?\s+(for|für|pour|para)\b|unterhaltungsoptionen\s+(für|for)\b|options?\s+de\s+(la\s+)?conversation/i;

const CHATGPT_DELETE_ALL_ARIA =
  /delete\s+all.*chat|alle\s+löschen.*chat|supprimer\s+tout|eliminar\s+tod[oa]s/i;

export function chatGptHistoryNav(root = document) {
  return (
    root.querySelector('nav[aria-label*="Chat history" i]') ||
    root.querySelector('nav[name="Chat history" i]') ||
    root.querySelector('nav[aria-label*="Chatverlauf" i]') ||
    root.querySelector("nav")
  );
}

/** Primary: data-testid history-item-N-options; fallback aria pattern (excludes Pin). */
export function findChatGptConversationOptionsButton(root = document) {
  const nav = chatGptHistoryNav(root);
  const byTestId = queryVisible('button[data-testid$="-options"]', nav)[0];
  if (byTestId) return byTestId;

  return (
    queryVisible("button", nav).find((b) => {
      const aria = b.getAttribute("aria-label") || "";
      if (/^pin\b/i.test(aria)) return false;
      return CHATGPT_CONV_OPTIONS_ARIA.test(aria);
    }) ?? null
  );
}

/** Settings → Data controls bulk delete (hash #settings/DataControls is language-neutral). */
export function findChatGptSettingsBulkDelete(root = document) {
  const dialog = root.querySelector('[role="dialog"]') || root;
  const byTestId = queryVisible(
    'button[data-testid*="delete-all" i], button[data-testid*="delete_all" i]',
    dialog
  )[0];
  if (byTestId) return byTestId;

  return (
    queryVisible("button", dialog).find((b) => {
      const aria = (b.getAttribute("aria-label") || "").toLowerCase();
      if (CHATGPT_DELETE_ALL_ARIA.test(aria)) return true;
      return KW.deleteAll.some(
        (k) => aria.includes(norm(k)) && /chat|unterhaltung|conversation/.test(aria)
      );
    }) ?? null
  );
}

export function countChatGptNavChats(root = document) {
  const ids = new Set();
  const nav = chatGptHistoryNav(root);
  for (const a of nav.querySelectorAll('a[href*="/c/"], [data-testid^="history-item"] a')) {
    const match = a.href?.match(/\/c\/([a-f0-9-]+)/i);
    if (match) ids.add(match[1]);
  }
  return ids.size;
}

/** Live X/Grok history row: exact "Mehr" — not "Mehr Menübefehle". */
export function isExactMoreButton(el) {
  const text = (el.textContent || "").trim();
  const aria = (el.getAttribute("aria-label") || "").trim();
  return text === "Mehr" || text === "More" || aria === "Mehr" || aria === "More";
}

/** Live x.com/i/grok: panel with "Grok-Verlauf durchsuchen" search field. */
export function findGrokXHistoryRoot() {
  const search = document.querySelector(
    'input[placeholder*="Grok-Verlauf" i], input[aria-label*="Grok-Verlauf" i], input[placeholder*="Grok history" i], input[aria-label*="Grok history" i], input[placeholder*="historique Grok" i], input[aria-label*="historique Grok" i]'
  );
  if (!search) return null;
  return (
    search.closest('[role="dialog"]') ||
    search.closest("section") ||
    search.parentElement?.parentElement?.parentElement
  );
}

/** x.com/settings/grok_settings — bulk delete conversation log. */
export function findGrokXSettingsDeleteButton(root = document) {
  return (
    queryVisible("button", root).find((b) => {
      const hay = elementText(b);
      return (
        /konversationsprotokoll\s+löschen|delete conversation log|conversation log/i.test(hay) ||
        KW.deleteAll.some((k) => hay.includes(norm(k)))
      );
    }) ?? null
  );
}

export function countGrokXHistoryItems(root = findGrokXHistoryRoot()) {
  if (!root) return 0;
  return queryVisible("button", root).filter(isExactMoreButton).length;
}

export function findGrokXHistoryMehr(root = findGrokXHistoryRoot()) {
  if (!root) return null;
  return queryVisible("button", root).find(isExactMoreButton) ?? null;
}

/** Live grok.com: header ⋮ in main — not sidebar "Mehr". */
export function findGrokComHeaderMore() {
  const main = document.querySelector("main") || document.body;
  const inMain = queryVisible("button", main).filter(isExactMoreButton);
  if (inMain.length) return inMain[0];
  const share = queryVisible("button").find((b) =>
    /freigabelink|share link/i.test(b.getAttribute("aria-label") || "")
  );
  if (share?.parentElement) {
    const near = queryVisible("button", share.parentElement.parentElement || share.parentElement);
    const mehr = near.find(isExactMoreButton);
    if (mehr) return mehr;
  }
  return queryVisible("button").find(isExactMoreButton) ?? null;
}

/** Live grok.com: unique /c/{uuid} links in sidebar Verlauf. */
export function findGrokComSidebarChatLinks(root = document) {
  const seen = new Set();
  const links = [];
  for (const a of root.querySelectorAll('a[href*="/c/"]')) {
    const match = a.href.match(/\/c\/([0-9a-f-]{36})/i);
    if (!match || seen.has(match[1]) || !isVisible(a)) continue;
    seen.add(match[1]);
    links.push(a);
  }
  return links;
}

export function countGrokComSidebarChats(root = document) {
  return findGrokComSidebarChatLinks(root).length;
}

/** Sidebar row ⋮ — aria "Optionen" / "Options" (revealed on hover). */
export function findGrokComSidebarOptionsButton(row) {
  if (!row) return null;
  return (
    queryVisible("button", row).find((b) => {
      const aria = (b.getAttribute("aria-label") || "").trim();
      return /^(optionen|options)$/i.test(aria);
    }) ?? null
  );
}
