/** In-page: delete all sidebar chats via overflow menu (dom-sidebar method). */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => (s || "").toLowerCase().trim();
  const overflowRe = /weitere optionen|more options|options pour/i;

  function sidebarLinks() {
    const nav =
      document.querySelector('nav[aria-label*="Seitliche" i], nav[aria-label*="Sidebar" i]') ||
      document;
    const seen = new Set();
    const links = [];
    for (const a of nav.querySelectorAll('a[href*="/app/"]')) {
      const m = a.href.match(/\/app\/([a-zA-Z0-9_-]+)/);
      if (!m || seen.has(m[1])) continue;
      if (/signout|options|search/i.test(m[1])) continue;
      if (!/^[a-z0-9_]{8,}$/i.test(m[1])) continue;
      seen.add(m[1]);
      links.push(a);
    }
    return links;
  }

  function menuDelete() {
    const menu = document.querySelector('[role="menu"]');
    if (!menu) return null;
    return [...menu.querySelectorAll('[role="menuitem"]')].find((el) =>
      norm(el.textContent).includes("löschen") || norm(el.textContent) === "delete"
    );
  }

  function dialogDelete() {
    const dlg = document.querySelector('[role="dialog"]') || document;
    return [...dlg.querySelectorAll("button")].find((b) => {
      const t = norm(b.textContent);
      return (t === "löschen" || t === "delete") && !norm(b.getAttribute("aria-label")).includes("abbrechen");
    });
  }

  let deleted = 0;
  for (let i = 0; i < 20; i++) {
    const links = sidebarLinks();
    if (!links.length) break;
    const link = links[0];
    const row =
      link.closest("gem-nav-list-item") ||
      link.closest("GEM-NAV-LIST-ITEM") ||
      link.parentElement;
    link.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    row?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await sleep(300);
    const btn = [...(row || document).querySelectorAll("button")].find((b) =>
      overflowRe.test(b.getAttribute("aria-label") || "")
    );
    if (!btn) return { ok: false, error: "no overflow", deleted, remaining: links.length };
    btn.click();
    await sleep(400);
    const del = menuDelete();
    if (!del) return { ok: false, error: "no menu delete", deleted, remaining: links.length };
    del.click();
    await sleep(500);
    const confirm = dialogDelete();
    if (!confirm) return { ok: false, error: "no dialog confirm", deleted, remaining: links.length };
    confirm.click();
    await sleep(1200);
    deleted++;
  }
  const remaining = sidebarLinks().length;
  return { ok: remaining === 0, deleted, remaining, method: "dom-sidebar" };
})();
