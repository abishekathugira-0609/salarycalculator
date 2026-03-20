import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";

export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "Salary & Tax FAQ – Common Questions Answered | Know Your Pay",
  description:
    "Answers to the most common questions about U.S. salaries, take-home pay, income taxes, cost of living, and what makes a good salary.",
  canonical: "/faq",
});

const FAQS = [
  {
    q: "What is a good salary in the United States?",
    a: "The U.S. median household income is approximately $74,000 per year (U.S. Census Bureau, 2024). A salary above $80,000 is generally considered above average, while $100,000+ places you in the top 30% of earners nationally. However, 'good' is highly regional — $100,000 in rural Mississippi affords far more than the same salary in San Francisco.",
  },
  {
    q: "How is take-home pay calculated?",
    a: "Take-home pay is your gross salary minus federal income tax, state income tax (where applicable), and FICA payroll taxes (Social Security at 6.2% and Medicare at 1.45%). Pre-tax deductions like 401(k) contributions and health insurance premiums reduce your taxable income further.",
  },
  {
    q: "Which states have no income tax?",
    a: "As of 2026, nine states have no individual income tax on wages: Alaska, Florida, Nevada, New Hampshire (wages only), South Dakota, Tennessee, Texas, Washington, and Wyoming. Residents of these states only pay federal income tax and FICA, which significantly increases take-home pay.",
  },
  {
    q: "What is FICA and how much do I pay?",
    a: "FICA (Federal Insurance Contributions Act) covers Social Security and Medicare. You pay 6.2% for Social Security on wages up to the annual wage base ($180,700 in 2026) and 1.45% for Medicare on all wages. High earners pay an additional 0.9% Medicare surtax on income above $200,000 (single filers).",
  },
  {
    q: "What is an effective tax rate?",
    a: "Your effective tax rate is the percentage of your total income you pay in taxes, calculated as total tax ÷ gross income. It differs from your marginal tax rate, which is the rate applied to your last dollar of income. Because of progressive brackets, most people's effective rate is lower than their marginal rate.",
  },
  {
    q: "How does cost of living affect purchasing power?",
    a: "A $100,000 salary in Austin, TX has roughly 20–30% more purchasing power than the same salary in New York City or San Francisco, once you account for rent, groceries, transportation, and services. Our cost-of-living comparisons use the C2ER/ACCRA Cost of Living Index and HUD Fair Market Rent data.",
  },
  {
    q: "What salary do you need to afford rent comfortably?",
    a: "The standard rule of thumb is that rent should be no more than 30% of gross income. To afford the U.S. median 1-bedroom rent of ~$1,500/month comfortably, you'd need at least $60,000/year. In high-rent cities like NYC or San Francisco where 1-bedrooms average $2,500–$3,500, you'd need $100,000–$140,000.",
  },
  {
    q: "What is the difference between gross salary and net salary?",
    a: "Gross salary is your pre-tax income — the number on your job offer or W-2. Net salary (take-home pay) is what you actually receive after all tax withholdings. For a $100,000 salary in California, net pay is typically around $69,000–$73,000 depending on filing status.",
  },
  {
    q: "How much should I contribute to my 401(k)?",
    a: "Financial advisors generally recommend contributing at least enough to get your full employer match (often 3–6% of salary), then aiming for 10–15% of gross income total. In 2026, the 401(k) employee contribution limit is $23,500. Contributions reduce your taxable income dollar-for-dollar.",
  },
  {
    q: "What is the standard deduction for 2026?",
    a: "For 2026, the IRS standard deduction is $15,000 for single filers and $30,000 for married filing jointly. This amount is subtracted from your gross income before federal tax brackets are applied, reducing your taxable income significantly.",
  },
  {
    q: "How are salary percentiles calculated?",
    a: "Salary percentiles come from the Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS) survey, which collects data from approximately 1.1 million business establishments annually. The 10th, 25th, 50th (median), 75th, and 90th percentile wages are published by occupation and metropolitan area.",
  },
  {
    q: "Is overtime taxed differently?",
    a: "Overtime pay is taxed at the same rates as regular income — there is no special overtime tax bracket. However, because overtime pushes your annual income higher, a larger portion of your total income may fall into a higher marginal bracket, increasing your effective tax rate slightly.",
  },
];

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: "FAQ", item: "https://know-your-pay.com/faq" },
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-3xl mx-auto px-6 space-y-10">

        {/* Header */}
        <section>
          <h1 className="text-3xl font-bold text-gray-900">
            Salary & Tax FAQ
          </h1>
          <p className="mt-3 text-gray-600">
            Answers to the most common questions about U.S. salaries, income taxes,
            take-home pay, and cost of living.
          </p>
        </section>

        {/* FAQ List */}
        <section className="space-y-4">
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2">{q}</h2>
              <p className="text-gray-700 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </section>

        {/* Related links */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Resources</h2>
          <ul className="space-y-2 text-sm text-blue-600">
            {[
              { href: "/methodology", label: "How we calculate taxes — full methodology" },
              { href: "/guides", label: "Salary & tax guides" },
              { href: "/calculator", label: "Salary after-tax calculator" },
              { href: "/rankings/100000", label: "Best cities for a $100k salary" },
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
