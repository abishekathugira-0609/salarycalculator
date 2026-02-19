import Link from "next/link";
import { notFound } from "next/navigation";
import { salaryLink, livingStateLink, bestCitiesLink } from "@/lib/internal-links";

type PageProps = {
  params: Promise<{ state: string }>;
};

const SALARY_BUCKETS = [
  40000,
  50000,
  60000,
  75000,
  100000,
  125000,
  150000,
  200000,
  250000,
  300000,
];

function formatStateName(state: string) {
  return state.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const state = resolvedParams.state;
  
  if (!state) return {};
  
  const stateName = formatStateName(state);

  return {
    title: `${stateName} Salary Guide (2026) – Take Home Pay & Cost of Living`,
    description: `Explore salary after tax, cost of living, and best cities to live in ${stateName}.`,
  };
}

export default async function StateHubPage({ params }: PageProps) {
  const resolvedParams = await params;
  const state = resolvedParams.state;
  
  if (!state) {
    return notFound();
  }
  
  const stateSlug = state;
  const stateName = formatStateName(stateSlug);

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {stateName} Salary & Cost of Living Guide (2026)
        </h1>

        {/* Intro Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8 text-gray-700">
          <p>
            This guide covers salary after tax breakdowns, cost of living
            insights, and the best cities in {stateName}.
          </p>
        </section>

        {/* Salary Ladder */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Popular salary levels in {stateName}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SALARY_BUCKETS.map((salary) => (
              <Link
                key={salary}
                href={salaryLink(salary, stateSlug)}
                className="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-2 rounded-lg text-center"
              >
                ${salary.toLocaleString()}
              </Link>
            ))}
          </div>
        </section>

        {/* Is It Enough Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Is it enough?
          </h2>

          <ul className="space-y-2 text-blue-600 text-sm">
            {SALARY_BUCKETS.slice(3, 8).map((salary) => (
              <li key={salary}>
                <Link href={livingStateLink(salary, stateSlug)}>
                  Is ${salary.toLocaleString()} enough in {stateName}?
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Best Cities */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Best cities to live in {stateName}
          </h2>

          <ul className="space-y-2 text-blue-600 text-sm">
            {SALARY_BUCKETS.slice(3, 8).map((salary) => (
              <li key={salary}>
                <Link href={bestCitiesLink(stateSlug, salary)}>
                  Best cities in {stateName} for ${salary.toLocaleString()}
                </Link>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </main>
  );
}
