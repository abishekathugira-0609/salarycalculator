"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATES: [string, string][] = [
  ["alabama","Alabama"],["alaska","Alaska"],["arizona","Arizona"],["arkansas","Arkansas"],
  ["california","California"],["colorado","Colorado"],["connecticut","Connecticut"],["delaware","Delaware"],
  ["florida","Florida"],["georgia","Georgia"],["hawaii","Hawaii"],["idaho","Idaho"],
  ["illinois","Illinois"],["indiana","Indiana"],["iowa","Iowa"],["kansas","Kansas"],
  ["kentucky","Kentucky"],["louisiana","Louisiana"],["maine","Maine"],["maryland","Maryland"],
  ["massachusetts","Massachusetts"],["michigan","Michigan"],["minnesota","Minnesota"],["mississippi","Mississippi"],
  ["missouri","Missouri"],["montana","Montana"],["nebraska","Nebraska"],["nevada","Nevada"],
  ["new-hampshire","New Hampshire"],["new-jersey","New Jersey"],["new-mexico","New Mexico"],["new-york","New York"],
  ["north-carolina","North Carolina"],["north-dakota","North Dakota"],["ohio","Ohio"],["oklahoma","Oklahoma"],
  ["oregon","Oregon"],["pennsylvania","Pennsylvania"],["rhode-island","Rhode Island"],["south-carolina","South Carolina"],
  ["south-dakota","South Dakota"],["tennessee","Tennessee"],["texas","Texas"],["utah","Utah"],
  ["vermont","Vermont"],["virginia","Virginia"],["washington","Washington"],["west-virginia","West Virginia"],
  ["wisconsin","Wisconsin"],["wyoming","Wyoming"],["district-of-columbia","Washington D.C."],
];

const NO_TAX = new Set(["alaska","florida","nevada","new-hampshire","south-dakota","tennessee","texas","washington","wyoming"]);
const CONVENIENCE = new Set(["new-york","connecticut","delaware","pennsylvania","nebraska"]);

export default function RemoteTaxForm() {
  const router = useRouter();
  const [liveState, setLiveState] = useState("texas");
  const [workState, setWorkState] = useState("california");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (liveState === workState) {
      setError("Select two different states.");
      return;
    }
    setError("");
    router.push(`/remote-tax/${liveState}/${workState}`);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Select Your States</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              I live in
            </label>
            <div className="relative">
              <select
                value={liveState}
                onChange={(e) => { setLiveState(e.target.value); setError(""); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATES.map(([slug, name]) => (
                  <option key={slug} value={slug}>
                    {name}{NO_TAX.has(slug) ? " (no income tax)" : ""}
                  </option>
                ))}
              </select>
            </div>
            {NO_TAX.has(liveState) && (
              <p className="text-xs text-green-600 mt-1.5 font-medium">No state income tax — great for remote workers!</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              My employer is in
            </label>
            <div className="relative">
              <select
                value={workState}
                onChange={(e) => { setWorkState(e.target.value); setError(""); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATES.map(([slug, name]) => (
                  <option key={slug} value={slug}>
                    {name}{CONVENIENCE.has(slug) ? " ⚠ convenience rule" : ""}
                  </option>
                ))}
              </select>
            </div>
            {CONVENIENCE.has(workState) && (
              <p className="text-xs text-orange-600 mt-1.5 font-medium">
                ⚠ This state uses the &quot;convenience of employer&quot; rule — may tax your remote income.
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-3.5 transition-colors"
        >
          Calculate My Remote Tax Situation →
        </button>
      </form>
    </div>
  );
}
