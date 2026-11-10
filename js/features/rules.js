// features/rules.js — the Rules tab. Static text from data/rules.js,
// so everything happens in init() and render() has nothing to refresh.

import { el, append } from "../dom.js";
import { RULES, RESTARTING, HABITS, HABITS_NOTE } from "../../data/rules.js";

export default {
  id: "rules",
  tab: "rules",

  init(root) {
    const ol = el("ol", "rules");
    RULES.forEach((text) => ol.appendChild(el("li", null, text)));
    root.appendChild(append(el("div", "card"), el("h2", null, "The rules"), ol));

    const restart = append(el("div", "card"), el("h2", null, "Restarting"));
    RESTARTING.forEach((text) => restart.appendChild(el("p", null, text)));
    root.appendChild(restart);

    const dl = el("dl", "costs");
    HABITS.forEach((h, i) => {
      dl.appendChild(append(el("div"), el("dt", null, `${i + 1}. ${h.title}`), el("dd", null, h.cost)));
    });
    root.appendChild(
      append(el("div", "card"), el("h2", null, "Habits, biggest first"), dl, el("p", "small muted", HABITS_NOTE)),
    );
  },

  render() {},
};
