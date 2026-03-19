import foodCosts from "@/data/food-costs.json";

export type HouseholdSize = "single" | "couple" | "family3" | "family4";

export interface FoodCostData {
  /** Monthly food cost estimate for one adult. Source: USDA Low-Cost Food Plan × city COL index. */
  single: number;
  /** Monthly food cost for two adults. */
  couple: number;
  /** Monthly food cost for 2 adults + 1 child. */
  family3: number;
  /** Monthly food cost for 2 adults + 2 children. */
  family4: number;
}

/**
 * Returns monthly food cost estimates for a city and optional household size.
 *
 * Data sources:
 *   - USDA Food Cost Plans (2024): https://www.usda.gov/cnpp/nutrient-policy-data/food-plans-cost-food
 *   - MIT Living Wage Calculator (2024): https://livingwage.mit.edu/
 *   - BLS CPI Food at Home Index: https://www.bls.gov/cpi/
 *
 * National baselines (2026 estimate, single adult/month):
 *   single:  $440  (USDA low-cost plan)
 *   couple:  $790  (economies of scale × 1.8)
 *   family3: $1,050
 *   family4: $1,270
 *
 * All values scaled by the city's cost-of-living index.
 */
export function getFoodCost(city: string, householdSize?: HouseholdSize): FoodCostData | number | null {
  const key = city.toLowerCase().trim();
  const entry = (foodCosts as Record<string, FoodCostData>)[key];
  if (!entry) return null;
  if (householdSize) return entry[householdSize] ?? null;
  return entry;
}

/**
 * Returns the monthly food cost for a specific household size.
 * Returns null if city not found.
 */
export function getFoodCostBySize(city: string, householdSize: HouseholdSize): number | null {
  const key = city.toLowerCase().trim();
  const entry = (foodCosts as Record<string, FoodCostData>)[key];
  return entry?.[householdSize] ?? null;
}

export function getAllCitiesWithFoodData(): string[] {
  return Object.keys(foodCosts);
}
