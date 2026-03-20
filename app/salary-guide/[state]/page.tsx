import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import { STATE_CODE_MAP } from "@/lib/stateCodeMap";
import { buildPageMeta } from "@/lib/seo";
import { CITY_COSTS, type CityCost } from "@/data/city-costs";
import { getCOLData } from "@/lib/data/costOfLiving";
import { getRentByType } from "@/lib/data/rentData";
import DataSourceBadges from "@/components/DataSourceBadges";
import ReviewedBy from "@/components/ReviewedBy";
import stateMediansJson from "@/data/state-medians.json";

export const dynamic = "force-static";
export const revalidate = 604800;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ state: string }>;
};

type StateMedian = { name: string; medianHousehold: number; medianIndividual: number };
const stateMedians = stateMediansJson as Record<string, StateMedian>;
const cityCostsRecord = CITY_COSTS as Record<string, CityCost[]>;

/* ─────────────────────────────────────────────────────────────────────────
   STATE CONFIG — descriptions + popular salary tiers
───────────────────────────────────────────────────────────────────────── */

const STATE_DATA: Record<
  string,
  { taxType: string; description: string; popularSalaries: number[] }
> = {
  california: {
    taxType: "Progressive state income tax (1%–13.3%)",
    description:
      "California has the highest top marginal state income tax in the US at 13.3% for earners above $1M. Combined with high housing costs in San Francisco and Los Angeles, take-home pay can feel significantly lower than in no-tax states.",
    popularSalaries: [75000, 100000, 150000, 200000],
  },
  texas: {
    taxType: "No state income tax",
    description:
      "Texas levies no state income tax, meaning residents only pay federal income tax and payroll taxes. This significantly increases take-home pay compared to high-tax states, though property taxes tend to be higher.",
    popularSalaries: [60000, 80000, 100000, 150000],
  },
  florida: {
    taxType: "No state income tax",
    description:
      "Florida has no state income tax, making it attractive for high earners relocating from high-tax states. Cost of living varies widely — Miami and Orlando are more expensive than inland areas.",
    popularSalaries: [60000, 85000, 100000, 150000],
  },
  "new-york": {
    taxType: "Progressive state income tax (4%–10.9%) + NYC local tax",
    description:
      "New York has a progressive state income tax up to 10.9%. Residents of New York City pay an additional local income tax of up to 3.88%. High housing and living costs in NYC significantly impact disposable income.",
    popularSalaries: [80000, 100000, 150000, 200000],
  },
  washington: {
    taxType: "No state income tax",
    description:
      "Washington state has no income tax, boosting take-home pay. However, sales taxes (up to 10.4% combined) and rising housing costs in Seattle partially offset the savings for residents.",
    popularSalaries: [70000, 100000, 140000, 180000],
  },
  alabama: {
    taxType: "Progressive state income tax (2%–5%)",
    description:
      "Alabama has a low progressive income tax system. Combined with below-average cost of living in most cities, Alabama offers solid affordability for middle-income earners.",
    popularSalaries: [50000, 75000, 100000, 150000],
  },
  alaska: {
    taxType: "No state income tax",
    description:
      "Alaska has no state income tax and distributes Permanent Fund dividends to residents. However, cost of living is significantly higher due to remote location and higher shipping and energy costs.",
    popularSalaries: [70000, 100000, 130000, 160000],
  },
  arizona: {
    taxType: "Flat state income tax (2.5%)",
    description:
      "Arizona moved to a flat 2.5% state income tax rate in 2023 — one of the lowest in the country. Phoenix offers lower housing costs than West Coast cities, making it increasingly attractive for workers relocating from California.",
    popularSalaries: [60000, 85000, 120000, 160000],
  },
  arkansas: {
    taxType: "Progressive state income tax (2%–4.9%)",
    description:
      "Arkansas has a moderate progressive income tax and a very low cost of living. This combination makes take-home pay stretch further than in high-tax, high-cost states.",
    popularSalaries: [45000, 70000, 95000, 140000],
  },
  colorado: {
    taxType: "Flat state income tax (4.4%)",
    description:
      "Colorado has a flat 4.4% state income tax rate. Denver and Boulder have seen rising housing costs in recent years, but mountain towns offer lower living expenses. The tech sector and outdoor industry drive a strong job market.",
    popularSalaries: [65000, 95000, 135000, 180000],
  },
  connecticut: {
    taxType: "Progressive state income tax (3%–6.99%)",
    description:
      "Connecticut has a moderate progressive income tax. While the cost of living is higher than most states, proximity to New York City creates excellent job opportunities and higher salary expectations.",
    popularSalaries: [75000, 110000, 150000, 200000],
  },
  delaware: {
    taxType: "Progressive state income tax (2.2%–6.6%)",
    description:
      "Delaware has one of the lowest combined tax burdens in the Northeast. There is no sales tax, and its corporate-friendly laws attract a large financial services sector.",
    popularSalaries: [70000, 100000, 140000, 190000],
  },
  georgia: {
    taxType: "Flat state income tax (5.49%)",
    description:
      "Georgia moved to a flat income tax rate of 5.49%, set to gradually decrease toward 4.99%. Atlanta offers one of the strongest job markets in the Southeast with lower cost of living than coastal metros.",
    popularSalaries: [60000, 85000, 120000, 160000],
  },
  hawaii: {
    taxType: "Progressive state income tax (1.4%–11%)",
    description:
      "Hawaii has some of the highest income tax rates in the US, reaching 11% for top earners. The very high cost of living due to the island's geographic isolation further reduces real purchasing power.",
    popularSalaries: [80000, 120000, 160000, 210000],
  },
  idaho: {
    taxType: "Flat state income tax (5.8%)",
    description:
      "Idaho has a flat income tax rate of 5.8%. Growing tech hubs in Boise and a relatively low cost of living make it increasingly attractive for remote workers and transplants from more expensive states.",
    popularSalaries: [55000, 80000, 110000, 150000],
  },
  illinois: {
    taxType: "Flat state income tax (4.95%)",
    description:
      "Illinois has a flat 4.95% income tax. Chicago is a major employment hub with diverse industries including finance, tech, and healthcare. Housing costs vary significantly between Chicago and downstate areas.",
    popularSalaries: [70000, 100000, 140000, 190000],
  },
  indiana: {
    taxType: "Flat state income tax (3.15%)",
    description:
      "Indiana has one of the lowest flat income tax rates in the country. A low cost of living and Indianapolis's growing job market make take-home pay stretch very far here.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },
  iowa: {
    taxType: "Flat state income tax (3.8%)",
    description:
      "Iowa has recently moved toward a flat income tax structure. Combined with a very affordable cost of living, especially outside Des Moines, salaries go noticeably further here than in coastal states.",
    popularSalaries: [50000, 75000, 100000, 140000],
  },
  kansas: {
    taxType: "Progressive state income tax (3.1%–5.7%)",
    description:
      "Kansas has a moderate progressive income tax. An affordable cost of living throughout the state means salaries provide genuine purchasing power. Wichita and Kansas City (KS) are the primary employment centers.",
    popularSalaries: [48000, 70000, 95000, 135000],
  },
  kentucky: {
    taxType: "Flat state income tax (4%)",
    description:
      "Kentucky recently moved to a flat 4% income tax rate. With a low cost of living and Louisville as a growing job center, the effective purchasing power of a Kentucky salary is among the best in the US.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },
  louisiana: {
    taxType: "Progressive state income tax (1.85%–4.25%)",
    description:
      "Louisiana has one of the lowest progressive income tax rates in the country. New Orleans and Baton Rouge offer cultural richness and affordable housing, making moderate incomes genuinely livable.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },
  maine: {
    taxType: "Progressive state income tax (5.8%–7.15%)",
    description:
      "Maine has a higher progressive income tax system. Outside Portland, cost of living is reasonable and quality of life is considered excellent, especially for those who value outdoor activities.",
    popularSalaries: [55000, 80000, 110000, 155000],
  },
  maryland: {
    taxType: "Progressive state income tax (2%–5.75%) + county taxes",
    description:
      "Maryland has a progressive state income tax plus county-level income taxes of 2.25%–3.2%. The Baltimore/DC corridor offers high salaries but also elevated housing costs.",
    popularSalaries: [65000, 95000, 135000, 185000],
  },
  massachusetts: {
    taxType: "Flat state income tax (5%) + 9% on income above $1M",
    description:
      "Massachusetts has a 5% flat income tax on wages, with a surtax of 4% on income above $1M (total: 9%). Boston is a major hub for biotech, finance, and technology, with salaries to match — though housing costs are high.",
    popularSalaries: [75000, 115000, 160000, 210000],
  },
  michigan: {
    taxType: "Flat state income tax (4.25%)",
    description:
      "Michigan has a flat 4.25% income tax rate. Detroit and Grand Rapids offer growing job markets, and the overall cost of living is affordable, especially outside the metro areas.",
    popularSalaries: [55000, 80000, 115000, 160000],
  },
  minnesota: {
    taxType: "Progressive state income tax (5.35%–9.85%)",
    description:
      "Minnesota has one of the higher progressive income tax rates, reaching 9.85% for top earners. However, Minneapolis-St. Paul offers strong salaries and excellent quality of life that partially compensates for the higher tax burden.",
    popularSalaries: [70000, 105000, 150000, 200000],
  },
  mississippi: {
    taxType: "Flat state income tax (4.7%, phasing to 4%)",
    description:
      "Mississippi has a flat income tax currently phasing down. With the lowest cost of living in the country, even moderate incomes can support a comfortable lifestyle here.",
    popularSalaries: [45000, 65000, 90000, 135000],
  },
  missouri: {
    taxType: "Progressive state income tax (1.5%–4.95%)",
    description:
      "Missouri has a moderate progressive income tax with a low top rate. St. Louis and Kansas City offer strong job markets with a cost of living well below the national average.",
    popularSalaries: [50000, 75000, 110000, 155000],
  },
  montana: {
    taxType: "Flat state income tax (5.9%)",
    description:
      "Montana has a 5.9% flat income tax. With growing remote work adoption and excellent outdoor lifestyle, Bozeman and Missoula have seen rising population and housing costs, though still below coastal norms.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },
  nebraska: {
    taxType: "Progressive state income tax (2.46%–6.64%)",
    description:
      "Nebraska has a moderate progressive income tax with rates set to decrease over time. Omaha is a growing finance and insurance hub with reasonable housing costs compared to peer metros.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },
  nevada: {
    taxType: "No state income tax",
    description:
      "Nevada has no state income tax, maximizing take-home pay. Las Vegas and Reno are the main employment centers. Housing costs have risen substantially in recent years, but remain below California levels.",
    popularSalaries: [60000, 85000, 120000, 165000],
  },
  "new-hampshire": {
    taxType: "No tax on wages (5% on interest/dividends, phasing out)",
    description:
      "New Hampshire has no tax on earned wages. The interest and dividends tax is phasing out completely by 2027. A moderate-to-high cost of living and proximity to Boston make it popular for commuters seeking tax benefits.",
    popularSalaries: [70000, 105000, 150000, 195000],
  },
  "new-jersey": {
    taxType: "Progressive state income tax (1.4%–10.75%)",
    description:
      "New Jersey has a progressive income tax that reaches 10.75% for high earners — among the highest in the nation. Combined with property taxes, the overall tax burden is substantial. However, proximity to New York City drives higher salaries in many industries.",
    popularSalaries: [75000, 120000, 170000, 230000],
  },
  "new-mexico": {
    taxType: "Progressive state income tax (1.7%–5.9%)",
    description:
      "New Mexico has a moderate progressive income tax. Albuquerque and Santa Fe offer lower housing costs than most Western cities, and the state's energy sector provides employment opportunities.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },
  "north-carolina": {
    taxType: "Flat state income tax (4.5%, phasing to 3.99%)",
    description:
      "North Carolina moved to a flat income tax rate of 4.5%, set to continue decreasing. Charlotte and Raleigh-Durham have emerged as major tech and finance hubs, with a cost of living well below comparable coastal metros.",
    popularSalaries: [60000, 90000, 130000, 180000],
  },
  "north-dakota": {
    taxType: "Flat state income tax (2.5%)",
    description:
      "North Dakota now has a flat 2.5% income tax — one of the lowest in the country. Cost of living is very affordable, though the job market is more limited outside of Fargo.",
    popularSalaries: [50000, 70000, 95000, 135000],
  },
  ohio: {
    taxType: "Progressive state income tax (2.765%–3.99%)",
    description:
      "Ohio has a moderate progressive income tax with low rates. Columbus, Cincinnati, and Cleveland offer diverse employment with an affordable cost of living that is well below the national average.",
    popularSalaries: [50000, 75000, 110000, 160000],
  },
  oklahoma: {
    taxType: "Progressive state income tax (0.25%–4.75%)",
    description:
      "Oklahoma has a low progressive income tax. Oklahoma City and Tulsa have growing economies with a very affordable cost of living, making this state one of the best for purchasing power.",
    popularSalaries: [48000, 70000, 100000, 145000],
  },
  oregon: {
    taxType: "Progressive state income tax (4.75%–9.9%)",
    description:
      "Oregon has a progressive income tax reaching 9.9% for top earners. However, there is no sales tax, which partially offsets the income tax burden for everyday purchases. Portland is a growing tech and creative hub.",
    popularSalaries: [65000, 100000, 145000, 195000],
  },
  pennsylvania: {
    taxType: "Flat state income tax (3.07%)",
    description:
      "Pennsylvania has one of the lowest flat income tax rates in the country at 3.07%. Philadelphia and Pittsburgh offer strong job markets. Local wage taxes (up to ~3.75% in Philadelphia) may apply in addition.",
    popularSalaries: [55000, 80000, 120000, 165000],
  },
  "rhode-island": {
    taxType: "Progressive state income tax (3.75%–5.99%)",
    description:
      "Rhode Island has a moderate progressive income tax. Providence offers cultural amenities and a growing job market, and proximity to Boston creates additional career opportunities for commuters.",
    popularSalaries: [60000, 90000, 130000, 180000],
  },
  "south-carolina": {
    taxType: "Flat state income tax (6.5%, phasing to 6%)",
    description:
      "South Carolina has a flat income tax currently phasing down. Charleston and Columbia offer growing job markets with a coastal lifestyle and cost of living below the national average.",
    popularSalaries: [55000, 80000, 115000, 160000],
  },
  "south-dakota": {
    taxType: "No state income tax",
    description:
      "South Dakota has no state income tax, maximizing take-home pay. The cost of living is very affordable, and Sioux Falls is the main employment center. Limited job variety makes it ideal for remote workers.",
    popularSalaries: [50000, 75000, 110000, 155000],
  },
  tennessee: {
    taxType: "No state income tax on wages",
    description:
      "Tennessee has no income tax on wages. Nashville and Memphis are rapidly growing cities with strong entertainment, healthcare, and logistics sectors. Cost of living is rising but remains below coastal norms.",
    popularSalaries: [55000, 85000, 125000, 175000],
  },
  utah: {
    taxType: "Flat state income tax (4.65%)",
    description:
      "Utah has a flat income tax and a growing tech hub in Salt Lake City (\"Silicon Slopes\"). The combination of high-paying tech jobs, outdoor lifestyle, and below-average cost of living makes Utah increasingly attractive.",
    popularSalaries: [60000, 90000, 135000, 185000],
  },
  vermont: {
    taxType: "Progressive state income tax (3.35%–8.75%)",
    description:
      "Vermont has a higher progressive income tax. Quality of life, natural beauty, and a tight-knit community appeal to many. Burlington is the largest city and primary employment center, with a small but growing tech sector.",
    popularSalaries: [55000, 85000, 125000, 175000],
  },
  virginia: {
    taxType: "Progressive state income tax (2%–5.75%)",
    description:
      "Virginia has a moderate progressive income tax. Northern Virginia, anchored by the federal government and defense contractors, offers very high salaries but also high housing costs. The rest of the state is more affordable.",
    popularSalaries: [65000, 100000, 150000, 210000],
  },
  "west-virginia": {
    taxType: "Progressive state income tax (3%–6.5%)",
    description:
      "West Virginia has a moderate progressive income tax. The cost of living is the lowest in the nation by some measures, making moderate incomes go very far in terms of day-to-day expenses.",
    popularSalaries: [45000, 65000, 90000, 135000],
  },
  wisconsin: {
    taxType: "Progressive state income tax (3.54%–7.65%)",
    description:
      "Wisconsin has a moderate progressive income tax. Milwaukee and Madison offer strong job markets in manufacturing, healthcare, and education. The cost of living outside Madison is generally very affordable.",
    popularSalaries: [55000, 85000, 125000, 175000],
  },
  wyoming: {
    taxType: "No state income tax",
    description:
      "Wyoming has no state income tax and very low overall tax burden. The energy sector (oil, gas, coal) drives the economy. Cheyenne and Casper are the main employment centers, with a very affordable cost of living.",
    popularSalaries: [55000, 80000, 120000, 165000],
  },
};

function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

function slugifyCity(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}

/* ─────────────────────────────────────────────────────────────────────────
   STATIC PARAMS
───────────────────────────────────────────────────────────────────────── */

export function generateStaticParams() {
  return Object.keys(STATE_DATA).map((stateSlug) => ({ state: stateSlug }));
}

/* ─────────────────────────────────────────────────────────────────────────
   METADATA
───────────────────────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;
  if (!stateSlug) return { title: "State Salary Guide (2026)" };
  const stateCode = STATE_CODE_MAP[stateSlug];
  const stateInfo = stateCode ? stateMedians[stateCode] : null;
  const stateName =
    stateInfo?.name ?? stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return buildPageMeta({
    title: `${stateName} Salary Guide (2026) – After-Tax Pay & Cost of Living`,
    description: `Complete 2026 salary guide for ${stateName}. See take-home pay for popular salaries, income tax structure, real cost-of-living data by city, and state income benchmarks.`,
    canonical: `/${stateSlug}-salary-guide`,
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────── */

export default async function StateSalaryGuide({ params }: PageProps) {
  const { state: stateSlug } = await params;
  if (!stateSlug) return notFound();

  const stateConfig = STATE_DATA[stateSlug];
  if (!stateConfig) return notFound();

  const stateCode = STATE_CODE_MAP[stateSlug];
  if (!stateCode) return notFound();

  const stateInfo = stateMedians[stateCode];
  const stateName =
    stateInfo?.name ?? stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Real tax calculations for popular salary tiers ────────────────────────
  const salaryBreakdowns = stateConfig.popularSalaries.map((salary) => {
    const r = calculateNetSalary({ salary, state: stateCode, filingStatus: "single", taxYear: 2026 });
    return {
      salary,
      federalTax: r.federalTax,
      stateTax: r.stateTax,
      fica: r.fica.total,
      netSalary: r.netSalary,
      monthlyTakeHome: r.monthlyTakeHome,
      effectiveTaxRate: r.effectiveTaxRate,
    };
  });

  // ── City data for this state ──────────────────────────────────────────────
  const stateCities = cityCostsRecord[stateSlug] ?? [];
  const medianSalary = stateConfig.popularSalaries[Math.floor(stateConfig.popularSalaries.length / 2)];

  const cityAffordability = stateCities.slice(0, 6).map((city) => {
    const cs = slugifyCity(city.city);
    const rentAmt = getRentByType(cs, "1br") ?? city.rent;
    const colData = getCOLData(cs);
    const colIndex = colData?.index ?? 1.0;
    const taxResult = calculateNetSalary({
      salary: medianSalary,
      state: stateCode,
      filingStatus: "single",
      taxYear: 2026,
    });
    const monthly = taxResult.monthlyTakeHome;
    const rentRatio = (rentAmt * 12) / taxResult.netSalary;

    let affordLabel: string;
    let affordColor: string;
    if (rentRatio < 0.25) { affordLabel = "Affordable"; affordColor = "text-green-600"; }
    else if (rentRatio < 0.35) { affordLabel = "Moderate"; affordColor = "text-yellow-600"; }
    else if (rentRatio < 0.50) { affordLabel = "Expensive"; affordColor = "text-orange-600"; }
    else { affordLabel = "Very expensive"; affordColor = "text-red-600"; }

    return {
      city: city.city,
      citySlug: cs,
      rentAmt,
      colIndex,
      rentRatio,
      monthly,
      affordLabel,
      affordColor,
      lifestyle: city.lifestyle,
    };
  });

  // ── vs. national benchmark ────────────────────────────────────────────────
  const US_INDIVIDUAL_MEDIAN = 56000;
  const medianCalc = stateInfo
    ? calculateNetSalary({ salary: stateInfo.medianIndividual, state: stateCode, filingStatus: "single", taxYear: 2026 })
    : null;

  // ── Pre-computed FAQ values (avoid inline calls in JSX) ──────────────────
  const calc100k = calculateNetSalary({ salary: 100000, state: stateCode, filingStatus: "single", taxYear: 2026 });
  const calcPopSalary1 = stateConfig.popularSalaries[1]
    ? calculateNetSalary({ salary: stateConfig.popularSalaries[1], state: stateCode, filingStatus: "single", taxYear: 2026 })
    : null;
  const middleClassLow = stateInfo ? fmtUSD(Math.round(stateInfo.medianHousehold * 0.67)) : "";
  const middleClassHigh = stateInfo ? fmtUSD(Math.round(stateInfo.medianHousehold * 2)) : "";

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is $100,000 a good salary in ${stateName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Whether $100,000 is a good salary in ${stateName} depends on your city and lifestyle. After taxes, a $100,000 salary in ${stateName} yields approximately ${fmtUSD(calc100k.netSalary)} per year (${fmtUSD(calc100k.monthlyTakeHome)}/month) — enough for a comfortable lifestyle in most areas.`,
        },
      },
      {
        "@type": "Question",
        name: `How much state income tax do you pay in ${stateName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${stateName} has ${stateConfig.taxType}. Your effective state tax rate depends on your income level, filing status, and any deductions you claim.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the median salary in ${stateName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `According to the US Census Bureau ACS 2023, the individual median income in ${stateName} is ${stateInfo ? fmtUSD(stateInfo.medianIndividual) : "approximately $45,000"} and the household median is ${stateInfo ? fmtUSD(stateInfo.medianHousehold) : "approximately $70,000"}.`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-4xl mx-auto px-6 space-y-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <section>
          <p className="text-sm font-medium text-blue-600 mb-1">Salary Guide · 2026</p>
          <h1 className="text-3xl font-bold text-gray-900">{stateName} Salary Guide (2026)</h1>
          <p className="mt-3 text-gray-700 leading-relaxed">
            This guide explains how salaries are taxed in {stateName}, what take-home pay looks like at
            different income levels, and how cost of living affects real purchasing power across major cities.
          </p>
        </section>

        {/* ── State median snapshot ────────────────────────────────────────── */}
        {stateInfo && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-5">{stateName} Income Snapshot</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Individual median income",
                  value: fmtUSD(stateInfo.medianIndividual),
                  sub: `${Math.round(((stateInfo.medianIndividual - US_INDIVIDUAL_MEDIAN) / US_INDIVIDUAL_MEDIAN) * 100) >= 0 ? "+" : ""}${Math.round(((stateInfo.medianIndividual - US_INDIVIDUAL_MEDIAN) / US_INDIVIDUAL_MEDIAN) * 100)}% vs US median`,
                  subColor: stateInfo.medianIndividual >= US_INDIVIDUAL_MEDIAN ? "text-green-600" : "text-red-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Household median income",
                  value: fmtUSD(stateInfo.medianHousehold),
                  sub: "US Census ACS 2023",
                  subColor: "text-gray-400",
                  bg: "bg-purple-50",
                },
                {
                  label: "Median take-home (annual)",
                  value: medianCalc ? fmtUSD(medianCalc.netSalary) : "—",
                  sub: medianCalc ? `Eff. rate: ${medianCalc.effectiveTaxRate}%` : "",
                  subColor: "text-gray-400",
                  bg: "bg-green-50",
                },
                {
                  label: "Median monthly take-home",
                  value: medianCalc ? fmtUSD(medianCalc.monthlyTakeHome) : "—",
                  sub: "Single filer, 2026",
                  subColor: "text-gray-400",
                  bg: "bg-amber-50",
                },
              ].map(({ label, value, sub, subColor, bg }) => (
                <div key={label} className={`${bg} rounded-xl border border-gray-100 p-4`}>
                  <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Tax structure ────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-3">Income Tax Structure in {stateName}</h2>
          <div className="flex items-start gap-3 mb-4">
            <div className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
              stateConfig.taxType.startsWith("No") ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"
            }`}>
              {stateConfig.taxType.startsWith("No") ? "No state income tax" : "Has state income tax"}
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">
            <strong>Tax system:</strong> {stateConfig.taxType}
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">{stateConfig.description}</p>
        </section>

        {/* ── Real salary breakdown table ──────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-1">Take-Home Pay at Popular Salary Levels</h2>
          <p className="text-xs text-gray-400 mb-5">
            Single filer · Standard deduction · {stateCode} state tax · 2026 IRS brackets
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr className="text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-2 text-left font-medium">Gross salary</th>
                  <th className="pb-2 text-right font-medium">Federal tax</th>
                  <th className="pb-2 text-right font-medium">State tax</th>
                  <th className="pb-2 text-right font-medium">FICA</th>
                  <th className="pb-2 text-right font-medium">Take-home</th>
                  <th className="pb-2 text-right font-medium">Monthly</th>
                  <th className="pb-2 text-right font-medium">Eff. rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salaryBreakdowns.map((row) => (
                  <tr key={row.salary} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">
                      <a
                        href={`/salary/${row.salary}-${stateSlug}-2026`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {fmtUSD(row.salary)}
                      </a>
                    </td>
                    <td className="py-2.5 text-right text-blue-700">{fmtUSD(row.federalTax)}</td>
                    <td className="py-2.5 text-right text-orange-700">{fmtUSD(row.stateTax)}</td>
                    <td className="py-2.5 text-right text-purple-700">{fmtUSD(row.fica)}</td>
                    <td className="py-2.5 text-right text-green-700 font-semibold">{fmtUSD(row.netSalary)}</td>
                    <td className="py-2.5 text-right text-green-600">{fmtUSD(row.monthlyTakeHome)}</td>
                    <td className="py-2.5 text-right text-gray-500">{row.effectiveTaxRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual take-home bars */}
          <div className="mt-6 space-y-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Take-home as % of gross</p>
            {salaryBreakdowns.map((row) => {
              const takePct = (row.netSalary / row.salary) * 100;
              return (
                <div key={`bar-${row.salary}`} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-gray-600 shrink-0">{fmtUSD(row.salary)}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-400 rounded-l-full" style={{ width: `${takePct}%` }} />
                    <div className="h-full bg-blue-400" style={{ width: `${(row.federalTax / row.salary) * 100}%` }} />
                    <div className="h-full bg-orange-400" style={{ width: `${(row.stateTax / row.salary) * 100}%` }} />
                    <div className="h-full bg-purple-400 rounded-r-full" style={{ width: `${(row.fica / row.salary) * 100}%` }} />
                  </div>
                  <span className="text-gray-700 font-medium w-10 text-right">{takePct.toFixed(0)}%</span>
                </div>
              );
            })}
            <div className="flex gap-3 mt-2">
              {[
                { color: "bg-green-400", label: "Take-home" },
                { color: "bg-blue-400", label: "Federal" },
                { color: "bg-orange-400", label: "State" },
                { color: "bg-purple-400", label: "FICA" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── City affordability grid ──────────────────────────────────────── */}
        {cityAffordability.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-1">
              Housing Affordability in {stateName} Cities
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Based on {fmtUSD(medianSalary)} salary · Rent: HUD FMR 2026 · COL: C2ER/ACCRA
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cityAffordability.map((city) => (
                <div
                  key={city.city}
                  className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex items-start justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{city.city}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      COL: {city.colIndex.toFixed(2)}× · 1BR rent: {fmtUSD(city.rentAmt)}/mo
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Rent burden: {(city.rentRatio * 100).toFixed(1)}% of take-home
                    </p>
                    <a
                      href={`/city-living/is-${medianSalary}-enough-in-${city.citySlug}`}
                      className="mt-2 block text-xs text-blue-600 hover:underline"
                    >
                      Is {fmtUSD(medianSalary)} enough in {city.city}? →
                    </a>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ml-3 ${city.affordColor}`}>
                    {city.affordLabel}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Popular salary links ─────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Popular Salary Guides for {stateName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {stateConfig.popularSalaries.map((salary) => (
              <a
                key={salary}
                href={`/salary/${salary}-${stateSlug}-2026`}
                className="rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{fmtUSD(salary)} salary after tax</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Take-home: {fmtUSD(salaryBreakdowns.find((b) => b.salary === salary)?.netSalary ?? 0)}/yr
                  </p>
                </div>
                <span className="text-blue-600 text-xs font-medium shrink-0 ml-2">View →</span>
              </a>
            ))}
          </div>
        </section>

        {/* ── Is it enough section ─────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Is This Salary Enough in {stateName}?</h2>
          <div className="space-y-2">
            {stateConfig.popularSalaries.map((salary) => (
              <a
                key={`enough-${salary}`}
                href={`/living/is-${salary}-enough-in-${stateSlug}`}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition text-sm"
              >
                <span className="text-gray-800">
                  Is {fmtUSD(salary)} enough to live in {stateName}?
                </span>
                <span className="text-blue-600 font-medium shrink-0 ml-2">Explore →</span>
              </a>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-5">Frequently Asked Questions</h2>
          <div className="space-y-5 text-sm text-gray-700">

            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                Is $100,000 a good salary in {stateName}?
              </h3>
              <p>
                A $100,000 salary in {stateName} yields approximately{" "}
                <strong>{fmtUSD(calc100k.netSalary)}</strong> per year ({fmtUSD(calc100k.monthlyTakeHome)}/month)
                after federal and state taxes. In most {stateName} cities, this is{" "}
                {stateInfo && 100000 > stateInfo.medianIndividual
                  ? `above the state individual median of ${fmtUSD(stateInfo.medianIndividual)} — generally a comfortable income`
                  : "a competitive salary that covers most lifestyles"}.
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                How much state income tax do you pay in {stateName}?
              </h3>
              <p>
                {stateName} has {stateConfig.taxType}.
                {calcPopSalary1 && stateConfig.popularSalaries[1] ? (
                  <>
                    {" "}For a {fmtUSD(stateConfig.popularSalaries[1])} salary, the estimated state income
                    tax is <strong>{fmtUSD(calcPopSalary1.stateTax)}</strong>.
                  </>
                ) : null}
                {" "}Your effective rate depends on your income level, filing status, and deductions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                What salary is considered middle class in {stateName}?
              </h3>
              <p>
                {stateInfo
                  ? `The individual median income in ${stateName} is ${fmtUSD(stateInfo.medianIndividual)} and the household median is ${fmtUSD(stateInfo.medianHousehold)} (Census ACS 2023). Middle-class income typically ranges from 67%–200% of the household median, roughly ${middleClassLow}–${middleClassHigh} for a family.`
                  : "Middle-class income varies by region and household size. In higher-cost cities, middle-class thresholds are typically higher than the national household median of around $74,000."}
              </p>
            </div>
          </div>
        </section>

        {/* ── Trust signals ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReviewedBy />
          <DataSourceBadges sources={["irs", "ssa", "bls", "hud"]} />
        </div>

      </div>
    </main>
  );
}
