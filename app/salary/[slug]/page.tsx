import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import WhatIfToggle from "./WhatIfToggle";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


// export const dynamic = "force-static";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/* -----------------------------
   STATE MAP
------------------------------ */
const STATE_SLUG_TO_CODE: Record<string, string> = {
  california: "CA",
  "new-york": "NY",
  "new-jersey": "NJ",
  minnesota: "MN",
  hawaii: "HI",
  "district-of-columbia": "DC",

  pennsylvania: "PA",
  illinois: "IL",
  massachusetts: "MA",

  texas: "TX",
  florida: "FL",
  washington: "WA",
  nevada: "NV",

  georgia: "GA",
  virginia: "VA",
  colorado: "CO",
  arizona: "AZ",
  "north-carolina": "NC",
};
const US_MEDIAN = 75000;

function getSalaryLevel(salary: number) {
  if (salary < US_MEDIAN * 0.8) return "Low";
  if (salary < US_MEDIAN * 1.2) return "Average";
  return "High";
}

function getMeterPercent(salary: number) {
  return Math.min(100, Math.round((salary / (US_MEDIAN * 1.5)) * 100));
}

/* -----------------------------
   STATIC PARAMS
------------------------------ */
// export async function generateStaticParams() {
//   const years = ["2025", "2026"];
//   const params: { slug: string }[] = [];
//   const seen = new Set<string>();

//   for (const year of years) {
//     const dir = path.join(process.cwd(), "data", "pages", year);
//     if (!fs.existsSync(dir)) continue;

//     const files = fs.readdirSync(dir);
//     for (const file of files) {
//       const [amount, stateCode] = file.split("_");

//       const stateSlug = Object.keys(STATE_SLUG_TO_CODE).find(
//         (k) => STATE_SLUG_TO_CODE[k] === stateCode
//       );
//       if (!stateSlug) continue;

//       // year-specific
//       params.push({
//         slug: `${amount}-${stateSlug}-${year}`,
//       });

//       // yearless (latest)
//       const yearless = `${amount}-${stateSlug}`;
//       if (!seen.has(yearless)) {
//         params.push({ slug: yearless });
//         seen.add(yearless);
//       }
//     }
//   }

//   return params;
// }

/* -----------------------------
   METADATA
------------------------------ */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-");
  const year = parts.pop()!;
  const amount = parts.shift()!;
  const stateName = parts
    .join(" ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    title: `$${Number(amount).toLocaleString()} Salary After Tax in ${stateName} (${year})`,
    description: `See take-home pay, tax breakdown, and effective tax rate for a $${Number(
      amount
    ).toLocaleString()} salary in ${stateName} (${year}).`,
    alternates: {
      canonical: `/salary/${slug}`,
    },
  };
}



