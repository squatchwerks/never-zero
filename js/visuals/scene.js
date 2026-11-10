// visuals/scene.js — the animation loop, shared "energy" and "pulse", and the
// liquid background.
//
// Energy (0-1) is how full the week is; the background and orb glow brighter as
// it rises. Pulse is a quick flash after a new log that fades within a second.
// Other visuals (the orb) join the loop with addLayer().
//
// With Reduce Motion on, there's no loop: one still frame is drawn, and redrawn
// only when something changes.

import { makeGL, BACKGROUND_SHADER } from "./gl.js";

export const reducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

let energy = 0;   // what's drawn now
let target = 0;   // where energy is heading (it eases there smoothly)
let pulse = 0;
const layers = new Set();
let bg = null;
let bgCanvas = null;
let started = false;

/** Start the background and the loop. Call once at startup. */
export function startScene(canvas) {
  if (started) return;
  started = true;
  bgCanvas = canvas;
  bg = makeGL(canvas, BACKGROUND_SHADER, false);
  if (!bg) canvas.classList.add("nogl"); // keep the CSS gradient from base.css

  resize();
  window.addEventListener("resize", () => {
    resize();
    for (const layer of layers) layer.resize?.();
    if (reducedMotion) drawStill();
  });

  if (reducedMotion) drawStill();
  else requestAnimationFrame(loop);
}

/** How full the week is, 0 to 1. Eases smoothly to the new value. */
export function setEnergy(value) {
  target = Math.max(0, Math.min(1, value));
  if (reducedMotion) drawStill();
}

/** Flash brighter for a moment (after a new log). */
export function flash() {
  if (!reducedMotion) pulse = 1;
}

/**
 * Join the loop. A layer is { draw(t, dt, energy, pulse), resize?() }.
 * Returns a function that removes it.
 */
export function addLayer(layer) {
  layers.add(layer);
  layer.resize?.();
  if (reducedMotion) drawStill();
  return () => layers.delete(layer);
}

// The background is drawn at 30% resolution and every other frame: it's
// blurry by design, so this saves battery with no visible difference.
function resize() {
  if (!bg) return;
  bgCanvas.width = Math.max(2, Math.round(window.innerWidth * 0.3));
  bgCanvas.height = Math.max(2, Math.round(window.innerHeight * 0.3));
}

const t0 = performance.now();
let last = t0;
let frame = 0;

function loop(now) {
  const t = (now - t0) / 1000;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frame++;
  energy += (target - energy) * Math.min(1, dt * 2.5);
  pulse *= Math.pow(0.07, dt);

  if (bg && frame % 2 === 0) bg.draw(t, energy, pulse);
  for (const layer of layers) layer.draw(t, dt, energy, pulse);
  requestAnimationFrame(loop);
}

function drawStill() {
  energy = target;
  if (bg) bg.draw(12, energy, 0);
  for (const layer of layers) layer.draw(12, 0, energy, 0);
}
