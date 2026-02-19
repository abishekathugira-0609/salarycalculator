import { NextResponse } from "next/server";

const baseUrl = "https://know-your-pay.com";

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

function generateSalaries() {
  const salaries: number[] = [];
  for (let i = 40000; i <= 250000; i += 2000) {
    salaries.push(i);
  }
  return salaries;
}

export async function GET(
  request: Request,
  { params }: { params: { page: string } }
) {
  const page = Number(params.page) || 1;

  const salaries = generateSalaries();
  const allUrls: string[] = [];

  for (const salary of salaries) {
    for (const city of cities) {
      allUrls.push(
        `${baseUrl}/city-living/is-${salary}-enough-in-${city}`
      );
    }
  }

  const chunkSize = 50000;
  const start = (page - 1) * chunkSize;
  const end = start + chunkSize;

  const urls = allUrls.slice(start, end);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${url}</loc>
  </url>`
  )
  .join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
