// storage.js — the ONLY file that knows where data lives.
//
// Right now that's localStorage: a small key/value store inside the browser,
// on this one device. Features never touch localStorage directly; they call
// the functions below. Later, cloud sync can be added by changing just this
// file, and no feature needs to know.
//
// Data shapes
//   day record (one per date):
//     { date: "2026-11-09", tier: 0-3, cardio, strength, food: 0-3, foods: [],
//       weight, note, af, health, protein }   (every field except date is optional)
//   settings:
//     { kcal: 2100, protein: 180, lifts: { squat: {w, r}, … } }

import { emit } from "./bus.js";
import { isDateKey } from "./dates.js";

const DAYS_KEY = "never-zero-days";
const SETTINGS_KEY = "never-zero-settings";
const NOTE_MAX = 400;
const FOODS_MAX = 12;

export const DEFAULT_SETTINGS = Object.freeze({ kcal: 2100, protein: 180, lifts: {} });

// An in-memory copy, loaded once at startup, so reads are instant.
// Every save updates this copy AND writes it back to localStorage.
let days = readJSON(DAYS_KEY) || {};
let settings = readJSON(SETTINGS_KEY) || {};

// ─── reading ──────────────────────────────────────────────────────────────

/** One day's record (a copy), or null if nothing is logged for that date. */
export function getDay(date) {
  return days[date] ? clone(days[date]) : null;
}

/** Every day record, as { "2026-11-09": {…}, … } (a copy). */
export function getDays() {
  return clone(days);
}

/** Settings with defaults filled in for anything not set yet. */
export function getSettings() {
  return { ...clone(DEFAULT_SETTINGS), ...clone(settings) };
}

// ─── writing ──────────────────────────────────────────────────────────────

/**
 * Change some fields of one day. Fields you leave out are kept.
 * Set a field to null to remove it: saveDay(d, { weight: null }).
 * Returns true if it was saved to the device, false if saving failed.
 */
export function saveDay(date, patch) {
  if (!isDateKey(date)) throw new Error(`saveDay: bad date "${date}"`);
  const next = tidyDay({ ...days[date], ...patch, date });
  if (next) days[date] = next;
  else delete days[date]; // nothing left but the date: drop the record

  const ok = writeJSON(DAYS_KEY, days);
  askToKeepData();
  emit({ type: "day", date, ok });
  return ok;
}

/** Change some settings. Set a field to null to go back to its default. */
export function saveSettings(patch) {
  const next = { ...settings, ...patch };
  for (const k of Object.keys(next)) if (next[k] == null) delete next[k];
  settings = next;
  const ok = writeJSON(SETTINGS_KEY, settings);
  emit({ type: "settings", ok });
  return ok;
}

// ─── backup: export / import ──────────────────────────────────────────────

/** Everything, as one object ready to save as a .json file. */
export function exportData() {
  return {
    app: "never-zero",
    version: 1,
    exportedAt: new Date().toISOString(),
    days: clone(days),
    settings: clone(settings),
  };
}

/**
 * Load a backup. Accepts any mix of:
 *   - a full backup from exportData()           { days: {…}, settings: {…} }
 *   - a single day record                       { date: "2026-11-09", tier: 2, … }
 *   - a list of day records                     [ {date…}, {date…} ]
 *   - a settings object                         { kcal, protein, lifts }
 * Pass one parsed file, or an array of them (several files picked at once).
 * Days in the backup replace the same dates on this device; other dates are kept.
 * With { dryRun: true } nothing is saved: use it to preview what an import would do.
 * Returns { days: number found, replaces: how many of those dates already have data,
 *           settings: boolean, skipped: number, ok }.
 */
export function importData(input, { dryRun = false } = {}) {
  const found = { days: {}, settings: null, skipped: 0 };
  const items = Array.isArray(input) ? input : [input];
  for (const item of items) collect(item, found);

  const dayCount = Object.keys(found.days).length;
  const replaces = Object.keys(found.days).filter((d) => days[d]).length;
  const summary = { days: dayCount, replaces, settings: !!found.settings, skipped: found.skipped };
  if (!dayCount && !found.settings) return { ...summary, ok: false };
  if (dryRun) return { ...summary, ok: true };

  days = { ...days, ...found.days };
  if (found.settings) settings = { ...settings, ...found.settings };
  const ok = writeJSON(DAYS_KEY, days) && writeJSON(SETTINGS_KEY, settings);
  askToKeepData();
  emit({ type: "import", ok });
  return { ...summary, ok };
}

// Sort one parsed thing into days / settings / skipped.
function collect(item, found) {
  if (Array.isArray(item)) {
    item.forEach((x) => collect(x, found));
  } else if (!isObject(item)) {
    found.skipped++;
  } else if (isObject(item.days)) {
    // full backup
    for (const [date, rec] of Object.entries(item.days)) {
      if (isDateKey(date) && isObject(rec)) {
        const d = tidyDay({ ...rec, date });
        if (d) found.days[date] = d;
      } else found.skipped++;
    }
    if (isObject(item.settings) && Object.keys(item.settings).length) collect(item.settings, found);
  } else if (isDateKey(item.date)) {
    // one day record
    const d = tidyDay(item);
    if (d) found.days[d.date] = d;
  } else {
    // maybe settings: keep only the fields we know
    const s = {};
    if (Number(item.kcal) > 0) s.kcal = Number(item.kcal);
    if (Number(item.protein) > 0) s.protein = Number(item.protein);
    if (isObject(item.lifts)) s.lifts = item.lifts;
    if (Object.keys(s).length) found.settings = { ...found.settings, ...s };
    else found.skipped++;
  }
}

// ─── internals ────────────────────────────────────────────────────────────

/** Clean a day record: drop empty fields, enforce limits. Returns null if empty. */
function tidyDay(rec) {
  const out = {};
  for (const [k, v] of Object.entries(rec)) if (v != null) out[k] = v;
  if (typeof out.note === "string") out.note = out.note.slice(0, NOTE_MAX);
  if (Array.isArray(out.foods)) out.foods = out.foods.slice(-FOODS_MAX);
  return Object.keys(out).length > 1 ? out : null; // more than just `date`
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    const val = raw ? JSON.parse(raw) : null;
    return isObject(val) ? val : null;
  } catch (err) {
    console.warn(`Couldn't read ${key}`, err);
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // usually: storage full, or Safari private browsing
    console.warn(`Couldn't save ${key}`, err);
    return false;
  }
}

// Ask the browser not to clear our data when the phone runs low on space.
// It may say no; that's fine, and it's why Export exists.
let asked = false;
function askToKeepData() {
  if (asked) return;
  asked = true;
  try {
    navigator.storage?.persist?.().catch(() => {});
  } catch {}
}

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}
