import { NextResponse } from "next/server";
import { BASE_URL, ALL_SALARY_BUCKETS, PRIORITY_SALARIES } from "@/lib/seo";

export const revalidate = 86400;

const STATES = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada",
  "new-hampshire","new-jersey","new-mexico","new-york","north-carolina",
  "north-dakota","ohio","oklahoma","oregon","pennsylvania","rhode-island",
  "south-carolina","south-dakota","tennessee","texas","utah","vermont",
  "virginia","washington","west-virginia","wisconsin","wyoming",
];

const STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const CORE_PAGES = [
  { path: "/",                    priority: "1.0", changefreq: "daily"   },
  { path: "/calculator",          priority: "0.9", changefreq: "weekly"  },
  { path: "/about",               priority: "0.7", changefreq: "monthly" },
  { path: "/methodology",         priority: "0.8", changefreq: "monthly" },
  { path: "/faq",                 priority: "0.8", changefreq: "monthly" },
  { path: "/guides",              priority: "0.8", changefreq: "weekly"  },
  { path: "/disclaimer",          priority: "0.5", changefreq: "monthly" },
  { path: "/contact",             priority: "0.5", changefreq: "monthly" },
  { path: "/all-pages",           priority: "0.6", changefreq: "weekly"  },
  { path: "/job-offer-reality-check", priority: "0.8", changefreq: "monthly" },
  { path: "/remote-tax",          priority: "0.8", changefreq: "monthly" },
];

const GUIDE_SLUGS = [
  "how-taxes-affect-take-home-pay",
  "understanding-cost-of-living-differences",
  "how-much-salary-do-you-need-to-live-comfortably",
  "no-tax-states-explained",
  "salary-negotiation-using-after-tax-data",
  "what-is-a-good-salary-by-age",
];

const REPORT_SLUGS = [
  "best-cities-for-100k-salary",
  "worst-cities-for-rent-affordability",
];

const AUTHOR_SLUGS = ["finance-editor", "data-analyst"];

// Top 12 states for pre-computed salary pages (must match salary/[slug] route which uses full state name slugs)
const TOP_STATE_NAMES = [
  "california","texas","florida","new-york","washington",
  "illinois","pennsylvania","georgia","arizona","colorado","massachusetts","north-carolina",
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

  // Static core pages
  for (const { path, priority, changefreq } of CORE_PAGES) {
    entries.push(urlEntry(path, priority, changefreq));
  }

  // Author pages
  for (const author of AUTHOR_SLUGS) {
    entries.push(urlEntry(`/authors/${author}`, "0.6", "monthly"));
  }

  // Guide articles
  for (const slug of GUIDE_SLUGS) {
    entries.push(urlEntry(`/guides/${slug}`, "0.7", "monthly"));
  }

  // Research reports
  for (const slug of REPORT_SLUGS) {
    entries.push(urlEntry(`/reports/${slug}`, "0.7", "monthly"));
  }

  // State salary guides (50 states)
  for (const state of STATES) {
    entries.push(urlEntry(`/${state}-salary-guide`, "0.8", "monthly"));
  }

  // State detail pages (50 states)
  for (const state of STATES) {
    entries.push(urlEntry(`/states/${state}`, "0.7", "monthly"));
  }

  // Rankings pages (all salary buckets)
  for (const salary of ALL_SALARY_BUCKETS) {
    entries.push(urlEntry(`/rankings/${salary}`, "0.8", "weekly"));
  }

  // Salary leaderboards
  for (const salary of ALL_SALARY_BUCKETS) {
    entries.push(urlEntry(`/salary-leaderboards/${salary}`, "0.7", "monthly"));
  }

  // Pre-computed salary pages — top states × priority salaries
  for (const state of TOP_STATE_NAMES) {
    for (const salary of PRIORITY_SALARIES) {
      entries.push(urlEntry(`/salary/${salary}-${state}-2026`, "0.9", "monthly"));
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
