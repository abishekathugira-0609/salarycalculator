import type { Metadata } from "next";
import { buildPageMeta, ALL_SALARY_BUCKETS } from "@/lib/seo";
import { fmtUSD } from "@/lib/stateCodeMap";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildPageMeta({
  title: "Best Cities for Your Salary — City Rankings by Income (2026)",
  description: "Find the best US cities for your salary. Rankings by take-home pay, rent affordability, and purchasing power for every income level from $40k to $300k.",
  canonical: "/rankings",
});

export default function RankingsIndexPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">City Rankings · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Best Cities for Your Salary (2026)
          </h1>
          <p className="text-gray-500 max-w-2xl">
            Which US cities give you the most purchasing power? Our rankings factor in
            state income tax, rent, and cost of living to show where your salary goes furthest.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Rankings by Salary Level</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_SALARY_BUCKETS.map((salary) => (
              <a key={salary} href={`/rankings/${salary}`}
                className="flex flex-col gap-1 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 p-4 transition group">
                <span className="text-lg font-bold text-gray-900 group-hover:text-blue-700">{fmtUSD(salary)}</span>
                <span className="text-xs text-gray-400">Best cities ranked →</span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">How Rankings Work</h2>
          <div className="space-y-3 text-sm text-gray-600">
            {[
              ["After-Tax Take-Home", "We calculate your net pay using 2026 federal and state tax brackets for each city's state."],
              ["Rent-to-Income Ratio", "We compare average 1-bedroom rent to monthly take-home. Lower is better."],
              ["Purchasing Power", "Cost-of-living index adjusts your take-home to show real spending power."],
              ["Composite Score", "Cities are ranked by a weighted average of all three factors."],
            ].map(([title, desc]) => (
              <div key={title as string} className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-800">{title}: </span>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
