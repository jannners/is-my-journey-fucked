// Live check: loads the real page against real TfL data in a headless browser and records
// what it says, so the page can be tested properly (GitHub's servers can reach TfL).
// Run by .github/workflows/live-check.yml. Results go to the "live-results" branch.
//
// Run it yourself:  npm i playwright@1.49.1 && npx playwright install chromium && node tests/live-check.mjs
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "results");
fs.mkdirSync(OUT, { recursive: true });

// Tiny static file server so the page and stations.json load as they do on GitHub Pages.
const TYPES = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  const file = p.endsWith("/") ? path.join(p, "index.html") : p;
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const ukNow = () => new Date().toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
const VIEWS = [
  ["auto (time of day)", ""],
  ["to Woodgrange Park", "#to-woodgrange"],
  ["to Ockendon", "#to-ockendon"],
  ["Elsewhere: OCK to LST", "#go/OCK/LST"],
];

const browser = await chromium.launch();
const results = [];
for (const [name, hash] of VIEWS) {
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const errors = [], tfl = [];
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("response", r => { if (r.url().includes("api.tfl.gov.uk")) tfl.push(`${r.status()} ${r.url().replace("https://api.tfl.gov.uk", "")}`); });
  await page.goto(BASE + hash);
  let finished = true;
  try { await page.waitForFunction(() => document.getElementById("updated").textContent.startsWith("Checked"), null, { timeout: 60000 }); }
  catch { finished = false; }
  await page.waitForTimeout(5000); // let the live boards fill in
  const text = id => page.locator("#" + id).innerText().catch(() => "");
  const slug = name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  await page.screenshot({ path: path.join(OUT, slug + ".png"), fullPage: true });
  results.push({
    name, hash, finished,
    question: await text("question"), answer: await text("answer"), sub: await text("sub"), planB: await text("alt"),
    dirNote: await text("dirNote"), route: await text("route"), journeys: await text("journeys"),
    live: await text("live"), netsum: await text("netsum"), whatWentWrong: await text("debug"),
    errors, tfl, screenshot: slug + ".png",
  });
  await page.close();
}
await browser.close();
server.close();

// Raw TfL answers for the three commute lines, to compare with what the page showed.
const raw = {};
for (const [k, p] of [["status", "/Line/district,suffragette/Status"], ["nationalRail", "/Line/Mode/national-rail/Status"]]) {
  try { raw[k] = await (await fetch("https://api.tfl.gov.uk" + p)).json(); } catch (e) { raw[k] = String(e); }
}
const c2c = Array.isArray(raw.nationalRail) ? raw.nationalRail.find(l => l.id === "c2c" || /^c2c$/i.test(l.name)) : null;
const brief = l => l ? { id: l.id, name: l.name, statuses: (l.lineStatuses || []).map(s => ({ severity: s.statusSeverity, description: s.statusSeverityDescription, reason: s.reason || "" })) } : null;
const lines = [...(Array.isArray(raw.status) ? raw.status.map(brief) : []), brief(c2c)].filter(Boolean);

fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ checkedAt: ukNow(), lines, results }, null, 2));
// Full, untrimmed TfL records (including which stops each disruption covers), for debugging.
fs.writeFileSync(path.join(OUT, "raw-lines.json"), JSON.stringify({ checkedAt: ukNow(), status: raw.status, c2c }, null, 2));
try {
  const seq = await (await fetch("https://api.tfl.gov.uk/Line/district/Route/Sequence/all")).json();
  fs.writeFileSync(path.join(OUT, "raw-district-sequence.json"), JSON.stringify(seq.orderedLineRoutes || seq, null, 2));
} catch {}
const md = [`# Live check, ${ukNow()} (UK time)`, "", "## What TfL says", "",
  ...lines.map(l => `- **${l.name}** (\`${l.id}\`): ` + l.statuses.map(s => `${s.description} [${s.severity}]${s.reason ? " — " + s.reason.replace(/\s+/g, " ") : ""}`).join("; ")),
  "", "## What the page says", "",
  ...results.flatMap(r => [`### ${r.name}`, "", `**${r.answer}** — ${r.sub}`, "", ...(r.planB ? [`> ${r.planB}`, ""] : []), `- Question: ${r.question}`, `- Note: ${r.dirNote}`,
    `- Finished loading: ${r.finished}`, `- Route: ${r.route.replace(/\n+/g, " / ")}`, `- Journeys: ${r.journeys.replace(/\n+/g, " / ")}`,
    `- Live: ${r.live.replace(/\n+/g, " / ")}`, `- Every line: ${r.netsum.replace(/\n+/g, " ")}`,
    `- Failed TfL requests: ${r.whatWentWrong || "none"}`, `- Page errors: ${r.errors.join(" | ") || "none"}`,
    `- TfL requests: ${r.tfl.join(", ")}`, `- Screenshot: ${r.screenshot}`, ""])];
fs.writeFileSync(path.join(OUT, "README.md"), md.join("\n"));
console.log(md.join("\n"));
