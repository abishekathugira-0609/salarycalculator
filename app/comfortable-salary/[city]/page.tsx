import { notFound, permanentRedirect } from "next/navigation";

import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import { fmtUSD, toTitle, getStateCodeForCity, getStatePrimaryCity } from "@/lib/stateCodeMap";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getRentByType } from "@/lib/data/rentData";
import { getCOLData } from "@/lib/data/costOfLiving";
import { getFoodCostBySize } from "@/lib/data/foodData";
import { CITY_COSTS } from "@/data/city-costs";
import DataSourceBadges from "@/components/DataSourceBadges";
import LastUpdated from "@/components/LastUpdated";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

type PageProps = { params: Promise<{ city: string }> };

export function generateStaticParams() {
  return Object.values(CITY_COSTS)
    .flat()
    .filter((c) => c.seoWeight >= 3)
    .map((c) => ({ city: c.city.toLowerCase().replace(/\s+/g, "-") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const cityName = toTitle(city);
  return buildPageMeta({
    title: `Comfortable Salary in ${cityName} (2026) — How Much Do You Need?`,
    description: `Calculate the minimum salary needed to live comfortably in ${cityName} in 2026. See budget, rent, expenses, and three income scenarios: budget, comfortable, and premium.`,
    canonical: `/comfortable-salary/${city}`,
  });
}

// ── Scenario calculator ───────────────────────────────────────────────────────
interface Scenario {
  label: string;
  description: string;
  rentTier: "studio" | "1br" | "2br";
  savingsTarget: number;  // fraction of net (0.10 = 10%)
  foodMultiplier: number; // 1.0 = base, 1.2 = dining out more
  bg: string;
  border: string;
  badge: string;
}

const SCENARIOS: Scenario[] = [
  {
    label: "Budget",
    description: "Studio apartment, minimal dining out, no frills",
    rentTier: "studio",
    savingsTarget: 0.05,
    foodMultiplier: 0.85,
    bg: "bg-gray-50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
  },
  {
    label: "Comfortable",
    description: "1-bedroom, moderate lifestyle, 10–15% savings",
    rentTier: "1br",
    savingsTarget: 0.15,
    foodMultiplier: 1.0,
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    label: "Premium",
    description: "2-bedroom or upscale 1BR, dining out regularly, 20% savings",
    rentTier: "2br",
    savingsTarget: 0.20,
    foodMultiplier: 1.25,
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700",
  },
];

/**
 * Estimate the gross salary needed to hit a target lifestyle.
 * Solve backwards from monthly expenses:
 *   neededNet = totalMonthlyExpenses / (1 - savingsTarget)
 *   neededGross = neededNet / (1 - effectiveTaxRate)
 *
 * We iterate since effective tax rate depends on salary (use two-pass approximation).
 */
function calcRequiredSalary(
  rent: number,
  food: number,
  transport: number,
  utilities: number,
  healthcare: number,
  savingsTarget: number,
  stateCode: string
): { gross: number; net: number; monthlyTakeHome: number } {
  const monthlyExpenses = rent + food + transport + utilities + healthcare;
  // First pass: assume ~22% effective tax rate
  let approxGross = (monthlyExpenses / (1 - savingsTarget) * 12) / (1 - 0.22);

  // Second pass: recalculate with a real tax calculation
  for (let i = 0; i < 2; i++) {
    const t = calculateNetSalary({ salary: approxGross, state: stateCode, filingStatus: "single", taxYear: 2026 });
    const etfr = t.totalTax / approxGross;
    approxGross = (monthlyExpenses / (1 - savingsTarget) * 12) / (1 - etfr);
  }

  const finalGross = Math.ceil(approxGross / 1000) * 1000;
  const finalTax   = calculateNetSalary({ salary: finalGross, state: stateCode, filingStatus: "single", taxYear: 2026 });
  return { gross: finalGross, net: finalTax.netSalary, monthlyTakeHome: finalTax.monthlyTakeHome };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ComfortableSalaryPage({ params }: PageProps) {
  const { city } = await params;
  const cityName  = toTitle(city);
  // Redirect state slugs (e.g. "new-york") to primary city (e.g. "new-york-city")
  const primaryCity = getStatePrimaryCity(city);
  if (primaryCity && primaryCity !== city) permanentRedirect(`/comfortable-salary/${primaryCity}`);
  const stateCode = getStateCodeForCity(city);
  if (!stateCode) return notFound();

  const colData      = getCOLData(city);
  const colIndex     = colData?.index ?? 1.0;
  const foodBase     = getFoodCostBySize(city, "single") ?? Math.round(440 * colIndex);
  const transportAmt = colData?.transportMonthly ?? Math.round(175 * colIndex);
  const utilitiesAmt = colData?.utilitiesMonthly  ?? Math.round(165 * colIndex);
  const healthAmt    = colData?.healthcareMonthly  ?? Math.round(200 * colIndex);

  // Rent by tier
  const rentByTier: Record<"studio" | "1br" | "2br", number> = {
    studio: getRentByType(city, "studio") ?? Math.round(1000 * colIndex),
    "1br":  getRentByType(city, "1br")    ?? Math.round(1300 * colIndex),
    "2br":  getRentByType(city, "2br")    ?? Math.round(1650 * colIndex),
  };

  // Calculate required salary for each scenario
  const results = SCENARIOS.map((s) => {
    const rent  = rentByTier[s.rentTier];
    const food  = Math.round(foodBase * s.foodMultiplier);
    const total = rent + food + transportAmt + utilitiesAmt + healthAmt;
    const calc  = calcRequiredSalary(rent, food, transportAmt, utilitiesAmt, healthAmt, s.savingsTarget, stateCode);
    return { ...s, rent, food, totalMonthly: total, ...calc };
  });

  // For FAQ: comfortable scenario
  const comfy = results[1];

  const faqs = [
    {
      q: `What salary do you need to live comfortably in ${cityName}?`,
      a: `A comfortable salary for a single adult in ${cityName} is approximately ${fmtUSD(comfy.gross)} (gross). This covers a 1-bedroom apartment (${fmtUSD(comfy.rent)}/mo), food, transport, utilities, and healthcare — with around 15% of take-home available for savings. (2026 data)`,
    },
    {
      q: `How is this calculated?`,
      a: `The required salary is calculated by estimating total monthly essential expenses (rent, food, transport, utilities, healthcare), then grossing up to account for federal and ${stateCode} state taxes at 2026 rates. The target is to leave at least 10–20% of take-home income for savings.`,
    },
    {
      q: `Is ${cityName} affordable?`,
      a: colIndex < 1.0
        ? `Yes — ${cityName} has a cost-of-living index of ${colIndex.toFixed(2)}, meaning it is ${Math.round((1 - colIndex) * 100)}% less expensive than the national average. Even a moderate income goes further here.`
        : colIndex < 1.15
        ? `${cityName} is roughly in line with the national average (COL index: ${colIndex.toFixed(2)}), making it moderately affordable compared to major metro areas.`
        : `${cityName} has an above-average cost of living (index: ${colIndex.toFixed(2)}), so a higher salary is needed compared to most US cities.`,
    },
    {
      q: `How much is rent in ${cityName}?`,
      a: `Average rent in ${cityName}: Studio ${fmtUSD(rentByTier.studio)}/mo, 1-bedroom ${fmtUSD(rentByTier["1br"])}/mo, 2-bedroom ${fmtUSD(rentByTier["2br"])}/mo. (Source: HUD Fair Market Rents 2026)`,
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

  // Nearby cities
  const nearbyCities = Object.values(CITY_COSTS)
    .flat()
    .filter((c) => c.stateCode === stateCode && c.city.toLowerCase().replace(/\s+/g, "-") !== city)
    .sort((a, b) => b.seoWeight - a.seoWeight)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

        {/* Hero */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Comfortable Salary Calculator · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            How Much Do You Need to Live Comfortably in {cityName}?
          </h1>
          <p className="mt-2 text-gray-500">
            Single adult · 2026 tax rates · Expenses based on HUD, USDA, and BLS data
          </p>
          <div className="mt-4">
            <LastUpdated />
          </div>
        </section>

        {/* Three scenarios */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 px-1">Income Scenarios for {cityName}</h2>
          {results.map((r) => (
            <div key={r.label} className={`rounded-2xl border p-6 ${r.bg} ${r.border}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.badge}`}>
                    {r.label}
                  </span>
                  <p className="text-gray-600 text-sm mt-1">{r.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-gray-900">{fmtUSD(r.gross)}</p>
                  <p className="text-xs text-gray-400">required gross salary</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: "Annual take-home", value: fmtUSD(r.net) },
                  { label: "Monthly take-home", value: fmtUSD(r.monthlyTakeHome) },
                  { label: "Monthly expenses",  value: fmtUSD(r.totalMonthly) },
                  { label: "Rent",              value: fmtUSD(r.rent) + "/mo" },
                  { label: "Food",              value: fmtUSD(r.food) + "/mo" },
                  { label: "Savings target",    value: `${(r.savingsTarget * 100).toFixed(0)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/60 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              <a
                href={`/city-living/is-${r.gross}-enough-in-${city}`}
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:underline"
              >
                Full analysis for {fmtUSD(r.gross)} in {cityName} →
              </a>
            </div>
          ))}
        </section>

        {/* Expense breakdown */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Expense Breakdown</h2>
          <p className="text-sm text-gray-500 mb-4">
            Non-rent expenses are consistent across scenarios; rent varies by housing tier.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Expense</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Budget</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Comfortable</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: "Rent",          values: results.map((r) => fmtUSD(r.rent)) },
                  { label: "Food",          values: results.map((r) => fmtUSD(r.food)) },
                  { label: "Transport",     values: [fmtUSD(transportAmt), fmtUSD(transportAmt), fmtUSD(transportAmt)] },
                  { label: "Utilities",     values: [fmtUSD(utilitiesAmt), fmtUSD(utilitiesAmt), fmtUSD(utilitiesAmt)] },
                  { label: "Healthcare",    values: [fmtUSD(healthAmt),    fmtUSD(healthAmt),    fmtUSD(healthAmt)] },
                  { label: "Total/month",   values: results.map((r) => fmtUSD(r.totalMonthly)), bold: true },
                  { label: "Required salary", values: results.map((r) => fmtUSD(r.gross)),       bold: true },
                ].map(({ label, values, bold }) => (
                  <tr key={label} className={bold ? "font-semibold text-gray-900" : ""}>
                    <td className="py-2 text-gray-700">{label}</td>
                    {values.map((v, i) => (
                      <td key={i} className="py-2 text-right text-gray-800">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* COL context */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cost-of-Living Context</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
            {[
              { label: "COL Index",       value: colIndex.toFixed(2),     sub: "vs US avg (1.00)" },
              { label: "1BR Rent",        value: fmtUSD(rentByTier["1br"]) + "/mo", sub: "HUD FMR 2026" },
              { label: "Food (single)",   value: fmtUSD(foodBase) + "/mo",  sub: "USDA low-cost plan" },
              { label: "Transport",       value: fmtUSD(transportAmt) + "/mo", sub: "BLS CES avg" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </section>

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

        {/* Nearby cities */}
        {nearbyCities.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Other Cities in This State</h2>
            <div className="flex flex-wrap gap-2">
              {nearbyCities.map((c) => {
                const cSlug = c.city.toLowerCase().replace(/\s+/g, "-");
                return (
                  <a
                    key={cSlug}
                    href={`/comfortable-salary/${cSlug}`}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {c.city}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Internal links */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Tools</h2>
          <ul className="space-y-2 text-sm text-blue-600">
            {[
              { href: `/city-living/is-${comfy.gross}-enough-in-${city}`, label: `Is ${fmtUSD(comfy.gross)} enough to live in ${cityName}?` },
              { href: `/is-salary-good/${comfy.gross}/${city}`,            label: `Is ${fmtUSD(comfy.gross)} a good salary in ${cityName}?` },
              { href: `/rankings/${comfy.gross}`,                          label: `Best cities for a ${fmtUSD(comfy.gross)} salary` },
              { href: "/calculator",                                        label: "⚡ Salary after-tax calculator" },
              { href: "/job-offer-reality-check",                          label: "📋 Job offer reality check" },
            ].map(({ href, label }) => (
              <li key={href}>
                <a href={href} className="hover:underline">{label} →</a>
              </li>
            ))}
          </ul>
        </section>

        <DataSourceBadges sources={["hud", "irs", "bls", "ssa"]} />

      </div>
    </main>
  );
}
