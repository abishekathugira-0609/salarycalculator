"use client";

import { useMemo } from "react";
import { useState } from "react";
import Link from "next/link";
import { calculateSalary, FilingStatus } from "@/lib/tax";

const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],
  ["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],
  ["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],
  ["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],
  ["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],
  ["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],
  ["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],
  ["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],
  ["WI","Wisconsin"],["WY","Wyoming"],["DC","Washington, D.C."],
] as const;

const NO_STATE_TAX = new Set(["AK","FL","NV","NH","SD","TN","TX","WA","WY"]);

function getTaxSavingTips(salary: number, state: string, filingStatus: FilingStatus, totalTax: number) {
  const tips: { title: string; desc: string }[] = [];

  // 401(k)
  const limit401k = 23500;
  const savings401k = Math.min(salary * 0.22, limit401k); // rough federal tax saved
  tips.push({
    title: `Max out your 401(k) — save ~$${Math.round(salary > 0 ? Math.min(limit401k, salary) * 0.22 : 0).toLocaleString()} in taxes`,
    desc: `Contributing up to $${limit401k.toLocaleString()} to a traditional 401(k) reduces your taxable income dollar-for-dollar. Your employer match (if any) is free money on top.`,
  });

  // Traditional IRA
  const iraLimit = 7000;
  if (salary <= 161000 || filingStatus === "married_jointly") {
    tips.push({
      title: "Contribute to a Traditional IRA",
      desc: `You may deduct up to $${iraLimit.toLocaleString()} ($${(iraLimit + 1000).toLocaleString()} if 50+) from your taxable income. Roth IRA is better if you expect higher taxes later; traditional is better now if you want the deduction today.`,
    });
  }

  // HSA
  tips.push({
    title: "Open an HSA if you have a high-deductible health plan",
    desc: "HSA contributions are triple-tax-advantaged: pre-tax going in, tax-free growth, and tax-free withdrawals for medical expenses. 2026 limit: $4,300 (individual) / $8,550 (family).",
  });

  // FSA
  tips.push({
    title: "Use a Dependent Care or Healthcare FSA",
    desc: "Flexible Spending Accounts let you pay for childcare or medical costs with pre-tax dollars, reducing your taxable income by up to $5,000 (dependent care) or $3,300 (healthcare).",
  });

  // Married filing jointly
  if (filingStatus === "married_separately") {
    tips.push({
      title: "Consider filing Married Filing Jointly instead",
      desc: "Most couples pay less tax filing jointly. Separate filing disqualifies you from several credits (Earned Income Credit, student loan interest deduction). Run the numbers both ways.",
    });
  }

  // High earner: QBI / deductions
  if (salary >= 150000) {
    tips.push({
      title: "Bunch deductions to itemize every other year",
      desc: `Your standard deduction is $${filingStatus === "married_jointly" ? "30,000" : "15,000"} in 2026. By timing large charitable gifts, medical costs, or property taxes into alternating years you can exceed it and cut your taxable income.`,
    });
  }

  // State-tax-free relocation note
  if (!NO_STATE_TAX.has(state) && totalTax > 10000) {
    tips.push({
      title: "Living near a no-income-tax state border?",
      desc: "States like TX, FL, WA, NV, and WY have zero state income tax. Remote workers who establish residency there can eliminate state taxes entirely — worth modeling if relocation is feasible.",
    });
  }

  // Mega backdoor Roth for high earners
  if (salary >= 200000) {
    tips.push({
      title: "Explore Mega Backdoor Roth contributions",
      desc: "If your 401(k) plan allows after-tax contributions, you can convert up to ~$46,500 extra per year into a Roth account — locking in tax-free growth on a much larger sum.",
    });
  }

  return tips;
}

export default function CalculatorClient() {
  const [salary, setSalary] = useState<number>(100000);
  const [state, setState] = useState<string>("CA");
  const [taxYear, setYear] = useState<2025 | 2026>(2026);
  const [includeNYC, setIncludeNYC] = useState<boolean>(false);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");

  // Live calculation — no button needed
  const result = useMemo(() => {
    if (!salary || salary <= 0) return null;
    return calculateSalary(salary, state, includeNYC, taxYear, filingStatus);
  }, [salary, state, includeNYC, taxYear, filingStatus]);

  // Bar segment widths
  const pct = result
    ? {
        federal: (result.federalTax / salary) * 100,
        state: ((result.stateTax + result.nycTax) / salary) * 100,
        fica: ((result.socialSecurity + result.medicare) / salary) * 100,
        takehome: (result.netSalary / salary) * 100,
      }
    : null;

  return (
    <div>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Salary After Tax Calculator</h1>
        <p className="text-gray-500 mt-1 text-sm">2026 tax brackets · Results update instantly as you type.</p>
      </header>

      {/* Inputs */}
      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Salary ($)</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-lg font-semibold"
              placeholder="e.g. 120000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => { setState(e.target.value); setIncludeNYC(false); }}
              className="w-full border rounded-lg px-3 py-2"
            >
              {US_STATES.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
            <select
              value={filingStatus}
              onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="single">Single</option>
              <option value="married_jointly">Married Filing Jointly</option>
              <option value="married_separately">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Year</label>
            <select
              value={taxYear}
              onChange={(e) => setYear(e.target.value === "2025" ? 2025 : 2026)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
          {state === "NY" && (
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="nyc"
                checked={includeNYC}
                onChange={(e) => setIncludeNYC(e.target.checked)}
              />
              <label htmlFor="nyc" className="text-sm text-gray-700">Include NYC local tax</label>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {result && pct && (
        <section className="bg-white rounded-xl shadow p-6 mb-8 space-y-6">

          {/* Take-home headline */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Annual take-home</p>
              <p className="text-4xl font-bold text-green-600">
                ${result.netSalary.toLocaleString("en-US")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-0.5">Effective tax rate</p>
              <p className="text-3xl font-bold text-gray-800">{result.effectiveTaxRate}%</p>
            </div>
          </div>

          {/* Visual breakdown bar */}
          <div>
            <div className="flex rounded-full overflow-hidden h-5 mb-3" title="Tax breakdown">
              <div className="bg-blue-500 transition-all" style={{ width: `${pct.federal}%` }} title={`Federal ${pct.federal.toFixed(1)}%`} />
              <div className="bg-orange-400 transition-all" style={{ width: `${pct.state}%` }} title={`State/Local ${pct.state.toFixed(1)}%`} />
              <div className="bg-purple-400 transition-all" style={{ width: `${pct.fica}%` }} title={`FICA ${pct.fica.toFixed(1)}%`} />
              <div className="bg-green-400 transition-all" style={{ width: `${pct.takehome}%` }} title={`Take-home ${pct.takehome.toFixed(1)}%`} />
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />Federal {pct.federal.toFixed(1)}%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />State/Local {pct.state.toFixed(1)}%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-400 inline-block" />FICA {pct.fica.toFixed(1)}%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" />Take-home {pct.takehome.toFixed(1)}%</span>
            </div>
          </div>

          {/* Detailed breakdown */}
          <div className="divide-y text-sm">
            <div className="flex justify-between py-2 text-gray-700">
              <span>Gross salary</span>
              <span className="font-medium">${result.grossSalary.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between py-2 text-blue-700">
              <span>Federal income tax</span>
              <span>− ${result.federalTax.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between py-2 text-orange-700">
              <span>State income tax</span>
              <span>− ${result.stateTax.toLocaleString("en-US")}</span>
            </div>
            {includeNYC && (
              <div className="flex justify-between py-2 text-orange-600">
                <span>NYC local tax</span>
                <span>− ${result.nycTax.toLocaleString("en-US")}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-purple-700">
              <span>Social Security</span>
              <span>− ${result.socialSecurity.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between py-2 text-purple-700">
              <span>Medicare</span>
              <span>− ${result.medicare.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between py-2 font-semibold text-gray-800 border-t-2 border-gray-300">
              <span>Total tax</span>
              <span>− ${result.totalTax.toLocaleString("en-US")}</span>
            </div>
          </div>

          {/* Pay periods */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: "Monthly", value: result.monthlyTakeHome },
              { label: "Bi-weekly", value: result.biWeeklyTakeHome },
              { label: "Weekly", value: Math.round(result.netSalary / 52) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="font-semibold text-gray-900">${value.toLocaleString("en-US")}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            Calculated using {result.taxYear} federal and state tax rules. Estimates only.
          </p>
        </section>
      )}

      {/* Tax Saving Tips */}
      {result && (
        <section className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Saving Tips</h2>
          <ul className="space-y-4">
            {getTaxSavingTips(salary, state, filingStatus, result.totalTax).map((tip, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{tip.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-4">Tips are general guidance, not financial advice. Consult a tax professional for your situation.</p>
        </section>
      )}

      <div className="flex gap-4 text-sm">
        <Link href="/" className="text-blue-600 underline">← Back to homepage</Link>
        <Link href="/job-offer-reality-check" className="text-blue-600 underline">Evaluate a job offer →</Link>
      </div>
    </div>
  );
}
