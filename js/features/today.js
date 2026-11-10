// features/today.js — the Today tab.
// Slice 1: a placeholder card that proves the tab works.
// Slice 2 replaces this with the orb, week strip, tier buttons and chips.

import { el, append } from "../dom.js";

export default {
  id: "today",
  tab: "today",

  init(root) {
    root.appendChild(
      append(
        el("div", "notice"),
        el("h3", null, "The shell is installed"),
        el("p", "small", "Check-ins arrive in the next build: the orb, the week strip and the movement tiers."),
      ),
    );
  },

  render() {},
};
