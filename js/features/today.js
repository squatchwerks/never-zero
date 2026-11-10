// features/today.js — the Today tab's main check-in:
//   - a restart notice after a gap (or a welcome on first use)
//   - the orb, charged by this week's counted days (X/7)
//   - the week strip, to pick a day
//   - the movement tier buttons and the Cardio / Strength tags
//
// It reads and writes only through storage.js and selection.js.

import { el, append } from "../dom.js";
import * as storage from "../storage.js";
import { getSelected, select, selectToday } from "../selection.js";
import { todayKey, parse, ymd, addDays, monday, daysBetween, short, WEEKDAYS, WEEKDAY_LETTERS } from "../dates.js";
import { tierOf, foodOf, TIER_NAMES, FOOD_NAMES, WEEK_TARGET } from "../scoring.js";
import { setEnergy, reducedMotion } from "../visuals/scene.js";
import { createOrb } from "../visuals/orb.js";
import { TIERS, MOVEMENT_TAGS } from "../../data/tiers.js";

// Elements built in init() and updated in render().
const ui = {};
let orb = null;

export default {
  id: "today",
  tab: "today",

  init(root) {
    // restart / welcome notice
    ui.notice = el("div", "notice");
    ui.noticeTitle = el("h3");
    ui.noticeText = el("p", "small");
    append(ui.notice, ui.noticeTitle, ui.noticeText);
    ui.notice.hidden = true;

    // orb + score
    const hero = el("div", "hero");
    const heroText = el("div", "hero-txt");
    ui.count = el("span", null, "0");
    append(heroText, append(el("div", "big"), ui.count, el("span", "of", "/7")), el("div", "label", "counted this week"));
    hero.appendChild(heroText);
    ui.score = el("p", "score small muted");
    const heroBlock = append(el("div"), hero, ui.score);

    // week strip
    ui.title = el("h2", null, "Today");
    ui.back = el("button", "linkbtn small", "Back to today");
    ui.back.type = "button";
    ui.back.addEventListener("click", selectToday);
    ui.week = el("div", "week");
    ui.health = el("p", "small muted");
    const weekCard = append(el("div", "card"), append(el("div", "row between"), ui.title, ui.back), ui.week, ui.health);

    // tiers + tags
    ui.tierLabel = el("p", "label");
    const tiers = el("div", "tiers");
    ui.tierButtons = TIERS.map(({ tier, name, desc }) => {
      const b = el("button", "tier");
      b.type = "button";
      append(b, el("i", `pip t${tier}`), append(el("span"), el("strong", null, name), el("span", "d", desc)));
      b.addEventListener("click", () => pickTier(tier));
      tiers.appendChild(b);
      return b;
    });
    const tags = el("div", "row");
    ui.tagButtons = MOVEMENT_TAGS.map(({ key, label }) => {
      const b = el("button", "chip", label);
      b.type = "button";
      b.addEventListener("click", () => {
        const date = getSelected();
        storage.saveDay(date, { [key]: !storage.getDay(date)?.[key] || null });
      });
      tags.appendChild(b);
      return b;
    });
    const tierCard = append(el("div", "card"), ui.tierLabel, tiers, tags);

    append(root, ui.notice, heroBlock, weekCard, tierCard);
    orb = createOrb(hero);
  },

  render() {
    const today = todayKey();
    const sel = getSelected();
    const isToday = sel === today;
    const selDate = parse(sel);
    const days = storage.getDays();

    ui.title.textContent = isToday ? "Today" : `${WEEKDAYS[selDate.getDay()]}, ${short(selDate)}`;
    ui.back.hidden = isToday;
    ui.tierLabel.textContent = isToday ? "Movement: which version happened?" : "Movement: which version happened that day?";

    // week strip, Monday to Sunday of the selected day's week
    ui.week.textContent = "";
    const start = monday(selDate);
    let counted = 0;
    let normalPlus = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const key = ymd(d);
      const tier = tierOf(days[key]);
      const food = foodOf(days[key]);
      if (tier > 0) counted++;
      if (tier > 1) normalPlus++;

      const b = el("button", "day");
      b.type = "button";
      b.disabled = key > today;
      b.setAttribute("aria-pressed", String(key === sel));
      b.setAttribute("aria-label", `${short(d)}, movement ${TIER_NAMES[tier]}, food ${FOOD_NAMES[food + 1]}`);
      append(b,
        el("span", "wd", WEEKDAY_LETTERS[i]),
        el("i", "pip" + (tier ? ` t${tier}` : "")),
        el("i", "fbar" + (food >= 0 ? ` f${food}` : "")),
        el("span", "num", d.getDate()),
      );
      b.addEventListener("click", () => select(key));
      ui.week.appendChild(b);
    }

    countTo(counted);
    setEnergy(counted / WEEK_TARGET);
    ui.score.textContent = `Target ${WEEK_TARGET}. ${normalPlus} normal or better, target 2–3.`;

    // the selected day's buttons
    const day = days[sel] || {};
    const tier = tierOf(day);
    ui.tierButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(TIERS[i].tier === tier)));
    ui.tagButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(!!day[MOVEMENT_TAGS[i].key])));

    ui.health.hidden = !day.health;
    ui.health.textContent = day.health ? `From Apple Health: ${day.health}` : "";

    renderNotice(days, today, isToday);
  },
};

// Tapping the tier that's already on turns it off (back to "not logged").
function pickTier(tier) {
  const date = getSelected();
  const before = tierOf(storage.getDay(date));
  const next = before === tier ? null : tier;
  storage.saveDay(date, { tier: next });
  if (next && next !== before) orb.burst();
}

// After a gap of 2+ days with nothing logged today: a no-guilt restart message.
function renderNotice(days, today, isToday) {
  let last = null;
  for (const key of Object.keys(days)) {
    if (key < today && tierOf(days[key]) > 0 && (!last || key > last)) last = key;
  }
  const loggedToday = tierOf(days[today]) > 0;
  const gap = last ? daysBetween(today, last) - 1 : 0;

  if (isToday && !loggedToday && gap >= 2) {
    ui.noticeTitle.textContent = `${gap} days since your last check-in. Nothing broke.`;
    ui.noticeText.textContent =
      "There is no streak to lose. Today is a minimum day: a 10-minute walk and one meal-prep meal." +
      (gap >= 14 ? " For the next week, stick to minimum and normal days only." : "");
    ui.notice.hidden = false;
  } else if (isToday && !last && !loggedToday) {
    ui.noticeTitle.textContent = "First check-in";
    ui.noticeText.textContent =
      "Tap the version of today's movement that actually happened. A minimum day counts the same as any other, and the orb charges as the week fills.";
    ui.notice.hidden = false;
  } else {
    ui.notice.hidden = true;
  }
}

// Count the big number up or down instead of jumping (skipped with Reduce Motion).
let shown = 0;
let raf = 0;
function countTo(to) {
  if (reducedMotion || to === shown) {
    shown = to;
    ui.count.textContent = String(to);
    return;
  }
  const from = shown;
  const startTime = performance.now();
  shown = to;
  cancelAnimationFrame(raf);
  const step = (now) => {
    const k = Math.min(1, (now - startTime) / 450);
    ui.count.textContent = String(Math.round(from + (to - from) * k));
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
