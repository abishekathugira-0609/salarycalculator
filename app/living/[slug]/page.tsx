import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { CITY_COSTS, type CityCost } from "@/data/city-costs";
import { STATE_CODE_MAP } from "@/lib/stateCodeMap";
import { getCOLData } from "@/lib/data/costOfLiving";
import { getRentByType } from "@/lib/data/rentData";
import { getFoodCostBySize } from "@/lib/data/foodData";
import { generateSalaryIntelligence } from "@/lib/intelligence/salaryIntelligence";
import { getNearbySalaries, getOtherStates } from "@/lib/links-gen";
import { salaryLink, livingStateLink, bestCitiesLink } from "@/lib/internal-links";
import DataSourceBadges from "@/components/DataSourceBadges";
import ReviewedBy from "@/components/ReviewedBy";
import BudgetPlanner from "@/components/BudgetPlanner";
import stateMediansJson from "@/data/state-medians.json";

export const revalidate = 86400;
export const dynamic = "force-static";
export const dynamicParams = true;

type PageProps = { params: Promise<{ slug: string }> };
type StateMedian = { name: string; medianHousehold: number; medianIndividual: number };

const stateMedians = stateMediansJson as Record<string, StateMedian>;
const cityCostsRecord = CITY_COSTS as Record<string, CityCost[]>;

const SEED_SALARIES = [40000, 50000, 60000, 75000, 100000, 125000, 150000, 200000, 250000, 300000];

function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}

function parseSlug(slug: string): { amount: number; stateSlug: string } | null {
  const match = slug.match(/^is-(\d+)-enough-in-(.+)$/);
  if (!match) return null;
  const amount = parseInt(match[1]);
  if (isNaN(amount) || amount <= 0) return null;
  return { amount, stateSlug: match[2] };
}

