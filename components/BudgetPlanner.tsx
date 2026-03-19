"use client";

interface Category {
  label: string;
  pct: number;
  amount: number;
  color: string;
  barColor: string;
  examples: string[];
}

interface Props {
  netMonthly: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function BudgetPlanner({ netMonthly }: Props) {
  const annual = netMonthly * 12;

  const categories: Category[] = [
    {
      label: "Needs",
      pct: 50,
      amount: netMonthly * 0.5,
      color: "text-blue-700",
      barColor: "bg-blue-500",
      examples: ["Rent / mortgage", "Groceries", "Utilities", "Insurance", "Minimum debt payments", "Transportation"],
    },
    {
      label: "Wants",
      pct: 30,
      amount: netMonthly * 0.3,
      color: "text-purple-700",
      barColor: "bg-purple-500",
      examples: ["Dining out", "Streaming services", "Gym", "Hobbies", "Travel", "Shopping"],
    },
    {
      label: "Savings",
      pct: 20,
      amount: netMonthly * 0.2,
      color: "text-green-700",
      barColor: "bg-green-500",
      examples: ["Emergency fund", "401(k) / IRA", "Investments", "Down payment fund", "Debt payoff (extra)"],
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">50 / 30 / 20 Budget Planner</h3>
        <p className="text-sm text-gray-500 mt-1">
          Based on your monthly take-home of{" "}
          <span className="font-semibold text-gray-700">{fmt(netMonthly)}</span>
          {" "}({fmt(annual)}/yr)
        </p>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden">
        {categories.map((c) => (
          <div
            key={c.label}
            className={`${c.barColor}`}
            style={{ width: `${c.pct}%` }}
            title={`${c.label} — ${c.pct}%`}
          />
        ))}
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        {categories.map((c) => (
          <span key={c.label} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${c.barColor}`} />
            {c.label} {c.pct}%
          </span>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${c.color}`}>{c.label}</span>
              <span className="text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                {c.pct}%
              </span>
            </div>
            <div>
              <p className={`text-2xl font-bold ${c.color}`}>{fmt(c.amount)}</p>
              <p className="text-xs text-gray-400">per month</p>
            </div>
            <div className={`h-1 rounded-full ${c.barColor} opacity-30`} />
            <ul className="space-y-1">
              {c.examples.map((ex) => (
                <li key={ex} className="text-xs text-gray-500 flex items-start gap-1">
                  <span className="mt-0.5 shrink-0 text-gray-300">›</span>
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Annual totals */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
        {categories.map((c) => (
          <div key={c.label} className="text-center">
            <p className="text-xs text-gray-400">{c.label} / year</p>
            <p className={`text-sm font-semibold ${c.color}`}>{fmt(c.amount * 12)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
