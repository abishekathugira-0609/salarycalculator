import { NextResponse } from "next/server";

const baseUrl = "https://know-your-pay.com";

// Generate salary range
function generateSalaries() {
  const salaries: number[] = [];
  for (let i = 30000; i <= 300000; i += 1000) {
    salaries.push(i);
  }
  return salaries;
}

const states = [
  "california",
  "texas",
  "florida",
  "new-york",
  "washington",
  "arizona",
  "nevada",
  "illinois",
  "georgia",
  "north-carolina",
];

export async function GET(
  request: Request,
  { params }: { params: { page: string } }
) {
  const page = Number(params.page) || 1;

  const allUrls: string[] = [];
  const salaries = generateSalaries();

  for (const salary of salaries) {
    for (const state of states) {
      allUrls.push(`${baseUrl}/salary/${salary}-${state}`);
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
