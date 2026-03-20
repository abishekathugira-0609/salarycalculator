import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import LastUpdated from "@/components/LastUpdated";

export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "Methodology – How We Calculate Salary After Tax | Know Your Pay",
  description:
    "Learn how Know Your Pay calculates federal, state, and payroll taxes — including data sources (IRS, BLS, HUD), assumptions, and limitations.",
  canonical: "/methodology",
});

const DATA_SOURCES = [
  {
    section: "Salary Data",
    name: "Bureau of Labor Statistics — Occupational Employment & Wage Statistics (OEWS)",
    url: "https://www.bls.gov/oes/",
    detail:
      "Salary benchmarks, job-level medians, and percentile data are sourced from the BLS OEWS survey, which covers approximately 1.1 million U.S. business establishments annually.",
  },
  {
    section: "Rent Data",
    name: "HUD Fair Market Rents (FMR)",
    url: "https://www.huduser.gov/portal/datasets/fmr.html",
    detail:
      "Rent estimates for studio, 1-bedroom, 2-bedroom, and family (3–4 BR) units are sourced from HUD Fair Market Rents, updated annually. Studio rents are estimated at 78% of 1BR FMR; family units at 133% of 2BR FMR, consistent with HUD methodology.",
  },
  {
    section: "Food Cost Data",
    name: "MIT Living Wage Calculator & USDA Food Cost Plans",
    url: "https://livingwage.mit.edu/",
    detail:
      "Monthly food cost estimates by household size are based on the USDA Low-Cost Food Plan and MIT Living Wage Calculator (2024). National baselines: single adult $440/month, couple $790, family of 3 $1,050, family of 4 $1,270. All figures scaled by the city's cost-of-living index.",
  },
  {
    section: "Federal Tax Calculations",
    name: "IRS Revenue Procedures & Publication 15-T",
    url: "https://www.irs.gov/tax-professionals/tax-code-regulations-and-official-guidance",
    detail:
      "Federal income tax brackets, standard deduction amounts, and withholding tables are sourced directly from IRS publications and updated each tax year.",
  },
  {
    section: "Payroll Taxes (FICA)",
    name: "Social Security Administration — Wage Base Limits",
    url: "https://www.ssa.gov/oact/cola/cbb.html",
    detail:
      "Social Security wage base limits and Medicare rates are sourced from the Social Security Administration's annual COLA announcements.",
  },
  {
    section: "Cost-of-Living Index",
    name: "C2ER / ACCRA Cost of Living Index",
    url: "https://www.coli.org/",
    detail:
      "City-level cost-of-living comparisons use the Council for Community and Economic Research (C2ER) ACCRA index, which surveys prices for housing, groceries, utilities, transportation, and healthcare quarterly.",
  },
];

