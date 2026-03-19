import type { FilingStatus } from "./federalTax";

export interface TaxSavingsTip {
  title: string;
  description: string;
  estimatedSaving: string;
  category: "retirement" | "health" | "deductions" | "credits" | "investment";
  incomeMin?: number;
  incomeMax?: number;
}

// 2025 contribution limits
const LIMITS_2025 = {
  k401: 23500,           // 401(k) employee deferral (IRS Notice 2024-80)
  k401Catchup: 7500,     // age 50+ catch-up
  ira: 7000,             // Traditional/Roth IRA
  iraCatchup: 1000,      // age 50+ catch-up
  hsaSingle: 4300,       // HSA self-only (Rev. Proc. 2024-25)
  hsaFamily: 8550,       // HSA family
  fsa: 3300,             // Health FSA
  dependentCare: 5000,   // Dependent Care FSA
  saltCap: 10000,        // SALT deduction cap
  childTaxCredit: 2000,  // per qualifying child
};

const ALL_TIPS: TaxSavingsTip[] = [
  // ── Retirement ────────────────────────────────────────────────────────────
  {
    title: "Maximize 401(k) Contributions",
    description: `Contributing the full $${LIMITS_2025.k401.toLocaleString()} to your 401(k) reduces your taxable income dollar-for-dollar. If your employer offers a match, contribute at least enough to capture the full match — that's an immediate 50–100% return.`,
    estimatedSaving: "Up to $5,170 in federal tax (22% bracket)",
    category: "retirement",
  },
  {
    title: "401(k) Age 50+ Catch-Up Contribution",
    description: `Workers 50 and older can contribute an additional $${LIMITS_2025.k401Catchup.toLocaleString()} per year, for a total of $${(LIMITS_2025.k401 + LIMITS_2025.k401Catchup).toLocaleString()}. This accelerated savings window significantly reduces taxable income near retirement.`,
    estimatedSaving: "Up to $2,775 additional tax savings (37% bracket)",
    category: "retirement",
    incomeMin: 50000,
  },
  {
    title: "Contribute to a Traditional IRA",
    description: `Deductible Traditional IRA contributions (up to $${LIMITS_2025.ira.toLocaleString()}) lower your AGI if you're not covered by a workplace plan, or if you are, if your income falls within deduction phase-out limits. Deduction phases out for single filers with workplace plans between $79,000–$89,000 MAGI.`,
    estimatedSaving: "Up to $1,540 in federal tax (22% bracket)",
    category: "retirement",
    incomeMax: 89000,
  },
  {
    title: "Open a Roth IRA for Tax-Free Growth",
    description: `Roth IRA contributions are after-tax but all qualified withdrawals in retirement are tax-free. Eligible for single filers with MAGI below $150,000 (full contribution) to $165,000 (phase-out). Best for those expecting a higher tax bracket in retirement.`,
    estimatedSaving: "Years of tax-free compound growth",
    category: "retirement",
    incomeMax: 165000,
  },
  {
    title: "Backdoor Roth IRA (High Earners)",
    description: "If your income exceeds Roth IRA phase-out limits, you can make a non-deductible Traditional IRA contribution and immediately convert it to a Roth IRA — legally bypassing income limits.",
    estimatedSaving: "Tax-free retirement growth on $7,000/year",
    category: "retirement",
    incomeMin: 165000,
  },
  {
    title: "Solo 401(k) or SEP-IRA for Self-Employed",
    description: "Self-employed individuals can shelter up to 25% of net self-employment income in a SEP-IRA (max $70,000 in 2025), or combine employee + employer contributions in a Solo 401(k) for even higher limits.",
    estimatedSaving: "Up to $26,100 in tax savings (37% bracket, max contribution)",
    category: "retirement",
  },

  // ── Health ────────────────────────────────────────────────────────────────
  {
    title: "Max Out Your HSA (Health Savings Account)",
    description: `If you're on a High-Deductible Health Plan (HDHP), an HSA gives you a triple tax advantage: contributions are pre-tax, growth is tax-free, and withdrawals for qualified medical expenses are tax-free. 2025 limits: $${LIMITS_2025.hsaSingle.toLocaleString()} (self-only) / $${LIMITS_2025.hsaFamily.toLocaleString()} (family).`,
    estimatedSaving: "Up to $946 in federal tax (22% bracket, self-only)",
    category: "health",
  },
  {
    title: "Use a Flexible Spending Account (FSA)",
    description: `Health FSA contributions (up to $${LIMITS_2025.fsa.toLocaleString()}) are pre-tax, reducing your W-2 wages before federal, state, and FICA taxes are calculated. Use it for copays, prescriptions, dental, and vision expenses.`,
    estimatedSaving: "Up to $730 in federal + FICA tax savings",
    category: "health",
  },
  {
    title: "Dependent Care FSA",
    description: `If you pay for childcare or elder care, you can set aside up to $${LIMITS_2025.dependentCare.toLocaleString()} pre-tax for qualifying dependent care expenses. This reduces FICA and federal income taxes simultaneously.`,
    estimatedSaving: "Up to $1,425 in combined federal + FICA savings",
    category: "health",
  },
  {
    title: "Deduct Self-Employed Health Insurance Premiums",
    description: "Self-employed individuals can deduct 100% of health insurance premiums (including dental and vision) for themselves, spouse, and dependents — directly from gross income, above the line.",
    estimatedSaving: "Varies — average family policy ~$22,000/year",
    category: "health",
  },

  // ── Deductions ────────────────────────────────────────────────────────────
  {
    title: "Itemize Deductions When They Exceed the Standard Deduction",
    description: `The 2025 standard deduction is $15,000 (single) or $30,000 (married filing jointly). If your mortgage interest, state/local taxes (capped at $${LIMITS_2025.saltCap.toLocaleString()}), charitable contributions, and medical expenses exceed this, itemizing saves more.`,
    estimatedSaving: "Depends on qualifying expenses",
    category: "deductions",
  },
  {
    title: "SALT Deduction ($10,000 Cap)",
    description: `You can deduct up to $${LIMITS_2025.saltCap.toLocaleString()} of state and local income taxes or sales taxes + property taxes if you itemize. High-tax-state residents with mortgages benefit most.`,
    estimatedSaving: "Up to $3,700 in federal savings at 37% bracket",
    category: "deductions",
  },
  {
    title: "Mortgage Interest Deduction",
    description: "If you itemize, you can deduct interest on up to $750,000 of mortgage principal on your primary or secondary residence. In early loan years when interest is highest, this can significantly exceed the standard deduction.",
    estimatedSaving: "Varies — first-year interest on $500k loan ≈ $25,000",
    category: "deductions",
  },
  {
    title: "Charitable Contribution Deduction",
    description: "Cash donations to qualifying 501(c)(3) organizations are deductible up to 60% of AGI when itemizing. Donating appreciated securities avoids capital gains tax entirely while still getting a full fair-market-value deduction.",
    estimatedSaving: "22–37% of donated amount (tax bracket dependent)",
    category: "deductions",
  },
  {
    title: "Student Loan Interest Deduction",
    description: "Deduct up to $2,500 of student loan interest paid per year directly from gross income (no itemizing required). Phases out for single filers between $80,000–$95,000 MAGI.",
    estimatedSaving: "Up to $550 in federal tax savings",
    category: "deductions",
    incomeMax: 95000,
  },

  // ── Credits ───────────────────────────────────────────────────────────────
  {
    title: "Child Tax Credit",
    description: `You may claim up to $${LIMITS_2025.childTaxCredit.toLocaleString()} per qualifying child under age 17. Up to $1,700 of this is refundable (ACTC). The credit begins to phase out at $200,000 AGI for single filers.`,
    estimatedSaving: `$${LIMITS_2025.childTaxCredit.toLocaleString()} per qualifying child (dollar-for-dollar credit)`,
    category: "credits",
    incomeMax: 400000,
  },
  {
    title: "Child and Dependent Care Credit",
    description: "If you pay for childcare for children under 13 (or a disabled dependent), you may claim a credit of 20–35% of qualifying expenses up to $3,000 (one dependent) or $6,000 (two or more). Lower income earners receive a higher percentage.",
    estimatedSaving: "Up to $600–$2,100 depending on income and dependents",
    category: "credits",
  },
  {
    title: "Earned Income Tax Credit (EITC)",
    description: "A refundable credit for low-to-moderate income workers. For 2025, the maximum credit ranges from $649 (no children) to $7,830 (3+ children). Frequently unclaimed — check eligibility each year.",
    estimatedSaving: "Up to $7,830 refundable credit",
    category: "credits",
    incomeMax: 66819,
  },
  {
    title: "American Opportunity Credit (Education)",
    description: "Up to $2,500 per student per year for the first four years of higher education. 40% is refundable (up to $1,000). Phases out at $80,000–$90,000 MAGI for single filers.",
    estimatedSaving: "Up to $2,500 per student",
    category: "credits",
    incomeMax: 90000,
  },
  {
    title: "Lifetime Learning Credit",
    description: "A 20% credit on up to $10,000 of qualified education expenses ($2,000 max) with no limit on the number of years. Covers undergraduate, graduate, and professional degree courses.",
    estimatedSaving: "Up to $2,000",
    category: "credits",
    incomeMax: 90000,
  },
  {
    title: "Saver's Credit (Retirement Contributions Credit)",
    description: "Low-to-moderate income workers who contribute to a retirement account may claim 10–50% of contributions as a non-refundable credit (max $1,000 single, $2,000 MFJ). Often overlooked.",
    estimatedSaving: "Up to $1,000 (single)",
    category: "credits",
    incomeMax: 36500,
  },
  {
    title: "Electric Vehicle Tax Credit",
    description: "Purchasing a new qualifying EV may entitle you to a credit up to $7,500. Used EVs qualify for up to $4,000. Income caps apply: $150,000 MAGI for single filers (new), $75,000 (used).",
    estimatedSaving: "Up to $7,500",
    category: "credits",
    incomeMax: 150000,
  },
  {
    title: "Energy Efficiency Home Improvement Credit",
    description: "Claim 30% of costs (up to $3,200/year) for qualifying home energy improvements: insulation, windows, doors, heat pumps, and more. No lifetime cap — resets annually.",
    estimatedSaving: "Up to $3,200/year",
    category: "credits",
  },

  // ── Investment ────────────────────────────────────────────────────────────
  {
    title: "Harvest Tax Losses to Offset Capital Gains",
    description: "Sell underperforming investments to realize a capital loss. Losses offset capital gains dollar-for-dollar, and up to $3,000 in net losses can offset ordinary income per year. Unused losses carry forward indefinitely.",
    estimatedSaving: "Varies — $3,000 × marginal rate = up to $1,110/year in ordinary income savings",
    category: "investment",
  },
  {
    title: "Hold Investments Over 1 Year for Long-Term Capital Gains Rates",
    description: "Long-term capital gains (assets held >1 year) are taxed at 0%, 15%, or 20% — far below ordinary income rates of up to 37%. For 2025, the 0% rate applies to single filers with income up to $48,350.",
    estimatedSaving: "Up to 17–20 percentage points vs. short-term rates",
    category: "investment",
  },
  {
    title: "Qualified Opportunity Zone Investment",
    description: "Investing capital gains into a Qualified Opportunity Fund (QOF) defers and potentially reduces the original gain, and eliminates tax on new gains if held 10+ years.",
    estimatedSaving: "Tax-free appreciation on gains held 10+ years",
    category: "investment",
    incomeMin: 100000,
  },
];

// ── Public API ────────────────────────────────────────────────────────────────
export function getTaxSavingsSuggestions(
  income?: number,
  _filingStatus?: FilingStatus
): TaxSavingsTip[] {
  if (income === undefined) return ALL_TIPS;

  return ALL_TIPS.filter((tip) => {
    if (tip.incomeMin !== undefined && income < tip.incomeMin) return false;
    if (tip.incomeMax !== undefined && income > tip.incomeMax) return false;
    return true;
  });
}

