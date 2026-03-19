import { getCostOfLivingIndex } from "@/lib/data/costOfLiving";

export interface CityComparison {
  originSalary: number;
  originCity: string;
  originCOL: number;
  targetCity: string;
  targetCOL: number;
  /** Salary needed in targetCity to match the same purchasing power */
  equivalentSalary: number;
  /** Positive means targetCity is more expensive, negative means cheaper */
  percentageDifference: number;
  /** Human-readable summary e.g. "$100k in Austin = $142k in NYC" */
  summary: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

/**
 * Returns how much salary you'd need in targetCity to maintain the same
 * purchasing power as `salary` in originCity.
 *
 * Formula: equivalentSalary = salary × (targetCOL / originCOL)
 *
 * Returns null if either city is missing from the COL dataset.
 */
export function compareSalaryAcrossCities(
  salary: number,
  originCity: string,
  targetCity: string
): CityComparison | null {
  const originCOL = getCostOfLivingIndex(originCity);
  const targetCOL = getCostOfLivingIndex(targetCity);

  if (originCOL === null || targetCOL === null) return null;

  const equivalentSalary = Math.round(salary * (targetCOL / originCOL));
  const percentageDifference = Number(
    (((targetCOL - originCOL) / originCOL) * 100).toFixed(1)
  );

  const origin = originCity
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  const target = targetCity
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

  const summary =
    equivalentSalary === salary
      ? `${fmt(salary)} in ${origin} has the same purchasing power as ${fmt(equivalentSalary)} in ${target}`
      : `${fmt(salary)} in ${origin} = ${fmt(equivalentSalary)} in ${target}`;

  return {
    originSalary: salary,
    originCity,
    originCOL,
    targetCity,
    targetCOL,
    equivalentSalary,
    percentageDifference,
    summary,
  };
}

/**
 * Compare a salary against multiple target cities at once.
 */
export function compareSalaryToManyCities(
  salary: number,
  originCity: string,
  targetCities: string[]
): CityComparison[] {
  return targetCities
    .map((city) => compareSalaryAcrossCities(salary, originCity, city))
    .filter((r): r is CityComparison => r !== null)
    .sort((a, b) => a.equivalentSalary - b.equivalentSalary);
}
