import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = "https://know-your-pay.com";

  const salaryChunks = 2;       // adjust based on scale
  const cityChunks = 2;

  let sitemaps = "";
  const TOP_SALARY_BANDS = [
  40000,
  60000,
  75000,
  80000,
  100000,
  120000,
  125000,
  150000,
  180000,
  200000,
  220000,
  250000,
  300000,
];
const STATES = [
  { slug: "alabama" },
  { slug: "alaska" },
  { slug: "arizona" },
  { slug: "arkansas" },
  { slug: "california" },
  { slug: "colorado" },
  { slug: "connecticut" },
  { slug: "delaware" },
  { slug: "florida" },
  { slug: "georgia" },
  { slug: "hawaii" },
  { slug: "idaho" },
  { slug: "illinois" },
  { slug: "indiana" },
  { slug: "iowa" },
  { slug: "kansas" },
  { slug: "kentucky" },
  { slug: "louisiana" },
  { slug: "maine" },
  { slug: "maryland" },
  { slug: "massachusetts" },
  { slug: "michigan" },
  { slug: "minnesota" },
  { slug: "mississippi" },
  { slug: "missouri" },
  { slug: "montana" },
  { slug: "nebraska" },
  { slug: "nevada" },
  { slug: "new-hampshire" },
  { slug: "new-jersey" },
  { slug: "new-mexico" },
  { slug: "new-york" },
  { slug: "north-carolina" },
  { slug: "north-dakota" },
  { slug: "ohio" },
  { slug: "oklahoma" },
  { slug: "oregon" },
  { slug: "pennsylvania" },
  { slug: "rhode-island" },
  { slug: "south-carolina" },
  { slug: "south-dakota" },
  { slug: "tennessee" },
  { slug: "texas" },
  { slug: "utah" },
  { slug: "vermont" },
  { slug: "virginia" },
  { slug: "washington" },
  { slug: "west-virginia" },
  { slug: "wisconsin" },
  { slug: "wyoming" }
];
const CITIES = [
  { slug: "new-york" },
  { slug: "los-angeles" },
  { slug: "chicago" },
  { slug: "houston" },
  { slug: "phoenix" },
  { slug: "philadelphia" },
  { slug: "san-antonio" },
  { slug: "san-diego" },
  { slug: "dallas" },
  { slug: "austin" },
  { slug: "jacksonville" },
  { slug: "fort-worth" },
  { slug: "columbus" },
  { slug: "charlotte" },
  { slug: "san-francisco" },
  { slug: "indianapolis" },
  { slug: "seattle" },
  { slug: "denver" },
  { slug: "washington-dc" },
  { slug: "boston" },
  { slug: "el-paso" },
  { slug: "nashville" },
  { slug: "detroit" },
  { slug: "oklahoma-city" },
  { slug: "portland" },
  { slug: "las-vegas" },
  { slug: "memphis" },
  { slug: "louisville" },
  { slug: "baltimore" },
  { slug: "milwaukee" },
  { slug: "albuquerque" },
  { slug: "tucson" },
  { slug: "fresno" },
  { slug: "sacramento" },
  { slug: "mesa" },
  { slug: "kansas-city" },
  { slug: "atlanta" },
  { slug: "omaha" },
  { slug: "colorado-springs" },
  { slug: "raleigh" },
  { slug: "miami" },
  { slug: "virginia-beach" },
  { slug: "oakland" },
  { slug: "minneapolis" },
  { slug: "tulsa" },
  { slug: "arlington" },
  { slug: "tampa" },
  { slug: "new-orleans" },
  { slug: "wichita" },
  { slug: "cleveland" },
  { slug: "bakersfield" },
  { slug: "aurora" },
  { slug: "anaheim" },
  { slug: "honolulu" },
  { slug: "santa-ana" },
  { slug: "corpus-christi" },
  { slug: "riverside" },
  { slug: "lexington" },
  { slug: "stockton" },
  { slug: "henderson" },
  { slug: "saint-paul" },
  { slug: "st-louis" },
  { slug: "cincinnati" },
  { slug: "pittsburgh" },
  { slug: "greensboro" },
  { slug: "anchorage" },
  { slug: "plano" },
  { slug: "lincoln" },
  { slug: "orlando" },
  { slug: "irvine" },
  { slug: "newark" },
  { slug: "toledo" },
  { slug: "durham" },
  { slug: "chula-vista" },
  { slug: "fort-wayne" },
  { slug: "jersey-city" },
  { slug: "st-petersburg" },
  { slug: "laredo" },
  { slug: "madison" },
  { slug: "chandler" },
  { slug: "buffalo" },
  { slug: "lubbock" },
  { slug: "scottsdale" },
  { slug: "reno" },
  { slug: "glendale" },
  { slug: "gilbert" },
  { slug: "winston-salem" },
  { slug: "north-las-vegas" },
  { slug: "norfolk" },
  { slug: "chesapeake" },
  { slug: "garland" },
  { slug: "irving" },
  { slug: "hialeah" },
  { slug: "fremont" },
  { slug: "boise" },
  { slug: "richmond" },
  { slug: "baton-rouge" },
  { slug: "spokane" }
];


  const urls: string[] = [];

  for (const state of STATES) {
    // State hub
    urls.push(`${baseUrl}/${state.slug}-salary-guide`);

    // Best cities hub
    urls.push(`${baseUrl}/best-cities/${state}`);

    for (const salary of TOP_SALARY_BANDS) {
      urls.push(`${baseUrl}/salary/${salary}-${state}`);
      urls.push(`${baseUrl}/living/is-${salary}-enough-in-${state.slug}`);
    }
  }

   for (const city of CITIES) {
    // City hub
    urls.push(`${baseUrl}/city-living/${city.slug}`);
  
    for (const salary of TOP_SALARY_BANDS) {
  
      urls.push(`${baseUrl}/city-living/is-${salary}-enough-in-${city.slug}`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map(
        (url) => `
      <url>
        <loc>${url}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`
      )
      .join("")}
  </urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}


