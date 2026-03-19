/**
 * lib/intelligence/salaryIntelligence.ts
 *
 * Salary Intelligence Engine — the top-level reasoning layer.
 * Builds on financialInsights.ts and adds:
 *   • evaluateSalaryQuality()   — "Good / Moderate / Below comfortable"
 *   • livingComfortText()       — single lifestyle sentence
 *   • stateBenchmark()          — vs. state + national medians
 *   • purchasingPowerText()     — COL-adjusted equivalence
 *
 * Data sources:
 *   State medians   — US Census Bureau ACS 2023 (latest released)
 *   BLS salary data — OEWS annual survey
 *   COL index       — C2ER/ACCRA
 */

import {
  generateFinancialInsights,
  type FinancialInsightsInput,
  type FinancialInsightsResult,
} from "@/lib/financial/financialInsights";
import stateMedians from "@/data/state-medians.json";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SalaryQuality =
  | "Excellent salary"
  | "Good salary"
  | "Moderate salary"
  | "Below comfortable level"
  | "Financial pressure";

export interface StateBenchmark {
  stateMedianHousehold: number;
  stateMedianIndividual: number;
  vsHouseholdPct: number;     // % above/below state household median
  vsIndividualPct: number;    // % above/below state individual median
  insight: string;
}

export interface SalaryIntelligenceResult extends FinancialInsightsResult {
  /** Simple quality label. */
  salaryQuality: SalaryQuality;
  /** One-sentence quality explanation. */
  qualityExplanation: string;
  /** Full living comfort assessment for this city. */
  livingComfortText: string;
  /** Comparison to state and national medians. */
  stateBenchmark: StateBenchmark | null;
  /** Purchasing power equivalence text. */
  purchasingPowerText: string;
  /** Minimum comfortable salary for this city (rent < 30%, expenses covered). */
  minimumComfortableSalary: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const US_NATIONAL_INDIVIDUAL_MEDIAN = 56000;

function pctDiff(val: number, ref: number): number {
  return ref > 0 ? Math.round(((val - ref) / ref) * 100) : 0;
}

function fmtUSD(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** Rent-ratio → quality label. */
function evaluateSalaryQuality(
  salary: number,
  netSalary: number,
  rent: number,
  totalMonthlyExpenses: number
): { quality: SalaryQuality; explanation: string } {
  const annualRent   = rent * 12;
  const rentRatio    = annualRent / netSalary;
  const expenseRatio = (totalMonthlyExpenses * 12) / netSalary;

  if (rentRatio < 0.20 && expenseRatio < 0.60) {
    return {
      quality: "Excellent salary",
      explanation: `At ${fmtUSD(salary)}, housing costs only ${(rentRatio * 100).toFixed(0)}% of take-home income — well below the 25% threshold. This leaves strong room for savings, discretionary spending, and wealth building.`,
    };
  }
  if (rentRatio < 0.25) {
    return {
      quality: "Good salary",
      explanation: `Rent represents ${(rentRatio * 100).toFixed(0)}% of take-home income — comfortably within the recommended 25% guideline. This is a solid salary for this location.`,
    };
  }
  if (rentRatio < 0.35) {
    return {
      quality: "Moderate salary",
      explanation: `Rent takes ${(rentRatio * 100).toFixed(0)}% of take-home income, which is above the ideal 25% but still manageable. Savings will be limited; consider lower-cost housing to improve your financial position.`,
    };
  }
  if (rentRatio < 0.50) {
    return {
      quality: "Below comfortable level",
      explanation: `Rent would consume ${(rentRatio * 100).toFixed(0)}% of take-home income — above the 35% stress threshold. A higher salary or lower-cost housing is needed for financial stability in this city.`,
    };
  }
  return {
    quality: "Financial pressure",
    explanation: `Rent alone would take ${(rentRatio * 100).toFixed(0)}% of take-home income. This salary creates significant financial pressure in this city — a ${fmtUSD(Math.ceil((rent * 12) / 0.30))} annual income or lower rent is needed to reach affordability.`,
  };
}

/** Full lifestyle comfort sentence. */
function buildLivingComfortText(
  salary: number,
  city: string,
  state: string,
  monthlyTakeHome: number,
  totalMonthlyExpenses: number,
  lifestyleLabel: string
): string {
  const surplus = monthlyTakeHome - totalMonthlyExpenses;
  const savingsPct = monthlyTakeHome > 0
    ? Math.max(0, Math.round((surplus / monthlyTakeHome) * 100))
    : 0;

  if (surplus < 0) {
    return `A ${fmtUSD(salary)} salary does not fully cover typical living expenses for a single adult in ${city}, ${state}. Monthly costs exceed take-home pay by ${fmtUSD(Math.abs(surplus))}, indicating this income is insufficient for an independent lifestyle here without additional income or reduced spending.`;
  }
  if (savingsPct < 10) {
    return `A ${fmtUSD(salary)} salary can cover essential living costs for a single adult in ${city}, ${state}, but leaves little room for savings (~${savingsPct}% of take-home). Lifestyle is rated ${lifestyleLabel.toLowerCase()}, with careful budgeting required to avoid month-to-month shortfalls.`;
  }
  if (savingsPct < 20) {
    return `A ${fmtUSD(salary)} salary supports a ${lifestyleLabel.toLowerCase()} single lifestyle in ${city}, ${state}. After essential expenses, approximately ${fmtUSD(surplus)}/month (~${savingsPct}% of take-home) is available for savings or discretionary spending.`;
  }
  return `A ${fmtUSD(salary)} salary comfortably supports a ${lifestyleLabel.toLowerCase()} single lifestyle in ${city}, ${state}, with approximately ${fmtUSD(surplus)}/month (~${savingsPct}% of take-home) available for savings — ${savingsPct >= 20 ? "meeting or exceeding" : "approaching"} the recommended 20% savings rate.`;
}

/** State and national median comparison. */
function buildStateBenchmark(
  salary: number,
  stateCode: string
): StateBenchmark | null {
  const medians = stateMedians as Record<
    string,
    { name: string; medianHousehold: number; medianIndividual: number }
  >;
  const entry = medians[stateCode.toUpperCase()];
  if (!entry) return null;

  const vsHH  = pctDiff(salary, entry.medianHousehold);
  const vsInd = pctDiff(salary, entry.medianIndividual);
  const vsNat = pctDiff(salary, US_NATIONAL_INDIVIDUAL_MEDIAN);

  let insight: string;
  if (vsInd >= 50) {
    insight = `${fmtUSD(salary)} is ${vsInd}% above the ${entry.name} individual median of ${fmtUSD(entry.medianIndividual)} and ${vsNat}% above the US national individual median of ${fmtUSD(US_NATIONAL_INDIVIDUAL_MEDIAN)}. This is a top-quartile income in this state.`;
  } else if (vsInd >= 20) {
    insight = `${fmtUSD(salary)} is ${vsInd}% above the ${entry.name} individual median (${fmtUSD(entry.medianIndividual)}) and ${vsNat >= 0 ? vsNat + "% above" : Math.abs(vsNat) + "% below"} the US national median of ${fmtUSD(US_NATIONAL_INDIVIDUAL_MEDIAN)}.`;
  } else if (vsInd >= 0) {
    insight = `${fmtUSD(salary)} is slightly above the ${entry.name} individual median of ${fmtUSD(entry.medianIndividual)} (${vsInd >= 0 ? "+" : ""}${vsInd}%). The state household median is ${fmtUSD(entry.medianHousehold)}.`;
  } else {
    insight = `${fmtUSD(salary)} is ${Math.abs(vsInd)}% below the ${entry.name} individual median of ${fmtUSD(entry.medianIndividual)}. Consider negotiating a higher salary or exploring higher-paying roles in this state.`;
  }

  return {
    stateMedianHousehold:  entry.medianHousehold,
    stateMedianIndividual: entry.medianIndividual,
    vsHouseholdPct:  vsHH,
    vsIndividualPct: vsInd,
    insight,
  };
}

/** Purchasing power equivalence text. */
function buildPurchasingPowerText(
  salary: number,
  city: string,
  colIndex: number
): string {
  const national    = Math.round(salary / colIndex);
  const sanFran     = Math.round(salary * (1.85 / colIndex));
  const nyc         = Math.round(salary * (1.95 / colIndex));
  const austin      = Math.round(salary * (1.18 / colIndex));

  if (colIndex < 0.90) {
    return `Due to ${city}'s low cost of living (index: ${colIndex.toFixed(2)}), ${fmtUSD(salary)} here has the purchasing power of roughly ${fmtUSD(sanFran)} in San Francisco or ${fmtUSD(nyc)} in New York City. Your dollar goes significantly further here.`;
  }
  if (colIndex < 1.10) {
    return `${city} is near the national cost-of-living average (index: ${colIndex.toFixed(2)}). ${fmtUSD(salary)} here is roughly equivalent to ${fmtUSD(Math.round(salary * (1.85 / colIndex)))} in San Francisco or ${fmtUSD(Math.round(salary * (0.88 / colIndex)))} in an affordable city like Birmingham.`;
  }
  return `${city}'s above-average cost of living (index: ${colIndex.toFixed(2)}) means ${fmtUSD(salary)} provides the purchasing power of roughly ${fmtUSD(national)} in an average-cost US city, or ${fmtUSD(austin)} in Austin. Moving to a lower-cost state could effectively increase your take-home by thousands.`;
}

/**
 * Calculates the minimum gross salary needed for a comfortable lifestyle.
 * Targets: rent < 30% of net, all expenses covered, 10% savings buffer.
 *
 * Formula solves for gross:
 *   net = gross × (1 − effective_tax_rate)
 *   needed_net = (rent + other_monthly) / 0.70  [rent = 30%, other = 40%, savings = 30% is too generous; use rent ≤ 30% → total_expenses / 0.70]
 */
function calcMinComfortableSalary(
  rent: number,
  foodCost: number,
  transportMonthly: number,
  utilitiesMonthly: number,
  healthcareMonthly: number,
  estimatedEffectiveTaxRate: number
): number {
  const totalMonthly = rent + foodCost + transportMonthly + utilitiesMonthly + healthcareMonthly;
  // Target: expenses ≤ 70% of net (30% savings buffer)
  const neededNet    = (totalMonthly * 12) / 0.70;
  // Gross up for taxes
  const neededGross  = neededNet / (1 - estimatedEffectiveTaxRate);
  return Math.ceil(neededGross / 1000) * 1000; // round up to nearest $1k
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface SalaryIntelligenceInput extends FinancialInsightsInput {
  /** Two-letter state code for median benchmarking. */
  stateCode: string;
  transportMonthly?: number;
  utilitiesMonthly?: number;
  healthcareMonthly?: number;
}

export function generateSalaryIntelligence(
  input: SalaryIntelligenceInput
): SalaryIntelligenceResult {
  // 1. Run base financial insights
  const base = generateFinancialInsights(input);

  const {
    salary,
    netSalary,
    rent,
    foodCost,
    costOfLivingIndex,
    stateCode,
    transportMonthly = 175,
    utilitiesMonthly = 165,
    healthcareMonthly = 200,
  } = input;

  const monthlyTakeHome = Math.round(netSalary / 12);
  const totalMonthlyExpenses =
    rent + foodCost + transportMonthly + utilitiesMonthly + healthcareMonthly;

  // 2. Salary quality
  const { quality, explanation } = evaluateSalaryQuality(
    salary,
    netSalary,
    rent,
    totalMonthlyExpenses
  );

  // 3. Living comfort
  const livingComfort = buildLivingComfortText(
    salary,
    input.city,
    input.state,
    monthlyTakeHome,
    totalMonthlyExpenses,
    base.lifestyleLabel
  );

  // 4. State benchmark
  const benchmark = buildStateBenchmark(salary, stateCode);

  // 5. Purchasing power
  const purchasingPower = buildPurchasingPowerText(salary, input.city, costOfLivingIndex);

  // 6. Minimum comfortable salary
  const effectiveTaxRate = (input.totalTax ?? 0) / salary || 0.22;
  const minSalary = calcMinComfortableSalary(
    rent,
    foodCost,
    transportMonthly,
    utilitiesMonthly,
    healthcareMonthly,
    effectiveTaxRate
  );

  return {
    ...base,
    salaryQuality:          quality,
    qualityExplanation:     explanation,
    livingComfortText:      livingComfort,
    stateBenchmark:         benchmark,
    purchasingPowerText:    purchasingPower,
    minimumComfortableSalary: minSalary,
  };
}
