// Builds index.html: screen recordings of the real app + narration + captions.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const lines = Object.fromEntries(JSON.parse(readFileSync(path.join(here, "narration.json"), "utf8")).map((l) => [l.id, l.text]));
const dur = (rel) =>
  +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(here, rel)]).toString().trim();
const r2 = (n) => +n.toFixed(2);

const LEAD = 0.45; // narration starts this long after a scene opens
const scenes = [
  { id: "intro" },
  { id: "landing", clip: true, label: "", step: "" },
  { id: "choose", clip: true, step: "1", label: "Choose places" },
  { id: "dates", clip: true, step: "2", label: "Pick dates" },
  { id: "itinerary", clip: true, step: "3", label: "Your itinerary" },
  { id: "share", clip: true, step: "↗", label: "Share trip" },
  { id: "outro" },
];
let t = 0;
for (const s of scenes) {
  s.vo = dur(`assets/vo/${s.id}.wav`);
  s.clipDur = s.clip ? dur(`assets/clips/${s.id}.mp4`) : 0;
  s.dur = r2(s.clip ? Math.floor(s.clipDur * 30) / 30 : s.vo + (s.id === "outro" ? 2.2 : 1.0));
  if (s.clip && s.vo + LEAD + 0.1 > s.dur) throw new Error(`${s.id}: narration ${s.vo}s does not fit clip ${s.dur}s`);
  s.start = r2(t);
  t += s.dur;
}
const TOTAL = r2(t);
const S = Object.fromEntries(scenes.map((s) => [s.id, s]));
const phoneDur = Math.min(dur("assets/clips/phone.mp4"), S.share.dur - 2.5);
const phoneStart = r2(S.share.start + S.share.dur - phoneDur);

/** Split a narration line into caption-sized chunks, timed by their share of the characters. */
function captions(s) {
  const sentences = lines[s.id].match(/[^.?!]+[.?!]+/g).map((x) => x.trim());
  let chunks = [];
  for (const sent of sentences) {
    if (sent.length <= 88) { chunks.push(sent); continue; }
    const parts = sent.split(/,\s+/);
    let buf = "";
    parts.forEach((p, i) => {
      const piece = p + (i < parts.length - 1 ? "," : "");
      if (buf && (buf + " " + piece).length > 88) { chunks.push(buf); buf = piece; } else buf = buf ? buf + " " + piece : piece;
    });
    if (buf) chunks.push(buf);
  }
  // Short fragments read better joined to their neighbour.
  chunks = chunks.reduce((out, c) => {
    const last = out[out.length - 1];
    if (last && (last.length < 32 || c.length < 32) && (last + " " + c).length <= 96) out[out.length - 1] = last + " " + c;
    else out.push(c);
    return out;
  }, []);
  const total = chunks.reduce((a, c) => a + c.length, 0);
  let at = s.start + LEAD;
  return chunks.map((text, i) => {
    const d = (s.vo * text.length) / total;
    const c = { text, start: r2(at), dur: r2(i === chunks.length - 1 ? d + 0.35 : d) };
    at += d;
    return c;
  });
}
const caps = scenes.flatMap(captions);
const esc = (x) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Where in the intro narration each phrase lands (share of characters spoken).
const introAt = (phrase) => r2(S.intro.start + LEAD + (S.intro.vo * lines.intro.indexOf(phrase)) / lines.intro.length);
const I = { tabs: introAt("a dozen"), sheet: introAt("a spreadsheet"), guess: introAt("and a lot"), name: introAt("Trip to Japan turns"), steps: introAt("three simple") };

