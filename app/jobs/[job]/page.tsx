import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta, SEED_JOBS } from "@/lib/seo";
import { toTitle, fmtUSD, fmtCompact } from "@/lib/stateCodeMap";
import { getSalaryEstimate } from "@/lib/data/salaryData";
import { calculateNetSalary } from "@/lib/salary/netSalary";
import statesCitiesData from "@/data/states-cities.json";
import jobsList from "@/data/jobs.json";

export const dynamic = "force-static";
export const revalidate = 86400;
export const dynamicParams = true;

const stateData = statesCitiesData as Record<string, string[]>;

export async function generateStaticParams() {
  return (jobsList as string[]).map((job) => ({ job }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ job: string }> }): Promise<Metadata> {
  const { job } = await params;
  const title = toTitle(job);
  return buildPageMeta({
    title: `${title} Salary by City — After Tax & Cost of Living (2026)`,
    description: `Compare ${title} salaries across 300+ US cities. See after-tax take-home pay, rent affordability, and purchasing power for ${title}s in every state.`,
    canonical: `/jobs/${job}`,
  });
}

// ── Static job profiles ────────────────────────────────────────────────────
const JOB_PROFILES: Record<string, {
  description: string;
  industries: string[];
  education: string;
  outlook: string;
  skills: string[];
  topEmployers: string[];
}> = {
  "accountant": {
    description: "Accountants prepare and examine financial records, ensure taxes are paid correctly, and help organizations run efficiently. They work across public accounting firms, corporations, nonprofits, and government agencies.",
    industries: ["Public Accounting", "Finance & Banking", "Healthcare", "Government", "Manufacturing"],
    education: "Bachelor's in Accounting or Finance; CPA license preferred",
    outlook: "4% growth (2022–2032), ~67,400 openings/year (BLS)",
    skills: ["GAAP / IFRS", "Tax Compliance", "Excel & ERP", "Auditing", "Financial Analysis"],
    topEmployers: ["Deloitte", "PwC", "EY", "KPMG", "JPMorgan Chase", "Bank of America"],
  },
  "software-engineer": {
    description: "Software engineers design, develop, and maintain software systems. They work across startups, Big Tech, finance, healthcare, and every industry reliant on technology.",
    industries: ["Technology", "Finance", "Healthcare IT", "Defense", "E-commerce"],
    education: "Bachelor's in Computer Science or related; bootcamp graduates common",
    outlook: "25% growth (2022–2032), ~162,900 openings/year (BLS)",
    skills: ["Python / Java / TypeScript", "System Design", "Cloud (AWS/GCP)", "APIs", "Databases"],
    topEmployers: ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Salesforce"],
  },
  "registered-nurse": {
    description: "Registered nurses provide and coordinate patient care, educate patients about health conditions, and provide advice and emotional support to patients and their families.",
    industries: ["Hospitals", "Ambulatory Care", "Home Health", "Nursing Homes", "Government"],
    education: "Associate's or Bachelor's in Nursing (ADN or BSN); RN license required",
    outlook: "6% growth (2022–2032), ~193,100 openings/year (BLS)",
    skills: ["Patient Assessment", "IV Therapy", "EHR Systems", "Critical Thinking", "Team Communication"],
    topEmployers: ["HCA Healthcare", "CommonSpirit", "Ascension", "Kaiser Permanente", "Mayo Clinic"],
  },
  "teacher": {
    description: "Teachers educate students in academic, social, and life skills. They plan lessons, assess progress, and collaborate with parents and administrators to support student development.",
    industries: ["K-12 Public Schools", "Private Schools", "Charter Schools", "Community Colleges"],
    education: "Bachelor's in Education; state teaching license required; Master's for advancement",
    outlook: "1–5% growth depending on grade level (BLS)",
    skills: ["Curriculum Development", "Classroom Management", "Differentiated Instruction", "Parent Communication"],
    topEmployers: ["Public School Districts", "KIPP", "Teach For America", "BASIS Schools"],
  },
  "data-scientist": {
    description: "Data scientists analyze and interpret complex data to help organizations make better decisions. They build predictive models, design experiments, and communicate findings to stakeholders.",
    industries: ["Technology", "Finance", "Healthcare", "Retail", "Consulting"],
    education: "Bachelor's or Master's in Data Science, Statistics, or CS",
    outlook: "35% growth (2022–2032), one of the fastest-growing roles (BLS)",
    skills: ["Python / R", "Machine Learning", "SQL", "Statistics", "Data Visualization"],
    topEmployers: ["Google", "Amazon", "Netflix", "Airbnb", "McKinsey", "Two Sigma"],
  },
};

