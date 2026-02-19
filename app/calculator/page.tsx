import type { Metadata } from "next";
import CalculatorClient from "./CalculatorClient";

export const revalidate = 86400; // 24 hours ISR

export const metadata: Metadata = {
  title: "Salary After Tax Calculator (US)",
  description:
    "Calculate take-home pay after federal and state taxes. Compare salaries instantly.",
};
const appSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Know Your Pay Salary Calculator",
  url: "https://www.know-your-pay.com/calculator",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
};

export default function CalculatorPage() {
  return (
    <><script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} /><main className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <CalculatorClient />
        </div>
      </main></>
  );
}
