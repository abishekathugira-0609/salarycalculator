import Link from "next/link";

export const metadata = {
  title: "Disclaimer – Salary After Tax Calculator",
  description:
    "Read the disclaimer and understand the assumptions and limitations of the Salary After Tax Calculator.",
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Disclaimer
        </h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-700 text-sm">
          <p>
            The information provided by the Salary After Tax Calculator is for
            <strong> informational and educational purposes only</strong>.
          </p>

          <p>
            While we aim to keep calculations accurate and up to date, this tool
            makes standard assumptions and may not reflect your actual tax
            situation.
          </p>

          <h2 className="font-semibold text-gray-900">
            Assumptions include:
          </h2>

          <ul className="list-disc list-inside space-y-1">
            <li>Single filing status</li>
            <li>Standard deduction applied</li>
            <li>No dependents or tax credits</li>
            <li>No itemized deductions</li>
            <li>No local or city taxes (e.g. NYC)</li>
          </ul>

          <p>
            Tax laws change frequently, and individual circumstances vary.
            Therefore, the results shown should not be considered exact or
            guaranteed.
          </p>

          <p>
            This tool does <strong>not</strong> provide tax, legal, or financial
            advice. Always consult a qualified professional for advice specific
            to your situation.
          </p>

          <p>
            By using this website, you agree that the creators are not liable for
            any decisions or actions taken based on the information provided.
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
