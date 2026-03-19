import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import { toTitle, fmtUSD } from "@/lib/stateCodeMap";
import { getSalaryEstimate } from "@/lib/data/salaryData";
import jobsList from "@/data/jobs.json";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildPageMeta({
  title: "Salary vs Inflation — Has Your Pay Kept Up? (2020–2026)",
  description: "See whether your salary has outpaced inflation from 2020 to 2026. Compare real wage growth vs CPI and rent increases for 70+ jobs across 300+ US cities.",
  canonical: "/salary-inflation",
});

const TOP_JOBS = (jobsList as string[]).slice(0, 12);
const TOP_CITIES = [
  "new-york-city","los-angeles","chicago","san-francisco","seattle",
  "austin","denver","miami","boston","atlanta",
];

// National CPI growth 2020-2025
const CPI_GROWTH = 24.1;

export default function SalaryInflationIndexPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Salary vs Inflation · 2020–2025</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Has Your Salary Kept Up With Inflation?
          </h1>
          <p className="text-gray-500 max-w-2xl mb-5">
            US consumer prices rose {CPI_GROWTH}% from 2020 to 2025. See whether salaries
            in your field have outpaced inflation — and how much purchasing power you've gained or lost.
          </p>
          <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-bold text-amber-800">CPI Inflation 2020–2025: +{CPI_GROWTH}%</p>
              <p className="text-amber-600 text-xs">A $100,000 salary in 2020 requires ${(100000 * 1.241).toLocaleString()} in 2025 to match purchasing power</p>
            </div>
          </div>
        </div>

        {/* Job × City grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Browse by Job & City</h2>
            <p className="text-sm text-gray-400 mt-0.5">Select a job and city to see 5-year wage growth vs CPI</p>
          </div>
          <div className="p-4 space-y-4">
            {TOP_JOBS.map((job) => {
              const est = getSalaryEstimate(job);
              return (
                <div key={job}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-800">{toTitle(job)}</span>
                    {est && (
                      <span className="text-xs text-gray-400">
                        2025 median: {fmtUSD(est.median)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TOP_CITIES.map((city) => (
                      <a key={city} href={`/salary-inflation/${job}/${city}`}
                        className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-amber-100 hover:text-amber-700 transition">
                        {toTitle(city)}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What each report covers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What Each Report Shows</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ["Nominal Wage Growth", "Year-by-year salary history for your occupation (2020–2025)"],
              ["Real Purchasing Power", "Inflation-adjusted salary in 2020 dollars — the true picture"],
              ["CPI vs Wage Gap", "Visual comparison of your raise vs what inflation required"],
              ["Rent Growth", "How much 1-bedroom rent has risen in your city since 2020"],
              ["Salary Needed Today", "Exact figure needed in 2025 to match 2020 standard of living"],
              ["After-Tax Snapshot", "Current take-home, rent ratio, and monthly leftover after rent"],
            ].map(([title, desc]) => (
              <div key={title as string} className="flex gap-3 p-3 rounded-xl bg-gray-50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
