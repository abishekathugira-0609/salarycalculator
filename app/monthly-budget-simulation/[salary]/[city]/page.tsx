import { notFound, permanentRedirect } from "next/navigation";

import type { Metadata } from "next";
import { calculateSalary } from "@/lib/tax";
import { getCityCostEntry, getStateCodeForCity, getStatePrimaryCity, toTitle } from "@/lib/stateCodeMap";
import { buildPageMeta } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ salary: string; city: string }>;
}): Promise<Metadata> {
  const { salary, city } = await params;
  const cityName = toTitle(city);
  return buildPageMeta({
    title: `$${Number(salary).toLocaleString()} Salary Monthly Budget in ${cityName} (2026)`,
    description: `See how far a $${Number(salary).toLocaleString()} salary goes in ${cityName}. Detailed monthly budget simulation with take-home pay, rent, and spending breakdown.`,
    canonical: `/monthly-budget-simulation/${salary}/${city}`,
  });
}

// ── SVG Donut Chart ──────────────────────────────────────────────────────────
const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Segment = { label: string; value: number; color: string };

function DonutChart({ segments, total }: { segments: Segment[]; total: number }) {
  let offset = 0;
  const slices = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const slice = { ...seg, dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <svg viewBox="0 0 140 140" className="w-full max-w-[220px]" aria-hidden="true">
      {/* background circle */}
      <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#f3f4f6" strokeWidth="22" />
      {slices.map((s) => (
        <circle
          key={s.label}
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          stroke={s.color}
          strokeWidth="22"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={CIRCUMFERENCE / 4 - s.offset}
          strokeLinecap="butt"
        />
      ))}
      {/* center label */}
      <text x="70" y="66" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="500">Monthly</text>
      <text x="70" y="80" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="500">Budget</text>
    </svg>
  );
}

