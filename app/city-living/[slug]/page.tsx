import { notFound, permanentRedirect } from "next/navigation";

import type { Metadata } from "next";
import { CITY_COSTS, CityCost } from "@/data/city-costs";
import { getStatePrimaryCity } from "@/lib/stateCodeMap";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getRentByType } from "@/lib/data/rentData";
import { getCOLData } from "@/lib/data/costOfLiving";
import { getFoodCostBySize } from "@/lib/data/foodData";
import { generateSalaryIntelligence } from "@/lib/intelligence/salaryIntelligence";

export const revalidate = 86400;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

// ── Curated salary points (common search queries) ────────────────────────────
const SEED_SALARIES = [
  40000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000,
  95000, 100000, 110000, 120000, 130000, 150000, 175000, 200000, 250000, 300000,
];

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}

function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

// ── generateStaticParams ─────────────────────────────────────────────────────
export function generateStaticParams() {
  const params: { slug: string }[] = [];
  const topCities = Object.values(CITY_COSTS)
    .flat()
    .sort((a, b) => b.seoWeight - a.seoWeight)
    .slice(0, 20);
  const topSalaries = SEED_SALARIES.slice(0, 8);
  for (const city of topCities) {
    const citySlug = slugifyCity(city.city);
    for (const salary of topSalaries) {
      params.push({ slug: `is-${salary}-enough-in-${citySlug}` });
    }
  }
  return params;
}

// ── Verdict helpers ───────────────────────────────────────────────────────────
function getVerdict(disposable: number) {
  if (disposable < -500)  return "Not Recommended";
  if (disposable < 0)     return "Very Tight";
  if (disposable < 500)   return "Manageable";
  if (disposable < 1500)  return "Comfortable";
  if (disposable < 3000)  return "Very Comfortable";
  return "Excellent";
}

