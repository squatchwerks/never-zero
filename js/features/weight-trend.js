// features/weight-trend.js — "Weight, weekly average" chart on the Progress tab.
//
// Day-to-day weight swings with water and salt, so the chart plots one point
// per week: the average of that week's weigh-ins. It's drawn as SVG, which is
// vector graphics described in markup, so it stays sharp at any size.

import { el, append } from "../dom.js";
import * as storage from "../storage.js";
import { ymd, addDays, monday, short } from "../dates.js";
import { WEIGHT_GOAL_LB } from "../../data/goals.js";

const WEEKS = 8;
const NS = "http://www.w3.org/2000/svg";
const ui = {};

export default {
  id: "weight-trend",
  tab: "progress",

  init(root) {
    ui.chart = el("div", "chart");
    ui.note = el("p", "small muted");
    root.appendChild(append(el("div", "card"), el("h2", null, "Weight, weekly average"), ui.chart, ui.note));
  },

  render() {
    const weeks = weeklyAverages(storage.getDays());
    const points = weeks.map((w, i) => ({ i, v: w.avg })).filter((p) => p.v != null);
    ui.chart.textContent = "";

    if (points.length < 2) {
      ui.note.textContent =
        `Weigh in two or three times a week (on the Today tab). The trend line appears once two weeks have a weigh-in. Goal: ${WEIGHT_GOAL_LB} lb.`;
      return;
    }
    ui.chart.appendChild(drawChart(points, weeks));
    ui.note.textContent = `Each point is one week's average, in pounds. Goal: ${WEIGHT_GOAL_LB} lb.`;
  },
};

/** The last 8 weeks, oldest first: [{ start: Date, avg: number | null }]. */
function weeklyAverages(days) {
  const thisMonday = monday(new Date());
  const weeks = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const start = addDays(thisMonday, -7 * w);
    const values = [];
    for (let i = 0; i < 7; i++) {
      const weight = days[ymd(addDays(start, i))]?.weight;
      if (weight != null) values.push(Number(weight));
    }
    weeks.push({ start, avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null });
  }
  return weeks;
}

function drawChart(points, weeks) {
  // Chart box in SVG units; the SVG scales to the card's width.
  const W = 320, H = 140, L = 16, R = 16, T = 28, B = 26;
  const values = points.map((p) => p.v);
  const lo = Math.min(...values) - 1;
  const hi = Math.max(...values) + 1;
  const X = (i) => L + (i * (W - L - R)) / (WEEKS - 1);
  const Y = (v) => T + ((hi - v) * (H - T - B)) / (hi - lo);

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label",
    `Weekly average weight, ${values[0].toFixed(1)} to ${values[values.length - 1].toFixed(1)} pounds`);
  const add = (tag, attrs, parent = svg) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    parent.appendChild(node);
    return node;
  };

  // gradients: the line goes cyan → violet → coral; the fill fades out downward
  const defs = add("defs", {});
  const line = add("linearGradient", { id: "wt-line", x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
  add("stop", { offset: "0", "stop-color": "#22D3EE" }, line);
  add("stop", { offset: ".6", "stop-color": "#8B7BFF" }, line);
  add("stop", { offset: "1", "stop-color": "#FF6B8B" }, line);
  const fill = add("linearGradient", { id: "wt-fill", x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
  add("stop", { offset: "0", "stop-color": "#22D3EE", "stop-opacity": ".28" }, fill);
  add("stop", { offset: "1", "stop-color": "#22D3EE", "stop-opacity": "0" }, fill);

  const coords = points.map((p) => `${X(p.i)},${Y(p.v)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  add("polygon", { points: `${X(first.i)},${H - B} ${coords} ${X(last.i)},${H - B}`, fill: "url(#wt-fill)" });
  add("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, stroke: "rgba(255,255,255,.16)", "stroke-width": 1 });
  add("polyline", { points: coords, fill: "none", stroke: "url(#wt-line)", "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" });

  // dots, with the first and latest values labeled
  points.forEach((p, n) => {
    const isLast = n === points.length - 1;
    if (isLast) add("circle", { cx: X(p.i), cy: Y(p.v), r: 9, fill: "rgba(255,107,139,.25)" });
    add("circle", { cx: X(p.i), cy: Y(p.v), r: isLast ? 4.5 : 3, fill: "#EEF4FF" });
    if (n === 0 || isLast) {
      const anchor = p.i < 1 ? "start" : p.i > WEEKS - 2 ? "end" : "middle";
      add("text", { x: X(p.i), y: Y(p.v) - 12, fill: "#EEF4FF", "font-size": 12, "font-weight": 600, "text-anchor": anchor })
        .textContent = p.v.toFixed(1);
    }
  });

  add("text", { x: L, y: H - 8, fill: "rgba(226,235,255,.68)", "font-size": 11, "text-anchor": "start" })
    .textContent = `Week of ${short(weeks[0].start)}`;
  add("text", { x: W - R, y: H - 8, fill: "rgba(226,235,255,.68)", "font-size": 11, "text-anchor": "end" })
    .textContent = "This week";
  return svg;
}
