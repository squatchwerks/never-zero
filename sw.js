// sw.js — the service worker. It runs in the background, separate from the page,
// and sits between the app and the network. Its job: keep a copy of every app
// file on the phone so Never Zero opens instantly and works offline.
//
// ┌────────────────────────────────────────────────────────────────────────┐
// │ BUMP CACHE_VERSION ON EVERY RELEASE.                                    │
// │ The phone serves files from this cache. A new version number is what   │
// │ makes it throw the old copy away and download the new files.           │
// └────────────────────────────────────────────────────────────────────────┘
const CACHE_VERSION = "v1";
const CACHE = `never-zero-${CACHE_VERSION}`;

// Every file the app needs to start. Add new files here when you create them.
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/base.css",
  "./css/tabs.css",
  "./css/cards.css",
  "./js/main.js",
  "./js/router.js",
  "./js/dom.js",
  "./js/features/today.js",
  "./js/features/progress.js",
  "./js/features/plans.js",
  "./js/features/rules.js",
  "./data/rules.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

// 1. install: download every app file into a fresh cache.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()), // take over without waiting for the app to fully close
  );
});

// 2. activate: delete caches from older versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 3. fetch: answer every request the app makes.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: use the saved copy if we have one, and save it the first time.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Anything else from another site: leave it alone.
  if (url.origin !== self.location.origin) return;

  // Opening the app (or a page link while offline): always answer with index.html.
  if (req.mode === "navigate") {
    event.respondWith(caches.match("./index.html").then((hit) => hit || fetch(req)));
    return;
  }

  // App files: cache first, network as a backup.
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  // Save good responses (opaque = cross-origin font files, which are fine to keep).
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}
