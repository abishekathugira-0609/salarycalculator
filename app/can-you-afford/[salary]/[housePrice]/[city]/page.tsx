import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CITY_COSTS } from "@/data/city-costs";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getCostOfLivingIndex } from "@/lib/data/costOfLiving";
import { getInternalLinks } from "@/lib/internalLinks";
import { getStateCodeForCity, toTitle, fmtUSD, cityToSlug } from "@/lib/stateCodeMap";
import { buildPageMeta, SEED_CITIES, SEED_SALARIES } from "@/lib/seo";
import BudgetPlanner from "@/components/BudgetPlanner";

export const dynamic = "force-static";
export const revalidate = 604800;
export const dynamicParams = true;

// ── Seed: 6 salaries × 3 prices × 10 cities = 180 pages at build time ────────
const SEED_HOUSE_PRICES = [300000, 500000, 700000];
const SEED_AFFORD_CITIES = SEED_CITIES.slice(0, 10);

export async function generateStaticParams() {
  const params = [];
  for (const salary of SEED_SALARIES.slice(0, 6)) {
    for (const housePrice of SEED_HOUSE_PRICES) {
      for (const city of SEED_AFFORD_CITIES) {
        params.push({
          salary:     salary.toString(),
          housePrice: housePrice.toString(),
          city,
        });
      }
    }
  }
  return params;
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ salary: string; housePrice: string; city: string }>;
}): Promise<Metadata> {
  const { salary, housePrice, city } = await params;
  const cityName = toTitle(city);
  return buildPageMeta({
    title: `Can You Afford a ${fmtUSD(Number(housePrice))} House on ${fmtUSD(Number(salary))} in ${cityName}? (2026)`,
    description: `Mortgage affordability analysis for buying a ${fmtUSD(Number(housePrice))} home on a ${fmtUSD(Number(salary))} salary in ${cityName}. Includes monthly payment, taxes, insurance, and take-home breakdown.`,
    canonical: `/can-you-afford/${salary}/${housePrice}/${city}`,
  });
}

// ── Mortgage calculator ───────────────────────────────────────────────────────
const RATE_30YR = 0.0675; // 6.75% — approximate 2026 30-year fixed

