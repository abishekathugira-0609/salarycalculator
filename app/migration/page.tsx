import type { Metadata } from "next";
import { buildPageMeta, SEED_CITIES } from "@/lib/seo";
import { toTitle } from "@/lib/stateCodeMap";

export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "City Relocation Salary Guide: How Much Do You Need? (2026)",
  description:
    "Planning to relocate? Find out how much salary you need in your new city to maintain your current purchasing power. Cost-of-living adjusted salary calculator for 20+ US cities.",
  canonical: "/migration",
});

const MIGRATION_CITIES = SEED_CITIES.slice(0, 20);

const POPULAR_ROUTES = [
  ["san-francisco", "austin"],
  ["new-york-city", "miami"],
  ["seattle", "denver"],
  ["chicago", "nashville"],
  ["los-angeles", "phoenix"],
  ["new-york-city", "austin"],
  ["san-francisco", "seattle"],
  ["boston", "miami"],
  ["new-york-city", "dallas"],
  ["chicago", "denver"],
  ["los-angeles", "seattle"],
  ["san-francisco", "denver"],
];

export default function MigrationPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: "Relocation Guides", item: "https://know-your-pay.com/migration" },
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
          <p className="text-sm font-medium text-blue-600 mb-2">Relocation Guides · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Moving to a New City? Know Your Salary
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl">
            Every relocation guide shows you the salary equivalent you need in your new city,
            rent comparison, tax difference, and full cost-of-living breakdown.
          </p>
        </div>

        {/* Popular Routes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Popular Relocation Routes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {POPULAR_ROUTES.map(([from, to]) => (
              <a
                key={`${from}-${to}`}
                href={`/migration/${from}/${to}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <div className="text-sm">
                  <span className="font-medium text-gray-700 group-hover:text-blue-700">{toTitle(from)}</span>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="font-medium text-gray-900 group-hover:text-blue-800">{toTitle(to)}</span>
                </div>
                <span className="text-blue-400 text-xs group-hover:text-blue-600 flex-shrink-0">View →</span>
              </a>
            ))}
          </div>
        </div>

        {/* All City Matrix */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">All Relocation Pairs</h2>
          <p className="text-sm text-gray-400 mb-5">
            Select your current city and see salary guides to every destination
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {MIGRATION_CITIES.map((fromCity) => (
              <div key={fromCity}>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">From {toTitle(fromCity)}</p>
                <div className="space-y-1">
                  {MIGRATION_CITIES.filter((c) => c !== fromCity).slice(0, 4).map((toCity) => (
                    <a
                      key={toCity}
                      href={`/migration/${fromCity}/${toCity}`}
                      className="block text-xs text-blue-600 hover:underline truncate"
                    >
                      → {toTitle(toCity)}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What You Learn */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What Each Guide Covers</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
            {[
              { title: "Salary Adjustment Table", desc: "Exact salary needed in your new city to match current purchasing power at 6 income levels." },
              { title: "Rent Comparison", desc: "Studio, 1BR, 2BR, and family unit rent — side by side with % difference." },
              { title: "Tax Difference", desc: "How state income tax changes your take-home pay when crossing state lines." },
              { title: "Cost of Living Index", desc: "Overall cost comparison using C2ER/ACCRA data — is your new city cheaper or more expensive?" },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="text-blue-500 font-bold text-lg leading-none">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
