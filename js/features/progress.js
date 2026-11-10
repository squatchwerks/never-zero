// features/progress.js — the 8-week grid on the Progress tab.
// One row per week (oldest at the top), one square per day, colored by
// movement tier, with the week's counted days on the right.
// Tapping a past day opens it on the Today tab, to view or change it.

import { el, append } from "../dom.js";
import * as storage from "../storage.js";
import { select } from "../selection.js";
import { todayKey, ymd, addDays, monday, short, WEEKDAY_LETTERS } from "../dates.js";
import { tierOf, TIER_NAMES } from "../scoring.js";

const WEEKS = 8;
const ui = {};

export default {
  id: "progress",
  tab: "progress",

  init(root) {
    ui.grid = el("div", "grid");
    const legend = el("div", "legend");
    [["t1", "Minimum"], ["t2", "Normal"], ["t3", "Good"], ["", "Not logged"]].forEach(([cls, label]) => {
      legend.appendChild(append(el("span"), el("i", `pip ${cls}`.trim()), document.createTextNode(label)));
    });
    root.appendChild(
      append(
        el("div", "card"),
        el("h2", null, `Last ${WEEKS} weeks`),
        ui.grid,
        legend,
        el("p", "small muted", "Tap any past day to log or change it."),
      ),
    );
  },

  render() {
    const today = todayKey();
    const days = storage.getDays();
    const g = ui.grid;
    g.textContent = "";

    // header row: blank corner, M T W T F S S, blank
    g.appendChild(el("span"));
    WEEKDAY_LETTERS.forEach((x) => g.appendChild(el("span", "hd", x)));
    g.appendChild(el("span"));

    const thisMonday = monday(new Date());
    for (let w = WEEKS - 1; w >= 0; w--) {
      const start = addDays(thisMonday, -7 * w);
      let counted = 0;
      g.appendChild(el("span", "wk", short(start)));
      for (let i = 0; i < 7; i++) {
        const d = addDays(start, i);
        const key = ymd(d);
        const tier = tierOf(days[key]);
        if (tier) counted++;
        const cell = el("button", "cell" + (tier ? ` t${tier}` : ""));
        cell.type = "button";
        cell.disabled = key > today;
        cell.setAttribute("aria-label", `${short(d)}, ${TIER_NAMES[tier]}`);
        cell.addEventListener("click", () => {
          select(key);
          location.hash = "today";
        });
        g.appendChild(cell);
      }
      g.appendChild(el("span", "ct", counted));
    }
  },
};
