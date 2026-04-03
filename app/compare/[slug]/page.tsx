import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { CITY_COSTS } from "@/data/city-costs";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getRent } from "@/lib/data/rentData";
import { getCostOfLivingIndex } from "@/lib/data/costOfLiving";
import { compareSalaryAcrossCities } from "@/lib/relativeSalary";
import { getInternalLinks } from "@/lib/internalLinks";
import { getStateCodeForCity, getStatePrimaryCity, toTitle, fmtUSD, STATE_CODE_MAP } from "@/lib/stateCodeMap";
import { buildPageMeta } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 604800;
export const dynamicParams = true;

function parseSlug(slug: string): { cityA: string; cityB: string } | null {
  // slug format: "cityA-vs-cityB", e.g. "san-diego-vs-chicago"
  const idx = slug.indexOf("-vs-");
  if (idx === -1) return null;
  return { cityA: slug.slice(0, idx), cityB: slug.slice(idx + 4) };
}

// ── 25 high-traffic comparison pairs pre-built at build time ─────────────────
const POPULAR_PAIRS: [string, string][] = [
  ["new-york-city", "los-angeles"],
  ["new-york-city", "chicago"],
  ["new-york-city", "san-francisco"],
  ["new-york-city", "miami"],
  ["new-york-city", "boston"],
  ["new-york-city", "seattle"],
  ["new-york-city", "austin"],
  ["los-angeles", "san-francisco"],
  ["los-angeles", "chicago"],
  ["los-angeles", "miami"],
  ["los-angeles", "seattle"],
  ["los-angeles", "austin"],
  ["san-francisco", "seattle"],
  ["san-francisco", "chicago"],
  ["san-francisco", "austin"],
  ["chicago", "miami"],
  ["chicago", "seattle"],
  ["chicago", "austin"],
  ["seattle", "austin"],
  ["seattle", "denver"],
  ["austin", "denver"],
  ["austin", "dallas"],
  ["miami", "los-angeles"],
  ["boston", "san-francisco"],
  ["denver", "chicago"],
];

