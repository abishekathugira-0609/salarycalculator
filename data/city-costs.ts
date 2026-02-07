export type CityCost = {
  city: string;
  state: string;
  stateCode: string;
  rent: number;        // avg 1-bed
  other: number;       // food + transport + misc
  lifestyle: "budget" | "balanced" | "premium";
  seoWeight: number;   // search demand proxy (1–5)
};
export const CITY_COSTS = {
  california: [
  { city: "San Francisco", state: "California", stateCode: "CA", rent: 3800, other: 1400, lifestyle: "premium", seoWeight: 5 },
  { city: "Los Angeles", state: "California", stateCode: "CA", rent: 3000, other: 1300, lifestyle: "premium", seoWeight: 5 },
  { city: "San Diego", state: "California", stateCode: "CA", rent: 2700, other: 1200, lifestyle: "balanced", seoWeight: 4 },
  { city: "San Jose", state: "California", stateCode: "CA", rent: 3300, other: 1400, lifestyle: "premium", seoWeight: 4 },
  { city: "Sacramento", state: "California", stateCode: "CA", rent: 2200, other: 1100, lifestyle: "balanced", seoWeight: 3 },
  { city: "Fresno", state: "California", stateCode: "CA", rent: 1700, other: 1000, lifestyle: "budget", seoWeight: 2 },
  { city: "Oakland", state: "California", stateCode: "CA", rent: 2900, other: 1300, lifestyle: "premium", seoWeight: 3 },
  { city: "Irvine", state: "California", stateCode: "CA", rent: 3100, other: 1200, lifestyle: "premium", seoWeight: 3 },
],

texas: [
  { city: "Austin", state: "Texas", stateCode: "TX", rent: 2200, other: 1100, lifestyle: "balanced", seoWeight: 5 },
  { city: "Dallas", state: "Texas", stateCode: "TX", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 4 },
  { city: "Houston", state: "Texas", stateCode: "TX", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 4 },
  { city: "San Antonio", state: "Texas", stateCode: "TX", rent: 1700, other: 1000, lifestyle: "budget", seoWeight: 3 },
  { city: "Plano", state: "Texas", stateCode: "TX", rent: 2000, other: 1100, lifestyle: "balanced", seoWeight: 2 },
  { city: "Frisco", state: "Texas", stateCode: "TX", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 2 },
  { city: "El Paso", state: "Texas", stateCode: "TX", rent: 1400, other: 900, lifestyle: "budget", seoWeight: 2 },
],
florida: [
    { city: "Miami", state: "Florida", stateCode: "FL", rent: 2900, other: 1200, lifestyle: "premium", seoWeight: 5 },
    { city: "Orlando", state: "Florida", stateCode: "FL", rent: 2200, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Tampa", state: "Florida", stateCode: "FL", rent: 2100, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Jacksonville", state: "Florida", stateCode: "FL", rent: 1800, other: 1000, lifestyle: "budget", seoWeight: 3 },
    { city: "Fort Lauderdale", state: "Florida", stateCode: "FL", rent: 2600, other: 1150, lifestyle: "premium", seoWeight: 3 },
  ],

  washington: [
    { city: "Seattle", state: "Washington", stateCode: "WA", rent: 2800, other: 1250, lifestyle: "premium", seoWeight: 5 },
    { city: "Bellevue", state: "Washington", stateCode: "WA", rent: 3000, other: 1300, lifestyle: "premium", seoWeight: 3 },
    { city: "Redmond", state: "Washington", stateCode: "WA", rent: 2700, other: 1200, lifestyle: "premium", seoWeight: 3 },
    { city: "Spokane", state: "Washington", stateCode: "WA", rent: 1700, other: 1000, lifestyle: "budget", seoWeight: 2 },
    { city: "Tacoma", state: "Washington", stateCode: "WA", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 2 },
  ],

  "new-york": [
    { city: "New York City", state: "New York", stateCode: "NY", rent: 3800, other: 1500, lifestyle: "premium", seoWeight: 5 },
    { city: "Brooklyn", state: "New York", stateCode: "NY", rent: 3500, other: 1400, lifestyle: "premium", seoWeight: 4 },
    { city: "Queens", state: "New York", stateCode: "NY", rent: 3200, other: 1350, lifestyle: "premium", seoWeight: 4 },
    { city: "Buffalo", state: "New York", stateCode: "NY", rent: 1500, other: 950, lifestyle: "budget", seoWeight: 2 },
    { city: "Rochester", state: "New York", stateCode: "NY", rent: 1400, other: 900, lifestyle: "budget", seoWeight: 2 },
    { city: "Albany", state: "New York", stateCode: "NY", rent: 1600, other: 950, lifestyle: "budget", seoWeight: 1 },
  ],

  massachusetts: [
    { city: "Boston", state: "Massachusetts", stateCode: "MA", rent: 3100, other: 1300, lifestyle: "premium", seoWeight: 5 },
    { city: "Cambridge", state: "Massachusetts", stateCode: "MA", rent: 3300, other: 1350, lifestyle: "premium", seoWeight: 4 },
    { city: "Somerville", state: "Massachusetts", stateCode: "MA", rent: 2800, other: 1200, lifestyle: "balanced", seoWeight: 3 },
    { city: "Worcester", state: "Massachusetts", stateCode: "MA", rent: 1900, other: 1050, lifestyle: "budget", seoWeight: 2 },
  ],

  illinois: [
    { city: "Chicago", state: "Illinois", stateCode: "IL", rent: 2400, other: 1200, lifestyle: "balanced", seoWeight: 5 },
    { city: "Evanston", state: "Illinois", stateCode: "IL", rent: 2300, other: 1150, lifestyle: "balanced", seoWeight: 3 },
    { city: "Naperville", state: "Illinois", stateCode: "IL", rent: 2200, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Peoria", state: "Illinois", stateCode: "IL", rent: 1400, other: 900, lifestyle: "budget", seoWeight: 1 },
  ],

  colorado: [
    { city: "Denver", state: "Colorado", stateCode: "CO", rent: 2500, other: 1200, lifestyle: "balanced", seoWeight: 5 },
    { city: "Boulder", state: "Colorado", stateCode: "CO", rent: 2800, other: 1250, lifestyle: "premium", seoWeight: 3 },
    { city: "Colorado Springs", state: "Colorado", stateCode: "CO", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Fort Collins", state: "Colorado", stateCode: "CO", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 2 },
  ],

  arizona: [
    { city: "Phoenix", state: "Arizona", stateCode: "AZ", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 5 },
    { city: "Scottsdale", state: "Arizona", stateCode: "AZ", rent: 2600, other: 1200, lifestyle: "premium", seoWeight: 3 },
    { city: "Tempe", state: "Arizona", stateCode: "AZ", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Tucson", state: "Arizona", stateCode: "AZ", rent: 1700, other: 950, lifestyle: "budget", seoWeight: 2 },
  ],

  "north-carolina": [
    { city: "Charlotte", state: "North Carolina", stateCode: "NC", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 5 },
    { city: "Raleigh", state: "North Carolina", stateCode: "NC", rent: 1900, other: 1000, lifestyle: "balanced", seoWeight: 4 },
    { city: "Durham", state: "North Carolina", stateCode: "NC", rent: 1800, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "Greensboro", state: "North Carolina", stateCode: "NC", rent: 1500, other: 900, lifestyle: "budget", seoWeight: 2 },
  ],

} satisfies Record<string, CityCost[]>;
