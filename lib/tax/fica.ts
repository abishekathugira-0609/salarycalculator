import type { FilingStatus } from "./federalTax";

export interface FICAResult {
  socialSecurity: number;
  medicare: number;
  additionalMedicare: number;
  total: number;
}

// Social Security wage bases — SSA COLA announcements
// 2025: IRS Notice 2024-80 / SSA announcement Oct 2024 — $176,100
// 2026: SSA COLA announcement Oct 2025 — $180,700 (confirmed ~2.6% increase)
const SS_WAGE_BASE: Record<number, number> = {
  2025: 176_100,
  2026: 180_700,
};

const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_RATE = 0.009;

// Additional Medicare threshold varies by filing status
const ADDITIONAL_MEDICARE_THRESHOLD: Record<FilingStatus, number> = {
  single:               200_000,
  "married-jointly":    250_000,
  "married-separately": 125_000,
  "head-of-household":  200_000,
};

export function calculateFICA(
  income: number,
  filingStatus: FilingStatus = "single",
  taxYear: 2025 | 2026 = 2025
): FICAResult {
  const wageBase = SS_WAGE_BASE[taxYear] ?? SS_WAGE_BASE[2025];
  const socialSecurity = Math.round(Math.min(income, wageBase) * SS_RATE);
  const medicare = Math.round(income * MEDICARE_RATE);

  const threshold = ADDITIONAL_MEDICARE_THRESHOLD[filingStatus];
  const additionalMedicare =
    income > threshold
      ? Math.round((income - threshold) * ADDITIONAL_MEDICARE_RATE)
      : 0;

  return {
    socialSecurity,
    medicare,
    additionalMedicare,
    total: socialSecurity + medicare + additionalMedicare,
  };
}
