import fs from "fs";
import path from "path";

export function getSalaryData(
  amount: string,
  stateCode: string,
  year: string
) {
  const filePath = path.join(
    process.cwd(),
    "data",
    "pages",
    year,
    `${amount}_${stateCode}_single_${year}.json`
  );

  if (!fs.existsSync(filePath)) return null;

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
