import { readFileSync } from "fs";
import { join } from "path";
import { unstable_cache } from "next/cache";

function loadFromDisk(amount: string, stateCode: string, year: string) {
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

export const getSalaryData = unstable_cache(
  async (amount: string, stateCode: string, year: string) => {
    return loadFromDisk(amount, stateCode, year);
  },
  ["salary-data"],
  { revalidate: 86400 }
);
