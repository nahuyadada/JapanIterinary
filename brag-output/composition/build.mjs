// Builds index.html from captured.json (the app's real rendered components).
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cap = JSON.parse(readFileSync(path.join(here, "captured.json"), "utf8"));
const m = cap.metrics;

// The hero photo is a file in the app's public/ folder, referenced by a root-relative URL.
copyFileSync(path.join(here, "..", "..", "public", "76402941-japan-wallpaper.jpg"), path.join(here, "assets", "app", "hero.jpg"));
cap.hero = cap.hero.replace("/76402941-japan-wallpaper.jpg", "assets/app/hero.jpg");

// Drop rules that still point at the dev server (unused font subsets never downloaded).
const css = cap.css
  .split("\n")
  .filter((rule) => !/https?:\/\/localhost/.test(rule))
  .join("\n")
  .replace(/<\/style/gi, "<\\/style");

// The app deliberately clamps card descriptions to two lines and hides the tick on
// unselected cards; tell the layout audit those are intended.
for (const key of ["dates", "itin"]) cap[key] = markIntended(cap[key]);
cap.catalog = cap.catalog.map(markIntended);
function markIntended(fragment) {
  return fragment
    .replace(/class="([^"]*line-clamp-2[^"]*)"/g, 'class="$1" data-layout-ignore')
    // The unselected tick is drawn in transparent ink, i.e. not drawn; drop the glyph.
    .replace(/(<span class="[^"]*text-transparent[^"]*"[^>]*>)✓/g, "$1")
    // Map pins for places in the same city sit on top of each other, as on the real map.
    .replace(/(<div class="[^"]*leaflet-marker-icon[^"]*"[^>]*>)<div /g, "$1<div data-layout-ignore ")
    .replace(/<span style="transform:\s*rotate\(45deg\);?">/g, '<span data-layout-ignore style="transform:rotate(45deg)">');
}

const fontVars = cap.htmlClass.split(/\s+/).filter((c) => /variable/.test(c)).join(" ");
const appClass = `${fontVars} antialiased text-gray-900`;

// ---- geometry (film px). The window shows the wizard at 1.4x.
const S = 1.4;
const WIN = { x: 176, y: 196, w: Math.round(m.wizardWidth * S), h: 856 };
const VIEW_H = WIN.h / S; // logical px visible in the window
const HERO_S = 1.5;
/** Wizard-space point -> film-space point for a given scroll offset. */
const P = (x, y, scroll = 0) => ({ x: +(WIN.x + x * S).toFixed(1), y: +(WIN.y + (y - scroll) * S).toFixed(1) });
const mid = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

const cta = { x: (m.cta.x + m.cta.w / 2) * HERO_S, y: (m.cta.y + m.cta.h / 2) * HERO_S };
const cards = m.cards.map((b) => P(mid(b).x, mid(b).y));
const next = P(m.next.xInBar + m.next.w / 2, VIEW_H - m.next.barH + m.next.yInBar + m.next.h / 2);
const DATES_SCROLL = Math.max(0, Math.round(m.build.y + m.build.h + 28 - VIEW_H));
const build = P(mid(m.build).x, mid(m.build).y, DATES_SCROLL);
const chip = P(mid(m.dayChip).x, mid(m.dayChip).y);
const DAY_SCROLL = Math.round(m.day1.y - m.daynav.h - 14);
const DAY_DRIFT = DAY_SCROLL + 230;

// ---- timing (seconds), snapped to the music's beat grid
const T = {
  ctaClick: 2.19,
  appIn: 2.6,
  picks: [4.91, 6.0, 7.09], // beat-grid: every other beat so each selection can be read
  nextClick: 8.19,
  toDates: 8.6, // beat-locked: lands on 8.74
  fit: 9.83,
  datesScroll: 10.95,
  buildClick: 12.02,
  toItin: 12.4,
  pins: 13.0, // beat-locked: 13.11
  chipClick: 15.29,
  outro: 18.4, // beat-locked: logo on 18.56
  end: 22,
};

