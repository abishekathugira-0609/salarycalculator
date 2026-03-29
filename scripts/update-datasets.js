#!/usr/bin/env node
/**
 * scripts/update-datasets.js
 *
 * Downloads and normalises real-world salary / rent / cost-of-living data
 * into the /data/ JSON files consumed by the app.
 *
 * Data sources:
 *  - BLS OEWS API  : https://api.bls.gov/publicAPI/v2/timeseries/data/
 *  - HUD FMR API   : https://www.huduser.gov/hudapi/public/fmr/statedata/{state}
 *  - COL           : derived from HUD rent vs national median (no separate API)
 *
 * Run manually  : node scripts/update-datasets.js
 * npm shortcut  : npm run update-data
 *
 * Environment variables (optional):
 *  BLS_API_KEY   – BLS registration key (higher rate limit)
 *  HUD_API_TOKEN – HUD HUDUSER API bearer token
 */

"use strict";

const fs   = require("fs");
const path = require("path");
const https = require("https");

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT      = path.resolve(__dirname, "..");
const DATA_DIR  = path.join(ROOT, "data");
const LOG_FILE  = path.join(DATA_DIR, ".update-log.json");

const OUT = {
  salary : path.join(DATA_DIR, "bls-salary.json"),
  rent   : path.join(DATA_DIR, "rent-by-city.json"),
  col    : path.join(DATA_DIR, "cost-of-living.json"),
  jobs   : path.join(DATA_DIR, "jobs.json"),
};

// ── Logger ────────────────────────────────────────────────────────────────────

const log = {
  startedAt : new Date().toISOString(),
  steps     : [],
  errors    : [],
};

function info(msg)  { console.log(`[INFO]  ${msg}`);  log.steps.push({ ts: new Date().toISOString(), msg }); }
function warn(msg)  { console.warn(`[WARN]  ${msg}`); log.steps.push({ ts: new Date().toISOString(), msg: `WARN: ${msg}` }); }
function error(msg) { console.error(`[ERROR] ${msg}`); log.errors.push({ ts: new Date().toISOString(), msg }); }

// ── HTTP helper ───────────────────────────────────────────────────────────────

function fetchJSON(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const options = {
      hostname : opts.hostname,
      path     : opts.pathname + opts.search,
      method,
      headers  : { "Content-Type": "application/json", ...headers },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── File helpers ──────────────────────────────────────────────────────────────

function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch { return null; }
}

function writeJSON(filePath, data, label) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  info(`Wrote ${Object.keys(data).length} entries → ${path.relative(ROOT, filePath)} [${label}]`);
}

// ── Job → BLS OES mapping ─────────────────────────────────────────────────────
//
// BLS national series IDs for annual wages by occupation (SOC):
//   OEUN000000{occ8}13  = median annual wage  (datatype 13)
//   OEUN000000{occ8}12  = 25th percentile      (datatype 12)
//   OEUN000000{occ8}14  = 75th percentile      (datatype 14)
//
// Area code 0000000 = national; industry code 000000 = cross-industry.

const JOB_SOC_MAP = {
  "software-engineer"          : "15113200",
  "data-scientist"             : "15219100",
  "product-manager"            : "11202100",
  "registered-nurse"           : "29114100",
  "physician"                  : "29120000",
  "dentist"                    : "29102200",
  "pharmacist"                 : "29105100",
  "physical-therapist"         : "29112300",
  "teacher"                    : "25202200",
  "lawyer"                     : "23101100",
  "accountant"                 : "13201100",
  "financial-analyst"          : "13205100",
  "marketing-manager"          : "11202101",
  "mechanical-engineer"        : "17214100",
  "civil-engineer"             : "17202100",
  "electrical-engineer"        : "17207100",
  "construction-manager"       : "11902100",
  "sales-manager"              : "11202200",
  "human-resources-manager"    : "11312100",
  "graphic-designer"           : "27102400",
  "ux-designer"                : "15124300",
  "cybersecurity-analyst"      : "15112200",
  "cloud-architect"            : "15114900",
  "devops-engineer"            : "15114900",  // mapped to network architects
  "database-administrator"     : "15124500",
  "project-manager"            : "13115100",
  "operations-manager"         : "11102100",
  "supply-chain-manager"       : "11302100",
  "real-estate-agent"          : "41902200",
  "insurance-agent"            : "41302100",
  "social-worker"              : "21102300",
  "psychologist"               : "19303100",
  "veterinarian"               : "29124500",
  "chef"                       : "35101100",
  "electrician"                : "47211100",
};

// ── BLS OEWS salary update ────────────────────────────────────────────────────

