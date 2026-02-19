import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  salaryLink,
  bestCitiesLink,
  livingStateLink,
} from "@/lib/internal-links";

import {
  getNearbySalaries,
  getOtherStates,
  getSalaryLadder,
} from "@/lib/links-gen";


/* -----------------------------
   STATE MAP
------------------------------ */
const STATE_SLUG_TO_CODE: Record<string, string> = {
  california: "CA",
  "new-york": "NY",
  texas: "TX",
  florida: "FL",
  washington: "WA",
  new_jersey: "NJ",
  pennsylvania: "PA",
  illinois: "IL",
  massachusetts: "MA",
  minnesota: "MN",
  colorado: "CO",
  arizona: "AZ",
  "north-carolina": "NC",
};
type PageProps = {
  params: Promise<{ slug: string }>;
};

const BASE_COSTS = {
  rent: {
    low: 1600,
    high: 3200,
  },
  food: {
    low: 450,
    high: 800,
  },
  transport: {
    low: 250,
    high: 700,
  },
  health: {
    low: 300,
    high: 600,
  },
};
const baselineMin =
  BASE_COSTS.rent.low +
  BASE_COSTS.food.low +
  BASE_COSTS.transport.low +
  BASE_COSTS.health.low;

const baselineMax =
  BASE_COSTS.rent.high +
  BASE_COSTS.food.high +
  BASE_COSTS.transport.high +
  BASE_COSTS.health.high;


const CITY_COSTS: Record<string, Record<string, number>> = {
  california: {
    "San Francisco": 4800,
    "Los Angeles": 3800,
    "San Diego": 3600,
    "Sacramento": 3000,
  },
  "new-york": {
    "New York City": 4600,
    "Brooklyn": 4200,
    "Buffalo": 2900,
    "Rochester": 2700,
  },
  texas: {
    Austin: 3200,
    Dallas: 3000,
    Houston: 2900,
    ElPaso: 2400,
  },
};

/* -----------------------------
   METADATA
------------------------------ */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-");

  const amount = parts[1];
  const stateSlug = parts.slice(4).join("-");
  const stateName = stateSlug.replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    title: `Is $${Number(amount).toLocaleString()} Enough to Live in ${stateName}?`,
    description: `Find out if a $${Number(
      amount
    ).toLocaleString()} salary is enough to live comfortably in ${stateName}, including take-home pay, taxes, and cost-of-living context.`,
    alternates: {
      canonical: `/living/is-${amount}-enough-in-${stateSlug}`,
    },
  };
}

