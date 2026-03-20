import type { Metadata } from "next";
import { buildPageMeta, ALL_SALARY_BUCKETS } from "@/lib/seo";
import { fmtUSD, fmtCompact } from "@/lib/stateCodeMap";
import { calculateNetSalary } from "@/lib/salary/netSalary";

export const dynamic = "force-static";
export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "US Salary Guides — After Tax Take-Home by City (2026)",
  description: "Complete after-tax salary guides for every income level. See take-home pay, rent affordability, and cost-of-living breakdown for $40k–$300k salaries across 300+ US cities.",
  canonical: "/salary-guides",
});

const FEATURE_CITIES = ["austin", "new-york-city", "chicago", "seattle", "miami", "denver"];

export default function SalaryGuidesIndexPage() {
  const rows = ALL_SALARY_BUCKETS.map((salary) => {
    const tx = calculateNetSalary({ salary, state: "TX" });
    const ca = calculateNetSalary({ salary, state: "CA" });
    return {
      salary,
      txNet: tx.netSalary,
      caNet: ca.netSalary,
      txRate: tx.effectiveTaxRate,
      caRate: ca.effectiveTaxRate,
    };
  });

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "US Salary Guides by Income Level",
    numberOfItems: ALL_SALARY_BUCKETS.length,
    itemListElement: ALL_SALARY_BUCKETS.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${fmtUSD(s)} Salary Guide`,
      url: `https://know-your-pay.com/salary-guides/${s}`,
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Salary Guides · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            US Salary Guides — After Tax (2026)
          </h1>
          <p className="text-gray-500 max-w-2xl">
            How much of your salary do you actually keep? Pick an income level to see
            take-home pay, effective tax rate, rent affordability, and city-by-city breakdowns
            using 2026 tax brackets.
          </p>
        </div>

        {/* Salary comparison table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Take-Home Pay by Salary Level</h2>
            <p className="text-sm text-gray-400 mt-0.5">Single filer · comparing Texas (no state tax) vs California (high tax) · 2026</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Salary</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">TX Take-Home</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">TX Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CA Take-Home</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CA Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Difference</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.salary} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-900">{fmtUSD(row.salary)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{fmtUSD(row.txNet)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.txRate}%</td>
                    <td className="px-4 py-3 text-right font-medium text-orange-600">{fmtUSD(row.caNet)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.caRate}%</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">
                      −{fmtUSD(row.txNet - row.caNet)}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/salary-guides/${row.salary}`}
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                        Full guide →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grid of salary guide cards */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Browse by Salary Level</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ALL_SALARY_BUCKETS.map((salary) => {
              const tx = calculateNetSalary({ salary, state: "TX" });
              return (
                <a key={salary} href={`/salary-guides/${salary}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 hover:bg-blue-50 transition group">
                  <p className="text-lg font-bold text-gray-900 group-hover:text-blue-700">{fmtUSD(salary)}</p>
                  <p className="text-xs text-gray-400 mt-1">~{fmtUSD(tx.monthlyTakeHome)}/mo take-home</p>
                  <p className="text-xs text-blue-500 mt-2 group-hover:underline">View guide →</p>
                </a>
              );
            })}
          </div>
        </div>

        {/* Quick city links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Is $100k Good in Your City?</h2>
          <div className="flex flex-wrap gap-2">
            {FEATURE_CITIES.map((city) => (
              <a key={city} href={`/is-salary-good/100000/${city}`}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-blue-50 hover:text-blue-700 transition font-medium">
                {city.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
