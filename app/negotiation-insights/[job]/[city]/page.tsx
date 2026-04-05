import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { generateNegotiationInsights } from "@/lib/content/negotiationInsights";
import { getSalaryEstimate } from "@/lib/data/salaryData";
import { getCityCostEntry, getStateCodeForCity, toTitle, fmtUSD } from "@/lib/stateCodeMap";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { buildPageMeta, SEED_JOBS, SEED_CITIES } from "@/lib/seo";
import jobsList from "@/data/jobs.json";

export const dynamic = "force-static";
export const revalidate = 604800;
export const dynamicParams = true;

// ── Seed: top 20 jobs × top 20 cities = 400 pages at build time ──────────────
// Remaining valid combinations are served on-demand via ISR.
export function generateStaticParams() {
  const params: Array<{ job: string; city: string }> = [];
  for (const job of SEED_JOBS.slice(0, 20)) {
    for (const city of SEED_CITIES.slice(0, 20)) {
      params.push({ job, city });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: { params: Promise<{ job: string; city: string }> }): Promise<Metadata> {
  const { job, city } = await params;
  return buildPageMeta({
    title: `${toTitle(job)} Salary Negotiation Guide — ${toTitle(city)} (2026)`,
    description: `How to negotiate your ${toTitle(job)} salary in ${toTitle(city)}. See market range, take-home pay, rent stress, and step-by-step negotiation tips.`,
    canonical: `/negotiation-insights/${job}/${city}`,
  });
}

// ── Salary range SVG ──────────────────────────────────────────────────────
function SalaryRangeChart({
  p25, median, p75, offer,
}: { p25: number; median: number; p75: number; offer: number }) {
  const low  = Math.round(p25 * 0.80);
  const high = Math.round(p75 * 1.20);
  const span = high - low;
  const x = (v: number) => Math.round(((v - low) / span) * 340) + 30;

  const offerX   = x(offer);
  const p25x     = x(p25);
  const medx     = x(median);
  const p75x     = x(p75);

  const offerColor =
    offer < p25   ? "#fca5a5" :  // rose-300
    offer > p75   ? "#6ee7b7" :  // emerald-300
                    "#93c5fd";   // blue-300

  return (
    <svg viewBox="0 0 400 90" className="w-full" aria-hidden="true">
      {/* Background track */}
      <rect x="30" y="34" width="340" height="14" rx="7" fill="#f1f5f9" />
      {/* P25–P75 band (pastel blue) */}
      <rect x={p25x} y="34" width={p75x - p25x} height="14" rx="4" fill="#bfdbfe" />
      {/* Median tick */}
      <rect x={medx - 2} y="28" width="4" height="26" rx="2" fill="#818cf8" />

      {/* Offer marker */}
      <polygon
        points={`${offerX},26 ${offerX - 7},14 ${offerX + 7},14`}
        fill={offerColor}
        stroke="white"
        strokeWidth="1.5"
      />
      <rect x={offerX - 28} y="2" width="56" height="14" rx="4" fill={offerColor} />
      <text x={offerX} y="12" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1e293b">
        {fmtUSD(offer)}
      </text>

      {/* P25 label */}
      <line x1={p25x} y1="48" x2={p25x} y2="58" stroke="#94a3b8" strokeWidth="1" />
      <text x={p25x} y="68" textAnchor="middle" fontSize="8.5" fill="#64748b">P25</text>
      <text x={p25x} y="78" textAnchor="middle" fontSize="8" fill="#94a3b8">{fmtUSD(p25)}</text>

      {/* Median label */}
      <line x1={medx} y1="54" x2={medx} y2="58" stroke="#6366f1" strokeWidth="1" />
      <text x={medx} y="68" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#4f46e5">Median</text>
      <text x={medx} y="78" textAnchor="middle" fontSize="8" fill="#6366f1">{fmtUSD(median)}</text>

      {/* P75 label */}
      <line x1={p75x} y1="48" x2={p75x} y2="58" stroke="#94a3b8" strokeWidth="1" />
      <text x={p75x} y="68" textAnchor="middle" fontSize="8.5" fill="#64748b">P75</text>
      <text x={p75x} y="78" textAnchor="middle" fontSize="8" fill="#94a3b8">{fmtUSD(p75)}</text>
    </svg>
  );
}

// ── Market position gauge ─────────────────────────────────────────────────
function MarketGauge({ offer, min, max }: { offer: number; min: number; max: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(((offer - min) / (max - min)) * 100)));
  const gaugeColor =
    pct < 33  ? "#fca5a5" :
    pct < 67  ? "#93c5fd" :
                "#6ee7b7";

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{fmtUSD(min)} (P25)</span>
        <span>{fmtUSD(max)} (P75)</span>
      </div>
      <div className="relative h-4 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: gaugeColor }}
        />
        <div
          className="absolute top-0 h-full w-1 bg-white/60 rounded"
          style={{ left: `50%` }}
          title="Median"
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-400">Below market</span>
        <span className="text-xs font-semibold" style={{ color: gaugeColor === "#fca5a5" ? "#dc2626" : gaugeColor === "#93c5fd" ? "#2563eb" : "#059669" }}>
          {pct}th percentile
        </span>
        <span className="text-xs text-slate-400">Above market</span>
      </div>
    </div>
  );
}

