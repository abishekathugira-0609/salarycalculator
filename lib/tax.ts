// lib/tax.ts

export const TAX_YEAR = 2025;
export const FILING_STATUS = "Single";

/* ======================================================
   FEDERAL TAX (2025 – SINGLE)
====================================================== */
function calculateFederalTax2026(income: number): number {
  const standardDeduction = 15350; // projected bump
  let taxableIncome = Math.max(0, income - standardDeduction);

  const brackets = [
    { limit: 11850, rate: 0.10 },
    { limit: 48150, rate: 0.12 },
    { limit: 103500, rate: 0.22 },
    { limit: 197500, rate: 0.24 },
    { limit: 250000, rate: 0.32 },
    { limit: 620000, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ];

  let tax = 0;
  let prev = 0;

  for (const b of brackets) {
    if (taxableIncome <= 0) break;
    const amount = Math.min(b.limit - prev, taxableIncome);
    tax += amount * b.rate;
    taxableIncome -= amount;
    prev = b.limit;
  }

  return Math.round(tax);
}

function calculateFederalTax2025(income: number): number {
  const standardDeduction = 14900;
  let taxableIncome = Math.max(0, income - standardDeduction);

  const brackets = [
    { limit: 11600, rate: 0.10 },
    { limit: 47150, rate: 0.12 },
    { limit: 100525, rate: 0.22 },
    { limit: 191950, rate: 0.24 },
    { limit: 243725, rate: 0.32 },
    { limit: 609350, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ];

  let tax = 0;
  let prev = 0;

  for (const b of brackets) {
    if (taxableIncome <= 0) break;
    const amount = Math.min(b.limit - prev, taxableIncome);
    tax += amount * b.rate;
    taxableIncome -= amount;
    prev = b.limit;
  }

  return Math.round(tax);
}

/* ======================================================
   PROGRESSIVE STATE TAXES
====================================================== */

// ---------- California ----------
export function calculateCaliforniaTax(income: number): number {
  const standardDeduction = 5540;
  let taxableIncome = Math.max(0, income - standardDeduction);

  const brackets = [
    { limit: 10099, rate: 0.01 },
    { limit: 23942, rate: 0.02 },
    { limit: 37788, rate: 0.04 },
    { limit: 52455, rate: 0.06 },
    { limit: 66295, rate: 0.08 },
    { limit: 338639, rate: 0.093 },
    { limit: Infinity, rate: 0.123 },
  ];

  return progressiveTax(taxableIncome, brackets);
}

// ---------- New York ----------
export function calculateNewYorkTax(income: number): number {
  const standardDeduction = 8000;
  let taxableIncome = Math.max(0, income - standardDeduction);

  const brackets = [
    { limit: 8500, rate: 0.04 },
    { limit: 11700, rate: 0.045 },
    { limit: 13900, rate: 0.0525 },
    { limit: 80650, rate: 0.0585 },
    { limit: 215400, rate: 0.0625 },
    { limit: 1077550, rate: 0.0685 },
    { limit: Infinity, rate: 0.109 },
  ];

  return progressiveTax(taxableIncome, brackets);
}

// ---------- New Jersey ----------
export function calculateNewJerseyTax(income: number): number {
  const brackets = [
    { limit: 20000, rate: 0.014 },
    { limit: 35000, rate: 0.0175 },
    { limit: 40000, rate: 0.035 },
    { limit: 75000, rate: 0.05525 },
    { limit: 500000, rate: 0.0637 },
    { limit: 1000000, rate: 0.0897 },
    { limit: Infinity, rate: 0.1075 },
  ];

  return progressiveTax(income, brackets);
}

// ---------- Minnesota ----------
export function calculateMinnesotaTax(income: number): number {
  const brackets = [
    { limit: 30070, rate: 0.0535 },
    { limit: 98760, rate: 0.068 },
    { limit: 183340, rate: 0.0785 },
    { limit: Infinity, rate: 0.0985 },
  ];

  return progressiveTax(income, brackets);
}

// ---------- Hawaii ----------
export function calculateHawaiiTax(income: number): number {
  const brackets = [
    { limit: 2400, rate: 0.014 },
    { limit: 4800, rate: 0.032 },
    { limit: 9600, rate: 0.055 },
    { limit: 14400, rate: 0.064 },
    { limit: 19200, rate: 0.068 },
    { limit: 24000, rate: 0.072 },
    { limit: 36000, rate: 0.076 },
    { limit: 48000, rate: 0.079 },
    { limit: 150000, rate: 0.0825 },
    { limit: 175000, rate: 0.09 },
    { limit: 200000, rate: 0.10 },
    { limit: Infinity, rate: 0.11 },
  ];

  return progressiveTax(income, brackets);
}

/* ======================================================
   GENERIC PROGRESSIVE TAX HELPER
====================================================== */
function progressiveTax(
  taxableIncome: number,
  brackets: { limit: number; rate: number }[]
): number {
  let tax = 0;
  let prev = 0;
  let remaining = taxableIncome;

  for (const b of brackets) {
    if (remaining <= 0) break;
    const amount = Math.min(b.limit - prev, remaining);
    tax += amount * b.rate;
    remaining -= amount;
    prev = b.limit;
  }

  return Math.round(tax);
}

/* ======================================================
   FLAT TAX STATES
====================================================== */
const FLAT_STATE_TAX: Record<string, number> = {
  CO: 0.044,
  IL: 0.0495,
  PA: 0.0307,
  MA: 0.05,
  MI: 0.0425,
  IN: 0.0315,
  AZ: 0.025,
  UT: 0.0485,
  NC: 0.0475,
};

/* ======================================================
   NO INCOME TAX STATES
====================================================== */
const NO_STATE_TAX = new Set([
  "AK", "FL", "NV", "NH", "SD", "TN", "TX", "WA", "WY",
]);

/* ======================================================
   NYC LOCAL TAX (OPTIONAL)
====================================================== */
export function calculateNYCLocalTax(income: number): number {
  const brackets = [
    { limit: 12000, rate: 0.03078 },
    { limit: 25000, rate: 0.03762 },
    { limit: 50000, rate: 0.03819 },
    { limit: Infinity, rate: 0.03876 },
  ];

  return progressiveTax(income, brackets);
}

/* ======================================================
   PAYROLL TAXES
====================================================== */
export function calculatePayrollTaxes(income: number) {
  return {
    socialSecurity: Math.round(Math.min(income, 160200) * 0.062),
    medicare: Math.round(income * 0.0145),
  };
}

/* ======================================================
   MAIN CALCULATOR (TIER-2 COMPLETE)
====================================================== */
export function calculateSalary(
  income: number,
  state: string,
  includeNYC: boolean = false,
  taxYear: 2025 | 2026 = 2025
) {
  const federalTax =
    taxYear === 2026
      ? calculateFederalTax2026(income)
      : calculateFederalTax2025(income);

  let stateTax = 0;
  let nycTax = 0;

  if (NO_STATE_TAX.has(state)) {
    stateTax = 0;
  } else if (state === "CA") {
    stateTax = calculateCaliforniaTax(income);
  } else if (state === "NY") {
    stateTax = calculateNewYorkTax(income);
    if (includeNYC) nycTax = calculateNYCLocalTax(income);
  } else if (state === "NJ") {
    stateTax = calculateNewJerseyTax(income);
  } else if (state === "MN") {
    stateTax = calculateMinnesotaTax(income);
  } else if (state === "HI") {
    stateTax = calculateHawaiiTax(income);
  } else if (FLAT_STATE_TAX[state]) {
    stateTax = Math.round(income * FLAT_STATE_TAX[state]);
  }

  const { socialSecurity, medicare } = calculatePayrollTaxes(income);

  const totalTax =
    federalTax + stateTax + nycTax + socialSecurity + medicare;

  const netSalary = income - totalTax;

  return {
    grossSalary: income,
    federalTax,
    stateTax,
    nycTax,
    socialSecurity,
    medicare,
    totalTax,
    netSalary,
    effectiveTaxRate: Number(((totalTax / income) * 100).toFixed(2)),
    monthlyTakeHome: Math.round(netSalary / 12),
    biWeeklyTakeHome: Math.round(netSalary / 26),
    taxYear,
  };
}

