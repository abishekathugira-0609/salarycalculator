import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";

export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "2026 Salary & Tax Guides – Know Your Pay",
  description:
    "In-depth 2026 guides on how taxes affect take-home pay, cost-of-living differences, and how to evaluate whether a salary meets your needs.",
  canonical: "/guides",
});

const GUIDES = [
  {
    slug: "how-taxes-affect-take-home-pay",
    title: "How Taxes Affect Your Take-Home Pay",
    description:
      "A step-by-step walkthrough of federal income tax, state income tax, and FICA — and exactly how each one reduces your paycheck.",
    readTime: "6 min read",
    category: "Tax Basics",
  },
  {
    slug: "understanding-cost-of-living-differences",
    title: "Understanding Cost-of-Living Differences Across U.S. Cities",
    description:
      "Why the same salary buys very different lifestyles in Austin vs. San Francisco, and how to use cost-of-living indices to compare cities accurately.",
    readTime: "7 min read",
    category: "Cost of Living",
  },
  {
    slug: "how-much-salary-do-you-need-to-live-comfortably",
    title: "How Much Salary Do You Need to Live Comfortably?",
    description:
      "Using the 50/30/20 rule and real rent data to estimate the salary required for a comfortable lifestyle in 50 major U.S. cities.",
    readTime: "8 min read",
    category: "Budgeting",
  },
  {
    slug: "no-tax-states-explained",
    title: "No-Tax States Explained: Are They Really Worth It?",
    description:
      "A data-driven look at the 9 states with no income tax — and whether higher property taxes, sales taxes, and cost of living offset the benefit.",
    readTime: "6 min read",
    category: "State Taxes",
  },
  {
    slug: "salary-negotiation-using-after-tax-data",
    title: "How to Use After-Tax Data in Salary Negotiations",
    description:
      "Most people negotiate gross salary. Here's how to think in take-home pay terms — and use cost-of-living adjustments to argue for higher compensation.",
    readTime: "5 min read",
    category: "Negotiation",
  },
  {
    slug: "what-is-a-good-salary-by-age",
    title: "What Is a Good Salary by Age in the U.S.?",
    description:
      "BLS data on median wages by age group, combined with net-pay analysis to show what 'on track' looks like at 25, 35, 45, and 55.",
    readTime: "7 min read",
    category: "Salary Benchmarks",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Tax Basics": "bg-blue-100 text-blue-700",
  "Cost of Living": "bg-green-100 text-green-700",
  "Budgeting": "bg-yellow-100 text-yellow-700",
  "State Taxes": "bg-purple-100 text-purple-700",
  "Negotiation": "bg-orange-100 text-orange-700",
  "Salary Benchmarks": "bg-teal-100 text-teal-700",
};

export default function GuidesHub() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-10">

        {/* Header */}
        <section>
          <h1 className="text-3xl font-bold text-gray-900">Salary & Tax Guides</h1>
          <p className="mt-3 text-gray-600 max-w-2xl">
            In-depth guides to help you understand taxes, evaluate salaries, and make
            informed financial decisions — backed by government data.
          </p>
        </section>

        {/* Guide cards */}
        <section className="grid gap-5 sm:grid-cols-2">
          {GUIDES.map(({ slug, title, description, readTime, category }) => {
            const colorClass = CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-600";
            return (
              <a
                key={slug}
                href={`/guides/${slug}`}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                    {category}
                  </span>
                  <span className="text-xs text-gray-400">{readTime}</span>
                </div>
                <h2 className="text-base font-semibold text-gray-900 leading-snug">{title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                <span className="text-blue-600 text-sm font-medium mt-auto">Read guide →</span>
              </a>
            );
          })}
        </section>

        {/* Related tools */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Tools</h2>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm text-blue-600">
            {[
              { href: "/calculator", label: "Salary after-tax calculator" },
              { href: "/rankings/100000", label: "Best cities for $100k salary" },
              { href: "/faq", label: "Salary & tax FAQ" },
              { href: "/methodology", label: "Our data methodology" },
            ].map(({ href, label }) => (
              <li key={href}>
                <a href={href} className="hover:underline">{label} →</a>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </main>
  );
}
