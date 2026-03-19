import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { calculateStateTax } from "@/lib/tax/stateTax";
import { calculateFederalTax } from "@/lib/tax/federalTax";
import { calculateFICA } from "@/lib/tax/fica";
import { getInternalLinks } from "@/lib/internalLinks";
import { stateSlugToCode, toTitle, fmtUSD } from "@/lib/stateCodeMap";
import { buildPageMeta } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

// ── Seed: top 10 states × 9 = 90 pairs at build time ─────────────────────────
const SEED_STATES = [
  "california", "texas", "florida", "new-york", "illinois",
  "washington", "georgia", "north-carolina", "colorado", "virginia",
];

export async function generateStaticParams() {
  const params = [];
  for (const liveState of SEED_STATES) {
    for (const workState of SEED_STATES) {
      if (liveState !== workState) params.push({ liveState, workState });
    }
  }
  return params;
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ liveState: string; workState: string }>;
}): Promise<Metadata> {
  const { liveState, workState } = await params;
  return buildPageMeta({
    title: `Remote Work Tax: Live in ${toTitle(liveState)}, Work in ${toTitle(workState)} (2026)`,
    description: `Tax calculator for remote workers living in ${toTitle(liveState)} and employed by a company in ${toTitle(workState)}. See state tax obligations, net pay, and strategies to minimize double taxation.`,
    canonical: `/remote-tax/${liveState}/${workState}`,
  });
}

// ── Remote tax logic ──────────────────────────────────────────────────────────

// "Convenience of employer" states tax remote workers even when working from home
// unless the employer requires them to work remotely
const CONVENIENCE_STATES = new Set(["NY", "CT", "DE", "PA", "NE"]);

const NO_INCOME_TAX = new Set(["AK", "FL", "NV", "NH", "SD", "TN", "TX", "WA", "WY"]);

function determineScenario(
  liveCode: string,
  workCode: string
): {
  title: string;
  explanation: string;
  primaryState: "live" | "work" | "both" | "neither";
  creditAvailable: boolean;
} {
  const liveNoTax  = NO_INCOME_TAX.has(liveCode);
  const workNoTax  = NO_INCOME_TAX.has(workCode);
  const convenience = CONVENIENCE_STATES.has(workCode);

  if (liveNoTax && workNoTax) {
    return {
      title: "No State Income Tax — Best Case",
      explanation: `Both ${toTitle(liveCode)} and ${toTitle(workCode)} have no state income tax. You owe zero state income tax regardless of where you work. This is the most favorable remote work scenario.`,
      primaryState: "neither",
      creditAvailable: false,
    };
  }
  if (workNoTax) {
    return {
      title: "Work State Has No Income Tax",
      explanation: `${toTitle(workCode)} has no state income tax, so your employer's state cannot tax you. You only owe income tax to ${toTitle(liveCode)}, where you physically perform your work from home.`,
      primaryState: "live",
      creditAvailable: false,
    };
  }
  if (liveNoTax) {
    return {
      title: "Live State Has No Income Tax",
      explanation: `${toTitle(liveCode)} has no state income tax, so you owe nothing to your home state. However, ${toTitle(workCode)}${convenience ? " applies the 'convenience of employer' rule, meaning it may tax your remote income even though you work from home" : " has no claim on your income if you work fully remotely from your home state"}.`,
      primaryState: convenience ? "work" : "neither",
      creditAvailable: false,
    };
  }
  if (convenience) {
    return {
      title: `"Convenience of Employer" Rule Applies`,
      explanation: `${toTitle(workCode)} applies the "convenience of employer" doctrine, which means it taxes your wages as if you worked in ${toTitle(workCode)} — even though you work remotely from ${toTitle(liveCode)}. ${toTitle(liveCode)} will also tax your income as a resident, but typically provides a credit for taxes paid to ${toTitle(workCode)}. In practice, you pay the higher of the two state tax rates.`,
      primaryState: "both",
      creditAvailable: true,
    };
  }
  return {
    title: "Standard Remote Work — Live State Taxes Apply",
    explanation: `For fully remote work, you are physically present in ${toTitle(liveCode)}, so ${toTitle(liveCode)} has the primary right to tax your income. ${toTitle(workCode)} generally cannot tax you unless you are physically present there. If your employer withholds ${toTitle(workCode)} taxes, you can claim a credit on your ${toTitle(liveCode)} return to avoid double taxation.`,
    primaryState: "live",
    creditAvailable: true,
  };
}

