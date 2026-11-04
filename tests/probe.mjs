// One-off probe: which live train-time sources can a web page use, and do they need a key?
import fs from "node:fs";
const out = {};
const ORIGIN = "https://jannners.github.io";
async function hit(name, url, opts = {}) {
  try {
    const r = await fetch(url, { ...opts, headers: { Origin: ORIGIN, ...(opts.headers || {}) } });
    const text = await r.text();
    out[name] = { status: r.status, cors: r.headers.get("access-control-allow-origin"), corsHeaders: r.headers.get("access-control-allow-headers"), body: text.slice(0, 1500) };
  } catch (e) { out[name] = { error: String(e) }; }
}
const T = "https://api.tfl.gov.uk";
await hit("tfl_search_ockendon", `${T}/StopPoint/Search/Ockendon?modes=national-rail`);
let id = "910GOCKENDN";
try { id = JSON.parse(out.tfl_search_ockendon.body).matches[0].id; } catch {}
out.ockendonId = id;
await hit("tfl_arrdep_c2c", `${T}/StopPoint/${id}/ArrivalDepartures?lineIds=c2c`);
await hit("tfl_arrivals_stop", `${T}/StopPoint/${id}/Arrivals`);
await hit("tfl_line_c2c_arrivals", `${T}/Line/c2c/Arrivals/${id}`);
await hit("tfl_journey", `${T}/Journey/JourneyResults/${id}/to/910GWDGRNPK?mode=national-rail,overground,tube,elizabeth-line,dlr,walking`);
try {
  const j = JSON.parse((await (await fetch(`${T}/Journey/JourneyResults/${id}/to/910GWDGRNPK?mode=national-rail,overground,tube,elizabeth-line,dlr,walking`)).text()));
  out.journeyLegs = (j.journeys || []).slice(0, 3).map(x => (x.legs || []).map(l => ({
    mode: l.mode?.id, line: l.routeOptions?.[0]?.lineIdentifier?.id, from: l.departurePoint?.commonName, to: l.arrivalPoint?.commonName,
    dep: l.departureTime, arr: l.arrivalTime, sched: l.scheduledDepartureTime, isDisrupted: l.isDisrupted,
    disruptions: (l.disruptions || []).map(d => d.description), keys: Object.keys(l) })));
} catch (e) { out.journeyLegs = String(e); }
await hit("huxley_public", "https://huxley2.azurewebsites.net/departures/OCK/5");
await hit("rdm_no_key", "https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepBoardWithDetails/OCK");
await hit("rdm_preflight", "https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepBoardWithDetails/OCK",
  { method: "OPTIONS", headers: { "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "x-apikey" } });
await hit("rtt_preflight", "https://api.rtt.io/api/v1/json/search/OCK",
  { method: "OPTIONS", headers: { "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" } });
fs.mkdirSync("results", { recursive: true });
fs.writeFileSync("results/probe.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 20000));
