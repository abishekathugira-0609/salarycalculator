// lib/content/faqGenerator.ts
// Generates structured FAQ content for programmatic financial pages.

export type FAQ = {
  question: string;
  answer: string;
};

export function generateFAQs({
  city,
  state,
  salary,
  netSalary,
  rent,
  costOfLiving,
  taxBreakdown,
}: {
  city: string;
  state: string;
  salary: number;
  netSalary: number;
  rent: number;
  costOfLiving: number;
  taxBreakdown: { federal: number; state: number; fica: number };
}): FAQ[] {
  return [
    {
      question: `Is $${salary.toLocaleString()} a good salary in ${city}?`,
      answer:
        `A $${salary.toLocaleString()} salary in ${city} is considered ${netSalary > salary * 0.7 ? "strong" : "average"} after taxes. Actual comfort depends on your lifestyle, rent, and local costs.`,
    },
    {
      question: `How much tax do you pay on $${salary.toLocaleString()} in ${state}?`,
      answer:
        `On a $${salary.toLocaleString()} salary in ${state}, you pay about $${taxBreakdown.federal.toLocaleString()} in federal tax, $${taxBreakdown.state.toLocaleString()} in state tax, and $${taxBreakdown.fica.toLocaleString()} in FICA taxes.`,
    },
    {
      question: `What salary is needed to live comfortably in ${city}?`,
      answer:
        `To live comfortably in ${city}, aim for a salary that keeps rent below 30% of your take-home pay. With average rent at $${rent.toLocaleString()}, a net income of at least $${(rent * 12 / 0.3).toLocaleString()} per year is recommended.`,
    },
    {
      question: `How does the cost of living in ${city} compare to the national average?`,
      answer:
        `${city}'s cost-of-living index is ${costOfLiving > 100 ? "above" : costOfLiving < 100 ? "below" : "about the same as"} the national average.`,
    },
    {
      question: `Is rent affordable on a $${salary.toLocaleString()} salary in ${city}?`,
      answer:
        rent < netSalary / 3
          ? "Yes, rent is generally affordable on this salary."
          : "Rent may require careful budgeting or a roommate to remain affordable.",
    },
  ];
}
