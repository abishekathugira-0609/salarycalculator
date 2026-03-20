import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import { toTitle } from "@/lib/stateCodeMap";
import jobsList from "@/data/jobs.json";
import { getSalaryEstimate } from "@/lib/data/salaryData";

export const dynamic = "force-static";
export const revalidate = 604800;

export const metadata: Metadata = buildPageMeta({
  title: "Job Salary Guide — After Tax Pay for Every Career (2026)",
  description: "Browse after-tax salary data for 70+ US jobs. See median pay, take-home income, and cost-of-living comparisons across 300+ cities for every major occupation.",
  canonical: "/jobs",
});

const JOB_CATEGORIES: Record<string, string[]> = {
  "Technology": [
    "software-engineer","data-scientist","cloud-architect","devops-engineer",
    "cybersecurity-analyst","full-stack-developer","ux-designer","product-manager",
    "data-analyst","machine-learning-engineer",
  ],
  "Healthcare": [
    "physician","registered-nurse","pharmacist","dentist","physical-therapist",
    "paramedic","social-worker","psychologist",
  ],
  "Business & Finance": [
    "accountant","financial-analyst","business-analyst","auditor",
    "tax-advisor","controller","insurance-agent",
  ],
  "Legal & Management": [
    "lawyer","paralegal","compliance-officer","operations-manager",
    "project-manager","human-resources-manager","marketing-manager","sales-manager",
  ],
  "Engineering & Trades": [
    "mechanical-engineer","civil-engineer","electrical-engineer",
    "construction-manager","supply-chain-manager",
  ],
  "Education & Public Service": [
    "teacher","school-counselor","principal","police-officer","firefighter",
  ],
  "Other": [
    "real-estate-agent","graphic-designer","chef",
  ],
};

const ALL_JOBS = jobsList as string[];

export default function JobsIndexPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Job Salary Guides",
    description: "After-tax salary data for 70+ US jobs across 300+ cities",
    numberOfItems: ALL_JOBS.length,
    itemListElement: ALL_JOBS.map((job, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: toTitle(job),
      url: `https://know-your-pay.com/jobs/${job}`,
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <p className="text-sm font-medium text-blue-600 mb-2">Job Salary Directory · 2026</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Job Salary Guides — After Tax (2026)
          </h1>
          <p className="text-gray-500 max-w-2xl">
            Median salary, take-home pay, and cost-of-living data for {ALL_JOBS.length}+ US jobs
            across 300+ cities. All figures use 2026 federal and state tax brackets.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["software-engineer","registered-nurse","teacher","accountant","data-scientist"].map((j) => {
              const est = getSalaryEstimate(j);
              return (
                <a key={j} href={`/jobs/${j}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition">
                  {toTitle(j)} {est ? `· $${Math.round(est.median / 1000)}k` : ""}
                </a>
              );
            })}
          </div>
        </div>

        {/* By category */}
        {Object.entries(JOB_CATEGORIES).map(([category, jobs]) => (
          <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{category}</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {jobs.filter((j) => ALL_JOBS.includes(j)).map((job) => {
                const est = getSalaryEstimate(job);
                return (
                  <a key={job} href={`/jobs/${job}`}
                    className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-blue-50 group transition">
                    <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                      {toTitle(job)}
                    </span>
                    {est && (
                      <span className="text-xs text-gray-400 group-hover:text-blue-500">
                        ${Math.round(est.p25 / 1000)}k – ${Math.round(est.p75 / 1000)}k
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}

        {/* All jobs A-Z */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Jobs A–Z</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[...ALL_JOBS].sort().map((job) => (
              <a key={job} href={`/jobs/${job}`}
                className="text-sm text-blue-600 hover:underline py-0.5">
                {toTitle(job)}
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