const DEFAULT_PROFILE = {
  description: "This role involves specialized expertise and contributes significantly to their industry. Professionals typically work in a variety of sectors including private corporations, government agencies, and nonprofit organizations.",
  industries: ["Corporate", "Government", "Healthcare", "Finance", "Technology"],
  education: "Bachelor's degree in a relevant field; advanced certifications increase earning potential",
  outlook: "Steady demand with regional variation; remote work expanding the talent pool nationally",
  skills: ["Domain Expertise", "Communication", "Project Management", "Data Analysis", "Team Collaboration"],
  topEmployers: ["Fortune 500 companies", "Government agencies", "Consulting firms", "Healthcare systems"],
};

function getJobProfile(job: string) {
  return JOB_PROFILES[job] ?? DEFAULT_PROFILE;
}

// ── Job FAQs ───────────────────────────────────────────────────────────────
function buildFAQs(jobTitle: string, job: string, median: number, p25: number, p75: number) {
  const hourly = Math.round(median / 2080);
  return [
    {
      q: `What is the average ${jobTitle} salary in the US?`,
      a: `The national median ${jobTitle} salary is ${fmtUSD(median)}/year as of 2026. Entry-level positions start around ${fmtUSD(p25)} (25th percentile), while experienced professionals earn ${fmtUSD(p75)} or more (75th percentile). At the median, this works out to roughly ${fmtUSD(hourly)}/hour or ${fmtUSD(Math.round(median / 12))}/month gross.`,
    },
    {
      q: `How much does a ${jobTitle} take home after taxes?`,
      a: `After federal income tax, state tax, and FICA (Social Security + Medicare), a ${jobTitle} earning ${fmtUSD(median)} in a moderate-tax state like Texas typically takes home around ${fmtUSD(Math.round(calculateNetSalary({ salary: median, state: "TX" }).netSalary))}. In a high-tax state like California, take-home drops to roughly ${fmtUSD(Math.round(calculateNetSalary({ salary: median, state: "CA" }).netSalary))}. Use the calculator above for your exact city and filing status.`,
    },
    {
      q: `Which cities pay ${jobTitle}s the most?`,
      a: `${jobTitle}s typically earn the most in San Francisco, New York City, Seattle, and Boston — driven by high cost of living and strong industry demand. However, cities like Austin, Denver, and Phoenix offer competitive salaries with significantly lower state taxes, often yielding higher after-tax take-home pay than coastal metros.`,
    },
    {
      q: `Does state income tax significantly affect ${jobTitle} pay?`,
      a: `Yes — dramatically. A ${jobTitle} earning ${fmtUSD(median)} in Texas (no state income tax) takes home approximately ${fmtUSD(Math.round(calculateNetSalary({ salary: median, state: "TX" }).netSalary))} annually. The same salary in California yields just ${fmtUSD(Math.round(calculateNetSalary({ salary: median, state: "CA" }).netSalary))} — a gap of over ${fmtUSD(Math.round(calculateNetSalary({ salary: median, state: "CA" }).netSalary - calculateNetSalary({ salary: median, state: "TX" }).netSalary) * -1)} per year.`,
    },
    {
      q: `What is the ${jobTitle} salary growth outlook?`,
      a: getJobProfile(job).outlook,
    },
  ];
}

// ── Key states for the after-tax comparison ────────────────────────────────
const TAX_COMPARISON_STATES = [
  { code: "CA", name: "California" },
  { code: "NY", name: "New York" },
  { code: "TX", name: "Texas" },
  { code: "FL", name: "Florida" },
  { code: "WA", name: "Washington" },
  { code: "IL", name: "Illinois" },
  { code: "CO", name: "Colorado" },
  { code: "AZ", name: "Arizona" },
  { code: "GA", name: "Georgia" },
  { code: "NC", name: "North Carolina" },
];

