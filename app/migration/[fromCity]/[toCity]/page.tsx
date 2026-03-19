import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getRent } from "@/lib/data/rentData";
import { getCostOfLivingIndex } from "@/lib/data/costOfLiving";
import { compareSalaryAcrossCities } from "@/lib/relativeSalary";
import { getInternalLinks } from "@/lib/internalLinks";
import { getStateCodeForCity, toTitle, fmtUSD } from "@/lib/stateCodeMap";
import { buildPageMeta, SEED_CITIES } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

const MIGRATION_CITIES = SEED_CITIES.slice(0, 20);

export async function generateStaticParams() {
  const params = [];
  for (const fromCity of MIGRATION_CITIES) {
    for (const toCity of MIGRATION_CITIES) {
      if (fromCity !== toCity) params.push({ fromCity, toCity });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fromCity: string; toCity: string }>;
}): Promise<Metadata> {
  const { fromCity, toCity } = await params;
  return buildPageMeta({
    title: `Moving from ${toTitle(fromCity)} to ${toTitle(toCity)}: Salary & Cost of Living Guide (2026)`,
    description: `Planning to move from ${toTitle(fromCity)} to ${toTitle(toCity)}? See how much salary you need to maintain your lifestyle, how rent compares, and what the tax difference means for your paycheck.`,
    canonical: `/migration/${fromCity}/${toCity}`,
  });
}

const REFERENCE_SALARIES = [60000, 80000, 100000, 120000, 150000, 200000];

