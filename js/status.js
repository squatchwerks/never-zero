// status.js — the short message line in the top-right of the header
// ("Imported 4 days", "Couldn't save…"). Any file can call setStatus().

let timer = 0;

/**
 * Show a message. bad = true shows it in the warning color.
 * Good news clears itself after a few seconds; warnings stay until replaced.
 */
export function setStatus(text, bad = false) {
  const node = document.getElementById("status");
  if (!node) return;
  clearTimeout(timer);
  node.textContent = text || "";
  node.classList.toggle("bad", !!bad);
  if (text && !bad) timer = setTimeout(() => setStatus(""), 4000);
}
