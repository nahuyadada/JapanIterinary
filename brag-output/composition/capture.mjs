// Captures the app's real rendered components (DOM + CSS + fonts + images) from the
// running app, state by state, for build.mjs to place into the composition.
// Usage: node capture.mjs <puppeteer-core dir> <chrome path> [app url]
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [, , puppeteerDir, chromePath, appUrl = "http://localhost:3000"] = process.argv;
const require = createRequire(pathToFileURL(path.join(puppeteerDir, "package.json")));
const puppeteer = require("puppeteer-core");

const OUT = path.join(here, "assets", "app");
mkdirSync(OUT, { recursive: true });

const STORAGE = {
  step: "select",
  selectedIds: ["tokyo-sensoji", "tokyo-meiji", "kyoto-fushimi", "kyoto-kinkakuji", "kyoto-arashiyama", "kyoto-gion", "kyoto-kiyomizu"],
  start: "2027-03-20",
  end: "2027-03-25",
  manualMoves: {}, startCity: "", endCity: "", dayAllocations: {}, fixedDates: {},
  adults: 2, transportMode: "transit", stayOrigins: {}, customPlaces: [],
};

const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage();
const assets = new Map();
page.on("response", async (res) => {
  const type = res.request().resourceType();
  if (type !== "image" && type !== "font") return;
  try {
    if (res.ok()) assets.set(res.url(), { buf: await res.buffer(), mime: res.headers()["content-type"] || "" });
  } catch {}
});

const idle = () => page.waitForNetworkIdle({ idleTime: 1200, timeout: 60000 }).catch(() => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Serialise a node as the user sees it: form values written back as attributes, ids dropped. */
async function snap(selector, prep) {
  return page.evaluate(
    (selector, prep) => {
      const live = document.querySelector(selector);
      if (!live) throw new Error("missing " + selector);
      const liveFields = [...live.querySelectorAll("input,select,textarea")];
      const clone = live.cloneNode(true);
      [...clone.querySelectorAll("input,select,textarea")].forEach((el, i) => {
        const src = liveFields[i];
        if (el.tagName === "SELECT") {
          [...el.options].forEach((o, j) => (j === src.selectedIndex ? o.setAttribute("selected", "") : o.removeAttribute("selected")));
        } else if (el.type === "checkbox" || el.type === "radio") {
          src.checked ? el.setAttribute("checked", "") : el.removeAttribute("checked");
        } else {
          el.setAttribute("value", src.value);
        }
      });
      if (prep) new Function("root", prep)(clone);
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      clone.removeAttribute("id");
      clone.querySelectorAll("[for]").forEach((el) => el.removeAttribute("for"));
      clone.querySelectorAll("img").forEach((el) => {
        el.removeAttribute("loading");
        el.removeAttribute("decoding");
        el.setAttribute("src", el.src);
      });
      return clone.outerHTML;
    },
    selector,
    prep || ""
  );
}

const WIZ = "#plan .shadow-lg";
const clickText = (text) =>
  page.evaluate((text) => {
    const b = [...document.querySelectorAll("#plan button")].find((x) => x.textContent.trim().startsWith(text));
    if (!b) throw new Error("no button " + text);
    b.click();
  }, text);
/** Box of an element relative to the wizard root, in CSS px. */
const box = (fnBody) =>
  page.evaluate(
    (WIZ, fnBody) => {
      const root = document.querySelector(WIZ);
      const el = new Function("root", fnBody)(root);
      if (!el) return null;
      const a = root.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height };
    },
    WIZ,
    fnBody
  );
const btn = (text) => `return [...root.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith(${JSON.stringify(text)}))`;

const cap = { metrics: {} };

// ---- Scene 1: header + hero at 1280x720 (scaled 1.5x in the film)
await page.setViewport({ width: 1280, height: 720 });
await page.goto(appUrl, { waitUntil: "networkidle2", timeout: 120000 });
await page.evaluate((s) => localStorage.setItem("japan-itinerary-v1", JSON.stringify(s)), STORAGE);
await page.reload({ waitUntil: "networkidle2" });
await idle();
cap.htmlClass = await page.evaluate(() => document.documentElement.className);
cap.bodyClass = await page.evaluate(() => document.body.className);
cap.header = await snap("header");
cap.hero = await snap("#home");
cap.metrics.cta = await page.evaluate(() => {
  const b = [...document.querySelectorAll("#home a")].find((x) => x.textContent.includes("Start Your Journey")).getBoundingClientRect();
  return { x: b.left, y: b.top, w: b.width, h: b.height };
});

