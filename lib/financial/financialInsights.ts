/**
 * lib/financial/financialInsights.ts
 *
 * Financial Reasoning Engine — converts raw salary and expense data
 * into human-readable insights and structured recommendations.
 *
 * All monetary values are monthly unless noted as annual.
 */

import { getTaxSavingsSuggestions, type TaxSavingsTip } from "@/lib/tax/taxSavings";
import { getSalaryEstimate } from "@/lib/data/salaryData";
import type { FilingStatus } from "@/lib/tax/federalTax";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface FinancialInsightsInput {
  city: string;                    // display name, e.g. "Austin"
  state: string;                   // display name, e.g. "Texas"
  salary: number;                  // gross annual salary
  netSalary: number;               // annual take-home after all taxes
  /** Monthly rent (1-bedroom). Source: HUD FMR. */
  rent: number;
  /** Monthly food cost. Source: USDA low-cost plan × COL index. */
  foodCost: number;
  costOfLivingIndex: number;       // relative to US avg = 1.00
  transportMonthly?: number;
  utilitiesMonthly?: number;
  healthcareMonthly?: number;
  federalTax?: number;
  stateTax?: number;
  ficaTotal?: number;
  totalTax?: number;
  filingStatus?: FilingStatus;
  /** Optional BLS job slug for salary comparison (e.g. "software-engineer"). */
  jobTitle?: string;
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface BudgetScenario {
  /** Recommended monthly spend on needs (50%). */
  needs: number;
  /** Recommended monthly spend on wants (30%). */
  wants: number;
  /** Recommended monthly savings (20%). */
  savings: number;
  /** Actual monthly surplus after estimated real expenses. */
  actualSurplus: number;
  /** Whether actual expenses fit within the 50% "needs" budget. */
  needsFit: boolean;
}

export interface FinancialInsightsResult {
  /** Is the rent affordable relative to take-home? */
  affordabilityInsight: string;
  /** Explanation of effective tax burden. */
  taxInsight: string;
  /** Estimated savings rate and dollar amount. */
  savingsInsight: string;
  /** Salary vs. national median for job (or general median if no job provided). */
  salaryComparison: string;
  /** Purchasing power vs. national average in this city. */
  costOfLivingInsight: string;
  /** Personalised tax-reduction strategies. */
  taxTips: TaxSavingsTip[];
  /** 50/30/20 budget breakdown with real numbers. */
  budgetScenario: BudgetScenario;
  /** Lifestyle score 0–10 based on rent affordability, COL, surplus. */
  lifestyleScore: number;
  /** Short phrase summarising the score. */
  lifestyleLabel: string;
}

// ── National reference points ─────────────────────────────────────────────────
const US_MEDIAN_HOUSEHOLD_INCOME = 74580;   // US Census 2024
const US_MEDIAN_INDIVIDUAL_INCOME = 56000;  // BLS 2024

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  return total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";
}

