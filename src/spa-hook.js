/**
 * MAIN-world hook. Page scripts on x.com, GitHub, and Cursor call history.pushState
 * in this world; an isolated content script cannot see that binding.
 * Dispatches a DOM event the isolated content script listens for.
 */
(function accSpaHook() {
  const fire = () => window.dispatchEvent(new Event("acc-spa-navigate"));

  for (const name of ["pushState", "replaceState"]) {
    const original = history[name];
    if (typeof original !== "function") continue;
    history[name] = function (...args) {
      const result = original.apply(this, args);
      fire();
      return result;
    };
  }

  window.addEventListener("popstate", fire);
})();