async function updateSalaryData() {
  info("── Updating BLS OEWS salary data ──");

  const existing = readJSON(OUT.salary) || {};
  const jobs     = Object.keys(JOB_SOC_MAP);
  const apiKey   = process.env.BLS_API_KEY || "";

  // Build series IDs for all 3 percentiles across all jobs
  const seriesIds = [];
  for (const [, soc] of Object.entries(JOB_SOC_MAP)) {
    seriesIds.push(`OEUN000000${soc}12`); // p25
    seriesIds.push(`OEUN000000${soc}13`); // median
    seriesIds.push(`OEUN000000${soc}14`); // p75
  }

  // BLS API accepts max 50 series per request — batch them
  const BATCH = 50;
  const results = {}; // soc → { p25, median, p75 }

  for (let i = 0; i < seriesIds.length; i += BATCH) {
    const batch = seriesIds.slice(i, i + BATCH);
    const payload = {
      seriesid   : batch,
      startyear  : "2023",
      endyear    : "2024",
      annualaverage: false,
    };
    if (apiKey) payload.registrationkey = apiKey;

    try {
      const res = await fetchJSON("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
        method  : "POST",
        body    : payload,
      });

      if (res.status !== "REQUEST_SUCCEEDED") {
        warn(`BLS API returned status: ${res.status} — ${(res.message || []).join("; ")}`);
        continue;
      }

      for (const series of (res.Results?.series || [])) {
        const id  = series.seriesID; // e.g. OEUN00000015113200 13
        const soc = id.slice(10, 18); // chars 10-17 = 8-digit SOC
        const dt  = id.slice(18);     // chars 18+ = datatype (12/13/14)

        // Pick most recent annual value
        const latest = (series.data || []).find(
          (d) => d.period === "A01" && d.value !== "-"
        );
        if (!latest) continue;

        const value = Math.round(Number(latest.value.replace(/,/g, "")));
        if (!results[soc]) results[soc] = {};
        if (dt === "12") results[soc].p25    = value;
        if (dt === "13") results[soc].median = value;
        if (dt === "14") results[soc].p75    = value;
      }
    } catch (e) {
      error(`BLS batch ${i / BATCH + 1} failed: ${e.message}`);
    }
  }

  // Map SOC results back to job slugs
  const updated = { ...existing };
  let newCount = 0;

  for (const [slug, soc] of Object.entries(JOB_SOC_MAP)) {
    const r = results[soc];
    if (r?.median && r?.p25 && r?.p75) {
      updated[slug] = { median: r.median, p25: r.p25, p75: r.p75 };
      newCount++;
    } else if (!existing[slug]) {
      warn(`No BLS data for ${slug} (SOC ${soc}) — using fallback`);
    }
  }

  info(`BLS: updated ${newCount}/${jobs.length} job salary entries`);
  writeJSON(OUT.salary, updated, "bls-salary");

  // Keep jobs.json in sync with salary keys
  const jobSlugs = Object.keys(updated).sort();
  writeJSON(OUT.jobs, jobSlugs, "jobs");
}

// ── State → FIPS code map (for HUD API) ──────────────────────────────────────

const STATE_FIPS = {
  AL:"01", AK:"02", AZ:"04", AR:"05", CA:"06", CO:"08", CT:"09", DE:"10",
  DC:"11", FL:"12", GA:"13", HI:"15", ID:"16", IL:"17", IN:"18", IA:"19",
  KS:"20", KY:"21", LA:"22", ME:"23", MD:"24", MA:"25", MI:"26", MN:"27",
  MS:"28", MO:"29", MT:"30", NE:"31", NV:"32", NH:"33", NJ:"34", NM:"35",
  NY:"36", NC:"37", ND:"38", OH:"39", OK:"40", OR:"41", PA:"42", RI:"44",
  SC:"45", SD:"46", TN:"47", TX:"48", UT:"49", VT:"50", VA:"51", WA:"53",
  WV:"54", WI:"55", WY:"56",
};

