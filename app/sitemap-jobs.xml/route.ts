import { NextResponse } from "next/server";
import { BASE_URL, PRIORITY_CITIES, SEED_CITIES } from "@/lib/seo";
import jobsList from "@/data/jobs.json";

export const revalidate = 86400;

/**
 * sitemap-jobs.xml
 *
 * High-demand job salary pages:
 *   /job-salary/[job]/[city]
 *
 * Coverage:
 *   - All 70 jobs × top 150 priority cities = 10,500 URLs
 *
 * Total ≈ 10,500 URLs — under the 50k limit.
 */
const ALL_JOBS = jobsList as string[];

export async function GET() {
  const now = new Date().toISOString().split("T")[0];
  const entries: string[] = [];

  for (const job of ALL_JOBS) {
    for (const city of PRIORITY_CITIES) {
      entries.push(`  <url>
    <loc>${BASE_URL}/job-salary/${job}/${city}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
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
