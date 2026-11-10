// dates.js — date helpers. Every day in the app is keyed by a "YYYY-MM-DD" string
// in local time, e.g. "2026-11-09". Strings in that format sort in date order,
// so "2026-11-03" < "2026-11-09" works as a comparison.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"]; // Monday first
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (n) => String(n).padStart(2, "0");

/** Date -> "2026-11-09" */
export function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-11-09" -> Date at local midnight */
export function parse(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Is this a valid "YYYY-MM-DD" string? */
export function isDateKey(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && ymd(parse(s)) === s;
}

export const todayKey = () => ymd(new Date());

export function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** The Monday on or before this date (weeks run Monday to Sunday). */
export function monday(d) {
  return addDays(d, -((d.getDay() + 6) % 7));
}

/** Whole days from b to a: daysBetween("2026-11-09", "2026-11-03") === 6 */
export function daysBetween(a, b) {
  return Math.round((parse(a) - parse(b)) / 864e5);
}

/** Date -> "Nov 9" */
export function short(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
