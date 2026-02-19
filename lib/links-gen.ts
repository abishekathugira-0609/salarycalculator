/* -----------------------------------------
   INTERNAL LINK ENGINE
------------------------------------------ */

const SALARY_BUCKETS = [
  40000,
  50000,
  60000,
  75000,
  100000,
  125000,
  150000,
  200000,
  250000,
  300000,
];

const STATES = [
  "california",
  "texas",
  "florida",
  "new-york",
  "illinois",
  "pennsylvania",
  "washington",
  "georgia",
  "arizona",
  "massachusetts",
];

export function getNearbySalaries(currentSalary: number) {
  const index = SALARY_BUCKETS.findIndex((s) => s === currentSalary);

  if (index === -1) return [];

  const neighbors: number[] = [];

  if (SALARY_BUCKETS[index - 1]) {
    neighbors.push(SALARY_BUCKETS[index - 1]);
  }

  if (SALARY_BUCKETS[index + 1]) {
    neighbors.push(SALARY_BUCKETS[index + 1]);
  }

  return neighbors;
}

export function getOtherStates(currentState: string) {
  return STATES.filter((s) => s !== currentState).slice(0, 5);
}


export function getSalaryLadder(currentSalary: number) {
  const index = SALARY_BUCKETS.findIndex((s) => s === currentSalary);

  if (index === -1) return SALARY_BUCKETS;

  const lower = SALARY_BUCKETS.slice(0, index);
  const higher = SALARY_BUCKETS.slice(index + 1);

  return {
    lower,
    higher,
    all: SALARY_BUCKETS,
  };
}
