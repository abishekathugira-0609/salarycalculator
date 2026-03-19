import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta, SEED_JOBS, SEED_CITIES } from "@/lib/seo";
import { getSalaryEstimate } from "@/lib/data/salaryData";
import { getRent } from "@/lib/data/rentData";
import { getCostOfLivingIndex } from "@/lib/data/costOfLiving";
import { getStateCodeForCity, toTitle, fmtUSD } from "@/lib/stateCodeMap";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getInternalLinks } from "@/lib/internalLinks";
import jobsList from "@/data/jobs.json";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

// ── Seed: top 10 jobs × top 10 cities = 100 pages ────────────────────────────
export async function generateStaticParams() {
  const params: Array<{ job: string; city: string }> = [];
  for (const job of SEED_JOBS.slice(0, 10)) {
    for (const city of SEED_CITIES.slice(0, 10)) {
      params.push({ job, city });
    }
  }
  return params;
}

// ── Historical CPI (US Bureau of Labor Statistics, annual averages) ───────────
// Index: 2020 = 1.000
const CPI_BY_YEAR: Record<number, number> = {
  2020: 1.000,
  2021: 1.047,
  2022: 1.131,
  2023: 1.178,
  2024: 1.212,
  2025: 1.241, // BLS projected
};

// ── Historical rent growth (national avg 1BR, Apartment List / HUD) ───────────
// Index: 2020 = 1.000
const RENT_INDEX_BY_YEAR: Record<number, number> = {
  2020: 1.000,
  2021: 1.112,
  2022: 1.247,
  2023: 1.301,
  2024: 1.338,
  2025: 1.365,
};

// ── Job-type salary growth rates (BLS OEWS 5-year trend) ─────────────────────
// Annual nominal wage growth per occupation group
const JOB_GROWTH_RATES: Record<string, number> = {
  "software-engineer": 0.062,
  "data-scientist": 0.071,
  "cloud-architect": 0.075,
  "devops-engineer": 0.068,
  "cybersecurity-analyst": 0.072,
  "full-stack-developer": 0.065,
  "ux-designer": 0.055,
  "product-manager": 0.063,
  "data-analyst": 0.058,
  "business-analyst": 0.050,
  "physician": 0.038,
  "dentist": 0.035,
  "pharmacist": 0.028,
  "registered-nurse": 0.045,
  "physical-therapist": 0.032,
  "paramedic": 0.030,
  "social-worker": 0.025,
  "psychologist": 0.028,
  "teacher": 0.025,
  "lawyer": 0.042,
  "accountant": 0.038,
  "financial-analyst": 0.048,
  "marketing-manager": 0.045,
  "human-resources-manager": 0.038,
  "sales-manager": 0.042,
  "project-manager": 0.040,
  "operations-manager": 0.038,
  "supply-chain-manager": 0.043,
  "mechanical-engineer": 0.035,
  "civil-engineer": 0.033,
  "electrical-engineer": 0.037,
  "construction-manager": 0.038,
  "real-estate-agent": 0.040,
  "insurance-agent": 0.028,
  "graphic-designer": 0.028,
  "chef": 0.030,
  "police-officer": 0.030,
  "firefighter": 0.028,
};

const BASE_GROWTH_RATE = 0.035; // fallback

function getGrowthRate(job: string): number {
  return JOB_GROWTH_RATES[job] ?? BASE_GROWTH_RATE;
}

const BASE_YEAR = 2020;
const CURRENT_YEAR = 2025;
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

/** Compound back from current median to 2020 using the job's growth rate. */
function estimateSalaryByYear(currentMedian: number, growthRate: number) {
  return YEARS.map((year) => {
    const yearsBack = CURRENT_YEAR - year;
    const salary = Math.round(currentMedian / Math.pow(1 + growthRate, yearsBack));
    return { year, salary };
  });
}

/** Real purchasing power of salary relative to 2020 dollars. */
function realPurchasingPower(nominal: number, year: number): number {
  return Math.round(nominal / CPI_BY_YEAR[year]);
}

