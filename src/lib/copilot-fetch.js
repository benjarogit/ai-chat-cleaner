/**
 * GitHub patches window.fetch on github.com/copilot. A hidden iframe keeps native fetch
 * for api.individual.githubcopilot.com (live-probed; works without extension).
 */
let iframe = null;
let nativeFetch = null;

function ensureNativeFetch() {
  if (nativeFetch) return nativeFetch;
  iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);
  nativeFetch = iframe.contentWindow.fetch.bind(iframe.contentWindow);
  return nativeFetch;
}

export function createCopilotFetch() {
  const nf = ensureNativeFetch();
  return (url, init) => nf(url, init);
}

export function disposeCopilotFetch() {
  if (iframe) {
    iframe.remove();
    iframe = null;
    nativeFetch = null;
  }
}