export function generateStaticParams() {
  return Object.keys(STATE_CODE_MAP).flatMap((state) =>
    SEED_SALARIES.map((salary) => ({ slug: `is-${salary}-enough-in-${state}` }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return {};
  const { amount, stateSlug } = parsed;
  const stateCode = STATE_CODE_MAP[stateSlug];
  if (!stateCode) return {};
  const stateName =
    stateMedians[stateCode]?.name ??
    stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `Is ${fmtUSD(amount)} Enough to Live in ${stateName}? (2026)`,
    description: `Find out if ${fmtUSD(amount)} is enough to live in ${stateName} in 2026. After-tax take-home, city-by-city cost breakdown, rent affordability, and lifestyle verdict. Real HUD and BLS data.`,
    alternates: { canonical: `/living/${slug}` },
  };
}

export default async function LivingPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return notFound();
  const { amount, stateSlug } = parsed;

  const stateCode = STATE_CODE_MAP[stateSlug];
  if (!stateCode) return notFound();

  const stateInfo = stateMedians[stateCode];
  const stateName =
    stateInfo?.name ?? stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Live tax calculation ──────────────────────────────────────────────────
  const taxResult = calculateNetSalary({
    salary: amount,
    state: stateCode,
    filingStatus: "single",
    taxYear: 2026,
  });
  const monthlyTakeHome = taxResult.monthlyTakeHome;

  // ── Per-city real cost data ───────────────────────────────────────────────
  const stateCities = cityCostsRecord[stateSlug] ?? [];

  const cityData = stateCities.slice(0, 6).map((city) => {
    const cs = slugifyCity(city.city);
    const rentAmt = getRentByType(cs, "1br") ?? city.rent;
    const colData = getCOLData(cs);
    const foodAmt = getFoodCostBySize(cs, "single") ?? Math.round(city.other * 0.44);
    const transportAmt = colData?.transportMonthly ?? Math.round(city.other * 0.17);
    const utilitiesAmt = colData?.utilitiesMonthly ?? Math.round(city.other * 0.16);
    const healthAmt = colData?.healthcareMonthly ?? Math.round(city.other * 0.23);
    const colIndex = colData?.index ?? 1.0;
    const totalExpenses = rentAmt + foodAmt + transportAmt + utilitiesAmt + healthAmt;
    const disposable = monthlyTakeHome - totalExpenses;
    const rentRatio = (rentAmt * 12) / taxResult.netSalary;
    const savingsPct = Math.max(0, Math.round((disposable / monthlyTakeHome) * 100));

    let verdict: string;
    let verdictBg: string;
    let verdictText: string;
    if (disposable < -500) {
      verdict = "Not recommended"; verdictBg = "bg-red-50"; verdictText = "text-red-600";
    } else if (disposable < 0) {
      verdict = "Very tight"; verdictBg = "bg-orange-50"; verdictText = "text-orange-600";
    } else if (disposable < 500) {
      verdict = "Manageable"; verdictBg = "bg-yellow-50"; verdictText = "text-yellow-600";
    } else if (disposable < 1500) {
      verdict = "Comfortable"; verdictBg = "bg-green-50"; verdictText = "text-green-600";
    } else {
      verdict = "Very comfortable"; verdictBg = "bg-emerald-50"; verdictText = "text-emerald-600";
    }

    let rentLabel: string;
    let rentLabelColor: string;
    if (rentRatio < 0.25) { rentLabel = "Affordable (< 25%)"; rentLabelColor = "text-green-600"; }
    else if (rentRatio < 0.35) { rentLabel = "Manageable (25–35%)"; rentLabelColor = "text-yellow-600"; }
    else if (rentRatio < 0.50) { rentLabel = "High (35–50%)"; rentLabelColor = "text-orange-600"; }
    else { rentLabel = "Unaffordable (> 50%)"; rentLabelColor = "text-red-600"; }

    return {
      ...city,
      citySlug: cs,
      rentAmt,
      foodAmt,
      transportAmt,
      utilitiesAmt,
      healthAmt,
      totalExpenses,
      disposable,
      rentRatio,
      colIndex,
      savingsPct,
      verdict,
      verdictBg,
      verdictText,
      rentLabel,
      rentLabelColor,
    };
  });

  // ── Statewide summary ─────────────────────────────────────────────────────
  const avgExpenses =
    cityData.length > 0
      ? Math.round(cityData.reduce((s, c) => s + c.totalExpenses, 0) / cityData.length)
      : 2500;
  const avgDisposable = monthlyTakeHome - avgExpenses;
  const avgSavingsPct = Math.max(0, Math.round((avgDisposable / monthlyTakeHome) * 100));

  let stateVerdict: string;
  let stateVerdictBg: string;
  let stateVerdictText: string;
  let stateVerdictBorder: string;
  if (avgDisposable < -500) {
    stateVerdict = "Not recommended"; stateVerdictBg = "bg-red-50";
    stateVerdictText = "text-red-700"; stateVerdictBorder = "border-red-200";
  } else if (avgDisposable < 0) {
    stateVerdict = "Very tight"; stateVerdictBg = "bg-orange-50";
    stateVerdictText = "text-orange-700"; stateVerdictBorder = "border-orange-200";
  } else if (avgDisposable < 500) {
    stateVerdict = "Manageable"; stateVerdictBg = "bg-yellow-50";
    stateVerdictText = "text-yellow-700"; stateVerdictBorder = "border-yellow-200";
  } else if (avgDisposable < 1500) {
    stateVerdict = "Comfortable"; stateVerdictBg = "bg-green-50";
    stateVerdictText = "text-green-700"; stateVerdictBorder = "border-green-200";
  } else {
    stateVerdict = "Very comfortable"; stateVerdictBg = "bg-emerald-50";
    stateVerdictText = "text-emerald-700"; stateVerdictBorder = "border-emerald-200";
  }

  // ── Salary intelligence (top city) ───────────────────────────────────────
  let salaryIntel = null;
  if (cityData.length > 0) {
    const top = cityData[0];
    try {
      salaryIntel = generateSalaryIntelligence({
        city: top.city,
        state: stateName,
        stateCode,
        salary: amount,
        netSalary: taxResult.netSalary,
        rent: top.rentAmt,
        foodCost: top.foodAmt,
        costOfLivingIndex: top.colIndex,
        transportMonthly: top.transportAmt,
        utilitiesMonthly: top.utilitiesAmt,
        healthcareMonthly: top.healthAmt,
        federalTax: taxResult.federalTax,
        stateTax: taxResult.stateTax,
        ficaTotal: taxResult.fica.total,
        totalTax: taxResult.totalTax,
      });
    } catch {
      salaryIntel = null;
    }
  }

  // vs. state medians
  const vsIndPct = stateInfo
    ? Math.round(((amount - stateInfo.medianIndividual) / stateInfo.medianIndividual) * 100)
    : null;

  const nearbySalaries = getNearbySalaries(amount);
  const otherStates = getOtherStates(stateSlug);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is ${fmtUSD(amount)} a good salary in ${stateName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${fmtUSD(amount)} in ${stateName} provides a monthly take-home of approximately ${fmtUSD(monthlyTakeHome)} after taxes. Across major ${stateName} cities, this salary is rated ${stateVerdict.toLowerCase()}, with an average monthly surplus of ${fmtUSD(avgDisposable)}.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the cost of living on ${fmtUSD(amount)} in ${stateName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The average monthly living cost across major ${stateName} cities is approximately ${fmtUSD(avgExpenses)} for a single adult (rent, food, transport, utilities, healthcare). On ${fmtUSD(amount)} take-home pay of ${fmtUSD(monthlyTakeHome)}/month, you would have roughly ${fmtUSD(avgDisposable)}/month remaining.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6 space-y-8">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <section className={`rounded-2xl border p-8 ${stateVerdictBg} ${stateVerdictBorder}`}>
            <p className="text-sm font-medium text-blue-600 mb-2">Living in {stateName} · 2026</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Is {fmtUSD(amount)} enough to live in {stateName}?
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              Single adult · {taxResult.state} · 2026 tax brackets · Real cost-of-living data
            </p>

            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white ${stateVerdictBorder}`}>
              <span className="text-sm text-gray-600">Statewide verdict:</span>
              <span className={`font-bold text-lg ${stateVerdictText}`}>{stateVerdict}</span>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Monthly take-home", value: fmtUSD(monthlyTakeHome), color: "text-green-700" },
                { label: "Avg monthly expenses", value: fmtUSD(avgExpenses), color: "text-red-700" },
                { label: "Avg monthly surplus", value: fmtUSD(avgDisposable), color: avgDisposable >= 0 ? "text-blue-700" : "text-red-700" },
                { label: "Savings potential", value: `~${avgSavingsPct}%`, color: "text-teal-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tax breakdown ─────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">After-tax take-home in {stateName}</h2>
            <div className="divide-y text-sm text-gray-700">
              {[
                { label: "Gross salary", value: fmtUSD(amount), color: "" },
                { label: "Federal income tax", value: `− ${fmtUSD(taxResult.federalTax)}`, color: "text-blue-700" },
                { label: "State income tax", value: `− ${fmtUSD(taxResult.stateTax)}`, color: "text-orange-700" },
                { label: "Social Security", value: `− ${fmtUSD(taxResult.fica.socialSecurity)}`, color: "text-purple-700" },
                { label: "Medicare", value: `− ${fmtUSD(taxResult.fica.medicare + taxResult.fica.additionalMedicare)}`, color: "text-purple-700" },
                { label: "Annual take-home", value: fmtUSD(taxResult.netSalary), color: "text-green-700 font-semibold" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between py-2.5">
                  <span>{label}</span>
                  <span className={color}>{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm text-gray-500">
              <span>Effective tax rate</span>
              <span className="font-semibold text-violet-700">{taxResult.effectiveTaxRate}%</span>
            </div>
          </section>

          {/* ── City-by-city breakdown ────────────────────────────────────── */}
          {cityData.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                How {fmtUSD(amount)} feels in {stateName} cities
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                Rent: HUD FMR 2026 · Food: USDA Low-Cost Plan × COL · Transport/Utilities/Healthcare: BLS CES × COL
              </p>

              <div className="space-y-5">
                {cityData.map((city) => (
                  <div
                    key={city.city}
                    className={`rounded-xl border p-4 ${city.verdictBg}`}
                  >
                    {/* City header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{city.city}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          COL index: <span className="font-medium">{city.colIndex.toFixed(2)}×</span> national avg
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${city.verdictText}`}>{city.verdict}</span>
                    </div>

                    {/* Expense breakdown bars */}
                    <div className="space-y-1.5 mb-3">
                      {[
                        { label: "Rent (1BR)", value: city.rentAmt, color: "bg-red-400" },
                        { label: "Food", value: city.foodAmt, color: "bg-orange-400" },
                        { label: "Transport", value: city.transportAmt, color: "bg-yellow-400" },
                        { label: "Utilities", value: city.utilitiesAmt, color: "bg-blue-400" },
                        { label: "Healthcare", value: city.healthAmt, color: "bg-purple-400" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          <span className="w-20 text-gray-600 shrink-0">{label}</span>
                          <div className="flex-1 h-1.5 bg-white bg-opacity-60 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color} rounded-full`}
                              style={{ width: `${Math.min(100, (value / monthlyTakeHome) * 100)}%` }}
                            />
                          </div>
                          <span className="text-gray-800 font-medium w-14 text-right">{fmtUSD(value)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Summary row */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm border-t border-white border-opacity-60 pt-3">
                      <div>
                        <span className="text-gray-500">Total: </span>
                        <span className="font-semibold text-gray-800">{fmtUSD(city.totalExpenses)}/mo</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Surplus: </span>
                        <span className={`font-semibold ${city.disposable >= 0 ? "text-green-700" : "text-red-600"}`}>
                          {fmtUSD(city.disposable)}/mo
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rent burden: </span>
                        <span className={`font-medium text-xs ${city.rentLabelColor}`}>
                          {(city.rentRatio * 100).toFixed(1)}% — {city.rentLabel}
                        </span>
                      </div>
                    </div>

                    {/* Link to city-specific page */}
                    <a
                      href={`/city-living/is-${amount}-enough-in-${city.citySlug}`}
                      className="mt-2 block text-xs text-blue-600 hover:underline font-medium"
                    >
                      Full {city.city} analysis →
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 50/30/20 Budget Planner ───────────────────────────────────── */}
          <BudgetPlanner netMonthly={monthlyTakeHome} />

          {/* ── Salary intelligence ───────────────────────────────────────── */}
          {salaryIntel && (
            <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">Salary Intelligence</h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    salaryIntel.salaryQuality === "Excellent salary"
                      ? "bg-emerald-100 text-emerald-700"
                      : salaryIntel.salaryQuality === "Good salary"
                      ? "bg-green-100 text-green-700"
                      : salaryIntel.salaryQuality === "Moderate salary"
                      ? "bg-yellow-100 text-yellow-700"
                      : salaryIntel.salaryQuality === "Below comfortable level"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {salaryIntel.salaryQuality} in {cityData[0]?.city}
                </span>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">{salaryIntel.qualityExplanation}</p>

              {/* Lifestyle score */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      salaryIntel.lifestyleScore >= 7 ? "bg-green-400" :
                      salaryIntel.lifestyleScore >= 5 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${(salaryIntel.lifestyleScore / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Lifestyle score: {salaryIntel.lifestyleScore}/10 ({salaryIntel.lifestyleLabel})
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                  Lifestyle Assessment
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{salaryIntel.livingComfortText}</p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                  Purchasing Power
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{salaryIntel.purchasingPowerText}</p>
              </div>

              {salaryIntel.stateBenchmark && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    State &amp; National Benchmark
                  </p>
                  <p className="text-sm text-gray-700 mb-3">{salaryIntel.stateBenchmark.insight}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">State individual median</p>
                      <p className="font-semibold text-gray-800">
                        {fmtUSD(salaryIntel.stateBenchmark.stateMedianIndividual)}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          salaryIntel.stateBenchmark.vsIndividualPct >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {salaryIntel.stateBenchmark.vsIndividualPct >= 0 ? "+" : ""}
                        {salaryIntel.stateBenchmark.vsIndividualPct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">State household median</p>
                      <p className="font-semibold text-gray-800">
                        {fmtUSD(salaryIntel.stateBenchmark.stateMedianHousehold)}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          salaryIntel.stateBenchmark.vsHouseholdPct >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {salaryIntel.stateBenchmark.vsHouseholdPct >= 0 ? "+" : ""}
                        {salaryIntel.stateBenchmark.vsHouseholdPct}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tax savings tips */}
              {salaryIntel.taxTips.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Tax reduction strategies
                  </p>
                  <div className="space-y-2">
                    {salaryIntel.taxTips.slice(0, 2).map((tip) => (
                      <div
                        key={tip.title}
                        className="border border-gray-100 rounded-lg px-3 py-2 bg-gray-50 text-xs text-gray-700"
                      >
                        <span className="font-medium text-gray-800">{tip.title}</span>
                        {" — "}
                        <span className="text-green-600 font-medium">{tip.estimatedSaving}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── vs. state median strip ────────────────────────────────────── */}
          {stateInfo && vsIndPct !== null && (
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {fmtUSD(amount)} vs. {stateName} income benchmarks
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">Individual median ({stateName})</p>
                  <p className="text-xl font-bold text-gray-900">{fmtUSD(stateInfo.medianIndividual)}</p>
                  <p className={`text-xs font-medium mt-1 ${vsIndPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {vsIndPct >= 0 ? "+" : ""}{vsIndPct}% vs. this salary
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">Household median ({stateName})</p>
                  <p className="text-xl font-bold text-gray-900">{fmtUSD(stateInfo.medianHousehold)}</p>
                  <p
                    className={`text-xs font-medium mt-1 ${
                      Math.round(((amount - stateInfo.medianHousehold) / stateInfo.medianHousehold) * 100) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.round(((amount - stateInfo.medianHousehold) / stateInfo.medianHousehold) * 100) >= 0
                      ? "+"
                      : ""}
                    {Math.round(((amount - stateInfo.medianHousehold) / stateInfo.medianHousehold) * 100)}% vs. this salary
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-400">Source: US Census Bureau ACS 2023</p>
            </section>
          )}

          {/* ── Related links ─────────────────────────────────────────────── */}
          <section className="text-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Related salary insights</h3>
            <ul className="space-y-2 text-blue-600">
              <li>
                <a href={salaryLink(amount, stateSlug, 2026)} className="hover:underline">
                  Full tax breakdown for {fmtUSD(amount)} in {stateName} →
                </a>
              </li>
              {nearbySalaries.map((s) => (
                <li key={s}>
                  <a href={livingStateLink(s, stateSlug)} className="hover:underline">
                    Is {fmtUSD(s)} enough in {stateName}? →
                  </a>
                </li>
              ))}
              <li>
                <a href={bestCitiesLink(stateSlug, amount)} className="hover:underline">
                  Best cities in {stateName} for {fmtUSD(amount)} →
                </a>
              </li>
              <li>
                <a href={`/${stateSlug}-salary-guide`} className="hover:underline">
                  {stateName} salary guide →
                </a>
              </li>
              {otherStates.slice(0, 3).map((s) => (
                <li key={s}>
                  <a href={livingStateLink(amount, s)} className="hover:underline">
                    Is {fmtUSD(amount)} enough in{" "}
                    {s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}? →
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Explore salary levels ─────────────────────────────────────── */}
          <section className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">
              Explore other salary levels in {stateName}
            </h3>
            <div className="flex flex-wrap gap-2">
              {SEED_SALARIES.map((s) => (
                <a
                  key={s}
                  href={livingStateLink(s, stateSlug)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    s === amount
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {fmtUSD(s)}
                </a>
              ))}
            </div>
          </section>

          {/* ── Trust signals ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReviewedBy />
            <DataSourceBadges sources={["irs", "hud", "col"]} />
          </div>

        </div>
      </main>
    </>
  );
}