/** Salary needed today to match 2020 purchasing power. */
function salaryNeededToday(salary2020: number): number {
  return Math.round(salary2020 * CPI_BY_YEAR[CURRENT_YEAR]);
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ job: string; city: string }>;
}): Promise<Metadata> {
  const { job, city } = await params;
  const jobTitle = toTitle(job);
  const cityTitle = toTitle(city);
  return buildPageMeta({
    title: `${jobTitle} Salary Inflation in ${cityTitle} (2020–2025)`,
    description: `Has the ${jobTitle} salary in ${cityTitle} kept up with inflation? See real purchasing power, wage growth vs CPI, and rent increases from 2020 to 2025.`,
    canonical: `/salary-inflation/${job}/${city}`,
  });
}

// ── Bar helper (text-based progress) ─────────────────────────────────────────
function pct(value: number, max: number) {
  return Math.min(100, Math.round((value / max) * 100));
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function SalaryInflationPage({
  params,
}: {
  params: Promise<{ job: string; city: string }>;
}) {
  const { job, city } = await params;

  if (!(jobsList as string[]).includes(job)) return notFound();

  const stateCode = getStateCodeForCity(city);
  if (!stateCode) return notFound();

  const est = getSalaryEstimate(job);
  if (!est) return notFound();

  const rent = getRent(city);
  const col = getCostOfLivingIndex(city);

  const jobTitle = toTitle(job);
  const cityTitle = toTitle(city);
  const growthRate = getGrowthRate(job);

  // ── Salary history ─────────────────────────────────────────────────────────
  const salaryHistory = estimateSalaryByYear(est.median, growthRate);
  const salary2020 = salaryHistory[0].salary;
  const salary2025 = est.median;

  const nominalGrowthTotal = ((salary2025 - salary2020) / salary2020) * 100;
  const cpiGrowthTotal = ((CPI_BY_YEAR[CURRENT_YEAR] - 1) * 100); // vs 2020 base
  const realGrowth = nominalGrowthTotal - cpiGrowthTotal;
  const beatInflation = realGrowth > 0;

  // ── Purchasing power rows ──────────────────────────────────────────────────
  const ppRows = salaryHistory.map(({ year, salary }) => ({
    year,
    nominal: salary,
    real: realPurchasingPower(salary, year),
    cpiIndex: CPI_BY_YEAR[year],
  }));

  // ── Rent history ───────────────────────────────────────────────────────────
  const baseRent2025 = rent?.["1br"] ?? Math.round(1200 * (col ?? 1));
  const rentHistory = YEARS.map((year) => ({
    year,
    rent: Math.round(baseRent2025 / RENT_INDEX_BY_YEAR[year] * RENT_INDEX_BY_YEAR[year > 2020 ? year : 2020]),
  })).map(({ year }) => ({
    year,
    rent: Math.round(baseRent2025 * RENT_INDEX_BY_YEAR[year] / RENT_INDEX_BY_YEAR[CURRENT_YEAR]),
  }));

  const rent2020 = rentHistory[0].rent;
  const rentGrowthTotal = ((baseRent2025 - rent2020) / rent2020) * 100;

  // ── After-tax for current salary ──────────────────────────────────────────
  const netToday = calculateNetSalary({ salary: salary2025, state: stateCode });
  const netMonthly = netToday.monthlyTakeHome;
  const rentToIncomeRatio = rent ? (rent["1br"] / netMonthly) * 100 : null;

  // ── Salary needed to match 2020 purchasing power ──────────────────────────
  const salaryNeeded = salaryNeededToday(salary2020);
  const surplusDeficit = salary2025 - salaryNeeded;

  // ── Internal links ─────────────────────────────────────────────────────────
  const links = getInternalLinks({ city, job });

  // ── FAQ schema ─────────────────────────────────────────────────────────────
  const faqs = [
    {
      q: `Has the ${jobTitle} salary in ${cityTitle} kept up with inflation?`,
      a: beatInflation
        ? `Yes. ${jobTitle} salaries in ${cityTitle} grew ${nominalGrowthTotal.toFixed(1)}% from 2020 to 2025, outpacing CPI inflation of ${cpiGrowthTotal.toFixed(1)}%. Real purchasing power increased by ${realGrowth.toFixed(1)}%.`
        : `No. ${jobTitle} salaries in ${cityTitle} grew ${nominalGrowthTotal.toFixed(1)}% from 2020 to 2025, but CPI inflation was ${cpiGrowthTotal.toFixed(1)}%. Real purchasing power declined by ${Math.abs(realGrowth).toFixed(1)}%.`,
    },
    {
      q: `What was the ${jobTitle} salary in ${cityTitle} in 2020?`,
      a: `In 2020 the estimated median ${jobTitle} salary was ${fmtUSD(salary2020)} — equivalent to ${fmtUSD(salaryNeeded)} in 2025 dollars after accounting for cumulative inflation of ${cpiGrowthTotal.toFixed(1)}%.`,
    },
    {
      q: `How much has rent increased in ${cityTitle} since 2020?`,
      a: `Average 1BR rent in ${cityTitle} rose from approximately ${fmtUSD(rent2020)}/month in 2020 to ${fmtUSD(baseRent2025)}/month in 2025 — a ${rentGrowthTotal.toFixed(1)}% increase. ${rentGrowthTotal > cpiGrowthTotal ? `Rent grew ${(rentGrowthTotal - cpiGrowthTotal).toFixed(1)} percentage points faster than general CPI inflation.` : `Rent growth lagged behind general CPI inflation by ${(cpiGrowthTotal - rentGrowthTotal).toFixed(1)} points.`}`,
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

  const maxSalary = Math.max(...salaryHistory.map((r) => r.salary));

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <a href={`/jobs/${job}`} className="hover:text-blue-600">{jobTitle}</a>
          <span className="mx-2">›</span>
          <a href={`/cities`} className="hover:text-blue-600">{cityTitle}</a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Salary Inflation</span>
        </nav>

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Salary Inflation · 2020–2025</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {jobTitle} Salary Inflation in {cityTitle}
          </h1>
          <p className="text-gray-500 text-sm mb-5">
            Has the {jobTitle} salary kept pace with the cost of living? Five years of wage growth,
            CPI inflation, and rent increases compared.
          </p>

          {/* Verdict banner */}
          <div className={`rounded-xl px-5 py-4 border ${
            beatInflation
              ? "bg-green-50 border-green-100"
              : "bg-red-50 border-red-100"
          }`}>
            <p className={`font-bold text-lg ${beatInflation ? "text-green-800" : "text-red-800"}`}>
              {beatInflation ? "✓ Beat Inflation" : "✗ Fell Behind Inflation"}
            </p>
            <p className={`text-sm mt-1 ${beatInflation ? "text-green-700" : "text-red-700"}`}>
              {jobTitle} wages grew <strong>{nominalGrowthTotal.toFixed(1)}%</strong> from 2020–2025.
              CPI inflation was <strong>{cpiGrowthTotal.toFixed(1)}%</strong>.
              Real purchasing power {beatInflation ? "increased" : "decreased"} by{" "}
              <strong>{Math.abs(realGrowth).toFixed(1)}%</strong>.
            </p>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            {[
              { label: "2020 Salary",  value: fmtUSD(salary2020) },
              { label: "2025 Salary",  value: fmtUSD(salary2025), highlight: true },
              { label: "Wage Growth",  value: `+${nominalGrowthTotal.toFixed(1)}%` },
              { label: "Real Growth",  value: `${realGrowth >= 0 ? "+" : ""}${realGrowth.toFixed(1)}%`, color: realGrowth >= 0 ? "text-green-700" : "text-red-600" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-4 text-center ${s.highlight ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
                <p className={`text-xl font-bold ${s.color ?? (s.highlight ? "text-blue-700" : "text-gray-900")}`}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Year-by-year salary table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">{jobTitle} Salary History (Nominal vs Real)</h2>
            <p className="text-sm text-gray-400 mt-0.5">Real values expressed in 2020 dollars</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nominal Salary</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Real (2020 $)</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CPI Index</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Wage bar</th>
                </tr>
              </thead>
              <tbody>
                {ppRows.map(({ year, nominal, real, cpiIndex }) => (
                  <tr key={year} className={`border-b border-gray-50 last:border-0 ${year === CURRENT_YEAR ? "bg-blue-50/40" : ""}`}>
                    <td className="px-5 py-3 font-semibold text-gray-900">{year}{year === CURRENT_YEAR ? " *" : ""}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{fmtUSD(nominal)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${real < salary2020 ? "text-red-600" : "text-green-700"}`}>
                      {fmtUSD(real)}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">{cpiIndex.toFixed(3)}</td>
                    <td className="px-5 py-3 w-32">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct(nominal, maxSalary)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 px-5 py-3">
            * 2025 figures are current BLS OEWS estimates. Historical years back-calculated using occupation wage growth trend.
          </p>
        </div>

        {/* Inflation gap */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">The Inflation Gap</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Wage growth (2020–2025)</span>
                <span className="font-semibold text-blue-700">+{nominalGrowthTotal.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, nominalGrowthTotal)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">CPI inflation (2020–2025)</span>
                <span className="font-semibold text-amber-700">+{cpiGrowthTotal.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, cpiGrowthTotal)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Rent increase in {cityTitle} (2020–2025)</span>
                <span className="font-semibold text-red-600">+{rentGrowthTotal.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, rentGrowthTotal)}%` }} />
              </div>
            </div>
          </div>

          {/* Salary needed */}
          <div className={`mt-5 rounded-xl p-4 border ${surplusDeficit >= 0 ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"}`}>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              What salary do you need in 2025 to match your 2020 standard of living?
            </p>
            <p className="text-2xl font-bold text-gray-900">{fmtUSD(salaryNeeded)}</p>
            <p className={`text-sm mt-1 ${surplusDeficit >= 0 ? "text-green-700" : "text-amber-700"}`}>
              The 2025 median {jobTitle} salary of {fmtUSD(salary2025)} is{" "}
              {surplusDeficit >= 0
                ? `${fmtUSD(surplusDeficit)} above what's needed to maintain 2020 purchasing power.`
                : `${fmtUSD(Math.abs(surplusDeficit))} below what's needed to maintain 2020 purchasing power.`}
            </p>
          </div>
        </div>

        {/* Rent history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Rent Growth in {cityTitle}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Estimated 1BR monthly rent vs {jobTitle} salary</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">1BR Rent/mo</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Annual Rent</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">% of Gross Salary</th>
                </tr>
              </thead>
              <tbody>
                {rentHistory.map(({ year, rent: r }, i) => {
                  const yearlySalary = salaryHistory[i].salary;
                  const rentRatio = (r * 12 / yearlySalary) * 100;
                  return (
                    <tr key={year} className={`border-b border-gray-50 last:border-0 ${year === CURRENT_YEAR ? "bg-blue-50/40" : ""}`}>
                      <td className="px-5 py-3 font-semibold text-gray-900">{year}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{fmtUSD(r)}/mo</td>
                      <td className="px-5 py-3 text-right text-gray-700">{fmtUSD(r * 12)}</td>
                      <td className={`px-5 py-3 text-right font-medium ${rentRatio > 30 ? "text-red-600" : rentRatio > 25 ? "text-amber-600" : "text-green-700"}`}>
                        {rentRatio.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 px-5 py-3">
            Rule of thumb: rent above 30% of gross salary is considered cost-burdened.
          </p>
        </div>

        {/* Current after-tax snapshot */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Current Take-Home: {fmtUSD(salary2025)} {jobTitle} in {cityTitle}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Annual take-home",    value: fmtUSD(netToday.netSalary) },
              { label: "Monthly take-home",   value: fmtUSD(netMonthly) },
              { label: "Effective tax rate",  value: `${netToday.effectiveTaxRate}%` },
              ...(rent ? [
                { label: "1BR rent",          value: `${fmtUSD(rent["1br"])}/mo` },
                { label: "Rent-to-income",    value: `${rentToIncomeRatio?.toFixed(1)}%` },
                { label: "After rent (mo)",   value: fmtUSD(netMonthly - (rent["1br"])) },
              ] : []),
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <a
              href={`/job-salary/${job}/${city}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Full {jobTitle} Salary Analysis in {cityTitle} →
            </a>
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

        {/* Internal links */}
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
