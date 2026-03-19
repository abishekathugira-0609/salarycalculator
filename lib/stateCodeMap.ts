import statesCitiesData from "@/data/states-cities.json";
import { CITY_COSTS } from "@/data/city-costs";

export const STATE_CODE_MAP: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
  "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
  "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
  "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
  "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
  "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
  "new-hampshire": "NH", "new-jersey": "NJ", "new-mexico": "NM", "new-york": "NY",
  "north-carolina": "NC", "north-dakota": "ND", "ohio": "OH", "oklahoma": "OK",
  "oregon": "OR", "pennsylvania": "PA", "rhode-island": "RI", "south-carolina": "SC",
  "south-dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
  "vermont": "VT", "virginia": "VA", "washington": "WA", "west-virginia": "WV",
  "wisconsin": "WI", "wyoming": "WY", "district-of-columbia": "DC",
};

/** Convert state slug ("new-york") or 2-letter code ("CA") to two-letter code ("NY" / "CA"). */
export function stateSlugToCode(slug: string): string | null {
  const trimmed = slug.toLowerCase().trim();
  // Accept 2-letter codes directly (e.g. URL params like /CA/TX)
  if (trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    return Object.values(STATE_CODE_MAP).includes(upper) ? upper : null;
  }
  return STATE_CODE_MAP[trimmed] ?? null;
}

/** Convert two-letter code ("NY") to slug ("new-york"). */
export function stateCodeToSlug(code: string): string | null {
  const upper = code.toUpperCase();
  const entry = Object.entries(STATE_CODE_MAP).find(([, v]) => v === upper);
  return entry ? entry[0] : null;
}

/**
 * Return the two-letter state code for a city slug ("austin" → "TX").
 * Checks CITY_COSTS first (exact city-name match), then falls back to
 * states-cities.json (slug match).
 */
export function getStateCodeForCity(citySlug: string): string | null {
  const slug = citySlug.toLowerCase().trim();
  const displayName = slug.replace(/-/g, " ");

  // 1. Check CITY_COSTS (has explicit stateCode per city)
  for (const cities of Object.values(CITY_COSTS)) {
    for (const c of cities) {
      if (c.city.toLowerCase() === displayName) return c.stateCode;
    }
  }

  // 2. Fall back to states-cities.json slug list
  const data = statesCitiesData as Record<string, string[]>;
  for (const [stateSlug, cities] of Object.entries(data)) {
    if (cities.includes(slug)) {
      return STATE_CODE_MAP[stateSlug] ?? null;
    }
  }

  // 3. Treat slug as a state slug (e.g. "new-york" → "NY", "california" → "CA")
  return stateSlugToCode(slug);
}

/** All city slugs that have a known state code (union of both datasets). */
export function getAllCitySlugs(): string[] {
  const data = statesCitiesData as Record<string, string[]>;
  return Object.values(data).flat();
}

/** Return CITY_COSTS entry for a city slug, or null. */
export function getCityCostEntry(citySlug: string) {
  const slug = citySlug.toLowerCase().trim();
  const displayName = slug.replace(/-/g, " ");
  for (const cities of Object.values(CITY_COSTS)) {
    for (const c of cities) {
      if (c.city.toLowerCase() === displayName) return c;
    }
  }
  return null;
}

/**
 * If slug is a state slug (e.g. "new-york"), return the primary city slug
 * for that state (e.g. "new-york-city") based on CITY_COSTS seoWeight.
 * Returns null if slug is not a recognized state slug.
 */
export function getStatePrimaryCity(stateSlug: string): string | null {
  if (!(stateSlug in STATE_CODE_MAP)) return null;
  const cities = (CITY_COSTS as Record<string, { city: string; seoWeight: number }[]>)[stateSlug];
  if (!cities || cities.length === 0) return null;
  const top = [...cities].sort((a, b) => b.seoWeight - a.seoWeight)[0];
  return top.city.toLowerCase().replace(/\s+/g, "-");
}

/** Slugify a display city name ("New York City" → "new-york-city"). */
export function cityToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** Title-case a slug ("new-york-city" → "New York City"). */
export function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format number as currency string ("$100,000"). */
export function fmtUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** Compact currency ("$100k", "$1.2M"). */
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}
