import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CITY_COSTS } from "@/data/city-costs";

export const dynamic = "force-static";

type PageProps = {
  params: Promise<{
    state: string;
    salary: string;
  }>;
};

const YEAR = "2026";

/* -----------------------------
   HELPERS
------------------------------ */
function getComfort(disposable: number) {
  if (disposable >= 1500) return "Very Comfortable";
  if (disposable >= 500) return "Comfortable";
  if (disposable >= 0) return "Tight";
  return "Not Recommended";
}

type CityCost = {
  city: string;
  rent: number;
  other: number;
  lifestyle: "budget" | "balanced" | "premium";
  stateCode: string;
};

/* -----------------------------
   METADATA
------------------------------ */
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { state, salary } = await params;

  const stateName = state.replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    title: `Best Cities in ${stateName} for a $${Number(
      salary
    ).toLocaleString()} Salary (2026)`,
    description: `Discover the best cities in ${stateName} where a $${Number(
      salary
    ).toLocaleString()} salary offers the most comfortable lifestyle based on real take-home pay and cost of living.`,
    alternates: {
      canonical: `/best-cities/${state}/${salary}`,
    },
  };
}

/* -----------------------------
   PAGE
------------------------------ */
export default async function BestCitiesPage({ params }: PageProps) {
  const { state, salary } = await params;

const typedState = state as keyof typeof CITY_COSTS;
const stateCities = CITY_COSTS[typedState];
if (!stateCities) return notFound();

  if (!stateCities) return notFound();

  // Derive state code safely from dataset
  const stateCode = stateCities[0]?.stateCode;
  if (!stateCode) return notFound();

  const filePath = path.join(
    process.cwd(),
    "data",
    "pages",
    YEAR,
    `${salary}_${stateCode}_single_${YEAR}.json`
  );

  if (!fs.existsSync(filePath)) return notFound();

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const monthlyTakeHome = Math.round(data.net_salary / 12);

  /* -----------------------------
     RANKING ALGORITHM v2 (SEO STRONG)
  ------------------------------ */
  const rankedCities = stateCities
    .map((city) => {
      const monthlyCost = city.rent + city.other;
      const disposable = monthlyTakeHome - monthlyCost;

      const score =
  disposable +
  city.seoWeight * 180 +                 // demand boost
  (city.lifestyle === "budget" ? 500 : 0) +
  (city.lifestyle === "balanced" ? 250 : 0) -
  (city.lifestyle === "premium" ? 350 : 0);



      return {
        ...city,
        monthlyCost,
        disposable,
        comfort: getComfort(disposable),
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6 space-y-10">

        {/* HERO */}
        <section className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Best Cities in {data.state} for a ${Number(salary).toLocaleString()} Salary
          </h1>

          <p className="mt-4 text-gray-700">
            With a monthly take-home pay of{" "}
            <strong>${monthlyTakeHome.toLocaleString()}</strong>, some cities in{" "}
            <strong>{data.state}</strong> offer a far better lifestyle than others.
          </p>
        </section>
        {/* TOP 3 CITIES */}
<section className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {rankedCities.slice(0, 3).map((c, i) => (
    <div
      key={c.city}
      className="rounded-2xl border bg-white p-5 shadow-sm"
    >
      <p className="text-xs text-gray-500 mb-1">#{i + 1} Best Choice</p>
      <h3 className="text-lg font-semibold">{c.city}</h3>

      <p className="mt-2 text-sm text-gray-600">
        Monthly cost: ${c.monthlyCost.toLocaleString()}
      </p>

      <p className="mt-1 text-sm">
        Disposable:{" "}
        <span
          className={
            c.disposable >= 0 ? "text-green-700" : "text-red-600"
          }
        >
          ${c.disposable.toLocaleString()}
        </span>
      </p>

      <span className="inline-block mt-3 text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">
        {c.comfort}
      </span>
    </div>
  ))}
</section>


        {/* TABLE */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Top cities ranked by affordability
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="py-2 text-left">City</th>
                  <th className="text-left">Rent</th>
                  <th className="text-left">Total Monthly Cost</th>
                  <th className="text-left">Disposable Income</th>
                  <th className="text-left">Comfort</th>
                </tr>
              </thead>
              <tbody>
                {rankedCities.map((c, i) => (
                  <tr
                    key={c.city}
                    className={`border-b ${
                      i === 0 ? "bg-green-50 font-medium" : ""
                    }`}
                  >
                    <td className="py-2">{c.city}</td>
                    <td>${c.rent.toLocaleString()}</td>
                    <td>${c.monthlyCost.toLocaleString()}</td>
                    <td
                      className={
                        c.disposable >= 0
                          ? "text-green-700"
                          : "text-red-600"
                      }
                    >
                      ${c.disposable.toLocaleString()}
                    </td>
                    <td>{c.comfort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="border-t pt-8">
  <h3 className="text-lg font-semibold mb-4">
    Living affordability in individual cities
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
    {rankedCities.slice(0, 6).map((c) => {
      const slug = c.city.toLowerCase().replace(/\s+/g, "-");

      return (
        <a
          key={c.city}
          href={`/city-living/is-${salary}-enough-in-${slug}`}
          className="rounded-xl border p-4 hover:bg-gray-50 transition"
        >
          <p className="font-medium text-gray-900">
            Is ${Number(salary).toLocaleString()} enough in {c.city}?
          </p>
          <p className="text-gray-600">
            Rent ≈ ${c.rent.toLocaleString()} · {c.comfort}
          </p>
        </a>
      );
    })}
  </div>
</section>

<section className="bg-white rounded-2xl p-6 shadow-sm">
  <h2 className="text-xl font-semibold mb-3">
    Why these cities rank higher for a ${Number(salary).toLocaleString()} salary
  </h2>

  <p className="text-gray-700 text-sm leading-relaxed">
    Cities at the top of this list strike a strong balance between
    housing costs, everyday expenses, and overall lifestyle quality.
    On a monthly take-home pay of{" "}
    <strong>${monthlyTakeHome.toLocaleString()}</strong>, locations with
    moderate rent and balanced living costs allow for higher disposable
    income and long-term comfort.
  </p>

  <p className="mt-3 text-gray-700 text-sm leading-relaxed">
    More expensive cities fall lower in the rankings despite higher
    salaries because housing costs consume a disproportionate share of
    income, leaving less room for savings, travel, and discretionary
    spending.
  </p>
</section>
<section className="bg-red-50 border border-red-200 rounded-2xl p-6">
  <h2 className="text-lg font-semibold mb-3">
    Cities where this salary may feel tight
  </h2>

  <p className="text-sm text-gray-700">
    In high-cost cities with premium housing markets, even a
    ${Number(salary).toLocaleString()} salary can feel restrictive.
    These locations may require lifestyle compromises or shared housing.
  </p>
</section>
<section className="bg-white rounded-2xl p-6 shadow-sm">
  <h2 className="text-xl font-semibold mb-4">
    Frequently asked questions
  </h2>

  <div className="space-y-3 text-sm text-gray-700">
    <p>
      <strong>Is ${Number(salary).toLocaleString()} a good salary in {data.state}?</strong><br />
      It depends on the city. In lower-cost cities, this salary allows a
      comfortable lifestyle, while premium metros may feel tight.
    </p>

    <p>
      <strong>Which city gives the best value for money?</strong><br />
      Cities with balanced rent and strong job markets tend to offer the
      highest disposable income.
    </p>
  </div>
</section>

        {/* INTERNAL LINKS */}
        <section className="border-t pt-6 text-sm">
          <h3 className="font-semibold mb-3">Related salary insights</h3>
          <ul className="space-y-2 text-blue-600">
            <li>
              <a href={`/salary/${salary}-${state}`}>
                ${Number(salary).toLocaleString()} salary after tax in {data.state}
              </a>
            </li>
            <li>
              <a href={`/living/is-${salary}-enough-in-${state}`}>
                Is ${Number(salary).toLocaleString()} enough to live in {data.state}?
              </a>
            </li>
          </ul>
        </section>

      </div>
    </main>
  );
}
