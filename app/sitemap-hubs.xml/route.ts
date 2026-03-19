import { NextResponse } from "next/server";
import { BASE_URL, ALL_SALARY_BUCKETS } from "@/lib/seo";
import statesCitiesData from "@/data/states-cities.json";
import jobsList from "@/data/jobs.json";

export const revalidate = 86400;

/**
 * sitemap-hubs.xml
 *
 * Covers all hub / directory pages:
 *   /cities              (1)
 *   /cities/[state]      (51)
 *   /cities/[state]/page/[p]  (51 states × ~3 pages = ~153)
 *   /salary-guides/[sal] (12)
 *   /jobs/[job]          (35)
 *   /all-pages           (1)
 *
 * Total ≈ 253 URLs — well under the 50k limit.
 */
export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const stateData = statesCitiesData as Record<string, string[]>;
  const jobs = jobsList as string[];

  const PER_PAGE = 24;
  const urls: Array<{ loc: string; priority: string; changefreq: string }> = [];

  // ── Static hub pages ─────────────────────────────────────────────────────
  urls.push({ loc: `${BASE_URL}/cities`,                  priority: "0.9", changefreq: "weekly"  });
  urls.push({ loc: `${BASE_URL}/all-pages`,               priority: "0.7", changefreq: "weekly"  });
  urls.push({ loc: `${BASE_URL}/faq`,                     priority: "0.8", changefreq: "monthly" });
  urls.push({ loc: `${BASE_URL}/guides`,                  priority: "0.8", changefreq: "weekly"  });
  urls.push({ loc: `${BASE_URL}/job-offer-reality-check`, priority: "0.8", changefreq: "monthly" });
  urls.push({ loc: `${BASE_URL}/jobs`,                    priority: "0.9", changefreq: "monthly" });
  urls.push({ loc: `${BASE_URL}/salary-guides`,           priority: "0.9", changefreq: "monthly" });
  urls.push({ loc: `${BASE_URL}/rankings`,                priority: "0.8", changefreq: "monthly" });
  urls.push({ loc: `${BASE_URL}/negotiation-insights`,    priority: "0.8", changefreq: "monthly" });
  urls.push({ loc: `${BASE_URL}/salary-inflation`,        priority: "0.8", changefreq: "monthly" });
  urls.push({ loc: `${BASE_URL}/compare`,                 priority: "0.8", changefreq: "monthly" });
  urls.push({ loc: `${BASE_URL}/migration`,               priority: "0.8", changefreq: "monthly" });

  // ── /cities/[state] ──────────────────────────────────────────────────────
  for (const [state, cities] of Object.entries(stateData)) {
    urls.push({
      loc: `${BASE_URL}/cities/${state}`,
      priority: "0.8",
      changefreq: "weekly",
    });

    // Paginated city directories
    const totalPairs = cities.length * ALL_SALARY_BUCKETS.length;
    const totalPages = Math.ceil(totalPairs / PER_PAGE);
    for (let p = 1; p <= totalPages; p++) {
      urls.push({
        loc: `${BASE_URL}/cities/${state}/page/${p}`,
        priority: "0.6",
        changefreq: "monthly",
      });
    }
  }

  // ── /salary-guides/[salary] ───────────────────────────────────────────────
  for (const sal of ALL_SALARY_BUCKETS) {
    urls.push({
      loc: `${BASE_URL}/salary-guides/${sal}`,
      priority: "0.8",
      changefreq: "monthly",
    });
  }

  // ── /salary-guides/[salary]/[state] — all buckets × 50 states ────────────
  const STATE_SLUGS = [
    "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
    "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
    "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
    "minnesota","mississippi","missouri","montana","nebraska","nevada",
    "new-hampshire","new-jersey","new-mexico","new-york","north-carolina",
    "north-dakota","ohio","oklahoma","oregon","pennsylvania","rhode-island",
    "south-carolina","south-dakota","tennessee","texas","utah","vermont",
    "virginia","washington","west-virginia","wisconsin","wyoming",
  ];
  for (const sal of ALL_SALARY_BUCKETS) {
    for (const state of STATE_SLUGS) {
      urls.push({
        loc: `${BASE_URL}/salary-guides/${sal}/${state}`,
        priority: "0.8",
        changefreq: "monthly",
      });
    }
  }

  // ── /jobs/[job] ───────────────────────────────────────────────────────────
  for (const job of jobs) {
    urls.push({
      loc: `${BASE_URL}/jobs/${job}`,
      priority: "0.8",
      changefreq: "monthly",
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
