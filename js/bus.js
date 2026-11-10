// bus.js — a tiny "something changed" announcer.
//
// storage.js and selection.js call emit() after a change; main.js listens with
// on() and tells the features to redraw. Neither side has to import the other,
// which keeps the files independent.
//
// A change is a small object describing what happened, for example:
//   { type: "day", date: "2026-11-09" }   a check-in was saved
//   { type: "settings" }                  targets or lifts changed
//   { type: "import" }                    a backup was loaded
//   { type: "select", date: "…" }         a different day was picked

const listeners = new Set();

/** Listen for changes. Returns a function that stops listening. */
export function on(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Announce a change to every listener. */
export function emit(change) {
  for (const fn of listeners) {
    try {
      fn(change);
    } catch (err) {
      console.error("[bus listener]", err);
    }
  }
}
