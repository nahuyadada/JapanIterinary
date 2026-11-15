// Screen-records the real, running app being used end to end (headless Chrome).
// Usage: node record.mjs <puppeteer-core dir> <chrome path> <ffmpeg path> [app url]
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [, , puppeteerDir, chromePath, ffmpegPath, appUrl = "http://localhost:3000"] = process.argv;
const require = createRequire(pathToFileURL(path.join(puppeteerDir, "package.json")));
const puppeteer = require("puppeteer-core");
const RAW = path.join(here, "raw");
mkdirSync(RAW, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ["--hide-scrollbars"] });

// A visible pointer (headless Chrome draws none) and no dev-tools badge.
const POINTER = `
(() => {
  const install = () => {
    if (document.getElementById("__cur")) return;
    const st = document.createElement("style");
    st.textContent = "nextjs-portal{display:none!important} #__cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:26px;height:26px;margin:-3px 0 0 -5px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))} #__cur.down{scale:.82} .__rip{position:fixed;z-index:2147483646;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #fb2c36;animation:__rip .45s ease-out forwards} @keyframes __rip{from{transform:scale(.3);opacity:.9}to{transform:scale(1.2);opacity:0}}";
    document.head.appendChild(st);
    const c = document.createElement("div");
    c.id = "__cur";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 2.5v17l4.6-4.3 3 6.6 2.9-1.3-3-6.5H19z" fill="#101828" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    const place = (e) => { c.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; };
    addEventListener("mousemove", place, true);
    addEventListener("mousedown", (e) => {
      place(e); c.classList.add("down");
      const r = document.createElement("div"); r.className = "__rip"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      document.documentElement.appendChild(r); setTimeout(() => r.remove(), 500);
    }, true);
    addEventListener("mouseup", () => c.classList.remove("down"), true);
    if (window.__curPos) c.style.transform = "translate(" + window.__curPos[0] + "px," + window.__curPos[1] + "px)";
  };
  addEventListener("load", () => setTimeout(install, 300));
})();`;

async function newPage(viewport, pointer = true) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  if (pointer) await page.evaluateOnNewDocument(POINTER);
  return page;
}

const page = await newPage({ width: 1280, height: 720, deviceScaleFactor: 1.5 });
const cur = { x: 900, y: 600 };
const marks = {};
let recStart = 0;
let seg = "";
const mark = (name) => ((marks[seg] ??= {})[name] = +((Date.now() - recStart) / 1000).toFixed(2));

async function glide(x, y, ms = 520) {
  const from = { ...cur };
  const steps = Math.max(8, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await sleep(16);
  }
  cur.x = x;
  cur.y = y;
}

/** First element under `scope` matching `sel` whose text starts with / contains `text`. */
const find = (text, sel = "button", scope = "#plan", exact = false) =>
  page.evaluateHandle(
    (text, sel, scope, exact) => {
      const all = [...document.querySelectorAll(scope + " " + sel)];
      const norm = (el) => el.textContent.replace(/\s+/g, " ").trim();
      return (exact ? all.find((el) => norm(el) === text) : all.find((el) => norm(el).startsWith(text)) || all.find((el) => norm(el).includes(text))) || null;
    },
    text, sel, scope, exact
  ).then((h) => h.asElement());

async function reveal(el) {
  const box = await el.boundingBox();
  if (box && box.y > 110 && box.y + box.height < 610) return;
  await el.evaluate((n) => n.scrollIntoView({ behavior: "smooth", block: "center" }));
  await sleep(750);
}
async function pointAt(el, { dx = 0.5, dy = 0.5, ms } = {}) {
  await reveal(el);
  const b = await el.boundingBox();
  await glide(b.x + b.width * dx, b.y + b.height * dy, ms);
}
async function click(el, opts = {}) {
  if (!el) return false;
  await pointAt(el, opts);
  await sleep(140);
  await page.mouse.down();
  await sleep(70);
  await page.mouse.up();
  await sleep(opts.after ?? 420);
  return true;
}
const card = (name) => find(name, ".place-grid button[aria-pressed]");
/**
 * Select a catalog card. Hovering a card opens its preview beside it, over the neighbouring
 * card, so the pointer first leaves to the strip above the grid and comes in from there.
 */
async function pick(name) {
  const el = await card(name);
  if (!el) { console.log("  (card not shown: " + name + ")"); return; }
  await reveal(el);
  const b = await el.boundingBox();
  const top = await el.evaluate((n) => n.closest(".place-grid").getBoundingClientRect().top);
  await glide(b.x + b.width * 0.55, Math.max(84, top - 16), 380);
  await click(el, { dx: 0.55, ms: 380, after: 380 });
}
async function typeDate(el, digits) {
  await click(el, { dx: 0.12, after: 150 });
  await page.keyboard.type(digits, { delay: 55 });
  await sleep(350);
}

async function record(name, p, fn) {
  seg = name;
  // scale = device pixel ratio, so the file keeps every rendered pixel (1920x1080).
  const rec = await p.screencast({ path: path.join(RAW, name + ".webm"), ffmpegPath, scale: p.viewport().deviceScaleFactor });
  recStart = Date.now();
  await sleep(250);
  try {
    await fn();
  } finally {
    await rec.stop();
  }
  console.log(name, ((Date.now() - recStart) / 1000).toFixed(1) + "s");
}

