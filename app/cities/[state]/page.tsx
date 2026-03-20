import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta, ALL_SALARY_BUCKETS, SEED_JOBS } from "@/lib/seo";
import { STATE_CODE_MAP, toTitle, fmtCompact, stateSlugToCode } from "@/lib/stateCodeMap";
import statesCitiesData from "@/data/states-cities.json";

export const dynamic = "force-static";
export const revalidate = 604800;
export const dynamicParams = true;

const stateData = statesCitiesData as Record<string, string[]>;

export async function generateStaticParams() {
  return Object.keys(stateData).map((state) => ({ state }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const name = toTitle(state);
  return buildPageMeta({
    title: `${name} Cities — Salary, Rent & Cost of Living (2026)`,
    description: `Browse all ${name} cities for after-tax salary calculations, rent data, job salaries, and cost-of-living comparisons. Data for every major ${name} city.`,
    canonical: `/cities/${state}`,
  });
}

const NO_TAX_STATES = new Set([
  "alaska", "florida", "nevada", "new-hampshire", "south-dakota",
  "tennessee", "texas", "washington", "wyoming",
]);

const FLAT_TAX_STATES = new Set([
  "arizona", "colorado", "georgia", "illinois", "indiana", "kentucky",
  "massachusetts", "michigan", "mississippi", "north-carolina", "pennsylvania", "utah",
]);

const PRIMARY_SALARY = 100000;
const FEATURE_JOBS = SEED_JOBS.slice(0, 6);
const FEATURE_SALARIES = [60000, 80000, 100000, 125000, 150000, 200000];

function taxLabel(stateSlug: string): string {
  if (NO_TAX_STATES.has(stateSlug)) return "No state income tax";
  if (FLAT_TAX_STATES.has(stateSlug)) return "Flat-rate income tax";
  return "Progressive income tax";
}

export default async function StateHubPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const cities = stateData[state];
  if (!cities || cities.length === 0) return notFound();

  const stateCode = stateSlugToCode(state);
  if (!stateCode) return notFound();

  const stateName = toTitle(state);
  const isNoTax = NO_TAX_STATES.has(state);

  // Other states for comparison links
  const otherStates = Object.keys(stateData)
    .filter((s) => s !== state)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <a href="/cities" className="hover:text-blue-600">Cities</a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{stateName}</span>
        </nav>

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">State Hub · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {stateName} — Salary &amp; Cost of Living by City
          </h1>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium">
              {cities.length} cities
            </span>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              isNoTax ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
            }`}>
              {taxLabel(state)}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium">
              {stateCode}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-4 max-w-2xl">
            Explore after-tax salary data, rent stress analysis, job salaries, and city cost comparisons
            for every major city in {stateName}. All figures use 2026 tax brackets.
          </p>

          {/* Salary guide CTA */}
          <div className="mt-5">
            <a
              href={`/${state}-salary-guide`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {stateName} Salary Guide →
            </a>
          </div>
        </div>

        {/* City cards — main content */}
        <div className="space-y-6">
          {cities.map((city) => (
            <div key={city} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* City header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{toTitle(city)}</h2>
                  <p className="text-xs text-gray-400">{stateName} · {stateCode}</p>
                </div>
                <a
                  href={`/is-salary-good/${PRIMARY_SALARY}/${city}`}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  $100k analysis →
                </a>
              </div>

              {/* Salary rows */}
              <div className="px-6 py-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Is This Salary Good in {toTitle(city)}?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FEATURE_SALARIES.map((sal) => (
                    <a
                      key={sal}
                      href={`/is-salary-good/${sal}/${city}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {fmtCompact(sal)} in {toTitle(city)}
                    </a>
                  ))}
                </div>
              </div>

              {/* Job salary rows */}
              <div className="px-6 pb-4 border-t border-gray-50 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Job Salaries in {toTitle(city)}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FEATURE_JOBS.map((job) => (
                    <a
                      key={job}
                      href={`/job-salary/${job}/${city}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {toTitle(job)}
                    </a>
                  ))}
                </div>
              </div>

              {/* More links */}
              <div className="px-6 pb-4 border-t border-gray-50 pt-3">
                <div className="flex flex-wrap gap-3 text-xs">
                  <a href={`/city-living/${city}`} className="text-gray-600 hover:text-blue-600">
                    Cost of living in {toTitle(city)}
                  </a>
                  <a href={`/rankings/${PRIMARY_SALARY}`} className="text-gray-600 hover:text-blue-600">
                    $100k city rankings
                  </a>
                  <a href={`/can-you-afford/${PRIMARY_SALARY}/400000/${city}`} className="text-gray-600 hover:text-blue-600">
                    Can you afford a house in {toTitle(city)}?
                  </a>
                  <a href={`/cities/${state}/page/1`} className="text-gray-600 hover:text-blue-600">
                    All {stateName} salary pages →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* All salary buckets for this state */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            All Salary Levels — {stateName}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_SALARY_BUCKETS.map((sal) => (
              <a
                key={sal}
                href={`/salary/${sal}-${state}-2026`}
                className="text-sm text-blue-600 hover:underline"
              >
                {fmtCompact(sal)} salary in {stateName}
              </a>
            ))}
          </div>
        </div>

        {/* Remote tax */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Remote Work Tax — {stateName}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["california","texas","florida","new-york","washington","illinois"].filter((s) => s !== state).slice(0, 6).map((other) => (
              <a
                key={other}
                href={`/remote-tax/${state}/${other}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Live in {stateName}, work in {toTitle(other)}
              </a>
            ))}
          </div>
        </div>

        {/* Other states */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Other States</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {otherStates.map((s) => (
              <a key={s} href={`/cities/${s}`} className="text-sm text-blue-600 hover:underline">
                {toTitle(s)} cities →
              </a>
            ))}
            <a href="/cities" className="text-sm text-blue-600 hover:underline font-semibold">
              View all states →
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
