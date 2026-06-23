import { sleep } from "./shared.js";

const DELETE_TEXTS = [
  "delete all",
  "delete all conversations",
  "delete conversation history",
  "clear all chats",
  "delete all chats",
  "alle löschen",
  "alle unterhaltungen löschen",
  "verlauf löschen",
  "löschen",
  "delete",
  "confirm",
  "bestätigen",
  "yes",
  "ja",
];

function isVisible(el) {
  if (!el || el.disabled) return false;
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
}

export function findClickableByText(texts, root = document) {
  const needles = texts.map((t) => t.toLowerCase());
  const candidates = root.querySelectorAll(
    "button, a, [role='button'], [role='menuitem'], input[type='button'], input[type='submit']"
  );

  for (const el of candidates) {
    if (!isVisible(el)) continue;
    const hay = `${el.textContent || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();
    if (needles.some((n) => hay.includes(n))) {
      return el;
    }
  }
  return null;
}

export async function clickByText(texts, { timeout = 15000, root = document } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = findClickableByText(texts, root);
    if (el) {
      el.click();
      await sleep(400);
      return true;
    }
    await sleep(250);
  }
  return false;
}

export async function clickAllMatching(texts, { max = 200, delayMs = 400 } = {}) {
  let clicked = 0;
  for (let i = 0; i < max; i++) {
    const el = findClickableByText(texts);
    if (!el) break;
    el.click();
    clicked++;
    await sleep(delayMs);
  }
  return clicked;
}

export async function confirmDialogs() {
  await clickByText(["confirm", "delete", "yes", "ok", "bestätigen", "ja", "löschen"], {
    timeout: 3000,
  });
}

export async function openUrlIfNeeded(urlPattern, targetUrl) {
  if (!urlPattern.test(location.href)) {
    location.href = targetUrl;
    await sleep(3000);
    return true;
  }
  return false;
}

export { DELETE_TEXTS };