// City slug → canonical display name (for matching HUD area names)
const CITY_NAME_MAP = {
  "new-york"       : ["New York"],
  "los-angeles"    : ["Los Angeles"],
  "chicago"        : ["Chicago"],
  "houston"        : ["Houston"],
  "phoenix"        : ["Phoenix"],
  "philadelphia"   : ["Philadelphia"],
  "san-antonio"    : ["San Antonio"],
  "san-diego"      : ["San Diego"],
  "dallas"         : ["Dallas"],
  "san-jose"       : ["San Jose"],
  "austin"         : ["Austin"],
  "jacksonville"   : ["Jacksonville"],
  "fort-worth"     : ["Fort Worth"],
  "columbus"       : ["Columbus"],
  "charlotte"      : ["Charlotte"],
  "indianapolis"   : ["Indianapolis"],
  "san-francisco"  : ["San Francisco"],
  "seattle"        : ["Seattle"],
  "denver"         : ["Denver"],
  "nashville"      : ["Nashville"],
  "boston"         : ["Boston"],
  "portland"       : ["Portland"],
  "las-vegas"      : ["Las Vegas"],
  "memphis"        : ["Memphis"],
  "atlanta"        : ["Atlanta"],
  "miami"          : ["Miami"],
  "minneapolis"    : ["Minneapolis"],
  "raleigh"        : ["Raleigh"],
  "tampa"          : ["Tampa"],
  "orlando"        : ["Orlando"],
  "salt-lake-city" : ["Salt Lake City"],
  "richmond"       : ["Richmond"],
  "pittsburgh"     : ["Pittsburgh"],
  "cincinnati"     : ["Cincinnati"],
  "kansas-city"    : ["Kansas City"],
  "st-louis"       : ["St. Louis", "Saint Louis"],
  "cleveland"      : ["Cleveland"],
  "sacramento"     : ["Sacramento"],
  "san-bernardino" : ["San Bernardino"],
  "baton-rouge"    : ["Baton Rouge"],
  "oklahoma-city"  : ["Oklahoma City"],
  "tucson"         : ["Tucson"],
  "fresno"         : ["Fresno"],
  "albuquerque"    : ["Albuquerque"],
  "mesa"           : ["Mesa"],
  "omaha"          : ["Omaha"],
  "long-beach"     : ["Long Beach"],
  "virginia-beach" : ["Virginia Beach"],
  "colorado-springs": ["Colorado Springs"],
};

// ── HUD FMR rent update ───────────────────────────────────────────────────────

