import type { Metadata } from "next";
import CalculatorClient from "./CalculatorClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Salary After Tax Calculator (US)",
  description:
    "Calculate take-home pay after federal and state taxes. Compare salaries instantly.",
};

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">
        <CalculatorClient />
      </div>
    </main>
  );
}