const BOX = { x: 152, y: 26, w: 1616, h: 909 };
const clips = scenes.filter((s) => s.clip);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Geist"; font-style: normal; font-weight: 100 900; src: url("assets/img/geist-latin.woff2") format("woff2"); }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #fdf2f8; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: "Geist", sans-serif; color: #101828;
        background: linear-gradient(135deg, #fce7f3 0%, #fff5f7 55%, #ffffff 100%); }
      .scene { position: absolute; inset: 0; overflow: hidden; }

      #frame { position: absolute; left: ${BOX.x}px; top: ${BOX.y}px; width: ${BOX.w}px; height: ${BOX.h}px; border-radius: 20px; background: #ffffff;
        box-shadow: 0 30px 70px -24px rgba(130, 24, 26, 0.35), 0 0 0 1px #ffc9c9; }
      video.shot { position: absolute; left: ${BOX.x}px; top: ${BOX.y}px; width: ${BOX.w}px; height: ${BOX.h}px; border-radius: 20px; object-fit: cover; background: #ffffff; }

      .pill { position: absolute; left: ${BOX.x}px; top: 968px; height: 68px; display: flex; align-items: center; gap: 16px; padding: 0 30px 0 12px; border-radius: 999px;
        background: #ffffff; border: 2px solid #e7000b; color: #9f0712; font-size: 30px; font-weight: 600; white-space: nowrap; }
      .pill b { width: 46px; height: 46px; border-radius: 50%; background: #e7000b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; }
      .caption { position: absolute; left: 520px; top: 952px; width: 1248px; height: 100px; display: flex; align-items: center; justify-content: flex-end; text-align: right;
        font-size: 33px; line-height: 1.3; font-weight: 500; color: #1e2939; }
      .caption.wide { left: 260px; width: 1400px; top: 930px; justify-content: center; text-align: center; color: #ffffff; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6); }

      #phone { position: absolute; left: 1398px; top: 150px; width: 372px; height: 728px; border-radius: 52px; background: #101828;
        box-shadow: 0 40px 80px -20px rgba(16, 24, 40, 0.55); }
      #v-phone { position: absolute; left: 1412px; top: 164px; width: 344px; height: 700px; border-radius: 40px; object-fit: cover; object-position: top; background: #ffffff; }

      #intro, #outro { color: #ffffff; }
      .bg { position: absolute; inset: 0; background: url("assets/img/hero.jpg") center / cover; }
      .shade { position: absolute; inset: 0; background: rgba(16, 24, 40, 0.62); }
      .center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 44px; }
      #q { font-size: 92px; font-weight: 600; letter-spacing: -0.03em; }
      #pains { display: flex; gap: 26px; }
      #pains span { font-size: 40px; font-weight: 500; padding: 20px 38px; border-radius: 999px; background: rgba(255, 255, 255, 0.14); border: 2px solid rgba(255, 255, 255, 0.55); }
      .sun { width: 150px; height: 150px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; }
      .sun i { display: block; width: 92px; height: 92px; border-radius: 50%; background: linear-gradient(135deg, #ff6467, #e7000b); }
      .name { font-size: 150px; line-height: 1; font-weight: 600; letter-spacing: -0.04em; }
      #steps { display: flex; gap: 22px; }
      #steps span { display: flex; align-items: center; gap: 14px; font-size: 36px; font-weight: 600; padding: 12px 30px 12px 12px; border-radius: 999px; background: #ffffff; color: #9f0712; }
      #steps b { width: 48px; height: 48px; border-radius: 50%; background: #e7000b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 28px; }
      #tag { font-size: 50px; font-weight: 500; }
      #facts { font-size: 34px; color: #e5e7eb; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">

      <div id="intro" class="scene clip" data-start="0" data-duration="${r2(S.intro.dur + 0.35)}" data-track-index="1" style="z-index: 5">
        <div class="bg" id="intro-bg"></div><div class="shade"></div>
        <div class="center" id="intro-a">
          <div id="q">Planning a trip to Japan?</div>
          <div id="pains"><span id="p1">A dozen browser tabs</span><span id="p2">A spreadsheet</span><span id="p3">A lot of guessing</span></div>
        </div>
        <div class="center" id="intro-b">
          <div class="sun" id="intro-sun"><i></i></div>
          <div class="name" id="intro-name">Trip to Japan</div>
          <div id="steps"><span><b>1</b>Choose places</span><span><b>2</b>Pick dates</span><span><b>3</b>Your itinerary</span></div>
        </div>
      </div>

      <div id="frame" class="clip" data-start="${r2(S.landing.start - 0.2)}" data-duration="${r2(S.outro.start - S.landing.start + 0.5)}" data-track-index="2" style="z-index: 1"></div>
      ${clips
        .map(
          (s, i) =>
            `<video id="v-${s.id}" class="clip shot" data-start="${s.start}" data-duration="${s.dur}" data-track-index="${3 + (i % 2)}" style="z-index: 2" muted playsinline src="assets/clips/${s.id}.mp4"></video>`
        )
        .join("\n      ")}
      ${clips
        .filter((s) => s.label)
        .map(
          (s) =>
            `<div id="pill-${s.id}" class="clip pill" data-start="${s.start}" data-duration="${s.dur}" data-track-index="6" style="z-index: 3"><b>${s.step}</b>${s.label}</div>`
        )
        .join("\n      ")}

      <div id="phone" class="clip" data-start="${phoneStart}" data-duration="${r2(phoneDur)}" data-track-index="7" style="z-index: 4"></div>
      <video id="v-phone" class="clip" data-start="${phoneStart}" data-duration="${r2(phoneDur)}" data-track-index="8" style="z-index: 4" muted playsinline src="assets/clips/phone.mp4"></video>

      <div id="outro" class="scene clip" data-start="${S.outro.start}" data-duration="${S.outro.dur}" data-track-index="9" style="z-index: 5">
        <div class="bg"></div><div class="shade"></div>
        <div class="center">
          <div class="sun" id="outro-sun"><i></i></div>
          <div class="name" id="outro-name">Trip to Japan</div>
          <div id="tag">From a wish list to a day-by-day plan</div>
          <div id="facts">152 places · 14 regions · map, day plan and booking checklist</div>
        </div>
      </div>

      ${caps
        .map((c, i) => {
          const wide = c.start < S.landing.start || c.start >= S.outro.start;
          return `<div id="cap-${i}" class="clip caption${wide ? " wide" : ""}" data-start="${c.start}" data-duration="${c.dur}" data-track-index="${10 + (i % 2)}" style="z-index: 6">${esc(c.text)}</div>`;
        })
        .join("\n      ")}

      <audio id="music" data-start="0" data-duration="${TOTAL}" data-track-index="20" data-volume="0.09" data-fade-in="0.6" data-fade-out="2.5" src="assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3"></audio>
      ${scenes
        .map(
          (s, i) =>
            `<audio id="vo-${s.id}" data-start="${r2(s.start + LEAD)}" data-duration="${r2(s.vo)}" data-track-index="${21 + i}" data-volume="1" src="assets/vo/${s.id}.wav"></audio>`
        )
        .join("\n      ")}
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      const I = ${JSON.stringify(I)};
      const S = ${JSON.stringify(Object.fromEntries(scenes.map((s) => [s.id, { start: s.start, dur: s.dur }])))};
      const PHONE = ${phoneStart};

      gsap.set(["#p1", "#p2", "#p3", "#intro-b"], { autoAlpha: 0 });

      // Intro: the problem, then the name
      tl.fromTo("#intro-bg", { scale: 1.08 }, { scale: 1, duration: S.intro.dur + 0.3, ease: "none" }, 0);
      [["#p1", I.tabs], ["#p2", I.sheet], ["#p3", I.guess]].forEach(([sel, at]) =>
        tl.fromTo(sel, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, at));
      tl.to("#intro-a", { autoAlpha: 0, y: -30, duration: 0.35, ease: "power2.in" }, I.name - 0.4);
      tl.fromTo("#intro-b", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, I.name - 0.05);
      tl.fromTo("#intro-sun", { scale: 0.4 }, { scale: 1, duration: 0.5, ease: "back.out(1.8)" }, I.name - 0.05);
      tl.fromTo("#intro-name", { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, I.name + 0.05);
      tl.fromTo("#steps span", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.6)", stagger: 0.16 }, I.steps - 0.15);
      tl.to("#intro", { opacity: 0, duration: 0.35, ease: "power1.inOut" }, S.intro.dur);

      // Demo: each recording slides in over the last one
      tl.fromTo("#frame", { opacity: 0 }, { opacity: 1, duration: 0.3 }, S.landing.start - 0.2);
      ["choose", "dates", "itinerary", "share"].forEach((id) => {
        tl.fromTo("#v-" + id, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, S[id].start);
        tl.fromTo("#pill-" + id, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, S[id].start + 0.1);
      });
      tl.fromTo(["#phone", "#v-phone"], { opacity: 0, x: 140 }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }, PHONE);

      // Outro
      tl.fromTo("#outro", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" }, S.outro.start);
      tl.fromTo("#outro-sun", { scale: 0.4 }, { scale: 1, duration: 0.5, ease: "back.out(1.8)" }, S.outro.start + 0.15);
      tl.fromTo("#outro-name", { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, S.outro.start + 0.3);
      tl.fromTo("#tag", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, S.outro.start + 1.3);
      tl.fromTo("#facts", { opacity: 0 }, { opacity: 1, duration: 0.45 }, S.outro.start + 2.0);
      tl.to({}, { duration: 0.01 }, ${TOTAL} - 0.01);

      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
writeFileSync(path.join(here, "index.html"), html);
console.log("total", TOTAL, scenes.map((s) => `${s.id}@${s.start}+${s.dur}`).join(" "), "phone@" + phoneStart, JSON.stringify(I));
console.log(caps.map((c) => `${c.start} ${c.dur} ${c.text}`).join("\n"));
