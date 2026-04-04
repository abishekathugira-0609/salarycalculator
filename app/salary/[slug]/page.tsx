import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { STATE_CODE_MAP, stateCodeToSlug } from "@/lib/stateCodeMap";
import { getTaxSavingsSuggestions } from "@/lib/tax/taxSavings";
import DataSourceBadges from "@/components/DataSourceBadges";
import ReviewedBy from "@/components/ReviewedBy";
import BudgetPlanner from "@/components/BudgetPlanner";
import { getNearbySalaries, getOtherStates, getSalaryLadder } from "@/lib/links-gen";
import { salaryLink, livingStateLink, bestCitiesLink } from "@/lib/internal-links";
import stateMediansJson from "@/data/state-medians.json";

export const revalidate = 604800;
export const dynamic = "force-static";

type PageProps = { params: Promise<{ slug: string }> };
type StateMedian = { name: string; medianHousehold: number; medianIndividual: number };

const stateMedians = stateMediansJson as Record<string, StateMedian>;

const COMPARISON_STATE_SLUGS = [
  "california", "texas", "new-york", "florida", "new-jersey",
  "pennsylvania", "illinois", "washington", "massachusetts", "minnesota",
];

function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

function pickVariant(amount: number, stateSlug: string, count: number): number {
  const hash = stateSlug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (Math.floor(amount / 1000) + hash) % count;
}

function parseSlug(slug: string): { amount: number; stateSlug: string; taxYear: 2025 | 2026 } | null {
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  let taxYear: 2025 | 2026 = 2026;
  if (/^\d{4}$/.test(lastPart)) {
    const y = parseInt(lastPart);
    if (y === 2025 || y === 2026) taxYear = y;
    parts.pop();
  }
  const amount = parseInt(parts[0]);
  if (isNaN(amount) || amount <= 0) return null;
  const stateSlug = parts.slice(1).join("-");
  if (!stateSlug) return null;
  return { amount, stateSlug, taxYear };
}

