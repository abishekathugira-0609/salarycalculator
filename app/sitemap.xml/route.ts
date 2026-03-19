import { NextResponse } from "next/server";
import { BASE_URL } from "@/lib/seo";

export const revalidate = 86400;

/**
 * Sitemap index — points Google to the 4 segmented sitemaps.
 * Each child sitemap stays under the 50k URL / 50MB limit.
 */
export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const sitemaps = [
    { loc: `${BASE_URL}/sitemap-core.xml`,         label: "Core pages, state guides, rankings" },
    { loc: `${BASE_URL}/sitemap-hubs.xml`,          label: "City/salary/job hub pages & directories" },
    { loc: `${BASE_URL}/sitemap-jobs.xml`,          label: "Job salary pages" },
    { loc: `${BASE_URL}/sitemap-cities.xml`,        label: "City affordability & is-salary-good" },
    { loc: `${BASE_URL}/sitemap-comparisons.xml`,   label: "City comparisons & remote-tax" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
