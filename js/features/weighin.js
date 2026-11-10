// features/weighin.js — "Weigh-in" card on the Today tab: optional weight and
// a short note for the selected day. Both save when you leave the field
// (the "change" event), not on every keystroke.

import { el, append } from "../dom.js";
import * as storage from "../storage.js";
import { getSelected } from "../selection.js";
import { setStatus } from "../status.js";
import { WEIGHT_MIN_LB, WEIGHT_MAX_LB } from "../../data/goals.js";

const ui = {};

export default {
  id: "weighin",
  tab: "today",

  init(root) {
    ui.weight = el("input");
    Object.assign(ui.weight, {
      type: "number", inputMode: "decimal", step: "0.1",
      min: WEIGHT_MIN_LB, max: WEIGHT_MAX_LB, placeholder: "e.g. 229.4",
    });
    ui.weight.addEventListener("change", saveWeight);

    ui.note = el("textarea");
    Object.assign(ui.note, { rows: 2, maxLength: 400, placeholder: "What made today easy or hard?" });
    ui.note.addEventListener("change", () => storage.saveDay(getSelected(), { note: ui.note.value.trim() || null }));

    root.appendChild(
      append(
        el("div", "card"),
        el("p", "label", "Weigh-in"),
        append(el("label", "field"), el("span", "label", "Weight (lb), optional"), ui.weight),
        append(el("label", "field"), el("span", "label", "Note, optional"), ui.note),
      ),
    );
  },

  render() {
    const day = storage.getDay(getSelected()) || {};
    // Don't overwrite what you're typing if a redraw happens mid-edit.
    if (document.activeElement !== ui.weight) ui.weight.value = day.weight ?? "";
    if (document.activeElement !== ui.note) ui.note.value = day.note || "";
  },
};

function saveWeight() {
  const raw = ui.weight.value.trim();
  if (raw === "") {
    storage.saveDay(getSelected(), { weight: null });
    return;
  }
  const v = parseFloat(raw);
  if (!(v >= WEIGHT_MIN_LB && v <= WEIGHT_MAX_LB)) {
    setStatus(`Weight should be between ${WEIGHT_MIN_LB} and ${WEIGHT_MAX_LB} lb.`, true);
    return;
  }
  storage.saveDay(getSelected(), { weight: Math.round(v * 10) / 10 });
}
