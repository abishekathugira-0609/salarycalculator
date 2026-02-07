import Link from "next/link";

export const metadata = {
  title: "Contact – Salary After Tax Calculator",
  description:
    "Get in touch with feedback or questions about the Salary After Tax Calculator.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Contact
        </h1>

        <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-700">
          <p>
            We welcome feedback, corrections, and suggestions to improve the
            Salary After Tax Calculator.
          </p>

          <p>
            If you notice an issue with calculations, content, or usability,
            please reach out.
          </p>

          <p className="font-medium">
            📧 Email:{" "}
            <span className="text-gray-900">
              support@example.com
            </span>
          </p>

          <p className="text-sm text-gray-600">
            (Replace this email address with your real support contact before
            launch.)
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