const clicks = [T.ctaClick, ...T.picks, T.nextClick, T.buildClick, T.chipClick];
const sfx = clicks
  .map(
    (t, i) =>
      `<audio id="sfx-click-${i}" data-start="${(t - 0.02).toFixed(2)}" data-duration="0.06" data-track-index="${20 + i}" data-volume="0.85" src="assets/sfx/ui/mouseclick1.ogg"></audio>`
  )
  .join("\n      ");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <!-- The app's own stylesheet, captured from the running app. -->
    <style id="app-css">
${css}
    </style>
    <style>
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #fdf2f8; scroll-behavior: auto; }
      /* Everything moves on the GSAP timeline; the app's hover transitions must not run. */
      #root *, #root *::before, #root *::after { transition: none !important; animation: none !important; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden;
        background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 70%);
        font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif; color: #101828; }
      .scene { position: absolute; inset: 0; overflow: hidden; }

      /* Scene 1: the real header + hero, laid out at 1280x720 and scaled to fill. */
      #hero-stage { position: absolute; left: 0; top: 0; width: 1280px; height: 720px; transform: scale(${HERO_S}); transform-origin: 0 0; overflow: hidden; }
      #hero-stage .h-screen, #hero-stage .min-h-screen { height: 720px !important; min-height: 0 !important; }
      #hero-stage header { position: absolute !important; }

      /* Scenes 2-4: one window onto the real wizard. */
      .cap { position: absolute; left: ${WIN.x}px; top: 62px; margin: 0; font-size: 64px; line-height: 1.1; font-weight: 600; letter-spacing: -0.03em; color: #101828; white-space: nowrap; }
      .brand { position: absolute; right: ${1920 - WIN.x - WIN.w}px; top: 78px; display: flex; align-items: center; gap: 14px; font-size: 30px; font-weight: 500; color: #364153; }
      .brand i { display: block; width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #ff6467, #e7000b); }
      #win { position: absolute; left: ${WIN.x}px; top: ${WIN.y}px; width: ${WIN.w}px; height: ${WIN.h}px; overflow: hidden; border-radius: 22px; background: #fff; box-shadow: 0 30px 80px -20px rgba(130, 24, 26, 0.28), 0 0 0 1px rgba(255, 201, 201, 0.9); }
      #scaler { position: relative; width: ${m.wizardWidth}px; height: ${VIEW_H}px; transform: scale(${S}); transform-origin: 0 0; }
      .layer { isolation: isolate; position: absolute; left: 0; top: 0; width: ${m.wizardWidth}px; height: ${VIEW_H}px; overflow: hidden; background: #fff; }
      .layer > .scroll { position: absolute; left: 0; top: 0; width: ${m.wizardWidth}px; }
      .layer .shadow-lg { box-shadow: none; }
      /* The app pins this bar with position: sticky; the window has no scrollport, so pin it here. */
      .layer [data-cap="bar"] { position: absolute !important; left: 0; right: 0; bottom: 0; margin: 0 !important; }
      #navpin { position: absolute; left: 0; top: 0; width: ${m.wizardWidth}px; background: #fff; }
      #navpin nav { position: static !important; margin: 0 !important; }
      .leaflet-container { font-family: inherit; }

      #cursor { position: absolute; left: 0; top: 0; width: 46px; height: 46px; z-index: 50; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35)); }
      #ring { position: absolute; left: 0; top: 0; width: 80px; height: 80px; margin: -40px 0 0 -40px; border-radius: 50%; border: 4px solid #fb2c36; z-index: 49; }

      #outro { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 70%); }
      #sun { width: 190px; height: 190px; border-radius: 50%; background: #fff; border: 6px solid #e5e7eb; display: flex; align-items: center; justify-content: center; }
      #sun i { display: block; width: 114px; height: 114px; border-radius: 50%; background: linear-gradient(135deg, #ff6467, #e7000b); }
      #outro h1 { margin: 0; font-size: 150px; line-height: 1; font-weight: 600; letter-spacing: -0.04em; color: #101828; }
      #outro .cta { font-size: 44px; font-weight: 500; color: #fff; background: #e7000b; padding: 22px 56px; border-radius: 999px; }
      #outro .facts { font-size: 34px; color: #4a5565; }
    </style>
  </head>
  <body>
    <div id="root" class="${fontVars}" data-composition-id="main" data-start="0" data-duration="${T.end}" data-width="1920" data-height="1080">

      <div id="s1" class="scene clip" data-start="0" data-duration="3.1" data-track-index="1" style="z-index: 3">
        <div id="hero-stage" class="${appClass}">
          ${cap.header}
          ${cap.hero}
        </div>
      </div>

      <div id="s2" class="scene clip" data-start="2.5" data-duration="16.5" data-track-index="2" style="z-index: 2">
        <h2 class="cap" id="cap-a">Pick from 152 places across 14 regions</h2>
        <h2 class="cap" id="cap-b">Set your dates. It checks the fit.</h2>
        <h2 class="cap" id="cap-c">A route-aware, day-by-day itinerary</h2>
        <div class="brand"><i></i>Trip to Japan</div>
        <div id="win">
          <div id="scaler" class="${appClass}">
            ${cap.catalog.map((frag, i) => `<div class="layer" id="cat-${i}">${frag}</div>`).join("\n            ")}
            <div class="layer" id="lay-dates"><div class="scroll" id="scroll-dates">${cap.dates}</div></div>
            <div class="layer" id="lay-itin"><div class="scroll" id="scroll-itin">${cap.itin}</div><div id="navpin">${cap.daynav.replace(/<(nav|button|span)(?=[ >])/g, "<$1 data-layout-ignore")}</div></div>
          </div>
        </div>
      </div>

      <div id="outro" class="scene clip" data-start="${T.outro}" data-duration="${(T.end - T.outro).toFixed(2)}" data-track-index="3" style="z-index: 4">
        <div id="sun"><i></i></div>
        <h1 id="outro-title">Trip to Japan</h1>
        <div class="facts" id="outro-facts">152 places · 14 regions · one day-by-day plan</div>
        <div class="cta" id="outro-cta">Plan Your Trip</div>
      </div>

      <div id="ring" class="clip" data-start="0" data-duration="${T.outro + 0.3}" data-track-index="5"></div>
      <svg id="cursor" class="clip" data-start="0" data-duration="${T.outro + 0.3}" data-track-index="6" viewBox="0 0 24 24">
        <path d="M5 2.5v17l4.6-4.3 3 6.6 2.9-1.3-3-6.5H19z" fill="#101828" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round" />
      </svg>

      <audio id="music" data-start="0" data-duration="${T.end}" data-track-index="10" data-volume="0.32" data-fade-in="0.3" data-fade-out="2.2" src="assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3"></audio>
      ${sfx}
      <audio id="sfx-logo" data-start="${(T.outro + 0.12).toFixed(2)}" data-duration="0.18" data-track-index="30" data-volume="0.75" src="assets/sfx/impact/impactSoft_medium_001.ogg"></audio>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      const T = ${JSON.stringify(T)};
      const pts = ${JSON.stringify({ cta, cards, next, build, chip })};

      // Cursor: glide to a point, then a press (dip + ring) exactly at time t.
      function press(p, t, travel) {
        tl.to("#cursor", { x: p.x, y: p.y, duration: travel, ease: "power2.inOut" }, t - travel - 0.08);
        tl.to("#cursor", { scale: 0.82, duration: 0.07, ease: "power1.in" }, t - 0.07);
        tl.to("#cursor", { scale: 1, duration: 0.16, ease: "power2.out" }, t);
        tl.set("#ring", { x: p.x, y: p.y }, t - 0.01);
        tl.fromTo("#ring", { scale: 0.25, opacity: 0.9 }, { scale: 1, opacity: 0, duration: 0.45, ease: "power2.out" }, t);
      }
      const swap = (out, inn, t) => {
        tl.fromTo(inn, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.34, ease: "power3.out" }, t);
        tl.set(out, { autoAlpha: 0 }, t + 0.34);
      };
      const capSwap = (out, inn, t) => {
        tl.to(out, { autoAlpha: 0, y: -18, duration: 0.22, ease: "power2.in" }, t - 0.05);
        tl.fromTo(inn, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, t + 0.14);
      };

      // ---- initial states
      gsap.set("#cursor", { x: 1180, y: 900, transformOrigin: "20% 10%" });
      gsap.set("#ring", { opacity: 0, scale: 0.25 });
      gsap.set(["#cat-1", "#cat-2", "#cat-3", "#lay-dates", "#lay-itin", "#navpin", "#cap-b", "#cap-c"], { autoAlpha: 0 });
      gsap.set('#lay-dates [data-cap="fit"]', { opacity: 0, scale: 0.96, transformOrigin: "0% 50%" });
      gsap.set('#lay-itin [data-cap="map"] .leaflet-marker-icon > div', { scale: 0, transformOrigin: "50% 50%" });

      // ---- Scene 1: hero, press "Start Your Journey"
      tl.fromTo("#hero-stage", { scale: ${HERO_S * 1.06} }, { scale: ${HERO_S}, duration: 2.6, ease: "power1.out" }, 0);
      press(pts.cta, T.ctaClick, 1.1);
      tl.to("#s1", { opacity: 0, y: -60, duration: 0.45, ease: "power2.inOut" }, T.appIn);

      // ---- Scene 2: choose places
      tl.fromTo("#win", { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, T.appIn);
      tl.fromTo("#cap-a", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, T.appIn + 0.15);
      tl.fromTo(".brand", { opacity: 0 }, { opacity: 1, duration: 0.45 }, T.appIn + 0.25);
      T.picks.forEach((t, i) => {
        press(pts.cards[i], t, i === 0 ? 1.0 : 0.6);
        tl.to("#cat-" + (i + 1), { autoAlpha: 1, duration: 0.12 }, t);
        tl.set("#cat-" + i, { autoAlpha: 0 }, t + 0.12);
      });
      press(pts.next, T.nextClick, 0.6);

      // ---- Scene 3: dates and the fit check
      swap("#cat-3", "#lay-dates", T.toDates);
      capSwap("#cap-a", "#cap-b", T.toDates);
      tl.to("#cursor", { x: 1300, y: 640, duration: 0.8, ease: "power2.inOut" }, T.toDates + 0.2);
      tl.to('#lay-dates [data-cap="fit"]', { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, T.fit);
      tl.to("#scroll-dates", { y: ${-DATES_SCROLL}, duration: 0.55, ease: "power2.inOut" }, T.datesScroll);
      press(pts.build, T.buildClick, 0.5);

      // ---- Scene 4: the itinerary
      swap("#lay-dates", "#lay-itin", T.toItin);
      capSwap("#cap-b", "#cap-c", T.toItin);
      tl.to('#lay-itin [data-cap="map"] .leaflet-marker-icon > div', { scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.07 }, T.pins);
      press(pts.chip, T.chipClick, 0.9);
      tl.to("#navpin", { autoAlpha: 1, duration: 0.1 }, T.chipClick + 0.2);
      tl.to("#scroll-itin", { y: ${-DAY_SCROLL}, duration: 0.85, ease: "power3.inOut" }, T.chipClick + 0.08);
      tl.to("#scroll-itin", { y: ${-DAY_DRIFT}, duration: 2.1, ease: "sine.inOut" }, T.chipClick + 1.05);
      tl.to("#cursor", { x: 1500, y: 760, opacity: 0, duration: 0.7, ease: "power2.inOut" }, T.chipClick + 0.5);

      // ---- Scene 5: outro
      tl.fromTo("#outro", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, T.outro);
      tl.fromTo("#sun", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.8)" }, T.outro + 0.1);
      tl.fromTo("#outro-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, T.outro + 0.25);
      tl.fromTo("#outro-facts", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, T.outro + 0.7);
      tl.fromTo("#outro-cta", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.7)" }, T.outro + 1.1);
      tl.to({}, { duration: 0.01 }, T.end - 0.01);

      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;

writeFileSync(path.join(here, "index.html"), html);
console.log("index.html", (html.length / 1024).toFixed(0) + "KB", JSON.stringify({ WIN, VIEW_H, DATES_SCROLL, DAY_SCROLL, cards, next, build, chip, cta }));
