import statesCities from "@/data/states-cities.json";

const data = statesCities as Record<string, string[]>;

export function getCitiesByState(state: string): string[] {
  const key = state.toLowerCase().trim();
  return data[key] ?? [];
}

export function getAllStates(): string[] {
  return Object.keys(data);
}

export function getAllCities(): string[] {
  return Object.values(data).flat();
}

export function getStateForCity(city: string): string | null {
  const target = city.toLowerCase().trim();
  for (const [state, cities] of Object.entries(data)) {
    if (cities.includes(target)) return state;
  }
  return null;
}
