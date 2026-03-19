"use client";

import React, { useState } from "react";
import { jobOfferRealityCheck, FilingStatus } from "@/lib/content/jobOfferRealityCheck";
import { CITY_COSTS } from "@/data/city-costs";
import { getRent } from "@/lib/data/rentData";
import { getCOLData } from "@/lib/data/costOfLiving";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import jobsList from "@/data/jobs.json";
import blsRaw from "@/data/bls-salary.json";

const BLS_DATA = blsRaw as Record<string, { median: number; p25: number; p75: number }>;

// ── Static option lists ────────────────────────────────────────────────────────
// Use Map to deduplicate by slug+stateCode — no mutable module-level state
const CITIES_LIST: { slug: string; name: string; stateCode: string }[] = Array.from(
  new Map(
    Object.values(CITY_COSTS)
      .flat()
      .map((c) => {
        const slug = c.city.toLowerCase().replace(/\s+/g, "-");
        return [`${slug}-${c.stateCode.toLowerCase()}`, { slug, name: c.city, stateCode: c.stateCode }] as const;
      })
  ).values()
).sort((a, b) => a.name.localeCompare(b.name));

const JOBS_LIST: { slug: string; name: string }[] = (jobsList as string[]).map((j) => ({
  slug: j,
  name: j.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));

type InputState = {
  city: string; state: string; jobTitle: string;
  salary: number; netSalary: number;
  rent: number; rentStress: number; costOfLiving: number;
  filingStatus: FilingStatus;
  taxBreakdown: { federal: number; state: number; fica: number; effectiveRate: number };
  benefits: string;
};

const EMPTY: InputState = {
  city: "", state: "", jobTitle: "", salary: 0, netSalary: 0,
  rent: 0, rentStress: 0, costOfLiving: 100, filingStatus: "single",
  taxBreakdown: { federal: 0, state: 0, fica: 0, effectiveRate: 0 },
  benefits: "",
};

// Pastel example card colors
const EXAMPLE_PASTELS = [
  { card: "bg-violet-50 border-violet-200", title: "text-violet-700", tag: "text-violet-400" },
  { card: "bg-emerald-50 border-emerald-200", title: "text-emerald-700", tag: "text-emerald-400" },
  { card: "bg-rose-50 border-rose-200", title: "text-rose-700", tag: "text-rose-400" },
  { card: "bg-sky-50 border-sky-200", title: "text-sky-700", tag: "text-sky-400" },
];

const EXAMPLES: { label: string; tag: string; emoji: string; data: InputState }[] = [
  {
    label: "Software Engineer — San Francisco", tag: "High COL · Single", emoji: "💻",
    data: {
      city: "San Francisco", state: "CA", jobTitle: "Software Engineer",
      salary: 145000, netSalary: 94250, rent: 2800, rentStress: 35.7, costOfLiving: 168,
      filingStatus: "single",
      taxBreakdown: { federal: 26100, state: 10150, fica: 11093, effectiveRate: 32.7 },
      benefits: "401k match 4%, health/dental/vision, 15 days PTO, $2k home office stipend",
    },
  },
  {
    label: "Registered Nurse — Austin, TX", tag: "No state tax · Married", emoji: "🏥",
    data: {
      city: "Austin", state: "TX", jobTitle: "Registered Nurse",
      salary: 80000, netSalary: 61440, rent: 1650, rentStress: 32.2, costOfLiving: 97,
      filingStatus: "married_jointly",
      taxBreakdown: { federal: 10400, state: 0, fica: 6120, effectiveRate: 20.7 },
      benefits: "Full health insurance, 3 weeks PTO, shift differential pay",
    },
  },
  {
    label: "High School Teacher — Chicago, IL", tag: "Head of Household", emoji: "📚",
    data: {
      city: "Chicago", state: "IL", jobTitle: "High School Teacher",
      salary: 58000, netSalary: 43500, rent: 1400, rentStress: 38.6, costOfLiving: 107,
      filingStatus: "head_of_household",
      taxBreakdown: { federal: 5800, state: 2900, fica: 4437, effectiveRate: 25.1 },
      benefits: "Pension plan, summers off, health insurance, tuition reimbursement",
    },
  },
  {
    label: "Product Manager — New York City", tag: "Very high COL · MFS", emoji: "🗽",
    data: {
      city: "New York City", state: "NY", jobTitle: "Product Manager",
      salary: 130000, netSalary: 82550, rent: 3200, rentStress: 46.5, costOfLiving: 187,
      filingStatus: "married_separately",
      taxBreakdown: { federal: 24700, state: 10400, fica: 9945, effectiveRate: 34.6 },
      benefits: "RSUs, 401k match 6%, unlimited PTO, commuter benefits",
    },
  },
];

// Grade helpers — pastel variant
function grade(value: number, thresholds: [number, string, string, string, string][]) {
  for (const [limit, letter, bg, border, text] of thresholds) {
    if (value <= limit) return { letter, bg, border, text };
  }
  return { letter: "F", bg: "bg-red-100", border: "border-red-200", text: "text-red-600" };
}
function rentGrade(pct: number) {
  return grade(pct, [
    [25, "A", "bg-emerald-100", "border-emerald-200", "text-emerald-700"],
    [33, "B", "bg-lime-100",    "border-lime-200",    "text-lime-700"],
    [40, "C", "bg-amber-100",   "border-amber-200",   "text-amber-700"],
    [50, "D", "bg-orange-100",  "border-orange-200",  "text-orange-700"],
  ]);
}
function taxGrade(pct: number) {
  return grade(pct, [
    [20, "A", "bg-emerald-100", "border-emerald-200", "text-emerald-700"],
    [27, "B", "bg-lime-100",    "border-lime-200",    "text-lime-700"],
    [33, "C", "bg-amber-100",   "border-amber-200",   "text-amber-700"],
    [38, "D", "bg-orange-100",  "border-orange-200",  "text-orange-700"],
  ]);
}
function colGrade(index: number) {
  return grade(index, [
    [95,  "A", "bg-emerald-100", "border-emerald-200", "text-emerald-700"],
    [110, "B", "bg-lime-100",    "border-lime-200",    "text-lime-700"],
    [130, "C", "bg-amber-100",   "border-amber-200",   "text-amber-700"],
    [160, "D", "bg-orange-100",  "border-orange-200",  "text-orange-700"],
  ]);
}
function overallGrade(letters: string[]) {
  const map: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const avg = letters.reduce((s, l) => s + (map[l] ?? 0), 0) / letters.length;
  if (avg >= 3.5) return { letter:"A", bg:"bg-emerald-100", border:"border-emerald-200", text:"text-emerald-700", headerBg:"bg-emerald-50"  };
  if (avg >= 2.5) return { letter:"B", bg:"bg-lime-100",    border:"border-lime-200",    text:"text-lime-700",    headerBg:"bg-lime-50"     };
  if (avg >= 1.5) return { letter:"C", bg:"bg-amber-100",   border:"border-amber-200",   text:"text-amber-700",   headerBg:"bg-amber-50"    };
  if (avg >= 0.5) return { letter:"D", bg:"bg-orange-100",  border:"border-orange-200",  text:"text-orange-700",  headerBg:"bg-orange-50"   };
  return                 { letter:"F", bg:"bg-red-100",     border:"border-red-200",     text:"text-red-700",     headerBg:"bg-red-50"      };
}

const STEP_HEADERS = [
  { bg: "bg-violet-50", border: "border-violet-100", title: "text-violet-700", sub: "text-violet-400", dot: "bg-violet-300 text-violet-700", dotActive: "bg-violet-500 text-white", line: "bg-violet-200" },
  { bg: "bg-sky-50",    border: "border-sky-100",    title: "text-sky-700",    sub: "text-sky-400",    dot: "bg-sky-300 text-sky-700",       dotActive: "bg-sky-500 text-white",    line: "bg-sky-200"    },
  { bg: "bg-teal-50",   border: "border-teal-100",   title: "text-teal-700",   sub: "text-teal-400",   dot: "bg-teal-300 text-teal-700",     dotActive: "bg-teal-500 text-white",   line: "bg-teal-200"   },
];

const ANALYSIS_ITEMS = [
  { key:"summary",     label:"Pay Summary",      icon:"💰", bg:"bg-blue-50",    border:"border-blue-100",    label2:"text-blue-600"    },
  { key:"taxAdvice",   label:"Tax Analysis",     icon:"📊", bg:"bg-violet-50",  border:"border-violet-100",  label2:"text-violet-600"  },
  { key:"rentAdvice",  label:"Rent Assessment",  icon:"🏠", bg:"bg-rose-50",    border:"border-rose-100",    label2:"text-rose-600"    },
  { key:"colAdvice",   label:"Cost of Living",   icon:"🛒", bg:"bg-amber-50",   border:"border-amber-100",   label2:"text-amber-600"   },
  { key:"action",      label:"Actionable Tips",  icon:"✅", bg:"bg-emerald-50", border:"border-emerald-100", label2:"text-emerald-600" },
];

const STEPS = ["Job & Pay", "Location & Housing", "Your Report"];

export default function JobOfferRealityCheckPage() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<InputState>(EMPTY);
  const [result, setResult] = useState<ReturnType<typeof jobOfferRealityCheck> | null>(null);
  const [activeExample, setActiveExample] = useState<number | null>(null);

  function set(field: keyof InputState, value: any) { setInput((p) => ({ ...p, [field]: value })); }
  function setTax(field: keyof InputState["taxBreakdown"], value: number) {
    setInput((p) => ({ ...p, taxBreakdown: { ...p.taxBreakdown, [field]: value } }));
  }

  function calcTaxes(salary: number, stateCode: string) {
    if (!salary || !stateCode) return null;
    const fsMap: Record<string, "single" | "married-jointly" | "married-separately" | "head-of-household"> = {
      single: "single",
      married_jointly: "married-jointly",
      married_separately: "married-separately",
      head_of_household: "head-of-household",
    };
    const r = calculateNetSalary({ salary, state: stateCode, filingStatus: fsMap[input.filingStatus] ?? "single" });
    return {
      federal: r.federalTax,
      state: r.stateTax,
      fica: r.fica.total,
      effectiveRate: r.effectiveTaxRate,
      netSalary: r.netSalary,
    };
  }

  function handleCityChange(uid: string) {
    // uid format: "slug-statecode" e.g. "auburn-al"
    const lastDash = uid.lastIndexOf("-");
    const slug = uid.slice(0, lastDash);
    const stateCode = uid.slice(lastDash + 1).toUpperCase();
    const cityEntry = CITIES_LIST.find((c) => c.slug === slug && c.stateCode === stateCode);
    if (!cityEntry) return;
    const rent = getRent(slug);
    const col = getCOLData(slug);
    const monthlyRent = rent?.["1br"] ?? 0;
    const colIndex = col ? Math.round(col.index * 100) : 100;
    setInput((p) => {
      const taxes = p.salary > 0 ? calcTaxes(p.salary, stateCode) : null;
      const netSalary = taxes?.netSalary ?? p.netSalary;
      const monthlyNet = netSalary > 0 ? netSalary / 12 : 0;
      const rentStress = monthlyNet > 0 && monthlyRent > 0
        ? parseFloat(((monthlyRent / monthlyNet) * 100).toFixed(1))
        : p.rentStress;
      return {
        ...p,
        city: cityEntry.name,
        state: cityEntry.stateCode,
        rent: monthlyRent,
        costOfLiving: colIndex,
        rentStress,
        ...(taxes && {
          netSalary: taxes.netSalary,
          taxBreakdown: { federal: taxes.federal, state: taxes.state, fica: taxes.fica, effectiveRate: taxes.effectiveRate },
        }),
      };
    });
  }
  function loadExample(i: number) { setInput(EXAMPLES[i].data); setActiveExample(i); setResult(null); setStep(0); }
  function next() { if (step === 1) setResult(jobOfferRealityCheck(input)); setStep((s) => Math.min(s + 1, 2)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }
  function restart() { setStep(0); setResult(null); setActiveExample(null); setInput(EMPTY); }

  const rGrade = input.rentStress > 0 ? rentGrade(input.rentStress) : null;
  const tGrade = input.taxBreakdown.effectiveRate > 0 ? taxGrade(input.taxBreakdown.effectiveRate) : null;
  const cGrade = colGrade(input.costOfLiving);
  const oGrade = rGrade && tGrade ? overallGrade([rGrade.letter, tGrade.letter, cGrade.letter]) : null;

  // ── Salary benchmark (BLS national × city COL) ───────────────────────────
  const jobSlug = JOBS_LIST.find((j) => j.name === input.jobTitle)?.slug ?? null;
  const citySlug = CITIES_LIST.find((c) => c.name === input.city && c.stateCode === input.state)?.slug ?? null;
  const colForBenchmark = citySlug ? (getCOLData(citySlug)?.index ?? 1.0) : 1.0;
  const blsEntry = jobSlug ? BLS_DATA[jobSlug] : null;
  const benchmark = blsEntry
    ? {
        low:     Math.round((blsEntry.p25    * colForBenchmark) / 1000) * 1000,
        typical: Math.round((blsEntry.median * colForBenchmark) / 1000) * 1000,
        high:    Math.round((blsEntry.p75    * colForBenchmark) / 1000) * 1000,
        nationalMedian: blsEntry.median,
      }
    : null;

  function offerPosition(salary: number, bm: typeof benchmark) {
    if (!bm || !salary) return null;
    if (salary < bm.low)     return { label: "Below market",        sub: "Below 25th percentile",        color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200"    };
    if (salary < bm.typical) return { label: "Below median",         sub: "25th–50th percentile",          color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
    if (salary < bm.high)    return { label: "Above median",         sub: "50th–75th percentile",          color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200"   };
    return                          { label: "Top of market",        sub: "Above 75th percentile",         color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200"  };
  }
  const offerPos = benchmark && input.salary > 0 ? offerPosition(input.salary, benchmark) : null;

  const sh = STEP_HEADERS[step];

  return (
    <main className="min-h-screen bg-slate-50 pb-16">

      {/* ── Pastel header ── */}
      <div className={`${sh.bg} border-b ${sh.border} px-6 py-10 transition-colors duration-300`}>
        <div className="max-w-2xl mx-auto">
          <span className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white border ${sh.border} ${sh.title} mb-4`}>
            Job Offer Reality Check
          </span>
          <h1 className={`text-3xl font-extrabold ${sh.title} mb-1`}>Is This Offer Worth It?</h1>
          <p className={`${sh.sub} text-sm`}>We score every offer on tax burden, rent affordability, and cost of living.</p>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-8">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    i < step  ? `${sh.dotActive} border-transparent`
                    : i===step ? `bg-white ${sh.title} border-current`
                    : "bg-white/60 text-gray-300 border-gray-200"
                  }`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm hidden sm:inline font-medium ${
                    i===step ? sh.title : i<step ? sh.sub : "text-gray-300"
                  }`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-1 rounded-full bg-gray-200">
                    <div className={`h-1 rounded-full ${sh.line} transition-all duration-500 ${i < step ? "w-full" : "w-0"}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        {/* ── Example cards ── */}
        {step === 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Load an Example</p>
            <div className="grid grid-cols-2 gap-3">
              {EXAMPLES.map((ex, i) => {
                const c = EXAMPLE_PASTELS[i];
                return (
                  <button key={i} onClick={() => loadExample(i)}
                    className={`text-left rounded-2xl p-4 border-2 ${c.card} hover:shadow-md active:scale-[0.98] transition-all ${
                      activeExample === i ? "ring-2 ring-offset-2 ring-violet-300" : ""
                    }`}>
                    <div className="text-2xl mb-2">{ex.emoji}</div>
                    <div className={`font-bold text-sm leading-tight ${c.title}`}>{ex.label}</div>
                    <div className={`text-xs mt-1 ${c.tag}`}>{ex.tag}</div>
                    {activeExample === i && <div className={`mt-2 text-xs font-bold ${c.title}`}>✓ Loaded</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 0: Job & Pay ── */}
        {step === 0 && (
          <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
            <div className="bg-violet-50 border-b border-violet-100 px-6 py-4">
              <h2 className="text-violet-700 font-bold text-lg">💼 Job & Pay Details</h2>
              <p className="text-violet-400 text-xs mt-0.5">Tell us about the offer</p>
            </div>
            <div className="p-6 space-y-4">
              {/* City — own row, outside the 2-col grid to avoid col-span hydration mismatch */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  City
                  <span className="ml-1 normal-case font-normal text-violet-400">— selects state & auto-calculates taxes</span>
                </label>
                <select
                  value={CITIES_LIST.find((c) => c.name === input.city && c.stateCode === input.state)
                    ? `${CITIES_LIST.find((c) => c.name === input.city && c.stateCode === input.state)!.slug}-${input.state.toLowerCase()}`
                    : ""}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full border-2 border-gray-100 focus:border-violet-300 rounded-xl px-3 py-2.5 outline-none transition text-sm bg-gray-50 focus:bg-white"
                >
                  <option value="" disabled>Select a city…</option>
                  {CITIES_LIST.map((c) => {
                    const uid = `${c.slug}-${c.stateCode.toLowerCase()}`;
                    return <option key={uid} value={uid}>{c.name}, {c.stateCode}</option>;
                  })}
                </select>
                {input.state && (
                  <p className="mt-1 text-xs text-violet-500">
                    State: <strong>{input.state}</strong> — taxes will auto-calculate when you enter salary below
                  </p>
                )}
              </div>

              {/* ── Salary Benchmark (shown when job + city are both selected) ── */}
              {benchmark && input.city && input.jobTitle && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">
                        📊 {input.jobTitle} salaries in {input.city}, {input.state}
                      </p>
                      <p className="text-xs text-indigo-300 mt-0.5">
                        BLS Occupational Employment Survey · adjusted for local cost of living
                      </p>
                    </div>
                    {offerPos && (
                      <span className={`shrink-0 ml-3 text-xs font-bold px-2.5 py-1 rounded-full border ${offerPos.bg} ${offerPos.border} ${offerPos.color}`}>
                        {offerPos.label}
                      </span>
                    )}
                  </div>

                  {/* Three salary tiers */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { tier: "Low",     value: benchmark.low,     sub: "25th percentile", color: "text-red-500",    bg: "bg-white" },
                      { tier: "Typical", value: benchmark.typical, sub: "Median",           color: "text-indigo-600", bg: "bg-white" },
                      { tier: "High",    value: benchmark.high,    sub: "75th percentile", color: "text-green-600",  bg: "bg-white" },
                    ].map(({ tier, value, sub, color, bg }) => (
                      <div key={tier} className={`${bg} rounded-xl border border-indigo-100 p-3 text-center`}>
                        <p className="text-xs text-gray-400 mb-0.5">{tier}</p>
                        <p className={`text-base font-extrabold ${color}`}>${(value / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Visual range bar */}
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-visible mb-1">
                    {/* Colored range: low → high */}
                    <div
                      className="absolute top-0 h-3 rounded-full bg-gradient-to-r from-red-300 via-indigo-400 to-green-400"
                      style={{
                        left: `${((benchmark.low - benchmark.low * 0.7) / (benchmark.high * 1.3 - benchmark.low * 0.7)) * 100}%`,
                        right: `${100 - ((benchmark.high - benchmark.low * 0.7) / (benchmark.high * 1.3 - benchmark.low * 0.7)) * 100}%`,
                      }}
                    />
                    {/* Offered salary pin */}
                    {input.salary > 0 && (() => {
                      const minVal = benchmark.low * 0.7;
                      const maxVal = benchmark.high * 1.3;
                      const pct = Math.min(100, Math.max(0, ((input.salary - minVal) / (maxVal - minVal)) * 100));
                      return (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow"
                          style={{ left: `${pct}%`, transform: "translateX(-50%) translateY(-50%)" }}
                          title={`Your offer: $${input.salary.toLocaleString()}`}
                        />
                      );
                    })()}
                  </div>
                  <div className="flex justify-between text-xs text-gray-300 mt-1">
                    <span>${(benchmark.low / 1000).toFixed(0)}k low</span>
                    <span>${(benchmark.typical / 1000).toFixed(0)}k typical</span>
                    <span>${(benchmark.high / 1000).toFixed(0)}k high</span>
                  </div>
                  {offerPos && input.salary > 0 && (
                    <p className={`mt-2 text-xs font-medium ${offerPos.color}`}>
                      Your offer of ${input.salary.toLocaleString()} is {offerPos.sub.toLowerCase()} for this role in {input.city}.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Job Title</label>
                  <select
                    value={JOBS_LIST.find((j) => j.name === input.jobTitle)?.slug ?? ""}
                    onChange={(e) => {
                      const job = JOBS_LIST.find((j) => j.slug === e.target.value);
                      set("jobTitle", job?.name ?? "");
                    }}
                    className="w-full border-2 border-gray-100 focus:border-violet-300 rounded-xl px-3 py-2.5 outline-none transition text-sm bg-gray-50 focus:bg-white"
                  >
                    <option value="" disabled>Select a job title…</option>
                    {JOBS_LIST.map((j) => (
                      <option key={j.slug} value={j.slug}>{j.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Filing Status</label>
                  <select value={input.filingStatus} onChange={(e) => set("filingStatus", e.target.value as FilingStatus)}
                    className="w-full border-2 border-gray-100 focus:border-violet-300 rounded-xl px-3 py-2.5 outline-none bg-gray-50 focus:bg-white transition text-sm">
                    <option value="single">Single</option>
                    <option value="married_jointly">Married Filing Jointly</option>
                    <option value="married_separately">Married Filing Separately</option>
                    <option value="head_of_household">Head of Household</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Annual Salary ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-300 text-sm">$</span>
                    <input type="number" value={input.salary || ""} onChange={(e) => {
                      const salary = Number(e.target.value);
                      setInput((p) => {
                        if (!salary || !p.state) return { ...p, salary };
                        const taxes = calcTaxes(salary, p.state);
                        if (!taxes) return { ...p, salary };
                        const monthlyNet = taxes.netSalary / 12;
                        const rentStress = p.rent > 0 && monthlyNet > 0
                          ? parseFloat(((p.rent / monthlyNet) * 100).toFixed(1))
                          : p.rentStress;
                        return {
                          ...p, salary,
                          netSalary: taxes.netSalary,
                          rentStress,
                          taxBreakdown: { federal: taxes.federal, state: taxes.state, fica: taxes.fica, effectiveRate: taxes.effectiveRate },
                        };
                      });
                    }}
                      className="w-full border-2 border-gray-100 focus:border-violet-300 rounded-xl pl-7 pr-3 py-2.5 outline-none transition text-sm bg-gray-50 focus:bg-white" placeholder="95000" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Net Annual Pay ($)
                    {input.state && input.salary > 0 && <span className="ml-1 normal-case font-normal text-violet-400">auto-calculated</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-300 text-sm">$</span>
                    <input type="number" value={input.netSalary || ""} onChange={(e) => set("netSalary", Number(e.target.value))}
                      className="w-full border-2 border-gray-100 focus:border-violet-300 rounded-xl pl-7 pr-3 py-2.5 outline-none transition text-sm bg-gray-50 focus:bg-white" placeholder="After taxes" />
                  </div>
                </div>
              </div>

              <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
                <p className="text-xs font-bold text-violet-500 uppercase tracking-wide mb-1">📊 Tax Breakdown
                  <span className="ml-2 normal-case font-normal text-violet-400">
                    {input.state && input.salary > 0 ? "· auto-calculated from salary & city" : "· optional — fill in city & salary to auto-calculate"}
                  </span>
                </p>
                <p className="text-xs text-violet-300 mb-3">You can override these values if you have exact figures.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([
                    { key:"federal",       label:"Federal Tax",  accent:"border-blue-200   focus:border-blue-400",   prefix:"$" },
                    { key:"state",         label:"State Tax",    accent:"border-orange-200 focus:border-orange-400", prefix:"$" },
                    { key:"fica",          label:"FICA",         accent:"border-purple-200 focus:border-purple-400", prefix:"$" },
                    { key:"effectiveRate", label:"Eff. Rate",    accent:"border-rose-200   focus:border-rose-400",   prefix:"%" },
                  ] as const).map(({ key, label, accent, prefix }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1">{label}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-gray-300 text-xs">{prefix}</span>
                        <input type="number" value={input.taxBreakdown[key] || ""}
                          onChange={(e) => setTax(key, Number(e.target.value))}
                          className={`w-full border-2 ${accent} rounded-lg pl-6 pr-2 py-1.5 outline-none transition text-sm bg-white`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">🎁 Benefits & Perks</label>
                <textarea value={input.benefits} onChange={(e) => set("benefits", e.target.value)} rows={2}
                  className="w-full border-2 border-gray-100 focus:border-violet-300 rounded-xl px-3 py-2.5 outline-none transition text-sm bg-gray-50 focus:bg-white"
                  placeholder="401k, health insurance, PTO, equity, remote work…" />
              </div>
              <div className="flex justify-end">
                <button onClick={next}
                  className="bg-violet-100 text-violet-700 border border-violet-200 px-8 py-2.5 rounded-xl font-bold hover:bg-violet-200 transition text-sm">
                  Next: Location →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Location & Housing ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="bg-sky-50 border-b border-sky-100 px-6 py-4">
              <h2 className="text-sky-700 font-bold text-lg">📍 Location & Housing</h2>
              <p className="text-sky-400 text-xs mt-0.5">Where is the job, and what's rent like?</p>
            </div>
            <div className="p-6 space-y-4">
              {/* City summary — selected in Step 0 */}
              {input.city ? (
                <div className="flex items-center justify-between bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs text-sky-400 font-semibold uppercase tracking-wide mb-0.5">Job Location</p>
                    <p className="text-sky-800 font-bold">{input.city}, {input.state}</p>
                  </div>
                  <button onClick={() => { setStep(0); }} className="text-xs text-sky-500 hover:underline">← Change city</button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
                  ⚠ No city selected — go back to Step 1 and choose a city to get real rent & COL data.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Monthly Rent ($)
                    {input.city && <span className="ml-1 normal-case font-normal text-sky-400">auto-filled</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-300 text-sm">$</span>
                    <input type="number" value={input.rent || ""} onChange={(e) => {
                      const rent = Number(e.target.value);
                      const monthlyNet = input.netSalary > 0 ? input.netSalary / 12 : 0;
                      const rentStress = monthlyNet > 0 && rent > 0
                        ? parseFloat(((rent / monthlyNet) * 100).toFixed(1))
                        : input.rentStress;
                      setInput((p) => ({ ...p, rent, rentStress }));
                    }}
                      className="w-full border-2 border-gray-100 focus:border-sky-300 rounded-xl pl-7 pr-3 py-2.5 outline-none transition text-sm bg-gray-50 focus:bg-white" placeholder="1800" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Rent Stress
                    {input.city && input.netSalary > 0 && <span className="ml-1 normal-case font-normal text-sky-400">auto-calculated</span>}
                    {!(input.city && input.netSalary > 0) && <span className="normal-case font-normal text-gray-300"> (% of monthly net)</span>}
                  </label>
                  <div className="relative">
                    <input type="number" value={input.rentStress || ""} onChange={(e) => set("rentStress", Number(e.target.value))}
                      className="w-full border-2 border-gray-100 focus:border-sky-300 rounded-xl px-3 pr-8 py-2.5 outline-none transition text-sm bg-gray-50 focus:bg-white" placeholder="28" />
                    <span className="absolute right-3 top-2.5 text-gray-300 text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100">
                <label className="block text-xs font-bold text-sky-500 uppercase tracking-wide mb-2">
                  🛒 Cost of Living Index <span className="normal-case font-normal text-sky-400">(100 = US avg{input.city ? " · auto-filled" : ""})</span>
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" value={input.costOfLiving} onChange={(e) => set("costOfLiving", Number(e.target.value))}
                    className="w-24 border-2 border-sky-200 focus:border-sky-400 rounded-xl px-3 py-2 outline-none text-sm font-bold text-center bg-white" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-300 mb-1.5">
                      <span>Cheap 70</span><span>Avg 100</span><span>Exp 200+</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-200 relative">
                      <div className="absolute top-1/2 w-4 h-4 bg-white border-2 border-sky-400 rounded-full shadow-sm"
                        style={{ left:`${Math.min(Math.max(((input.costOfLiving-70)/130)*100,0),100)}%`, transform:"translateX(-50%) translateY(-50%)" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-1">
                <button onClick={back} className="text-gray-400 hover:text-gray-600 px-5 py-2.5 rounded-xl border-2 border-gray-100 hover:border-gray-200 font-medium transition text-sm">
                  ← Back
                </button>
                <button onClick={next} className="bg-sky-100 text-sky-700 border border-sky-200 px-8 py-2.5 rounded-xl font-bold hover:bg-sky-200 transition text-sm">
                  Get My Report →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Report Card ── */}
        {step === 2 && result && oGrade && rGrade && tGrade && (
          <div className="space-y-4">

            {/* Overall grade */}
            <div className={`${oGrade.headerBg} rounded-2xl border-2 ${oGrade.border} p-6 flex items-center gap-5`}>
              <div className={`w-24 h-24 rounded-2xl ${oGrade.bg} border-2 ${oGrade.border} flex items-center justify-center text-6xl font-black ${oGrade.text} shadow-sm`}>
                {oGrade.letter}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Overall Offer Score</p>
                <p className={`text-xl font-extrabold ${oGrade.text}`}>{input.jobTitle}</p>
                <p className="text-gray-400 text-sm">in {input.city}, {input.state}</p>
                <p className="text-gray-600 text-sm mt-2">{result.verdict}</p>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:"Rent Burden",    value:`${input.rentStress.toFixed(1)}%`,                    sub:"of net income",    g:rGrade, icon:"🏠" },
                { label:"Tax Rate",       value:`${input.taxBreakdown.effectiveRate.toFixed(1)}%`,     sub:"effective rate",   g:tGrade, icon:"📊" },
                { label:"Cost of Living", value:String(input.costOfLiving),                           sub:"index (avg=100)",  g:cGrade, icon:"🛒" },
              ].map(({ label, value, sub, g, icon }) => (
                <div key={label} className={`${g.bg} border-2 ${g.border} rounded-2xl p-4 text-center`}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className={`text-4xl font-black ${g.text} mb-1`}>{g.letter}</div>
                  <div className={`text-lg font-bold ${g.text}`}>{value}</div>
                  <div className={`text-xs mt-0.5 ${g.text} opacity-80`}>{label}</div>
                  <div className={`text-xs ${g.text} opacity-60`}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Pay stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:"Gross Salary", value:`$${input.salary.toLocaleString()}`,                     bg:"bg-indigo-50",  border:"border-indigo-100",  text:"text-indigo-700" },
                { label:"Net Annual",   value:`$${input.netSalary.toLocaleString()}`,                   bg:"bg-emerald-50", border:"border-emerald-100", text:"text-emerald-700" },
                { label:"Monthly Net",  value:`$${Math.round(input.netSalary/12).toLocaleString()}`,    bg:"bg-teal-50",    border:"border-teal-100",    text:"text-teal-700" },
              ].map(({ label, value, bg, border, text }) => (
                <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
                  <p className={`${text} text-xs opacity-70 mb-1`}>{label}</p>
                  <p className={`font-extrabold text-lg ${text}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Salary Benchmark vs Market */}
            {benchmark && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">
                  📊 Market Salary Benchmark — {input.jobTitle} in {input.city}, {input.state}
                </p>
                <p className="text-xs text-indigo-300 mb-4">
                  BLS Occupational Employment Survey · adjusted for {input.city} cost of living (COL ×{colForBenchmark.toFixed(2)})
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { tier: "Low",     value: benchmark.low,     sub: "25th pct",  color: "text-red-600",    bg: "bg-white border-red-100"     },
                    { tier: "Typical", value: benchmark.typical, sub: "Median",     color: "text-indigo-700", bg: "bg-indigo-100 border-indigo-200" },
                    { tier: "High",    value: benchmark.high,    sub: "75th pct",  color: "text-green-700",  bg: "bg-white border-green-100"   },
                  ].map(({ tier, value, sub, color, bg }) => {
                    const isOffer = input.salary > 0 && (
                      (tier === "Low"     && input.salary < benchmark!.typical && input.salary >= benchmark!.low * 0.8) ||
                      (tier === "Typical" && input.salary >= benchmark!.low    && input.salary <= benchmark!.high) ||
                      (tier === "High"    && input.salary > benchmark!.typical && input.salary <= benchmark!.high * 1.2)
                    );
                    return (
                      <div key={tier} className={`rounded-xl border p-3 text-center ${bg} ${isOffer ? "ring-2 ring-indigo-400" : ""}`}>
                        <p className="text-xs text-gray-400 mb-0.5">{tier}</p>
                        <p className={`text-lg font-extrabold ${color}`}>${(value / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Position bar */}
                <div className="relative h-3 bg-gray-200 rounded-full mb-1">
                  <div
                    className="absolute top-0 h-3 rounded-full bg-gradient-to-r from-red-300 via-indigo-400 to-green-400"
                    style={{
                      left:  `${((benchmark.low - benchmark.low * 0.7) / (benchmark.high * 1.3 - benchmark.low * 0.7)) * 100}%`,
                      right: `${100 - ((benchmark.high - benchmark.low * 0.7) / (benchmark.high * 1.3 - benchmark.low * 0.7)) * 100}%`,
                    }}
                  />
                  {input.salary > 0 && (() => {
                    const min = benchmark.low * 0.7, max = benchmark.high * 1.3;
                    const pct = Math.min(100, Math.max(0, ((input.salary - min) / (max - min)) * 100));
                    return (
                      <div
                        className="absolute top-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow"
                        style={{ left: `${pct}%`, transform: "translateX(-50%) translateY(-50%)" }}
                      />
                    );
                  })()}
                </div>
                <div className="flex justify-between text-xs text-gray-300 mb-2">
                  <span>${(benchmark.low / 1000).toFixed(0)}k</span>
                  <span>${(benchmark.typical / 1000).toFixed(0)}k median</span>
                  <span>${(benchmark.high / 1000).toFixed(0)}k</span>
                </div>

                {offerPos && (
                  <div className={`rounded-xl px-4 py-2 border text-sm font-medium ${offerPos.bg} ${offerPos.border} ${offerPos.color}`}>
                    {offerPos.label} · {offerPos.sub} — your offer of ${input.salary.toLocaleString()} is{" "}
                    {input.salary >= benchmark.typical
                      ? `$${(input.salary - benchmark.typical).toLocaleString()} above the local median`
                      : `$${(benchmark.typical - input.salary).toLocaleString()} below the local median`}
                    {" "}for this role.
                  </div>
                )}
              </div>
            )}

            {/* Analysis */}
            <div className="space-y-3">
              {ANALYSIS_ITEMS.map(({ key, label, icon, bg, border, label2 }) => {
                const texts: Record<string, string> = {
                  summary: result.summary, taxAdvice: result.taxAdvice,
                  rentAdvice: result.rentAdvice, colAdvice: result.colAdvice, action: result.action,
                };
                return (
                  <div key={key} className={`${bg} border ${border} rounded-2xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wide ${label2} mb-1`}>{icon} {label}</p>
                    <p className="text-gray-600 text-sm">{texts[key]}</p>
                  </div>
                );
              })}
              {input.benefits && (
                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-pink-500 mb-1">🎁 Benefits & Perks</p>
                  <p className="text-gray-600 text-sm">{input.benefits}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={back} className="text-gray-400 px-5 py-2.5 rounded-xl border-2 border-gray-100 hover:border-gray-200 font-medium text-sm transition">
                ← Edit
              </button>
              <button onClick={restart} className="bg-violet-100 text-violet-700 border border-violet-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-violet-200 transition">
                ✨ Check Another Offer
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
