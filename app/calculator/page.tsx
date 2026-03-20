import type { Metadata } from "next";
import CalculatorClient from "./CalculatorClient";

export const revalidate = 604800; // 24 hours ISR

export const metadata: Metadata = {
  title: "Free Salary Tax Calculator — Know Your Pay (2026)",
  description:
    "Calculate your exact 2026 take-home pay after federal and state taxes. Enter any salary and see instant results for all 50 states.",
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
