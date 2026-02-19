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

    const content = readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}
