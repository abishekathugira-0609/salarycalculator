import Link from "next/link";

export const metadata = {
  title: "About Know Your Pay – Salary After Tax Calculator",
  description:
    "Learn how Know Your Pay calculates take-home salary after tax, our data sources, and the methodology behind our U.S. salary and tax tools.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          About Know Your Pay
        </h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-5 text-gray-700">

          <p>
            <strong>Know Your Pay</strong> is an independent salary intelligence
            platform designed to help people understand their
            <strong> take-home pay after taxes</strong> in the United States.
          </p>

          <p>
            We built this tool to make salary decisions clearer. Whether you're
            comparing job offers, relocating to a new state, negotiating a raise,
            or simply trying to understand how taxes affect your income,
            Know Your Pay provides transparent and structured breakdowns.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">
            How Our Calculator Works
          </h2>

          <p>
            Our estimates are based on publicly available U.S. federal and state
            tax rules, including:
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>IRS federal income tax brackets</li>
            <li>State income tax tables</li>
            <li>Social Security and Medicare payroll taxes</li>
            <li>Standard deduction assumptions (single filer unless specified)</li>
          </ul>

          <p>
            Calculations are updated annually to reflect the latest tax year.
            Each page clearly indicates the tax year used in the estimate.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">
            What This Tool Is For
          </h2>

          <ul className="list-disc list-inside space-y-1">
            <li>Comparing take-home pay across states</li>
            <li>Understanding effective tax rates</li>
            <li>Evaluating whether a salary is “enough” in a specific location</li>
            <li>Planning relocation or career changes</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">
            Important Disclaimer
          </h2>

          <p>
            Know Your Pay is an informational tool only. We are not affiliated
            with the IRS or any government agency. The estimates provided are
            simplified and may not account for individual tax situations,
            credits, itemized deductions, dependents, or local taxes.
          </p>

          <p>
            This website does <strong>not</strong> provide tax, legal, or
            financial advice. For personalized guidance, consult a qualified
            tax professional or licensed advisor.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">
            Transparency & Updates
          </h2>

          <p>
            We strive to keep our data current and accurate. Tax rules can
            change yearly, and we update our models accordingly. If you notice
            discrepancies or have suggestions, please contact us.
          </p>

        </div>

        <div className="mt-8 text-sm">
          <Link href="/" className="text-blue-600 underline">
            ← Back to homepage
          </Link>
        </div>

      </div>
    </main>
  );
}
