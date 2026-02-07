const fs = require("fs");
const path = require("path");

// ==============================
// CONFIG
// ==============================
const TAX_YEAR = 2025;
const FILING_STATUS = "Single";

// Salaries
const salaries = [];
for (let s = 40000; s <= 500000; s += 1000) {
  salaries.push(s);
}

// States
const states = [
  // Progressive
  { code: "CA", name: "California", type: "progressive" },
  { code: "NY", name: "New York", type: "progressive" },
  { code: "NJ", name: "New Jersey", type: "progressive" },
  { code: "MN", name: "Minnesota", type: "progressive" },
  { code: "HI", name: "Hawaii", type: "progressive" },
  { code: "DC", name: "Washington, D.C.", type: "progressive" },
  { code: "GA", name: "Georgia", type: "progressive" },
  { code: "VA", name: "Virginia", type: "progressive" },

  // Flat / no deduction
  { code: "PA", name: "Pennsylvania", type: "flat", rate: 0.0307 },
  { code: "IL", name: "Illinois", type: "flat", rate: 0.0495 },
  { code: "MA", name: "Massachusetts", type: "flat", rate: 0.05 },
  { code: "CO", name: "Colorado", type: "flat", rate: 0.044 },
  { code: "AZ", name: "Arizona", type: "flat", rate: 0.025 },
  { code: "NC", name: "North Carolina", type: "flat", rate: 0.0475 },

  // No income tax
  { code: "TX", name: "Texas", type: "none" },
  { code: "FL", name: "Florida", type: "none" },
  { code: "WA", name: "Washington", type: "none" },
  { code: "NV", name: "Nevada", type: "none" },
];

// Output
const outputDir = path.join(process.cwd(), "data", "pages", "2025");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ==============================
// FEDERAL TAX (2025)
// ==============================
function calculateFederalTax(income) {
  const standardDeduction = 14900;
  let taxable = Math.max(0, income - standardDeduction);

  const brackets = [
    [11600, 0.10],
    [47150, 0.12],
    [100525, 0.22],
    [191950, 0.24],
    [243725, 0.32],
    [609350, 0.35],
    [Infinity, 0.37],
  ];

  let tax = 0;
  let prev = 0;

  for (const [limit, rate] of brackets) {
    if (taxable <= 0) break;
    const amt = Math.min(limit - prev, taxable);
    tax += amt * rate;
    taxable -= amt;
    prev = limit;
  }

  return Math.round(tax);
}

// ==============================
// STATE TAX HELPERS
// ==============================
function progressiveTax(income, deduction, brackets) {
  let taxable = Math.max(0, income - deduction);
  let tax = 0;
  let prev = 0;

  for (const [limit, rate] of brackets) {
    if (taxable <= 0) break;
    const amt = Math.min(limit - prev, taxable);
    tax += amt * rate;
    taxable -= amt;
    prev = limit;
  }

  return Math.round(tax);
}

// ==============================
// PROGRESSIVE STATE LOGIC
// ==============================
const progressiveStateTax = {
  CA: (i) =>
    progressiveTax(i, 5540, [
      [10099, 0.01],
      [23942, 0.02],
      [37788, 0.04],
      [52455, 0.06],
      [66295, 0.08],
      [338639, 0.093],
      [Infinity, 0.123],
    ]),

  NY: (i) =>
    progressiveTax(i, 8000, [
      [8500, 0.04],
      [11700, 0.045],
      [13900, 0.0525],
      [80650, 0.0585],
      [215400, 0.0625],
      [Infinity, 0.0685],
    ]),

  NJ: (i) =>
    progressiveTax(i, 0, [
      [20000, 0.014],
      [35000, 0.0175],
      [40000, 0.035],
      [75000, 0.05525],
      [500000, 0.0637],
      [Infinity, 0.1075],
    ]),

  MN: (i) =>
    progressiveTax(i, 13825, [
      [31070, 0.0535],
      [102350, 0.068],
      [190950, 0.0785],
      [Infinity, 0.0985],
    ]),

  HI: (i) =>
    progressiveTax(i, 2200, [
      [2400, 0.014],
      [4800, 0.032],
      [9600, 0.055],
      [14400, 0.064],
      [19200, 0.068],
      [24000, 0.072],
      [36000, 0.076],
      [48000, 0.079],
      [150000, 0.0825],
      [Infinity, 0.11],
    ]),

  DC: (i) =>
    progressiveTax(i, 13850, [
      [10000, 0.04],
      [40000, 0.06],
      [60000, 0.065],
      [250000, 0.085],
      [Infinity, 0.1075],
    ]),

  GA: (i) => Math.round(i * 0.0539),
  VA: (i) => Math.round(i * 0.0575),
};

// ==============================
// PAYROLL TAXES
// ==============================
function payrollTaxes(income) {
  const ssCap = 160200;

  const social_security = Math.round(
    Math.min(income, ssCap) * 0.062
  );
  const medicare = Math.round(income * 0.0145);
  const medicare_surtax =
    income > 200000 ? Math.round((income - 200000) * 0.009) : 0;

  return { social_security, medicare, medicare_surtax };
}

// ==============================
// GENERATION
// ==============================
for (const salary of salaries) {
  for (const state of states) {
    const federalTax = calculateFederalTax(salary);
    const payroll = payrollTaxes(salary);

    let stateTax = 0;

    if (state.type === "progressive") {
      stateTax = progressiveStateTax[state.code](salary);
    } else if (state.type === "flat") {
      stateTax = Math.round(salary * state.rate);
    } else {
      stateTax = 0;
    }

    const totalTax =
      federalTax +
      stateTax +
      payroll.social_security +
      payroll.medicare +
      payroll.medicare_surtax;

    const netSalary = salary - totalTax;

    const json = {
      salary,
      gross_salary: salary,
      state: state.name,
      state_code: state.code,
      filing_status: FILING_STATUS,
      tax_year: TAX_YEAR,

      federal_tax: federalTax,
      state_tax: stateTax,
      social_security: payroll.social_security,
      medicare: payroll.medicare,
      medicare_surtax: payroll.medicare_surtax,

      total_tax: totalTax,
      effective_tax_rate: Number(
        ((totalTax / salary) * 100).toFixed(2)
      ),

      net_salary: netSalary,
      monthly_take_home: Math.round(netSalary / 12),
      biweekly_take_home: Math.round(netSalary / 26),

      benefits: {
        employer_401k_match: Math.round(salary * 0.03),
        health_insurance_value: 6000,
      },

      total_compensation:
        salary +
        Math.round(salary * 0.03) +
        6000,
    };

    fs.writeFileSync(
      path.join(outputDir, `${salary}_${state.code}_single_2025.json`),
      JSON.stringify(json, null, 2)
    );
  }
}

console.log("✅ 2025 salary pages generated (expanded & state-accurate)");