const NO_TAX_STATES = new Set([
  "alaska","florida","nevada","new-hampshire","south-dakota",
  "tennessee","texas","washington","wyoming",
]);

const PRIORITY_STATES = [
  "california","texas","new-york","florida","washington",
  "illinois","massachusetts","georgia","arizona","colorado",
];

const JOB_RELATIONS: Record<string, string[]> = {
  "software-engineer": ["data-scientist","devops-engineer","cloud-architect","full-stack-developer","ux-designer"],
  "data-scientist": ["software-engineer","data-analyst","business-analyst","product-manager"],
  "registered-nurse": ["physician","pharmacist","physical-therapist","paramedic","social-worker"],
  "teacher": ["social-worker","psychologist"],
  "accountant": ["financial-analyst","auditor","tax-advisor","controller","business-analyst"],
  "lawyer": ["paralegal","compliance-officer"],
  "physician": ["registered-nurse","pharmacist","dentist","physical-therapist"],
};

function getRelatedJobs(job: string): string[] {
  const related = JOB_RELATIONS[job] || [];
  const others = (jobsList as string[]).filter((j) => j !== job && !related.includes(j));
  return [...related, ...others].slice(0, 8);
}

// ── Feature cities for top section ────────────────────────────────────────
const FEATURE_CITIES = [
  "new-york-city","los-angeles","chicago","houston","phoenix",
  "philadelphia","san-antonio","san-diego","dallas","san-jose",
  "austin","seattle","denver","nashville","miami",
  "boston","portland","las-vegas","atlanta","minneapolis",
  "raleigh","tampa","orlando","salt-lake-city","richmond",
  "pittsburgh","cincinnati","kansas-city","st-louis","cleveland",
  "sacramento","oklahoma-city","tucson","fresno","albuquerque",
  "omaha","long-beach","virginia-beach","colorado-springs","charlotte",
  "indianapolis","jacksonville","memphis","louisville","baltimore",
  "milwaukee","detroit","el-paso","baton-rouge","mesa",
];

