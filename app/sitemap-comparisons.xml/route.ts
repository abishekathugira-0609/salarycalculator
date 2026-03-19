import { NextResponse } from "next/server";
import { BASE_URL, SEED_CITIES, PRIORITY_JOBS } from "@/lib/seo";
import { CITY_COSTS } from "@/data/city-costs";
import { cityToSlug, STATE_CODE_MAP } from "@/lib/stateCodeMap";

export const revalidate = 86400;

/**
 * sitemap-comparisons.xml
 *
 * Comparison and insight pages:
 *   /compare/[cityA]-vs-[cityB]           30 × 29 = 870 pairs
 *   /remote-tax/[liveState]/[workState]   20 × 19 = 380 pairs
 *   /negotiation-insights/[job]/[city]    10 × 50 = 500
 *   /salary-inflation/[job]/[city]        10 × 50 = 500
 *   /migration/[fromCity]/[toCity]        20 × 19 = 380 pairs
 *
 * Total ≈ 2,630 URLs
 */

// Top 30 cities for compare matrix
const COMPARE_CITIES: string[] = Object.values(CITY_COSTS)
  .flat()
  .sort((a, b) => b.seoWeight - a.seoWeight)
  .slice(0, 30)
  .map((c) => cityToSlug(c.city));

// Top 20 cities for migration matrix
const MIGRATION_CITIES: string[] = SEED_CITIES.slice(0, 20);

// Top 20 states for remote-tax matrix: 20 × 19 = 380 pairs
const REMOTE_TAX_STATES = [
  "california","texas","florida","new-york","illinois","pennsylvania","ohio",
  "georgia","north-carolina","michigan","new-jersey","virginia","washington",
  "arizona","massachusetts","tennessee","indiana","colorado","nevada","maryland",
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

  // /compare/[cityA]-vs-[cityB]
  for (const cityA of COMPARE_CITIES) {
    for (const cityB of COMPARE_CITIES) {
      if (cityA !== cityB) {
        entries.push(urlEntry(`/compare/${cityA}-vs-${cityB}`, "0.7", "monthly"));
      }
    }
  }

  // /remote-tax/[liveState]/[workState]
  for (const liveState of REMOTE_TAX_STATES) {
    for (const workState of REMOTE_TAX_STATES) {
      if (liveState !== workState) {
        entries.push(urlEntry(`/remote-tax/${liveState}/${workState}`, "0.6", "monthly"));
      }
    }
  }

  // /negotiation-insights/[job]/[city] — top 10 jobs × top 50 cities
  for (const job of PRIORITY_JOBS) {
    for (const city of SEED_CITIES) {
      entries.push(urlEntry(`/negotiation-insights/${job}/${city}`, "0.7", "monthly"));
    }
  }

  // /salary-inflation/[job]/[city] — top 10 jobs × top 50 cities
  for (const job of PRIORITY_JOBS) {
    for (const city of SEED_CITIES) {
      entries.push(urlEntry(`/salary-inflation/${job}/${city}`, "0.7", "monthly"));
    }
  }

  // /migration/[fromCity]/[toCity] — top 20 cities × 19 pairs
  for (const fromCity of MIGRATION_CITIES) {
    for (const toCity of MIGRATION_CITIES) {
      if (fromCity !== toCity) {
        entries.push(urlEntry(`/migration/${fromCity}/${toCity}`, "0.6", "monthly"));
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
