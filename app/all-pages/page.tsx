import type { Metadata } from "next";
import { buildPageMeta, ALL_SALARY_BUCKETS } from "@/lib/seo";
import { toTitle, fmtCompact, fmtUSD } from "@/lib/stateCodeMap";
import statesCitiesData from "@/data/states-cities.json";
import jobsList from "@/data/jobs.json";

export const dynamic = "force-static";
export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "All Pages Directory — Know Your Pay (2026)",
  description:
    "Complete index of all salary, city, job, and comparison pages on Know Your Pay. Organized by category for easy discovery.",
  canonical: "/all-pages",
});

const stateData = statesCitiesData as Record<string, string[]>;
const allCities = Object.values(stateData).flat();
const allStates = Object.keys(stateData).sort();
const jobs = jobsList as string[];

// Top cities for dense link generation
const TOP_CITIES = [
  "new-york-city","los-angeles","chicago","houston","phoenix",
  "philadelphia","san-antonio","san-diego","dallas","san-jose",
  "austin","seattle","denver","nashville","miami",
  "boston","portland","las-vegas","atlanta","minneapolis",
  "raleigh","tampa","orlando","salt-lake-city","richmond",
  "pittsburgh","cincinnati","kansas-city","st-louis","cleveland",
  "sacramento","oklahoma-city","tucson","albuquerque","omaha",
  "louisville","baltimore","milwaukee","detroit","el-paso",
];

const TOP_STATE_PAIRS = [
  ["texas","california"],["new-york","florida"],["washington","texas"],
  ["california","texas"],["florida","new-york"],["illinois","texas"],
];