/* -----------------------------
   PAGE
------------------------------ */
export default async function LivingPage({ params }: PageProps) {
  const { slug } = await params;
  const parts = slug.split("-");

  const amount = parts[1];
  const stateSlug = parts.slice(4).join("-");

  if (!amount || !stateSlug) return notFound();

  const stateCode = STATE_SLUG_TO_CODE[stateSlug];
  if (!stateCode) return notFound();

  const YEAR = "2026";

  const filePath = path.join(
    process.cwd(),
    "data",
    "pages",
    YEAR,
    `${amount}_${stateCode}_single_${YEAR}.json`
  );

  if (!fs.existsSync(filePath)) return notFound();

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const monthly = Math.round(data.net_salary / 12);
  type Lifestyle =
  | "struggling"
  | "tight"
  | "manageable"
  | "comfortable"
  | "sophisticated";

const lifestyle: Lifestyle =
  monthly < baselineMin
    ? "struggling"
    : monthly < baselineMin * 1.15
    ? "tight"
    : monthly < baselineMax
    ? "manageable"
    : monthly < baselineMax * 1.4
    ? "comfortable"
    : "sophisticated";
const salaryNumber = Number(amount);
const nearbySalaries = getNearbySalaries(salaryNumber);
const otherStates = getOtherStates(stateSlug);

const LIFESTYLE_META: Record<
  Lifestyle,
  { label: string; color: string; description: string }
> = {
  struggling: {
    label: "Struggling",
    color: "text-red-700",
    description: "Basic expenses may exceed income without sacrifices",
  },
  tight: {
    label: "Tight",
    color: "text-orange-600",
    description: "Covers essentials but little room for savings",
  },
  manageable: {
    label: "Manageable",
    color: "text-yellow-700",
    description: "Bills are covered with modest discretionary spending",
  },
  comfortable: {
    label: "Comfortable",
    color: "text-green-700",
    description: "Good balance of comfort, savings, and flexibility",
  },
  sophisticated: {
    label: "Sophisticated",
    color: "text-emerald-700",
    description: "High-end lifestyle with strong savings potential",
  },
};


  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6 space-y-8">

      <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
    Is ${Number(amount).toLocaleString()} enough to live in {data.state}?
  </h1>

  <p className="mt-3 text-gray-700 text-lg">
  Short answer:{" "}
  <span
    className={`font-semibold ${LIFESTYLE_META[lifestyle].color}`}
  >
    {LIFESTYLE_META[lifestyle].label}
  </span>
  , depending on lifestyle and city.
</p>


  <div className="mt-5 flex items-center gap-4">
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      <p className="text-sm text-gray-600">Monthly take-home</p>
      <p className="text-xl font-semibold text-green-700">
        ${monthly.toLocaleString()}
      </p>
    </div>
    <div className="mt-4 text-sm text-gray-600">
  Estimated baseline living cost:{" "}
  <strong>
    ${baselineMin.toLocaleString()} – ${baselineMax.toLocaleString()}
  </strong>{" "}
  per month for a single adult (U.S. average).
</div>


    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
      <p className="text-sm text-gray-600">Annual take-home</p>
      <p className="text-xl font-semibold text-blue-700">
        ${data.net_salary.toLocaleString()}
      </p>
    </div>
  </div>
</section>


        <p className="text-gray-700">
          After taxes, a ${Number(amount).toLocaleString()} salary in{" "}
          <strong>{data.state}</strong> results in approximately{" "}
          <strong>${data.net_salary.toLocaleString()}</strong> per year,
          or about <strong>${monthly.toLocaleString()}</strong> per month.
        </p>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
  <h2 className="text-xl font-semibold mb-4">
    Typical monthly cost breakdown in {data.state}
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {[
      { label: "Rent & utilities", range: "$2,000 – $2,800" },
      { label: "Food & groceries", range: "$500 – $700" },
      { label: "Transportation", range: "$300 – $600" },
      { label: "Health & insurance", range: "$300 – $500" },
    ].map((item) => (
      <div
        key={item.label}
        className="border rounded-xl p-4 bg-gray-50"
      >
        <p className="text-sm text-gray-500">{item.label}</p>
        <p className="text-lg font-medium text-gray-900">
          {item.range}
        </p>
      </div>
    ))}
  </div>

  <div className="mt-6 p-4 rounded-xl bg-gray-100">
    <p className="text-sm">
      👉 With this salary, living in {data.state} is{" "}
      <strong className={LIFESTYLE_META[lifestyle].color}>
  {LIFESTYLE_META[lifestyle].label.toLowerCase()}
</strong>
{" "}
      for a single adult.
    </p>
  </div>
</section>
{CITY_COSTS[stateSlug] && (
  <section className="bg-white rounded-2xl p-6 shadow-sm">
    <h2 className="text-xl font-semibold mb-4">
      How this salary feels in major cities
    </h2>

    <div className="space-y-3">
      {Object.entries(CITY_COSTS[stateSlug]).map(
        ([city, cost]) => {
          const cityLifestyle =
  monthly >= cost * 1.4
    ? "Sophisticated"
    : monthly >= cost * 1.15
    ? "Comfortable"
    : monthly >= cost
    ? "Manageable"
    : "Tight";

          return (
            <div
              key={city}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div>
                <p className="font-medium">{city}</p>
                <p className="text-sm text-gray-500">
                  Est. monthly cost: ${cost.toLocaleString()}
                </p>
              </div>

              <span
  className={`text-sm font-medium ${
    cityLifestyle === "Sophisticated"
      ? "text-emerald-700"
      : cityLifestyle === "Comfortable"
      ? "text-green-700"
      : cityLifestyle === "Manageable"
      ? "text-yellow-700"
      : "text-red-600"
  }`}
>
  {cityLifestyle}
</span>

            </div>
          );
        }
      )}
    </div>
  </section>
)}



        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
  <p>
    These estimates assume a <strong>single filer</strong> using standard
    deductions and average living costs. Actual comfort depends heavily
    on city, housing choices, and personal spending habits.
  </p>
</section>

{/* Related Living Insights */}
<section className="mt-12 bg-white rounded-xl shadow-sm p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    Related insights for {data.state}
  </h2>

  <ul className="space-y-2 text-blue-600 text-sm">

    {/* Salary Breakdown Page */}
    <li>
      <a href={salaryLink(salaryNumber, stateSlug)}>
        Full tax breakdown for ${salaryNumber.toLocaleString()} in {data.state}
      </a>
    </li>

    {/* Nearby Salaries */}
    {nearbySalaries.map((s) => (
      <li key={s}>
        <a href={livingStateLink(s, stateSlug)}>
          Is ${s.toLocaleString()} enough in {data.state}?
        </a>
      </li>
    ))}

    {/* Best Cities */}
    <li>
      <a href={bestCitiesLink(stateSlug, salaryNumber)}>
        Best cities in {data.state} for ${salaryNumber.toLocaleString()}
      </a>
    </li>

    {/* Same Salary Other States */}
    {otherStates.map((s) => (
      <li key={s}>
        <a href={livingStateLink(salaryNumber, s)}>
          Is ${salaryNumber.toLocaleString()} enough in{" "}
          {s.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}?
        </a>
      </li>
    ))}

    {/* State Hub */}
    <li>
      <a href={`/states/${stateSlug}`}>
        Explore complete {data.state} salary guide
      </a>
    </li>

  </ul>
</section>


        {/* Internal links */}
        <section className="pt-8 border-t">
  <h3 className="text-lg font-semibold mb-4">
    Explore related salary insights
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
    <a
      href={`/salary/${amount}-${stateSlug}`}
      className="rounded-xl border p-4 hover:bg-gray-50 transition"
    >
      <p className="font-medium text-gray-900">
        ${Number(amount).toLocaleString()} salary after tax
      </p>
      <p className="text-gray-600">
        See exact take-home pay in {data.state}
      </p>
    </a>

    <a
      href={`/best-cities/${stateSlug}/${amount}`}
      className="rounded-xl border p-4 hover:bg-gray-50 transition"
    >
      <p className="font-medium text-gray-900">
        Best cities for this salary
      </p>
      <p className="text-gray-600">
        Where ${Number(amount).toLocaleString()} goes the furthest
      </p>
    </a>
  </div>
</section>

<section className="border-t pt-8 text-sm">
  <h3 className="font-semibold mb-3">
    Explore other salary levels
  </h3>

  <div className="flex flex-wrap gap-3">
    {[60000, 80000, 100000, 120000, 150000].map((s) => (
      <a
        key={s}
        href={`/living/is-${s}-enough-in-${stateSlug}`}
        className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
      >
        ${s.toLocaleString()}
      </a>
    ))}
  </div>
</section>


      </div>
    </main>
  );
}
