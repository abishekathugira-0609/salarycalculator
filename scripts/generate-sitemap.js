const fs = require("fs");
const path = require("path");

const SITE_URL = "http://localhost:3000"; 
// later change to https://yourdomain.com

const dataDir = path.join(process.cwd(), "data", "pages");
const outputPath = path.join(process.cwd(), "public", "sitemap.xml");

const stateSlugMap = {
  CA: "california",
  TX: "texas",
  FL: "florida",
  NY: "new-york",
};

const files = fs.readdirSync(dataDir);

const urls = files.map((filename) => {
  // example: 150000_NY_single.json
  const [amount, stateCode] = filename.split("_");
  const stateSlug = stateSlugMap[stateCode];

  return `${SITE_URL}/salary/${amount}-${stateSlug}`;
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("")}
</urlset>
`;

fs.writeFileSync(outputPath, sitemap);

console.log(`✅ sitemap.xml generated with ${urls.length} URLs`);