export function generateStaticParams() {
  const SEED_SALARIES = [40000, 50000, 60000, 75000, 100000, 125000, 150000, 200000, 250000, 300000];
  return Object.keys(STATE_CODE_MAP).flatMap((state) =>
    SEED_SALARIES.map((salary) => ({ slug: `${salary}-${state}-2026` }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return {};
  const { amount, stateSlug, taxYear } = parsed;
  const stateCode = STATE_CODE_MAP[stateSlug];
  if (!stateCode) return {};
  const stateName =
    stateMedians[stateCode]?.name ??
    stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const { monthlyTakeHome } = calculateNetSalary({ salary: amount, state: stateCode, filingStatus: "single", taxYear });
  const v = pickVariant(amount, stateSlug, 4);
  const titles = [
    `${fmtUSD(amount)} After Tax in ${stateName} (${taxYear}): ${fmtUSD(monthlyTakeHome)}/mo Take-Home`,
    `How Much Is ${fmtUSD(amount)} After Tax in ${stateName}? ${fmtUSD(monthlyTakeHome)}/mo (${taxYear})`,
    `What's ${fmtUSD(amount)} After Tax in ${stateName}? ${fmtUSD(monthlyTakeHome)}/mo Take-Home (${taxYear})`,
    `${fmtUSD(amount)} in ${stateName} After Taxes: ${fmtUSD(monthlyTakeHome)}/mo — Full Breakdown (${taxYear})`,
  ];
  const descs = [
    `Take home ${fmtUSD(monthlyTakeHome)}/month in ${stateName} on ${fmtUSD(amount)} after federal + state taxes. See your full tax breakdown, effective rate, and monthly budget. Full breakdown →`,
    `${fmtUSD(amount)} in ${stateName} leaves you ${fmtUSD(monthlyTakeHome)}/month after all ${taxYear} taxes. See every dollar — federal, state, FICA — plus weekly and monthly net pay.`,
    `Earning ${fmtUSD(amount)} in ${stateName}? Your real monthly take-home is ${fmtUSD(monthlyTakeHome)} after all taxes (${taxYear}). Full breakdown with effective rate and savings tips.`,
    `${fmtUSD(monthlyTakeHome)}/month take-home on ${fmtUSD(amount)} in ${stateName}. See the full ${taxYear} tax breakdown — federal, state, FICA — and exactly what you keep.`,
  ];
  return {
    title: titles[v],
    description: descs[v],
    alternates: { canonical: `/salary/${amount}-${stateSlug}-${taxYear}` },
  };
}

export default async function SalaryPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return notFound();
  const { amount, stateSlug, taxYear } = parsed;

  // Redirect slugs missing a year suffix (e.g. "100000-california" → "100000-california-2026")
  if (!/-(2025|2026)$/.test(slug)) {
    permanentRedirect(`/salary/${amount}-${stateSlug}-2026`);
  }

  // Redirect 2-letter state codes (e.g. "ca" → "california")
  if (/^[a-z]{2}$/.test(stateSlug)) {
    const fullSlug = stateCodeToSlug(stateSlug);
    if (fullSlug) permanentRedirect(`/salary/${amount}-${fullSlug}-${taxYear}`);
  }

  const stateCode = STATE_CODE_MAP[stateSlug];
  if (!stateCode) return notFound();

  // ── Live tax calculation ──────────────────────────────────────────────────
  const taxResult = calculateNetSalary({
    salary: amount,
    state: stateCode,
    filingStatus: "single",
    taxYear,
  });

  const stateInfo = stateMedians[stateCode];
  const stateName =
    stateInfo?.name ?? stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // vs. state medians
  const vsIndPct = stateInfo
    ? Math.round(((amount - stateInfo.medianIndividual) / stateInfo.medianIndividual) * 100)
    : null;
  const vsHhPct = stateInfo
    ? Math.round(((amount - stateInfo.medianHousehold) / stateInfo.medianHousehold) * 100)
    : null;

  // Tax savings tips
  const tips = getTaxSavingsSuggestions(amount, "single").slice(0, 3);

  // State comparison (live, no file reads)
  const comparisons = COMPARISON_STATE_SLUGS.map((s) => {
    const code = STATE_CODE_MAP[s];
    if (!code) return null;
    const r = calculateNetSalary({ salary: amount, state: code, filingStatus: "single", taxYear });
    const m = stateMedians[code];
    return {
      stateSlug: s,
      stateName: m?.name ?? s,
      stateCode: code,
      netSalary: r.netSalary,
      totalTax: r.totalTax,
      effectiveTaxRate: r.effectiveTaxRate,
      isCurrent: code === stateCode,
    };
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  // Ensure current state appears in the table
  if (!comparisons.some((c) => c.isCurrent)) {
    comparisons.push({
      stateSlug,
      stateName,
      stateCode,
      netSalary: taxResult.netSalary,
      totalTax: taxResult.totalTax,
      effectiveTaxRate: taxResult.effectiveTaxRate,
      isCurrent: true,
    });
  }
  comparisons.sort((a, b) => b.netSalary - a.netSalary);

  // Navigation helpers
  const nearbySalaries = getNearbySalaries(amount);
  const otherStates = getOtherStates(stateSlug);
  const ladder = getSalaryLadder(amount);

  // Tax breakdown bar items
  const taxItems = [
    { label: "Federal income tax", value: taxResult.federalTax, color: "bg-blue-500" },
    { label: "State income tax", value: taxResult.stateTax, color: "bg-orange-500" },
    { label: "Social Security", value: taxResult.fica.socialSecurity, color: "bg-purple-500" },
    { label: "Medicare", value: taxResult.fica.medicare + taxResult.fica.additionalMedicare, color: "bg-violet-400" },
    { label: "Annual take-home", value: taxResult.netSalary, color: "bg-green-500" },
  ];

  const allocationItems = [
    { label: "Take-home", pct: (taxResult.netSalary / amount) * 100, color: "bg-green-500" },
    { label: "Federal tax", pct: (taxResult.federalTax / amount) * 100, color: "bg-blue-500" },
    { label: "State tax", pct: (taxResult.stateTax / amount) * 100, color: "bg-orange-500" },
    { label: "FICA", pct: (taxResult.fica.total / amount) * 100, color: "bg-purple-500" },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the take-home pay for ${fmtUSD(amount)} in ${stateName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `A ${fmtUSD(amount)} salary in ${stateName} results in approximately ${fmtUSD(taxResult.netSalary)} per year (${fmtUSD(taxResult.monthlyTakeHome)}/month) after federal taxes, state taxes, and FICA. The effective total tax rate is ${taxResult.effectiveTaxRate}%.`,
        },
      },
      {
        "@type": "Question",
        name: `How much state income tax is paid on ${fmtUSD(amount)} in ${stateName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The estimated state income tax on ${fmtUSD(amount)} in ${stateName} is ${fmtUSD(taxResult.stateTax)} for ${taxYear}, calculated for a single filer using the standard deduction.`,
        },
      },
      {
        "@type": "Question",
        name: `Is ${fmtUSD(amount)} a good salary in ${stateName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${fmtUSD(amount)} is ${vsIndPct !== null ? (vsIndPct >= 0 ? `${vsIndPct}% above` : `${Math.abs(vsIndPct)}% below`) : "compared to"} the ${stateName} individual median income of ${fmtUSD(stateInfo?.medianIndividual ?? 0)}. Whether it supports a comfortable lifestyle depends on your city and expenses.`,
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: `${stateName} Salary Guide`, item: `https://know-your-pay.com/${stateSlug}-salary-guide` },
      { "@type": "ListItem", position: 3, name: `${fmtUSD(amount)} in ${stateName}`, item: `https://know-your-pay.com/salary/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6 space-y-8">

          {/* ── Header ────────────────────────────────────────────────────── */}
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Salary After Tax · {taxYear}</p>
              <h1 className="text-3xl font-bold text-gray-900">
                {fmtUSD(amount)} Salary in {stateName}
              </h1>
              <p className="mt-2 text-gray-500 text-sm">
                Single filer · Standard deduction · {taxYear} IRS tax brackets
              </p>
              {taxResult.stateTax === 0 && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  No state income tax
                </span>
              )}
            </div>
            <a
              href="/calculator"
              className="shrink-0 inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
            >
              Try salary calculator →
            </a>
          </header>

          {/* ── Take-home hero ────────────────────────────────────────────── */}
          <section className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <p className="text-sm text-gray-600 mb-1">Annual take-home pay</p>
            <p className="text-4xl font-bold text-green-700">{fmtUSD(taxResult.netSalary)}</p>
            <p className="text-sm text-gray-500 mt-1">
              Effective tax rate: <strong className="text-gray-700">{taxResult.effectiveTaxRate}%</strong>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { label: "Monthly take-home", value: fmtUSD(taxResult.monthlyTakeHome) },
                { label: "Bi-weekly take-home", value: fmtUSD(taxResult.biWeeklyTakeHome) },
                { label: "Total annual tax", value: fmtUSD(taxResult.totalTax) },
                { label: "Marginal federal rate", value: `${taxResult.marginalFederalRate}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className="font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tax breakdown with bars ────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax breakdown</h2>
            <div className="space-y-3">
              {taxItems.map(({ label, value, color }) => {
                const pct = (value / amount) * 100;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{label}</span>
                      <span className="font-medium text-gray-900">
                        {fmtUSD(value)}{" "}
                        <span className="text-gray-400 font-normal">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross salary</span>
                <span className="font-medium text-gray-900">{fmtUSD(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Net salary</span>
                <span className="font-semibold text-green-700">{fmtUSD(taxResult.netSalary)}</span>
              </div>
            </div>
          </section>

          {/* ── Income allocation stacked bar ─────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Income allocation</h2>
            <div className="flex h-8 rounded-xl overflow-hidden">
              {allocationItems.map(({ label, pct, color }) => (
                <div
                  key={label}
                  className={`${color}`}
                  style={{ width: `${pct}%` }}
                  title={`${label}: ${pct.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {allocationItems.map(({ label, pct, color }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                  {label} — {pct.toFixed(1)}%
                </span>
              ))}
            </div>
          </section>

          {/* ── vs. State median ──────────────────────────────────────────── */}
          {stateInfo && (
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                How {fmtUSD(amount)} compares in {stateName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">State individual median (Census ACS 2023)</p>
                  <p className="text-2xl font-bold text-gray-900">{fmtUSD(stateInfo.medianIndividual)}</p>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${vsIndPct! >= 0 ? "bg-green-400" : "bg-red-400"}`}
                      style={{ width: `${Math.min(100, Math.abs(vsIndPct! / 2) + 50)}%` }}
                    />
                  </div>
                  <p className={`text-sm font-medium mt-2 ${vsIndPct! >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {vsIndPct! >= 0 ? "+" : ""}{vsIndPct}% {vsIndPct! >= 0 ? "above" : "below"} individual median
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">State household median (Census ACS 2023)</p>
                  <p className="text-2xl font-bold text-gray-900">{fmtUSD(stateInfo.medianHousehold)}</p>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${vsHhPct! >= 0 ? "bg-green-400" : "bg-red-400"}`}
                      style={{ width: `${Math.min(100, Math.abs(vsHhPct! / 2) + 50)}%` }}
                    />
                  </div>
                  <p className={`text-sm font-medium mt-2 ${vsHhPct! >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {vsHhPct! >= 0 ? "+" : ""}{vsHhPct}% {vsHhPct! >= 0 ? "above" : "below"} household median
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── 50/30/20 Budget Planner ───────────────────────────────────── */}
          <BudgetPlanner netMonthly={taxResult.monthlyTakeHome} />

          {/* ── State comparison table ────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {fmtUSD(amount)} salary compared across states
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr className="text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-2 text-left font-medium">State</th>
                    <th className="pb-2 text-right font-medium">Take-home</th>
                    <th className="pb-2 text-right font-medium">Total tax</th>
                    <th className="pb-2 text-right font-medium">Eff. rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisons.map((c) => (
                    <tr
                      key={c.stateCode}
                      className={c.isCurrent ? "bg-blue-50 font-medium" : "hover:bg-gray-50"}
                    >
                      <td className="py-2.5">
                        <a
                          href={salaryLink(amount, c.stateSlug, taxYear)}
                          className="text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          {c.stateName}
                        </a>
                        {c.isCurrent && (
                          <span className="ml-1.5 text-xs text-blue-600 font-normal">← current</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-green-700 font-medium">
                        {fmtUSD(c.netSalary)}
                      </td>
                      <td className="py-2.5 text-right text-gray-600">{fmtUSD(c.totalTax)}</td>
                      <td className="py-2.5 text-right text-gray-600">{c.effectiveTaxRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              All figures: single filer, standard deduction, {taxYear} tax year. Sorted by highest take-home.
            </p>
          </section>

          {/* ── Tax savings tips ──────────────────────────────────────────── */}
          {tips.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Tax-reduction strategies for {fmtUSD(amount)} earners
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Based on IRS rules and 2025/2026 contribution limits
              </p>
              <div className="space-y-4">
                {tips.map((tip) => (
                  <div key={tip.title} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{tip.title}</h3>
                      <span className="shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {tip.estimatedSaving}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{tip.description}</p>
                  </div>
                ))}
              </div>
              <a href="/calculator" className="mt-4 block text-xs text-blue-600 hover:underline font-medium">
                Model pre-tax contributions in the calculator →
              </a>
            </section>
          )}

          {/* ── Salary ladder ─────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Explore other salaries in {stateName}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ladder.all.map((s) => (
                <a
                  key={s}
                  href={salaryLink(s, stateSlug, taxYear)}
                  className={`text-sm px-3 py-2 rounded-lg text-center transition ${
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

          {/* ── How it's calculated ───────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm p-6 text-sm text-gray-600 space-y-3">
            <h2 className="text-base font-semibold text-gray-800">How this is calculated</h2>
            <p>
              Based on IRS {taxYear} federal tax brackets, {stateName} state income tax rules, and{" "}
              {taxYear} Social Security Administration payroll tax rates. Assumes a single filer using
              the standard deduction with no itemized deductions or additional credits.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
              <li>Federal standard deduction ({taxYear}): $15,750 (single filer)</li>
              <li>Social Security wage base ({taxYear}): $180,700 at 6.2%</li>
              <li>Medicare: 1.45% on all wages; +0.9% on earnings above $200,000</li>
              <li>Local taxes (e.g. NYC) not included unless specified</li>
            </ul>
          </section>

          {/* ── Related links ─────────────────────────────────────────────── */}
          <section className="text-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Related salary insights</h3>
            <ul className="space-y-2 text-blue-600">
              {nearbySalaries.map((s) => (
                <li key={s}>
                  <a href={salaryLink(s, stateSlug)} className="hover:underline">
                    {fmtUSD(s)} salary after tax in {stateName} →
                  </a>
                </li>
              ))}
              <li>
                <a href={livingStateLink(amount, stateSlug)} className="hover:underline">
                  Is {fmtUSD(amount)} enough to live in {stateName}? →
                </a>
              </li>
              <li>
                <a href={bestCitiesLink(stateSlug, amount)} className="hover:underline">
                  Best cities in {stateName} for a {fmtUSD(amount)} salary →
                </a>
              </li>
              <li>
                <a href={`/${stateSlug}-salary-guide`} className="hover:underline">
                  {stateName} full salary guide →
                </a>
              </li>
              {otherStates.slice(0, 3).map((s) => (
                <li key={s}>
                  <a href={salaryLink(amount, s)} className="hover:underline">
                    {fmtUSD(amount)} salary in{" "}
                    {s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} →
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Trust signals ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReviewedBy />
            <DataSourceBadges sources={["irs", "ssa", "bls"]} />
          </div>

        </div>
      </main>
    </>
  );
}
