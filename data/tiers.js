// data/tiers.js — the wording for the three movement tiers on the Today tab.
// The numbers (1, 2, 3) are what gets saved, so keep those as they are;
// names and descriptions can change freely.

export const TIERS = [
  { tier: 1, name: "Minimum", desc: "A 10-minute brisk walk, or five minutes of anything." },
  { tier: 2, name: "Normal", desc: "20–30 minutes of easy cardio or a short strength session." },
  { tier: 3, name: "Good", desc: "30 minutes or more of cardio, or cardio plus lifts." },
];

// Optional tags for what kind of movement it was. `key` is the field saved on the day.
export const MOVEMENT_TAGS = [
  { key: "cardio", label: "Cardio" },
  { key: "strength", label: "Strength" },
];