// ---- Scene 2: catalog, three selections
await page.setViewport({ width: 1280, height: 2600 });
await page.evaluate(() => document.getElementById("plan").scrollIntoView({ behavior: "instant" }));
await idle();
cap.metrics.wizardWidth = await page.evaluate((WIZ) => document.querySelector(WIZ).getBoundingClientRect().width, WIZ);
// Keep the first two regions; the film never scrolls further. The sticky bar is tagged so
// the film can pin it to the window's bottom edge the way the browser does.
const trimCatalog = `
  const secs = [...root.querySelectorAll("section")];
  secs.slice(2).forEach((s) => s.remove());
  root.querySelector(".sticky").setAttribute("data-cap", "bar");
`;
const PICKS = ["Shibuya Crossing", "Shibuya Sky", "teamLab Planets"];
cap.catalog = [await snap(WIZ, trimCatalog)];
cap.metrics.cards = [];
for (const name of PICKS) {
  cap.metrics.cards.push(await box(`return [...root.querySelectorAll(".place-grid button[aria-pressed]")].find((b) => b.textContent.includes(${JSON.stringify(name)}))`));
  await page.evaluate((name) => {
    [...document.querySelectorAll("#plan .place-grid button[aria-pressed]")].find((b) => b.textContent.includes(name)).click();
  }, name);
  await sleep(250);
  cap.catalog.push(await snap(WIZ, trimCatalog));
}
cap.metrics.next = await page.evaluate((WIZ) => {
  const root = document.querySelector(WIZ);
  const b = [...root.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith("Next: pick dates")).getBoundingClientRect();
  const bar = root.querySelector(".sticky").getBoundingClientRect();
  return { xInBar: b.left - bar.left, yInBar: b.top - bar.top, w: b.width, h: b.height, barH: bar.height };
}, WIZ);

// ---- Scene 3: dates
await clickText("Next: pick dates");
await sleep(900);
await idle();
cap.dates = await snap(
  WIZ,
  `root.querySelector(".bg-green-50.border-green-200, .bg-amber-50.border-amber-200")?.setAttribute("data-cap", "fit");`
);
cap.metrics.fit = await box(`return root.querySelector(".bg-green-50.border-green-200, .bg-amber-50.border-amber-200")`);
cap.metrics.build = await box(btn("Build itinerary"));
cap.metrics.datesH = (await box("return root")).h;

// ---- Scene 4: itinerary
await clickText("Build itinerary");
await sleep(1500);
await page.waitForSelector("#plan .leaflet-container", { timeout: 60000 });
await idle();
await sleep(1500);
const trimItin = `
  root.querySelector("nav").setAttribute("data-cap", "daynav");
  root.querySelector(".leaflet-container").setAttribute("data-cap", "map");
  const first = root.querySelector('[id="day-1"]');
  first.setAttribute("data-cap", "day1");
  const plan = first.closest("section.rounded-2xl");
  let n = plan.nextElementSibling;
  while (n) { const x = n.nextElementSibling; n.remove(); n = x; }
`;
cap.metrics.day1 = await box(`return root.querySelector('[id="day-1"]')`);
cap.metrics.daynav = await box(`return root.querySelector("nav")`);
cap.metrics.dayChip = await box(`return root.querySelector("nav button")`);
cap.metrics.map = await box(`return root.querySelector(".leaflet-container")`);
cap.itin = await snap(WIZ, trimItin);
cap.daynav = await snap(WIZ + " nav");

// ---- The app's own CSS, with every url() made absolute
cap.css = await page.evaluate(() => {
  let out = "";
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const base = sheet.href || location.href;
    for (const r of rules) {
      out += r.cssText.replace(/url\((["']?)([^)"']+)\1\)/g, (m, q, u) => (u.startsWith("data:") ? m : `url("${new URL(u, base).href}")`)) + "\n";
    }
  }
  return out;
});
await browser.close();

// ---- Save every referenced asset locally and point the captures at the copies
const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/svg+xml": ".svg", "font/woff2": ".woff2", "font/woff": ".woff", "image/avif": ".avif" };
const esc = (u) => u.replace(/&/g, "&amp;");
let blob = JSON.stringify(cap);
let saved = 0;
for (const [url, { buf, mime }] of assets) {
  const jsonUrl = JSON.stringify(url).slice(1, -1);
  const jsonEsc = JSON.stringify(esc(url)).slice(1, -1);
  if (!blob.includes(jsonUrl) && !blob.includes(jsonEsc)) continue;
  const ext = EXT[mime.split(";")[0].trim()] || path.extname(new URL(url).pathname) || ".bin";
  const name = createHash("sha1").update(url).digest("hex").slice(0, 16) + ext;
  writeFileSync(path.join(OUT, name), buf);
  blob = blob.split(jsonEsc).join("assets/app/" + name).split(jsonUrl).join("assets/app/" + name);
  saved++;
}
writeFileSync(path.join(here, "captured.json"), blob);
const left = [...new Set(blob.match(/https?:\/\/[^"'\\)\s]+\.(?:png|jpe?g|webp|woff2?)/g) || [])];
console.log(`captured ${blob.length} bytes, ${saved} assets saved, ${left.length} remote refs left`);
if (left.length) console.log(left.slice(0, 10).join("\n"));
console.log(JSON.stringify(JSON.parse(blob).metrics, null, 1));
