import { calculateFederalTax, type FilingStatus } from "@/lib/tax/federalTax";
import { calculateFICA } from "@/lib/tax/fica";
import { calculateStateTax } from "@/lib/tax/stateTax";

export interface NetSalaryInput {
  salary: number;
  state: string;
  filingStatus?: FilingStatus;
  taxYear?: 2025 | 2026;
  /**
   * Optional city slug (e.g. "new-york-city"). Used to apply locality taxes
   * such as NYC local income tax when state is "NY".
   */
  locality?: string;
}

export interface NetSalaryResult {
  grossSalary: number;
  federalTax: number;
  stateTax: number;
  fica: {
    socialSecurity: number;
    medicare: number;
    additionalMedicare: number;
    total: number;
  };
  totalTax: number;
  netSalary: number;
  effectiveTaxRate: number;
  marginalFederalRate: number;
  monthlyTakeHome: number;
  biWeeklyTakeHome: number;
  taxYear: number;
  filingStatus: FilingStatus;
  state: string;
}

export function calculateNetSalary({
  salary,
  state,
  filingStatus = "single",
  taxYear = 2025,
  locality,
}: NetSalaryInput): NetSalaryResult {
  if (salary < 0) throw new RangeError("salary must be >= 0");
  if (!state) throw new TypeError("state is required");

  const federal = calculateFederalTax(salary, filingStatus, taxYear);
  const stateResult = calculateStateTax(state, salary, filingStatus, locality);
  const ficaResult = calculateFICA(salary, filingStatus, taxYear);

  const totalTax = federal.tax + stateResult.tax + ficaResult.total;
  const netSalary = salary - totalTax;

  return {
    grossSalary: salary,
    federalTax: federal.tax,
    stateTax: stateResult.tax,
    fica: ficaResult,
    totalTax,
    netSalary,
    effectiveTaxRate: salary > 0
      ? Number(((totalTax / salary) * 100).toFixed(2))
      : 0,
    marginalFederalRate: federal.marginalRate,
    monthlyTakeHome: Math.round(netSalary / 12),
    biWeeklyTakeHome: Math.round(netSalary / 26),
    taxYear,
    filingStatus,
    state: state.toUpperCase(),
  };
}
