import rentByCity from "@/data/rent-by-city.json";

export type HousingType = "studio" | "1br" | "2br" | "family";

export interface RentData {
  studio: number;
  "1br": number;
  "2br": number;
  family: number;
}

/**
 * Returns all rent tiers for a city.
 * City slug should be kebab-case, e.g. "new-york-city", "san-francisco".
 */
export function getRent(city: string): RentData | null {
  const key = city.toLowerCase().trim();
  const entry = (rentByCity as Record<string, RentData>)[key];
  return entry ?? null;
}

/**
 * Returns a single rent tier for a city.
 * housingType: "studio" | "1br" | "2br" | "family"
 *
 * Sources: HUD Fair Market Rents (FMR) 2026
 * https://www.huduser.gov/portal/datasets/fmr.html
 *   studio ≈ 78% of 1BR FMR
 *   1BR    = HUD FMR 1-bedroom
 *   2BR    = HUD FMR 2-bedroom
 *   family ≈ 133% of 2BR FMR (3–4 bedroom estimate)
 */
export function getRentByType(city: string, housingType: HousingType): number | null {
  const data = getRent(city);
  if (!data) return null;
  return data[housingType] ?? null;
}

export function getAllCitiesWithRent(): string[] {
  return Object.keys(rentByCity);
}
