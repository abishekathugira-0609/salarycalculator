import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CITY_COSTS, CityCost } from "@/data/city-costs";

export const dynamic = "force-static"; // ✅ REQUIRED


type PageProps = {
  params: Promise<{ slug: string }>;
};

const YEAR = "2026";

/* -----------------------------
   HELPERS
------------------------------ */
function getVerdict(disposable: number) {
  if (disposable < -500) return "Not Recommended";
  if (disposable < 0) return "Very Tight";
  if (disposable < 500) return "Manageable";
  if (disposable < 1500) return "Comfortable";
  if (disposable < 3000) return "Very Comfortable";
  return "Sophisticated";
}

function verdictColor(verdict: string) {
  switch (verdict) {
    case "Not Recommended":
      return "text-red-700";
    case "Very Tight":
      return "text-orange-700";
    case "Manageable":
      return "text-yellow-700";
    case "Comfortable":
      return "text-green-700";
    case "Very Comfortable":
      return "text-emerald-700";
    default:
      return "text-blue-700";
  }
}

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}

export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  const YEAR = "2026";

  Object.values(CITY_COSTS).forEach((cities) => {
    cities.forEach((city) => {
      const citySlug = city.city.toLowerCase().replace(/\s+/g, "-");

      const dataDir = path.join(
        process.cwd(),
        "data",
        "pages",
        YEAR
      );

      if (!fs.existsSync(dataDir)) return;

      const files = fs.readdirSync(dataDir);

      files.forEach((file) => {
        // matches: 450000_TX_single_2026.json
        const [salary, stateCode] = file.split("_");

        if (stateCode !== city.stateCode) return;

        params.push({
          slug: `is-${salary}-enough-in-${citySlug}`,
        });
      });
    });
  });

  return params;
}


/* -----------------------------
   METADATA
------------------------------ */
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;

  // is-100000-enough-in-san-francisco
  const parts = slug.split("-");
  const salary = Number(parts[1]);
  const citySlug = parts.slice(4).join("-");

  let matchedCity: CityCost | undefined;

  for (const cities of Object.values(CITY_COSTS)) {
    const found = cities.find(
      (c) => slugifyCity(c.city) === citySlug
    );
    if (found) {
      matchedCity = found;
      break;
    }
  }

  if (!matchedCity) return {};

  return {
    title: `Is $${salary.toLocaleString()} Enough to Live in ${matchedCity.city}? (2026)`,
    description: `See if a $${salary.toLocaleString()} salary is enough to live in ${matchedCity.city}, ${matchedCity.state}. Includes take-home pay, rent, cost of living, and lifestyle verdict.`,
    alternates: {
      canonical: `/city-living/is-${salary}-enough-in-${citySlug}`, // 🔧 CHANGED
    },
  };
}

/* -----------------------------
   PAGE
------------------------------ */
export default async function LivingCityPage({ params }: PageProps) {
  const { slug } = await params;

  const parts = slug.split("-");
  const salary = Number(parts[1]);
  const citySlug = parts.slice(4).join("-");

  if (!salary || !citySlug) return notFound();

  let city: CityCost | undefined;

  for (const cities of Object.values(CITY_COSTS)) {
    const found = cities.find(
      (c) => slugifyCity(c.city) === citySlug
    );
    if (found) {
      city = found;
      break;
    }
  }

  if (!city) return notFound();

  const filePath = path.join(
    process.cwd(),
    "data",
    "pages",
    YEAR,
    `${salary}_${city.stateCode}_single_${YEAR}.json`
  );

  if (!fs.existsSync(filePath)) return notFound();

  const salaryData = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const monthlyTakeHome = Math.round(salaryData.net_salary / 12);
  const monthlyCost = city.rent + city.other;
  const disposable = monthlyTakeHome - monthlyCost;
  const verdict = getVerdict(disposable);

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-10">

        {/* HERO */}
        <section className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            Is ${salary.toLocaleString()} enough to live in {city.city}?
          </h1>

          <p className="mt-3 text-lg text-gray-700">
            Verdict:{" "}
            <span className={`font-semibold ${verdictColor(verdict)}`}>
              {verdict}
            </span>{" "}
            for a single adult in {city.state}.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-600">Monthly take-home</p>
              <p className="text-xl font-semibold text-green-700">
                ${monthlyTakeHome.toLocaleString()}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-600">Estimated monthly cost</p>
              <p className="text-xl font-semibold text-red-700">
                ${monthlyCost.toLocaleString()}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-600">Disposable income</p>
              <p className="text-xl font-semibold text-blue-700">
                ${disposable.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* COST BREAKDOWN */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Monthly living costs in {city.city}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 bg-gray-50">
              <p className="text-sm text-gray-500">Rent (1-bedroom)</p>
              <p className="text-lg font-medium">
                ${city.rent.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl border p-4 bg-gray-50">
              <p className="text-sm text-gray-500">
                Food, transport & misc
              </p>
              <p className="text-lg font-medium">
                ${city.other.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* INTERNAL LINKS */}
        <section className="border-t pt-6 text-sm">
          <h3 className="font-semibold mb-3">
            Explore related salary insights
          </h3>

          <ul className="space-y-2 text-blue-600">
            <li>
              <a href={`/salary/${salary}-${city.state.toLowerCase().replace(/\s+/g, "-")}`}>
                ${salary.toLocaleString()} salary after tax in {city.state}
              </a>
            </li>
            <li>
              <a href={`/best-cities/${city.state.toLowerCase().replace(/\s+/g, "-")}/${salary}`}>
                Best cities in {city.state} for a ${salary.toLocaleString()} salary
              </a>
            </li>
          </ul>
        </section>

      </div>
    </main>
  );
}