export default function AllPagesIndex() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Site Directory</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">All Pages Index</h1>
          <p className="text-gray-500 text-sm">
            Complete directory of salary, city, job, and comparison pages.
            Use the sections below to find any page on Know Your Pay.
          </p>
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <a href="#salary-hubs"    className="text-blue-600 hover:underline">Salary Guides</a>
            <a href="#city-hubs"      className="text-blue-600 hover:underline">City Hubs</a>
            <a href="#job-hubs"       className="text-blue-600 hover:underline">Job Salaries</a>
            <a href="#rankings"       className="text-blue-600 hover:underline">Rankings</a>
            <a href="#is-salary-good" className="text-blue-600 hover:underline">Is Salary Good</a>
            <a href="#comparisons"    className="text-blue-600 hover:underline">Comparisons</a>
            <a href="#remote-tax"     className="text-blue-600 hover:underline">Remote Tax</a>
            <a href="#state-guides"   className="text-blue-600 hover:underline">State Guides</a>
          </div>
        </div>

        {/* 1. Salary hub pages */}
        <section id="salary-hubs" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Salary Guides ({ALL_SALARY_BUCKETS.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_SALARY_BUCKETS.map((sal) => (
              <a key={sal} href={`/salary-guides/${sal}`} className="text-sm text-blue-600 hover:underline">
                {fmtUSD(sal)} salary guide
              </a>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-500 mb-2">Salary rankings</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_SALARY_BUCKETS.map((sal) => (
                <a key={sal} href={`/rankings/${sal}`} className="text-sm text-blue-600 hover:underline">
                  Best cities for {fmtCompact(sal)}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 2. City hub pages */}
        <section id="city-hubs" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            City &amp; State Hubs ({allStates.length} states · {allCities.length} cities)
          </h2>
          <a href="/cities" className="inline-block text-sm font-semibold text-blue-600 hover:underline mb-3">
            → Full City Directory
          </a>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-0.5">
            {allStates.map((state) => (
              <a key={state} href={`/cities/${state}`} className="text-sm text-blue-600 hover:underline py-0.5">
                {toTitle(state)}
              </a>
            ))}
          </div>
        </section>

        {/* 3. Job hub pages */}
        <section id="job-hubs" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Job Salary Hubs ({jobs.length} jobs)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {jobs.map((job) => (
              <a key={job} href={`/jobs/${job}`} className="text-sm text-blue-600 hover:underline">
                {toTitle(job)} salary by city
              </a>
            ))}
          </div>
        </section>

        {/* 4. Is salary good — top cities × all salaries */}
        <section id="is-salary-good" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            "Is This Salary Good?" Pages ({TOP_CITIES.length * ALL_SALARY_BUCKETS.length}+)
          </h2>
          <div className="space-y-4">
            {ALL_SALARY_BUCKETS.slice(0, 6).map((sal) => (
              <div key={sal}>
                <p className="text-sm font-semibold text-gray-700 mb-1">{fmtUSD(sal)}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
                  {TOP_CITIES.slice(0, 12).map((city) => (
                    <a
                      key={city}
                      href={`/is-salary-good/${sal}/${city}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {toTitle(city)}
                    </a>
                  ))}
                  <a href={`/salary-guides/${sal}`} className="text-xs text-gray-500 hover:text-blue-600">
                    All cities →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Job salary pages — top jobs × top cities */}
        <section id="job-salary" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Job Salary Pages ({jobs.length * allCities.length}+)
          </h2>
          <div className="space-y-4">
            {jobs.slice(0, 8).map((job) => (
              <div key={job}>
                <a href={`/jobs/${job}`} className="text-sm font-semibold text-gray-700 hover:text-blue-600 mb-1 block">
                  {toTitle(job)} →
                </a>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
                  {TOP_CITIES.slice(0, 8).map((city) => (
                    <a
                      key={city}
                      href={`/job-salary/${job}/${city}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {toTitle(city)}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Rankings */}
        <section id="rankings" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">City Rankings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_SALARY_BUCKETS.map((sal) => (
              <a key={sal} href={`/rankings/${sal}`} className="text-sm text-blue-600 hover:underline">
                Best cities for {fmtUSD(sal)}
              </a>
            ))}
          </div>
        </section>

        {/* 7. City comparisons */}
        <section id="comparisons" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">City Comparisons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOP_CITIES.slice(0, 15).flatMap((cityA) =>
              TOP_CITIES.filter((c) => c !== cityA).slice(0, 3).map((cityB) => (
                <a
                  key={`${cityA}-${cityB}`}
                  href={`/compare/${cityA}-vs-${cityB}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {toTitle(cityA)} vs {toTitle(cityB)}
                </a>
              ))
            ).slice(0, 40)}
          </div>
        </section>

        {/* 8. Remote tax */}
        <section id="remote-tax" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Remote Work Tax Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "california","texas","new-york","florida","washington",
              "illinois","massachusetts","georgia","arizona","colorado",
              "nevada","north-carolina","virginia","pennsylvania","ohio",
            ].flatMap((liveState) =>
              ["texas","california","new-york","florida","washington"].filter((w) => w !== liveState).slice(0, 3).map((workState) => (
                <a
                  key={`${liveState}-${workState}`}
                  href={`/remote-tax/${liveState}/${workState}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Live in {toTitle(liveState)}, work in {toTitle(workState)}
                </a>
              ))
            ).slice(0, 36)}
          </div>
        </section>

        {/* 9. State salary guides */}
        <section id="state-guides" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">State Salary Guides ({allStates.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allStates.map((state) => (
              <a
                key={state}
                href={`/${state}-salary-guide`}
                className="text-sm text-blue-600 hover:underline"
              >
                {toTitle(state)} salary guide
              </a>
            ))}
          </div>
        </section>

        {/* 10. Affordability pages */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Home Affordability Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[100000,150000,200000].flatMap((sal) =>
              [300000,400000,600000].flatMap((price) =>
                TOP_CITIES.slice(0, 8).map((city) => (
                  <a
                    key={`${sal}-${price}-${city}`}
                    href={`/can-you-afford/${sal}/${price}/${city}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Can you afford {fmtCompact(price)} on {fmtCompact(sal)} in {toTitle(city)}?
                  </a>
                ))
              )
            ).slice(0, 32)}
          </div>
        </section>

      </div>
    </main>
  );
}
