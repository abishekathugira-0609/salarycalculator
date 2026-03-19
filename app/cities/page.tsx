import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import { STATE_CODE_MAP, toTitle } from "@/lib/stateCodeMap";
import statesCitiesData from "@/data/states-cities.json";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildPageMeta({
  title: "US Cities Salary & Cost of Living Directory (2026)",
  description:
    "Browse every US state's cities for salary after tax, cost of living, rent affordability, and job salary data. 300+ cities covered.",
  canonical: "/cities",
});

const stateData = statesCitiesData as Record<string, string[]>;

// No-income-tax states get a badge
const NO_TAX_STATES = new Set([
  "alaska", "florida", "nevada", "new-hampshire", "south-dakota",
  "tennessee", "texas", "washington", "wyoming",
]);

export default function CitiesIndexPage() {
  const states = Object.entries(stateData).sort(([a], [b]) => a.localeCompare(b));

  // Group into 4 columns
  const cols: Array<typeof states> = [[], [], [], []];
  states.forEach((entry, i) => cols[i % 4].push(entry));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">City Directory · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            US Cities — Salary &amp; Cost of Living
          </h1>
          <p className="text-gray-500 max-w-2xl">
            Browse all 50 states to find after-tax salary calculations, rent affordability data,
            job salary ranges, and cost-of-living comparisons for hundreds of US cities.
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: "States covered", value: states.length.toString() },
              { label: "Cities indexed", value: `${Object.values(stateData).flat().length}+` },
              { label: "Salary buckets", value: "12" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* State grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Browse by State</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1">
            {cols.map((col, ci) => (
              <div key={ci} className="space-y-0.5">
                {col.map(([slug, cities]) => (
                  <div key={slug} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <a
                      href={`/cities/${slug}`}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      {toTitle(slug)}
                    </a>
                    <span className="flex items-center gap-1">
                      {NO_TAX_STATES.has(slug) && (
                        <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">
                          No tax
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{cities.length}</span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Popular states */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Most Searched States</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["texas","california","florida","new-york","washington","illinois",
              "massachusetts","georgia","arizona","colorado","nevada","north-carolina"].map((slug) => (
              <a
                key={slug}
                href={`/cities/${slug}`}
                className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-xl px-4 py-3 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700">
                    {toTitle(slug)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(stateData[slug] || []).length} cities
                    {NO_TAX_STATES.has(slug) ? " · No income tax" : ""}
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-blue-400">→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Explore by Tool</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: "/salary-guides/100000", label: "$100k Salary — City-by-City Breakdown" },
              { href: "/salary-guides/80000",  label: "$80k Salary — City-by-City Breakdown" },
              { href: "/salary-guides/60000",  label: "$60k Salary — City-by-City Breakdown" },
              { href: "/jobs/software-engineer", label: "Software Engineer Salary by City" },
              { href: "/jobs/registered-nurse",  label: "Registered Nurse Salary by City" },
              { href: "/jobs/teacher",           label: "Teacher Salary by City" },
              { href: "/rankings/100000",        label: "Best Cities for $100k Salary" },
              { href: "/all-pages",              label: "Full Page Directory" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-blue-600 hover:underline">
                {l.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