export default function MethodologyPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://know-your-pay.com" },
      { "@type": "ListItem", position: 2, name: "Methodology", item: "https://know-your-pay.com/methodology" },
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-3xl mx-auto px-6 space-y-10">

        {/* Header */}
        <section>
          <h1 className="text-3xl font-bold text-gray-900">
            Our Calculation Methodology
          </h1>
          <p className="mt-3 text-gray-600">
            Know Your Pay uses government-sourced data and IRS-compliant tax models
            to produce salary after-tax estimates. This page explains every component
            of our calculations, the data sources we rely on, and our assumptions.
          </p>
          <div className="mt-4">
            <LastUpdated />
          </div>
        </section>

        {/* Data Sources */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">Data Sources</h2>
          <p className="text-sm text-gray-600">
            All figures on Know Your Pay are derived from authoritative U.S. government
            and independent research datasets:
          </p>
          <div className="space-y-4">
            {DATA_SOURCES.map(({ section, name, url, detail }) => (
              <div key={section} className="border border-gray-100 rounded-lg p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                  {section}
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-800 hover:text-blue-600 transition-colors text-sm"
                >
                  {name} ↗
                </a>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Federal Tax */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">1. Federal Income Tax</h2>
          <p className="text-sm">
            Federal income tax is calculated using the official IRS progressive tax brackets
            for the selected tax year. We apply the standard deduction before computing tax.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Standard deduction applied (Single filer unless specified)</li>
            <li>Progressive tax brackets applied incrementally by layer</li>
            <li>No itemized deductions assumed</li>
            <li>No federal credits included (EITC, child tax credit, etc.)</li>
          </ul>
          <p className="text-sm">
            Tax brackets and standard deduction values are updated annually based on
            IRS revenue procedures published in the fall of each year.
          </p>
        </section>

        {/* State Tax */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">2. State Income Tax</h2>
          <p className="text-sm">
            State income tax varies by state and is calculated using one of three models:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Progressive tax states</strong> — e.g., California, New York, New Jersey</li>
            <li><strong>Flat-rate states</strong> — e.g., Pennsylvania (3.07%), Illinois (4.95%)</li>
            <li><strong>No income tax states</strong> — e.g., Texas, Florida, Washington</li>
          </ul>
          <p className="text-sm">
            State standard deductions or personal exemptions are applied where available.
            Local income taxes (such as NYC local tax) are excluded unless specifically noted.
            State brackets are sourced from official state department of revenue publications
            and verified annually.
          </p>
        </section>

        {/* FICA */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">3. Payroll Taxes (FICA)</h2>
          <p className="text-sm">Payroll taxes include:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Social Security: 6.2% on wages up to the annual wage base limit ($180,700 in 2026)</li>
            <li>Medicare: 1.45% on all wages (no cap)</li>
          </ul>
          <p className="text-sm">
            The additional 0.9% Medicare surtax on income over $200,000 (single) is not
            included in base calculations. Wage base limits are sourced from the Social
            Security Administration and updated each January.
          </p>
        </section>

        {/* Rent & COL */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">4. Rent & Cost-of-Living Data</h2>
          <p className="text-sm">
            Rent estimates use HUD Fair Market Rents, which represent the 40th percentile
            gross rent for standard-quality units in each metropolitan area, updated annually
            each October. We provide four housing tiers:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Studio</strong> — estimated at 78% of 1BR FMR (consistent with HUD ratio data)</li>
            <li><strong>1-Bedroom</strong> — direct HUD FMR 1BR value</li>
            <li><strong>2-Bedroom</strong> — direct HUD FMR 2BR value</li>
            <li><strong>Family (3–4 BR)</strong> — estimated at 133% of 2BR FMR</li>
          </ul>
          <p className="text-sm">
            Cost-of-living adjustments use the C2ER/ACCRA Cost of Living Index (national
            average = 1.00), expanded with per-category monthly cost estimates:
            food, transportation, utilities, and healthcare — all scaled by the city index.
          </p>
        </section>

        {/* Food costs */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">5. Food Cost Data</h2>
          <p className="text-sm">
            Monthly food cost estimates are derived from two primary sources:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>USDA Food Cost Plans (2024)</strong> — the Low-Cost Food Plan provides
              household-size-adjusted monthly food budgets at the county level
            </li>
            <li>
              <strong>MIT Living Wage Calculator (2024)</strong> — provides food cost
              components of the living wage by county and family composition
            </li>
          </ul>
          <p className="text-sm">
            National baseline figures (2026 estimate, per month):
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Single adult: $440/month</li>
            <li>Couple (2 adults): $790/month</li>
            <li>Family of 3 (2 adults + 1 child): $1,050/month</li>
            <li>Family of 4 (2 adults + 2 children): $1,270/month</li>
          </ul>
          <p className="text-sm">
            All figures are scaled by each city's cost-of-living index to reflect
            local grocery and food service price variation.
          </p>
        </section>

        {/* Salary benchmarks */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">6. Salary Benchmarks & Percentiles</h2>
          <p className="text-sm">
            Job-level salary ranges and percentile data are sourced from the Bureau of
            Labor Statistics Occupational Employment and Wage Statistics (OEWS) survey.
            National and metropolitan-area medians, 10th, 25th, 75th, and 90th percentile
            wages are published annually each May for the prior reference year.
          </p>
        </section>

        {/* Assumptions */}
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">7. Assumptions & Limitations</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Single filer unless otherwise specified</li>
            <li>No dependents assumed</li>
            <li>No tax credits (EITC, child, education) included</li>
            <li>No itemized deductions — standard deduction only</li>
            <li>No state-specific credits or exemptions beyond standard deduction</li>
            <li>No pre-tax deductions (401k, HSA) unless specifically modeled</li>
          </ul>
          <p className="text-sm">
            Because individual tax situations vary significantly, actual take-home pay
            will differ from these estimates. Use our results as a directional guide,
            not a precise tax calculation.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-sm text-gray-700">
          <p className="font-semibold text-gray-800 mb-2">Important Disclaimer</p>
          <p>
            Know Your Pay provides informational estimates only and does not constitute
            tax, legal, or financial advice. We are not affiliated with any government
            agency. Tax rules change annually — always verify current rates with a
            licensed tax professional or the IRS website.
          </p>
        </section>

        <div className="text-sm">
          <a href="/" className="text-blue-600 hover:underline">← Back to homepage</a>
        </div>

      </div>
    </main>
  );
}
