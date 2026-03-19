/**
 * build-datasets.js
 *
 * Transforms existing rent-by-city.json and cost-of-living.json into
 * the full-featured dataset format, and generates food-costs.json.
 *
 * Sources used for national baseline figures:
 *   - HUD FMR 2026: studio ≈ 78% of 1BR, 3BR ≈ 133% of 2BR
 *   - MIT Living Wage Calculator (2024): food costs by household size
 *   - BLS CPI (2024): transport, utilities, healthcare monthly averages
 *   - USDA Food Cost Plans (2024): household food expenditure benchmarks
 *
 * National baseline (single adult, per month, 2026 estimate):
 *   food:        $440  (USDA low-cost food plan, adjusted for CPI)
 *   transport:   $175  (BLS consumer expenditure survey avg)
 *   utilities:   $165  (EIA residential energy avg + water/internet)
 *   healthcare:  $200  (out-of-pocket; not employer-sponsored premium)
 *
 * Food by household size (USDA + MIT Living Wage):
 *   single:  $440
 *   couple:  $790   (1.8× single — economies of scale)
 *   family3: $1,050 (2.4× single)
 *   family4: $1,270 (2.9× single)
 */

const fs   = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

// ── Load existing data ──────────────────────────────────────────────────────
const rentRaw = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "rent-by-city.json"), "utf8")
);
const colRaw = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "cost-of-living.json"), "utf8")
);

// ── National baselines ──────────────────────────────────────────────────────
const FOOD_SINGLE   = 440;
const FOOD_COUPLE   = 790;
const FOOD_FAMILY3  = 1050;
const FOOD_FAMILY4  = 1270;
const TRANSPORT_BASE    = 175;
const UTILITIES_BASE    = 165;
const HEALTHCARE_BASE   = 200;

function r10(n) { return Math.round(n / 10) * 10; }  // round to $10
function r1(n)  { return Math.round(n); }             // round to $1

// ── 1. Build new rent-by-city.json (add studio + family) ───────────────────
const newRent = {};
for (const [city, data] of Object.entries(rentRaw)) {
  const br1    = data["1br"];
  const br2    = data["2br"];
  const studio = r10(br1 * 0.78);
  const family = r10(br2 * 1.33);
  newRent[city] = { studio, "1br": br1, "2br": br2, family };
}

// ── 2. Build new cost-of-living.json (expand to detailed breakdown) ─────────
const newCOL = {};
for (const [city, indexVal] of Object.entries(colRaw)) {
  // colRaw may be a plain number or already an object — handle both
  const index = typeof indexVal === "number" ? indexVal : indexVal.index;
  newCOL[city] = {
    index:             Math.round(index * 100) / 100,
    foodMonthly:       r1(FOOD_SINGLE   * index),
    transportMonthly:  r1(TRANSPORT_BASE * index),
    utilitiesMonthly:  r1(UTILITIES_BASE * index),
    healthcareMonthly: r1(HEALTHCARE_BASE * index),
  };
}

// ── 3. Build food-costs.json (all household sizes) ─────────────────────────
//   Uses COL index to scale national USDA/MIT Living Wage baselines.
//   If city not in COL index, default to 1.0.
const foodCosts = {};

// Collect all cities from rent data (largest set)
const allCities = new Set([
  ...Object.keys(rentRaw),
  ...Object.keys(colRaw),
]);

for (const city of allCities) {
  const indexVal = colRaw[city];
  const index = typeof indexVal === "number"
    ? indexVal
    : (typeof indexVal === "object" && indexVal?.index) || 1.0;

  foodCosts[city] = {
    single:  r1(FOOD_SINGLE  * index),
    couple:  r1(FOOD_COUPLE  * index),
    family3: r1(FOOD_FAMILY3 * index),
    family4: r1(FOOD_FAMILY4 * index),
  };
}

// ── Write files ─────────────────────────────────────────────────────────────
fs.writeFileSync(
  path.join(DATA_DIR, "rent-by-city.json"),
  JSON.stringify(newRent, null, 2),
  "utf8"
);
console.log("✓ rent-by-city.json updated with studio + family tiers");

fs.writeFileSync(
  path.join(DATA_DIR, "cost-of-living.json"),
  JSON.stringify(newCOL, null, 2),
  "utf8"
);
console.log("✓ cost-of-living.json updated with detailed breakdown");

fs.writeFileSync(
  path.join(DATA_DIR, "food-costs.json"),
  JSON.stringify(foodCosts, null, 2),
  "utf8"
);
console.log(`✓ food-costs.json created (${Object.keys(foodCosts).length} cities)`);

// ── Summary ─────────────────────────────────────────────────────────────────
console.log("\nDataset summary:");
console.log(`  rent-by-city: ${Object.keys(newRent).length} cities (studio/1br/2br/family)`);
console.log(`  cost-of-living: ${Object.keys(newCOL).length} cities (index/food/transport/utilities/healthcare)`);
console.log(`  food-costs: ${Object.keys(foodCosts).length} cities (single/couple/family3/family4)`);