function verdictStyle(verdict: string): { bg: string; text: string; border: string } {
  switch (verdict) {
    case "Not Recommended": return { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" };
    case "Very Tight":      return { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" };
    case "Manageable":      return { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200" };
    case "Comfortable":     return { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200" };
    case "Very Comfortable":return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    default:                return { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" };
  }
}

function rentRatioLabel(ratio: number): { label: string; color: string } {
  if (ratio < 0.25) return { label: "Comfortable (< 25%)",          color: "text-green-700" };
  if (ratio < 0.35) return { label: "Manageable (25–35%)",           color: "text-yellow-700" };
  if (ratio < 0.50) return { label: "Financial pressure (35–50%)",   color: "text-orange-700" };
  return             { label: "Unaffordable (> 50%)",                 color: "text-red-700" };
}

// ── Resolve city from slug ────────────────────────────────────────────────────
function findCity(citySlug: string): CityCost | undefined {
  for (const cities of Object.values(CITY_COSTS)) {
    const found = cities.find((c) => slugifyCity(c.city) === citySlug);
    if (found) return found;
  }
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-");
  const salary = Number(parts[1]);
  const citySlug = parts.slice(4).join("-");
  const city = findCity(citySlug);
  if (!city) return {};

  return {
    title: `Is ${fmtUSD(salary)} Enough to Live in ${city.city}? (2026)`,
    description: `See if a ${fmtUSD(salary)} salary is enough to live in ${city.city}, ${city.state}. After-tax take-home, rent, food, utilities, and lifestyle verdict.`,
    alternates: { canonical: `/city-living/${slug}` },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CityLivingPage({ params }: PageProps) {
  const { slug } = await params;
  const parts = slug.split("-");
  const salary = Number(parts[1]);
  const citySlug = parts.slice(4).join("-");

  if (!salary || !citySlug) return notFound();

  const city = findCity(citySlug);
  if (!city) {
    const primaryCity = getStatePrimaryCity(citySlug);
    if (primaryCity) permanentRedirect(`/city-living/is-${salary}-enough-in-${primaryCity}`);
    return notFound();
  }

  // ── Tax calculation (live, no file dependency) ──────────────────────────
  const taxResult = calculateNetSalary({
    salary,
    state: city.stateCode,
    filingStatus: "single",
    taxYear: 2026,
  });
  const monthlyTakeHome = taxResult.monthlyTakeHome;

  // ── Cost data — prefer new granular datasets, fall back to city-costs ────
  const rentAmt      = getRentByType(citySlug, "1br") ?? city.rent;
  const colData      = getCOLData(citySlug);
  const foodAmt      = getFoodCostBySize(citySlug, "single") ?? Math.round(city.other * 0.44);
  const transportAmt = colData?.transportMonthly ?? Math.round(city.other * 0.17);
  const utilitiesAmt = colData?.utilitiesMonthly ?? Math.round(city.other * 0.16);
  const healthAmt    = colData?.healthcareMonthly ?? Math.round(city.other * 0.20);
  const colIndex     = colData?.index ?? 1.0;

  const totalExpenses = rentAmt + foodAmt + transportAmt + utilitiesAmt + healthAmt;
  const disposable    = monthlyTakeHome - totalExpenses;
  const savingsPct    = Math.max(0, Math.round((disposable / monthlyTakeHome) * 100));

  const verdict = getVerdict(disposable);
  const vs      = verdictStyle(verdict);
  const rentRatio = (rentAmt * 12) / taxResult.netSalary;
  const rl        = rentRatioLabel(rentRatio);

  // ── Salary intelligence ──────────────────────────────────────────────────
  const intelligence = generateSalaryIntelligence({
    city:               city.city,
    state:              city.state,
    stateCode:          city.stateCode,
    salary,
    netSalary:          taxResult.netSalary,
    rent:               rentAmt,
    foodCost:           foodAmt,
    costOfLivingIndex:  colIndex,
    transportMonthly:   transportAmt,
    utilitiesMonthly:   utilitiesAmt,
    healthcareMonthly:  healthAmt,
    federalTax:         taxResult.federalTax,
    stateTax:           taxResult.stateTax,
    ficaTotal:          taxResult.fica.socialSecurity + taxResult.fica.medicare,
    totalTax:           taxResult.federalTax + taxResult.stateTax + taxResult.fica.socialSecurity + taxResult.fica.medicare,
  });

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-8">

        {/* Hero */}
        <section className="bg-white rounded-2xl shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">City Living Analysis · 2026</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Is {fmtUSD(salary)} enough to live in {city.city}?
          </h1>
          <p className="mt-2 text-gray-600">
            Single adult · {city.state} · 2026 tax brackets
          </p>

          <div className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${vs.bg} ${vs.border}`}>
            <span className="text-sm text-gray-600">Verdict:</span>
            <span className={`font-bold text-lg ${vs.text}`}>{verdict}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Monthly take-home",   value: fmtUSD(monthlyTakeHome), bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
              { label: "Monthly expenses",     value: fmtUSD(totalExpenses),   bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700" },
              { label: "Monthly surplus",      value: fmtUSD(disposable),      bg: "bg-blue-50",   border: "border-blue-200",   text: disposable >= 0 ? "text-blue-700" : "text-red-700" },
              { label: "Effective tax rate",   value: `${taxResult.effectiveTaxRate}%`,  bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
              { label: "Savings potential",    value: `~${savingsPct}%`,       bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700" },
              { label: "Cost-of-living index", value: `${colIndex.toFixed(2)}×`, bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700" },
            ].map(({ label, value, bg, border, text }) => (
              <div key={label} className={`rounded-xl border p-3 ${bg} ${border}`}>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className={`text-xl font-bold ${text}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tax breakdown */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax breakdown</h2>
          <div className="divide-y text-sm text-gray-700">
            {[
              { label: "Gross salary",        value: fmtUSD(taxResult.grossSalary),    color: "" },
              { label: "Federal income tax",   value: `− ${fmtUSD(taxResult.federalTax)}`,  color: "text-blue-700" },
              { label: "State income tax",     value: `− ${fmtUSD(taxResult.stateTax)}`,    color: "text-orange-700" },
              { label: "Social Security",      value: `− ${fmtUSD(taxResult.fica.socialSecurity)}`, color: "text-purple-700" },
              { label: "Medicare",             value: `− ${fmtUSD(taxResult.fica.medicare)}`,        color: "text-purple-700" },
              { label: "Annual take-home",     value: fmtUSD(taxResult.netSalary),     color: "text-green-700 font-semibold" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between py-2">
                <span>{label}</span>
                <span className={color}>{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Granular cost breakdown */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Monthly living costs in {city.city}</h2>
          <p className="text-xs text-gray-400 mb-4">
            Rent: HUD FMR 2026 · Food: USDA low-cost plan × COL index · Transport/Utilities/Healthcare: BLS CES × COL index
          </p>

          <div className="space-y-3">
            {[
              { label: "Rent (1-bedroom)",      value: rentAmt,      pct: rentAmt / totalExpenses,      color: "bg-red-400" },
              { label: "Food",                   value: foodAmt,      pct: foodAmt / totalExpenses,      color: "bg-orange-400" },
              { label: "Transportation",         value: transportAmt, pct: transportAmt / totalExpenses, color: "bg-yellow-400" },
              { label: "Utilities",              value: utilitiesAmt, pct: utilitiesAmt / totalExpenses, color: "bg-blue-400" },
              { label: "Healthcare (est.)",      value: healthAmt,    pct: healthAmt / totalExpenses,    color: "bg-purple-400" },
            ].map(({ label, value, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{label}</span>
                  <span className="font-medium text-gray-900">{fmtUSD(value)} <span className="text-gray-400 font-normal">({(pct * 100).toFixed(0)}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between text-sm font-semibold text-gray-800">
            <span>Total monthly expenses</span>
            <span>{fmtUSD(totalExpenses)}</span>
          </div>
        </section>

        {/* Housing affordability */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Housing affordability</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              Rent would consume{" "}
              <span className="font-semibold">{(rentRatio * 100).toFixed(1)}%</span> of take-home income.{" "}
              <span className={`font-medium ${rl.color}`}>{rl.label}</span>
            </p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {(["studio", "1br", "2br", "family"] as const).map((t) => {
                const r = getRentByType(citySlug, t) ?? null;
                return r ? (
                  <div key={t} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      {t === "family" ? "3–4 BR" : t === "1br" ? "1 BR" : t === "2br" ? "2 BR" : "Studio"}
                    </p>
                    <p className="font-semibold text-gray-900">{fmtUSD(r)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/month</p>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </section>

        {/* Salary Intelligence */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Salary Intelligence</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              intelligence.salaryQuality === "Excellent salary"       ? "bg-emerald-100 text-emerald-700" :
              intelligence.salaryQuality === "Good salary"            ? "bg-green-100 text-green-700" :
              intelligence.salaryQuality === "Moderate salary"        ? "bg-yellow-100 text-yellow-700" :
              intelligence.salaryQuality === "Below comfortable level"? "bg-orange-100 text-orange-700" :
                                                                        "bg-red-100 text-red-700"
            }`}>
              {intelligence.salaryQuality}
            </span>
          </div>

          {/* Quality explanation */}
          <p className="text-sm text-gray-700 leading-relaxed">{intelligence.qualityExplanation}</p>

          {/* Living comfort */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Lifestyle Assessment</p>
            <p className="text-sm text-gray-700 leading-relaxed">{intelligence.livingComfortText}</p>
          </div>

          {/* Purchasing power */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Purchasing Power</p>
            <p className="text-sm text-gray-700 leading-relaxed">{intelligence.purchasingPowerText}</p>
          </div>

          {/* State benchmark */}
          {intelligence.stateBenchmark && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">State &amp; National Benchmark</p>
              <p className="text-sm text-gray-700 leading-relaxed">{intelligence.stateBenchmark.insight}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">State individual median</p>
                  <p className="font-semibold text-gray-800">${intelligence.stateBenchmark.stateMedianIndividual.toLocaleString()}</p>
                  <p className={`text-xs font-medium ${intelligence.stateBenchmark.vsIndividualPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {intelligence.stateBenchmark.vsIndividualPct >= 0 ? "+" : ""}{intelligence.stateBenchmark.vsIndividualPct}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">State household median</p>
                  <p className="font-semibold text-gray-800">${intelligence.stateBenchmark.stateMedianHousehold.toLocaleString()}</p>
                  <p className={`text-xs font-medium ${intelligence.stateBenchmark.vsHouseholdPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {intelligence.stateBenchmark.vsHouseholdPct >= 0 ? "+" : ""}{intelligence.stateBenchmark.vsHouseholdPct}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Minimum comfortable salary */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-xs text-gray-500">Minimum comfortable salary in {city.city}</p>
              <p className="text-2xl font-bold text-gray-900">{fmtUSD(intelligence.minimumComfortableSalary)}</p>
            </div>
            <a href={`/comfortable-salary/${citySlug}`} className="text-xs text-blue-600 hover:underline font-medium">
              See all scenarios →
            </a>
          </div>
        </section>

        {/* Related links */}
        <section className="border-t pt-6 text-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Related salary insights</h3>
          <ul className="space-y-2 text-blue-600">
            <li>
              <a href={`/salary/${salary}-${city.stateCode.toLowerCase()}-2026`} className="hover:underline">
                {fmtUSD(salary)} salary after tax in {city.state} →
              </a>
            </li>
            <li>
              <a href={`/rankings/${salary}`} className="hover:underline">
                Cities where {fmtUSD(salary)} goes furthest →
              </a>
            </li>
            <li>
              <a href={`/best-cities/${city.state.toLowerCase().replace(/\s+/g, "-")}/${salary}`} className="hover:underline">
                Best cities in {city.state} for a {fmtUSD(salary)} salary →
              </a>
            </li>
            <li>
              <a href={`/salary-guides/${salary}/${city.state.toLowerCase().replace(/\s+/g, "-")}`} className="hover:underline">
                {fmtUSD(salary)} salary guide for {city.state} →
              </a>
            </li>
            <li>
              <a href={`/comfortable-salary/${citySlug}`} className="hover:underline">
                What salary do you need to live comfortably in {city.city}? →
              </a>
            </li>
            <li>
              <a href="/calculator" className="hover:underline">
                Try the full salary calculator →
              </a>
            </li>
          </ul>
        </section>

      </div>
    </main>
  );
}
