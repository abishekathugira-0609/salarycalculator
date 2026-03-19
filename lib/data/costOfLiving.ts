import colData from "@/data/cost-of-living.json";

export interface COLData {
  /** COL index relative to US average (1.00 = national average). Sources: C2ER/ACCRA, derived from HUD FMR + BLS CPI. */
  index: number;
  /** Estimated monthly food cost for one adult (USDA low-cost food plan × COL index). */
  foodMonthly: number;
  /** Estimated monthly transport cost (BLS Consumer Expenditure Survey avg × COL index). */
  transportMonthly: number;
  /** Estimated monthly utilities cost (EIA + water/internet avg × COL index). */
  utilitiesMonthly: number;
  /** Estimated monthly out-of-pocket healthcare cost (× COL index). */
  healthcareMonthly: number;
}

/**
 * Returns the full cost-of-living breakdown for a city.
 * City slug should be kebab-case, e.g. "austin", "new-york-city".
 */
export function getCOLData(city: string): COLData | null {
  const key = city.toLowerCase().trim();
  const entry = (colData as Record<string, COLData>)[key];
  return entry ?? null;
}

/**
 * Returns just the COL index for a city (backward-compatible with prior usage).
 * Returns null if city not found.
 */
export function getCostOfLivingIndex(city: string): number | null {
  return getCOLData(city)?.index ?? null;
}

export function getAllCitiesWithCOL(): string[] {
  return Object.keys(colData);
}

/**
 * Adjusts a salary for cost of living relative to a baseline city.
 * Default baseline is the national average (index = 1.0).
 */
export function adjustSalaryForCOL(
  salary: number,
  city: string,
  baselineCOL = 1.0
): number | null {
  const col = getCostOfLivingIndex(city);
  if (col === null) return null;
  return Math.round(salary * (baselineCOL / col));
}

/**
 * Returns estimated total monthly living expenses for a city (excluding rent).
 * food + transport + utilities + healthcare
 */
export function getMonthlyLivingCosts(city: string): number | null {
  const data = getCOLData(city);
  if (!data) return null;
  return data.foodMonthly + data.transportMonthly + data.utilitiesMonthly + data.healthcareMonthly;
}
