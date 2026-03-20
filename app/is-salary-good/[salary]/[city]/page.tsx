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
export const revalidate = 604800;
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
function fmtK(n: number): string {
  return `$${Math.round(n / 1000)}K`;
}

// Deterministic variant picker — spreads templates across city+salary combos
function pickVariant(gross: number, city: string, count: number): number {
  const hash = city.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (Math.floor(gross / 1000) + hash) % count;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ salary: string; city: string }>;
}): Promise<Metadata> {
  const { salary, city } = await params;
  const cityName = toTitle(city);
  const gross = Number(salary);

  // Compute real numbers for richer meta snippets
  const stateCode = getStateCodeForCity(city);
  const net = stateCode ? calculateNetSalary({ salary: gross, state: stateCode }) : null;
  const rentData = getRent(city);
  const monthlyRent = rentData?.["1br"] ?? null;
  const monthlyTH = net?.monthlyTakeHome ?? null;

  const k = fmtK(gross);
  const v = pickVariant(gross, city, 6);

  const titles = [
    `Is ${k} Enough in ${cityName}? Take-Home & Rent`,
    `${k} Salary in ${cityName}: What You Really Take Home`,
    `${k} in ${cityName} — Rent, Taxes & Reality Check`,
    `Living on ${k} in ${cityName}: The Real Numbers`,
    `${k} in ${cityName}: Is It Enough After Rent & Taxes?`,
    `${k} in ${cityName}: Take-Home, Living Costs & More`,
  ];

  const descs = monthlyTH && monthlyRent ? [
    `Take home ${fmtUSD(monthlyTH)}/mo on ${k} in ${cityName}. With 1BR rent at ${fmtUSD(monthlyRent)}/mo, see your rent ratio, monthly savings potential, and whether this salary is enough.`,
    `${k} nets ${fmtUSD(monthlyTH)}/month in ${cityName} after all taxes. Rent runs ${fmtUSD(monthlyRent)}/mo — find out if this salary covers your lifestyle and how much you can realistically save.`,
    `After taxes, ${k} in ${cityName} is ${fmtUSD(monthlyTH)}/mo. Average 1BR rent is ${fmtUSD(monthlyRent)}/mo. See the full budget breakdown and decide if this salary works for you.`,
    `${fmtUSD(monthlyTH)}/mo take-home. ${fmtUSD(monthlyRent)}/mo for a 1BR in ${cityName}. See exactly what's left for food, savings, and life — and get a lifestyle score out of 10.`,
    `Wondering if ${k} is good in ${cityName}? Your take-home is ${fmtUSD(monthlyTH)}/mo. Rent averages ${fmtUSD(monthlyRent)}/mo. Get the full breakdown: taxes, rent pressure, and savings potential.`,
    `${k} in ${cityName} puts ${fmtUSD(monthlyTH)} in your pocket each month. With rent at ${fmtUSD(monthlyRent)}/mo, find out what's left — and if it's enough to live comfortably in 2026.`,
  ] : [
    `See take-home pay, rent affordability, and monthly savings for a ${k} salary in ${cityName}. Find out if it's enough to live comfortably in 2026.`,
    `${k} in ${cityName}: get the full picture — after-tax income, rent pressure, budget breakdown, and a lifestyle score. Know before you move or negotiate.`,
    `Is ${k} a good salary in ${cityName}? See real take-home pay, average rent, and monthly savings. Make an informed decision before committing.`,
    `Find out how far ${k} goes in ${cityName} — take-home pay, rent affordability, lifestyle score, and what you can realistically save each month.`,
    `${k} salary in ${cityName}: real take-home, rent costs, and a complete budget breakdown. See your lifestyle score and savings potential at a glance.`,
    `Curious if ${k} works in ${cityName}? See take-home pay, average rent, and monthly savings to find out if this salary is enough for your lifestyle.`,
  ];

  return buildPageMeta({
    title: titles[v],
    description: descs[v],
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

  // ── Enhancement sections data ─────────────────────────────────────────────
  const transport = colData?.transportMonthly ?? 175;
  const utilities = colData?.utilitiesMonthly ?? 165;
  const healthcare = colData?.healthcareMonthly ?? 200;
  const monthlyExpenses = foodCost + transport + utilities + healthcare;
  const monthlySavings = net.monthlyTakeHome - monthlyRent - monthlyExpenses;

  // What-if scenarios
  const roommateRent = Math.round(monthlyRent * 0.6);
  const roommateGain = monthlyRent - roommateRent;
  const higherSalaryNet = calculateNetSalary({ salary: Math.round(gross * 1.2), state: stateCode });
  const higherSalaryGain = (higherSalaryNet.monthlyTakeHome - monthlyRent - monthlyExpenses) - monthlySavings;
  const premiumRent = Math.round(monthlyRent * 1.35);
  const premiumRentIncrease = premiumRent - monthlyRent;
  const premiumRentRatio = Math.round((premiumRent / net.monthlyTakeHome) * 100);

  // Inline city comparison
  const otherCities = allCitiesData.filter((c) => c.slug !== city);
  const cheaperCity = [...otherCities].sort((a, b) => a.colIndex - b.colIndex).find((c) => c.colIndex < col) ?? otherCities[0];
  const expensiveCity = [...otherCities].sort((a, b) => b.colIndex - a.colIndex).find((c) => c.colIndex > col) ?? otherCities[otherCities.length - 1];
  const cheaperDelta = cheaperCity ? (cheaperCity.monthlyTakeHome - cheaperCity.rent1br) - (net.monthlyTakeHome - monthlyRent) : 0;
  const expensiveDelta = expensiveCity ? (expensiveCity.monthlyTakeHome - expensiveCity.rent1br) - (net.monthlyTakeHome - monthlyRent) : 0;

  // Decision guide
  const rentRatio = rentStress.ratio;
  const savingsRate = monthlySavings / net.monthlyTakeHome;
  const comfortSalary = Math.round((monthlyRent / 0.25) * 12 / (1 - net.effectiveTaxRate / 100));
  const stretchSalary = Math.round(comfortSalary * 1.35);

  // Expanded FAQ (10 pairs)
  const expandedFaqs = [
    {
      q: `Can you live comfortably on ${fmtUSD(gross)} in ${cityName}?`,
      a: `With a lifestyle score of ${lifestyleScore}/10 and rent at ${rentStress.percentage}% of take-home, comfortable living is ${lifestyleScore >= 6 ? "achievable" : "tight"} at this salary. Keeping rent below ${fmtUSD(rentStress.comfortableMonthlyMax)}/mo and saving 10–15% monthly keeps you on solid footing.`,
    },
    {
      q: `How much is ${fmtUSD(gross)} after taxes in ${stateName}?`,
      a: `In ${stateName}, ${fmtUSD(gross)} nets ${fmtUSD(net.netSalary)}/year after federal tax (${fmtUSD(net.federalTax)}), state tax (${fmtUSD(net.stateTax)}), and FICA — that's ${fmtUSD(net.monthlyTakeHome)}/month at a ${net.effectiveTaxRate}% effective rate.`,
    },
    {
      q: `What salary do you need to live comfortably in ${cityName}?`,
      a: `To keep rent under 25% of take-home in ${cityName}, you need at least ${fmtUSD(comfortSalary)} gross. At ${fmtUSD(gross)}, your rent-to-income ratio is ${rentStress.percentage}%, which is ${rentRatio <= 0.25 ? "within" : "above"} the comfortable threshold.`,
    },
    {
      q: `Is ${fmtUSD(gross)} enough for a single person in ${cityName}?`,
      a: `A 1BR in ${cityName} at ${fmtUSD(monthlyRent)}/mo takes up ${rentStress.percentage}% of take-home. After core expenses, you have roughly ${fmtUSD(Math.max(0, monthlySavings))}/mo left — ${monthlySavings >= 500 ? "enough to build savings steadily" : "slim; consider a roommate or lower-cost neighborhood"}.`,
    },
    {
      q: `How does ${cityName}'s cost of living compare to the US average?`,
      a: `${cityName}'s COL index is ${col.toFixed(2)}, meaning it's ${col > 1 ? `${Math.round((col - 1) * 100)}% pricier than the national average` : `${Math.round((1 - col) * 100)}% cheaper than the national average`}. ${col > 1.15 ? "This materially compresses purchasing power for mid-range salaries." : col < 0.9 ? "Your dollar stretches further here than in most US cities." : "Costs are close to average; national salary benchmarks apply well."}`,
    },
    {
      q: `Does the 30% rent rule apply to ${fmtUSD(gross)} in ${cityName}?`,
      a: `The stricter take-home rule (25%) gives a rent ceiling of ${fmtUSD(rentStress.comfortableMonthlyMax)}/mo. ${cityName}'s average 1BR at ${fmtUSD(monthlyRent)}/mo means you ${monthlyRent <= rentStress.comfortableMonthlyMax ? "pass" : "exceed"} that threshold — ${monthlyRent <= rentStress.comfortableMonthlyMax ? "a healthy position" : `you'd need ~${fmtUSD(monthlyRent - rentStress.comfortableMonthlyMax)}/mo less in rent to comply`}.`,
    },
    {
      q: `How much should you save per month on ${fmtUSD(gross)} in ${cityName}?`,
      a: `After rent and essentials, a realistic monthly savings target is ${fmtUSD(Math.max(0, Math.round(monthlySavings * 0.4)))}–${fmtUSD(Math.max(0, Math.round(monthlySavings * 0.75)))}. Priority: build a ${fmtUSD(net.monthlyTakeHome * 3)} emergency fund first, then max employer 401(k) match, then Roth IRA contributions.`,
    },
    {
      q: `Is ${cityName} worth it financially on ${fmtUSD(gross)}?`,
      a: `If your role pays a ${cityName} market premium, the math works at ${fmtUSD(gross)} — lifestyle score is ${lifestyleScore}/10. If the same role is available in a lower-COL city, relocating could add 15–25% to real purchasing power without a raise.`,
    },
    {
      q: `What are the top tax deductions for a ${fmtUSD(gross)} salary?`,
      a: `The highest-impact moves at ${fmtUSD(gross)}: 401(k) up to $23,500 (2026), HSA at $4,300 single/$8,550 family, and mortgage interest or student loan interest if applicable. Maxing a 401(k) alone cuts taxable income by over $23,000 and can save $4,000–$7,000 in taxes.`,
    },
    {
      q: `How does ${fmtUSD(gross)} in ${cityName} compare to the US median salary?`,
      a: `The US median household income is ~$80,000. ${fmtUSD(gross)} is ${gross > 80000 ? `${Math.round((gross / 80000 - 1) * 100)}% above` : `${Math.round((1 - gross / 80000) * 100)}% below`} that benchmark. Adjusted for ${cityName}'s COL of ${col.toFixed(2)}, its real purchasing power is ${col > 1 ? "lower than the raw number implies" : "higher than the raw number implies"}.`,
    },
  ];

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

        {/* What-If Scenarios */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">What-If Scenarios</h2>
          <p className="text-sm text-gray-500 mb-5">How small changes shift your monthly finances</p>
          <div className="space-y-4">
            {[
              {
                label: "Shared Housing / Roommate",
                change: `Rent drops to ${fmtUSD(roommateRent)}/mo`,
                impact: `+${fmtUSD(roommateGain)}/mo freed up`,
                insight: `Splitting rent saves ${fmtUSD(roommateGain * 12)}/yr — enough to fully fund a Roth IRA.`,
                positive: true,
              },
              {
                label: "20% Salary Increase",
                change: `Take-home rises to ${fmtUSD(higherSalaryNet.monthlyTakeHome)}/mo`,
                impact: `+${fmtUSD(higherSalaryGain)}/mo net gain`,
                insight: `A raise to ${fmtUSD(Math.round(gross * 1.2))} adds ${fmtUSD(higherSalaryGain)}/mo after taxes — less than the gross increase due to bracket creep.`,
                positive: true,
              },
              {
                label: "Premium / Downtown Apartment",
                change: `Rent rises to ${fmtUSD(premiumRent)}/mo`,
                impact: `-${fmtUSD(premiumRentIncrease)}/mo less available`,
                insight: `Upgrading pushes rent-to-income to ${premiumRentRatio}% — ${premiumRentRatio > 30 ? "above the 30% stress threshold" : "still within safe range"}.`,
                positive: false,
              },
            ].map((s) => (
              <div key={s.label} className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
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
        </div>

        {/* Inline City Comparison */}
        {cheaperCity && expensiveCity && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">How {cityName} Stacks Up</h2>
            <p className="text-sm text-gray-500 mb-5">Monthly rent-adjusted surplus vs. comparable cities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <p className="text-xs font-medium text-green-600 mb-1">More Affordable</p>
                <p className="text-base font-bold text-gray-900">{cheaperCity.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">COL {cheaperCity.colIndex.toFixed(2)} · Rent {fmtUSD(cheaperCity.rent1br)}/mo</p>
                <p className={`text-sm font-semibold mt-2 ${cheaperDelta >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {cheaperDelta >= 0 ? `+${fmtUSD(cheaperDelta)}` : `-${fmtUSD(Math.abs(cheaperDelta))}`}/mo surplus vs {cityName}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {cheaperDelta >= 0
                    ? `Lower rent more than offsets any take-home difference.`
                    : `State taxes reduce take-home enough to negate the rent savings.`}
                </p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-medium text-red-600 mb-1">More Expensive</p>
                <p className="text-base font-bold text-gray-900">{expensiveCity.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">COL {expensiveCity.colIndex.toFixed(2)} · Rent {fmtUSD(expensiveCity.rent1br)}/mo</p>
                <p className={`text-sm font-semibold mt-2 ${expensiveDelta >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {expensiveDelta >= 0 ? `+${fmtUSD(expensiveDelta)}` : `-${fmtUSD(Math.abs(expensiveDelta))}`}/mo surplus vs {cityName}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {expensiveDelta < 0
                    ? `Higher rent erodes your monthly buffer by ${fmtUSD(Math.abs(expensiveDelta))}.`
                    : `Higher take-home from lower state taxes outpaces the rent increase.`}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
              <span className="font-medium">Takeaway: </span>
              {cheaperDelta > 0
                ? `Moving to ${cheaperCity.name} would free up ${fmtUSD(cheaperDelta)}/mo — ${fmtUSD(cheaperDelta * 12)}/yr — without a salary change.`
                : `${cityName} holds its own against nearby alternatives; the rent advantage elsewhere is offset by tax differences.`}
            </p>
          </div>
        )}

        {/* Decision Guide */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Should You Take This Salary in {cityName}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-3">Good fit if...</p>
              <ul className="space-y-2">
                {[
                  rentRatio <= 0.28
                    ? `Rent at ${rentStress.percentage}% of take-home stays comfortably under the 28% threshold`
                    : `You can find shared housing to bring rent below ${fmtUSD(rentStress.comfortableMonthlyMax)}/mo`,
                  savingsRate >= 0.12
                    ? `Your ${Math.round(savingsRate * 100)}% monthly savings rate supports long-term wealth building`
                    : `Discretionary cuts can push monthly savings above 10% of take-home`,
                  lifestyleScore >= 6
                    ? `Lifestyle score of ${lifestyleScore}/10 signals financial stability in ${cityName}`
                    : `Income growth has high leverage here — each raise meaningfully improves life quality`,
                ].map((pt) => (
                  <li key={pt} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold shrink-0">✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700 mb-3">Risky if...</p>
              <ul className="space-y-2">
                {[
                  rentRatio > 0.35
                    ? `Rent at ${rentStress.percentage}% of take-home leaves a thin margin for emergencies`
                    : `Any rent increase above ${fmtUSD(rentStress.comfortableMonthlyMax)}/mo will create financial strain`,
                  monthlySavings < 400
                    ? `Monthly surplus under ${fmtUSD(monthlySavings > 0 ? monthlySavings : 400)} makes it hard to build a 3-month emergency fund`
                    : `An unexpected job loss would deplete savings within ${Math.max(1, Math.round(net.monthlyTakeHome * 3 / Math.max(1, monthlySavings)))} months`,
                  col > 1.1
                    ? `COL index of ${col.toFixed(2)} means inflation bites harder here than in most US cities`
                    : `Rising costs in ${cityName} may erode purchasing power if salary growth stalls`,
                ].map((pt) => (
                  <li key={pt} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-red-500 font-bold shrink-0">✗</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Ideal Salary Range for {cityName}</p>
              <p className="text-base font-bold text-gray-900">{fmtUSD(comfortSalary)} – {fmtUSD(stretchSalary)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Keeps rent under 25% and leaves meaningful savings headroom</p>
            </div>
            <div className={`rounded-xl p-4 ${lifestyleScore >= 7 ? "bg-green-50" : lifestyleScore >= 5 ? "bg-yellow-50" : "bg-red-50"}`}>
              <p className={`text-xs font-medium mb-1 ${lifestyleScore >= 7 ? "text-green-700" : lifestyleScore >= 5 ? "text-yellow-700" : "text-red-700"}`}>Verdict</p>
              <p className="text-sm text-gray-800 font-medium leading-snug">
                {lifestyleScore >= 7
                  ? `Solid for ${cityName} — prioritize maxing tax-advantaged accounts before lifestyle upgrades.`
                  : lifestyleScore >= 5
                  ? `Workable but tight — a 15–20% income boost would meaningfully improve financial flexibility.`
                  : `Below the comfort threshold for ${cityName} — consider remote work, relocation, or income growth.`}
              </p>
            </div>
          </div>
        </div>

        {/* Expanded FAQ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">More Questions Answered</h2>
          <div className="space-y-5">
            {expandedFaqs.map((f) => (
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
