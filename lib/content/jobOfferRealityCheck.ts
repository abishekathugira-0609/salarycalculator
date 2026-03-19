// lib/content/jobOfferRealityCheck.ts
// Evaluates job offers for affordability, cost-of-living, and tax impact

export type FilingStatus = "single" | "married_jointly" | "married_separately" | "head_of_household";

export type JobOfferInput = {
  city: string;
  state: string;
  jobTitle: string;
  salary: number;
  netSalary: number;
  rent: number;
  rentStress: number;
  costOfLiving: number;
  filingStatus?: FilingStatus;
  taxBreakdown: {
    federal: number;
    state: number;
    fica: number;
    effectiveRate: number;
  };
};

export function jobOfferRealityCheck(input: JobOfferInput): {
  verdict: string;
  summary: string;
  rentAdvice: string;
  taxAdvice: string;
  colAdvice: string;
  action: string;
} {
  // Affordability verdict
  let verdict = "";
  if (input.rentStress < 25) verdict = "This job offer is highly affordable.";
  else if (input.rentStress < 40) verdict = "This job offer is moderately affordable, but may require careful budgeting.";
  else verdict = "This job offer may cause financial stress due to high rent-to-income ratio.";

  // Summary
  const summary = `Net salary after taxes is $${input.netSalary.toLocaleString()}. Rent is $${input.rent.toLocaleString()} per month (${input.rentStress.toFixed(1)}% of net income).`;

  // Rent advice
  let rentAdvice = "";
  if (input.rentStress < 25) rentAdvice = "Rent is well within recommended limits.";
  else if (input.rentStress < 40) rentAdvice = "Rent is manageable, but consider negotiating for relocation assistance or a signing bonus.";
  else rentAdvice = "Rent exceeds 40% of net income. Consider negotiating for higher salary or finding more affordable housing.";

  // Filing status context
  const filing = input.filingStatus ?? "single";
  const filingLabels: Record<string, string> = {
    single: "Single",
    married_jointly: "Married Filing Jointly",
    married_separately: "Married Filing Separately",
    head_of_household: "Head of Household",
  };
  const filingLabel = filingLabels[filing] ?? "Single";
  const filingNote =
    filing === "married_jointly"
      ? " As a married couple filing jointly, you may benefit from a lower combined effective rate."
      : filing === "married_separately"
      ? " Filing separately can sometimes result in a higher effective rate — consider consulting a tax professional."
      : filing === "head_of_household"
      ? " Head of household status provides a larger standard deduction than single filers."
      : "";

  // Tax advice
  const taxAdvice = `Filing as ${filingLabel}. Effective tax rate is ${input.taxBreakdown.effectiveRate.toFixed(1)}%. Federal: $${input.taxBreakdown.federal.toLocaleString()}, State: $${input.taxBreakdown.state.toLocaleString()}, FICA: $${input.taxBreakdown.fica.toLocaleString()}.${filingNote}`;

  // Cost-of-living advice
  let colAdvice = "";
  if (input.costOfLiving > 105) colAdvice = "Cost of living is above national average. Negotiate for a cost-of-living adjustment.";
  else if (input.costOfLiving < 95) colAdvice = "Cost of living is below national average. Your offer stretches further here.";
  else colAdvice = "Cost of living is close to national average.";

  // Actionable advice
  let action = "Always benchmark your offer against local market data, ask for written details, and clarify bonus and benefits.";
  if (input.rentStress > 40 || input.costOfLiving > 105) action += " Consider negotiating for higher salary, signing bonus, or additional benefits.";

  return { verdict, summary, rentAdvice, taxAdvice, colAdvice, action };
}
