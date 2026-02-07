import Link from "next/link";

export const metadata = {
  title: "Salary After Tax Calculator (US) – 2025",
  description:
    "Calculate take-home pay after federal and state taxes for US salaries. See net salary, tax breakdown, and effective tax rate for California, New York, Texas, and Florida.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-6">

        {/* Hero */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Salary After Tax Calculator (US)
        </h1>

        <p className="text-lg text-gray-700 mb-6">
          See your <strong>take-home pay</strong> after federal and state taxes
          for US salaries. Updated for <strong>2025</strong>.
        </p>

        {/* PRIMARY CTA */}
        <div className="mb-12">
          <Link
            href="/calculator"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
          >
            Calculate your salary →
          </Link>
        </div>

        {/* How it works */}
        <section className="bg-white rounded-xl shadow p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700">
            <div>
              <p className="font-semibold mb-1">1. Enter your salary</p>
              <p className="text-sm">
                Input your annual gross salary and select your state.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">2. We calculate taxes</p>
              <p className="text-sm">
                Federal, state, and payroll taxes are applied using 2025 rules.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">3. See your take-home pay</p>
              <p className="text-sm">
                View net salary, effective tax rate, and pay breakdowns.
              </p>
            </div>
          </div>
        </section>

        {/* Example links */}
        <section className="bg-white rounded-xl shadow p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Popular salary examples
          </h2>

          <ul className="space-y-2 text-blue-600">
            <li>
              <Link href="/salary/120000-california">
                $120,000 salary in California → take-home pay
              </Link>
            </li>
            <li>
              <Link href="/salary/120000-new-york">
                $120,000 salary in New York → take-home pay
              </Link>
            </li>
            <li>
              <Link href="/salary/120000-texas">
                $120,000 salary in Texas → take-home pay
              </Link>
            </li>
            <li>
              <Link href="/salary/120000-florida">
                $120,000 salary in Florida → take-home pay
              </Link>
            </li>
          </ul>
        </section>

        {/* What we show */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-lg mb-2">
              What’s included
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Federal income tax (2025)</li>
              <li>State income tax (CA, NY)</li>
              <li>Payroll taxes (Social Security & Medicare)</li>
              <li>Net salary & effective tax rate</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-lg mb-2">
              Who this is for
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Job seekers comparing offers</li>
              <li>Employees planning relocation</li>
              <li>Anyone curious about take-home pay</li>
            </ul>
          </div>
        </section>

        {/* Trust & disclaimer */}
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-12 text-sm text-gray-700">
          <h3 className="text-lg font-semibold mb-2">
            Important notes
          </h3>

          <ul className="list-disc list-inside space-y-1">
            <li>Calculations are based on U.S. tax rules for the 2025 tax year</li>
            <li>Assumes single filer using the standard deduction</li>
            <li>No dependents, credits, or itemized deductions included</li>
            <li>Local taxes (e.g. NYC) are not included</li>
            <li>
              Results are estimates for informational purposes only
            </li>
          </ul>

          <p className="mt-3">
            For details on assumptions, see a{" "}
            <Link
              href="/disclaimer"
              className="text-blue-600 underline"
            >
              full disclaimer
            </Link>.
          </p>
        </section>

        {/* Secondary CTA */}
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-16">
          <h3 className="text-xl font-semibold mb-2">
            Explore salary pages
          </h3>
          <p className="text-gray-700 mb-4">
            Browse detailed salary breakdowns by income and state.
          </p>
          <Link
            href="/salary/100000-california"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            View example salary →
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t pt-6 text-sm text-gray-600 flex flex-col sm:flex-row justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Salary After Tax Calculator
          </p>

          <div className="flex gap-4">
            <Link href="/about" className="hover:underline">
              About
            </Link>
            <Link href="/disclaimer" className="hover:underline">
              Disclaimer
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
          </div>
        </footer>

      </div>
    </main>
  );
}
