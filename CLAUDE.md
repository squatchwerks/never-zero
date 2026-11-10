# Never Zero (PWA rebuild)

Joshua's daily fitness check-in app. It started as a Claude artifact (single 63 KB HTML file,
saved in `reference/artifact-original.html`) and is being rebuilt from scratch as an installable PWA.
He will add and tweak features constantly, so **modularity is the top design goal**.

## About the person
- Learning as he goes: explain what you're doing and why, like a tutorial, and keep steps small.
- Works on a Mac. Will install the finished app on his iPhone via Safari "Add to Home Screen".
- Prefers loose, flexible fitness guidelines over strict schedules (the app's whole idea: "never zero").

## Hard rules
- No frameworks and no build step. Plain HTML, CSS and native ES modules (`<script type="module">`).
- One feature = one small file in `js/features/`, with the same shape (init, render, optional update).
  `js/main.js` holds the feature list, so adding a feature is one new file plus one line.
- `js/storage.js` is the ONLY file that knows where data lives (localStorage for now). Features call
  `storage.getDay(date)`, `storage.saveDay(date, patch)`, `storage.getSettings()` and so on. This lets us swap
  in cloud sync later without touching any feature.
- Editable content lives in `data/` (plans, tips), not inside logic files.
- CSS split by concern in `css/`; colors, spacing and fonts are CSS variables in `css/base.css`.
- Service worker cache has a version constant (`CACHE_VERSION` in `sw.js`). Bump it on every release,
  or his phone will keep showing the old version. Remind him / do it for him.
- Wrap all localStorage reads and writes in try/catch.
- Must work on iPhone Safari standalone mode: safe-area insets, `viewport-fit=cover`, 44px tap targets.
- Respect `prefers-reduced-motion`.

## Target layout
```
index.html  manifest.json  sw.js
css/        base.css  tabs.css  cards.css  orb.css ...
js/         main.js  storage.js  scoring.js  features/{today,progress,coach,food,lifts,plans,tip}.js
data/       plans.js  tips.js
icons/      icon-192.png  icon-512.png  apple-touch-icon.png
```

## Reuse from the original (copy the best parts, don't port the structure)
`reference/artifact-original.html` is the visual and behavioral reference. Lift these, adapted into modules:
- **Look:** dark theme, liquid-gradient background (WebGL canvas `#bg` with CSS fallback), glass cards,
  floating pill tab bar (Today / Progress / Plans / ... ), Geist + Geist Mono fonts, cyan/violet/coral palette.
- **Orb:** 3D orb that charges with the week's counted days (X/7), shock-ring and sparks on a new log.
  Original functions: `size`, `loop`, `burst`.
- **Scoring:** movement tiers 1 Minimum / 2 Normal / 3 Good; food scored separately (0-3); a day "counts" per the
  original rules. Read `tierOf`, `foodOf`, `renderToday`.
- **Views:** Today (`renderToday`), Progress (`renderProgress`: week grid + weight trend chart), Coach
  (`renderCoach`: rules over the last 7 days), Daily tip (`renderTip`), Lifts (`renderLifts`: 1RM inputs for
  squat/bench/deadlift), Plans (`renderPlans`).
- **Day record shape** (one per date, key = `YYYY-MM-DD`): `date, tier (0-3), cardio, strength, food (0-3),
  foods[] (last 12 entries), weight, note (<=400 chars), af, health (text from Apple Health), protein`.
- **Settings shape:** `kcal, protein` (daily targets; defaults 2100 / 180), `lifts` (one-rep maxes).
- Weight goal shown in the app: 190 lb.

## Leave out of v1
- The "what did you eat" AI estimator (`renderFood`). It called Claude through `window.claude`, and an AI key can't safely
  live in a public web page. Keep the manual food scoring and the foods list. Revisit later with a small backend.
- Everything that touches `window.claude` (db, user, sample). Don't carry any of it over.

## Seed content (already exported, in `reference/export/`)
- `plans/*.json` (4 plans: barbell-big-three, cardio-starter, home-bodyweight, lifting-starter) -> convert to `data/plans.js`
- `tips/*.json` (24 tips, each with title, topic, body, use, order) -> convert to `data/tips.js`
- `days/*.json` (his real check-in history, 4 days) + `settings-hub.json` -> write an **Import** button in the app
  that loads a JSON file into localStorage, and an **Export** button that downloads it. Build both early:
  they're also his backup, since localStorage lives only on the device.

## Build order (vertical slices, each one usable on his phone)
1. Shell: index.html, manifest, service worker, icons, base CSS, tab router. Deploy to a free host (GitHub Pages) and install on iPhone.
2. storage.js + Today view (orb, week strip, tier buttons, cardio/strength chips) + Export/Import.
3. Progress (week grid, weight trend).
4. Coach + daily tip.
5. Food scoring + foods list.
6. Lifts (1RMs) + Plans.
7. Polish, offline check, then later features (Apple Health-style notes, personalized lifting plans from 1RMs, cardio plans).

Stop after each slice, explain what was built, and let him test before moving on.
