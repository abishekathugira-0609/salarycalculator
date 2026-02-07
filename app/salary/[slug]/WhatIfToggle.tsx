"use client";

import { useState } from "react";

type Props = {
  salary: number;
  netSalary: number;
  federalTax: number;
};

export default function WhatIfToggle({
  salary,
  netSalary,
  federalTax,
}: Props) {
  const [use401k, setUse401k] = useState(false);
  const [filingStatus, setFilingStatus] =
    useState<"single" | "married">("single");

  // Base values
  let adjustedNet = netSalary;
  let adjustedFederalTax = federalTax;

  /**
   * 401(k) logic (PRE-TAX)
   * - reduces taxable income
   * - reduces federal tax
   */
  if (use401k) {
    const contribution = salary * 0.05;

    // effective marginal rate approximation
    const effectiveFederalRate = federalTax / salary;

    const taxSavings = contribution * effectiveFederalRate;

    adjustedFederalTax = federalTax - taxSavings;

    // Net pay:
    // subtract contribution, add back tax savings
    adjustedNet = netSalary - contribution + taxSavings;
  }

  /**
   * Married filing jointly logic (your original assumption)
   */
  if (filingStatus === "married") {
    adjustedNet += adjustedFederalTax * 0.08; // conservative approximation
  }

  return (
    <section className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        What if you changed one thing?
      </h2>

      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={use401k}
            onChange={() => setUse401k(!use401k)}
            className="h-4 w-4"
          />
          <span>Contribute 5% to a 401(k)</span>
        </label>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={filingStatus === "single"}
              onChange={() => setFilingStatus("single")}
            />
            Single
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={filingStatus === "married"}
              onChange={() => setFilingStatus("married")}
            />
            Married filing jointly
          </label>
        </div>
      </div>

      <div className="mt-4 text-sm space-y-1">
        {use401k && (
          <p className="text-gray-600">
            Federal tax after 401(k):{" "}
            <strong>
              ${Math.round(adjustedFederalTax).toLocaleString("en-US")}
            </strong>
          </p>
        )}

        <p>
          Updated take-home pay:
          <strong className="ml-2 text-green-700">
            ${Math.round(adjustedNet).toLocaleString("en-US")}
          </strong>
        </p>
      </div>
    </section>
  );
}
