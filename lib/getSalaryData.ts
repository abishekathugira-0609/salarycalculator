export function getSalaryData(
  amount: string,
  stateCode: string,
  year: string
) {
  try {
    const { readFileSync } = require("fs");
    const { join } = require("path");
    
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
