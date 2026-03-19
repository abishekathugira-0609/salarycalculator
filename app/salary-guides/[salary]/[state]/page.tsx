import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta, ALL_SALARY_BUCKETS } from "@/lib/seo";
import { fmtUSD, fmtCompact, toTitle, stateSlugToCode } from "@/lib/stateCodeMap";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getRentByType } from "@/lib/data/rentData";
import { getCOLData } from "@/lib/data/costOfLiving";
import { getFoodCostBySize } from "@/lib/data/foodData";
import { generateSalaryIntelligence } from "@/lib/intelligence/salaryIntelligence";
import { CITY_COSTS } from "@/data/city-costs";
import stateMedians from "@/data/state-medians.json";
import DataSourceBadges from "@/components/DataSourceBadges";
import ReviewedBy from "@/components/ReviewedBy";
import LastUpdated from "@/components/LastUpdated";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

type PageProps = { params: Promise<{ salary: string; state: string }> };

const STATE_SLUGS = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada",
  "new-hampshire","new-jersey","new-mexico","new-york","north-carolina",
  "north-dakota","ohio","oklahoma","oregon","pennsylvania","rhode-island",
  "south-carolina","south-dakota","tennessee","texas","utah","vermont",
  "virginia","washington","west-virginia","wisconsin","wyoming",
];

