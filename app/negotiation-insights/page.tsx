import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import { toTitle, fmtUSD } from "@/lib/stateCodeMap";
import { getSalaryEstimate } from "@/lib/data/salaryData";
import jobsList from "@/data/jobs.json";

export const dynamic = "force-static";
export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "Salary Negotiation Insights — Data-Backed Tips by Job & City (2026)",
  description: "Get data-driven salary negotiation insights for your job and city. See market rate, after-tax take-home, rent stress, and step-by-step negotiation tactics.",
  canonical: "/negotiation-insights",
});

const TOP_JOBS = (jobsList as string[]).slice(0, 12);
const TOP_CITIES = [
  "san-francisco","new-york-city","seattle","austin","denver",
  "chicago","miami","boston","los-angeles","atlanta",
];

export default function NegotiationInsightsIndexPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Negotiation Insights · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Salary Negotiation Insights by Job & City
          </h1>
          <p className="text-gray-500 max-w-2xl">
            Stop guessing. Get market-rate data, after-tax take-home calculations, and
            step-by-step negotiation tactics tailored to your job title and city.
          </p>
        </div>

        {/* Job × City grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Browse by Job</h2>
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
                        Median: {fmtUSD(est.median)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TOP_CITIES.map((city) => (
                      <a key={city} href={`/negotiation-insights/${job}/${city}`}
                        className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-100 hover:text-blue-700 transition">
                        {toTitle(city)}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What you'll learn */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What Each Report Covers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ["Market Rate Analysis", "P25/median/P75 salary range with a visual benchmark of where your offer stands"],
              ["After-Tax Take-Home", "Exact net pay for your city and state using 2026 tax brackets"],
              ["Rent Affordability", "Whether your salary covers rent comfortably in that city"],
              ["Negotiation Tactics", "Step-by-step advice backed by real market and tax data"],
              ["Target Salary & Floor", "Calculated ask and walk-away numbers based on your position"],
              ["Benefits Checklist", "10-point checklist: 401k, equity, PTO, remote, and more"],
            ].map(([title, desc]) => (
              <div key={title as string} className="flex gap-3 p-3 rounded-xl bg-gray-50">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
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
