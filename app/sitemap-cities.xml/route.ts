import { NextResponse } from "next/server";
import { BASE_URL, SEED_CITIES, PRIORITY_CITIES, PRIORITY_SALARIES, ALL_SALARY_BUCKETS } from "@/lib/seo";
import { CITY_COSTS } from "@/data/city-costs";
import { cityToSlug } from "@/lib/stateCodeMap";

export const revalidate = 86400;

/**
 * sitemap-cities.xml
 *
 * City-centric affordability and lifestyle pages:
 *   /is-salary-good/[salary]/[city]        7 × 150 = 1,050
 *   /can-you-afford/[salary]/[price]/[city] 6 × 4 × 50 = 1,200
 *   /city-living/[city]                    150
 *   /best-cities/[state]/[salary]          15 × 12 = 180
 *   /monthly-budget-simulation/[salary]/[city] 7 × 150 = 1,050
 *
 * Total ≈ 3,630 URLs
 */

const ALL_CITIES: string[] = Object.values(CITY_COSTS)
  .flat()
  .sort((a, b) => b.seoWeight - a.seoWeight)
  .slice(0, 150)
  .map((c) => cityToSlug(c.city));

const HOUSE_PRICES = [250000, 350000, 500000, 700000];
const AFFORD_SALARIES = [60000, 80000, 100000, 125000, 150000, 200000];

const BEST_CITIES_STATES = [
  "california","texas","florida","new-york","washington","illinois",
  "pennsylvania","georgia","arizona","colorado","massachusetts","north-carolina",
  "nevada","virginia","tennessee",
];

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  function urlEntry(path: string, priority: string, changefreq: string) {
    return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }

  // /is-salary-good/[salary]/[city] — 7 priority salaries × 150 cities
  for (const salary of PRIORITY_SALARIES) {
    for (const city of ALL_CITIES) {
      entries.push(urlEntry(`/is-salary-good/${salary}/${city}`, "0.8", "weekly"));
    }
  }

  // /monthly-budget-simulation/[salary]/[city] — 7 priority salaries × 150 cities
  for (const salary of PRIORITY_SALARIES) {
    for (const city of ALL_CITIES) {
      entries.push(urlEntry(`/monthly-budget-simulation/${salary}/${city}`, "0.7", "monthly"));
    }
  }

  // /can-you-afford/[salary]/[housePrice]/[city] — 6 × 4 × 50
  for (const salary of AFFORD_SALARIES) {
    for (const hp of HOUSE_PRICES) {
      for (const city of SEED_CITIES) {
        entries.push(urlEntry(`/can-you-afford/${salary}/${hp}/${city}`, "0.7", "monthly"));
      }
    }
  }

  // /city-living/is-[salary]-enough-in-[city] — representative salaries × 150 cities
  for (const salary of [60000, 100000, 150000]) {
    for (const city of ALL_CITIES) {
      entries.push(urlEntry(`/city-living/is-${salary}-enough-in-${city}`, "0.7", "weekly"));
    }
  }

  // /best-cities/[state]/[salary]
  for (const state of BEST_CITIES_STATES) {
    for (const salary of ALL_SALARY_BUCKETS) {
      entries.push(urlEntry(`/best-cities/${state}/${salary}`, "0.6", "monthly"));
    }
  }

  // /comfortable-salary/[city] — cities with seoWeight >= 3
  const comfortCities = Object.values(CITY_COSTS)
    .flat()
    .filter((c) => c.seoWeight >= 3)
    .map((c) => cityToSlug(c.city));
  for (const city of comfortCities) {
    entries.push(urlEntry(`/comfortable-salary/${city}`, "0.8", "monthly"));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