export default async function MigrationPage({
  params,
}: {
  params: Promise<{ fromCity: string; toCity: string }>;
}) {
  const { fromCity, toCity } = await params;
  if (!fromCity || !toCity || fromCity === toCity) return notFound();

  const scFrom = getStateCodeForCity(fromCity);
  const scTo = getStateCodeForCity(toCity);
  if (!scFrom || !scTo) return notFound();

  const rentFrom = getRent(fromCity);
  const rentTo = getRent(toCity);
  const colFrom = getCostOfLivingIndex(fromCity);
  const colTo = getCostOfLivingIndex(toCity);

  if (!rentFrom || !rentTo || colFrom === null || colTo === null) return notFound();

  const nameFrom = toTitle(fromCity);
  const nameTo = toTitle(toCity);
  const stateFrom = toTitle(scFrom);
  const stateTo = toTitle(scTo);

  // Salary equivalency at reference amounts
  const salaryRows = REFERENCE_SALARIES.map((salary) => {
    const netFrom = calculateNetSalary({ salary, state: scFrom });
    const pp = compareSalaryAcrossCities(salary, fromCity, toCity);
    const equivalentGross = pp?.equivalentSalary ?? salary;
    const netTo = calculateNetSalary({ salary: equivalentGross, state: scTo });
    return {
      salary,
      netFrom,
      equivalentGross,
      netTo,
      difference: equivalentGross - salary,
    };
  });

  // Primary comparison at $100k
  const primary = salaryRows.find((r) => r.salary === 100000) ?? salaryRows[2];
  const pp100 = compareSalaryAcrossCities(100000, fromCity, toCity);

  const colDiff = colTo !== null && colFrom !== null
    ? Number((((colTo - colFrom) / colFrom) * 100).toFixed(1))
    : 0;

  const rentDiff = Number((((rentTo["1br"] - rentFrom["1br"]) / rentFrom["1br"]) * 100).toFixed(1));

  const isToMoreExpensive = colDiff > 0;

  const links = getInternalLinks({ city: fromCity });

  const faqs = [
    {
      q: `How much salary do I need in ${nameTo} to match my ${nameFrom} income?`,
      a: pp100
        ? `${pp100.summary}. ${nameTo} has a cost-of-living index of ${colTo.toFixed(2)} vs ${colFrom.toFixed(2)} for ${nameFrom} (1.00 = US average). That's a ${Math.abs(colDiff)}% ${isToMoreExpensive ? "increase" : "decrease"} in overall living costs.`
        : `Use the salary table above to see the equivalent salary needed in ${nameTo} for common income levels.`,
    },
    {
      q: `How does rent compare between ${nameFrom} and ${nameTo}?`,
      a: `A 1-bedroom apartment in ${nameFrom} averages ${fmtUSD(rentFrom["1br"])}/month, while the same in ${nameTo} runs ${fmtUSD(rentTo["1br"])}/month — that's ${Math.abs(rentDiff)}% ${rentDiff > 0 ? "more" : "less"} in ${nameTo}. For a 2-bedroom, expect ${fmtUSD(rentFrom["2br"])}/month in ${nameFrom} vs ${fmtUSD(rentTo["2br"])}/month in ${nameTo}.`,
    },
    {
      q: `How does state income tax change when moving from ${nameFrom} to ${nameTo}?`,
      a: `On a $100,000 salary, you take home ${fmtUSD(primary.netFrom.netSalary)}/year in ${stateFrom} (effective rate: ${primary.netFrom.effectiveTaxRate}%). The equivalent salary in ${stateTo} is ${fmtUSD(primary.equivalentGross)}, giving you ${fmtUSD(primary.netTo.netSalary)}/year (effective rate: ${primary.netTo.effectiveTaxRate}%).`,
    },
    {
      q: `Is moving from ${nameFrom} to ${nameTo} a good financial decision?`,
      a: `${isToMoreExpensive
        ? `${nameTo} is ${Math.abs(colDiff)}% more expensive than ${nameFrom}. You would need a salary increase of approximately ${Math.abs(colDiff)}% to maintain the same standard of living. If your new salary offer doesn't account for this cost difference, your real purchasing power will decline.`
        : `${nameTo} is ${Math.abs(colDiff)}% cheaper than ${nameFrom}. Even at the same salary, your purchasing power would increase by roughly ${Math.abs(colDiff)}%. Rent in ${nameTo} is ${fmtUSD(rentTo["1br"])}/month for a 1BR, compared to ${fmtUSD(rentFrom["1br"])}/month in ${nameFrom}.`}`,
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

  const summaryColor = isToMoreExpensive ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100";
  const summaryText = isToMoreExpensive ? "text-orange-800" : "text-green-800";
  const summarySubText = isToMoreExpensive ? "text-orange-700" : "text-green-700";

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Relocation Guide · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Moving from {nameFrom} to {nameTo}
          </h1>
          <p className="text-gray-500 text-sm mb-5">
            Salary adjustment, rent comparison, taxes, and cost-of-living breakdown
          </p>

          {/* Summary callout */}
          {pp100 && (
            <div className={`border rounded-xl px-5 py-4 ${summaryColor}`}>
              <p className={`font-semibold text-sm ${summaryText}`}>Salary Equivalency</p>
              <p className={`mt-1 font-medium ${summarySubText}`}>{pp100.summary}</p>
              <p className={`text-sm mt-1 ${summarySubText} opacity-80`}>
                {nameTo} is {Math.abs(colDiff)}% {isToMoreExpensive ? "more expensive" : "cheaper"} than {nameFrom} overall
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "COL Index (From)", value: colFrom.toFixed(2), sub: nameFrom },
            { label: "COL Index (To)", value: colTo.toFixed(2), sub: nameTo },
            { label: "1BR Rent (From)", value: fmtUSD(rentFrom["1br"]) + "/mo", sub: nameFrom },
            { label: "1BR Rent (To)", value: fmtUSD(rentTo["1br"]) + "/mo", sub: nameTo },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Salary Equivalency Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Salary Adjustment Calculator</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              How much you need to earn in {nameTo} to match your current {nameFrom} salary
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {nameFrom} Salary
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Take-Home ({stateFrom})
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Equiv. in {nameTo}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Take-Home ({stateTo})
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody>
                {salaryRows.map(({ salary, netFrom, equivalentGross, netTo, difference }) => (
                  <tr key={salary} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{fmtUSD(salary)}</td>
                    <td className="px-5 py-4 text-right text-gray-700">
                      {fmtUSD(netFrom.netSalary)}/yr
                      <br />
                      <span className="text-xs text-gray-400">{netFrom.effectiveTaxRate}% eff. rate</span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {fmtUSD(equivalentGross)}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-700">
                      {fmtUSD(netTo.netSalary)}/yr
                      <br />
                      <span className="text-xs text-gray-400">{netTo.effectiveTaxRate}% eff. rate</span>
                    </td>
                    <td className={`px-5 py-4 text-right font-semibold ${difference > 0 ? "text-orange-600" : difference < 0 ? "text-green-700" : "text-gray-400"}`}>
                      {difference > 0 ? "+" : ""}{fmtUSD(difference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-xs text-gray-400 border-t border-gray-50">
            Positive difference = you need a higher salary in {nameTo} to maintain purchasing power.
            Negative = {nameTo} is cheaper and your purchasing power improves at the same salary.
          </p>
        </div>

        {/* Rent Comparison */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Rent Comparison</h2>
          <div className="grid grid-cols-2 gap-4">
            {(["studio", "1br", "2br", "family"] as const).map((type) => {
              const rFrom = rentFrom[type];
              const rTo = rentTo[type];
              const diff = Number((((rTo - rFrom) / rFrom) * 100).toFixed(1));
              return (
                <div key={type} className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {type === "1br" ? "1-Bedroom" : type === "2br" ? "2-Bedroom" : type === "studio" ? "Studio" : "Family (3-4BR)"}
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-400">{nameFrom}</p>
                      <p className="text-lg font-bold text-gray-900">{fmtUSD(rFrom)}/mo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{nameTo}</p>
                      <p className={`text-lg font-bold ${rTo > rFrom ? "text-orange-600" : "text-green-700"}`}>
                        {fmtUSD(rTo)}/mo
                      </p>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 font-medium ${diff > 0 ? "text-orange-600" : "text-green-700"}`}>
                    {diff > 0 ? "+" : ""}{diff}% in {nameTo}
                  </p>
                </div>
              );
            })}
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

        {/* Related Links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Pages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={`/compare/${fromCity}-vs-${toCity}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {nameFrom} vs {nameTo}: Full Cost of Living Comparison
            </a>
            <a
              href={`/city-living/${toCity}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Cost of living in {nameTo}
            </a>
            <a
              href={`/city-living/${fromCity}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Cost of living in {nameFrom}
            </a>
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
