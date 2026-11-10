// main.js — the app's table of contents.
//
// It lists the tabs and the features, hands each feature a place to draw,
// and tells features when to redraw. It contains no feature logic itself.
//
// ─── The feature shape ────────────────────────────────────────────────────
// Every file in js/features/ default-exports an object like this:
//
//   export default {
//     id: "coach",          // unique name
//     tab: "today",         // which tab it lives on
//     init(root) {},        // once at startup: build your DOM inside `root`
//     render() {},          // redraw from current data (tab shown, data changed)
//     update(change) {},    // OPTIONAL: cheaper redraw for a data change;
//                           //           if missing, render() is used instead
//   };
//
// Adding a feature = create js/features/thing.js + add one line to FEATURES.
// Features on the same tab appear in the order they are listed.
// ──────────────────────────────────────────────────────────────────────────

import { createRouter } from "./router.js";
import { on } from "./bus.js";
import { setStatus } from "./status.js";
import { todayKey } from "./dates.js";
import { getSelected, selectToday } from "./selection.js";
import { startScene } from "./visuals/scene.js";

import today from "./features/today.js";
import progress from "./features/progress.js";
import plans from "./features/plans.js";
import rules from "./features/rules.js";
import backup from "./features/backup.js";

const TABS = [
  { id: "today", label: "Today" },
  { id: "progress", label: "Progress" },
  { id: "plans", label: "Plans" },
  { id: "rules", label: "Rules" },
];

const FEATURES = [
  today,
  progress,
  plans,
  rules,
  backup,
];

// ─── start up ─────────────────────────────────────────────────────────────

startScene(document.getElementById("bg"));

const { sections, current, start } = createRouter({
  tabs: TABS,
  viewsRoot: document.getElementById("views"),
  navRoot: document.getElementById("tabbar"),
  onShow: (tabId) => renderTab(tabId),
});

for (const f of FEATURES) {
  const root = sections[f.tab];
  if (!root) {
    console.warn(`Feature "${f.id}" wants tab "${f.tab}", which doesn't exist.`);
    continue;
  }
  safely(f, "init", root);
}
showDateline();
start(); // shows the tab named in the URL and renders its features

// When storage or the selected day changes, redraw.
on((change) => {
  if (change.ok === false) setStatus("Couldn't save on this device. Storage may be full.", true);
  notifyChange(change);
});

// The app can stay open overnight on a phone. When it comes back to the
// screen on a new day, move "today" forward.
let lastToday = todayKey();
document.addEventListener("visibilitychange", () => {
  if (document.hidden || todayKey() === lastToday) return;
  const wasOnToday = getSelected() === lastToday;
  lastToday = todayKey();
  showDateline();
  if (wasOnToday) selectToday(); // this also triggers a redraw
  else notifyChange({ type: "newday" });
});

/** Redraw every feature on one tab. */
function renderTab(tabId) {
  for (const f of FEATURES) if (f.tab === tabId) safely(f, "render");
}

/**
 * Tell features that something changed (see bus.js for the kinds of change).
 * Only the visible tab redraws now; the others redraw when they're shown.
 */
function notifyChange(change) {
  const tabId = current();
  for (const f of FEATURES) {
    if (f.tab !== tabId) continue;
    safely(f, typeof f.update === "function" ? "update" : "render", change);
  }
}

/** Run one feature method, so a bug in one feature can't break the others. */
function safely(feature, method, arg) {
  if (typeof feature[method] !== "function") return;
  try {
    feature[method](arg);
  } catch (err) {
    console.error(`[${feature.id}.${method}]`, err);
  }
}

function showDateline() {
  const now = new Date();
  document.getElementById("dateline").textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// ─── offline support ──────────────────────────────────────────────────────
// Register the service worker (sw.js), which caches the app so it opens
// without a connection. Skipped on file:// pages, where it isn't allowed.
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