// ── Reference salaries for the comparison table ───────────────────────────────
const REFERENCE_SALARIES = [60000, 100000, 150000, 200000];

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function RemoteTaxPage({
  params,
}: {
  params: Promise<{ liveState: string; workState: string }>;
}) {
  const { liveState, workState } = await params;
  if (liveState === workState) return notFound();

  const liveCode = stateSlugToCode(liveState);
  const workCode = stateSlugToCode(workState);
  if (!liveCode || !workCode) return notFound();

  const scenario = determineScenario(liveCode, workCode);

  const liveStateName = toTitle(liveState);
  const workStateName = toTitle(workState);

  // Build rows for the comparison table
  const tableRows = REFERENCE_SALARIES.map((salary) => {
    const federal   = calculateFederalTax(salary);
    const fica      = calculateFICA(salary);
    const liveTax   = calculateStateTax(liveCode, salary);
    const workTax   = calculateStateTax(workCode, salary);

    // Effective state tax owed depends on scenario
    let effectiveStateTax: number;
    let creditUsed = 0;

    if (scenario.primaryState === "neither") {
      effectiveStateTax = 0;
    } else if (scenario.primaryState === "live") {
      effectiveStateTax = liveTax.tax;
    } else if (scenario.primaryState === "work") {
      effectiveStateTax = workTax.tax;
    } else {
      // both — pay work state, get partial credit from live state
      creditUsed = Math.min(liveTax.tax, workTax.tax);
      effectiveStateTax = Math.max(liveTax.tax, workTax.tax);
    }

    const netSalary = salary - federal.tax - fica.total - effectiveStateTax;
    const effectiveRate = Number(((( federal.tax + fica.total + effectiveStateTax) / salary) * 100).toFixed(1));

    return {
      salary,
      federalTax: federal.tax,
      ficaTotal: fica.total,
      liveStateTax: liveTax.tax,
      workStateTax: workTax.tax,
      effectiveStateTax,
      creditUsed,
      netSalary,
      effectiveRate,
    };
  });

  // For the hero, use $100k reference
  const hero = tableRows[1]; // $100k

  // Savings vs highest-tax alternative (working in work state physically)
  const savedByRemote = hero.workStateTax - hero.effectiveStateTax;

  const links = getInternalLinks({ state: liveState });

  const scenarioColors: Record<string, string> = {
    neither: "bg-green-50 border-green-200 text-green-800",
    live:    "bg-blue-50 border-blue-200 text-blue-800",
    work:    "bg-yellow-50 border-yellow-200 text-yellow-800",
    both:    "bg-orange-50 border-orange-200 text-orange-800",
  };

  const faqs = [
    {
      q: `Do I owe state taxes in ${workStateName} if I work remotely from ${liveStateName}?`,
      a: scenario.explanation,
    },
    {
      q: `How much state tax do I pay as a remote worker in ${liveStateName} employed by a ${workStateName} company?`,
      a: `On a $100,000 salary: ${liveStateName} state tax is ${fmtUSD(hero.liveStateTax)}, ${workStateName} state tax is ${fmtUSD(hero.workStateTax)}. With the ${scenario.title} scenario, your effective state tax obligation is ${fmtUSD(hero.effectiveStateTax)}, leaving you with ${fmtUSD(hero.netSalary)} in take-home pay.`,
    },
    {
      q: "What is the 'convenience of employer' rule?",
      a: `Several states (New York, Connecticut, Delaware, Pennsylvania, Nebraska) use the 'convenience of employer' doctrine. If your employer is based in one of these states and you work from home for your own convenience — not because your employer requires it — the employer's state can tax your wages as if you worked there. This can result in paying income taxes to two states simultaneously, though your home state usually provides a partial credit.`,
    },
    {
      q: `What can I do to reduce my remote work tax burden?`,
      a: `Key strategies: (1) If your employer requires remote work in writing, document this to defeat convenience-of-employer claims. (2) Ensure your employer withholds taxes for your live state, not the work state — you'll avoid overpaying and waiting for a refund. (3) Track any days you physically work in the work state, as you'll owe that state taxes on those days. (4) Maximize pre-tax deductions (401k, HSA) to reduce taxable income in both states simultaneously.`,
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
          <p className="text-sm font-medium text-blue-600 mb-2">Remote Work Tax Calculator · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Live in {liveStateName}, Work Remotely for {workStateName} Company
          </h1>
          <p className="text-gray-500 text-sm">
            State income tax analysis for fully remote workers · Single filer · 2026
          </p>

          {/* Scenario badge */}
          <div className={`mt-5 rounded-xl border p-5 ${scenarioColors[scenario.primaryState]}`}>
            <p className="font-bold mb-2">{scenario.title}</p>
            <p className="text-sm leading-relaxed">{scenario.explanation}</p>
          </div>
        </div>

        {/* Key Numbers (at $100k) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: `${liveStateName} State Tax`, value: fmtUSD(hero.liveStateTax), sub: `${((hero.liveStateTax / 100000) * 100).toFixed(1)}% of gross` },
            { label: `${workStateName} State Tax`, value: fmtUSD(hero.workStateTax), sub: `${((hero.workStateTax / 100000) * 100).toFixed(1)}% of gross` },
            { label: "Effective State Tax", value: fmtUSD(hero.effectiveStateTax), sub: "what you actually owe" },
            { label: "Take-Home on $100k", value: fmtUSD(hero.netSalary), sub: `${hero.effectiveRate}% effective rate` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Tax Breakdown by Salary</h2>
            <p className="text-sm text-gray-400 mt-0.5">Showing effective state tax based on your remote work scenario</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Salary</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Federal</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">FICA</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{liveStateName} Tax</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{workStateName} Tax</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owe</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Take-Home</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.salary} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-4 font-semibold text-gray-900">{fmtUSD(row.salary)}</td>
                    <td className="px-4 py-4 text-right text-gray-700">{fmtUSD(row.federalTax)}</td>
                    <td className="px-4 py-4 text-right text-gray-700">{fmtUSD(row.ficaTotal)}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{fmtUSD(row.liveStateTax)}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{fmtUSD(row.workStateTax)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-orange-700">{fmtUSD(row.effectiveStateTax)}</td>
                    <td className="px-4 py-4 text-right font-bold text-green-700">{fmtUSD(row.netSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scenario.creditAvailable && (
            <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 text-xs text-blue-700">
              * A tax credit for taxes paid to {workStateName} may reduce your {liveStateName} tax liability. Consult a tax professional for your specific situation.
            </div>
          )}
        </div>

        {/* State Tax Rates Comparison */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">State Income Tax Comparison</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { name: liveStateName, code: liveCode, tax100k: hero.liveStateTax, isNoTax: NO_INCOME_TAX.has(liveCode), isConvenience: CONVENIENCE_STATES.has(liveCode) },
              { name: workStateName, code: workCode, tax100k: hero.workStateTax, isNoTax: NO_INCOME_TAX.has(workCode), isConvenience: CONVENIENCE_STATES.has(workCode) },
            ].map((s) => (
              <div key={s.code} className="bg-gray-50 rounded-xl p-5">
                <p className="font-bold text-gray-900 text-lg">{s.name}</p>
                <p className="text-sm text-gray-400 mb-3">({s.code})</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax on $100k:</span>
                    <span className="font-semibold text-gray-900">{fmtUSD(s.tax100k)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective rate:</span>
                    <span className="font-semibold text-gray-900">{((s.tax100k / 100000) * 100).toFixed(1)}%</span>
                  </div>
                  {s.isNoTax && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">No income tax</span>
                  )}
                  {s.isConvenience && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">Convenience rule state</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Tips for Remote Workers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Remote Work Tax Tips</h2>
          <div className="space-y-4">
            {[
              {
                title: "Verify your employer withholds for the correct state",
                body: "Your employer should withhold income tax for your live state (where you physically work), not their state. If they're withholding the wrong state's taxes, update your W-4 / state withholding form.",
              },
              {
                title: "Document employer-required remote work",
                body: `If ${workStateName} uses a convenience rule, having written documentation that remote work is required by your employer — not just a personal preference — can protect you from owing ${workStateName} taxes.`,
              },
              {
                title: "Track days physically worked in the employer's state",
                body: `Even as a remote worker, days you physically travel to ${workStateName} for work are taxable by ${workStateName}. Keep records and file a nonresident return if thresholds are exceeded.`,
              },
              {
                title: "Claim the resident state tax credit",
                body: `If you end up paying taxes to both states, your live state (${liveStateName}) typically provides a credit for taxes paid to ${workStateName} on the same income, preventing full double taxation.`,
              },
            ].map((tip) => (
              <div key={tip.title} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <p className="font-semibold text-gray-900 text-sm mb-1">{tip.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{tip.body}</p>
              </div>
            ))}
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
