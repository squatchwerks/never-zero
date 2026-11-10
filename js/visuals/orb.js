// visuals/orb.js — the 3D orb on the Today tab, with its shock ring and sparks.
//
// createOrb(container) builds the canvases inside `container` and returns
// { burst() } to fire the celebration when a day is newly logged.
// How bright the orb is comes from scene.setEnergy().

import { el } from "../dom.js";
import { makeGL, ORB_SHADER } from "./gl.js";
import { addLayer, flash, reducedMotion } from "./scene.js";

const SPARK_COLORS = ["34,211,238", "139,123,255", "255,107,139", "190,245,255"];

export function createOrb(container) {
  const orbCanvas = el("canvas", "orb");
  const sparkCanvas = el("canvas", "sparks");
  const ring = el("div", "ring");
  for (const node of [orbCanvas, sparkCanvas]) node.setAttribute("aria-hidden", "true");
  container.prepend(orbCanvas, sparkCanvas, ring);

  const orb = makeGL(orbCanvas, ORB_SHADER, true);
  if (!orb) orbCanvas.classList.add("nogl"); // CSS gradient ball instead (css/orb.css)

  let sparks = [];
  let sizedFor = 0; // the on-screen width the canvases were last sized for

  addLayer({
    resize() {
      const cssWidth = orbCanvas.clientWidth;
      if (!cssWidth) return; // tab hidden: size it when it's shown
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // sharp on Retina, capped for battery
      const w = Math.round(cssWidth * dpr);
      if (orb) orbCanvas.width = orbCanvas.height = w;
      sparkCanvas.width = sparkCanvas.height = w;
      sizedFor = cssWidth;
    },
    draw(t, dt, energy, pulse) {
      // Skip all drawing while the Today tab is hidden.
      if (container.offsetParent === null) return;
      if (orbCanvas.clientWidth !== sizedFor) this.resize(); // e.g. first frame after the tab is shown
      if (orb) orb.draw(t, energy, pulse);
      drawSparks(dt);
    },
  });

  function drawSparks(dt) {
    const c = sparkCanvas.getContext("2d");
    const W = sparkCanvas.width;
    c.clearRect(0, 0, W, W);
    if (!sparks.length) return;
    c.globalCompositeOperation = "lighter";
    sparks = sparks.filter((s) => s.life > 0);
    for (const s of sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.985;
      s.vy *= 0.985;
      s.life -= dt * 0.9;
      const a = Math.max(0, s.life);
      c.fillStyle = `rgba(${s.c},${a.toFixed(3)})`;
      c.beginPath();
      c.arc(W / 2 + s.x * W, W / 2 + s.y * W, s.r * W * (0.4 + 0.6 * a), 0, Math.PI * 2);
      c.fill();
    }
  }

  return {
    /** Shock ring, sparks and a flash. Does nothing with Reduce Motion on. */
    burst() {
      if (reducedMotion) return;
      flash();
      ring.classList.remove("go");
      void ring.offsetWidth; // restart the CSS animation
      ring.classList.add("go");
      for (let i = 0; i < 46; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.25 + Math.random() * 0.55;
        sparks.push({
          x: Math.cos(a) * 0.26, y: Math.sin(a) * 0.26,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          r: 0.006 + Math.random() * 0.012,
          life: 0.7 + Math.random() * 0.5,
          c: SPARK_COLORS[i % 4],
        });
      }
    },
  };
}
