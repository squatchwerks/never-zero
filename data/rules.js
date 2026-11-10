// data/rules.js — the text shown on the Rules tab.
// Edit the words here; js/features/rules.js only decides how they look.

export const RULES = [
  "A week is scored by counted days, not streaks. Aim for 5 of 7, with 2–3 at normal or better.",
  "Tired or busy means a minimum day, never a zero.",
  "Commit to five minutes. You can stop after that and it still counts.",
  "Never make up missed work.",
];

export const RESTARTING = [
  "There is no streak, so nothing breaks. After any gap, the next day is a minimum day, done today and not \"starting Monday.\"",
  "After two or more weeks off, do one week of minimum and normal days only. Move week in December is a minimum-only week by design.",
];

export const HABITS = [
  { title: "Daily minimum", cost: "Costs 10 minutes. Keeps the habit alive." },
  { title: "Protein-first eating", cost: "Costs prep time and a less fun dinner. Most of the weight loss." },
  { title: "Easy cardio, 2–3 times a week", cost: "Costs about 90 minutes a week. Keep it at a pace where you can talk." },
  { title: "Two short lifting sessions", cost: "Costs about 40 minutes a week. Protects muscle while you cut." },
  { title: "Staying off alcohol", cost: "Helps sleep, calories, and the off-the-rails days." },
];

export const HABITS_NOTE =
  "Nicotine raises heart rate, so judge effort by whether you can talk, not by heart-rate zones.";
