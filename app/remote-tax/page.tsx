import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";
import RemoteTaxForm from "./RemoteTaxForm";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildPageMeta({
  title: "Remote Work Tax Calculator — Live in One State, Work in Another (2026)",
  description: "Find out exactly what you owe when you live in one state and work remotely for a company in another. Covers all 50 states + D.C., convenience-of-employer rules, and double-taxation credits.",
  canonical: "/remote-tax",
});

const POPULAR_PAIRS = [
  { live: "texas",       work: "california",  label: "TX → CA" },
  { live: "florida",     work: "new-york",    label: "FL → NY" },
  { live: "washington",  work: "california",  label: "WA → CA" },
  { live: "texas",       work: "new-york",    label: "TX → NY" },
  { live: "nevada",      work: "california",  label: "NV → CA" },
  { live: "florida",     work: "illinois",    label: "FL → IL" },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I pay taxes in two states if I work remotely?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Generally, you pay income tax to your state of residence. However, some states (NY, CT, DE, PA, NE) use the 'convenience of employer' rule, which can require you to also pay tax to the employer's state. Most states offer a tax credit to prevent true double taxation.",
      },
    },
    {
      "@type": "Question",
      name: "What is the convenience of employer rule?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The convenience of employer rule, used by New York, Connecticut, Delaware, Pennsylvania, and Nebraska, taxes remote workers as if they worked in the employer's state — unless the remote arrangement is required by the employer's business necessity.",
      },
    },
    {
      "@type": "Question",
      name: "Which states have no income tax for remote workers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nine states have no state income tax: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming. Remote workers living in these states only pay federal income tax on their wages.",
      },
    },
  ],
};

export default function RemoteTaxLandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-sm font-medium text-blue-600 mb-2">Free Tax Tool · 2026</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Remote Work Tax Calculator</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Find out exactly what you owe when you live in one state and work remotely for a company in another.
            Covers all 51 states + D.C., convenience-of-employer rules, and double-taxation credits.
          </p>
        </div>

        {/* Interactive state selector (client component) */}
        <RemoteTaxForm />

        {/* Popular pairs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Popular State Combinations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {POPULAR_PAIRS.map((p) => (
              <a
                key={p.label}
                href={`/remote-tax/${p.live}/${p.work}`}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 px-4 py-3 transition-colors group"
              >
                <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{p.label}</span>
                <span className="text-gray-400 group-hover:text-blue-500 text-sm">→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: "No-Tax States",
              body: "AK, FL, NV, NH, SD, TN, TX, WA, WY have no state income tax — perfect home bases for remote workers.",
              accent: "border-t-4 border-green-400",
            },
            {
              title: "Convenience of Employer",
              body: "NY, CT, DE, PA, and NE can tax your wages as if you worked in their state — even when you work from home.",
              accent: "border-t-4 border-orange-400",
            },
            {
              title: "Avoid Double Taxation",
              body: "Most states offer a resident tax credit for taxes paid to another state, so you pay the higher rate — not both.",
              accent: "border-t-4 border-blue-400",
            },
          ].map((c) => (
            <div key={c.title} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${c.accent}`}>
              <p className="font-bold text-gray-900 mb-2">{c.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* FAQ section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {faqSchema.mainEntity.map((q) => (
              <div key={q.name} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-800 mb-1.5">{q.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{q.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center pb-4">
          All calculations use 2026 tax rules, single filer. This is an estimate — consult a tax professional.
        </p>
      </div>
    </main>
  );
}
