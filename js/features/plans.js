// features/plans.js — the Plans tab.
// Slice 1: placeholder. Slice 6 renders the plans from data/plans.js.

import { el, append } from "../dom.js";

export default {
  id: "plans",
  tab: "plans",

  init(root) {
    root.appendChild(
      append(
        el("div", "card"),
        el("h2", null, "Plans"),
        el("p", "muted", "Lifting and cardio plans will appear on this tab."),
      ),
    );
  },

  render() {},
};
