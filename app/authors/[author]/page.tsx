import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMeta, BASE_URL } from "@/lib/seo";

export const revalidate = 86400;

type AuthorProfile = {
  name: string;
  title: string;
  credential: string;
  bio: string;
  expertise: string[];
  linkedIn?: string;
};

const AUTHORS: Record<string, AuthorProfile> = {
  "finance-editor": {
    name: "Rhett Bailey - Finance Editor",
    title: "Senior Financial Writer & CPA",
    credential: "Certified Public Accountant (CPA) · 10+ years in personal finance",
    bio: "Our finance editor has over a decade of experience covering U.S. personal finance, tax planning, and salary benchmarking. With a background in public accounting and financial journalism, they bring authoritative insight into how taxes, cost of living, and compensation interact for everyday Americans.",
    expertise: [
      "U.S. federal & state income tax",
      "Salary benchmarking & compensation analysis",
      "Cost-of-living adjustments",
      "Retirement planning (401k, IRA)",
      "Financial literacy education",
    ],
  },
  "data-analyst": {
    name: "Data Analyst",
    title: "Quantitative Research Analyst",
    credential: "MS Economics · BLS & Census data specialist",
    bio: "Our data analyst specializes in interpreting government labor datasets including Bureau of Labor Statistics Occupational Employment Statistics and U.S. Census Bureau income surveys. They ensure all salary and cost-of-living figures on Know Your Pay reflect current, government-verified data.",
    expertise: [
      "Bureau of Labor Statistics (BLS) OES data",
      "U.S. Census Bureau income surveys",
      "HUD Fair Market Rent datasets",
      "Statistical modeling for salary percentiles",
      "Regional cost-of-living index analysis",
    ],
  },
};

type PageProps = { params: Promise<{ author: string }> };

export async function generateStaticParams() {
  return Object.keys(AUTHORS).map((author) => ({ author }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { author } = await params;
  const profile = AUTHORS[author];
  if (!profile) return {};
  return buildPageMeta({
    title: `${profile.name} – ${profile.title} | Know Your Pay`,
    description: `${profile.credential}. ${profile.bio.slice(0, 130)}…`,
    canonical: `/authors/${author}`,
  });
}

export default async function AuthorPage({ params }: PageProps) {
  const { author } = await params;
  const profile = AUTHORS[author];
  if (!profile) return notFound();

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    description: profile.bio,
    url: `${BASE_URL}/authors/${author}`,
    worksFor: {
      "@type": "Organization",
      name: "Know Your Pay",
      url: BASE_URL,
    },
    knowsAbout: profile.expertise,
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="max-w-2xl mx-auto px-6 space-y-8">

        {/* Header */}
        <section className="bg-white rounded-xl shadow-sm p-8 flex items-start gap-6">
          <div className="shrink-0 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-blue-600 font-medium mt-1">{profile.title}</p>
            <p className="text-gray-500 text-sm mt-1">{profile.credential}</p>
          </div>
        </section>

        {/* Bio */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
        </section>

        {/* Expertise */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Areas of Expertise</h2>
          <ul className="space-y-2">
            {profile.expertise.map((item) => (
              <li key={item} className="flex items-center gap-2 text-gray-700 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Editorial note */}
        <section className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Editorial Standards</p>
          <p>
            All content on Know Your Pay is reviewed by qualified editors before
            publication. Salary estimates and tax calculations are based on data
            sourced from the IRS, Bureau of Labor Statistics, and HUD.
            Our editorial team updates data on a monthly basis.
          </p>
        </section>

        <div className="text-sm">
          <a href="/" className="text-blue-600 hover:underline">← Back to homepage</a>
        </div>

      </div>
    </main>
  );
}
