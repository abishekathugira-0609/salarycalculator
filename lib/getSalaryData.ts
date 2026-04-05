import { readFileSync } from "fs";
import { join } from "path";

export async function getSalaryData(amount: string, stateCode: string, year: string) {
  try {
    const filePath = join(
      process.cwd(),
      "data",
      "pages",
      year,
      `${amount}_${stateCode}_single_${year}.json`
    );
    const data = JSON.parse(readFileSync(filePath, "utf8"));
    return data || null;
  } catch {
    return null;
  }
}