function monthlyMortgagePayment(loanAmt: number): number {
  const r = RATE_30YR / 12;
  const n = 360;
  return loanAmt * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// Property tax rates by state (approximate effective rates)
const PROPERTY_TAX_BY_STATE: Record<string, number> = {
  NJ: 0.0247, IL: 0.0205, TX: 0.0166, NH: 0.0183, PA: 0.0148,
  CT: 0.0161, WI: 0.0154, NE: 0.0153, MI: 0.0133, VT: 0.0131,
  NY: 0.0148, OH: 0.0137, IA: 0.0129, RI: 0.0114, ME: 0.0109,
  MN: 0.0101, MD: 0.0099, KS: 0.0101, MO: 0.0096, IN: 0.0085,
  MA: 0.0098, GA: 0.0079, WA: 0.0093, AZ: 0.0055, OR: 0.0082,
  CO: 0.0054, CA: 0.0071, NC: 0.0074, VA: 0.0082, FL: 0.0083,
  NV: 0.0049, UT: 0.0057, ID: 0.0063, DE: 0.0055, SC: 0.0056,
  WV: 0.0059, MS: 0.0065, AR: 0.0063, TN: 0.0065, KY: 0.0083,
  OK: 0.0089, LA: 0.0056, AL: 0.0040, DC: 0.0055, HI: 0.0028,
  AK: 0.0098, MT: 0.0075, WY: 0.0057, ND: 0.0098, SD: 0.0114,
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CanYouAffordPage({
  params,
}: {
  params: Promise<{ salary: string; housePrice: string; city: string }>;
}) {
  const { salary, housePrice, city } = await params;

  const gross      = Number(salary);
  const price      = Number(housePrice);

  if (!gross || !price || gross <= 0 || price <= 0) return notFound();

  const stateCode = getStateCodeForCity(city);
  if (!stateCode) return notFound();

  const col = getCostOfLivingIndex(city);

  // Net salary
  const net = calculateNetSalary({ salary: gross, state: stateCode });

  // Mortgage components
  const downPayment    = price * 0.20;
  const loanAmt        = price - downPayment;
  const monthlyPI      = monthlyMortgagePayment(loanAmt);
  const propTaxRate    = PROPERTY_TAX_BY_STATE[stateCode] ?? 0.011;
  const monthlyTax     = (price * propTaxRate) / 12;
  const monthlyIns     = (price * 0.005) / 12;   // ~0.5% homeowners insurance
  const monthlyHOA     = 0;                        // not modeled (varies widely)
  const totalMonthly   = monthlyPI + monthlyTax + monthlyIns;
  const annualHousing  = totalMonthly * 12;

  const housingRatio  = totalMonthly / net.monthlyTakeHome;
  const canAfford     = housingRatio <= 0.35;
  const comfortable   = housingRatio <= 0.28;

  // Minimum salary lenders typically require (28% front-end ratio)
  const minSalaryNeeded = Math.ceil((totalMonthly / 0.28) * 12);

  const cityName = toTitle(city);
  const stateName = toTitle(stateCode);

  const links = getInternalLinks({ salary: gross, city });

  const verdictBg   = comfortable ? "bg-green-50 border-green-200" : canAfford ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
  const verdictText = comfortable ? "text-green-800" : canAfford ? "text-yellow-800" : "text-red-800";
  const verdictMsg  = comfortable
    ? `Yes — comfortably. At ${Math.round(housingRatio * 100)}% of monthly take-home, this purchase is within the recommended 28% guideline.`
    : canAfford
    ? `Possibly — but tight. At ${Math.round(housingRatio * 100)}% of take-home pay, you exceed the 28% comfort zone but stay under the 35% maximum lenders often allow.`
    : `Difficult. At ${Math.round(housingRatio * 100)}% of take-home pay, this home would leave very little room for other expenses. You may need a ${fmtUSD(minSalaryNeeded)} salary to qualify comfortably.`;

  const faqs = [
    {
      q: `Can you afford a ${fmtUSD(price)} house on a ${fmtUSD(gross)} salary in ${cityName}?`,
      a: verdictMsg + ` Monthly housing costs (P&I + taxes + insurance) would be ${fmtUSD(totalMonthly)}, vs. monthly take-home of ${fmtUSD(net.monthlyTakeHome)}.`,
    },
    {
      q: `What is the monthly mortgage payment on a ${fmtUSD(price)} house?`,
      a: `With a 20% down payment (${fmtUSD(downPayment)}) and a 30-year fixed rate of ${(RATE_30YR * 100).toFixed(2)}%, the principal & interest payment is ${fmtUSD(Math.round(monthlyPI))}/month. Add property tax (~${fmtUSD(Math.round(monthlyTax))}/mo) and homeowners insurance (~${fmtUSD(Math.round(monthlyIns))}/mo) for a total of ~${fmtUSD(Math.round(totalMonthly))}/month.`,
    },
    {
      q: `What salary do you need to afford a ${fmtUSD(price)} house in ${cityName}?`,
      a: `Using the 28% front-end ratio guideline (housing ≤ 28% of gross monthly income), you would need a gross salary of at least ${fmtUSD(minSalaryNeeded)} to comfortably afford this home. Lenders generally allow up to 36–43% of gross income for total debt payments.`,
    },
    {
      q: `How does cost of living in ${cityName} affect home affordability?`,
      a: col !== null
        ? `${cityName} has a cost-of-living index of ${col.toFixed(2)} (1.00 = US average). ${col > 1.1 ? `At ${Math.round((col - 1) * 100)}% above average, everyday expenses will further reduce the budget left after housing costs.` : col < 0.95 ? `Being ${Math.round((1 - col) * 100)}% below average, ${cityName}'s lower everyday costs can offset some of the housing burden.` : `Overall living costs in ${cityName} are close to the national average.`}`
        : `Cost-of-living data for ${cityName} is not available.`,
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

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Affordability Calculator · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Can You Afford a {fmtUSD(price)} House on {fmtUSD(gross)}?
          </h1>
          <p className="text-gray-500 text-sm mb-5">{cityName}, {stateName}</p>

          {/* Verdict */}
          <div className={`rounded-xl border p-5 ${verdictBg}`}>
            <p className={`font-bold text-lg mb-1 ${verdictText}`}>
              {comfortable ? "✅ Yes — Affordable" : canAfford ? "⚠️ Borderline" : "❌ Likely Unaffordable"}
            </p>
            <p className={`text-sm ${verdictText}`}>{verdictMsg}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Monthly Take-Home", value: fmtUSD(net.monthlyTakeHome), sub: "after all taxes" },
            { label: "Monthly Housing Cost", value: fmtUSD(Math.round(totalMonthly)), sub: "P&I + tax + ins." },
            { label: "Housing Ratio", value: `${Math.round(housingRatio * 100)}%`, sub: comfortable ? "✓ Under 28%" : canAfford ? "⚠ 28–35%" : "✗ Over 35%" },
            { label: "Remaining Monthly", value: fmtUSD(Math.max(0, net.monthlyTakeHome - totalMonthly)), sub: "after housing" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Mortgage Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Monthly Cost Breakdown</h2>
          <div className="space-y-0">
            {[
              { label: "Home Price",             value: fmtUSD(price) },
              { label: "Down Payment (20%)",      value: `–${fmtUSD(downPayment)}` },
              { label: "Loan Amount",             value: fmtUSD(loanAmt), note: `30yr @ ${(RATE_30YR * 100).toFixed(2)}%` },
              { label: "Principal & Interest",    value: `${fmtUSD(Math.round(monthlyPI))}/mo` },
              { label: `Property Tax (~${(propTaxRate * 100).toFixed(2)}%)`, value: `${fmtUSD(Math.round(monthlyTax))}/mo` },
              { label: "Homeowners Insurance",    value: `${fmtUSD(Math.round(monthlyIns))}/mo` },
              { label: "Total Monthly Housing",   value: `${fmtUSD(Math.round(totalMonthly))}/mo`, bold: true, highlight: true },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between py-3 border-b border-gray-50 last:border-0 ${row.highlight ? "bg-blue-50 -mx-6 px-6 rounded-b-2xl mt-1" : ""}`}
              >
                <span className={`text-sm ${row.bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                  {row.label}
                  {row.note && <span className="ml-2 text-xs text-gray-400">({row.note})</span>}
                </span>
                <span className={`text-sm font-semibold ${row.highlight ? "text-blue-700" : "text-gray-900"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Salary Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Salary & Tax Breakdown</h2>
          <div className="space-y-0">
            {[
              { label: "Gross Salary",         value: fmtUSD(net.grossSalary) },
              { label: "Federal Tax",           value: `–${fmtUSD(net.federalTax)}` },
              { label: `${stateName} State Tax`, value: net.stateTax > 0 ? `–${fmtUSD(net.stateTax)}` : "$0", note: net.stateTax === 0 ? "No state tax" : undefined },
              { label: "FICA (SS + Medicare)",  value: `–${fmtUSD(net.fica.total)}` },
              { label: "Annual Take-Home",      value: fmtUSD(net.netSalary), bold: true },
              { label: "Monthly Take-Home",     value: fmtUSD(net.monthlyTakeHome), bold: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <span className={`text-sm ${row.bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                  {row.label}
                  {row.note && <span className="ml-2 text-xs text-gray-400">({row.note})</span>}
                </span>
                <span className={`text-sm font-semibold ${row.bold ? "text-green-700" : "text-gray-900"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Affordability at Other House Prices */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Affordability at Other Home Prices</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Home Price</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-500">Monthly P&I</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-500">Total/Mo</th>
                  <th className="text-right py-2 pl-4 font-medium text-gray-500">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {[200000, 300000, 400000, 500000, 600000, 750000, 1000000]
                  .filter((p) => p !== price)
                  .map((p) => {
                    const loan    = p * 0.8;
                    const mPi     = monthlyMortgagePayment(loan);
                    const mTax    = (p * (PROPERTY_TAX_BY_STATE[stateCode] ?? 0.011)) / 12;
                    const mIns    = (p * 0.005) / 12;
                    const mTotal  = mPi + mTax + mIns;
                    const ratio   = mTotal / net.monthlyTakeHome;
                    const ok      = ratio <= 0.28;
                    const tight   = ratio > 0.28 && ratio <= 0.35;
                    return (
                      <tr key={p} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-gray-700">
                          <a href={`/can-you-afford/${gross}/${p}/${city}`} className="hover:text-blue-600 hover:underline">
                            {fmtUSD(p)}
                          </a>
                        </td>
                        <td className="py-2.5 px-4 text-right text-gray-600">{fmtUSD(Math.round(mPi))}</td>
                        <td className="py-2.5 px-4 text-right text-gray-600">{fmtUSD(Math.round(mTotal))}</td>
                        <td className={`py-2.5 pl-4 text-right font-semibold ${ok ? "text-green-700" : tight ? "text-yellow-700" : "text-red-600"}`}>
                          {Math.round(ratio * 100)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Planner after housing */}
        <BudgetPlanner netMonthly={Math.max(0, net.monthlyTakeHome - Math.round(totalMonthly))} />

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
