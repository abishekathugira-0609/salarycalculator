import { readFileSync } from "fs";
import { join } from "path";

export function getSalaryData(
  amount: string,
  stateCode: string,
  year: string
) {
  try {
    const filePath = join(
      process.cwd(),
      "data",
      "pages",
      year,
      `${amount}_${stateCode}_single_${year}.json`
    );

    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
