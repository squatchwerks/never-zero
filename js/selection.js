// selection.js — which day you're looking at.
//
// Today is selected by default. Tapping another day in the week strip (or,
// later, in the Progress grid) selects it, and every feature that shows
// "the selected day" redraws.

import { emit } from "./bus.js";
import { todayKey, isDateKey } from "./dates.js";

let selected = todayKey();

export const getSelected = () => selected;

export function select(date) {
  if (!isDateKey(date) || date > todayKey() || date === selected) return; // no future days
  selected = date;
  emit({ type: "select", date });
}

export const selectToday = () => select(todayKey());
