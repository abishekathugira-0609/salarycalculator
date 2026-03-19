import blsSalary from "@/data/bls-salary.json";

export interface SalaryEstimate {
  median: number;
  p25: number;
  p75: number;
}

export function getSalaryEstimate(job: string): SalaryEstimate | null {
  const key = job.toLowerCase().trim();
  const entry = (blsSalary as Record<string, { median: number; p25: number; p75: number }>)[key];
  if (!entry) return null;
  return { median: entry.median, p25: entry.p25, p75: entry.p75 };
}

export function getAllJobs(): string[] {
  return Object.keys(blsSalary);
}
