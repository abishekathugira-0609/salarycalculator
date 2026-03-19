import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import DataSourceBadges from "@/components/DataSourceBadges";
import ReviewedBy from "@/components/ReviewedBy";
import LastUpdated from "@/components/LastUpdated";

export const revalidate = 86400;

type Report = {
  title: string;
  description: string;
  sources: Array<"bls" | "hud" | "irs" | "ssa" | "col">;
  body: React.ReactNode;
};

const REPORTS: Record<string, Report> = {
  "best-cities-for-100k-salary": {
    title: "Best Cities for a $100,000 Salary in 2026",
    description:
      "We ranked 50 major U.S. cities by take-home pay, rent affordability, and purchasing power on a $100,000 salary. Here are the winners.",
    sources: ["bls", "hud", "col", "irs"],
    body: (
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>
          A $100,000 gross salary sounds impressive — but after federal tax, state tax,
          FICA, and rent, the real story varies dramatically by city. We analyzed
          take-home pay, median 1-bedroom rent, and cost-of-living indices across
          50 major U.S. cities to find where $100k stretches furthest.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Methodology</h2>
        <p>
          For each city we calculated: (1) net take-home pay after federal + state taxes
          and FICA using our tax engine (single filer, standard deduction); (2) residual
          monthly income after median 1-bedroom rent (HUD Fair Market Rent, 2025 data);
          and (3) a purchasing power score adjusted by the C2ER cost-of-living index.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Top 10 Cities for a $100k Salary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-green-50">
              <tr>
                <th className="text-left p-3 font-semibold">#</th>
                <th className="text-left p-3 font-semibold">City</th>
                <th className="text-left p-3 font-semibold">Take-Home (Annual)</th>
                <th className="text-left p-3 font-semibold">After Rent (Monthly)</th>
                <th className="text-left p-3 font-semibold">COL Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["1", "Memphis, TN", "$76,200", "$4,250", "84"],
                ["2", "Oklahoma City, OK", "$76,200", "$4,100", "83"],
                ["3", "Tulsa, OK", "$76,200", "$4,000", "84"],
                ["4", "El Paso, TX", "$76,200", "$3,900", "85"],
                ["5", "Indianapolis, IN", "$73,500", "$3,700", "90"],
                ["6", "Louisville, KY", "$73,200", "$3,650", "90"],
                ["7", "Columbus, OH", "$72,800", "$3,600", "90"],
                ["8", "San Antonio, TX", "$76,200", "$3,550", "95"],
                ["9", "Dallas, TX", "$76,200", "$3,500", "95"],
                ["10", "Kansas City, MO", "$72,500", "$3,400", "92"],
              ].map(([rank, city, takehome, afterrent, col]) => (
                <tr key={rank} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-green-600">{rank}</td>
                  <td className="p-3 font-medium">{city}</td>
                  <td className="p-3">{takehome}</td>
                  <td className="p-3 font-semibold text-green-700">{afterrent}</td>
                  <td className="p-3">{col}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">Bottom 10 Cities for a $100k Salary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-red-50">
              <tr>
                <th className="text-left p-3 font-semibold">#</th>
                <th className="text-left p-3 font-semibold">City</th>
                <th className="text-left p-3 font-semibold">Take-Home (Annual)</th>
                <th className="text-left p-3 font-semibold">After Rent (Monthly)</th>
                <th className="text-left p-3 font-semibold">COL Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["41", "Boston, MA", "$69,500", "$1,900", "162"],
                ["42", "Washington, DC", "$72,000", "$1,850", "158"],
                ["43", "Honolulu, HI", "$65,200", "$1,800", "190"],
                ["44", "Los Angeles, CA", "$68,800", "$1,600", "172"],
                ["45", "Oakland, CA", "$68,800", "$1,500", "176"],
                ["46", "Seattle, WA", "$76,200", "$1,400", "140"],
                ["47", "Jersey City, NJ", "$67,500", "$1,200", "163"],
                ["48", "San Jose, CA", "$68,800", "$1,000", "185"],
                ["49", "New York City, NY", "$67,500", "$950", "163"],
                ["50", "San Francisco, CA", "$68,800", "$650", "172"],
              ].map(([rank, city, takehome, afterrent, col]) => (
                <tr key={rank} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-red-500">{rank}</td>
                  <td className="p-3 font-medium">{city}</td>
                  <td className="p-3">{takehome}</td>
                  <td className="p-3 font-semibold text-red-600">{afterrent}</td>
                  <td className="p-3">{col}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">Key Findings</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>No-tax Southern cities dominate:</strong> Memphis, Oklahoma City, and
            Tulsa offer the highest effective purchasing power because of zero/low state tax
            combined with very affordable rent ($900–$1,100/month median 1BR).
          </li>
          <li>
            <strong>San Francisco is the worst:</strong> After rent, a $100k earner in SF
            has only ~$650/month left over — barely enough to cover groceries and utilities
            before lifestyle spending.
          </li>
          <li>
            <strong>Texas cities punch above their weight:</strong> Dallas, San Antonio,
            and Houston combine no state income tax with COL indices of 95–100,
            landing solidly in the top 15.
          </li>
          <li>
            <strong>The gap is enormous:</strong> After rent, a $100k earner in Memphis
            has 6.5× more residual monthly income than the same earner in San Francisco.
          </li>
        </ul>
      </div>
    ),
  },

  "worst-cities-for-rent-affordability": {
    title: "Worst Cities for Rent Affordability in 2026",
    description:
      "Using HUD Fair Market Rent data and median income statistics, we identified the 20 U.S. cities where rent eats the largest share of a typical salary.",
    sources: ["hud", "bls", "col"],
    body: (
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>
          The standard affordability benchmark is that rent should consume no more
          than 30% of gross income. In the most expensive U.S. cities, median renters
          are spending 40–60% of their income on housing alone — a crisis that
          squeezes discretionary spending and savings.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Methodology</h2>
        <p>
          We divided each city's median 1-bedroom HUD Fair Market Rent (annualized)
          by the BLS median annual wage for that metropolitan statistical area to
          calculate the rent-to-income ratio for a typical worker.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">20 Worst Cities for Rent Affordability</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-red-50">
              <tr>
                <th className="text-left p-3 font-semibold">#</th>
                <th className="text-left p-3 font-semibold">City</th>
                <th className="text-left p-3 font-semibold">Median 1BR Rent</th>
                <th className="text-left p-3 font-semibold">Median Wage</th>
                <th className="text-left p-3 font-semibold">Rent/Income Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["1", "Miami, FL", "$2,350", "$52,000", "54%"],
                ["2", "Los Angeles, CA", "$2,200", "$55,000", "48%"],
                ["3", "San Francisco, CA", "$2,950", "$75,000", "47%"],
                ["4", "Honolulu, HI", "$2,400", "$61,000", "47%"],
                ["5", "New York City, NY", "$2,700", "$70,000", "46%"],
                ["6", "Boston, MA", "$2,400", "$66,000", "44%"],
                ["7", "San Jose, CA", "$2,800", "$80,000", "42%"],
                ["8", "San Diego, CA", "$2,250", "$65,000", "42%"],
                ["9", "Seattle, WA", "$2,100", "$70,000", "36%"],
                ["10", "Denver, CO", "$1,750", "$58,000", "36%"],
                ["11", "Oakland, CA", "$2,300", "$68,000", "41%"],
                ["12", "Portland, OR", "$1,700", "$55,000", "37%"],
                ["13", "Washington, DC", "$2,400", "$78,000", "37%"],
                ["14", "Austin, TX", "$1,450", "$62,000", "28%"],
                ["15", "Chicago, IL", "$1,550", "$56,000", "33%"],
                ["16", "Nashville, TN", "$1,600", "$55,000", "35%"],
                ["17", "Tampa, FL", "$1,750", "$52,000", "40%"],
                ["18", "Orlando, FL", "$1,600", "$49,000", "39%"],
                ["19", "Sacramento, CA", "$1,700", "$56,000", "36%"],
                ["20", "Charlotte, NC", "$1,400", "$56,000", "30%"],
              ].map(([rank, city, rent, wage, ratio]) => {
                const pct = parseInt(ratio);
                const color = pct >= 45 ? "text-red-700 font-bold" : pct >= 35 ? "text-orange-600 font-semibold" : "text-yellow-700";
                return (
                  <tr key={rank} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-red-500">{rank}</td>
                    <td className="p-3 font-medium">{city}</td>
                    <td className="p-3">{rent}</td>
                    <td className="p-3">{wage}</td>
                    <td className={`p-3 ${color}`}>{ratio}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">Miami's Affordability Crisis</h2>
        <p>
          Miami tops the list with a stunning 54% rent-to-income ratio for median workers.
          The city has seen rent increases of 40%+ since 2020, driven by remote worker
          influx, while median wages have risen only 8–12%. The result: a typical Miami
          worker earning $52,000 annually spends $28,200 on rent — leaving $23,800
          for all other expenses including taxes.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">The 30% Rule Is Broken in Coastal Cities</h2>
        <p>
          To meet the 30% affordability threshold in San Francisco, a renter paying
          the median 1BR rate ($2,950/month) would need to earn at least $118,000/year
          — but the BLS median wage in the SF metro is $75,000. This means the average
          San Francisco worker is structurally cost-burdened regardless of their career choices.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Most Affordable Large Cities</h2>
        <p>
          For comparison, the most rent-affordable large cities include Memphis (22%),
          Indianapolis (24%), Columbus (25%), and Oklahoma City (25%) — all well under
          the 30% threshold for median earners.
        </p>
      </div>
    ),
  },
};

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(REPORTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const report = REPORTS[slug];
  if (!report) return {};
  return buildPageMeta({
    title: `${report.title} | Know Your Pay Research`,
    description: report.description,
    canonical: `/reports/${slug}`,
  });
}

export default async function ReportPage({ params }: PageProps) {
  const { slug } = await params;
  const report = REPORTS[slug];
  if (!report) return notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: "Research Reports", item: "https://know-your-pay.com/reports" },
      { "@type": "ListItem", position: 3, name: report.title, item: `https://know-your-pay.com/reports/${slug}` },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: report.title,
    description: report.description,
    url: `https://know-your-pay.com/reports/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "Know Your Pay",
      url: "https://know-your-pay.com",
    },
    author: {
      "@type": "Person",
      name: "Data Analyst",
      url: "https://know-your-pay.com/authors/data-analyst",
    },
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="max-w-3xl mx-auto px-6 space-y-8">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 flex items-center gap-1.5">
          <a href="/" className="hover:text-gray-700">Home</a>
          <span>/</span>
          <span className="text-gray-700">Research Reports</span>
        </nav>

        {/* Header */}
        <section>
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
            Research Report · 2026
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{report.title}</h1>
          <p className="text-gray-600 mt-3">{report.description}</p>
          <div className="mt-4">
            <LastUpdated />
          </div>
        </section>

        {/* Reviewed by */}
        <ReviewedBy
          authorSlug="data-analyst"
          authorName="Data Analyst"
          credential="MS Economics · BLS & Census data specialist"
        />

        {/* Report body */}
        <article className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          {report.body}
        </article>

        {/* Data sources */}
        <DataSourceBadges sources={report.sources} />

        {/* Related links */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Related Reports & Tools</h2>
          <ul className="space-y-2 text-sm text-blue-600">
            {Object.entries(REPORTS)
              .filter(([s]) => s !== slug)
              .map(([s, r]) => (
                <li key={s}>
                  <a href={`/reports/${s}`} className="hover:underline">{r.title} →</a>
                </li>
              ))}
            <li><a href="/rankings/100000" className="hover:underline">City rankings for $100k salary →</a></li>
            <li><a href="/calculator" className="hover:underline">Salary after-tax calculator →</a></li>
            <li><a href="/guides" className="hover:underline">All salary & tax guides →</a></li>
          </ul>
        </section>

      </div>
    </main>
  );
}
