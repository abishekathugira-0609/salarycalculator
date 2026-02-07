"use client";

import { useState } from "react";
import Link from "next/link";
import { calculateSalary } from "@/lib/tax";

export default function CalculatorPage() {
  const [salary, setSalary] = useState<number>(100000);
  const [state, setState] = useState<string>("CA");
  const [taxYear, setYear] = useState<number>(2025);
  const [includeNYC, setIncludeNYC] = useState<boolean>(false);

  const [result, setResult] =
    useState<ReturnType<typeof calculateSalary> | null>(null);

  function handleCalculate() {
    if (!salary || salary <= 0) return;
    const data = calculateSalary(salary, state, includeNYC,taxYear);
    setResult(data);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Salary After Tax Calculator
          </h1>
          <p className="text-gray-600 mt-2">
            Calculate your take-home pay after federal and state taxes (2025).
          </p>
        </header>

        {/* Calculator form */}
        <section className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual salary ($)
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g. 120000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setIncludeNYC(false);
                }}
                className="w-full border rounded-lg px-3 py-2"
              >
                {/* All US states + DC */}
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
                <option value="DC">Washington, D.C.</option>
              </select>
            </div>

          </div>

         <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Year
  </label>

  <select
    value={taxYear}   // ✅ FIXED
    onChange={(e) => {
      setYear(Number(e.target.value)); // ✅ clean cast
    }}
    className="w-full border rounded-lg px-3 py-2"
  >
    <option value={2025}>2025</option>
    <option value={2026}>2026</option>
  </select>
</div>


          {/* NYC local tax toggle */}
          {state === "NY" && (
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={includeNYC}
                  onChange={(e) => setIncludeNYC(e.target.checked)}
                />
                Include NYC local tax
              </label>
            </div>
          )}
<div>
    <label className="block text-sm font-medium text-gray-700 mb-5">
                
              </label>
          <button
            onClick={handleCalculate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Calculate
          </button>
          </div>
        </section>

        {/* Results */}
        {result && (() => {
          const r = result;

          return (
            <section className="bg-white rounded-xl shadow p-6 mb-10 space-y-6">

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Annual take-home pay</p>
                  <p className="text-2xl font-semibold text-green-700">
                    ${r.netSalary.toLocaleString("en-US")}
                  </p>
                </div>

                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Effective tax rate</p>
                  <p className="text-2xl font-semibold">
                    {r.effectiveTaxRate}%
                  </p>
                </div>
              </div>

              {/* Federal taxes */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Federal taxes
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex justify-between">
                    <span>Federal income tax</span>
                    <span>${r.federalTax.toLocaleString("en-US")}</span>
                  </li>
                </ul>
              </div>

              {/* State & local */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  State & local taxes
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex justify-between">
                    <span>State income tax</span>
                    <span>${r.stateTax.toLocaleString("en-US")}</span>
                  </li>

                  {includeNYC && (
                    <li className="flex justify-between">
                      <span>NYC local tax</span>
                      <span>${r.nycTax.toLocaleString("en-US")}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Payroll */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Payroll taxes
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex justify-between">
                    <span>Social Security</span>
                    <span>${r.socialSecurity.toLocaleString("en-US")}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Medicare</span>
                    <span>${r.medicare.toLocaleString("en-US")}</span>
                  </li>
                </ul>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <ul className="text-sm font-semibold text-gray-900 space-y-1">
                  <li className="flex justify-between">
                    <span>Total tax</span>
                    <span>${r.totalTax.toLocaleString("en-US")}</span>
                  </li>
                </ul>
              </div>

              {/* Pay periods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Monthly take-home</p>
                  <p className="text-lg font-semibold">
                    ${r.monthlyTakeHome.toLocaleString("en-US")}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Bi-weekly take-home</p>
                  <p className="text-lg font-semibold">
                    ${r.biWeeklyTakeHome.toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Calculated using {r.taxYear} federal and state tax rules.
              </p>

            </section>
          );
        })()}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 text-sm">
          <Link href="/" className="text-blue-600 underline">
            ← Back to homepage
          </Link>
          <Link
            href="/salary/100000-california"
            className="text-blue-600 underline"
          >
            View example salary breakdown →
          </Link>
        </div>

      </div>
    </main>
  );
}
