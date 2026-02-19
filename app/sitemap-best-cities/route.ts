import { NextResponse } from "next/server";

const baseUrl = "https://know-your-pay.com";

// Expand this list over time (100+ cities recommended)
const cities = [
  "austin",
  "san-francisco",
  "seattle",
  "miami",
  "new-york",
  "los-angeles",
  "denver",
  "chicago",
  "phoenix",
  "boston",
];

// Salary ranges used in best cities pages
function generateSalaryRanges() {
  const salaries: number[] = [];
  for (let i =40000; i <= 300000; i += 10000) {
    salaries.push(i);
  }
  return salaries;
}

export async function GET() {
  const salaries = generateSalaryRanges();
  const urls: string[] = [];

  for (const salary of salaries) {
    urls.push(
      `${baseUrl}/best-cities-to-live-on-${salary}`
    );
  }

  // Optional: city-specific best pages
  for (const city of cities) {
    urls.push(
      `${baseUrl}/best-cities-like-${city}`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
