// lib/content/contentEngine.ts
// Content engine for generating rich, data-driven city salary analysis and financial guide sections.

import { getTaxSavingsSuggestions } from "../tax/taxSavings";

export type CitySalaryAnalysisInput = {
  city: string;
  state: string;
  salary: number;
  netSalary: number;
  rent: number;
  rentStress: number;
  costOfLiving: number;
  nationalCostOfLiving: number;
  budget: {
    housing: number;
    food: number;
    transportation: number;
    healthcare: number;
    entertainment: number;
    savings: number;
    other: number;
  };
  taxBreakdown: {
    federal: number;
    state: number;
    fica: number;
    effectiveRate: number;
  };
  cityInsights?: {
    industries?: string[];
    medianHomePrice?: number;
    economicGrowth?: string;
  };
};

export function generateCitySalaryAnalysis({
  city,
  state,
  salary,
  netSalary,
  rent,
  rentStress,
  costOfLiving,
  nationalCostOfLiving,
  budget,
  taxBreakdown,
  cityInsights,
}: CitySalaryAnalysisInput): {
  introduction: string;
  salaryAnalysis: string;
  rentAffordability: string;
  costOfLivingComparison: string;
  savingsPotential: string;
  taxBreakdown: string;
  taxSavings: string;
  budgetScenario: string;
  cityLivingInsights: string;
  localInsights: string;
} {
  // Introduction
  const introduction = `With a salary of $${salary.toLocaleString()} in ${city}, ${state}, the estimated take-home pay after federal and state taxes is around $${netSalary.toLocaleString()}.`;

  // Salary Affordability
  const salaryAnalysis = `Average rent for a one-bedroom apartment is about $${rent.toLocaleString()} per month, which means housing would consume roughly ${rentStress.toFixed(1)}% of your net income. This leaves you with approximately $${(netSalary - rent * 12).toLocaleString()} per year for other expenses and savings.`;

  // Rent Affordability
  let rentAffordability = "";
  if (rentStress < 25) {
    rentAffordability = `Rent is considered affordable at ${rentStress.toFixed(1)}% of your net income.`;
  } else if (rentStress < 40) {
    rentAffordability = `Rent takes up ${rentStress.toFixed(1)}% of your net income, which is a moderate level of housing cost burden.`;
  } else {
    rentAffordability = `Rent consumes ${rentStress.toFixed(1)}% of your net income, indicating high financial pressure and potential affordability challenges.`;
  }

  // Cost of Living Comparison
  const colDiff = costOfLiving - nationalCostOfLiving;
  let colPhrase = "about the same as";
  if (colDiff > 5) colPhrase = "above";
  else if (colDiff < -5) colPhrase = "below";
  const costOfLivingComparison = `${city}’s cost-of-living index is ${colPhrase} the national average (${costOfLiving} vs ${nationalCostOfLiving}).`;

  // Savings Potential
  const savingsPotential = `After covering rent and typical expenses, you could allocate around $${budget.savings.toLocaleString()} per month to savings, assuming disciplined budgeting.`;

  // Tax Breakdown
  const taxBreakdownText = `Where your salary goes in taxes:\n- Federal tax: $${taxBreakdown.federal.toLocaleString()}\n- State tax: $${taxBreakdown.state.toLocaleString()}\n- FICA: $${taxBreakdown.fica.toLocaleString()}\nYour effective tax rate is ${taxBreakdown.effectiveRate.toFixed(1)}%.`;

  // Tax Savings
  const taxSavingsTips = getTaxSavingsSuggestions(salary);
  const taxSavings = taxSavingsTips.map(tip => `• ${tip.title}: ${tip.description}`).join("\n");

  // Budget Scenario
  const budgetScenario = `Suggested monthly budget:\n- Housing: $${budget.housing.toLocaleString()}\n- Food: $${budget.food.toLocaleString()}\n- Transportation: $${budget.transportation.toLocaleString()}\n- Healthcare: $${budget.healthcare.toLocaleString()}\n- Entertainment: $${budget.entertainment.toLocaleString()}\n- Savings: $${budget.savings.toLocaleString()}\n- Other: $${budget.other.toLocaleString()}`;

  // City Living Insights
  const cityLivingInsights = `${city} offers a unique blend of local economic factors, with major industries such as ${(cityInsights?.industries || []).join(", ")}. Median home prices are around $${cityInsights?.medianHomePrice?.toLocaleString() || "N/A"}. Economic growth: ${cityInsights?.economicGrowth || "N/A"}.`;

  // Local Insights
  const localInsights = `Economic outlook in ${city}: ${cityInsights?.economicGrowth || "Data not available"}.`;

  return {
    introduction,
    salaryAnalysis,
    rentAffordability,
    costOfLivingComparison,
    savingsPotential,
    taxBreakdown: taxBreakdownText,
    taxSavings,
    budgetScenario,
    cityLivingInsights,
    localInsights,
  };
}

// Salary comparison function
export function generateSalaryComparison(city: string, salary: number, comparisonData: { [city: string]: number }): string {
  // comparisonData: { cityName: equivalentSalary }
  const sanFrancisco = comparisonData["San Francisco"];
  const national = comparisonData["National Average"];
  let result = `A $${salary.toLocaleString()} salary in ${city} provides purchasing power equivalent to $${sanFrancisco?.toLocaleString() || "N/A"} in San Francisco and $${national?.toLocaleString() || "N/A"} at the national average.`;
  return result;
}

// Rent stress explanation
export function explainRentStress(rentStress: number): string {
  if (rentStress < 25) return "Rent is affordable on this salary.";
  if (rentStress < 40) return "Rent is moderately affordable, but may require careful budgeting.";
  return "Rent is high relative to your income, which may cause financial pressure.";
}
