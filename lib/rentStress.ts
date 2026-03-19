export type RentStressLabel = "Comfortable" | "Moderate" | "High Stress";
export type RentStressColor = "green" | "yellow" | "red";

export interface RentStressResult {
  /** ratio = annualRent / netSalary (e.g. 0.28 = 28%) */
  ratio: number;
  percentage: number;
  label: RentStressLabel;
  color: RentStressColor;
  /** Maximum monthly rent to stay Comfortable (<25%) */
  comfortableMonthlyMax: number;
  /** Maximum monthly rent to stay Moderate (<40%) */
  moderateMonthlyMax: number;
  advice: string;
}

function classify(ratio: number): {
  label: RentStressLabel;
  color: RentStressColor;
  advice: string;
} {
  if (ratio < 0.25) {
    return {
      label: "Comfortable",
      color: "green",
      advice:
        "Your rent-to-income ratio is healthy. You have room to build savings and cover unexpected expenses.",
    };
  }
  if (ratio < 0.40) {
    return {
      label: "Moderate",
      color: "yellow",
      advice:
        "Your rent is manageable but leaves limited room for savings. Look for ways to increase income or reduce fixed expenses.",
    };
  }
  return {
    label: "High Stress",
    color: "red",
    advice:
      "More than 40% of your take-home pay goes to rent. Consider a lower-cost city, a roommate, or negotiating your salary to improve your financial cushion.",
  };
}

/**
 * Calculate rent stress from annual figures.
 * @param netSalary  Annual take-home pay (after all taxes)
 * @param annualRent Annual rent (monthly rent × 12)
 */
export function getRentStress(
  netSalary: number,
  annualRent: number
): RentStressResult {
  if (netSalary <= 0) {
    throw new RangeError("netSalary must be greater than 0");
  }
  const ratio = annualRent / netSalary;
  const { label, color, advice } = classify(ratio);

  return {
    ratio,
    percentage: Number((ratio * 100).toFixed(1)),
    label,
    color,
    comfortableMonthlyMax: Math.floor((netSalary * 0.25) / 12),
    moderateMonthlyMax: Math.floor((netSalary * 0.40) / 12),
    advice,
  };
}

/**
 * Convenience overload using monthly figures.
 * @param netMonthly   Monthly take-home pay
 * @param monthlyRent  Monthly rent
 */
export function getRentStressFromMonthly(
  netMonthly: number,
  monthlyRent: number
): RentStressResult {
  return getRentStress(netMonthly * 12, monthlyRent * 12);
}

// Keep the original thin exports so existing callers don't break
export function rentStress(netSalary: number, annualRent: number): number {
  return annualRent / netSalary;
}

export function rentStressLabel(ratio: number): RentStressLabel {
  return classify(ratio).label;
}
