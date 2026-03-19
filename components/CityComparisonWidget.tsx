"use client";

import { useState } from "react";

export type CityCompareData = {
  slug: string;
  name: string;
  netSalary: number;
  monthlyTakeHome: number;
  effectiveTaxRate: number;
  rent1br: number;
  rentRatio: number;
  rentLabel: string;
  rentColor: "green" | "yellow" | "red";
  lifestyleScore: number;
  colIndex: number;
  stateName: string;
};

function fmtUSD(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

const stressRing: Record<string, string> = {
  green:  "bg-green-100 text-green-700 border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  red:    "bg-red-100 text-red-700 border-red-200",
};

const scoreBg = (s: number) =>
  s >= 8 ? "text-green-600" : s >= 6 ? "text-blue-600" : s >= 4 ? "text-yellow-600" : "text-red-600";

type Props = {
  currentCity: CityCompareData;
  allCities: CityCompareData[];
};

export default function CityComparisonWidget({ currentCity, allCities }: Props) {
  const [selected, setSelected] = useState<CityCompareData[]>([]);

  const available = allCities.filter(
    (c) => c.slug !== currentCity.slug && !selected.find((s) => s.slug === c.slug)
  );

  function addCity(slug: string) {
    if (selected.length >= 4) return;
    const city = allCities.find((c) => c.slug === slug);
    if (city) setSelected((prev) => [...prev, city]);
  }

  function removeCity(slug: string) {
    setSelected((prev) => prev.filter((c) => c.slug !== slug));
  }

  const compared = [currentCity, ...selected];

  const metrics: {
    label: string;
    getValue: (c: CityCompareData) => string;
    getBest?: (cities: CityCompareData[]) => string; // slug of "best"
  }[] = [
    {
      label: "Annual Take-Home",
      getValue: (c) => fmtUSD(c.netSalary),
      getBest: (cs) => cs.reduce((a, b) => (b.netSalary > a.netSalary ? b : a)).slug,
    },
    {
      label: "Monthly Take-Home",
      getValue: (c) => fmtUSD(c.monthlyTakeHome),
      getBest: (cs) => cs.reduce((a, b) => (b.monthlyTakeHome > a.monthlyTakeHome ? b : a)).slug,
    },
    {
      label: "Effective Tax Rate",
      getValue: (c) => c.effectiveTaxRate + "%",
      getBest: (cs) => cs.reduce((a, b) => (b.effectiveTaxRate < a.effectiveTaxRate ? b : a)).slug,
    },
    {
      label: "Avg 1BR Rent",
      getValue: (c) => fmtUSD(c.rent1br) + "/mo",
      getBest: (cs) => cs.reduce((a, b) => (b.rent1br < a.rent1br ? b : a)).slug,
    },
    {
      label: "Rent Burden",
      getValue: (c) => `${(c.rentRatio * 100).toFixed(1)}% — ${c.rentLabel}`,
      getBest: (cs) => cs.reduce((a, b) => (b.rentRatio < a.rentRatio ? b : a)).slug,
    },
    {
      label: "COL Index",
      getValue: (c) => c.colIndex.toFixed(2),
      getBest: (cs) => cs.reduce((a, b) => (b.colIndex < a.colIndex ? b : a)).slug,
    },
    {
      label: "Lifestyle Score",
      getValue: (c) => `${c.lifestyleScore}/10`,
      getBest: (cs) => cs.reduce((a, b) => (b.lifestyleScore > a.lifestyleScore ? b : a)).slug,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Compare with Other Cities</h2>
      <p className="text-xs text-gray-400 mb-5">Select up to 4 cities to compare side-by-side</p>

      {/* City selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Current city chip (non-removable) */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white">
          {currentCity.name}
          <span className="text-blue-200 text-xs">(current)</span>
        </span>

        {/* Selected city chips */}
        {selected.map((c) => (
          <span
            key={c.slug}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200"
          >
            {c.name}
            <button
              onClick={() => removeCity(c.slug)}
              className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors leading-none"
              aria-label={`Remove ${c.name}`}
            >
              ×
            </button>
          </span>
        ))}

        {/* Add city dropdown */}
        {selected.length < 4 && available.length > 0 && (
          <select
            value=""
            onChange={(e) => addCity(e.target.value)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-dashed border-gray-300 text-gray-500 bg-white hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>+ Add city</option>
            {available
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
          </select>
        )}

        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Comparison table */}
      {selected.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          Select a city above to start comparing
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs text-gray-400 font-medium uppercase tracking-wide w-36">
                  Metric
                </th>
                {compared.map((c) => (
                  <th key={c.slug} className="text-center py-2 px-3 min-w-[120px]">
                    <span className={`block text-sm font-bold ${c.slug === currentCity.slug ? "text-blue-600" : "text-gray-900"}`}>
                      {c.name}
                    </span>
                    <span className="block text-xs font-normal text-gray-400">{c.stateName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const bestSlug = m.getBest ? m.getBest(compared) : null;
                return (
                  <tr key={m.label} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 text-xs text-gray-500">{m.label}</td>
                    {compared.map((c) => {
                      const isBest = bestSlug === c.slug && compared.length > 1;
                      return (
                        <td key={c.slug} className="py-3 px-3 text-center">
                          <span className={`font-semibold ${isBest ? "text-green-700" : "text-gray-800"}`}>
                            {isBest && <span className="mr-1 text-green-500">✓</span>}
                            {m.getValue(c)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Rent stress visual row */}
              <tr className="border-b border-gray-50">
                <td className="py-3 pr-4 text-xs text-gray-500">Rent Status</td>
                {compared.map((c) => (
                  <td key={c.slug} className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${stressRing[c.rentColor]}`}>
                      {c.rentLabel}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Quick compare link */}
      {selected.length === 1 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href={`/compare/${currentCity.slug}-vs-${selected[0].slug}`}
            className="text-sm text-blue-600 hover:underline"
          >
            See full comparison: {currentCity.name} vs {selected[0].name} →
          </a>
        </div>
      )}
    </div>
  );
}