/* -----------------------------
   PAGE
------------------------------ */
export default async function SalaryPage({ params }: PageProps) {
  const { slug } = await params;

  // slug = 350000-california-2025
  const parts = slug.split("-");

  let year = "2026"; // default year
  const amount = parts.shift();
  let stateSlugParts = parts;

  // Detect year safely
  const last = parts[parts.length - 1];
  if (last && /^\d{4}$/.test(last)) {
    year = parts.pop()!;
    stateSlugParts = parts;
  }

  const stateSlug = stateSlugParts.join("-");

  if (!amount || !stateSlug) return notFound();
  
  const stateCode = STATE_SLUG_TO_CODE[stateSlug];
  if (!stateCode) return notFound();


  const dataDir = path.join(process.cwd(), "data", "pages", year);
  const filePath = path.join(
    dataDir,
    `${amount}_${stateCode}_single_${year}.json`
  );

  

/**
 * Accuracy badge
 */
const accuracyMap: Record<string, { label: string; className: string }> = {
  CA: { label: "Fully modeled (progressive)", className: "bg-green-100 text-green-800" },
  NY: { label: "Fully modeled (progressive)", className: "bg-green-100 text-green-800" },
  NJ: { label: "Fully modeled (progressive)", className: "bg-green-100 text-green-800" },
  MN: { label: "Fully modeled (progressive)", className: "bg-green-100 text-green-800" },
  HI: { label: "Fully modeled (progressive)", className: "bg-green-100 text-green-800" },
  DC: { label: "Fully modeled (progressive)", className: "bg-green-100 text-green-800" },

  TX: { label: "No state income tax", className: "bg-blue-100 text-blue-800" },
  FL: { label: "No state income tax", className: "bg-blue-100 text-blue-800" },
  WA: { label: "No state income tax", className: "bg-blue-100 text-blue-800" },
  NV: { label: "No state income tax", className: "bg-blue-100 text-blue-800" },

  PA: { label: "Flat-rate state tax", className: "bg-yellow-100 text-yellow-800" },
  IL: { label: "Flat-rate state tax", className: "bg-yellow-100 text-yellow-800" },
  MA: { label: "Flat-rate state tax", className: "bg-yellow-100 text-yellow-800" },
  GA: { label: "Flat-rate state tax", className: "bg-yellow-100 text-yellow-800" },
  VA: { label: "Flat-rate state tax", className: "bg-yellow-100 text-yellow-800" },
  AZ: { label: "Flat-rate state tax", className: "bg-yellow-100 text-yellow-800" },
  CO: { label: "Flat-rate state tax", className: "bg-yellow-100 text-yellow-800" },
  NC: { label: "Flat-rate state tax", className: "bg-yellow-100 text-yellow-800" },
};

const accuracy = accuracyMap[stateCode];
  if (!fs.existsSync(filePath)) return notFound();
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
/**
 * Comparison states
 */
const comparisonStates = [
  { code: "CA", name: "California" },
  { code: "NY", name: "New York" },
  { code: "TX", name: "Texas" },
  { code: "FL", name: "Florida" },
  { code: "NJ", name: "New Jersey" },
  { code: "PA", name: "Pennsylvania" },
  { code: "IL", name: "Illinois" },
  { code: "WA", name: "Washington" },
  { code: "MA", name: "Massachusetts" },
  { code: "MN", name: "Minnesota" },
];

const comparisons = comparisonStates
  .map((state) => {
    const p = path.join(
      process.cwd(),
      "data",
      "pages",
      year,
      `${amount}_${state.code}_single_${year}.json`
    );

    if (!fs.existsSync(p)) return null;

    return {
      ...JSON.parse(fs.readFileSync(p, "utf8")),
      display_state: state.name,
    };
  })
  .filter(Boolean);




  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header with CTA + Accuracy badge */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ${Number(data.salary).toLocaleString("en-US")} Salary in {data.state}
            </h1>
            <p className="text-gray-600 mt-2">
              Estimated take-home pay after taxes (Single filer, {data.tax_year})
            </p>

            {accuracy && (
              <span
                className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${accuracy.className}`}
              >
                {accuracy.label}
              </span>
            )}
          </div>

          <a
            href="/calculator"
            className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition whitespace-nowrap"
          >
            Calculate a different salary →
          </a>
        </header>

        {/* Take-home Highlight */}
        <section className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-700">Annual take-home pay</p>
          <p className="text-3xl font-semibold text-green-700">
            ${Number(data.net_salary).toLocaleString("en-US")}
          </p>

          <p className="text-sm text-gray-600 mt-1">
            Effective tax rate: <strong>{data.effective_tax_rate}%</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-gray-500">Monthly take-home</p>
              <p className="font-medium">
                ${data.monthly_take_home.toLocaleString("en-US")}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-gray-500">Bi-weekly take-home</p>
              <p className="font-medium">
                ${data.biweekly_take_home.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        </section>
        {/* Real-Feel Purchasing Power */}
<section className="bg-white rounded-xl shadow-sm p-6 mb-8">
  <h2 className="text-xl font-semibold text-gray-900 mb-2">
    Real-Feel Purchasing Power
  </h2>

  <p className="text-sm text-gray-600 mb-4">
    Compared to the U.S. median income (~$75,000), this salary in{" "}
    <strong>{data.state}</strong> is considered{" "}
    <strong>{getSalaryLevel(data.salary)}</strong>.
  </p>

  <div
    className="w-full bg-gray-200 rounded-full h-3"
    role="progressbar"
    aria-valuenow={getMeterPercent(data.salary)}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <div
      className={`h-3 rounded-full transition-all ${
        getSalaryLevel(data.salary) === "High"
          ? "bg-green-500"
          : getSalaryLevel(data.salary) === "Average"
          ? "bg-yellow-500"
          : "bg-red-500"
      }`}
      style={{ width: `${getMeterPercent(data.salary)}%` }}
    />
  </div>

  <div className="flex justify-between text-xs text-gray-500 mt-2">
    <span>Low</span>
    <span>Average</span>
    <span>High</span>
  </div>
</section>


        {/* Tax Breakdown */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tax breakdown
          </h2>

          <ul className="space-y-3 text-gray-700">
            <li className="flex justify-between">
              <span>Federal income tax</span>
              <span>${data.federal_tax.toLocaleString("en-US")}</span>
            </li>
            <li className="flex justify-between">
              <span>State income tax</span>
              <span>${data.state_tax.toLocaleString("en-US")}</span>
            </li>
            <li className="flex justify-between">
              <span>Social Security</span>
              <span>${data.social_security.toLocaleString("en-US")}</span>
            </li>
            <li className="flex justify-between">
              <span>Medicare</span>
              <span>${data.medicare.toLocaleString("en-US")}</span>
            </li>

            <li className="flex justify-between font-semibold border-t pt-3 mt-3">
              <span>Total tax</span>
              <span>${data.total_tax.toLocaleString("en-US")}</span>
            </li>
          </ul>
        </section>
        {/* What-if scenarios (Client Component) */}
<WhatIfToggle
  salary={data.salary}
  netSalary={data.net_salary}
  federalTax={data.federal_tax}
/>


        {/* Compensation */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Total compensation
          </h2>

          <ul className="space-y-2 text-gray-700">
            <li className="flex justify-between">
              <span>Base salary</span>
              <span>${data.salary.toLocaleString("en-US")}</span>
            </li>
            <li className="flex justify-between">
              <span>Employer 401(k) match</span>
              <span>
  ${(data.benefits?.employer_401k_match ?? 0).toLocaleString("en-US")}
</span>
            </li>
            <li className="flex justify-between">
              <span>Health insurance</span>
              <span>
  ${(data.benefits?.health_insurance_value ?? 0).toLocaleString("en-US")}
</span>
            </li>

            <li className="flex justify-between font-semibold border-t pt-3 mt-3">
              <span>Total compensation</span>
              <span>${data.total_compensation.toLocaleString("en-US")}</span>
            </li>
          </ul>
        </section>

        {/* Comparison Block */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Compare the same salary across states
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="py-2 text-left">State</th>
                  <th className="py-2 text-left">Take-home</th>
                  <th className="py-2 text-left">Total tax</th>
                  <th className="py-2 text-left">Effective rate</th>
                </tr>
              </thead>
              <tbody>
                {
                comparisons.map((c: any) => (
                  <tr
                    key={c.state_code}
                    className={`border-b ${
                      c.state_code === stateCode
                        ? "bg-blue-50 font-medium"
                        : ""
                    }`}
                  >
                    <td className="py-2">{c.display_state}</td>
                    <td className="py-2">
                      ${c.net_salary.toLocaleString("en-US")}
                    </td>
                    <td className="py-2">
                      ${c.total_tax.toLocaleString("en-US")}
                    </td>
                    <td className="py-2">
                      {c.effective_tax_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Explainer */}
        <section className="text-sm text-gray-600 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">
            How this salary is calculated
          </h2>

          <p>
            This estimate is based on U.S. federal and state tax rules for the
            <strong> {data.tax_year}</strong> tax year, assuming a
            <strong> single filer</strong> using the standard deduction.
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>Federal income tax uses progressive IRS brackets</li>
            <li>State income tax varies by state (CA & NY included)</li>
            <li>Payroll taxes include Social Security and Medicare</li>
            <li>No dependents, credits, or itemized deductions included</li>
            <li>Local taxes (e.g. NYC) are not included</li>
          </ul>

          <p className="italic">
            This is an estimate for informational purposes only.
          </p>
        </section>
        {/* People Also Searched For */}
<section className="mt-10">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    People also searched for
  </h2>

  <ul className="space-y-2 text-blue-600 text-sm">
    <li>
      <a href={`/salary/${amount}-${stateSlug}-vs-neighbor`}>
        {data.state} vs neighboring state tax comparison
      </a>
    </li>

    <li>
      <a href={`/living/is-${amount}-enough-in-${stateSlug}`}>
        Is ${Number(amount).toLocaleString()} enough to live in{" "}
        {data.state}?
      </a>
    </li>

    <li>
      <a href={`/best-cities/${stateSlug}/${amount}`}>
        Best cities in {data.state} for a $
        {Number(amount).toLocaleString()} salary
      </a>
    </li>
  </ul>
</section>


      </div>
    </main>
  );
}