// ── Salary range bar (SVG) ─────────────────────────────────────────────────
function SalaryRangeBar({ p25, median, p75 }: { p25: number; median: number; p75: number }) {
  // Visualise p10≈0.75*p25 to p90≈1.25*p75
  const low = Math.round(p25 * 0.78);
  const high = Math.round(p75 * 1.22);
  const range = high - low;
  const toX = (v: number) => Math.round(((v - low) / range) * 100);

  const p25x = toX(p25);
  const medx = toX(median);
  const p75x = toX(p75);

  return (
    <div className="mt-5">
      <div className="text-xs text-gray-400 mb-1">Salary distribution (estimated, US national)</div>
      <svg viewBox="0 0 400 56" className="w-full" aria-hidden="true">
        {/* background track */}
        <rect x="0" y="20" width="400" height="16" rx="8" fill="#f3f4f6" />
        {/* p25–p75 band */}
        <rect x={`${p25x * 4}`} y="20" width={`${(p75x - p25x) * 4}`} height="16" rx="4" fill="#bfdbfe" />
        {/* median line */}
        <rect x={`${medx * 4 - 2}`} y="14" width="4" height="28" rx="2" fill="#2563eb" />

        {/* labels */}
        <text x={`${p25x * 4}`} y="12" textAnchor="middle" fontSize="9" fill="#6b7280">P25</text>
        <text x={`${p25x * 4}`} y="52" textAnchor="middle" fontSize="9" fill="#6b7280">{fmtCompact(p25)}</text>

        <text x={`${medx * 4}`} y="10" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d4ed8">Median</text>
        <text x={`${medx * 4}`} y="54" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d4ed8">{fmtCompact(median)}</text>

        <text x={`${p75x * 4}`} y="12" textAnchor="middle" fontSize="9" fill="#6b7280">P75</text>
        <text x={`${p75x * 4}`} y="52" textAnchor="middle" fontSize="9" fill="#6b7280">{fmtCompact(p75)}</text>
      </svg>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function JobHubPage({
  params,
}: { params: Promise<{ job: string }> }) {
  const { job } = await params;
  if (!(jobsList as string[]).includes(job)) return notFound();

  const est = getSalaryEstimate(job);
  const jobTitle = toTitle(job);
  const profile = getJobProfile(job);
  const relatedJobs = getRelatedJobs(job);

  const allStateEntries = Object.entries(stateData);
  const orderedStates = [
    ...PRIORITY_STATES.map((s) => allStateEntries.find(([k]) => k === s)).filter(Boolean) as typeof allStateEntries,
    ...allStateEntries.filter(([s]) => !PRIORITY_STATES.includes(s)).sort(([a], [b]) => a.localeCompare(b)),
  ];

  const totalCities = Object.values(stateData).flat().length;

  // After-tax comparison by state at median salary
  const median = est?.median ?? 70000;
  const p25 = est?.p25 ?? 52000;
  const p75 = est?.p75 ?? 95000;

  const stateTaxRows = TAX_COMPARISON_STATES.map(({ code, name }) => {
    const r = calculateNetSalary({ salary: median, state: code });
    return {
      code,
      name,
      noTax: ["TX","FL","WA","NV","AK","SD","WY","NH","TN"].includes(code),
      stateTax: r.stateTax,
      totalTax: r.totalTax,
      netSalary: r.netSalary,
      effectiveRate: r.effectiveTaxRate,
      monthly: r.monthlyTakeHome,
    };
  }).sort((a, b) => b.netSalary - a.netSalary);

  const bestNet = stateTaxRows[0].netSalary;
  const worstNet = stateTaxRows[stateTaxRows.length - 1].netSalary;

  const faqs = est ? buildFAQs(jobTitle, job, median, p25, p75) : [];
  const hourly = Math.round(median / 2080);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <a href="/cities" className="hover:text-blue-600">Directory</a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{jobTitle} Salary</span>
        </nav>

        {/* ── Hero ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Job Salary Hub · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {jobTitle} Salary in the US (2026)
          </h1>
          <p className="text-gray-500 text-sm max-w-2xl mb-6">
            {profile.description}
          </p>

          {est && (
            <>
              {/* P25 / Median / P75 cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Entry Level (P25)", value: fmtUSD(p25), sub: "25th percentile", accent: "bg-gray-50 text-gray-800" },
                  { label: "Median Salary",     value: fmtUSD(median), sub: "50th percentile", accent: "bg-blue-50 border border-blue-100 text-blue-800" },
                  { label: "Senior (P75)",      value: fmtUSD(p75), sub: "75th percentile", accent: "bg-gray-50 text-gray-800" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-4 text-center ${s.accent}`}>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs font-medium mt-0.5">{s.label}</p>
                    <p className="text-xs opacity-60 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Salary range bar */}
              <SalaryRangeBar p25={p25} median={median} p75={p75} />
            </>
          )}

          {/* Hourly / monthly / weekly */}
          {est && (
            <div className="grid grid-cols-4 gap-3 mt-5">
              {[
                { label: "Hourly",    value: `$${hourly}` },
                { label: "Weekly",    value: fmtUSD(Math.round(median / 52)) },
                { label: "Monthly",   value: fmtUSD(Math.round(median / 12)) },
                { label: "Annual",    value: fmtUSD(median) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Related jobs */}
          <div className="mt-5 pt-5 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-2">Compare related salaries:</p>
            <div className="flex flex-wrap gap-2">
              {relatedJobs.slice(0, 6).map((j) => (
                <a key={j} href={`/jobs/${j}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors">
                  {toTitle(j)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── After-tax by state ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {jobTitle} Take-Home Pay by State
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {fmtUSD(median)} median salary · single filer · 2026 tax rules
            </p>
          </div>

          {/* Stacked visual bar */}
          <div className="px-6 pt-5 pb-2">
            <div className="flex items-end gap-1 h-24">
              {stateTaxRows.map((row) => {
                const heightPct = Math.round(((row.netSalary - worstNet) / (bestNet - worstNet)) * 70) + 30;
                return (
                  <div key={row.code} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-medium hidden sm:block">
                      {fmtCompact(row.netSalary)}
                    </span>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: row.noTax ? "#4ade80" : "#60a5fa",
                      }}
                      title={`${row.name}: ${fmtUSD(row.netSalary)}/yr take-home`}
                    />
                    <span className="text-[9px] text-gray-600 font-semibold">{row.code}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />No state income tax</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />Has state income tax</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">State</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">State Tax</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Tax</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Eff. Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Take-Home / yr</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {stateTaxRows.map((row, i) => (
                  <tr key={row.code} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 ${i === 0 ? "bg-green-50/40" : ""}`}>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {row.name}
                        {row.noTax && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">No tax</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtUSD(row.stateTax)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtUSD(row.totalTax)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{row.effectiveRate}%</td>
                    <td className={`px-4 py-3 text-right font-bold ${i === 0 ? "text-green-700" : i === stateTaxRows.length - 1 ? "text-red-600" : "text-gray-900"}`}>
                      {fmtUSD(row.netSalary)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtUSD(row.monthly)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 text-xs text-blue-700">
            State choice can change your annual take-home by up to {fmtUSD(bestNet - worstNet)} on a {fmtUSD(median)} salary.
          </div>
        </div>

        {/* ── Job Profile ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">{jobTitle} Career Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Top Industries</p>
              <ul className="space-y-1">
                {profile.industries.map((ind) => (
                  <li key={ind} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {ind}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Education</p>
              <p className="text-sm text-gray-700">{profile.education}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Job Outlook</p>
              <p className="text-sm text-gray-700">{profile.outlook}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Top Employers</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.topEmployers.map((emp) => (
                  <span key={emp} className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 text-xs">
                    {emp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Top 50 cities ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{jobTitle} Salary — Top 50 Cities</h2>
          <p className="text-sm text-gray-400 mb-4">Click any city for after-tax breakdown, rent affordability, and local comparison</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {FEATURE_CITIES.map((city) => (
              <a key={city} href={`/job-salary/${job}/${city}`}
                className="flex items-center justify-between text-sm text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1.5 group">
                <span className="group-hover:underline truncate">{toTitle(city)}</span>
                <span className="text-gray-300 group-hover:text-blue-400 ml-1 flex-shrink-0">→</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Salary levels × cities ── */}
        {est && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Is This {jobTitle} Salary Good?
            </h2>
            <p className="text-sm text-gray-500 mb-4">Compare each pay level across major cities.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { sal: p25,   label: "Entry Level", sub: `${fmtUSD(p25)}/yr`, color: "bg-gray-50 border-gray-100" },
                { sal: median, label: "Mid-Career",  sub: `${fmtUSD(median)}/yr`, color: "bg-blue-50 border-blue-100" },
                { sal: p75,   label: "Senior",      sub: `${fmtUSD(p75)}/yr`, color: "bg-gray-50 border-gray-100" },
              ].map(({ sal, label, sub, color }) => (
                <div key={sal} className={`rounded-xl p-4 border ${color}`}>
                  <p className="font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mb-3 mt-0.5">{sub}</p>
                  <div className="space-y-1.5">
                    {["new-york-city","austin","chicago","seattle","miami","denver"].map((city) => (
                      <a key={city} href={`/is-salary-good/${sal}/${city}`}
                        className="flex justify-between items-center text-xs text-blue-600 hover:underline">
                        <span>{toTitle(city)}</span>
                        <span className="text-gray-400">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {faqs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
            <div className="space-y-5">
              {faqs.map((f) => (
                <div key={f.q} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                  <h3 className="font-semibold text-gray-900 mb-2">{f.q}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── State-by-state directory ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">{jobTitle} Salary — All States & Cities</h2>
            <p className="text-sm text-gray-400 mt-0.5">{orderedStates.length} states · {totalCities} cities</p>
          </div>
          <div className="divide-y divide-gray-50">
            {orderedStates.map(([stateSlug, cities]) => (
              <div key={stateSlug} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <a href={`/cities/${stateSlug}`} className="font-semibold text-gray-900 hover:text-blue-600">
                    {toTitle(stateSlug)}
                  </a>
                  {NO_TAX_STATES.has(stateSlug) && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">No income tax</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                  {cities.map((city) => (
                    <a key={city} href={`/job-salary/${job}/${city}`}
                      className="text-sm text-blue-600 hover:underline truncate">
                      {toTitle(city)}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── All jobs ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Job Salary Guides</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(jobsList as string[]).filter((j) => j !== job).map((j) => (
              <a key={j} href={`/jobs/${j}`} className="text-sm text-blue-600 hover:underline">
                {toTitle(j)}
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
