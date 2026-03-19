import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CITY_COSTS } from "@/data/city-costs";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { getInternalLinks } from "@/lib/internalLinks";
import { toTitle, fmtUSD, fmtCompact, cityToSlug } from "@/lib/stateCodeMap";
import { buildPageMeta, ALL_SALARY_BUCKETS } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return ALL_SALARY_BUCKETS.map((s) => ({ salary: s.toString() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ salary: string }>;
}): Promise<Metadata> {
  const { salary } = await params;
  const gross = Number(salary);
  return buildPageMeta({
    title: `${fmtUSD(gross)} Salary Leaderboard: Best & Worst US Cities (2026)`,
    description: `See how far a ${fmtUSD(gross)} salary goes in every US city. Ranked by take-home pay, rent affordability, and monthly savings in 2026.`,
    canonical: `/salary-leaderboards/${salary}`,
  });
}

type CityEntry = {
  city: string;
  state: string;
  stateCode: string;
  slug: string;
  rent: number;
  netSalary: number;
  monthlyTakeHome: number;
  effectiveTaxRate: number;
  monthlySavings: number;
  stretchRatio: number;
  grade: string;
  lifestyle: string;
};

function calcGrade(stretchRatio: number): string {
  if (stretchRatio >= 2.5) return "A+";
  if (stretchRatio >= 2.0) return "A";
  if (stretchRatio >= 1.5) return "B";
  if (stretchRatio >= 1.0) return "C";
  if (stretchRatio >= 0.5) return "D";
  return "F";
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "bg-green-100 text-green-800";
  if (grade === "B") return "bg-blue-100 text-blue-700";
  if (grade === "C") return "bg-yellow-100 text-yellow-700";
  if (grade === "D") return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

export default async function SalaryLeaderboardPage({
  params,
}: {
  params: Promise<{ salary: string }>;
}) {
  const { salary } = await params;
  const gross = Number(salary);
  if (!gross || gross <= 0) return notFound();

  const allCities = Object.values(CITY_COSTS).flat();

  const ranked: CityEntry[] = allCities
    .map((city) => {
      const net = calculateNetSalary({ salary: gross, state: city.stateCode });
      const monthlyCosts = city.rent + city.other;
      const monthlySavings = net.monthlyTakeHome - monthlyCosts;
      const stretchRatio = monthlyCosts > 0 ? net.monthlyTakeHome / monthlyCosts : 0;
      return {
        city: city.city,
        state: city.state,
        stateCode: city.stateCode,
        slug: cityToSlug(city.city),
        rent: city.rent,
        netSalary: net.netSalary,
        monthlyTakeHome: net.monthlyTakeHome,
        effectiveTaxRate: net.effectiveTaxRate,
        monthlySavings,
        stretchRatio,
        grade: calcGrade(stretchRatio),
        lifestyle: city.lifestyle,
      };
    })
    .sort((a, b) => b.stretchRatio - a.stretchRatio);

  const top20 = ranked.slice(0, 20);
  const bottom5 = ranked.slice(-5).reverse();
  const aGrade = ranked.filter((c) => c.grade.startsWith("A")).length;
  const avgTakeHome = Math.round(ranked.reduce((s, c) => s + c.monthlyTakeHome, 0) / ranked.length);

  const links = getInternalLinks({ salary: gross });

  const lifestyleColors: Record<string, string> = {
    budget: "bg-gray-100 text-gray-600",
    balanced: "bg-blue-50 text-blue-700",
    premium: "bg-purple-50 text-purple-700",
  };

  const faqs = [
    {
      q: `Which city makes a ${fmtUSD(gross)} salary go the furthest in 2026?`,
      a: `${top20[0].city}, ${top20[0].state} tops the leaderboard for a ${fmtUSD(gross)} salary. With a monthly take-home of ${fmtUSD(top20[0].monthlyTakeHome)}, a rent of ${fmtUSD(top20[0].rent)}/month, and an effective tax rate of ${top20[0].effectiveTaxRate}%, your salary stretch ratio is ${top20[0].stretchRatio.toFixed(2)}x — meaning your take-home is ${top20[0].stretchRatio.toFixed(2)} times your monthly living costs.`,
    },
    {
      q: `How is the salary leaderboard score calculated?`,
      a: `Each city is scored by its "salary stretch ratio": monthly take-home pay divided by total monthly living costs (rent + estimated other expenses). A ratio above 2.0 means you earn at least twice your monthly costs — a very comfortable position. Cities with no state income tax and lower rents consistently score highest.`,
    },
    {
      q: `What does the salary grade mean?`,
      a: `The grade summarizes how well a ${fmtUSD(gross)} salary stretches in a given city. A+ (ratio ≥ 2.5×) means your take-home is more than 2.5× your costs — excellent savings potential. A (2.0–2.5×), B (1.5–2.0×), C (1.0–1.5×), D (0.5–1.0×), and F (below 0.5×) mean tighter budgets. Only ${aGrade} cities earned an A or A+ grade for a ${fmtUSD(gross)} salary.`,
    },
    {
      q: `What is the average monthly take-home for a ${fmtUSD(gross)} salary across all US cities?`,
      a: `The average monthly take-home pay for a ${fmtUSD(gross)} salary across all tracked US cities is ${fmtUSD(avgTakeHome)}/month. Actual take-home varies by state income tax, with no-tax states like Texas and Florida offering the highest net pay, while California, New York, and Oregon take the largest portion.`,
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
          <p className="text-sm font-medium text-blue-600 mb-2">Salary Leaderboard · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {fmtUSD(gross)} Salary: Best &amp; Worst US Cities
          </h1>
          <p className="text-gray-500 text-sm mb-5">
            Ranked by salary stretch ratio — monthly take-home divided by monthly living costs
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{top20[0].grade}</p>
              <p className="text-xs text-gray-500 mt-1">Best City Grade</p>
              <p className="text-xs font-medium text-gray-700">{top20[0].city}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{fmtCompact(avgTakeHome)}/mo</p>
              <p className="text-xs text-gray-500 mt-1">Avg Take-Home</p>
              <p className="text-xs font-medium text-gray-700">across all cities</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{aGrade}</p>
              <p className="text-xs text-gray-500 mt-1">A-Grade Cities</p>
              <p className="text-xs font-medium text-gray-700">stretch ratio ≥ 2.0×</p>
            </div>
          </div>

          {/* Salary navigation */}
          <div className="flex flex-wrap gap-2 mt-6">
            {ALL_SALARY_BUCKETS.filter((s: number) => s !== gross).map((s: number) => (
              <a
                key={s}
                href={`/salary-leaderboards/${s}`}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
              >
                {fmtUSD(s)}
              </a>
            ))}
          </div>
        </div>

        {/* Top 3 Cards */}
        <div className="grid grid-cols-3 gap-4">
          {top20.slice(0, 3).map((city, i) => (
            <a
              key={city.slug}
              href={`/is-salary-good/${gross}/${city.slug}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
              <p className="font-bold text-gray-900 text-sm">{city.city}</p>
              <p className="text-xs text-gray-400">{city.state}</p>
              <span className={`inline-block mt-2 text-sm font-bold px-3 py-1 rounded-full ${gradeColor(city.grade)}`}>
                {city.grade}
              </span>
              <p className="text-lg font-bold text-green-700 mt-2">{city.stretchRatio.toFixed(2)}×</p>
              <p className="text-xs text-gray-400">stretch ratio</p>
              <div className="mt-3 space-y-0.5 text-xs text-gray-500 text-left">
                <div>Take-home: {fmtUSD(city.monthlyTakeHome)}/mo</div>
                <div>Rent: {fmtUSD(city.rent)}/mo</div>
                <div>Savings: {city.monthlySavings > 0 ? fmtUSD(city.monthlySavings) : "–" + fmtUSD(Math.abs(city.monthlySavings))}/mo</div>
              </div>
            </a>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Full Salary Leaderboard</h2>
            <p className="text-sm text-gray-400 mt-0.5">Top 20 cities — ranked by salary stretch ratio</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Take-Home/mo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rent/mo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Savings/mo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                </tr>
              </thead>
              <tbody>
                {top20.map((city, i) => (
                  <tr key={city.slug} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <a href={`/is-salary-good/${gross}/${city.slug}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {city.city}
                      </a>
                      <span className="ml-2 text-xs text-gray-400">{city.state}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${lifestyleColors[city.lifestyle] ?? "bg-gray-100 text-gray-600"}`}>
                        {city.lifestyle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtUSD(city.monthlyTakeHome)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtUSD(city.rent)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${city.monthlySavings > 0 ? "text-green-700" : "text-red-500"}`}>
                      {city.monthlySavings > 0 ? fmtUSD(city.monthlySavings) : `–${fmtUSD(Math.abs(city.monthlySavings))}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${gradeColor(city.grade)}`}>
                        {city.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worst Cities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Hardest Cities for a {fmtUSD(gross)} Salary
          </h2>
          <div className="space-y-3">
            {bottom5.map((city) => (
              <div key={city.slug} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-gray-800">{city.city}</span>
                  <span className="ml-2 text-sm text-gray-400">{city.state}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${gradeColor(city.grade)}`}>
                    {city.grade}
                  </span>
                  <span className="text-sm text-gray-500">
                    {city.stretchRatio.toFixed(2)}× ratio · rent {fmtUSD(city.rent)}/mo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Guide */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Salary Grade Guide</h2>
          <p className="text-sm text-gray-500 mb-4">
            Grade is based on how many times your monthly take-home covers your estimated monthly living costs (rent + other expenses).
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { grade: "A+", range: "2.5× and above", desc: "Excellent — very high savings" },
              { grade: "A",  range: "2.0× – 2.5×",   desc: "Great — comfortable surplus" },
              { grade: "B",  range: "1.5× – 2.0×",   desc: "Good — moderate savings" },
              { grade: "C",  range: "1.0× – 1.5×",   desc: "Tight — limited savings" },
              { grade: "D",  range: "0.5× – 1.0×",   desc: "Hard — little left over" },
              { grade: "F",  range: "Below 0.5×",     desc: "Deficit — costs exceed pay" },
            ].map((g) => (
              <div key={g.grade} className={`rounded-xl p-3 ${gradeColor(g.grade)}`}>
                <p className="text-lg font-bold">{g.grade}</p>
                <p className="text-xs font-medium opacity-80">{g.range}</p>
                <p className="text-xs opacity-70 mt-1">{g.desc}</p>
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

        {/* Related Pages */}
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
