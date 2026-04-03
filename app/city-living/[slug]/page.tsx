import { notFound, permanentRedirect } from "next/navigation";

import type { Metadata } from "next";
import { CITY_COSTS, CityCost } from "@/data/city-costs";
import { getStatePrimaryCity } from "@/lib/stateCodeMap";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getRentByType } from "@/lib/data/rentData";
import { getCOLData } from "@/lib/data/costOfLiving";
import { getFoodCostBySize } from "@/lib/data/foodData";
import { generateSalaryIntelligence } from "@/lib/intelligence/salaryIntelligence";

export const revalidate = 604800;
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

function fmtK(n: number): string {
  return `$${Math.round(n / 1000)}K`;
}

function pickVariant(salary: number, city: string, count: number): number {
  const hash = city.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (Math.floor(salary / 1000) + hash) % count;
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

  const net = calculateNetSalary({ salary, state: city.stateCode, filingStatus: "single", taxYear: 2026 });
  const rent = getRentByType(citySlug, "1br") ?? city.rent;
  const k = fmtK(salary);
  const v = pickVariant(salary, citySlug, 6);

  const titles = [
    `${k} in ${city.city} (2026): ${fmtUSD(net.monthlyTakeHome)}/mo Take-Home — Rent Reality`,
    `${k} After Tax in ${city.city}: ${fmtUSD(net.monthlyTakeHome)}/mo — Afford Rent? (2026)`,
    `Living on ${k} in ${city.city}? ${fmtUSD(net.monthlyTakeHome)}/mo After Tax — Real Costs`,
    `${k} in ${city.city} (2026): ${fmtUSD(net.monthlyTakeHome)}/mo — Full Cost Breakdown`,
    `${fmtUSD(net.monthlyTakeHome)}/mo on ${k} in ${city.city} — Lifestyle Verdict (2026)`,
    `${k} in ${city.city}: ${fmtUSD(net.monthlyTakeHome)}/mo After Tax — Savings Reality`,
  ];

  const descs = [
    `Take home ${fmtUSD(net.monthlyTakeHome)}/month on ${k} in ${city.city}. Rent runs ~${fmtUSD(rent)}/mo — see what's left for food, transport & savings. See full breakdown.`,
    `${k} in ${city.city} nets ${fmtUSD(net.monthlyTakeHome)}/month after tax. With ~${fmtUSD(rent)}/mo rent, can you actually save? Get the full cost breakdown and lifestyle verdict.`,
    `After tax, ${k} in ${city.city} = ${fmtUSD(net.monthlyTakeHome)}/month. Pay ~${fmtUSD(rent)} rent — see exactly what's left for food, transport & savings. See full breakdown.`,
    `${fmtUSD(net.monthlyTakeHome)}/month take-home on ${k} in ${city.city}. Rent is ~${fmtUSD(rent)}/mo. See the full budget breakdown and lifestyle verdict for 2026.`,
    `Your ${k} in ${city.city} = ${fmtUSD(net.monthlyTakeHome)}/month after tax. With ~${fmtUSD(rent)} rent, here's your full budget and savings reality. See full breakdown.`,
    `${fmtUSD(net.monthlyTakeHome)}/mo after tax on ${k} in ${city.city}. Rent averages ~${fmtUSD(rent)}/mo — find out if this salary covers your lifestyle. Full breakdown →`,
  ];

  return {
    title: titles[v],
    description: descs[v],
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

  // ── Enhancement sections data ─────────────────────────────────────────────
  const nonRentExpenses = totalExpenses - rentAmt;

  // What-if scenarios
  const roommateRent = Math.round(rentAmt * 0.6);
  const roommateGain = rentAmt - roommateRent;
  const premiumRent = Math.round(rentAmt * 1.35);
  const premiumLoss = premiumRent - rentAmt;
  const premiumRentRatioPct = Math.round((premiumRent / monthlyTakeHome) * 100);

  // Salary comparison (-20%, current, +20%)
  const salary20Up = Math.round(salary * 1.2);
  const salary20Down = Math.round(salary * 0.8);
  const net20Up = calculateNetSalary({ salary: salary20Up, state: city.stateCode, filingStatus: "single", taxYear: 2026 });
  const net20Down = calculateNetSalary({ salary: salary20Down, state: city.stateCode, filingStatus: "single", taxYear: 2026 });
  const disposable20Up = net20Up.monthlyTakeHome - totalExpenses;
  const disposable20Down = net20Down.monthlyTakeHome - totalExpenses;
  const gain20Up = net20Up.monthlyTakeHome - monthlyTakeHome;

  // City comparison
  const allCityList = Object.values(CITY_COSTS).flat().filter((c) => c.city !== city.city && c.seoWeight >= 3);
  const cheapComp = [...allCityList].filter((c) => c.rent < rentAmt).sort((a, b) => b.rent - a.rent)[0];
  const expComp   = [...allCityList].filter((c) => c.rent > rentAmt).sort((a, b) => a.rent - b.rent)[0];
  const cheapCompNet = cheapComp ? calculateNetSalary({ salary, state: cheapComp.stateCode, filingStatus: "single", taxYear: 2026 }) : null;
  const expCompNet   = expComp   ? calculateNetSalary({ salary, state: expComp.stateCode,   filingStatus: "single", taxYear: 2026 }) : null;
  const cheapDelta = cheapCompNet ? (cheapCompNet.monthlyTakeHome - cheapComp.rent - nonRentExpenses) - disposable : 0;
  const expDelta   = expCompNet   ? (expCompNet.monthlyTakeHome   - expComp.rent   - nonRentExpenses) - disposable : 0;

  // Decision guide
  const comfortSalary  = Math.round((rentAmt / 0.25) * 12 / (1 - taxResult.effectiveTaxRate / 100));
  const idealSalaryHigh = Math.round(comfortSalary * 1.3);
  const annualRentRatioPct = Math.round(rentRatio * 100);

  // Expanded FAQ
  const expandedFaqs = [
    {
      q: `Can I live comfortably on ${fmtK(salary)} in ${city.city}?`,
      a: `Your monthly surplus after all expenses is ${fmtUSD(disposable)} — verdict: ${verdict}. ${disposable >= 1000 ? `You have solid breathing room for savings and discretionary spending.` : disposable >= 0 ? `It's workable, but there's little margin for unexpected costs.` : `Expenses exceed take-home; a higher salary or lower rent is needed.`}`,
    },
    {
      q: `How much is ${fmtK(salary)} after taxes in ${city.state}?`,
      a: `In ${city.state}, ${fmtK(salary)} yields ${fmtUSD(taxResult.netSalary)}/year after federal and state taxes plus FICA — that's ${fmtUSD(monthlyTakeHome)}/month at a ${taxResult.effectiveTaxRate}% effective rate.`,
    },
    {
      q: `What rent can I afford on ${fmtK(salary)} in ${city.city}?`,
      a: `Using the 25%-of-take-home rule, your comfortable rent ceiling is ${fmtUSD(Math.round(monthlyTakeHome * 0.25))}/mo. ${city.city}'s average 1BR is ${fmtUSD(rentAmt)}/mo, consuming ${annualRentRatioPct}% of your annual take-home.`,
    },
    {
      q: `How much can I save per month on ${fmtK(salary)} in ${city.city}?`,
      a: `After rent and core expenses, your monthly surplus is ${fmtUSD(Math.max(0, disposable))}. A realistic savings target is ${fmtUSD(Math.max(0, Math.round(disposable * 0.6)))}–${fmtUSD(Math.max(0, Math.round(disposable * 0.85)))}/mo, keeping a buffer for irregular costs.`,
    },
    {
      q: `Is ${city.city} expensive to live in?`,
      a: `${city.city} has a cost-of-living index of ${colIndex.toFixed(2)} — ${colIndex > 1 ? `${Math.round((colIndex - 1) * 100)}% above the national average` : `${Math.round((1 - colIndex) * 100)}% below the national average`}. Total monthly expenses for a single adult run ~${fmtUSD(totalExpenses)}, driven primarily by rent at ${fmtUSD(rentAmt)}/mo.`,
    },
    {
      q: `What salary do you need to live comfortably in ${city.city}?`,
      a: `To keep rent under 25% of take-home in ${city.city}, you need at least ${fmtUSD(comfortSalary)} gross. At ${fmtK(salary)}, your rent-to-income ratio is ${annualRentRatioPct}%, which is ${rentRatio <= 0.25 ? "within" : "above"} the comfort threshold.`,
    },
    {
      q: `How does ${fmtK(salary)} go further in other cities vs ${city.city}?`,
      a: `${cheapComp ? `In ${cheapComp.city}, the same salary yields ~${fmtUSD(Math.abs(cheapDelta))} ${cheapDelta >= 0 ? "more" : "less"} in monthly surplus due to ${cheapDelta >= 0 ? "lower rent and comparable taxes" : "higher state taxes offsetting cheaper rent"}.` : `${city.city} is already below average in rent for its tier.`} Location arbitrage can meaningfully shift take-home purchasing power.`,
    },
    {
      q: `What happens to my budget if rent goes up in ${city.city}?`,
      a: `If rent rises 35% to ${fmtUSD(premiumRent)}/mo, it would consume ${premiumRentRatioPct}% of your take-home — ${premiumRentRatioPct > 35 ? "pushing you into financial pressure territory" : "still within manageable range"}. That would cut your monthly surplus by ${fmtUSD(premiumLoss)}.`,
    },
    {
      q: `Is ${fmtK(salary)} above or below the ${city.state} median?`,
      a: `${intelligence.stateBenchmark ? `The ${city.state} individual median is ~$${intelligence.stateBenchmark.stateMedianIndividual.toLocaleString()}. ${fmtK(salary)} is ${intelligence.stateBenchmark.vsIndividualPct >= 0 ? `${intelligence.stateBenchmark.vsIndividualPct}% above` : `${Math.abs(intelligence.stateBenchmark.vsIndividualPct)}% below`} that benchmark.` : `${fmtK(salary)} sits ${salary > 80000 ? "above" : "below"} the US median household income of ~$80,000.`} In ${city.city}'s cost environment, that translates to a "${verdict}" lifestyle.`,
    },
    {
      q: `What are the best tax strategies for a ${fmtK(salary)} salary?`,
      a: `At ${fmtK(salary)}, the highest-impact moves are: 401(k) contributions up to $23,500 (2026 limit), HSA at $4,300 single/$8,550 family, and — if applicable — mortgage interest or student loan deductions. Maxing a 401(k) alone can reduce your tax bill by $4,000–$8,000.`,
    },
  ];

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

        {/* What-If Scenarios */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">What-If Scenarios</h2>
          <p className="text-sm text-gray-500 mb-5">How small changes shift your monthly surplus</p>
          <div className="space-y-4">
            {[
              {
                label: "Shared Housing / Roommate",
                change: `Rent drops to ${fmtUSD(roommateRent)}/mo`,
                impact: `+${fmtUSD(roommateGain)}/mo freed up`,
                insight: `Splitting rent saves ${fmtUSD(roommateGain * 12)}/yr — enough to fund a full Roth IRA contribution.`,
                positive: true,
              },
              {
                label: "20% Salary Increase",
                change: `Take-home rises to ${fmtUSD(net20Up.monthlyTakeHome)}/mo`,
                impact: `+${fmtUSD(gain20Up)}/mo net gain`,
                insight: `A raise to ${fmtUSD(salary20Up)} adds ${fmtUSD(gain20Up)}/mo after taxes — less than the gross increase due to higher bracket.`,
                positive: true,
              },
              {
                label: "Premium / Downtown Apartment",
                change: `Rent rises to ${fmtUSD(premiumRent)}/mo`,
                impact: `-${fmtUSD(premiumLoss)}/mo less available`,
                insight: `Upgrading pushes rent-to-income to ${premiumRentRatioPct}% — ${premiumRentRatioPct > 35 ? "above the financial pressure threshold" : "still within manageable range"}.`,
                positive: false,
              },
            ].map((s) => (
              <div key={s.label} className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.change}</p>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{s.insight}</p>
                </div>
                <span className={`shrink-0 self-start text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${s.positive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {s.impact}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Inline City Comparison */}
        {cheapComp && expComp && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">How {city.city} Stacks Up</h2>
            <p className="text-sm text-gray-500 mb-5">Monthly surplus on {fmtK(salary)} vs. comparable cities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-medium text-green-600 mb-1">More Affordable</p>
                <p className="text-base font-bold text-gray-900">{cheapComp.city}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cheapComp.state} · Rent {fmtUSD(cheapComp.rent)}/mo</p>
                <p className={`text-sm font-semibold mt-2 ${cheapDelta >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {cheapDelta >= 0 ? `+${fmtUSD(cheapDelta)}` : `-${fmtUSD(Math.abs(cheapDelta))}`}/mo vs {city.city}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {cheapDelta >= 0 ? "Lower rent more than offsets any take-home difference." : "State taxes reduce take-home enough to negate the rent savings."}
                </p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-medium text-red-600 mb-1">More Expensive</p>
                <p className="text-base font-bold text-gray-900">{expComp.city}</p>
                <p className="text-xs text-gray-500 mt-0.5">{expComp.state} · Rent {fmtUSD(expComp.rent)}/mo</p>
                <p className={`text-sm font-semibold mt-2 ${expDelta >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {expDelta >= 0 ? `+${fmtUSD(expDelta)}` : `-${fmtUSD(Math.abs(expDelta))}`}/mo vs {city.city}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {expDelta < 0 ? `Higher rent erodes your surplus by ${fmtUSD(Math.abs(expDelta))}/mo.` : "Higher take-home from lower taxes outpaces the rent increase."}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
              <span className="font-medium">Takeaway: </span>
              {cheapDelta > 0
                ? `Moving to ${cheapComp.city} would free up ${fmtUSD(cheapDelta)}/mo — ${fmtUSD(cheapDelta * 12)}/yr — at the same salary.`
                : `${city.city} holds its own; tax differences offset most of the rent advantage elsewhere.`}
            </p>
          </section>
        )}

        {/* Decision Guide */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Should You Take {fmtK(salary)} in {city.city}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-3">Good fit if...</p>
              <ul className="space-y-2">
                {[
                  rentRatio <= 0.28 ? `Rent at ${annualRentRatioPct}% of take-home stays under the 28% threshold` : `You can secure shared housing to bring rent under ${fmtUSD(Math.round(monthlyTakeHome * 0.25))}/mo`,
                  disposable >= 800 ? `${fmtUSD(disposable)}/mo surplus supports steady savings and emergencies` : `Cutting discretionary spend can push monthly savings positive`,
                  colIndex <= 1.1 ? `COL index of ${colIndex.toFixed(2)} means your dollar goes further than in most premium markets` : `Your industry pays a ${city.city} premium that justifies the higher cost`,
                ].map((pt) => (
                  <li key={pt} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold shrink-0">✓</span>{pt}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700 mb-3">Risky if...</p>
              <ul className="space-y-2">
                {[
                  rentRatio > 0.35 ? `Rent at ${annualRentRatioPct}% of take-home leaves thin margin for emergencies` : `Any rent hike above ${fmtUSD(Math.round(monthlyTakeHome * 0.3))}/mo will create financial strain`,
                  disposable < 500 ? `Surplus under ${fmtUSD(Math.max(0, disposable))} makes it hard to build a 3-month emergency fund` : `Job loss would deplete savings within ${Math.max(1, Math.round((monthlyTakeHome * 3) / Math.max(1, disposable)))} months without income`,
                  colIndex > 1.15 ? `COL of ${colIndex.toFixed(2)} means inflation erodes purchasing power faster here` : `Rising rents in ${city.city} may outpace salary growth over time`,
                ].map((pt) => (
                  <li key={pt} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-red-500 font-bold shrink-0">✗</span>{pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Ideal Salary Range for {city.city}</p>
              <p className="text-lg font-bold text-gray-900">{fmtUSD(comfortSalary)} – {fmtUSD(idealSalaryHigh)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Keeps rent under 25% with meaningful savings headroom</p>
            </div>
            <div className={`rounded-xl p-4 ${verdict === "Excellent" || verdict === "Very Comfortable" ? "bg-green-50" : verdict === "Comfortable" || verdict === "Manageable" ? "bg-yellow-50" : "bg-red-50"}`}>
              <p className={`text-xs font-medium mb-1 ${verdict === "Excellent" || verdict === "Very Comfortable" ? "text-green-700" : verdict === "Comfortable" || verdict === "Manageable" ? "text-yellow-700" : "text-red-700"}`}>Final Verdict</p>
              <p className="text-sm text-gray-800 font-medium leading-snug">
                {disposable >= 1500 ? `${fmtK(salary)} is a strong salary for ${city.city} — prioritize maxing tax-advantaged accounts before lifestyle upgrades.` : disposable >= 0 ? `${fmtK(salary)} covers the basics in ${city.city} — a 15–20% raise would meaningfully improve financial flexibility.` : `${fmtK(salary)} falls short in ${city.city} — consider a roommate, remote work in a cheaper city, or income growth.`}
              </p>
            </div>
          </div>
        </section>

        {/* Salary Comparison */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Salary Comparison in {city.city}</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: fmtUSD(salary20Down), tag: "−20%", takeHome: net20Down.monthlyTakeHome, surplus: disposable20Down, rate: net20Down.effectiveTaxRate, dim: true },
              { label: fmtUSD(salary),       tag: "Current", takeHome: monthlyTakeHome, surplus: disposable, rate: taxResult.effectiveTaxRate, dim: false },
              { label: fmtUSD(salary20Up),   tag: "+20%", takeHome: net20Up.monthlyTakeHome, surplus: disposable20Up, rate: net20Up.effectiveTaxRate, dim: true },
            ].map((col) => (
              <div key={col.tag} className={`rounded-xl p-4 border text-center ${col.dim ? "bg-gray-50 border-gray-100" : "bg-blue-50 border-blue-200 ring-2 ring-blue-100"}`}>
                <p className={`text-xs font-semibold mb-1 ${col.dim ? "text-gray-500" : "text-blue-600"}`}>{col.tag}</p>
                <p className="text-sm font-bold text-gray-900">{col.label}</p>
                <div className="mt-3 space-y-1.5 text-xs text-left">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Take-home</span>
                    <span className="font-medium text-gray-800">{fmtUSD(col.takeHome)}/mo</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Surplus</span>
                    <span className={`font-semibold ${col.surplus >= 0 ? "text-green-700" : "text-red-700"}`}>{col.surplus >= 0 ? fmtUSD(col.surplus) : `-${fmtUSD(Math.abs(col.surplus))}`}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Tax rate</span>
                    <span className="font-medium text-gray-800">{col.rate}%</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className={`text-xs font-medium ${col.surplus >= 1500 ? "text-green-700" : col.surplus >= 0 ? "text-yellow-700" : "text-red-700"}`}>
                      {col.surplus >= 1500 ? "Very Comfortable" : col.surplus >= 500 ? "Comfortable" : col.surplus >= 0 ? "Manageable" : "Tight"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Expanded FAQ */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">More Questions Answered</h2>
          <div className="space-y-5">
            {expandedFaqs.map((f) => (
              <div key={f.q} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
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
