import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta, ALL_SALARY_BUCKETS } from "@/lib/seo";
import { toTitle, fmtCompact, stateSlugToCode } from "@/lib/stateCodeMap";
import statesCitiesData from "@/data/states-cities.json";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

const stateData = statesCitiesData as Record<string, string[]>;
const PER_PAGE = 24;

/** Build a flat list of every [city, salary] pair for a state. */
function buildCitySalaryPairs(cities: string[]) {
  const pairs: Array<{ city: string; salary: number }> = [];
  for (const city of cities) {
    for (const salary of ALL_SALARY_BUCKETS) {
      pairs.push({ city, salary });
    }
  }
  return pairs;
}

export async function generateStaticParams() {
  const params: Array<{ state: string; page: string }> = [];
  for (const [state, cities] of Object.entries(stateData)) {
    const total = cities.length * ALL_SALARY_BUCKETS.length;
    const pages = Math.ceil(total / PER_PAGE);
    for (let p = 1; p <= pages; p++) {
      params.push({ state, page: String(p) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; page: string }>;
}): Promise<Metadata> {
  const { state, page } = await params;
  const name = toTitle(state);
  return buildPageMeta({
    title: `${name} Salary Pages — Page ${page} (2026)`,
    description: `Paginated directory of salary after tax pages for every city in ${name}. Page ${page} of ${name} salary and affordability data.`,
    canonical: `/cities/${state}/page/${page}`,
  });
}

export default async function StatePaginatedPage({
  params,
}: {
  params: Promise<{ state: string; page: string }>;
}) {
  const { state, page } = await params;
  const cities = stateData[state];
  if (!cities) return notFound();

  const stateCode = stateSlugToCode(state);
  if (!stateCode) return notFound();

  const pageNum = Number(page);
  if (!pageNum || pageNum < 1) return notFound();

  const allPairs = buildCitySalaryPairs(cities);
  const totalPages = Math.ceil(allPairs.length / PER_PAGE);
  if (pageNum > totalPages) return notFound();

  const pagePairs = allPairs.slice((pageNum - 1) * PER_PAGE, pageNum * PER_PAGE);
  const stateName = toTitle(state);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <a href="/cities" className="hover:text-blue-600">Cities</a>
          <span className="mx-2">›</span>
          <a href={`/cities/${state}`} className="hover:text-blue-600">{stateName}</a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Page {pageNum}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Salary Directory · 2026</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {stateName} Salary Pages — Page {pageNum} of {totalPages}
          </h1>
          <p className="text-gray-500 text-sm">
            Showing {pagePairs.length} of {allPairs.length} salary pages across {cities.length} cities.
          </p>
        </div>

        {/* Link grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pagePairs.map(({ city, salary }) => (
              <a
                key={`${city}-${salary}`}
                href={`/is-salary-good/${salary}/${city}`}
                className="text-sm text-blue-600 hover:underline py-0.5"
              >
                Is {fmtCompact(salary)} a good salary in {toTitle(city)}?
              </a>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
          <div>
            {pageNum > 1 && (
              <a
                href={`/cities/${state}/page/${pageNum - 1}`}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Previous
              </a>
            )}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/cities/${state}/page/${p}`}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  p === pageNum
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                }`}
              >
                {p}
              </a>
            ))}
          </div>
          <div>
            {pageNum < totalPages && (
              <a
                href={`/cities/${state}/page/${pageNum + 1}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Next →
              </a>
            )}
          </div>
        </div>

        {/* Back to hub */}
        <div className="text-center">
          <a href={`/cities/${state}`} className="text-sm text-blue-600 hover:underline">
            ← Back to {stateName} City Hub
          </a>
        </div>

      </div>
    </main>
  );
}
