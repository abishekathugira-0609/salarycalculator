import Link from "next/link";

export const metadata = {
  title: "About – Salary After Tax Calculator",
  description:
    "Learn about the Salary After Tax Calculator, how it works, and who it is built for.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          About Salary After Tax Calculator
        </h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-700">
          <p>
            Salary After Tax Calculator is a simple tool designed to help people
            understand their <strong>take-home pay</strong> after taxes in the
            United States.
          </p>

          <p>
            The calculator estimates federal, state, and payroll taxes using
            publicly available tax rules and standard assumptions. It is built
            to be easy to use, transparent, and helpful for everyday decisions
            like:
          </p>

          <ul className="list-disc list-inside space-y-1">
            <li>Comparing job offers</li>
            <li>Understanding how taxes affect salary</li>
            <li>Comparing take-home pay across states</li>
            <li>Planning relocations or career moves</li>
          </ul>

          <p>
            This tool is <strong>not affiliated</strong> with any government
            agency and does not provide tax, legal, or financial advice.
          </p>

          <p>
            For personalized tax guidance, consult a qualified tax professional.
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
