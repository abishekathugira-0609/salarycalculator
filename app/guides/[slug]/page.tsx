import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import DataSourceBadges from "@/components/DataSourceBadges";
import ReviewedBy from "@/components/ReviewedBy";
import LastUpdated from "@/components/LastUpdated";

export const revalidate = 604800;

type GuideContent = {
  title: string;
  description: string;
  category: string;
  sources: Array<"bls" | "hud" | "irs" | "ssa" | "col">;
  body: React.ReactNode;
};

const GUIDES: Record<string, GuideContent> = {
  "how-taxes-affect-take-home-pay": {
    title: "How Taxes Affect Your Take-Home Pay",
    description:
      "A step-by-step walkthrough of federal income tax, state income tax, and FICA payroll taxes — and how each reduces your paycheck.",
    category: "Tax Basics",
    sources: ["irs", "ssa"],
    body: (
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>
          When you receive a job offer for $80,000, you won't take home $80,000.
          Three layers of taxes reduce your paycheck before it lands in your account:
          federal income tax, state income tax, and FICA payroll taxes.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">1. Federal Income Tax</h2>
        <p>
          The U.S. uses a <strong>progressive tax bracket system</strong>. You don't pay
          the same rate on every dollar — each bracket only applies to the income within
          its range. For 2026, the federal brackets for single filers are:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-semibold">Rate</th>
                <th className="text-left p-3 font-semibold">Income Range (Single)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["10%", "$0 – $11,600"],
                ["12%", "$11,601 – $47,150"],
                ["22%", "$47,151 – $100,525"],
                ["24%", "$100,526 – $191,950"],
                ["32%", "$191,951 – $243,725"],
                ["35%", "$243,726 – $609,350"],
                ["37%", "Over $609,350"],
              ].map(([rate, range]) => (
                <tr key={rate} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{rate}</td>
                  <td className="p-3 text-gray-600">{range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The <strong>standard deduction</strong> ($15,000 for single filers in 2026)
          reduces your taxable income before brackets are applied. On an $80,000 salary,
          your taxable income is $65,000 after the standard deduction.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">2. State Income Tax</h2>
        <p>
          43 states levy a state income tax on top of federal tax. Rates range from
          under 3% (North Dakota, Pennsylvania) to over 9% (California, Minnesota).
          Nine states — including Texas, Florida, and Washington — have no income tax at all.
        </p>
        <p>
          On an $80,000 salary, state tax could add anywhere from $0 (Texas) to
          roughly $5,000+ (California) in additional withholding.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">3. FICA Payroll Taxes</h2>
        <p>
          FICA taxes fund Social Security and Medicare and are applied regardless of
          which state you live in:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Social Security:</strong> 6.2% on wages up to $176,100 (2026 wage base)</li>
          <li><strong>Medicare:</strong> 1.45% on all wages</li>
        </ul>
        <p>
          Combined FICA = 7.65%, meaning an $80,000 salary generates $6,120 in payroll taxes.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Putting It Together</h2>
        <p>For an $80,000 salary in Texas (no state income tax), approximate annual take-home:</p>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-xs">
          <div className="flex justify-between"><span>Gross Salary</span><span>$80,000</span></div>
          <div className="flex justify-between text-red-600"><span>Federal Income Tax (~16%)</span><span>–$12,800</span></div>
          <div className="flex justify-between text-red-600"><span>FICA (7.65%)</span><span>–$6,120</span></div>
          <div className="flex justify-between text-gray-400"><span>State Income Tax</span><span>$0</span></div>
          <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-green-700"><span>Estimated Take-Home</span><span>~$61,080</span></div>
        </div>
        <p>
          In California, you'd subtract an additional ~$3,500–$4,500 in state tax,
          bringing take-home closer to $56,000–$57,000.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Pre-Tax Deductions Can Help</h2>
        <p>
          Contributing to a 401(k) or HSA reduces your taxable income, lowering both
          federal and state income taxes. A $5,000 annual 401(k) contribution on
          an $80,000 salary reduces your taxable income to $75,000, saving ~$1,100
          in federal taxes depending on your bracket.
        </p>
      </div>
    ),
  },

  "understanding-cost-of-living-differences": {
    title: "Understanding Cost-of-Living Differences Across U.S. Cities",
    description:
      "Why the same salary buys very different lifestyles in Austin vs. San Francisco, and how to use cost-of-living indices to compare cities accurately.",
    category: "Cost of Living",
    sources: ["hud", "col"],
    body: (
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>
          A $100,000 salary in Austin, Texas and a $100,000 salary in San Francisco
          are not equal. After accounting for rent, groceries, transportation, and
          services, the Austin salary has roughly 40–50% more purchasing power.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">What Is a Cost-of-Living Index?</h2>
        <p>
          A cost-of-living (COL) index measures how expensive a city is relative to
          a national average (typically indexed at 100). A city with a COL of 120
          is 20% more expensive than average; a city at 85 is 15% cheaper.
        </p>
        <p>
          The most widely used index is the <strong>C2ER/ACCRA Cost of Living Index</strong>,
          which surveys prices for housing, groceries, utilities, transportation,
          healthcare, and miscellaneous goods across hundreds of U.S. cities quarterly.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Key City Comparisons</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-semibold">City</th>
                <th className="text-left p-3 font-semibold">COL Index</th>
                <th className="text-left p-3 font-semibold">Avg 1BR Rent</th>
                <th className="text-left p-3 font-semibold">Equivalent of $100k</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["San Francisco, CA", "172", "$2,950", "$58,000"],
                ["New York City, NY", "163", "$2,700", "$61,000"],
                ["Seattle, WA", "140", "$2,100", "$71,000"],
                ["Denver, CO", "120", "$1,750", "$83,000"],
                ["Chicago, IL", "107", "$1,550", "$93,000"],
                ["Austin, TX", "103", "$1,450", "$97,000"],
                ["Atlanta, GA", "96", "$1,350", "$104,000"],
                ["Phoenix, AZ", "95", "$1,300", "$105,000"],
                ["Dallas, TX", "95", "$1,350", "$105,000"],
                ["Oklahoma City, OK", "83", "$900", "$120,000"],
              ].map(([city, col, rent, equiv]) => (
                <tr key={city} className="hover:bg-gray-50">
                  <td className="p-3">{city}</td>
                  <td className="p-3">{col}</td>
                  <td className="p-3">{rent}</td>
                  <td className="p-3 font-medium text-green-700">{equiv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">Equivalent purchasing power of $100,000 national-average income.</p>

        <h2 className="text-xl font-semibold text-gray-900">Housing Is the Biggest Driver</h2>
        <p>
          Rent typically accounts for 30–40% of a household budget in expensive cities
          and 20–25% in affordable ones. The HUD Fair Market Rent data shows that median
          1-bedroom rents in San Francisco ($2,950) are more than 3× those in Oklahoma
          City ($900). This single difference can consume an extra $24,000 per year.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">How to Compare Cities Fairly</h2>
        <p>
          To find the equivalent salary in a target city, use this formula:
        </p>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs">
          Equivalent Salary = Current Salary × (Target COL ÷ Current COL)
        </div>
        <p>
          Moving from Austin (COL 103) to San Francisco (COL 172) on $80,000?
          You'd need $80,000 × (172 ÷ 103) = <strong>$133,600</strong> just to maintain
          the same standard of living.
        </p>
      </div>
    ),
  },

  "how-much-salary-do-you-need-to-live-comfortably": {
    title: "How Much Salary Do You Need to Live Comfortably?",
    description:
      "Using the 50/30/20 rule and real rent data to estimate the salary required for a comfortable lifestyle in 50 major U.S. cities.",
    category: "Budgeting",
    sources: ["hud", "col", "irs"],
    body: (
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>
          "Comfortable" means different things to different people — but financially,
          it's often defined as covering needs, having discretionary spending, and
          saving for the future without financial stress.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">The 50/30/20 Framework</h2>
        <p>
          A widely used budgeting guide allocates after-tax income as:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>50%</strong> — Needs (rent, utilities, groceries, transportation, insurance)</li>
          <li><strong>30%</strong> — Wants (dining out, entertainment, travel, subscriptions)</li>
          <li><strong>20%</strong> — Savings & debt repayment (emergency fund, 401k, student loans)</li>
        </ul>
        <p>
          Working backwards from rent — the largest single expense — we can estimate the
          minimum comfortable salary for each city.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Minimum Comfortable Salary by City</h2>
        <p>
          Assumes 1-bedroom rental using HUD Fair Market Rent data. Needs = rent +
          estimated $1,000/month in other fixed costs. Comfortable salary = needs × 2
          (50% rule), grossed up for taxes.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-semibold">City</th>
                <th className="text-left p-3 font-semibold">1BR Rent</th>
                <th className="text-left p-3 font-semibold">Est. Monthly Needs</th>
                <th className="text-left p-3 font-semibold">Comfortable Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["San Francisco, CA", "$2,950", "$3,950", "$120,000+"],
                ["New York City, NY", "$2,700", "$3,700", "$110,000+"],
                ["Seattle, WA", "$2,100", "$3,100", "$90,000+"],
                ["Los Angeles, CA", "$2,200", "$3,200", "$95,000+"],
                ["Boston, MA", "$2,400", "$3,400", "$100,000+"],
                ["Denver, CO", "$1,750", "$2,750", "$80,000+"],
                ["Chicago, IL", "$1,550", "$2,550", "$75,000+"],
                ["Austin, TX", "$1,450", "$2,450", "$70,000+"],
                ["Atlanta, GA", "$1,350", "$2,350", "$68,000+"],
                ["Dallas, TX", "$1,350", "$2,350", "$68,000+"],
                ["Phoenix, AZ", "$1,300", "$2,300", "$65,000+"],
                ["Miami, FL", "$1,850", "$2,850", "$82,000+"],
                ["Nashville, TN", "$1,600", "$2,600", "$75,000+"],
                ["Memphis, TN", "$950", "$1,950", "$55,000+"],
              ].map(([city, rent, needs, salary]) => (
                <tr key={city} className="hover:bg-gray-50">
                  <td className="p-3">{city}</td>
                  <td className="p-3">{rent}</td>
                  <td className="p-3">{needs}</td>
                  <td className="p-3 font-semibold text-blue-700">{salary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">What "Comfortable" Includes</h2>
        <p>
          Beyond meeting the 50/30/20 rule, a comfortable salary should also allow:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>3–6 months of expenses in an emergency fund</li>
          <li>Contributions to a 401(k) or Roth IRA (at least enough to capture employer match)</li>
          <li>Occasional vacations and lifestyle flexibility</li>
          <li>No dependence on credit cards for routine expenses</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900">Taxes Reduce What You Keep</h2>
        <p>
          Remember that salary figures above are <em>gross</em> salaries. After federal tax,
          state tax, and FICA, a $75,000 salary in Chicago might yield ~$55,000 take-home.
          Using our calculator lets you see exactly how much each salary leaves you with.
        </p>
      </div>
    ),
  },

  "no-tax-states-explained": {
    title: "No-Tax States Explained: Are They Really Worth It?",
    description:
      "A data-driven look at the 9 states with no income tax — and whether higher property taxes, sales taxes, and cost of living offset the benefit.",
    category: "State Taxes",
    sources: ["irs", "col"],
    body: (
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>
          Nine U.S. states charge no income tax on wages: Alaska, Florida, Nevada,
          New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming.
          For a $100,000 earner, this can mean $3,000–$7,000 more in take-home pay
          annually compared to a high-tax state. But the full picture is more nuanced.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">The Nine No-Tax States</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-semibold">State</th>
                <th className="text-left p-3 font-semibold">Sales Tax</th>
                <th className="text-left p-3 font-semibold">Avg Property Tax Rate</th>
                <th className="text-left p-3 font-semibold">COL Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Texas", "6.25% + local (up to 8.25%)", "1.74%", "95"],
                ["Florida", "6% + local (up to 8%)", "0.97%", "100"],
                ["Washington", "6.5% + local (up to 10.4%)", "0.98%", "140"],
                ["Nevada", "6.85% + local (up to 8.37%)", "0.55%", "104"],
                ["Tennessee", "7% + local (up to 9.75%)", "0.67%", "92"],
                ["Wyoming", "4% + local (up to 6%)", "0.61%", "93"],
                ["Alaska", "0% state (local varies)", "1.22%", "127"],
                ["South Dakota", "4.5% + local (up to 6.5%)", "1.31%", "96"],
                ["New Hampshire", "0% on wages", "2.18%", "115"],
              ].map(([state, sales, prop, col]) => (
                <tr key={state} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{state}</td>
                  <td className="p-3">{sales}</td>
                  <td className="p-3">{prop}</td>
                  <td className="p-3">{col}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">Where No-Tax States Win Clearly</h2>
        <p>
          For high earners ($150k+), the income tax savings in Texas or Florida are
          substantial — $8,000–$15,000 per year vs. California or New York — and
          property values are often lower, partially offsetting higher property tax rates.
          Remote workers who can choose their state have the most to gain.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Where the Math Gets Complicated</h2>
        <p>
          Washington State has no income tax, but Seattle's cost of living (COL 140)
          is significantly higher than Dallas (COL 95). A $90,000 salary in Seattle
          has roughly the same real purchasing power as a $61,000 salary in Dallas.
          The income tax savings of ~$6,000 don't close that $29,000 gap.
        </p>
        <p>
          New Hampshire has no income tax on wages but has the highest average
          property tax rate in the country (2.18%). A $400,000 home costs ~$8,700/year
          in property taxes — more than most state income taxes on a $100,000 salary.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Verdict</h2>
        <p>
          No-tax states are genuinely advantageous for high earners, especially when
          combined with affordable cost of living (Tennessee, Wyoming, South Dakota).
          For middle earners in high-cost no-tax states (Washington, Nevada),
          the housing premium often outweighs the tax benefit. Always calculate
          total cost of living, not just income tax rate.
        </p>
      </div>
    ),
  },

  "salary-negotiation-using-after-tax-data": {
    title: "How to Use After-Tax Data in Salary Negotiations",
    description:
      "Most people negotiate gross salary. Here's how to think in take-home pay terms — and use cost-of-living adjustments to argue for higher compensation.",
    category: "Negotiation",
    sources: ["bls", "irs"],
    body: (
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>
          Most salary negotiations focus on a gross number. But what you actually
          take home — and how far it stretches — depends on your state, filing
          status, and where you live. Understanding after-tax data gives you leverage.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Frame the Conversation in Take-Home Pay</h2>
        <p>
          If you're negotiating a move from Austin (no state tax) to New York City,
          a $120,000 offer in NYC may leave you with less take-home than your
          current $95,000 in Texas — once NYC city tax, state tax, and cost of living
          are factored in. Use this data to justify asking for more.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">The Cost-of-Living Adjustment Argument</h2>
        <p>
          Calculate what your current salary's purchasing power is worth in the
          new city. If you earn $80,000 in Dallas (COL 95) and are moving to
          Seattle (COL 140), you'd need at least $117,900 to maintain your
          standard of living: <strong>$80,000 × (140 ÷ 95) = $117,895</strong>.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Use BLS Percentile Data</h2>
        <p>
          The Bureau of Labor Statistics publishes median and percentile wages
          by occupation and metro area. If you're a software engineer in Seattle,
          you can cite that the 75th percentile wage is $185,000 and anchor
          your negotiation there rather than accepting the median offer.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Remote Work Tax Considerations</h2>
        <p>
          If negotiating a remote position, point out that working from a
          no-tax state increases your effective compensation by 3–7%. Employers
          sometimes use this to justify lower gross offers — knowing this
          in advance lets you counter appropriately.
        </p>
      </div>
    ),
  },

  "what-is-a-good-salary-by-age": {
    title: "What Is a Good Salary by Age in the U.S.?",
    description:
      "BLS data on median wages by age group, combined with net-pay analysis to show what 'on track' looks like at 25, 35, 45, and 55.",
    category: "Salary Benchmarks",
    sources: ["bls"],
    body: (
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>
          "Am I being paid enough for my age?" is one of the most common salary
          questions. BLS data provides clear benchmarks by age group, which we
          combine with after-tax analysis to show real purchasing power at each stage.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Median Weekly Earnings by Age (BLS, 2024)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-semibold">Age Group</th>
                <th className="text-left p-3 font-semibold">Median Weekly</th>
                <th className="text-left p-3 font-semibold">Annualized</th>
                <th className="text-left p-3 font-semibold">Est. Take-Home (TX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["16–24", "$707", "$36,764", "~$30,000"],
                ["25–34", "$1,040", "$54,080", "~$42,500"],
                ["35–44", "$1,232", "$64,064", "~$49,000"],
                ["45–54", "$1,248", "$64,896", "~$49,500"],
                ["55–64", "$1,176", "$61,152", "~$47,000"],
                ["65+", "$1,024", "$53,248", "~$42,000"],
              ].map(([age, weekly, annual, takehome]) => (
                <tr key={age} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{age}</td>
                  <td className="p-3">{weekly}</td>
                  <td className="p-3">{annual}</td>
                  <td className="p-3 text-green-700 font-medium">{takehome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">Source: BLS Current Population Survey. Take-home estimates assume single filer, Texas (no state tax).</p>

        <h2 className="text-xl font-semibold text-gray-900">What "Above Average" Looks Like</h2>
        <p>
          Earning above the 75th percentile for your age group is a strong signal
          of financial progress. For ages 25–34, the 75th percentile is approximately
          $75,000–$85,000. For ages 35–44, it rises to $95,000–$110,000 depending
          on industry and location.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">High-Earning Occupations</h2>
        <p>
          Software engineers, physicians, lawyers, and financial analysts consistently
          earn above the 75th percentile for all age groups by their mid-30s. Median
          salaries for these roles at peak earning years (40–54) often exceed $120,000–$200,000.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">Beyond the Median</h2>
        <p>
          Salary is only part of total compensation. Employer 401(k) matching, health
          insurance (valued at $7,000–$15,000/year for families), RSUs, and bonuses
          can add 20–40% to the value of a compensation package. When comparing offers,
          always calculate total compensation, not just base salary.
        </p>
      </div>
    ),
  },
};

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(GUIDES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) return {};
  return buildPageMeta({
    title: `${guide.title} | Know Your Pay`,
    description: guide.description,
    canonical: `/guides/${slug}`,
  });
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = GUIDES[slug];
  if (!guide) return notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://know-your-pay.com/guides" },
      { "@type": "ListItem", position: 3, name: guide.title, item: `https://know-your-pay.com/guides/${slug}` },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url: `https://know-your-pay.com/guides/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "Know Your Pay",
      url: "https://know-your-pay.com",
    },
    author: {
      "@type": "Person",
      name: "Finance Editor",
      url: "https://know-your-pay.com/authors/finance-editor",
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
          <a href="/guides" className="hover:text-gray-700">Guides</a>
          <span>/</span>
          <span className="text-gray-700">{guide.title}</span>
        </nav>

        {/* Header */}
        <section>
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {guide.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{guide.title}</h1>
          <p className="text-gray-600 mt-3">{guide.description}</p>
          <div className="mt-4">
            <LastUpdated />
          </div>
        </section>

        {/* Reviewed by */}
        <ReviewedBy />

        {/* Article body */}
        <article className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          {guide.body}
        </article>

        {/* Data sources */}
        <DataSourceBadges sources={guide.sources} />

        {/* Related guides */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Related Guides</h2>
          <ul className="space-y-2 text-sm text-blue-600">
            {Object.entries(GUIDES)
              .filter(([s]) => s !== slug)
              .slice(0, 4)
              .map(([s, g]) => (
                <li key={s}>
                  <a href={`/guides/${s}`} className="hover:underline">{g.title} →</a>
                </li>
              ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 rounded-xl p-6 text-white text-center">
          <p className="font-semibold text-lg mb-2">See your exact take-home pay</p>
          <p className="text-blue-100 text-sm mb-4">
            Calculate your net salary after all taxes for any U.S. state.
          </p>
          <a
            href="/calculator"
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Use the Calculator
          </a>
        </section>

      </div>
    </main>
  );
}