// ---------- set up a clean session
await page.goto(appUrl, { waitUntil: "networkidle2", timeout: 120000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle2" });
await sleep(1200);
await page.mouse.move(cur.x, cur.y);

await record("landing", page, async () => {
  await sleep(1300);
  await click(await find("Start Your Journey", "a", "#home"), { ms: 800, after: 0 });
  await sleep(2600);
});

await record("choose", page, async () => {
  const search = await page.$('#plan input[type="search"]');
  await click(search, { dx: 0.2, after: 120 });
  await page.keyboard.type("universal", { delay: 60 });
  await sleep(650);
  await pick("Universal Studios Japan");
  await click(await find("Clear filters"), { after: 500 });
  await click(await find("Temple / Shrine", '[aria-label="Category"] button'), { after: 600 });
  await pick("Sensō-ji Temple");
  await pick("Fushimi Inari Taisha");
  await pick("Kiyomizu-dera");
  await click(await find("All", '[aria-label="Category"] button', "#plan", true), { after: 600 });
  await pick("Shibuya Crossing");
  await pick("teamLab Planets");
  await pick("Arashiyama Bamboo Grove");
  await pick("Gion District");
  await pick("Osaka Castle");
  await pick("Nara Park");
  await click(await find("places selected", "button"), { after: 1500 });
});

await record("dates", page, async () => {
  await click(await find("Next: pick dates"), { after: 1100 });
  const dates = await page.$$('#plan input[type="date"]');
  await typeDate(dates[0], "03202027");
  await typeDate(dates[1], "03252027");
  await sleep(1500);
  mark("fit");
  // Lock Universal Studios Japan to a dated ticket.
  const place = await page.evaluateHandle(() =>
    [...document.querySelectorAll("#plan select")].find((s) => [...s.options].some((o) => o.textContent.includes("Choose a place")))
  ).then((h) => h.asElement());
  if (place) {
    await pointAt(place);
    await sleep(250);
    const value = await place.evaluate((s) => [...s.options].find((o) => o.textContent.includes("Universal"))?.value);
    if (value) await place.select(value);
    await sleep(500);
    const all = await page.$$('#plan input[type="date"]');
    await typeDate(all[all.length - 1], "03232027");
    await click(await find("Lock date"), { after: 1500 });
  }
});

await record("itinerary", page, async () => {
  await click(await find("Build itinerary"), { after: 0 });
  await page.waitForSelector("#plan .leaflet-container", { timeout: 60000 });
  await sleep(2600);
  const map = await page.$("#plan .leaflet-container");
  await pointAt(map, { dx: 0.55, dy: 0.5, ms: 700 });
  await sleep(1500);
  mark("map");
  const checklist = await find("Things to Book Before Your Trip", "h3");
  await checklist.evaluate((n) => n.closest("section").scrollIntoView({ behavior: "smooth", block: "start" }));
  await sleep(700);
  await glide(760, 420, 500);
  await sleep(2400);
  mark("checklist");
  const stay = await find("Where to stay in", "h4");
  await stay.evaluate((n) => n.scrollIntoView({ behavior: "smooth", block: "center" }));
  await sleep(1500);
  await click(await find("Compare", "button"), { after: 1700 });
  mark("stay");
  await click(await find("Day 3", "nav button"), { after: 1900 });
  const plan = await page.evaluateHandle(() => {
    const day = document.getElementById("day-3");
    return [...(day?.parentElement?.querySelectorAll("p") || [])].find((p) => p.textContent.includes("Suggested day plan")) || null;
  }).then((h) => h.asElement());
  if (plan) {
    await plan.evaluate((n) => n.parentElement.scrollIntoView({ behavior: "smooth", block: "center" }));
    await sleep(700);
    await glide(700, 380, 500);
    await sleep(2300);
  }
  mark("schedule");
  const mover = await page.$("#day-3 select");
  if (mover) {
    await pointAt(mover);
    await sleep(350);
    await mover.select("3");
    await sleep(600);
    const d4 = await page.$("#day-4");
    await d4?.evaluate((n) => n.scrollIntoView({ behavior: "smooth", block: "center" }));
    await sleep(1900);
  }
});

let shareUrl = "";
await record("share", page, async () => {
  await page.evaluate(() => document.querySelector("#plan .shadow-lg").scrollIntoView({ behavior: "smooth", block: "start" }));
  await sleep(1100);
  await click(await find("Share trip"), { after: 0 });
  mark("clicked");
  await page.waitForSelector('#plan input[aria-label="Shareable link"]', { timeout: 40000 });
  mark("shown");
  await sleep(1300);
  shareUrl = await page.$eval('#plan input[aria-label="Shareable link"]', (i) => i.value);
  await click(await find("Copy link"), { after: 1300 });
  await pointAt(await find("Open trip guide", "a"));
  await sleep(700);
});
console.log("share url length", shareUrl.length);

// ---------- the shared guide, as it opens on a phone
const phone = await newPage({ width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, false);
await phone.goto(shareUrl, { waitUntil: "networkidle2", timeout: 120000 });
await sleep(1500);
await record("phone", phone, async () => {
  await sleep(1200);
  for (let i = 0; i < 3; i++) {
    await phone.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
    await sleep(1500);
  }
});

await browser.close();
writeFileSync(path.join(here, "marks.json"), JSON.stringify(marks, null, 1));
console.log(JSON.stringify(marks));
