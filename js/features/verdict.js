// features/verdict.js — "Is it working?" on the Progress tab.
//
// Deliberately says nothing for the first three weeks: single days and single
// weeks are noise. After that, it reads the last 4 weeks of counted days and,
// if there are weigh-ins, compares this week's average weight to 3 weeks earlier.

import { el, append } from "../dom.js";
import * as storage from "../storage.js";
import { todayKey, parse, ymd, addDays, daysBetween } from "../dates.js";
import { tierOf } from "../scoring.js";

const ui = {};

export default {
  id: "verdict",
  tab: "progress",

  init(root) {
    ui.box = el("div", "verdict");
    root.appendChild(append(el("div", "card"), el("h2", null, "Is it working?"), ui.box));
  },

  render() {
    ui.box.textContent = "";
    for (const line of readOut(storage.getDays(), todayKey())) ui.box.appendChild(el("p", null, line));
  },
};

/** The verdict as a list of sentences. Pure: data in, words out. */
export function readOut(days, today) {
  const tracked = Object.keys(days).filter((k) => tierOf(days[k]) > 0 || days[k].weight != null).sort();
  if (!tracked.length) return ["Nothing logged yet. Check in for a few weeks and the read-out appears here."];

  const span = daysBetween(today, tracked[0]) + 1;
  if (span < 21) {
    return [`Day ${span} of tracking. The first read-out comes after three to four weeks, because single days and single weeks don't mean much.`];
  }

  const base = parse(today);
  const back = (n) => ymd(addDays(base, -n)); // the date n days before today
  const out = [];

  // movement: counted days per week over the last 4 weeks
  let counted = 0;
  for (let k = 0; k < 28; k++) if (tierOf(days[back(k)]) > 0) counted++;
  const perWeek = counted / 4;
  let move = `${perWeek.toFixed(1)} counted days a week over the last 4 weeks. `;
  if (perWeek < 3) move += "The minimum is too big for your life right now. Shrink it.";
  else if (perWeek < 5) move += "The habit is holding. Aim for 5.";
  else move += "This is working. Change nothing.";
  out.push(move);

  // weight: average of the last 7 days vs. days 21-27 ago
  const avg = (from, to) => {
    let sum = 0;
    let n = 0;
    for (let k = from; k <= to; k++) {
      const w = days[back(k)]?.weight;
      if (w != null) {
        sum += Number(w);
        n++;
      }
    }
    return n ? sum / n : null;
  };
  const now = avg(0, 6);
  const then = avg(21, 27);
  if (now == null || then == null) {
    out.push("Not enough weigh-ins to compare 4 weeks apart yet. Two or three a week is plenty.");
  } else {
    const change = now - then;
    if (Math.abs(change) < 1) out.push("Weight is flat across 4 weeks. Tighten one meal, not everything.");
    else if (change < 0) out.push(`Down ${Math.abs(change).toFixed(1)} lb across 4 weeks. The diet is doing its job.`);
    else out.push(`Up ${change.toFixed(1)} lb across 4 weeks. Tighten one meal, not everything.`);
  }
  return out;
}