export async function generateStaticParams() {
  return POPULAR_PAIRS.flatMap(([a, b]) => [
    { slug: `${a}-vs-${b}` },
    { slug: `${b}-vs-${a}` },
  ]);
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return { title: "City Comparison" };
  const cityA = parsed.cityA in STATE_CODE_MAP ? (getStatePrimaryCity(parsed.cityA) ?? parsed.cityA) : parsed.cityA;
  const cityB = parsed.cityB in STATE_CODE_MAP ? (getStatePrimaryCity(parsed.cityB) ?? parsed.cityB) : parsed.cityB;
  const v = (cityA.length + cityB.length) % 3;
  const titles = [
    `${toTitle(cityA)} vs ${toTitle(cityB)}: Rent, Tax & Real Take-Home (2026)`,
    `${toTitle(cityA)} vs ${toTitle(cityB)} — Which City Costs Less? (2026)`,
    `${toTitle(cityA)} vs ${toTitle(cityB)}: Cost of Living Reality (2026)`,
  ];
  const stateCodeA = getStateCodeForCity(cityA);
  const stateCodeB = getStateCodeForCity(cityB);
  let description = `Compare rent, take-home pay, taxes, and purchasing power between ${toTitle(cityA)} and ${toTitle(cityB)}. Find out which city keeps more of your paycheck in 2026. See full breakdown.`;
  if (stateCodeA && stateCodeB) {
    const netA = calculateNetSalary({ salary: 100000, state: stateCodeA, filingStatus: "single", taxYear: 2026 });
    const netB = calculateNetSalary({ salary: 100000, state: stateCodeB, filingStatus: "single", taxYear: 2026 });
    const diff = Math.abs(netA.monthlyTakeHome - netB.monthlyTakeHome);
    const winner = netA.monthlyTakeHome >= netB.monthlyTakeHome ? toTitle(cityA) : toTitle(cityB);
    description = `On $100K, ${winner} puts $${diff.toLocaleString()} more/mo in your pocket after tax. Compare rent, taxes & real take-home between ${toTitle(cityA)} and ${toTitle(cityB)}. See full breakdown.`;
  }
  return buildPageMeta({
    title: titles[v],
    description,
    canonical: `/compare/${cityA}-vs-${cityB}`,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const REFERENCE_SALARIES = [60000, 100000, 150000];

function winner(a: number, b: number): { winA: boolean; winB: boolean } {
  return { winA: a > b, winB: b > a };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CompareCitiesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return notFound();

  // Resolve state slugs (e.g. "new-york") to their primary city ("new-york-city")
  function resolveCity(s: string): string {
    return s in STATE_CODE_MAP ? (getStatePrimaryCity(s) ?? s) : s;
  }
  const cityA = resolveCity(parsed.cityA);
  const cityB = resolveCity(parsed.cityB);

  // Redirect to canonical URL if slugs were resolved
  if (cityA !== parsed.cityA || cityB !== parsed.cityB) {
    permanentRedirect(`/compare/${cityA}-vs-${cityB}`);
  }

  if (cityA === cityB) return notFound();

  const scA = getStateCodeForCity(cityA);
  const scB = getStateCodeForCity(cityB);
  if (!scA || !scB) return notFound();

  const rentA = getRent(cityA);
  const rentB = getRent(cityB);
  const colA = getCostOfLivingIndex(cityA);
  const colB = getCostOfLivingIndex(cityB);
  if (!rentA || !rentB || colA === null || colB === null) return notFound();

  // Net salaries for reference amounts in each city's state
  const netRows = REFERENCE_SALARIES.map((salary) => {
    const a = calculateNetSalary({ salary, state: scA });
    const b = calculateNetSalary({ salary, state: scB });
    return { salary, a, b };
  });

  // Purchasing power comparison (base: $100k in cityA)
  const pp = compareSalaryAcrossCities(100000, cityA, cityB);

  const nameA = toTitle(cityA);
  const nameB = toTitle(cityB);
  const stateA = toTitle(scA);
  const stateB = toTitle(scB);

  const links = getInternalLinks({ city: cityA });

  const annualRentA = rentA["1br"] * 12;
  const annualRentB = rentB["1br"] * 12;

  // Savings potential at $100k
  const net100A = netRows[1].a;
  const net100B = netRows[1].b;
  const savingsA = net100A.netSalary - annualRentA;
  const savingsB = net100B.netSalary - annualRentB;
  const winA = winner(savingsA, savingsB);

  // Summary rows for comparison table
  const compareRows: { metric: string; a: string; b: string; winA?: boolean; winB?: boolean }[] = [
    {
      metric: "COL Index",
      a: colA.toFixed(2),
      b: colB.toFixed(2),
      ...winner(colB, colA), // lower COL wins (cheaper is better)
    },
    {
      metric: "1BR Monthly Rent",
      a: fmtUSD(rentA["1br"]) + "/mo",
      b: fmtUSD(rentB["1br"]) + "/mo",
      ...winner(rentB["1br"], rentA["1br"]),
    },
    {
      metric: "2BR Monthly Rent",
      a: fmtUSD(rentA["2br"]) + "/mo",
      b: fmtUSD(rentB["2br"]) + "/mo",
      ...winner(rentB["2br"], rentA["2br"]),
    },
    {
      metric: "State Income Tax",
      a: stateA,
      b: stateB,
    },
    {
      metric: "$100k Take-Home",
      a: fmtUSD(net100A.netSalary),
      b: fmtUSD(net100B.netSalary),
      ...winner(net100A.netSalary, net100B.netSalary),
    },
    {
      metric: "$100k Effective Rate",
      a: net100A.effectiveTaxRate + "%",
      b: net100B.effectiveTaxRate + "%",
      ...winner(net100B.effectiveTaxRate, net100A.effectiveTaxRate),
    },
    {
      metric: "$100k Savings Potential",
      a: fmtUSD(Math.max(0, savingsA)),
      b: fmtUSD(Math.max(0, savingsB)),
      ...winA,
    },
  ];

  const faqs = [
    {
      q: `Is ${nameA} or ${nameB} cheaper to live in?`,
      a: `${nameA} has a cost-of-living index of ${colA.toFixed(2)} while ${nameB} is ${colB.toFixed(2)} (1.00 = US average). ${colA < colB ? nameA : nameB} is cheaper overall. 1BR rent in ${nameA} is ${fmtUSD(rentA["1br"])}/month vs ${fmtUSD(rentB["1br"])}/month in ${nameB}.`,
    },
    {
      q: `How much more do you need to earn in ${colA > colB ? nameA : nameB} vs ${colA > colB ? nameB : nameA}?`,
      a: pp
        ? pp.summary + `. Cost of living in ${nameB} is ${pp.percentageDifference > 0 ? "higher" : "lower"} by ${Math.abs(pp.percentageDifference)}%.`
        : `The equivalent purchasing power calculation is unavailable for this city pair.`,
    },
    {
      q: `Which city has better after-tax income — ${nameA} or ${nameB}?`,
      a: `On a $100,000 salary, you take home ${fmtUSD(net100A.netSalary)} in ${stateA} (${nameA}) and ${fmtUSD(net100B.netSalary)} in ${stateB} (${nameB}). After accounting for rent, your annual savings potential is ${fmtUSD(Math.max(0, savingsA))} in ${nameA} vs ${fmtUSD(Math.max(0, savingsB))} in ${nameB}.`,
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
          <p className="text-sm font-medium text-blue-600 mb-2">City Comparison · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {nameA} vs {nameB}
          </h1>
          <p className="text-gray-500 text-sm">Salary, rent, taxes, and purchasing power compared</p>

          {pp && (
            <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
              <p className="text-blue-800 font-semibold text-sm">Purchasing Power</p>
              <p className="text-blue-700 mt-1">{pp.summary}</p>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
            <div className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Metric</div>
            <div className="px-5 py-3 text-sm font-bold text-gray-900 text-center border-l border-gray-100">{nameA}</div>
            <div className="px-5 py-3 text-sm font-bold text-gray-900 text-center border-l border-gray-100">{nameB}</div>
          </div>
          {compareRows.map((row, i) => (
            <div
              key={row.metric}
              className={`grid grid-cols-3 border-b border-gray-50 last:border-0 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
            >
              <div className="px-5 py-4 text-sm text-gray-600">{row.metric}</div>
              <div className={`px-5 py-4 text-sm font-semibold text-center border-l border-gray-100 ${row.winA ? "text-green-700" : "text-gray-900"}`}>
                {row.winA && <span className="mr-1">✓</span>}{row.a}
              </div>
              <div className={`px-5 py-4 text-sm font-semibold text-center border-l border-gray-100 ${row.winB ? "text-green-700" : "text-gray-900"}`}>
                {row.winB && <span className="mr-1">✓</span>}{row.b}
              </div>
            </div>
          ))}
        </div>

        {/* After-Tax Income Comparison */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">After-Tax Income by Salary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium">Gross Salary</th>
                  <th className="text-center py-2 px-4 text-gray-900 font-semibold">{nameA}<br /><span className="text-xs font-normal text-gray-400">{stateA}</span></th>
                  <th className="text-center py-2 pl-4 text-gray-900 font-semibold">{nameB}<br /><span className="text-xs font-normal text-gray-400">{stateB}</span></th>
                </tr>
              </thead>
              <tbody>
                {netRows.map(({ salary, a, b }) => {
                  const w = winner(a.netSalary, b.netSalary);
                  return (
                    <tr key={salary} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-700">{fmtUSD(salary)}</td>
                      <td className={`py-3 px-4 text-center ${w.winA ? "text-green-700 font-bold" : "text-gray-700"}`}>
                        {fmtUSD(a.netSalary)}<br />
                        <span className="text-xs text-gray-400">{fmtUSD(a.monthlyTakeHome)}/mo · {a.effectiveTaxRate}% eff.</span>
                      </td>
                      <td className={`py-3 pl-4 text-center ${w.winB ? "text-green-700 font-bold" : "text-gray-700"}`}>
                        {fmtUSD(b.netSalary)}<br />
                        <span className="text-xs text-gray-400">{fmtUSD(b.monthlyTakeHome)}/mo · {b.effectiveTaxRate}% eff.</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">More City Comparisons</h2>
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
