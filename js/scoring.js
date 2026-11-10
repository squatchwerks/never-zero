// scoring.js — the rules that turn day records into scores.
// Pure functions: they take data in and return answers, and never touch the
// page or storage, which makes them easy to read and to change.

/** Movement tier for a day record: 0 not logged, 1 Minimum, 2 Normal, 3 Good. */
export function tierOf(day) {
  return day && day.tier > 0 ? day.tier : 0;
}

/**
 * Food score for a day record: 0 Off plan, 1 Minimum, 2 Normal, 3 Good,
 * or -1 when food wasn't logged. (Old records used `protein: true` before
 * food had its own score; those count as Minimum.)
 */
export function foodOf(day) {
  if (!day) return -1;
  if (typeof day.food === "number" && day.food >= 0 && day.food <= 3) return day.food;
  return day.protein ? 1 : -1;
}

/** A day "counts" when any movement happened. Food never decides this. */
export const counts = (day) => tierOf(day) > 0;

export const TIER_NAMES = ["not logged", "minimum", "normal", "good"];
export const FOOD_NAMES = ["not logged", "off plan", "minimum", "normal", "good"]; // index with foodOf(day) + 1

/** Weekly targets from the rules: 5 counted days, 2–3 of them normal or better. */
export const WEEK_TARGET = 5;