// ── Horizontal stat bar ───────────────────────────────────────────────────
function StatBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div className="h-2.5 rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Tip card colors (pastel cycle) ────────────────────────────────────────
const TIP_PALETTES = [
  { bg: "bg-sky-50",     border: "border-sky-200",     dot: "#38bdf8",  num: "bg-sky-200 text-sky-800" },
  { bg: "bg-violet-50",  border: "border-violet-200",  dot: "#a78bfa",  num: "bg-violet-200 text-violet-800" },
  { bg: "bg-emerald-50", border: "border-emerald-200", dot: "#34d399",  num: "bg-emerald-200 text-emerald-800" },
  { bg: "bg-amber-50",   border: "border-amber-200",   dot: "#fbbf24",  num: "bg-amber-200 text-amber-800" },
  { bg: "bg-rose-50",    border: "border-rose-200",    dot: "#fb7185",  num: "bg-rose-200 text-rose-800" },
  { bg: "bg-teal-50",    border: "border-teal-200",    dot: "#2dd4bf",  num: "bg-teal-200 text-teal-800" },
];

// ── Page ─────────────────────────────────────────────────────────────────
export default async function NegotiationInsightsPage({
  params,
}: { params: Promise<{ job: string; city: string }> }) {
  const { job, city } = await params;

  if (!(jobsList as string[]).includes(job)) return notFound();

  const est       = getSalaryEstimate(job);
  const cityEntry = getCityCostEntry(city);
  const stateCode = cityEntry?.stateCode ?? getStateCodeForCity(city);
  if (!est || !stateCode) return notFound();

  const jobTitle  = toTitle(job);
  const cityName  = cityEntry?.city ?? toTitle(city);
  const stateName = cityEntry?.state ?? "";

  const median = est.median;
  const p25    = est.p25;
  const p75    = est.p75;

  // Use median as the "offer" being evaluated
  const offer = median;

  const rent     = cityEntry?.rent ?? 1500;
  const colIndex = cityEntry ? 100 : 100; // fallback

  const taxResult  = calculateNetSalary({ salary: offer, state: stateCode });
  const netSalary  = taxResult.netSalary;
  const rentStress = Number(((rent * 12) / netSalary * 100).toFixed(1));

  // Generate insights from the library
  const insights = generateNegotiationInsights({
    city: cityName,
    state: stateName,
    jobTitle,
    salary: offer,
    netSalary,
    costOfLiving: colIndex,
    rent,
    marketSalaryRange: { min: p25, max: p75 },
    industry: job.includes("engineer") || job.includes("developer") || job.includes("data") || job.includes("devops") || job.includes("cloud") ? "Technology" : undefined,
  });

  const offerPosition =
    offer < p25  ? "below" :
    offer > p75  ? "above" : "within";

  const positionColors = {
    below:  { badge: "bg-rose-100 text-rose-700 border-rose-200",   text: "Your salary is below market range" },
    within: { badge: "bg-sky-100 text-sky-700 border-sky-200",      text: "Your salary is within market range" },
    above:  { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", text: "Your salary is above market range" },
  };
  const pos = positionColors[offerPosition];

  // After-tax comparison: this state vs no-tax state (TX)
  const txNet   = calculateNetSalary({ salary: offer, state: "TX" }).netSalary;
  const taxDiff = Math.abs(txNet - netSalary);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-violet-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <p className="text-xs font-semibold text-violet-500 uppercase tracking-widest mb-2">Salary Negotiation Guide · 2026</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            {jobTitle} in {cityName}
          </h1>
          <p className="text-slate-500 text-sm mb-5">
            Market rate analysis, after-tax take-home, and negotiation tactics for your offer.
          </p>

          {/* Position badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold mb-5 ${pos.badge}`}>
            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
            {pos.text}
          </div>

          {/* P25 / Median / P75 */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Entry (P25)",  value: fmtUSD(p25),    bg: "bg-rose-50   border-rose-100",   text: "text-rose-700" },
              { label: "Median",       value: fmtUSD(median), bg: "bg-violet-50 border-violet-100", text: "text-violet-700" },
              { label: "Senior (P75)", value: fmtUSD(p75),    bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Salary range SVG */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 mb-2">Salary range — national BLS data (your offer marked ▲)</p>
            <SalaryRangeChart p25={p25} median={median} p75={p75} offer={offer} />
          </div>

          {/* Market position gauge */}
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-400 mb-2">Market position (P25 → P75 band)</p>
            <MarketGauge offer={offer} min={p25} max={p75} />
          </div>
        </div>

        {/* ── Pay breakdown ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-5">After-Tax Breakdown in {cityName}</h2>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Gross Salary",    value: fmtUSD(offer),                   bg: "bg-sky-50",     text: "text-sky-700" },
              { label: "Total Tax",       value: fmtUSD(taxResult.totalTax),      bg: "bg-rose-50",    text: "text-rose-600" },
              { label: "Take-Home / yr",  value: fmtUSD(netSalary),               bg: "bg-emerald-50", text: "text-emerald-700" },
              { label: "Monthly",         value: fmtUSD(taxResult.monthlyTakeHome), bg: "bg-violet-50", text: "text-violet-700" },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl p-3 text-center ${k.bg}`}>
                <p className={`text-lg font-bold ${k.text}`}>{k.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Tax component bars */}
          <div className="space-y-3">
            {[
              { label: "Federal Income Tax", value: taxResult.federalTax,         color: "#93c5fd", pct: (taxResult.federalTax / offer) * 100 },
              { label: "State Income Tax",   value: taxResult.stateTax,           color: "#c4b5fd", pct: (taxResult.stateTax / offer) * 100 },
              { label: "Social Security",    value: taxResult.fica.socialSecurity, color: "#fda4af", pct: (taxResult.fica.socialSecurity / offer) * 100 },
              { label: "Medicare",           value: taxResult.fica.medicare,       color: "#fdba74", pct: (taxResult.fica.medicare / offer) * 100 },
              { label: "Take-Home",          value: netSalary,                    color: "#6ee7b7", pct: (netSalary / offer) * 100 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-800">
                    {fmtUSD(row.value)}
                    <span className="text-slate-400 font-normal text-xs ml-1">({row.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <StatBar pct={row.pct} color={row.color} />
              </div>
            ))}
          </div>

          {stateCode !== "TX" && (
            <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
              In Texas (no state income tax), the same {fmtUSD(offer)} salary yields <strong>{fmtUSD(txNet)}</strong> take-home —
              that's <strong>{fmtUSD(taxDiff)} more</strong> per year.
            </div>
          )}
        </div>

        {/* ── Rent stress ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Rent Affordability in {cityName}</h2>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Avg 1-BR Rent",       value: `${fmtUSD(rent)}/mo`,           bg: "bg-sky-50",    text: "text-sky-700" },
              { label: "Monthly Take-Home",   value: `${fmtUSD(taxResult.monthlyTakeHome)}/mo`, bg: "bg-emerald-50", text: "text-emerald-700" },
              { label: "Rent Burden",         value: `${rentStress}%`,               bg: rentStress > 30 ? "bg-rose-50" : "bg-teal-50", text: rentStress > 30 ? "text-rose-600" : "text-teal-700" },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl p-3 text-center ${k.bg}`}>
                <p className={`text-lg font-bold ${k.text}`}>{k.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Rent stress gradient gauge */}
          <div className="relative h-5 rounded-full overflow-hidden"
            style={{ background: "linear-gradient(to right, #6ee7b7, #fde68a, #fca5a5)" }}>
            <div
              className="absolute top-1 w-3 h-3 rounded-full bg-white border-2 border-slate-600 shadow"
              style={{ left: `calc(${Math.min(rentStress * 2, 97)}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0% Comfortable</span><span>25% Ideal limit</span><span>50%+ Stressed</span>
          </div>
        </div>

        {/* ── Negotiation tips ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Negotiation Insights</h2>
          <div className="space-y-3">
            {insights.map((tip, i) => {
              const pal = TIP_PALETTES[i % TIP_PALETTES.length];
              return (
                <div key={i} className={`flex gap-3 rounded-xl border p-4 ${pal.bg} ${pal.border}`}>
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pal.num}`}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── What to ask for ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-4">What to Ask For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Target Salary",        value: fmtUSD(Math.round(Math.min(p75, offer * 1.10))),  bg: "bg-emerald-50", text: "text-emerald-700", hint: "10% above offer or P75, whichever is lower" },
              { label: "Walk-Away Floor",      value: fmtUSD(Math.round(offer * 0.95)),                 bg: "bg-rose-50",    text: "text-rose-600",   hint: "Minimum acceptable — don't go below" },
              { label: "Signing Bonus Ask",    value: fmtUSD(Math.round(offer * 0.05)),                 bg: "bg-sky-50",     text: "text-sky-700",    hint: "~5% of annual salary is reasonable" },
              { label: "Equity / Bonus Worth", value: `${fmtUSD(Math.round(offer * 0.10))}+`,           bg: "bg-violet-50",  text: "text-violet-700", hint: "Total comp should include 10–20% upside" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 border ${item.bg} border-slate-100`}>
                <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.text}`}>{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Benefits checklist ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Benefits Negotiation Checklist</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ["401(k) match",           "bg-sky-100 text-sky-700"],
              ["Health / dental / vision","bg-violet-100 text-violet-700"],
              ["Signing bonus",          "bg-emerald-100 text-emerald-700"],
              ["Remote work policy",     "bg-amber-100 text-amber-700"],
              ["PTO / vacation days",    "bg-rose-100 text-rose-700"],
              ["Equity / stock options", "bg-teal-100 text-teal-700"],
              ["Annual raise timeline",  "bg-sky-100 text-sky-700"],
              ["Professional development","bg-violet-100 text-violet-700"],
              ["Relocation assistance",  "bg-emerald-100 text-emerald-700"],
              ["Flexible hours",         "bg-amber-100 text-amber-700"],
            ].map(([item, colors]) => (
              <div key={item} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${colors}`}>
                <span className="w-4 h-4 rounded border-2 border-current opacity-50 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── Compare cities ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Compare Other Cities</h2>
          <div className="flex flex-wrap gap-2">
            {["san-francisco","new-york-city","seattle","austin","denver","chicago","miami","boston"].filter(c => c !== city).map((c) => (
              <a key={c} href={`/negotiation-insights/${job}/${c}`}
                className="text-sm px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700 font-medium transition-colors">
                {toTitle(c)}
              </a>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pb-4">
          Salary data from BLS OEWS 2026. Tax calculations use 2026 federal and state brackets, single filer. Estimates only.
        </p>
      </div>
    </main>
  );
}