function fmtUSD(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function lifestyleLabel(score: number): string {
  if (score >= 8.5) return "Excellent";
  if (score >= 7.0) return "Very Good";
  if (score >= 5.5) return "Good";
  if (score >= 4.0) return "Fair";
  if (score >= 2.5) return "Challenging";
  return "Difficult";
}

// ── Main function ─────────────────────────────────────────────────────────────

export function generateFinancialInsights(
  input: FinancialInsightsInput
): FinancialInsightsResult {
  const {
    city,
    state,
    salary,
    netSalary,
    rent,
    foodCost,
    costOfLivingIndex,
    transportMonthly = 175,
    utilitiesMonthly = 165,
    healthcareMonthly = 200,
    federalTax = 0,
    stateTax = 0,
    ficaTotal = 0,
    filingStatus = "single",
    jobTitle,
  } = input;

  const monthlyTakeHome = Math.round(netSalary / 12);
  const totalTax = input.totalTax ?? (federalTax + stateTax + ficaTotal);
  const effectiveTaxRate = salary > 0 ? (totalTax / salary) * 100 : 0;

  const totalMonthlyExpenses =
    rent + foodCost + transportMonthly + utilitiesMonthly + healthcareMonthly;
  const monthlySurplus = monthlyTakeHome - totalMonthlyExpenses;
  const annualSurplus  = monthlySurplus * 12;

  // ── 1. Affordability ─────────────────────────────────────────────────────
  const rentRatio = (rent * 12) / netSalary;
  let affordabilityInsight: string;
  if (rentRatio < 0.25) {
    affordabilityInsight = `Housing costs in ${city} would consume about ${pct(rent * 12, netSalary)}% of take-home income — comfortably below the 25% threshold. You have significant flexibility for savings and discretionary spending.`;
  } else if (rentRatio < 0.35) {
    affordabilityInsight = `Housing costs would consume about ${pct(rent * 12, netSalary)}% of take-home income, which is manageable but leaves limited room for unexpected expenses. The general guideline is to stay below 30%.`;
  } else if (rentRatio < 0.50) {
    affordabilityInsight = `Rent would take up ${pct(rent * 12, netSalary)}% of take-home income — above the 30% rule of thumb. This creates financial pressure and limits savings. Consider roommates, a studio, or a lower-cost neighbourhood.`;
  } else {
    affordabilityInsight = `At ${pct(rent * 12, netSalary)}% of take-home income, housing costs in ${city} are unaffordable on this salary. A ${fmtUSD(Math.ceil((rent * 12 / 0.33)))} annual salary is needed to make rent manageable.`;
  }

  // ── 2. Tax insight ───────────────────────────────────────────────────────
  const fedPct  = salary > 0 ? (federalTax / salary) * 100 : 0;
  const statePct = salary > 0 ? (stateTax / salary) * 100 : 0;
  const ficaPct  = salary > 0 ? (ficaTotal / salary) * 100 : 0;

  let taxInsight: string;
  if (effectiveTaxRate < 15) {
    taxInsight = `Total taxes represent approximately ${effectiveTaxRate.toFixed(1)}% of gross income — a relatively light burden. ${state} ${stateTax === 0 ? "has no state income tax, saving you additional thousands per year" : `state tax adds ${statePct.toFixed(1)}%`}.`;
  } else if (effectiveTaxRate < 28) {
    taxInsight = `Total taxes are approximately ${effectiveTaxRate.toFixed(1)}% of gross income (federal ${fedPct.toFixed(1)}%, state ${statePct.toFixed(1)}%, FICA ${ficaPct.toFixed(1)}%). This is typical for this income level in the US.`;
  } else {
    taxInsight = `Taxes consume a significant ${effectiveTaxRate.toFixed(1)}% of gross income (federal ${fedPct.toFixed(1)}%, state ${statePct.toFixed(1)}%, FICA ${ficaPct.toFixed(1)}%). Pre-tax contributions such as 401(k) and HSA can meaningfully reduce this burden.`;
  }

  // ── 3. Savings insight ───────────────────────────────────────────────────
  const savingsRate = monthlyTakeHome > 0
    ? Math.max(0, (monthlySurplus / monthlyTakeHome) * 100)
    : 0;

  let savingsInsight: string;
  if (monthlySurplus < 0) {
    savingsInsight = `Estimated expenses (${fmtUSD(totalMonthlyExpenses)}/mo) exceed take-home pay (${fmtUSD(monthlyTakeHome)}/mo) by ${fmtUSD(Math.abs(monthlySurplus))}. Savings are not feasible without reducing expenses or increasing income.`;
  } else if (savingsRate < 10) {
    savingsInsight = `After estimated living expenses, roughly ${fmtUSD(monthlySurplus)}/month (${savingsRate.toFixed(0)}% of take-home) remains. This is below the recommended 20% savings rate — consider trimming discretionary spending.`;
  } else if (savingsRate < 20) {
    savingsInsight = `This salary could allow saving approximately ${fmtUSD(monthlySurplus)}/month (${savingsRate.toFixed(0)}% of take-home), or ${fmtUSD(annualSurplus)}/year. That's reasonable, though slightly below the 20% benchmark.`;
  } else {
    savingsInsight = `Excellent savings potential — approximately ${fmtUSD(monthlySurplus)}/month (${savingsRate.toFixed(0)}% of take-home), or ${fmtUSD(annualSurplus)} annually. At this rate, you could build a 6-month emergency fund in roughly ${Math.ceil((monthlyTakeHome * 6) / monthlySurplus)} months.`;
  }

  // ── 4. Salary comparison ─────────────────────────────────────────────────
  let salaryComparison: string;
  const jobEst = jobTitle ? getSalaryEstimate(jobTitle) : null;

  if (jobEst) {
    const diff    = salary - jobEst.median;
    const diffPct = ((diff / jobEst.median) * 100).toFixed(1);
    const rel     = diff >= 0 ? `${diffPct}% above` : `${Math.abs(Number(diffPct))}% below`;
    salaryComparison = `The national median salary for this role is ${fmtUSD(jobEst.median)} (BLS OEWS). This salary of ${fmtUSD(salary)} is ${rel} the national median. The 75th percentile is ${fmtUSD(jobEst.p75)} — a useful benchmark for negotiation.`;
  } else {
    const diffVsMedian = salary - US_MEDIAN_INDIVIDUAL_INCOME;
    const diffPct      = ((diffVsMedian / US_MEDIAN_INDIVIDUAL_INCOME) * 100).toFixed(1);
    const rel          = diffVsMedian >= 0
      ? `${diffPct}% above the US individual median`
      : `${Math.abs(Number(diffPct))}% below the US individual median`;
    salaryComparison = `${fmtUSD(salary)} is ${rel} of ${fmtUSD(US_MEDIAN_INDIVIDUAL_INCOME)} (BLS, 2024). ${salary >= US_MEDIAN_HOUSEHOLD_INCOME ? `It exceeds the US median household income of ${fmtUSD(US_MEDIAN_HOUSEHOLD_INCOME)}.` : ""}`;
  }

  // ── 5. Cost-of-living comparison ─────────────────────────────────────────
  const equivalentNational = Math.round(salary / costOfLivingIndex);
  const equivalentNYC      = Math.round(salary / (costOfLivingIndex / 1.95));
  const equivalentSF       = Math.round(salary / (costOfLivingIndex / 1.85));

  let costOfLivingInsight: string;
  if (costOfLivingIndex < 0.90) {
    costOfLivingInsight = `${city}'s cost of living is ${((1 - costOfLivingIndex) * 100).toFixed(0)}% below the national average (index: ${costOfLivingIndex.toFixed(2)}). ${fmtUSD(salary)} here has the purchasing power of roughly ${fmtUSD(equivalentNYC)} in New York City — excellent value.`;
  } else if (costOfLivingIndex < 1.10) {
    costOfLivingInsight = `${city} is roughly in line with the national cost-of-living average (index: ${costOfLivingIndex.toFixed(2)}). Your purchasing power is close to what this salary would provide in most US cities.`;
  } else {
    costOfLivingInsight = `${city}'s cost of living is ${((costOfLivingIndex - 1) * 100).toFixed(0)}% above the national average (index: ${costOfLivingIndex.toFixed(2)}). ${fmtUSD(salary)} here is equivalent to roughly ${fmtUSD(equivalentNational)} in an average-cost city. For comparison, the same lifestyle would cost ~${fmtUSD(equivalentSF)} in San Francisco.`;
  }

  // ── 6. Tax savings tips ──────────────────────────────────────────────────
  const taxTips = getTaxSavingsSuggestions(salary, filingStatus).slice(0, 5);

  // ── 7. 50/30/20 budget scenario ──────────────────────────────────────────
  const needs50  = Math.round(monthlyTakeHome * 0.50);
  const wants30  = Math.round(monthlyTakeHome * 0.30);
  const savings20 = Math.round(monthlyTakeHome * 0.20);
  const needsFit = totalMonthlyExpenses <= needs50;

  const budgetScenario: BudgetScenario = {
    needs:        needs50,
    wants:        wants30,
    savings:      savings20,
    actualSurplus: monthlySurplus,
    needsFit,
  };

  // ── 8. Lifestyle score (0–10) ────────────────────────────────────────────
  //   Component weights:
  //     rent affordability  40%  — lower rent ratio = higher score
  //     COL index           30%  — lower COL = higher score
  //     surplus             30%  — higher surplus rate = higher score
  const rentScore    = Math.max(0, Math.min(10, (1 - rentRatio / 0.6) * 10));
  const colScore     = Math.max(0, Math.min(10, (2 - costOfLivingIndex) * 6.67));
  const surplusScore = Math.max(0, Math.min(10, (savingsRate / 30) * 10));

  const rawScore = rentScore * 0.40 + colScore * 0.30 + surplusScore * 0.30;
  const score    = Math.round(rawScore * 10) / 10; // round to 1 dp

  return {
    affordabilityInsight,
    taxInsight,
    savingsInsight,
    salaryComparison,
    costOfLivingInsight,
    taxTips,
    budgetScenario,
    lifestyleScore: score,
    lifestyleLabel: lifestyleLabel(score),
  };
}
