import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 86400; // ISR

type PageProps = {
  params: { state: string };
};

/* -----------------------------
   STATE CONFIG
------------------------------ */

const STATE_DATA: Record<
  string,
  {
    name: string;
    taxType: string;
    description: string;
    popularSalaries: number[];
  }
> = {
  california: {
    name: "California",
    taxType: "Progressive state income tax (one of the highest in the U.S.)",
    description:
      "California has a progressive state income tax system with rates that increase as income rises. Combined with high housing costs in cities like San Francisco and Los Angeles, take-home pay can feel significantly lower compared to no-tax states.",
    popularSalaries: [75000, 100000, 150000, 200000],
  },

  texas: {
    name: "Texas",
    taxType: "No state income tax",
    description:
      "Texas does not charge state income tax, meaning residents only pay federal income tax and payroll taxes. This significantly increases take-home pay compared to high-tax states, though property taxes tend to be higher.",
    popularSalaries: [60000, 80000, 100000, 150000],
  },

  florida: {
    name: "Florida",
    taxType: "No state income tax",
    description:
      "Florida has no state income tax, which makes it attractive for high earners. Cost of living varies widely depending on city, with Miami and Orlando being more expensive than inland areas.",
    popularSalaries: [60000, 85000, 100000, 150000],
  },

  "new-york": {
    name: "New York",
    taxType: "Progressive state income tax + possible NYC local tax",
    description:
      "New York has a progressive state income tax system. Residents of New York City may also pay additional local income tax. High housing and living costs in NYC can significantly impact disposable income.",
    popularSalaries: [80000, 100000, 150000, 200000],
  },

  washington: {
    name: "Washington",
    taxType: "No state income tax",
    description:
      "Washington does not impose state income tax, increasing take-home pay compared to high-tax states. However, sales taxes and housing costs in Seattle can impact overall affordability.",
    popularSalaries: [70000, 100000, 140000, 180000],
  },

  alabama: {
    name: "Alabama",
    taxType: "Progressive state income tax (2%-5%)",
    description:
      "Alabama has a progressive state income tax system with rates between 2% to 5%. Combined with relatively low cost of living in most areas, Alabama offers good affordability for middle-income earners.",
    popularSalaries: [50000, 75000, 100000, 150000],
  },

  alaska: {
    name: "Alaska",
    taxType: "No state income tax",
    description:
      "Alaska has no state income tax and provides annual Permanent Fund dividends to residents. However, cost of living is significantly higher due to remote location and shipping costs.",
    popularSalaries: [70000, 100000, 130000, 160000],
  },

  arizona: {
    name: "Arizona",
    taxType: "Progressive state income tax (2.55%-4.5%)",
    description:
      "Arizona has a progressive state income tax system. Phoenix offers lower housing costs compared to West Coast cities, making it attractive for middle-income earners. Climate and outdoor lifestyle are additional benefits.",
    popularSalaries: [60000, 85000, 120000, 160000],
  },

  arkansas: {
    name: "Arkansas",
    taxType: "Progressive state income tax (2%-5.9%)",
    description:
      "Arkansas has a moderate progressive income tax system and relatively low cost of living. This combination makes take-home pay stretch further than in high-tax, high-cost states.",
    popularSalaries: [45000, 70000, 95000, 140000],
  },

  colorado: {
    name: "Colorado",
    taxType: "Flat state income tax (4.63%)",
    description:
      "Colorado has a flat 4.63% state income tax. Denver and Boulder have seen rising housing costs in recent years, but mountain towns offer lower living expenses. Strong job market in tech and outdoor industries.",
    popularSalaries: [65000, 95000, 135000, 180000],
  },

  connecticut: {
    name: "Connecticut",
    taxType: "Progressive state income tax (3%-6.99%)",
    description:
      "Connecticut has a moderate progressive income tax. While cost of living is higher than many states, proximity to NYC and Boston creates good job opportunities for higher earners.",
    popularSalaries: [75000, 110000, 150000, 200000],
  },

  delaware: {
    name: "Delaware",
    taxType: "Progressive state income tax (2.2%-5.75%)",
    description:
      "Delaware has one of the lowest state income taxes and favorable corporate policies. Proximity to major Northeast cities makes it attractive for commuters seeking tax benefits.",
    popularSalaries: [70000, 100000, 140000, 190000],
  },

  georgia: {
    name: "Georgia",
    taxType: "Progressive state income tax (1%-5.75%)",
    description:
      "Georgia has a moderate progressive income tax system. Atlanta offers a strong job market with lower cost of living than other major metros, making it attractive for young professionals.",
    popularSalaries: [60000, 85000, 120000, 160000],
  },

  hawaii: {
    name: "Hawaii",
    taxType: "Progressive state income tax (1.4%-8.25%)",
    description:
      "Hawaii has a progressive income tax with rates reaching 8.25%. Cost of living is very high due to the island location. However, quality of life and outdoor lifestyle appeal to many residents.",
    popularSalaries: [80000, 120000, 160000, 210000],
  },

  idaho: {
    name: "Idaho",
    taxType: "Progressive state income tax (1%-5.8%)",
    description:
      "Idaho has a moderate progressive income tax. Growing tech hubs in Boise and reasonable cost of living make it attractive for remote workers and young families.",
    popularSalaries: [55000, 80000, 110000, 150000],
  },

  illinois: {
    name: "Illinois",
    taxType: "Flat state income tax (4.95%)",
    description:
      "Illinois has a flat 4.95% state income tax. Chicago is a major job center with diverse industries. Housing costs vary significantly between Chicago and downstate areas.",
    popularSalaries: [70000, 100000, 140000, 190000],
  },

  indiana: {
    name: "Indiana",
    taxType: "Flat state income tax (3.23%)",
    description:
      "Indiana has one of the lowest flat income tax rates at 3.23%. Cost of living is low to moderate, making take-home pay stretch further. Indianapolis is a growing job center.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },

  iowa: {
    name: "Iowa",
    taxType: "Progressive state income tax (0.4%-8.53%)",
    description:
      "Iowa has a progressive income tax system. Cost of living is very affordable, especially outside Des Moines. Strong agriculture and manufacturing sectors provide employment opportunities.",
    popularSalaries: [50000, 75000, 100000, 140000],
  },

  kansas: {
    name: "Kansas",
    taxType: "Progressive state income tax (3.1%-5.7%)",
    description:
      "Kansas has a moderate progressive income tax. Affordable cost of living throughout the state makes salaries stretch further. Strong agricultural and industrial sectors.",
    popularSalaries: [48000, 70000, 95000, 135000],
  },

  kentucky: {
    name: "Kentucky",
    taxType: "Progressive state income tax (2%-6%)",
    description:
      "Kentucky has a moderate progressive income tax. Cost of living is affordable, and Louisville offers urban job opportunities while maintaining low housing costs.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },

  louisiana: {
    name: "Louisiana",
    taxType: "Progressive state income tax (2%-6%)",
    description:
      "Louisiana has a moderate progressive income tax system. New Orleans and Baton Rouge offer cultural appeal and lower cost of living. Affordable housing is a major advantage.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },

  maine: {
    name: "Maine",
    taxType: "Progressive state income tax (5.8%-7.15%)",
    description:
      "Maine has a higher progressive income tax system. However, cost of living outside Portland is reasonable. Quality of life and outdoor activities are major attractions.",
    popularSalaries: [55000, 80000, 110000, 155000],
  },

  maryland: {
    name: "Maryland",
    taxType: "Progressive state income tax (2%-5.75%)",
    description:
      "Maryland has a moderate progressive income tax. Baltimore offers lower cost of living than DC area. Proximity to major cities creates good job market opportunities.",
    popularSalaries: [65000, 95000, 135000, 185000],
  },

  massachusetts: {
    name: "Massachusetts",
    taxType: "State income tax (5% on wages, higher on capital gains)",
    description:
      "Massachusetts has a 5% income tax on wages. Boston is a major job hub with high salaries but also high cost of living. Strong biotech, finance, and technology sectors.",
    popularSalaries: [75000, 115000, 160000, 210000],
  },

  michigan: {
    name: "Michigan",
    taxType: "Flat state income tax (4.25%)",
    description:
      "Michigan has a flat 4.25% income tax. Detroit and Grand Rapids offer growing job markets. Cost of living is affordable, especially outside major metros.",
    popularSalaries: [55000, 80000, 115000, 160000],
  },

  minnesota: {
    name: "Minnesota",
    taxType: "Progressive state income tax (5.35%-9.85%)",
    description:
      "Minnesota has a higher progressive income tax reaching 9.85%. Minneapolis-St. Paul is a strong job market with good salaries offsetting higher taxes. Excellent quality of life.",
    popularSalaries: [70000, 105000, 150000, 200000],
  },

  mississippi: {
    name: "Mississippi",
    taxType: "Progressive state income tax (0%-5%)",
    description:
      "Mississippi has one of the lowest income tax rates capped at 5%. Cost of living is very affordable. This combination makes take-home pay stretch significantly.",
    popularSalaries: [45000, 65000, 90000, 135000],
  },

  missouri: {
    name: "Missouri",
    taxType: "Progressive state income tax (1.5%-5.3%)",
    description:
      "Missouri has a moderate progressive income tax. St. Louis and Kansas City offer strong job markets with reasonable cost of living. Affordable housing is a major advantage.",
    popularSalaries: [50000, 75000, 110000, 155000],
  },

  montana: {
    name: "Montana",
    taxType: "Progressive state income tax (1%-6.84%)",
    description:
      "Montana has a moderate progressive income tax. Cost of living is low to moderate with excellent quality of life. Growing remote work opportunities and natural beauty appeal.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },

  nebraska: {
    name: "Nebraska",
    taxType: "Progressive state income tax (2.84%-6.84%)",
    description:
      "Nebraska has a moderate progressive income tax. Omaha is a growing job center with reasonable cost of living. Affordable housing makes salaries stretch further.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },

  nevada: {
    name: "Nevada",
    taxType: "No state income tax",
    description:
      "Nevada has no state income tax, maximizing take-home pay. Las Vegas and Reno offer entertainment and tourism jobs. However, housing costs have risen in recent years.",
    popularSalaries: [60000, 85000, 120000, 165000],
  },

  "new-hampshire": {
    name: "New Hampshire",
    taxType: "No income tax on wages (only on dividends/interest at 5%)",
    description:
      "New Hampshire has no tax on wages, making it attractive for high earners. Cost of living is moderate to high. Proximity to major Northeast cities creates commuting opportunities.",
    popularSalaries: [70000, 105000, 150000, 195000],
  },

  "new-jersey": {
    name: "New Jersey",
    taxType: "Progressive state income tax (1.4%-10.75%)",
    description:
      "New Jersey has a progressive income tax reaching 10.75% for high earners. Cost of living is high, especially near NYC. However, salaries are often higher due to proximity to major employers.",
    popularSalaries: [75000, 120000, 170000, 230000],
  },

  "new-mexico": {
    name: "New Mexico",
    taxType: "Progressive state income tax (1.7%-5.9%)",
    description:
      "New Mexico has a moderate progressive income tax. Cost of living is affordable, especially outside Albuquerque and Santa Fe. Natural beauty and outdoor lifestyle appeal.",
    popularSalaries: [50000, 75000, 105000, 150000],
  },

  "north-carolina": {
    name: "North Carolina",
    taxType: "Flat state income tax (4.99%)",
    description:
      "North Carolina has a flat 4.99% income tax. Charlotte and Raleigh-Durham offer strong job markets with tech and finance opportunities. Growing population and reasonable cost of living.",
    popularSalaries: [60000, 90000, 130000, 180000],
  },

  "north-dakota": {
    name: "North Dakota",
    taxType: "Progressive state income tax (1.1%-2.9%)",
    description:
      "North Dakota has one of the lowest state income taxes capped at 2.9%. Cost of living is very affordable. However, harsh winters and smaller job market limit opportunities.",
    popularSalaries: [50000, 70000, 95000, 135000],
  },

  ohio: {
    name: "Ohio",
    taxType: "Progressive state income tax (0%-5.75%)",
    description:
      "Ohio has a moderate progressive income tax. Columbus, Cincinnati, and Cleveland offer job opportunities with affordable housing. Cost of living is very reasonable.",
    popularSalaries: [50000, 75000, 110000, 160000],
  },

  oklahoma: {
    name: "Oklahoma",
    taxType: "Progressive state income tax (0.5%-5.75%)",
    description:
      "Oklahoma has a reasonable progressive income tax. Cost of living is very affordable throughout the state. Oklahoma City offers growing job market opportunities.",
    popularSalaries: [48000, 70000, 100000, 145000],
  },

  oregon: {
    name: "Oregon",
    taxType: "Progressive state income tax (4.75%-9.9%)",
    description:
      "Oregon has a higher progressive income tax reaching 9.9% for top earners. Portland is a vibrant job market with strong tech sector. Cost of living is moderate to high.",
    popularSalaries: [65000, 100000, 145000, 195000],
  },

  pennsylvania: {
    name: "Pennsylvania",
    taxType: "Flat state income tax (3.07%)",
    description:
      "Pennsylvania has a low flat 3.07% income tax. Philadelphia and Pittsburgh offer strong job markets. Cost of living is reasonable, especially outside major metros.",
    popularSalaries: [55000, 80000, 120000, 165000],
  },

  "rhode-island": {
    name: "Rhode Island",
    taxType: "Progressive state income tax (3.75%-5.99%)",
    description:
      "Rhode Island has a moderate progressive income tax. Providence offers cultural amenities and job opportunities. Cost of living is moderate. Proximity to Boston area.",
    popularSalaries: [60000, 90000, 130000, 180000],
  },

  "south-carolina": {
    name: "South Carolina",
    taxType: "Progressive state income tax (0%-7%)",
    description:
      "South Carolina has a progressive income tax system. Charleston and Columbia offer growing job markets. Cost of living is affordable with beach lifestyle appeal.",
    popularSalaries: [55000, 80000, 115000, 160000],
  },

  "south-dakota": {
    name: "South Dakota",
    taxType: "No state income tax",
    description:
      "South Dakota has no state income tax, maximizing take-home pay. Cost of living is very affordable. However, job opportunities are more limited, favoring remote workers.",
    popularSalaries: [50000, 75000, 110000, 155000],
  },

  tennessee: {
    name: "Tennessee",
    taxType: "No state income tax on wages",
    description:
      "Tennessee has no state income tax on wages, significantly boosting take-home pay. Nashville and Memphis are growing job centers. Cost of living is very affordable.",
    popularSalaries: [55000, 85000, 125000, 175000],
  },

  utah: {
    name: "Utah",
    taxType: "Flat state income tax (4.95%)",
    description:
      "Utah has a flat 4.95% income tax. Salt Lake City offers tech job opportunities and outdoor lifestyle. Cost of living is reasonable with strong family-oriented communities.",
    popularSalaries: [60000, 90000, 135000, 185000],
  },

  vermont: {
    name: "Vermont",
    taxType: "Progressive state income tax (3.55%-8.75%)",
    description:
      "Vermont has a higher progressive income tax. Cost of living is moderate. Quality of life, natural beauty, and outdoor activities are major attractions for residents.",
    popularSalaries: [55000, 85000, 125000, 175000],
  },

  virginia: {
    name: "Virginia",
    taxType: "Progressive state income tax (2%-5.75%)",
    description:
      "Virginia has a moderate progressive income tax. Northern Virginia near DC has high salaries but also high cost of living. Downstate offers more affordable options.",
    popularSalaries: [65000, 100000, 150000, 210000],
  },

  "west-virginia": {
    name: "West Virginia",
    taxType: "Progressive state income tax (3%-6.5%)",
    description:
      "West Virginia has a moderate progressive income tax. Cost of living is very affordable. Natural beauty and outdoor activities appeal, though job opportunities are limited.",
    popularSalaries: [45000, 65000, 90000, 135000],
  },

  wisconsin: {
    name: "Wisconsin",
    taxType: "Progressive state income tax (3.54%-7.65%)",
    description:
      "Wisconsin has a moderate to higher progressive income tax. Milwaukee and Madison offer job opportunities. Cost of living is reasonable, especially outside major metros.",
    popularSalaries: [55000, 85000, 125000, 175000],
  },

  wyoming: {
    name: "Wyoming",
    taxType: "No state income tax",
    description:
      "Wyoming has no state income tax, maximizing take-home pay. Cost of living is affordable in most areas. Natural beauty and outdoor lifestyle are major attractions.",
    popularSalaries: [55000, 80000, 120000, 165000],
  },
};

/* -----------------------------
   METADATA
------------------------------ */

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const stateSlug = params.state.replace("-salary-guide", "");
  const state = STATE_DATA[stateSlug];

  if (!state) return {};

  return {
    title: `${state.name} Salary Guide (2026) – After Tax & Cost of Living`,
    description: `Complete 2026 salary guide for ${state.name}. See take-home pay examples, income tax structure, cost of living insights, and popular salary breakdowns.`,
    alternates: {
      canonical: `/${stateSlug}-salary-guide`,
    },
  };
}

/* -----------------------------
   PAGE
------------------------------ */

export default function StateSalaryGuide({ params }: PageProps) {
  const stateSlug = params.state.replace("-salary-guide", "");
  const state = STATE_DATA[stateSlug];

  if (!state) return notFound();

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-10">

        {/* Header */}
        <section>
          <h1 className="text-3xl font-bold text-gray-900">
            {state.name} Salary Guide (2026)
          </h1>

          <p className="mt-4 text-gray-700">
            This guide explains how salaries are taxed in {state.name}, what
            take-home pay looks like at different income levels, and how cost
            of living impacts real purchasing power.
          </p>
        </section>

        {/* Tax Overview */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-3">
            Income Tax Structure in {state.name}
          </h2>

          <p className="text-gray-700 mb-3">
            <strong>Tax system:</strong> {state.taxType}
          </p>

          <p className="text-gray-700">
            {state.description}
          </p>
        </section>

        {/* Popular Salary Levels */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Popular Salary Levels in {state.name}
          </h2>

          <ul className="space-y-2 text-blue-600">
            {state.popularSalaries.map((salary) => (
              <li key={salary}>
                <a href={`/salary/${salary}-${stateSlug}`}>
                  ${salary.toLocaleString()} salary after tax in {state.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Is It Enough */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Is This Salary Enough in {state.name}?
          </h2>

          <ul className="space-y-2 text-blue-600">
            {state.popularSalaries.map((salary) => (
              <li key={`enough-${salary}`}>
                <a href={`/living/is-${salary}-enough-in-${stateSlug}`}>
                  Is ${salary.toLocaleString()} enough to live in {state.name}?
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Best Cities */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Best Cities in {state.name} by Salary
          </h2>

          <a
            href={`/best-cities/${stateSlug}`}
            className="text-blue-600 underline"
          >
            View best cities ranked by affordability →
          </a>
        </section>

        {/* FAQ Section */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4 text-gray-700 text-sm">
            <div>
              <h3 className="font-medium">
                Is $100,000 a good salary in {state.name}?
              </h3>
              <p>
                It depends on the city and lifestyle. In high-cost metros,
                housing can significantly reduce disposable income. In lower-cost
                areas, $100,000 may provide a comfortable lifestyle.
              </p>
            </div>

            <div>
              <h3 className="font-medium">
                How much state income tax do you pay in {state.name}?
              </h3>
              <p>
                {state.taxType}. Your effective tax rate depends on income level,
                filing status, and deductions.
              </p>
            </div>

            <div>
              <h3 className="font-medium">
                What salary is considered middle class in {state.name}?
              </h3>
              <p>
                Middle-class income varies by region and household size. In
                higher-cost cities, middle-class thresholds are typically higher
                than the national median.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