// ── Horizontal bar ───────────────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function MonthlyBudgetSimulationPage({
  params,
}: {
  params: Promise<{ salary: string; city: string }>;
}) {
  const { salary: salaryParam, city: citySlug } = await params;
  const salary = Number(salaryParam);
  if (!salary || salary <= 0 || salary > 10_000_000) return notFound();

  const cityEntry = getCityCostEntry(citySlug);
  // Redirect state slugs (e.g. "new-york") to primary city (e.g. "new-york-city")
  if (!cityEntry) {
    const primaryCity = getStatePrimaryCity(citySlug);
    if (primaryCity) permanentRedirect(`/monthly-budget-simulation/${salaryParam}/${primaryCity}`);
  }
  const stateCode = cityEntry?.stateCode ?? getStateCodeForCity(citySlug);
  if (!stateCode) return notFound();

  const cityName = cityEntry?.city ?? toTitle(citySlug);
  const stateName = cityEntry?.state ?? "";

  const tax = calculateSalary(salary, stateCode, false, 2026, "single");

  const monthlyGross = Math.round(salary / 12);
  const monthlyTax = Math.round(tax.totalTax / 12);
  const monthlyNet = tax.monthlyTakeHome;

  const rent = cityEntry?.rent ?? 1500;
  const otherTotal = cityEntry?.other ?? 1000;

  const food = Math.round(otherTotal * 0.45);
  const transport = Math.round(otherTotal * 0.30);
  const healthcare = Math.round(otherTotal * 0.15);
  const entertainment = Math.round(otherTotal * 0.10);
  const totalExpenses = rent + food + transport + healthcare + entertainment;
  const savings = Math.max(0, monthlyNet - totalExpenses);
  const deficit = Math.max(0, totalExpenses - monthlyNet);

  const rentStressPct = Number(((rent / monthlyNet) * 100).toFixed(1));

  const BUDGET_COLORS = {
    housing:       "#3b82f6",
    food:          "#f97316",
    transport:     "#eab308",
    healthcare:    "#ec4899",
    entertainment: "#8b5cf6",
    savings:       "#22c55e",
    taxes:         "#ef4444",
  };

  const budgetSegments: Segment[] = [
    { label: "Housing",       value: rent,           color: BUDGET_COLORS.housing },
    { label: "Food",          value: food,           color: BUDGET_COLORS.food },
    { label: "Transport",     value: transport,      color: BUDGET_COLORS.transport },
    { label: "Healthcare",    value: healthcare,     color: BUDGET_COLORS.healthcare },
    { label: "Entertainment", value: entertainment,  color: BUDGET_COLORS.entertainment },
    { label: "Savings",       value: savings,        color: BUDGET_COLORS.savings },
    { label: "Taxes",         value: monthlyTax,     color: BUDGET_COLORS.taxes },
  ];

  const donutTotal = budgetSegments.reduce((s, x) => s + x.value, 0);

  const taxBarSegments = [
    { label: "Federal",   value: tax.federalTax,      color: BUDGET_COLORS.housing,  pct: (tax.federalTax / salary) * 100 },
    { label: "State",     value: tax.stateTax,        color: BUDGET_COLORS.entertainment, pct: (tax.stateTax / salary) * 100 },
    { label: "Medicare",  value: tax.medicare,        color: BUDGET_COLORS.healthcare, pct: (tax.medicare / salary) * 100 },
    { label: "Soc. Sec.", value: tax.socialSecurity,  color: BUDGET_COLORS.transport, pct: (tax.socialSecurity / salary) * 100 },
  ];

  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

  const rentStatusColor =
    rentStressPct < 25 ? "bg-green-100 text-green-700 border-green-200" :
    rentStressPct < 35 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    "bg-red-100 text-red-700 border-red-200";

  const rentStatusLabel =
    rentStressPct < 25 ? "Affordable" :
    rentStressPct < 35 ? "Moderate" : "High Burden";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-sm font-medium text-blue-600 mb-1">Monthly Budget Simulation · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
            {fmt(salary)} Salary in {cityName}
            {stateName ? `, ${stateName}` : ""}
          </h1>
          <p className="text-gray-500 text-sm">Single filer · federal + state taxes · estimates only</p>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Monthly Take-Home", value: fmt(monthlyNet), accent: "text-green-600", bg: "bg-green-50" },
              { label: "Monthly Taxes",     value: fmt(monthlyTax), accent: "text-red-500",   bg: "bg-red-50" },
              { label: "Effective Rate",    value: `${tax.effectiveTaxRate}%`, accent: "text-blue-600", bg: "bg-blue-50" },
              { label: "Rent Stress",       value: `${rentStressPct}%`, accent: rentStressPct < 30 ? "text-green-600" : "text-orange-600", bg: rentStressPct < 30 ? "bg-green-50" : "bg-orange-50" },
            ].map((k) => (
              <div key={k.label} className={`${k.bg} rounded-xl p-4 text-center`}>
                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                <p className={`text-xl font-bold ${k.accent}`}>{k.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Donut + Legend ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Monthly Budget Breakdown</h2>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Donut */}
            <div className="flex-shrink-0 w-48">
              <DonutChart segments={budgetSegments} total={donutTotal} />
            </div>

            {/* Legend + bars */}
            <div className="flex-1 w-full space-y-3">
              {budgetSegments.map((seg) => (
                <div key={seg.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="text-sm text-gray-700">{seg.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{fmt(seg.value)}</span>
                      <span className="text-xs text-gray-400 ml-1">/ mo</span>
                    </div>
                  </div>
                  <Bar pct={(seg.value / donutTotal) * 100} color={seg.color} />
                </div>
              ))}
              {deficit > 0 && (
                <p className="text-xs text-red-500 mt-2 font-medium">
                  ⚠ Expenses exceed take-home by {fmt(deficit)}/mo at this salary.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Tax breakdown bars ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Annual Tax Breakdown</h2>

          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden h-6 mb-5">
            {taxBarSegments.map((seg) => (
              <div
                key={seg.label}
                className="transition-all"
                style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                title={`${seg.label}: ${seg.pct.toFixed(1)}%`}
              />
            ))}
            <div
              className="flex-1 bg-green-400"
              title={`Take-home: ${((tax.netSalary / salary) * 100).toFixed(1)}%`}
            />
          </div>

          <div className="space-y-3">
            {taxBarSegments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="text-gray-700">{seg.label}</span>
                    <span className="font-semibold text-gray-900">
                      {fmt(seg.value)}
                      <span className="text-gray-400 font-normal text-xs ml-1">({seg.pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <Bar pct={seg.pct} color={seg.color} />
                </div>
              </div>
            ))}
            {/* Take-home */}
            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
              <span className="w-3 h-3 rounded-full flex-shrink-0 bg-green-400" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="font-semibold text-gray-900">Annual Take-Home</span>
                  <span className="font-bold text-green-600">{fmt(tax.netSalary)}</span>
                </div>
                <Bar pct={(tax.netSalary / salary) * 100} color="#4ade80" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Rent affordability card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rent Affordability in {cityName}</h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. 1-bed rent</span>
                <span className="font-semibold text-gray-900">{fmt(rent)}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly take-home</span>
                <span className="font-semibold text-gray-900">{fmt(monthlyNet)}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rent share</span>
                <span className="font-semibold text-gray-900">{rentStressPct}%</span>
              </div>
              {/* Rent stress gauge */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>0%</span><span>25% (ideal)</span><span>50%+</span>
                </div>
                <div className="relative w-full h-3 rounded-full overflow-hidden bg-gradient-to-r from-green-300 via-yellow-300 to-red-400">
                  <div
                    className="absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-gray-700 shadow"
                    style={{ left: `calc(${Math.min(rentStressPct * 2, 100)}% - 6px)` }}
                  />
                </div>
              </div>
            </div>
            <div className={`flex-shrink-0 rounded-xl border px-5 py-4 text-center ${rentStatusColor}`}>
              <p className="text-xs font-medium mb-1">Housing Status</p>
              <p className="text-2xl font-bold">{rentStatusLabel}</p>
              <p className="text-xs mt-1">{rentStressPct}% of net income</p>
            </div>
          </div>
        </div>

        {/* ── Pay period breakdown ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Weekly",    value: Math.round(tax.netSalary / 52),  icon: "📅" },
            { label: "Bi-weekly", value: tax.biWeeklyTakeHome,            icon: "🗓" },
            { label: "Monthly",   value: tax.monthlyTakeHome,             icon: "📆" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xl mb-1">{icon}</p>
              <p className="text-xs text-gray-500 mb-1">{label} take-home</p>
              <p className="text-lg font-bold text-gray-900">{fmt(value)}</p>
            </div>
          ))}
        </div>

        {/* ── Summary table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Full Monthly Budget Summary</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {[
                { label: "Gross Monthly Income", value: fmt(monthlyGross), bold: false, color: "text-gray-900" },
                { label: "— Federal Income Tax",  value: fmt(Math.round(tax.federalTax / 12)),     bold: false, color: "text-blue-600" },
                { label: "— State Income Tax",    value: fmt(Math.round(tax.stateTax / 12)),       bold: false, color: "text-purple-600" },
                { label: "— Social Security",     value: fmt(Math.round(tax.socialSecurity / 12)), bold: false, color: "text-orange-500" },
                { label: "— Medicare",            value: fmt(Math.round(tax.medicare / 12)),       bold: false, color: "text-pink-500" },
                { label: "Net Monthly Take-Home", value: fmt(monthlyNet),    bold: true,  color: "text-green-600" },
                { label: "— Housing (rent)",      value: fmt(rent),          bold: false, color: "text-gray-700" },
                { label: "— Food & Dining",       value: fmt(food),          bold: false, color: "text-gray-700" },
                { label: "— Transportation",      value: fmt(transport),     bold: false, color: "text-gray-700" },
                { label: "— Healthcare",          value: fmt(healthcare),    bold: false, color: "text-gray-700" },
                { label: "— Entertainment",       value: fmt(entertainment), bold: false, color: "text-gray-700" },
                { label: "Estimated Savings",     value: savings > 0 ? fmt(savings) : `−${fmt(deficit)} deficit`, bold: true, color: savings > 0 ? "text-green-600" : "text-red-500" },
              ].map(({ label, value, bold, color }) => (
                <tr key={label} className="hover:bg-gray-50">
                  <td className={`px-6 py-3 ${bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>{label}</td>
                  <td className={`px-6 py-3 text-right font-${bold ? "bold" : "medium"} ${color}`}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 text-center pb-4">
          Estimates based on 2026 tax rules, single filer. Rent from HUD FMR data. Individual results vary.
        </p>
      </div>
    </main>
  );
}
