import type { FilingStatus } from "./federalTax";

export interface StateTaxResult {
  tax: number;
  effectiveRate: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function progressive(
  taxableIncome: number,
  brackets: { limit: number; rate: number }[]
): number {
  let tax = 0;
  let prev = 0;
  let remaining = taxableIncome;

  for (const b of brackets) {
    if (remaining <= 0) break;
    const slice = Math.min(b.limit - prev, remaining);
    tax += slice * b.rate;
    remaining -= slice;
    prev = b.limit;
  }

  return Math.round(tax);
}

function flat(income: number, rate: number, deduction = 0): number {
  return Math.round(Math.max(0, income - deduction) * rate);
}

function result(tax: number, income: number): StateTaxResult {
  return {
    tax,
    effectiveRate: income > 0 ? Number(((tax / income) * 100).toFixed(2)) : 0,
  };
}

// ── No-income-tax states ─────────────────────────────────────────────────────
const NO_INCOME_TAX = new Set([
  "AK", "FL", "NV", "NH", "SD", "TN", "TX", "WA", "WY",
]);

// ── Flat-rate states ─────────────────────────────────────────────────────────
// state code → [rate, standard deduction (single)]
const FLAT_STATES: Record<string, [number, number]> = {
  AZ: [0.025,    0],        // 2.5% (2024+)
  CO: [0.044,    0],        // 4.4%
  GA: [0.0549,   0],        // 5.49% (2024); drops each year toward 4.99%
  ID: [0.058,    0],        // 5.8%
  IL: [0.0495,   0],        // 4.95%
  IN: [0.0305,   0],        // 3.05% (2024)
  IA: [0.038,    0],        // 3.8% flat (2025)
  KY: [0.04,     0],        // 4.0% (2024)
  MA: [0.05,     0],        // 5% (surtax on income >$1M handled below)
  MI: [0.0425,   0],        // 4.25%
  MS: [0.047,    0],        // 4.7% (2024, heading to 4.4% by 2026)
  NC: [0.045,    0],        // 4.5% (2025)
  PA: [0.0307,   0],        // 3.07%
  SC: [0.064,    0],        // 6.4% flat (2024 simplification)
  UT: [0.0485,   0],        // 4.85%
};

// ── Progressive states (all 50 − no-tax − flat) ──────────────────────────────
function calculateByState(state: string, income: number): number {
  switch (state) {
    // ── Alabama ──────────────────────────────────────────────────────────────
    case "AL": {
      const deduction = 2500; // single standard deduction
      const ti = Math.max(0, income - deduction);
      return progressive(ti, [
        { limit:   500, rate: 0.02 },
        { limit:  3000, rate: 0.04 },
        { limit: Infinity, rate: 0.05 },
      ]);
    }

    // ── Arkansas ─────────────────────────────────────────────────────────────
    case "AR":
      return progressive(income, [
        { limit:  5000, rate: 0.02 },
        { limit: 10000, rate: 0.04 },
        { limit: Infinity, rate: 0.047 }, // 4.7% (2024 top rate)
      ]);

    // ── California ───────────────────────────────────────────────────────────
    case "CA": {
      const ti = Math.max(0, income - 5540);
      const baseTax = progressive(ti, [
        { limit:  10099, rate: 0.01 },
        { limit:  23942, rate: 0.02 },
        { limit:  37788, rate: 0.04 },
        { limit:  52455, rate: 0.06 },
        { limit:  66295, rate: 0.08 },
        { limit: 338639, rate: 0.093 },
        { limit: 1000000, rate: 0.103 },
        { limit: Infinity, rate: 0.123 },
      ]);
      // CA Mental Health Services Tax: 1% on income over $1M
      const mhst = income > 1_000_000 ? Math.round((income - 1_000_000) * 0.01) : 0;
      return baseTax + mhst;
    }

    // ── Connecticut ──────────────────────────────────────────────────────────
    case "CT":
      return progressive(income, [
        { limit:  10000, rate: 0.03 },
        { limit:  50000, rate: 0.05 },
        { limit: 100000, rate: 0.055 },
        { limit: 200000, rate: 0.06 },
        { limit: 250000, rate: 0.065 },
        { limit: 500000, rate: 0.069 },
        { limit: Infinity, rate: 0.0699 },
      ]);

    // ── Delaware ─────────────────────────────────────────────────────────────
    case "DE":
      return progressive(income, [
        { limit:   2000, rate: 0.00 },
        { limit:   5000, rate: 0.022 },
        { limit:  10000, rate: 0.039 },
        { limit:  20000, rate: 0.048 },
        { limit:  25000, rate: 0.052 },
        { limit:  60000, rate: 0.0555 },
        { limit: Infinity, rate: 0.066 },
      ]);

    // ── Hawaii ───────────────────────────────────────────────────────────────
    case "HI":
      return progressive(income, [
        { limit:   2400, rate: 0.014 },
        { limit:   4800, rate: 0.032 },
        { limit:   9600, rate: 0.055 },
        { limit:  14400, rate: 0.064 },
        { limit:  19200, rate: 0.068 },
        { limit:  24000, rate: 0.072 },
        { limit:  36000, rate: 0.076 },
        { limit:  48000, rate: 0.079 },
        { limit: 150000, rate: 0.0825 },
        { limit: 175000, rate: 0.09 },
        { limit: 200000, rate: 0.10 },
        { limit: Infinity, rate: 0.11 },
      ]);

    // ── Kansas ───────────────────────────────────────────────────────────────
    case "KS":
      return progressive(income, [
        { limit:  15000, rate: 0.031 },
        { limit:  30000, rate: 0.0525 },
        { limit: Infinity, rate: 0.057 },
      ]);

    // ── Louisiana ────────────────────────────────────────────────────────────
    case "LA":
      return progressive(income, [
        { limit:  12500, rate: 0.0185 },
        { limit:  50000, rate: 0.035 },
        { limit: Infinity, rate: 0.0425 },
      ]);

    // ── Maine ────────────────────────────────────────────────────────────────
    case "ME":
      return progressive(income, [
        { limit:  26050, rate: 0.058 },
        { limit:  61600, rate: 0.0675 },
        { limit: Infinity, rate: 0.0715 },
      ]);

    // ── Maryland ─────────────────────────────────────────────────────────────
    case "MD":
      return progressive(income, [
        { limit:   1000, rate: 0.02 },
        { limit:   2000, rate: 0.03 },
        { limit:   3000, rate: 0.04 },
        { limit: 100000, rate: 0.0475 },
        { limit: 125000, rate: 0.05 },
        { limit: 150000, rate: 0.0525 },
        { limit: 250000, rate: 0.055 },
        { limit: Infinity, rate: 0.0575 },
      ]);

    // ── Minnesota ────────────────────────────────────────────────────────────
    case "MN":
      return progressive(income, [
        { limit:  31690, rate: 0.0535 },
        { limit: 104090, rate: 0.068 },
        { limit: 193240, rate: 0.0785 },
        { limit: Infinity, rate: 0.0985 },
      ]);

    // ── Missouri ─────────────────────────────────────────────────────────────
    case "MO":
      return progressive(income, [
        { limit:   1207, rate: 0.00 },
        { limit:   2414, rate: 0.02 },
        { limit:   3621, rate: 0.025 },
        { limit:   4828, rate: 0.03 },
        { limit:   6034, rate: 0.035 },
        { limit:   7241, rate: 0.04 },
        { limit:   8448, rate: 0.045 },
        { limit: Infinity, rate: 0.0495 }, // 4.95% top (2024)
      ]);

    // ── Montana ──────────────────────────────────────────────────────────────
    case "MT":
      return progressive(income, [
        { limit:  20500, rate: 0.047 },
        { limit: Infinity, rate: 0.0675 },
      ]);

    // ── Nebraska ─────────────────────────────────────────────────────────────
    case "NE":
      return progressive(income, [
        { limit:   3700, rate: 0.0246 },
        { limit:  22170, rate: 0.0351 },
        { limit:  35730, rate: 0.0501 },
        { limit: Infinity, rate: 0.0584 },
      ]);

    // ── New Jersey ───────────────────────────────────────────────────────────
    case "NJ":
      return progressive(income, [
        { limit:  20000, rate: 0.014 },
        { limit:  35000, rate: 0.0175 },
        { limit:  40000, rate: 0.035 },
        { limit:  75000, rate: 0.05525 },
        { limit: 500000, rate: 0.0637 },
        { limit: 1000000, rate: 0.0897 },
        { limit: Infinity, rate: 0.1075 },
      ]);

    // ── New Mexico ───────────────────────────────────────────────────────────
    case "NM":
      return progressive(income, [
        { limit:   5500, rate: 0.017 },
        { limit:  11000, rate: 0.032 },
        { limit:  16000, rate: 0.047 },
        { limit: 210000, rate: 0.049 },
        { limit: Infinity, rate: 0.059 },
      ]);

    // ── New York ─────────────────────────────────────────────────────────────
    case "NY": {
      const ti = Math.max(0, income - 8000);
      return ti > 0 ? progressive(ti, [
        { limit:   8500, rate: 0.04 },
        { limit:  11700, rate: 0.045 },
        { limit:  13900, rate: 0.0525 },
        { limit:  80650, rate: 0.0585 },
        { limit: 215400, rate: 0.0625 },
        { limit: 1077550, rate: 0.0685 },
        { limit: 5000000, rate: 0.0965 },
        { limit: 25000000, rate: 0.103 },
        { limit: Infinity, rate: 0.109 },
      ]) : 0;
    }

    // ── Ohio ─────────────────────────────────────────────────────────────────
    case "OH":
      return progressive(income, [
        { limit:  26050, rate: 0.00 },
        { limit: 100000, rate: 0.0275 },
        { limit: Infinity, rate: 0.035 },
      ]);

    // ── Oklahoma ─────────────────────────────────────────────────────────────
    case "OK":
      return progressive(income, [
        { limit:  1000, rate: 0.0025 },
        { limit:  2500, rate: 0.0075 },
        { limit:  3750, rate: 0.0175 },
        { limit:  4900, rate: 0.0275 },
        { limit:  7200, rate: 0.0375 },
        { limit: Infinity, rate: 0.0475 },
      ]);

    // ── Oregon ───────────────────────────────────────────────────────────────
    case "OR":
      return progressive(income, [
        { limit:  18400, rate: 0.0475 },
        { limit:  46200, rate: 0.0675 },
        { limit: 250000, rate: 0.0875 },
        { limit: Infinity, rate: 0.099 },
      ]);

    // ── Rhode Island ─────────────────────────────────────────────────────────
    case "RI":
      return progressive(income, [
        { limit:  77450, rate: 0.0375 },
        { limit: 176050, rate: 0.0475 },
        { limit: Infinity, rate: 0.0599 },
      ]);

    // ── Virginia ─────────────────────────────────────────────────────────────
    case "VA":
      return progressive(income, [
        { limit:  3000, rate: 0.02 },
        { limit:  5000, rate: 0.03 },
        { limit: 17000, rate: 0.05 },
        { limit: Infinity, rate: 0.0575 },
      ]);

    // ── Vermont ──────────────────────────────────────────────────────────────
    case "VT":
      return progressive(income, [
        { limit:  45400, rate: 0.0335 },
        { limit: 110050, rate: 0.066 },
        { limit: 229550, rate: 0.076 },
        { limit: Infinity, rate: 0.0875 },
      ]);

    // ── West Virginia ────────────────────────────────────────────────────────
    case "WV":
      return progressive(income, [
        { limit:  10000, rate: 0.03 },
        { limit:  25000, rate: 0.04 },
        { limit:  40000, rate: 0.045 },
        { limit:  60000, rate: 0.06 },
        { limit: Infinity, rate: 0.065 },
      ]);

    // ── Wisconsin ────────────────────────────────────────────────────────────
    case "WI":
      return progressive(income, [
        { limit:  14320, rate: 0.035 },
        { limit:  28640, rate: 0.044 },
        { limit: 315310, rate: 0.053 },
        { limit: Infinity, rate: 0.0765 },
      ]);

    // ── DC ───────────────────────────────────────────────────────────────────
    case "DC":
      return progressive(income, [
        { limit:  10000, rate: 0.04 },
        { limit:  40000, rate: 0.06 },
        { limit:  60000, rate: 0.065 },
        { limit: 350000, rate: 0.085 },
        { limit: 1000000, rate: 0.0925 },
        { limit: Infinity, rate: 0.1075 },
      ]);

    // ── Massachusetts (surtax on income > $1M) ───────────────────────────────
    case "MA": {
      const base = flat(income, 0.05);
      const surtax = income > 1_000_000 ? Math.round((income - 1_000_000) * 0.04) : 0;
      return base + surtax;
    }

    default:
      return 0;
  }
}

// ── NYC local income tax brackets (single filer, 2025) ───────────────────────
// Source: NYC Department of Finance — applies to NYC residents (all 5 boroughs)
const NYC_LOCAL_BRACKETS = [
  { limit:  12000, rate: 0.03078 },
  { limit:  25000, rate: 0.03762 },
  { limit:  50000, rate: 0.03819 },
  { limit: Infinity, rate: 0.03876 },
];

/** City slugs that fall within New York City's five boroughs */
const NYC_LOCALITIES = new Set([
  "new-york-city", "brooklyn", "queens", "bronx", "staten-island", "manhattan",
]);

// ── Public API ───────────────────────────────────────────────────────────────
/**
 * @param locality  Optional city slug (e.g. "new-york-city"). Used to apply
 *                  NYC local income tax when state is NY and locality is an
 *                  NYC borough.
 */
export function calculateStateTax(
  state: string,
  income: number,
  _filingStatus: FilingStatus = "single", // reserved for future MFJ bracket splits
  locality?: string
): StateTaxResult {
  const code = state.toUpperCase().trim();

  if (NO_INCOME_TAX.has(code)) return result(0, income);

  // Flat-rate states
  if (FLAT_STATES[code]) {
    const [rate, deduction] = FLAT_STATES[code];
    const tax = flat(income, rate, deduction);
    return result(tax, income);
  }

  // Progressive states
  let tax = calculateByState(code, income);

  // NYC local income tax (applied on top of NY state tax)
  if (code === "NY" && locality && NYC_LOCALITIES.has(locality.toLowerCase())) {
    tax += progressive(income, NYC_LOCAL_BRACKETS);
  }

  return result(tax, income);
}

export { NO_INCOME_TAX };
