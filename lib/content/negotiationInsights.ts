// lib/content/negotiationInsights.ts
// Business logic for generating negotiation insights based on salary, city, and market data

export type NegotiationInput = {
  city: string;
  state: string;
  jobTitle: string;
  salary: number;
  netSalary: number;
  costOfLiving: number;
  rent: number;
  marketSalaryRange: { min: number; max: number };
  industry?: string;
};

export function generateNegotiationInsights(input: NegotiationInput): string[] {
  const insights: string[] = [];

  // 1. Salary vs. Market
  if (input.salary < input.marketSalaryRange.min) {
    insights.push(
      `Your offer ($${input.salary.toLocaleString()}) is below the typical market range for ${input.jobTitle} in ${input.city} ($${input.marketSalaryRange.min.toLocaleString()}–$${input.marketSalaryRange.max.toLocaleString()}). Consider negotiating for a higher base salary.`
    );
  } else if (input.salary > input.marketSalaryRange.max) {
    insights.push(
      `Your offer ($${input.salary.toLocaleString()}) is above the typical market range for ${input.jobTitle} in ${input.city}. This is a strong offer—ensure other benefits are competitive as well.`
    );
  } else {
    insights.push(
      `Your offer is within the typical market range for ${input.jobTitle} in ${input.city} ($${input.marketSalaryRange.min.toLocaleString()}–$${input.marketSalaryRange.max.toLocaleString()}).`
    );
  }

  // 2. Cost of Living Adjustment
  if (input.costOfLiving > 105) {
    insights.push(
      `${input.city} has a cost-of-living index above the national average. Consider negotiating for a cost-of-living adjustment or additional benefits to offset higher expenses.`
    );
  }

  // 3. Rent Stress
  const rentStress = (input.rent * 12) / input.netSalary * 100;
  if (rentStress > 30) {
    insights.push(
      `Rent would consume ${rentStress.toFixed(1)}% of your net income. Negotiate for a higher salary, signing bonus, or relocation assistance to improve affordability.`
    );
  }

  // 4. Industry-specific
  if (input.industry === "Technology") {
    insights.push(
      `Tech roles often include equity or stock options. Ask about equity, signing bonuses, and remote work flexibility.`
    );
  }

  // 5. General negotiation tips
  insights.push(
    `Always ask for a written offer, clarify bonus structure, and inquire about benefits (healthcare, retirement, PTO, remote work). Benchmark against multiple sources.`
  );

  return insights;
}
