export type FilingStatus =
  | "single"
  | "married-jointly"
  | "married-separately"
  | "head-of-household";

export interface FederalTaxResult {
  tax: number;
  taxableIncome: number;
  standardDeduction: number;
  effectiveRate: number;
  marginalRate: number;
}

// ── 2025 IRS Revenue Procedure 2024-40 ──────────────────────────────────────
const BRACKETS_2025: Record<FilingStatus, { limit: number; rate: number }[]> = {
  single: [
    { limit:  11925, rate: 0.10 },
    { limit:  48475, rate: 0.12 },
    { limit: 103350, rate: 0.22 },
    { limit: 197300, rate: 0.24 },
    { limit: 250525, rate: 0.32 },
    { limit: 626350, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  "married-jointly": [
    { limit:  23850, rate: 0.10 },
    { limit:  96950, rate: 0.12 },
    { limit: 206700, rate: 0.22 },
    { limit: 394600, rate: 0.24 },
    { limit: 501050, rate: 0.32 },
    { limit: 751600, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  "married-separately": [
    { limit:  11925, rate: 0.10 },
    { limit:  48475, rate: 0.12 },
    { limit: 103350, rate: 0.22 },
    { limit: 197300, rate: 0.24 },
    { limit: 250525, rate: 0.32 },
    { limit: 375800, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  "head-of-household": [
    { limit:  17000, rate: 0.10 },
    { limit:  64850, rate: 0.12 },
    { limit: 103350, rate: 0.22 },
    { limit: 197300, rate: 0.24 },
    { limit: 250500, rate: 0.32 },
    { limit: 626350, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTION_2025: Record<FilingStatus, number> = {
  single:               15000,
  "married-jointly":    30000,
  "married-separately": 15000,
  "head-of-household":  22500,
};

// ── 2026 projected (Rev. Proc. 2025-xx, IRS inflation adjustments) ───────────
const BRACKETS_2026: Record<FilingStatus, { limit: number; rate: number }[]> = {
  single: [
    { limit:  12300, rate: 0.10 },
    { limit:  49900, rate: 0.12 },
    { limit: 106500, rate: 0.22 },
    { limit: 203700, rate: 0.24 },
    { limit: 258050, rate: 0.32 },
    { limit: 645200, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  "married-jointly": [
    { limit:  24600, rate: 0.10 },
    { limit:  99800, rate: 0.12 },
    { limit: 213000, rate: 0.22 },
    { limit: 407400, rate: 0.24 },
    { limit: 516100, rate: 0.32 },
    { limit: 775200, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  "married-separately": [
    { limit:  12300, rate: 0.10 },
    { limit:  49900, rate: 0.12 },
    { limit: 106500, rate: 0.22 },
    { limit: 203700, rate: 0.24 },
    { limit: 258050, rate: 0.32 },
    { limit: 387600, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
  "head-of-household": [
    { limit:  17500, rate: 0.10 },
    { limit:  66800, rate: 0.12 },
    { limit: 106500, rate: 0.22 },
    { limit: 203700, rate: 0.24 },
    { limit: 258050, rate: 0.32 },
    { limit: 645200, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single:               15500,
  "married-jointly":    31000,
  "married-separately": 15500,
  "head-of-household":  23200,
};

// ── Core helper ──────────────────────────────────────────────────────────────
function applyBrackets(
  taxableIncome: number,
  brackets: { limit: number; rate: number }[]
): { tax: number; marginalRate: number } {
  let tax = 0;
  let prev = 0;
  let marginalRate = brackets[0].rate;

  for (const b of brackets) {
    if (taxableIncome <= 0) break;
    const slice = Math.min(b.limit - prev, taxableIncome);
    tax += slice * b.rate;
    taxableIncome -= slice;
    prev = b.limit;
    marginalRate = b.rate;
  }

  return { tax: Math.round(tax), marginalRate };
}

// ── Public API ───────────────────────────────────────────────────────────────
export function calculateFederalTax(
  income: number,
  filingStatus: FilingStatus = "single",
  taxYear: 2025 | 2026 = 2025
): FederalTaxResult {
  const brackets =
    taxYear === 2026 ? BRACKETS_2026[filingStatus] : BRACKETS_2025[filingStatus];
  const standardDeduction =
    taxYear === 2026
      ? STANDARD_DEDUCTION_2026[filingStatus]
      : STANDARD_DEDUCTION_2025[filingStatus];

  const taxableIncome = Math.max(0, income - standardDeduction);
  const { tax, marginalRate } = applyBrackets(taxableIncome, brackets);

  return {
    tax,
    taxableIncome,
    standardDeduction,
    effectiveRate: income > 0 ? Number(((tax / income) * 100).toFixed(2)) : 0,
    marginalRate,
  };
}
