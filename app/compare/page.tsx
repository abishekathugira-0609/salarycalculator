import type { Metadata } from "next";
import { buildPageMeta, SEED_CITIES } from "@/lib/seo";
import { toTitle } from "@/lib/stateCodeMap";

export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "Compare US Cities: Salary, Rent & Cost of Living (2026)",
  description:
    "Compare salaries, rent, taxes, and purchasing power between any two US cities. Find out which city gives your money more value in 2026.",
  canonical: "/compare",
});

const FEATURED_PAIRS = [
  ["new-york-city", "los-angeles"],
  ["san-francisco", "austin"],
  ["seattle", "denver"],
  ["chicago", "miami"],
  ["boston", "nashville"],
  ["new-york-city", "chicago"],
  ["los-angeles", "phoenix"],
  ["seattle", "austin"],
  ["san-francisco", "new-york-city"],
  ["denver", "austin"],
  ["miami", "tampa"],
  ["dallas", "houston"],
];

const TOP_CITIES = SEED_CITIES.slice(0, 24);

export default function ComparePage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: "City Comparisons", item: "https://know-your-pay.com/compare" },
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">City Comparisons · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Compare US Cities: Salary &amp; Cost of Living
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl">
            See how rent, taxes, and purchasing power differ between any two US cities.
            Pick a pair below or browse the full city matrix.
          </p>
        </div>

        {/* Featured Comparisons */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Featured Comparisons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURED_PAIRS.map(([a, b]) => (
              <a
                key={`${a}-${b}`}
                href={`/compare/${a}-vs-${b}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                  {toTitle(a)} vs {toTitle(b)}
                </span>
                <span className="text-blue-400 text-xs group-hover:text-blue-600">→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Full City Matrix */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Browse All City Comparisons</h2>
          <p className="text-sm text-gray-400 mb-5">
            Select any city to see all available comparisons
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {TOP_CITIES.map((city) => (
              <div key={city}>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">{toTitle(city)}</p>
                <div className="space-y-1">
                  {TOP_CITIES.filter((c) => c !== city).slice(0, 3).map((other) => (
                    <a
                      key={other}
                      href={`/compare/${city}-vs-${other}`}
                      className="block text-xs text-blue-600 hover:underline truncate"
                    >
                      vs {toTitle(other)}
                    </a>
                  ))}
                  <a
                    href={`/compare/${city}-vs-${TOP_CITIES.find((c) => c !== city) ?? "los-angeles"}`}
                    className="block text-xs text-gray-400 hover:text-blue-500"
                  >
                    more →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Compare */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Why Compare Cities?</h2>
          <div className="grid sm:grid-cols-3 gap-5 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Job Offers</p>
              <p>A $120k offer in Austin may be worth more than $150k in San Francisco once you account for rent and taxes.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Relocation</p>
              <p>Before moving, see exactly how much your salary needs to change to maintain your current standard of living.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Remote Work</p>
              <p>Remote workers can pick the city where their salary goes furthest — comparisons make the decision data-driven.</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
