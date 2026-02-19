import Link from "next/link";

export const metadata = {
  title: "Methodology – How We Calculate Salary After Tax",
  description:
    "Learn how Know Your Pay calculates federal, state, and payroll taxes, including data sources, assumptions, and limitations.",
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Our Calculation Methodology
        </h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-6 text-gray-700">

          <p>
            At <strong>Know Your Pay</strong>, we aim to provide transparent
            and consistent salary after-tax estimates based on publicly
            available U.S. tax data.
          </p>

          {/* Federal Tax Section */}
          <h2 className="text-xl font-semibold text-gray-900">
            1. Federal Income Tax
          </h2>

          <p>
            Federal income tax is calculated using the official IRS progressive
            tax brackets for the selected tax year.
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>Standard deduction applied (Single filer unless specified)</li>
            <li>Progressive tax brackets applied incrementally</li>
            <li>No itemized deductions assumed</li>
            <li>No federal credits included</li>
          </ul>

          <p>
            Tax brackets and standard deduction values are updated annually
            based on IRS publications.
          </p>

          {/* State Tax Section */}
          <h2 className="text-xl font-semibold text-gray-900">
            2. State Income Tax
          </h2>

          <p>
            State income tax varies by state and is calculated using one of
            three models:
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li><strong>Progressive tax states</strong> (e.g., CA, NY, NJ)</li>
            <li><strong>Flat-rate states</strong> (e.g., PA, IL, MA)</li>
            <li><strong>No income tax states</strong> (e.g., TX, FL, WA)</li>
          </ul>

          <p>
            Where applicable, standard deductions are applied based on
            state-level rules. Local taxes (such as NYC local tax) are
            excluded unless specifically noted.
          </p>

          {/* Payroll Section */}
          <h2 className="text-xl font-semibold text-gray-900">
            3. Payroll Taxes (FICA)
          </h2>

          <p>
            Payroll taxes include:
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>Social Security (6.2% up to annual wage base limit)</li>
            <li>Medicare (1.45% of total wages)</li>
          </ul>

          <p>
            Additional Medicare surtaxes for high-income earners are not
            included unless otherwise specified.
          </p>

          {/* Benefits Section */}
          <h2 className="text-xl font-semibold text-gray-900">
            4. Employer Benefits (Optional Modeling)
          </h2>

          <p>
            Some salary pages may include estimated employer contributions,
            such as:
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>401(k) employer match (assumed percentage)</li>
            <li>Employer-provided health insurance value</li>
          </ul>

          <p>
            These values are generalized estimates and may not reflect
            individual employment contracts.
          </p>

          {/* Assumptions */}
          <h2 className="text-xl font-semibold text-gray-900">
            5. Assumptions & Limitations
          </h2>

          <ul className="list-disc list-inside space-y-1">
            <li>Single filer unless specified</li>
            <li>No dependents assumed</li>
            <li>No tax credits included</li>
            <li>No itemized deductions included</li>
            <li>No state-specific credits or exemptions included</li>
          </ul>

          <p>
            Because individual tax situations vary, actual take-home pay may
            differ from these estimates.
          </p>

          {/* Data Sources */}
          <h2 className="text-xl font-semibold text-gray-900">
            6. Data Sources
          </h2>

          <p>
            Our tax models are based on publicly available information from:
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>Internal Revenue Service (IRS)</li>
            <li>Official state department of revenue publications</li>
            <li>Social Security Administration wage base limits</li>
          </ul>

          <p>
            Tax rules are reviewed and updated annually for each supported tax year.
          </p>

          {/* Disclaimer */}
          <h2 className="text-xl font-semibold text-gray-900">
            Important Disclaimer
          </h2>

          <p>
            Know Your Pay provides informational estimates only and does not
            constitute tax, legal, or financial advice. We are not affiliated
            with any government agency.
          </p>

          <p>
            For personalized advice, consult a licensed tax professional.
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