export function generateStaticParams() {
  const params = [];
  for (const s of ALL_SALARY_BUCKETS) {
    for (const state of STATE_SLUGS) {
      params.push({ salary: String(s), state });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { salary, state } = await params;
  const gross = Number(salary);
  const stateCode = stateSlugToCode(state);
  if (!stateCode) return {};
  const stateName = toTitle(state);
  return buildPageMeta({
    title: `Is ${fmtUSD(gross)} a Good Salary in ${stateName}? (2026 Guide)`,
    description: `Find out if ${fmtUSD(gross)} is a good salary in ${stateName}. See take-home pay after taxes, cost of living, rent affordability, savings potential, and how it compares to state and national medians.`,
    canonical: `/salary-guides/${salary}/${state}`,
  });
}

// ── Pick the representative city for a state (highest SEO weight) ─────────────
function getPrimaryCity(stateCode: string) {
  const entries = Object.values(CITY_COSTS)
    .flat()
    .filter((c) => c.stateCode === stateCode)
    .sort((a, b) => b.seoWeight - a.seoWeight);
  return entries[0] ?? null;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function SalaryGuideStatePage({ params }: PageProps) {
  const { salary, state } = await params;
  const gross = Number(salary);
  if (!gross) return notFound();

  const stateCode = stateSlugToCode(state);
  if (!stateCode) return notFound();

  const stateName = toTitle(state);
  const medians   = (stateMedians as Record<string, { name: string; medianHousehold: number; medianIndividual: number }>)[stateCode];

  // Primary city for cost data
  const primaryCity = getPrimaryCity(stateCode);
  const citySlug    = primaryCity
    ? primaryCity.city.toLowerCase().replace(/\s+/g, "-")
    : null;

  // Tax calculation
  const tax = calculateNetSalary({ salary: gross, state: stateCode, filingStatus: "single", taxYear: 2026 });

  // Cost data (use primary city if available)
  const colData      = citySlug ? getCOLData(citySlug) : null;
  const rentAmt      = (citySlug ? getRentByType(citySlug, "1br") : null) ?? (primaryCity?.rent ?? 1500);
  const foodAmt      = (citySlug ? getFoodCostBySize(citySlug, "single") : null) ?? 440;
  const transportAmt = colData?.transportMonthly ?? 175;
  const utilitiesAmt = colData?.utilitiesMonthly  ?? 165;
  const healthAmt    = colData?.healthcareMonthly  ?? 200;
  const colIndex     = colData?.index ?? 1.0;

  // Intelligence
  const intel = generateSalaryIntelligence({
    city:              primaryCity?.city ?? stateName,
    state:             stateName,
    stateCode,
    salary:            gross,
    netSalary:         tax.netSalary,
    rent:              rentAmt,
    foodCost:          foodAmt,
    costOfLivingIndex: colIndex,
    transportMonthly:  transportAmt,
    utilitiesMonthly:  utilitiesAmt,
    healthcareMonthly: healthAmt,
    federalTax:        tax.federalTax,
    stateTax:          tax.stateTax,
    ficaTotal:         tax.fica.total,
    totalTax:          tax.totalTax,
    filingStatus:      "single",
  });

  const totalMonthlyExpenses = rentAmt + foodAmt + transportAmt + utilitiesAmt + healthAmt;
  const monthlySurplus       = tax.monthlyTakeHome - totalMonthlyExpenses;

  // Nearby salary levels
  const allBuckets = ALL_SALARY_BUCKETS;
  const nearby = allBuckets.filter((s) => s !== gross).slice(0, 6);

  // State cities list for internal links
  const stateCities = Object.values(CITY_COSTS)
    .flat()
    .filter((c) => c.stateCode === stateCode)
    .sort((a, b) => b.seoWeight - a.seoWeight)
    .slice(0, 8);

  // FAQ schema
  const noTax = tax.stateTax === 0;
  const faqs = [
    {
      q: `Is ${fmtUSD(gross)} a good salary in ${stateName}?`,
      a: intel.qualityExplanation,
    },
    {
      q: `How much is ${fmtUSD(gross)} after taxes in ${stateName}?`,
      a: `After federal income tax (${fmtUSD(tax.federalTax)}), ${noTax ? "no state income tax" : `${stateName} state tax (${fmtUSD(tax.stateTax)})`}, and FICA (${fmtUSD(tax.fica.total)}), your annual take-home is ${fmtUSD(tax.netSalary)}, or ${fmtUSD(tax.monthlyTakeHome)}/month. Effective tax rate: ${tax.effectiveTaxRate}%.`,
    },
    {
      q: `Can you live comfortably on ${fmtUSD(gross)} in ${stateName}?`,
      a: intel.livingComfortText,
    },
    {
      q: `What is the minimum comfortable salary in ${primaryCity?.city ?? stateName}?`,
      a: `Based on rent, food, transport, utilities, and healthcare costs, a comfortable salary for a single adult in ${primaryCity?.city ?? stateName} is approximately ${fmtUSD(intel.minimumComfortableSalary)} — enough to keep expenses below 70% of take-home pay.`,
    },
    {
      q: `How does ${fmtUSD(gross)} compare to the ${stateName} median income?`,
      a: intel.stateBenchmark?.insight ?? `The ${stateName} median household income is approximately ${medians ? fmtUSD(medians.medianHousehold) : "unknown"}.`,
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: "Salary Guides", item: "https://know-your-pay.com/salary-guides" },
      { "@type": "ListItem", position: 3, name: fmtUSD(gross), item: `https://know-your-pay.com/salary-guides/${gross}` },
      { "@type": "ListItem", position: 4, name: stateName, item: `https://know-your-pay.com/salary-guides/${gross}/${state}` },
    ],
  };

  const qualityColors: Record<string, string> = {
    "Excellent salary":        "bg-emerald-50 border-emerald-200 text-emerald-700",
    "Good salary":             "bg-green-50 border-green-200 text-green-700",
    "Moderate salary":         "bg-yellow-50 border-yellow-200 text-yellow-700",
    "Below comfortable level": "bg-orange-50 border-orange-200 text-orange-700",
    "Financial pressure":      "bg-red-50 border-red-200 text-red-700",
  };
  const qColor = qualityColors[intel.salaryQuality] ?? qualityColors["Moderate salary"];

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

        {/* Hero */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Salary Guide · {stateName} · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Is {fmtUSD(gross)} a Good Salary in {stateName}?
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Single filer · 2026 IRS brackets · {noTax ? "No state income tax" : `${stateName} state tax included`}
          </p>

          <div className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold ${qColor}`}>
            {intel.salaryQuality}
            <span className="font-normal text-sm opacity-70">· Lifestyle Score {intel.lifestyleScore}/10</span>
          </div>

          <p className="mt-4 text-gray-600 leading-relaxed">{intel.qualityExplanation}</p>

          {/* Key stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Annual take-home",  value: fmtUSD(tax.netSalary),         sub: `${tax.effectiveTaxRate}% effective tax` },
              { label: "Monthly take-home", value: fmtUSD(tax.monthlyTakeHome),   sub: "after all taxes" },
              { label: "Monthly surplus",   value: fmtUSD(Math.max(0, monthlySurplus)), sub: monthlySurplus < 0 ? "deficit" : "after expenses" },
              { label: "Min. comfortable",  value: fmtUSD(intel.minimumComfortableSalary), sub: `for ${primaryCity?.city ?? stateName}` },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <LastUpdated />
          </div>
        </section>

        {/* Tax breakdown */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {fmtUSD(gross)} After Tax in {stateName}
          </h2>
          <div className="divide-y text-sm text-gray-700">
            {[
              { label: "Gross salary",       value: fmtUSD(gross),              note: "" },
              { label: "Federal income tax",  value: `− ${fmtUSD(tax.federalTax)}`,  note: `${((tax.federalTax/gross)*100).toFixed(1)}%` },
              { label: `${stateName} state tax`, value: noTax ? "−  $0" : `− ${fmtUSD(tax.stateTax)}`, note: noTax ? "no state tax" : `${((tax.stateTax/gross)*100).toFixed(1)}%` },
              { label: "Social Security",     value: `− ${fmtUSD(tax.fica.socialSecurity)}`, note: "6.2%" },
              { label: "Medicare",            value: `− ${fmtUSD(tax.fica.medicare)}`,        note: "1.45%" },
              { label: "Annual take-home",    value: fmtUSD(tax.netSalary),      note: "", bold: true },
            ].map(({ label, value, note, bold }) => (
              <div key={label} className={`flex justify-between items-center py-2.5 ${bold ? "font-semibold text-green-700 bg-green-50 -mx-6 px-6 rounded-b-2xl" : ""}`}>
                <span>{label}{note && <span className="ml-1.5 text-xs text-gray-400">({note})</span>}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-gray-500 pt-3 border-t border-gray-100">
            <div><span className="block font-semibold text-gray-800 text-sm">{fmtUSD(tax.monthlyTakeHome)}</span>Monthly</div>
            <div><span className="block font-semibold text-gray-800 text-sm">{fmtUSD(tax.biWeeklyTakeHome)}</span>Bi-weekly</div>
            <div><span className="block font-semibold text-gray-800 text-sm">{tax.effectiveTaxRate}%</span>Effective rate</div>
          </div>
        </section>

        {/* Living costs + insights */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">
            Monthly Living Costs in {primaryCity?.city ?? stateName}
          </h2>
          <p className="text-sm text-gray-500">
            Based on HUD Fair Market Rents, USDA food cost plans, and BLS consumer expenditure data.
          </p>

          <div className="space-y-3">
            {[
              { label: "Rent (1BR)",        value: rentAmt,      color: "bg-red-400" },
              { label: "Food",              value: foodAmt,      color: "bg-orange-400" },
              { label: "Transportation",    value: transportAmt, color: "bg-yellow-400" },
              { label: "Utilities",         value: utilitiesAmt, color: "bg-blue-400" },
              { label: "Healthcare (est.)", value: healthAmt,    color: "bg-purple-400" },
            ].map(({ label, value, color }) => {
              const pct = Math.round((value / totalMonthlyExpenses) * 100);
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{label}</span>
                    <span className="font-medium">{fmtUSD(value)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between font-semibold text-sm pt-3 border-t border-gray-100">
            <span>Total monthly expenses</span>
            <span>{fmtUSD(totalMonthlyExpenses)}</span>
          </div>
          <div className={`flex justify-between font-semibold text-sm pb-1 ${monthlySurplus >= 0 ? "text-green-700" : "text-red-700"}`}>
            <span>Monthly surplus</span>
            <span>{fmtUSD(monthlySurplus)}</span>
          </div>
        </section>

        {/* Intelligence insights */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Financial Intelligence</h2>

          {[
            { icon: "🏠", title: "Housing Affordability",  text: intel.affordabilityInsight },
            { icon: "💰", title: "Savings Potential",      text: intel.savingsInsight },
            { icon: "🗺️", title: "Purchasing Power",      text: intel.purchasingPowerText },
            { icon: "📊", title: "Tax Burden",             text: intel.taxInsight },
            { icon: "📈", title: "Salary Benchmarking",    text: intel.stateBenchmark?.insight ?? intel.salaryComparison },
            { icon: "🏡", title: "Living Comfort",         text: intel.livingComfortText },
          ].map(({ icon, title, text }) => (
            <div key={title} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <span className="text-xl mt-0.5 shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* State median comparison */}
        {medians && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {stateName} Income Benchmarks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Your salary",
                  value: fmtUSD(gross),
                  sub: "gross annual",
                  highlight: true,
                },
                {
                  label: `${stateName} individual median`,
                  value: fmtUSD(medians.medianIndividual),
                  sub: intel.stateBenchmark
                    ? `You're ${intel.stateBenchmark.vsIndividualPct >= 0 ? "+" : ""}${intel.stateBenchmark.vsIndividualPct}%`
                    : "US Census 2023",
                },
                {
                  label: `${stateName} household median`,
                  value: fmtUSD(medians.medianHousehold),
                  sub: intel.stateBenchmark
                    ? `You're ${intel.stateBenchmark.vsHouseholdPct >= 0 ? "+" : ""}${intel.stateBenchmark.vsHouseholdPct}%`
                    : "US Census 2023",
                },
              ].map(({ label, value, sub, highlight }) => (
                <div key={label} className={`rounded-xl p-4 text-center ${highlight ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-100"}`}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-xl font-bold ${highlight ? "text-blue-700" : "text-gray-800"}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tax savings */}
        {intel.taxTips.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tax Savings Opportunities</h2>
            <div className="space-y-4">
              {intel.taxTips.slice(0, 4).map((tip) => (
                <div key={tip.title} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{tip.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{tip.description}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 whitespace-nowrap self-start">
                    {tip.estimatedSaving}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* City breakdown links */}
        {stateCities.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {fmtCompact(gross)} Salary in {stateName} Cities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stateCities.map((c) => {
                const cSlug = c.city.toLowerCase().replace(/\s+/g, "-");
                return (
                  <a
                    key={cSlug}
                    href={`/city-living/is-${gross}-enough-in-${cSlug}`}
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {c.city} →
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {faqs.map((f) => (
              <div key={f.q} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{f.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Nearby salary levels */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Compare Other Salary Levels in {stateName}</h2>
          <div className="flex flex-wrap gap-2">
            {nearby.map((s) => (
              <a
                key={s}
                href={`/salary-guides/${s}/${state}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {fmtCompact(s)}
              </a>
            ))}
          </div>
        </section>

        {/* Trust signals */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ReviewedBy />
          <DataSourceBadges sources={["irs", "hud", "bls", "ssa"]} />
        </div>

      </div>
    </main>
  );
}