async function updateRentData() {
  info("── Updating HUD Fair Market Rent data ──");

  const existing = readJSON(OUT.rent) || {};
  const token    = process.env.HUD_API_TOKEN || "";

  if (!token) {
    warn("HUD_API_TOKEN not set — skipping HUD rent update (using existing data)");
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const updated = { ...existing };
  let fetched = 0;
  let matched = 0;

  // Fetch FMR data per state and match city names
  for (const [stateCode, fips] of Object.entries(STATE_FIPS)) {
    try {
      const url = `https://www.huduser.gov/hudapi/public/fmr/statedata/${stateCode}?year=2025`;
      const res = await fetchJSON(url, { headers });

      const areas = res?.data?.metroareas || [];

      for (const area of areas) {
        const areaName = (area.metro_name || area.area_name || "").toLowerCase();

        // Try to match against our city slug list
        for (const [slug, names] of Object.entries(CITY_NAME_MAP)) {
          const hit = names.some((n) => areaName.includes(n.toLowerCase()));
          if (!hit) continue;

          const rent1br = Math.round(area.Efficiency || area["1bedroom"] || 0);
          const rent2br = Math.round(area["2bedroom"] || 0);

          if (rent1br > 0) {
            updated[slug] = {
              "1br": rent1br,
              "2br": rent2br || Math.round(rent1br * 1.25),
            };
            matched++;
          }
        }
      }

      fetched++;
    } catch (e) {
      warn(`HUD fetch failed for ${stateCode}: ${e.message}`);
    }
  }

  info(`HUD: fetched ${fetched}/51 states, matched ${matched} city rent entries`);
  writeJSON(OUT.rent, updated, "rent-by-city");
}

// ── Cost-of-living derivation ─────────────────────────────────────────────────
//
// Methodology: derive COL index from 1BR rent relative to national median.
// National median 1BR FMR 2025 ≈ $1,200/month (HUD national).
// We blend rent weight (60%) with a fixed regional adjustment (40%) to
// approximate the full BLS CPI regional cost basket.
//
// COL = 0.6 × (cityRent / nationalMedianRent) + 0.4 × regionFactor
//
// Region factors (approximate BLS regional CPI relatives 2024):
//   Northeast: 1.15, West: 1.20, South: 0.92, Midwest: 0.93

const NATIONAL_MEDIAN_RENT = 1200; // 2025 estimate

// State → BLS region factor (from BLS regional CPI relatives)
const STATE_REGION_FACTOR = {
  CT:"1.15",ME:"1.10",MA:"1.20",NH:"1.12",NJ:"1.18",NY:"1.25",PA:"1.08",RI:"1.12",VT:"1.10",
  IL:"0.95",IN:"0.90",MI:"0.92",OH:"0.90",WI:"0.90",IA:"0.87",KS:"0.88",MN:"0.93",MO:"0.90",NE:"0.88",ND:"0.87",SD:"0.87",
  AL:"0.88",AR:"0.85",DC:"1.30",DE:"1.05",FL:"1.00",GA:"0.92",KY:"0.88",LA:"0.89",MD:"1.15",MS:"0.84",NC:"0.92",OK:"0.87",SC:"0.90",TN:"0.90",TX:"0.95",VA:"1.05",WV:"0.84",
  AK:"1.20",AZ:"0.98",CA:"1.35",CO:"1.10",HI:"1.45",ID:"0.95",MT:"0.93",NV:"1.02",NM:"0.90",OR:"1.08",UT:"1.02",WA:"1.15",WY:"0.90",
};

// City → state code (for region lookup)
const CITY_STATE = {
  "new-york":"NY","los-angeles":"CA","chicago":"IL","houston":"TX","phoenix":"AZ",
  "philadelphia":"PA","san-antonio":"TX","san-diego":"CA","dallas":"TX","san-jose":"CA",
  "austin":"TX","jacksonville":"FL","fort-worth":"TX","columbus":"OH","charlotte":"NC",
  "indianapolis":"IN","san-francisco":"CA","seattle":"WA","denver":"CO","nashville":"TN",
  "boston":"MA","portland":"OR","las-vegas":"NV","memphis":"TN","atlanta":"GA",
  "miami":"FL","minneapolis":"MN","raleigh":"NC","tampa":"FL","orlando":"FL",
  "salt-lake-city":"UT","richmond":"VA","pittsburgh":"PA","cincinnati":"OH",
  "kansas-city":"MO","st-louis":"MO","cleveland":"OH","sacramento":"CA",
  "san-bernardino":"CA","baton-rouge":"LA","oklahoma-city":"OK","tucson":"AZ",
  "fresno":"CA","albuquerque":"NM","mesa":"AZ","omaha":"NE","long-beach":"CA",
  "virginia-beach":"VA","colorado-springs":"CO",
  // Additional cities (sitemap priority cities)
  "washington-dc":"DC","santa-clara":"CA","hoboken":"NJ","glendale":"CA",
  "oakland":"CA","irvine":"CA","west-palm-beach":"FL","alpharetta":"GA",
  "sandy-springs":"GA","bethesda":"MD","redmond":"WA",
};

async function updateCOLData() {
  info("── Deriving cost-of-living index from rent data ──");

  const rentData = readJSON(OUT.rent) || {};
  const existing = readJSON(OUT.col)  || {};
  const updated  = { ...existing };
  let count = 0;

  for (const [city, rent] of Object.entries(rentData)) {
    const rent1br = rent["1br"] || 0;
    if (!rent1br) continue;

    const stateCode    = CITY_STATE[city] || "TX";
    const regionFactor = parseFloat(STATE_REGION_FACTOR[stateCode] || "1.00");
    const rentFactor   = rent1br / NATIONAL_MEDIAN_RENT;
    const col          = parseFloat((0.6 * rentFactor + 0.4 * regionFactor).toFixed(2));

    updated[city] = {
      index            : col,
      foodMonthly      : Math.round(440 * col),
      transportMonthly : Math.round(175 * col),
      utilitiesMonthly : Math.round(165 * col),
      healthcareMonthly: Math.round(200 * col),
    };
    count++;
  }

  info(`COL: derived ${count} city indexes from rent data`);
  writeJSON(OUT.col, updated, "cost-of-living");
}

// ── Run log ───────────────────────────────────────────────────────────────────

function saveLog(success) {
  log.finishedAt   = new Date().toISOString();
  log.success      = success;
  log.errorCount   = log.errors.length;

  const history = readJSON(LOG_FILE) || [];
  history.unshift(log);
  // Keep last 10 runs
  fs.writeFileSync(LOG_FILE, JSON.stringify(history.slice(0, 10), null, 2), "utf8");
  info(`Run log saved → ${path.relative(ROOT, LOG_FILE)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log(" know-your-pay dataset updater");
  console.log(`  ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  let success = true;

  try {
    await updateSalaryData();
  } catch (e) {
    error(`Salary update failed: ${e.message}`);
    success = false;
  }

  try {
    await updateRentData();
  } catch (e) {
    error(`Rent update failed: ${e.message}`);
    success = false;
  }

  try {
    await updateCOLData();
  } catch (e) {
    error(`COL update failed: ${e.message}`);
    success = false;
  }

  saveLog(success);

  console.log("=".repeat(60));
  if (log.errors.length) {
    console.error(`Completed with ${log.errors.length} error(s).`);
    process.exit(1);
  } else {
    console.log("All datasets updated successfully.");
  }
}

main().catch((e) => {
  error(`Fatal: ${e.message}`);
  saveLog(false);
  process.exit(1);
});
