import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CITY_COSTS } from "@/data/city-costs";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getInternalLinks } from "@/lib/internalLinks";
import { toTitle, fmtUSD, cityToSlug } from "@/lib/stateCodeMap";
import { buildPageMeta, ALL_SALARY_BUCKETS } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

// ── Seed: all salary buckets = 12 pages at build time ────────────────────────
export async function generateStaticParams() {
  return ALL_SALARY_BUCKETS.map((s) => ({ salary: s.toString() }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ salary: string }>;
}): Promise<Metadata> {
  const { salary } = await params;
  const gross = Number(salary);
  return buildPageMeta({
    title: `Cities Where ${fmtUSD(gross)} Goes Furthest (2026 Rankings)`,
    description: `Ranked list of US cities where a ${fmtUSD(gross)} salary has the most purchasing power in 2026. Sorted by take-home pay minus rent.`,
    canonical: `/rankings/${salary}`,
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function RankingsPage({
  params,
}: {
  params: Promise<{ salary: string }>;
}) {
  const { salary } = await params;
  const gross = Number(salary);
  if (!gross || gross <= 0) return notFound();

  // Build ranked list from CITY_COSTS (has stateCode + rent per city)
  const allCities = Object.values(CITY_COSTS).flat();

  const ranked = allCities
    .map((city) => {
      const net = calculateNetSalary({ salary: gross, state: city.stateCode });
      const annualRent = city.rent * 12; // city.rent is monthly 1BR
      const savingsPotential = net.netSalary - annualRent - city.other * 12;
      return {
        city: city.city,
        state: city.state,
        stateCode: city.stateCode,
        slug: cityToSlug(city.city),
        rent: city.rent,
        other: city.other,
        netSalary: net.netSalary,
        monthlyTakeHome: net.monthlyTakeHome,
        effectiveTaxRate: net.effectiveTaxRate,
        annualRent,
        savingsPotential,
        lifestyle: city.lifestyle,
      };
    })
    .sort((a, b) => b.savingsPotential - a.savingsPotential);

  const top = ranked.slice(0, 30);
  const bottom = ranked.slice(-5).reverse();

  const links = getInternalLinks({ salary: gross });

  const medalColor = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const lifestyleColors: Record<string, string> = {
    budget:   "bg-gray-100 text-gray-600",
    balanced: "bg-blue-50 text-blue-700",
    premium:  "bg-purple-50 text-purple-700",
  };

  const faqs = [
    {
      q: `Which city makes a ${fmtUSD(gross)} salary go furthest?`,
      a: `${top[0].city}, ${top[0].state} ranks #1 for a ${fmtUSD(gross)} salary, with a savings potential of ${fmtUSD(top[0].savingsPotential)} per year after rent and basic expenses. The effective tax rate in ${top[0].state} is ${top[0].effectiveTaxRate}%, and the average 1BR rent is ${fmtUSD(top[0].rent)}/month.`,
    },
    {
      q: `How is the ranking calculated?`,
      a: `Each city is ranked by annual savings potential: take-home pay (after all taxes) minus annual rent (1BR) minus estimated other living costs (food, transport, utilities). Cities in states with no income tax and lower rents score highest.`,
    },
    {
      q: `Which state offers the best tax situation for a ${fmtUSD(gross)} salary?`,
      a: `States with no income tax (Texas, Florida, Washington, Nevada) preserve more take-home pay. Combined with lower rents in cities like ${top.filter(c => ["TX","FL","TN","NV"].includes(c.stateCode)).slice(0,2).map(c => c.city).join(" and ")}, these locations typically top the rankings.`,
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
          <p className="text-sm font-medium text-blue-600 mb-2">Salary Rankings · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Cities Where {fmtUSD(gross)} Goes Furthest
          </h1>
          <p className="text-gray-500 text-sm">
            Ranked by savings potential: take-home pay minus rent and estimated living costs
          </p>

          {/* Salary navigation */}
          <div className="flex flex-wrap gap-2 mt-5">
            {ALL_SALARY_BUCKETS.filter((s: number) => s !== gross).slice(0, 7).map((s: number) => (
              <a
                key={s}
                href={`/rankings/${s}`}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
              >
                {fmtUSD(s)}
              </a>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4">
          {top.slice(0, 3).map((city, i) => (
            <a
              key={city.slug}
              href={`/is-salary-good/${gross}/${city.slug}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{medalColor(i + 1)}</div>
              <p className="font-bold text-gray-900 text-sm">{city.city}</p>
              <p className="text-xs text-gray-400">{city.state}</p>
              <p className="text-xl font-bold text-green-700 mt-3">{fmtUSD(city.savingsPotential)}</p>
              <p className="text-xs text-gray-400">savings/year</p>
              <div className="mt-3 space-y-0.5 text-xs text-gray-500">
                <div>Take-home: {fmtUSD(city.netSalary)}/yr</div>
                <div>Rent: {fmtUSD(city.rent)}/mo</div>
                <div>Tax rate: {city.effectiveTaxRate}%</div>
              </div>
            </a>
          ))}
        </div>

        {/* Full Rankings Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Full Rankings</h2>
            <p className="text-sm text-gray-400 mt-0.5">Sorted by annual savings potential</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Take-Home</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">1BR Rent</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Savings</th>
                </tr>
              </thead>
              <tbody>
                {top.map((city, i) => (
                  <tr key={city.slug} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {medalColor(i + 1) ?? <span className="text-gray-400">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/is-salary-good/${gross}/${city.slug}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {city.city}
                      </a>
                      <span className="ml-2 text-xs text-gray-400">{city.state}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${lifestyleColors[city.lifestyle]}`}>
                        {city.lifestyle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtUSD(city.netSalary)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtUSD(city.rent)}/mo</td>
                    <td className="px-4 py-3 text-right text-gray-500">{city.effectiveTaxRate}%</td>
                    <td className={`px-4 py-3 text-right font-semibold ${city.savingsPotential > 0 ? "text-green-700" : "text-red-500"}`}>
                      {city.savingsPotential > 0 ? fmtUSD(city.savingsPotential) : `–${fmtUSD(Math.abs(city.savingsPotential))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Expensive */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hardest Cities on a {fmtUSD(gross)} Salary</h2>
          <div className="space-y-3">
            {bottom.map((city, i) => (
              <div key={city.slug} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-gray-800">{city.city}</span>
                  <span className="ml-2 text-sm text-gray-400">{city.state}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${city.savingsPotential > 0 ? "text-yellow-700" : "text-red-600"}`}>
                    {city.savingsPotential > 0 ? fmtUSD(city.savingsPotential) : `–${fmtUSD(Math.abs(city.savingsPotential))}`} savings
                  </span>
                  <span className="ml-3 text-xs text-gray-400">Rent: {fmtUSD(city.rent)}/mo</span>
                </div>
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

        {/* Links */}
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
