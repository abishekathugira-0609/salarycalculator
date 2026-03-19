// lib/content/types.ts
// Shared types for content engine

export type TaxBreakdown = {
  federal: number;
  state: number;
  fica: number;
  effectiveRate: number;
};

export type Budget = {
  housing: number;
  food: number;
  transportation: number;
  healthcare: number;
  entertainment: number;
  savings: number;
  other: number;
};

export type CityInsights = {
  industries?: string[];
  medianHomePrice?: number;
  economicGrowth?: string;
};
