import { notFound, permanentRedirect } from "next/navigation";

import type { Metadata } from "next";
import { CITY_COSTS } from "@/data/city-costs";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getRent } from "@/lib/data/rentData";
import { getCOLData } from "@/lib/data/costOfLiving";
import { getFoodCostBySize } from "@/lib/data/foodData";
import { getRentStressFromMonthly } from "@/lib/rentStress";
import { getTaxSavingsSuggestions } from "@/lib/tax/taxSavings";
import { generateFinancialInsights } from "@/lib/financial/financialInsights";
import { getInternalLinks } from "@/lib/internalLinks";
import { getStateCodeForCity, getStatePrimaryCity, toTitle, fmtUSD, cityToSlug } from "@/lib/stateCodeMap";
import { buildPageMeta, SEED_CITIES, SEED_SALARIES } from "@/lib/seo";
import BudgetPlanner from "@/components/BudgetPlanner";
import CityComparisonWidget, { type CityCompareData } from "@/components/CityComparisonWidget";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

// ── Seed: 12 salaries × 20 cities = 240 pages at build time ──────────────────
export async function generateStaticParams() {
  const params = [];
  for (const salary of SEED_SALARIES) {
    for (const city of SEED_CITIES.slice(0, 20)) {
      params.push({ salary: salary.toString(), city });
    }
  }
  return params;
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ salary: string; city: string }>;
}): Promise<Metadata> {
  const { salary, city } = await params;
  const cityName = toTitle(city);
  const gross = Number(salary);
  return buildPageMeta({
    title: `Is ${fmtUSD(gross)} a Good Salary in ${cityName}? (2026)`,
    description: `Find out if ${fmtUSD(gross)} is a good salary in ${cityName}. See take-home pay, rent affordability, budget breakdown, and lifestyle score.`,
    canonical: `/is-salary-good/${salary}/${city}`,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreLabel(score: number) {
  if (score >= 8) return { text: "Excellent", color: "text-green-600" };
  if (score >= 6) return { text: "Good", color: "text-blue-600" };
  if (score >= 4) return { text: "Moderate", color: "text-yellow-600" };
  return { text: "Challenging", color: "text-red-600" };
}

const stressColors: Record<string, string> = {
  green:  "bg-green-50 border-green-200 text-green-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  red:    "bg-red-50 border-red-200 text-red-700",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function IsSalaryGoodPage({
  params,
}: {
  params: Promise<{ salary: string; city: string }>;
}) {
  const { salary, city } = await params;
  const gross = Number(salary);
  if (!gross || gross <= 0) return notFound();

  // State code
  const stateCode = getStateCodeForCity(city);
  if (!stateCode) return notFound();

  // Net salary
  const net = calculateNetSalary({ salary: gross, state: stateCode });

  // Rent & COL
  const rentData = getRent(city);
  const colData  = getCOLData(city);
  const col      = colData?.index ?? null;
  if (!rentData || col === null) {
    const primaryCity = getStatePrimaryCity(city);
    if (primaryCity) permanentRedirect(`/is-salary-good/${salary}/${primaryCity}`);
    return notFound();
  }

  const monthlyRent = rentData["1br"];
  const rentStress = getRentStressFromMonthly(net.monthlyTakeHome, monthlyRent);

  // Lifestyle score (1–10)
  const rawScore = Math.max(1, 10 - Math.round(rentStress.ratio * 18));
  const salaryBonus = gross >= 150000 ? 1 : gross < 60000 ? -1 : 0;
  const lifestyleScore = Math.max(1, Math.min(10, rawScore + salaryBonus));
  const { text: scoreText, color: scoreColor } = scoreLabel(lifestyleScore);

  const cityName = toTitle(city);
  const stateName = toTitle(stateCode);
  const annualRent = monthlyRent * 12;
  const annualSavings = net.netSalary - annualRent;

  // Tax savings tips filtered by income
  const tips = getTaxSavingsSuggestions(gross).slice(0, 5);

  // Financial Reasoning Engine — narrative insights
  const foodCost = getFoodCostBySize(city, "single") ?? Math.round(monthlyRent * 0.3);
  const insights = generateFinancialInsights({
    city:               cityName,
    state:              stateName,
    salary:             gross,
    netSalary:          net.netSalary,
    rent:               monthlyRent,
    foodCost,
    costOfLivingIndex:  col,
    transportMonthly:   colData?.transportMonthly,
    utilitiesMonthly:   colData?.utilitiesMonthly,
    healthcareMonthly:  colData?.healthcareMonthly,
    federalTax:         net.federalTax,
    stateTax:           net.stateTax,
    ficaTotal:          net.fica.total,
    totalTax:           net.totalTax,
    filingStatus:       net.filingStatus,
  });

  // Internal links
  const links = getInternalLinks({ salary: gross, city });

  // ── City comparison data for all seed cities ──────────────────────────────
  const allCitiesData: CityCompareData[] = [];
  for (const slug of SEED_CITIES) {
    const sc = getStateCodeForCity(slug);
    if (!sc) continue;
    const r = getRent(slug);
    const colEntry = getCOLData(slug);
    if (!r || !colEntry) continue;
    const n = calculateNetSalary({ salary: gross, state: sc });
    const stress = getRentStressFromMonthly(n.monthlyTakeHome, r["1br"]);
    const rawS = Math.max(1, 10 - Math.round(stress.ratio * 18));
    const bonus = gross >= 150000 ? 1 : gross < 60000 ? -1 : 0;
    allCitiesData.push({
      slug,
      name: toTitle(slug),
      netSalary: n.netSalary,
      monthlyTakeHome: n.monthlyTakeHome,
      effectiveTaxRate: n.effectiveTaxRate,
      rent1br: r["1br"],
      rentRatio: stress.ratio,
      rentLabel: stress.label,
      rentColor: stress.color,
      lifestyleScore: Math.max(1, Math.min(10, rawS + bonus)),
      colIndex: colEntry.index,
      stateName: toTitle(sc),
    });
  }
  const currentCityData = allCitiesData.find((c) => c.slug === city)!;

  // FAQ schema
  const faqs = [
    {
      q: `Is ${fmtUSD(gross)} a good salary in ${cityName}?`,
      a: `${fmtUSD(gross)} in ${cityName} yields a take-home of ${fmtUSD(net.netSalary)} per year (${fmtUSD(net.monthlyTakeHome)}/month). With average 1BR rent of ${fmtUSD(monthlyRent)}/month, your rent-to-income ratio is ${rentStress.percentage}%, which is considered "${rentStress.label}". Overall lifestyle score: ${lifestyleScore}/10 — ${scoreText}.`,
    },
    {
      q: `What is the take-home pay for ${fmtUSD(gross)} in ${stateName}?`,
      a: `After federal tax (${fmtUSD(net.federalTax)}), state tax (${fmtUSD(net.stateTax)}), Social Security, and Medicare, your annual take-home is ${fmtUSD(net.netSalary)}, or ${fmtUSD(net.monthlyTakeHome)} per month. Effective total tax rate: ${net.effectiveTaxRate}%.`,
    },
    {
      q: `How much rent can you afford on ${fmtUSD(gross)} in ${cityName}?`,
      a: `Financial experts recommend spending no more than 25–30% of take-home pay on rent. On a ${fmtUSD(gross)} salary in ${cityName}, your comfortable rent ceiling is ${fmtUSD(rentStress.comfortableMonthlyMax)}/month. Average 1BR rent in ${cityName} is ${fmtUSD(monthlyRent)}/month.`,
    },
    {
      q: `How does cost of living in ${cityName} affect purchasing power?`,
      a: `${cityName} has a cost-of-living index of ${col.toFixed(2)} relative to the national average (1.00). ${col > 1 ? `It is ${Math.round((col - 1) * 100)}% more expensive than average, reducing your purchasing power.` : `It is ${Math.round((1 - col) * 100)}% cheaper than average, stretching your salary further.`}`,
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
      { "@type": "ListItem", position: 3, name: `${fmtUSD(gross)} Guide`, item: `https://know-your-pay.com/salary-guides/${gross}` },
      { "@type": "ListItem", position: 4, name: cityName, item: `https://know-your-pay.com/is-salary-good/${gross}/${city}` },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Salary Analysis · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Is {fmtUSD(gross)} a Good Salary in {cityName}?
          </h1>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${stressColors[rentStress.color]}`}>
              Rent: {rentStress.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${scoreColor} bg-white border-current`}>
              Lifestyle Score: {lifestyleScore}/10 — {scoreText}
            </span>
          </div>
          <p className="text-gray-600 mt-4 leading-relaxed">{rentStress.advice}</p>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Annual Take-Home", value: fmtUSD(net.netSalary), sub: `${net.effectiveTaxRate}% effective tax` },
            { label: "Monthly Take-Home", value: fmtUSD(net.monthlyTakeHome), sub: "after all taxes" },
            { label: "Avg 1BR Rent", value: fmtUSD(monthlyRent) + "/mo", sub: `${rentStress.percentage}% of income` },
            { label: "Annual Savings Potential", value: fmtUSD(Math.max(0, annualSavings)), sub: "after rent" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* City Comparison Widget */}
        {currentCityData && (
          <CityComparisonWidget
            currentCity={currentCityData}
            allCities={allCitiesData}
          />
        )}

        {/* Tax Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Tax Breakdown</h2>
          <div className="space-y-0">
            {[
              { label: "Gross Salary", value: fmtUSD(net.grossSalary), bold: true },
              { label: "Federal Income Tax", value: `–${fmtUSD(net.federalTax)}`, note: `${((net.federalTax / gross) * 100).toFixed(1)}%` },
              { label: `${stateName} State Tax`, value: `–${fmtUSD(net.stateTax)}`, note: net.stateTax === 0 ? "No state tax" : `${((net.stateTax / gross) * 100).toFixed(1)}%` },
              { label: "Social Security", value: `–${fmtUSD(net.fica.socialSecurity)}` },
              { label: "Medicare", value: `–${fmtUSD(net.fica.medicare + net.fica.additionalMedicare)}` },
              { label: "Annual Take-Home", value: fmtUSD(net.netSalary), bold: true, highlight: true },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between py-3 border-b border-gray-50 last:border-0 ${row.highlight ? "bg-green-50 -mx-6 px-6 rounded-b-2xl mt-1" : ""}`}
              >
                <span className={`text-sm ${row.bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                  {row.label}
                  {row.note && <span className="ml-2 text-xs text-gray-400">({row.note})</span>}
                </span>
                <span className={`text-sm font-semibold ${row.highlight ? "text-green-700" : "text-gray-900"}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
            <div><span className="block font-semibold text-gray-800">{fmtUSD(net.monthlyTakeHome)}</span>Monthly</div>
            <div><span className="block font-semibold text-gray-800">{fmtUSD(net.biWeeklyTakeHome)}</span>Bi-Weekly</div>
            <div><span className="block font-semibold text-gray-800">{net.effectiveTaxRate}%</span>Effective Rate</div>
          </div>
        </div>

        {/* Rent Affordability */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Rent Affordability in {cityName}</h2>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Rent-to-income ratio</span>
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
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span><span>25% (comfortable)</span><span>40% (stressed)</span><span>60%+</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5">
            {[
              { label: "Average 1BR Rent", value: fmtUSD(monthlyRent) + "/mo" },
              { label: "Average 2BR Rent", value: fmtUSD(rentData["2br"]) + "/mo" },
              { label: "Comfortable Rent Max", value: fmtUSD(rentStress.comfortableMonthlyMax) + "/mo", note: "< 25% of take-home" },
              { label: "COL Index", value: col.toFixed(2), note: col > 1 ? `${Math.round((col - 1) * 100)}% above average` : `${Math.round((1 - col) * 100)}% below average` },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-bold text-gray-900">{item.value}</p>
                {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Budget Planner */}
        <BudgetPlanner netMonthly={net.monthlyTakeHome} />

        {/* Financial Insights — engine-generated narratives */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-900">Financial Insights</h2>
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
              Lifestyle Score: {insights.lifestyleScore}/10 — {insights.lifestyleLabel}
            </span>
          </div>

          {[
            { icon: "🏠", title: "Housing Affordability",   text: insights.affordabilityInsight },
            { icon: "📊", title: "Tax Burden",              text: insights.taxInsight },
            { icon: "💰", title: "Savings Potential",       text: insights.savingsInsight },
            { icon: "📈", title: "Salary Context",          text: insights.salaryComparison },
            { icon: "🗺️", title: "Cost of Living",         text: insights.costOfLivingInsight },
          ].map(({ icon, title, text }) => (
            <div key={title} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <span className="text-xl mt-0.5 shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}

          {/* 50/30/20 needs-fit indicator */}
          <div className={`rounded-xl p-3 text-sm ${insights.budgetScenario.needsFit ? "bg-green-50 border border-green-200 text-green-800" : "bg-orange-50 border border-orange-200 text-orange-800"}`}>
            {insights.budgetScenario.needsFit
              ? `✓ Essential expenses fit within the 50% "needs" budget (${fmtUSD(insights.budgetScenario.needs)}/mo), leaving ${fmtUSD(insights.budgetScenario.needs - (monthlyRent + foodCost + (colData?.transportMonthly ?? 175) + (colData?.utilitiesMonthly ?? 165) + (colData?.healthcareMonthly ?? 200)))} headroom.`
              : `⚠ Essential expenses exceed the 50% "needs" guideline of ${fmtUSD(insights.budgetScenario.needs)}/mo. Consider a lower-cost housing option or higher income to align with the 50/30/20 framework.`
            }
          </div>
        </div>

        {/* Tax Savings */}
        {tips.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Tax Savings Opportunities</h2>
            <div className="space-y-4">
              {tips.map((tip) => (
                <div key={tip.title} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{tip.title}</p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{tip.description}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 whitespace-nowrap">
                      {tip.estimatedSaving}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Salary Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
