// features/progress.js — the Progress tab.
// Slice 1: placeholder. Slice 3 adds the 8-week grid and the weight trend chart.

import { el, append } from "../dom.js";

export default {
  id: "progress",
  tab: "progress",

  init(root) {
    root.appendChild(
      append(
        el("div", "card"),
        el("h2", null, "Last 8 weeks"),
        el("p", "muted", "Your week grid and weight trend will show up here once check-ins are in."),
      ),
    );
  },

  render() {},
};
