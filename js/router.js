// router.js — turns the URL hash (#today, #progress, …) into "which tab is showing".
//
// Why the hash? Changing it never reloads the page, the Back gesture works,
// and it needs no server setup, which matters on GitHub Pages.

import { el } from "./dom.js";

/**
 * Build one <section> per tab plus the tab bar, then keep them in sync with the hash.
 * @param {object}   opts
 * @param {Array<{id:string,label:string}>} opts.tabs  tab list, in display order
 * @param {Element}  opts.viewsRoot   where the <section>s go
 * @param {Element}  opts.navRoot     where the tab links go
 * @param {(tabId:string)=>void} opts.onShow  called every time a tab is shown
 * @returns {{sections: Record<string, Element>, current: ()=>string, start: ()=>void}}
 *   Call start() once the features have built their DOM, to show the first tab.
 */
export function createRouter({ tabs, viewsRoot, navRoot, onShow }) {
  const ids = tabs.map((t) => t.id);
  const sections = {};
  const links = {};

  for (const tab of tabs) {
    const section = el("section", "view");
    section.id = "view-" + tab.id;
    section.hidden = true;
    section.setAttribute("aria-label", tab.label);
    viewsRoot.appendChild(section);
    sections[tab.id] = section;

    const link = el("a", null, tab.label);
    link.href = "#" + tab.id;
    navRoot.appendChild(link);
    links[tab.id] = link;
  }

  let current = null;

  function show() {
    let id = location.hash.slice(1);
    if (!ids.includes(id)) id = ids[0];     // unknown or empty hash -> first tab
    current = id;
    for (const t of ids) {
      sections[t].hidden = t !== id;
      if (t === id) links[t].setAttribute("aria-current", "page");
      else links[t].removeAttribute("aria-current");
    }
    window.scrollTo(0, 0);
    onShow(id);
  }

  function start() {
    window.addEventListener("hashchange", show);
    show();
  }

  return { sections, current: () => current, start };
}
