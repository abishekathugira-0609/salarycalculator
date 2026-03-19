import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CITY_COSTS } from "@/data/city-costs";
import jobs from "@/data/jobs.json";
import { getSalaryEstimate } from "@/lib/data/salaryData";
import { getRent } from "@/lib/data/rentData";
import { getCostOfLivingIndex } from "@/lib/data/costOfLiving";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getRentStressFromMonthly } from "@/lib/rentStress";
import { getInternalLinks } from "@/lib/internalLinks";
import { getStateCodeForCity, toTitle, fmtUSD, cityToSlug } from "@/lib/stateCodeMap";
import { buildPageMeta, SEED_CITIES, SEED_JOBS } from "@/lib/seo";
import BudgetPlanner from "@/components/BudgetPlanner";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

// ── Seed: 10 jobs × 50 cities = 500 pages at build time ──────────────────────
export async function generateStaticParams() {
  const params = [];
  for (const job of SEED_JOBS) {
    for (const city of SEED_CITIES) {
      params.push({ job, city });
    }
  }
  return params;
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ job: string; city: string }>;
}): Promise<Metadata> {
  const { job, city } = await params;
  const jobName = toTitle(job);
  const cityName = toTitle(city);
  const est = getSalaryEstimate(job);
  const medianStr = est ? ` — ${fmtUSD(est.median)}` : "";
  return buildPageMeta({
    title: `${jobName} Salary After Tax in ${cityName} (2026)${medianStr}`,
    description: `See the ${jobName} average salary, after-tax take-home pay, rent affordability, and cost of living in ${cityName} for 2026.`,
    canonical: `/job-salary/${job}/${city}`,
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function JobSalaryPage({
  params,
}: {
  params: Promise<{ job: string; city: string }>;
}) {
  const { job, city } = await params;

  const estimate = getSalaryEstimate(job);
  if (!estimate) return notFound();

  const stateCode = getStateCodeForCity(city);
  if (!stateCode) return notFound();

  const rentData = getRent(city);
  const col = getCostOfLivingIndex(city);
  if (!rentData || col === null) return notFound();

  // Calculate net for p25, median, p75
  const [netP25, netMedian, netP75] = [estimate.p25, estimate.median, estimate.p75].map(
    (s) => calculateNetSalary({ salary: s, state: stateCode })
  );

  const monthlyRent = rentData["1br"];
  const rentStress = getRentStressFromMonthly(netMedian.monthlyTakeHome, monthlyRent);

  const jobName = toTitle(job);
  const cityName = toTitle(city);
  const stateName = toTitle(stateCode);

  // Comparison cities (same job, different cities)
  const compareCities = Object.values(CITY_COSTS)
    .flat()
    .filter((c) => cityToSlug(c.city) !== city)
    .sort((a, b) => b.seoWeight - a.seoWeight)
    .slice(0, 5);

  const links = getInternalLinks({ job, city });

  const stressColors: Record<string, string> = {
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  const faqs = [
    {
      q: `What is the average ${jobName} salary in ${cityName}?`,
      a: `The median ${jobName} salary in ${cityName} (${stateName}) is ${fmtUSD(estimate.median)} per year based on BLS OEWS data. The 25th percentile is ${fmtUSD(estimate.p25)} and the 75th percentile is ${fmtUSD(estimate.p75)}.`,
    },
    {
      q: `What is the take-home pay for a ${jobName} in ${cityName}?`,
      a: `At the median salary of ${fmtUSD(estimate.median)}, a ${jobName} in ${stateName} takes home approximately ${fmtUSD(netMedian.netSalary)} per year (${fmtUSD(netMedian.monthlyTakeHome)}/month) after federal and state taxes. The effective tax rate is ${netMedian.effectiveTaxRate}%.`,
    },
    {
      q: `Can a ${jobName} afford rent in ${cityName}?`,
      a: `The average 1-bedroom rent in ${cityName} is ${fmtUSD(monthlyRent)}/month. On the median ${jobName} salary, your rent-to-income ratio is ${rentStress.percentage}%, which is "${rentStress.label}". Financial experts recommend keeping rent below 25–30% of take-home pay (${fmtUSD(rentStress.comfortableMonthlyMax)}/month at this salary).`,
    },
    {
      q: `How does cost of living affect ${jobName} salaries in ${cityName}?`,
      a: `${cityName} has a cost-of-living index of ${col.toFixed(2)} (1.00 = national average). ${col > 1 ? `${cityName} is ${Math.round((col - 1) * 100)}% more expensive than the US average, which reduces the real purchasing power of the ${jobName} salary.` : `${cityName} is ${Math.round((1 - col) * 100)}% cheaper than the US average, so the ${jobName} salary goes further here than in high-cost metros.`}`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const occupationSchema = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: jobName,
    occupationLocation: {
      "@type": "City",
      name: cityName,
    },
    estimatedSalary: [
      {
        "@type": "MonetaryAmountDistribution",
        name: "base",
        currency: "USD",
        duration: "P1Y",
        percentile10: estimate.p25,
        median: estimate.median,
        percentile90: estimate.p75,
      },
    ],
    description: `${jobName} salary after tax in ${cityName}, ${stateName}. Median: ${fmtUSD(estimate.median)}/yr, take-home: ${fmtUSD(netMedian.netSalary)}/yr.`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: "Job Salaries", item: "https://know-your-pay.com/jobs" },
      { "@type": "ListItem", position: 3, name: jobName, item: `https://know-your-pay.com/jobs/${job}` },
      { "@type": "ListItem", position: 4, name: cityName, item: `https://know-your-pay.com/job-salary/${job}/${city}` },
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(occupationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Job Salary Guide · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {jobName} Salary After Tax in {cityName}
          </h1>
          <p className="text-gray-500 text-sm">
            Based on BLS OEWS data · {stateName} · Single filer
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${stressColors[rentStress.color]}`}>
              Rent: {rentStress.label}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              COL Index: {col.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Salary Range */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">{jobName} Salary Range</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { tier: "25th Percentile", gross: estimate.p25, net: netP25, desc: "Entry to mid-level" },
              { tier: "Median", gross: estimate.median, net: netMedian, desc: "Typical salary", highlight: true },
              { tier: "75th Percentile", gross: estimate.p75, net: netP75, desc: "Senior / specialist" },
            ].map((row) => (
              <div
                key={row.tier}
                className={`rounded-xl p-4 text-center ${row.highlight ? "bg-blue-50 border-2 border-blue-200" : "bg-gray-50 border border-gray-100"}`}
              >
                <p className="text-xs font-medium text-gray-500 mb-1">{row.tier}</p>
                <p className="text-xl font-bold text-gray-900">{fmtUSD(row.gross)}</p>
                <p className="text-sm text-gray-500 mt-1">Take-home:</p>
                <p className="text-base font-semibold text-green-700">{fmtUSD(row.net.netSalary)}</p>
                <p className="text-xs text-gray-400 mt-1">{fmtUSD(row.net.monthlyTakeHome)}/mo</p>
                <p className="text-xs text-gray-400 mt-1">{row.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Breakdown (median) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Tax Breakdown</h2>
          <p className="text-sm text-gray-400 mb-5">At median salary of {fmtUSD(estimate.median)}</p>
          <div className="space-y-0">
            {[
              { label: "Gross Salary", value: fmtUSD(netMedian.grossSalary) },
              { label: "Federal Tax", value: `–${fmtUSD(netMedian.federalTax)}`, note: `${((netMedian.federalTax / estimate.median) * 100).toFixed(1)}%` },
              { label: `${stateName} State Tax`, value: netMedian.stateTax > 0 ? `–${fmtUSD(netMedian.stateTax)}` : "$0", note: netMedian.stateTax === 0 ? "No state tax" : undefined },
              { label: "Social Security", value: `–${fmtUSD(netMedian.fica.socialSecurity)}` },
              { label: "Medicare", value: `–${fmtUSD(netMedian.fica.medicare)}` },
              { label: "Annual Take-Home", value: fmtUSD(netMedian.netSalary), bold: true },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <span className={`text-sm ${r.bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                  {r.label}
                  {r.note && <span className="ml-2 text-xs text-gray-400">({r.note})</span>}
                </span>
                <span className={`text-sm font-semibold ${r.bold ? "text-green-700" : "text-gray-900"}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
            <div><span className="block font-semibold text-gray-800">{fmtUSD(netMedian.monthlyTakeHome)}</span>Monthly</div>
            <div><span className="block font-semibold text-gray-800">{fmtUSD(netMedian.biWeeklyTakeHome)}</span>Bi-Weekly</div>
            <div><span className="block font-semibold text-gray-800">{netMedian.effectiveTaxRate}%</span>Effective Rate</div>
          </div>
        </div>

        {/* Rent & Cost of Living */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Cost of Living in {cityName}</h2>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Rent-to-income ratio (1BR)</span>
              <span className={`font-semibold ${rentStress.color === "green" ? "text-green-600" : rentStress.color === "yellow" ? "text-yellow-600" : "text-red-600"}`}>
                {rentStress.percentage}% — {rentStress.label}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${rentStress.color === "green" ? "bg-green-500" : rentStress.color === "yellow" ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, rentStress.percentage)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: "1BR Monthly Rent", value: fmtUSD(monthlyRent) + "/mo" },
              { label: "2BR Monthly Rent", value: fmtUSD(rentData["2br"]) + "/mo" },
              { label: "COL Index", value: col.toFixed(2) },
              { label: "Comfortable Rent Max", value: fmtUSD(rentStress.comfortableMonthlyMax) + "/mo" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Planner */}
        <BudgetPlanner netMonthly={netMedian.monthlyTakeHome} />

        {/* Same Job, Other Cities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{jobName} Salary in Other Cities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {compareCities.map((c) => {
              const slug = cityToSlug(c.city);
              return (
                <a
                  key={slug}
                  href={`/job-salary/${job}/${slug}`}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    {c.city}, {c.state}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {faqs.map((f) => (
              <div key={f.q} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Internal Links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-blue-600 hover:underline truncate">
                {link.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
