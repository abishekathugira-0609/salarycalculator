import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta, ALL_SALARY_BUCKETS } from "@/lib/seo";
import { toTitle, fmtUSD, fmtCompact } from "@/lib/stateCodeMap";
import { STATE_CODE_MAP } from "@/lib/stateCodeMap";
import statesCitiesData from "@/data/states-cities.json";

export const dynamic = "force-static";
export const revalidate = 604800;
export const dynamicParams = true;

const stateData = statesCitiesData as Record<string, string[]>;

export async function generateStaticParams() {
  return ALL_SALARY_BUCKETS.map((s) => ({ salary: String(s) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ salary: string }>;
}): Promise<Metadata> {
  const { salary } = await params;
  const gross = Number(salary);
  return buildPageMeta({
    title: `${fmtUSD(gross)} Salary After Tax — Every US City (2026)`,
    description: `See how far a ${fmtUSD(gross)} salary goes in every US city. After-tax take-home, rent affordability, and cost-of-living analysis for 300+ cities.`,
    canonical: `/salary-guides/${salary}`,
  });
}

const NO_TAX_STATES = new Set([
  "alaska", "florida", "nevada", "new-hampshire", "south-dakota",
  "tennessee", "texas", "washington", "wyoming",
]);

// Ordered for SEO priority
const PRIORITY_STATES = [
  "texas", "california", "florida", "new-york", "washington",
  "illinois", "massachusetts", "georgia", "arizona", "colorado",
  "nevada", "north-carolina", "virginia", "pennsylvania", "ohio",
];

export default async function SalaryGuideHubPage({
  params,
}: {
  params: Promise<{ salary: string }>;
}) {
  const { salary } = await params;
  const gross = Number(salary);
  if (!gross || gross <= 0) return notFound();

  const formatted = fmtUSD(gross);
  const compact = fmtCompact(gross);

  // All states, priority ones first
  const allStates = Object.keys(stateData);
  const orderedStates = [
    ...PRIORITY_STATES.filter((s) => allStates.includes(s)),
    ...allStates.filter((s) => !PRIORITY_STATES.includes(s)).sort(),
  ];

  // Nearby salaries for navigation
  const nearby = ALL_SALARY_BUCKETS.filter((s) => s !== gross);

  // Feature cities for the "salary in city" quick links
  const featureCities = [
    "new-york-city", "los-angeles", "chicago", "houston", "phoenix",
    "philadelphia", "san-antonio", "san-diego", "dallas", "san-jose",
    "austin", "seattle", "denver", "nashville", "miami",
    "boston", "portland", "las-vegas", "atlanta", "minneapolis",
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <a href="/cities" className="hover:text-blue-600">Cities</a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{formatted} Salary Guide</span>
        </nav>

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Salary Guide · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {formatted} Salary After Tax — Every US City
          </h1>
          <p className="text-gray-500 max-w-2xl">
            A {formatted} salary means very different things depending on where you live.
            Explore after-tax take-home pay, rent stress, and purchasing power in every US city
            — all using 2026 federal and state tax brackets.
          </p>

          {/* Salary navigation */}
          <div className="mt-5">
            <p className="text-xs text-gray-400 mb-2">Compare other salaries:</p>
            <div className="flex flex-wrap gap-2">
              {nearby.slice(0, 9).map((s) => (
                <a
                  key={s}
                  href={`/salary-guides/${s}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                >
                  {fmtCompact(s)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Top city quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Is {formatted} a Good Salary In…
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {featureCities.map((city) => (
              <a
                key={city}
                href={`/is-salary-good/${gross}/${city}`}
                className="text-sm text-blue-600 hover:underline py-0.5"
              >
                {toTitle(city)}
              </a>
            ))}
          </div>
        </div>

        {/* State-by-state city lists */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {formatted} Salary — All States &amp; Cities
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {orderedStates.length} states · {Object.values(stateData).flat().length} cities
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {orderedStates.map((stateSlug) => {
              const cities = stateData[stateSlug] || [];
              return (
                <div key={stateSlug} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{toTitle(stateSlug)}</h3>
                    {NO_TAX_STATES.has(stateSlug) && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        No income tax
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                    {cities.map((city) => (
                      <a
                        key={city}
                        href={`/is-salary-good/${gross}/${city}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {compact} in {toTitle(city)}
                      </a>
                    ))}
                    {/* State-level salary page */}
                    <a
                      href={`/salary/${gross}-${stateSlug}-2026`}
                      className="text-sm text-gray-500 hover:text-blue-600 hover:underline"
                    >
                      {toTitle(stateSlug)} overview →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rankings CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Which City Makes {formatted} Go Furthest?
          </h2>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/rankings/${gross}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              See City Rankings →
            </a>
            <a
              href={`/salary-leaderboards/${gross}`}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Salary Leaderboard
            </a>
          </div>
        </div>

        {/* Job salaries at this salary level */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Jobs That Pay Around {formatted}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "software-engineer", "registered-nurse", "accountant", "teacher",
              "financial-analyst", "data-scientist", "product-manager", "lawyer",
              "mechanical-engineer", "marketing-manager", "operations-manager", "pharmacist",
            ].map((job) => (
              <a
                key={job}
                href={`/jobs/${job}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {toTitle(job)}
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
