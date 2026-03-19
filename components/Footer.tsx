/**
 * Global site footer — included in every page via app/layout.tsx.
 * Provides crawler-discoverable links to all major hub pages.
 * Keep this a server component (no "use client").
 */

import { ALL_SALARY_BUCKETS } from "@/lib/seo";
import { fmtCompact } from "@/lib/stateCodeMap";

const TOP_STATES = [
  { slug: "texas",          noTax: true  },
  { slug: "california",     noTax: false },
  { slug: "florida",        noTax: true  },
  { slug: "new-york",       noTax: false },
  { slug: "washington",     noTax: true  },
  { slug: "illinois",       noTax: false },
  { slug: "massachusetts",  noTax: false },
  { slug: "georgia",        noTax: false },
  { slug: "arizona",        noTax: false },
  { slug: "colorado",       noTax: false },
  { slug: "nevada",         noTax: true  },
  { slug: "north-carolina", noTax: false },
];

const TOP_JOBS = [
  "software-engineer", "registered-nurse", "teacher",
  "accountant", "financial-analyst", "data-scientist",
  "product-manager", "lawyer", "mechanical-engineer", "physician",
];

function toTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

        {/* Main link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">

          {/* City directory */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">City Directory</h3>
            <ul className="space-y-1.5">
              <li>
                <a href="/cities" className="text-xs text-gray-400 hover:text-white transition-colors">
                  All States &amp; Cities
                </a>
              </li>
              {TOP_STATES.slice(0, 8).map(({ slug, noTax }) => (
                <li key={slug}>
                  <a href={`/cities/${slug}`} className="text-xs text-gray-400 hover:text-white transition-colors">
                    {toTitle(slug)}{noTax ? " (no tax)" : ""}
                  </a>
                </li>
              ))}
              <li>
                <a href="/all-pages" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Full page index →
                </a>
              </li>
            </ul>
          </div>

          {/* Salary guides */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Salary Guides</h3>
            <ul className="space-y-1.5">
              {ALL_SALARY_BUCKETS.map((sal) => (
                <li key={sal}>
                  <a href={`/salary-guides/${sal}`} className="text-xs text-gray-400 hover:text-white transition-colors">
                    {fmtCompact(sal)} salary guide
                  </a>
                </li>
              ))}
              <li className="pt-1 border-t border-gray-800 mt-1">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">By State</span>
              </li>
              {[
                { sal: 100000, state: "texas",      label: "$100k in Texas" },
                { sal: 100000, state: "california",  label: "$100k in California" },
                { sal: 80000,  state: "new-york",    label: "$80k in New York" },
                { sal: 80000,  state: "florida",     label: "$80k in Florida" },
                { sal: 120000, state: "washington",  label: "$120k in Washington" },
              ].map(({ sal, state, label }) => (
                <li key={`${sal}-${state}`}>
                  <a href={`/salary-guides/${sal}/${state}`} className="text-xs text-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Job salary guides */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Job Salaries</h3>
            <ul className="space-y-1.5">
              {TOP_JOBS.map((job) => (
                <li key={job}>
                  <a href={`/jobs/${job}`} className="text-xs text-gray-400 hover:text-white transition-colors">
                    {toTitle(job)}
                  </a>
                </li>
              ))}
              <li>
                <a href="/all-pages#job-hubs" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  All job guides →
                </a>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Tools &amp; Comparisons</h3>
            <ul className="space-y-1.5">
              {[
                { href: "/calculator",               label: "Salary Calculator" },
                { href: "/job-offer-reality-check", label: "Job Offer Reality Check" },
                { href: "/compare",                  label: "Compare Cities" },
                { href: "/migration",                label: "Relocation Salary Guide" },
                { href: "/comfortable-salary/austin",    label: "Comfortable Salary — Austin" },
                { href: "/comfortable-salary/new-york-city", label: "Comfortable Salary — NYC" },
                { href: "/comfortable-salary/los-angeles",   label: "Comfortable Salary — LA" },
                { href: "/rankings/100000",           label: "City Rankings ($100k)" },
                { href: "/rankings/80000",            label: "City Rankings ($80k)" },
                { href: "/compare/new-york-city-vs-los-angeles", label: "NYC vs Los Angeles" },
                { href: "/compare/austin-vs-seattle",            label: "Austin vs Seattle" },
                { href: "/migration/san-francisco/austin",       label: "SF → Austin Salary Guide" },
                { href: "/remote-tax/california/texas",          label: "CA → TX Remote Tax" },
                { href: "/remote-tax/new-york/florida",          label: "NY → FL Remote Tax" },
                { href: "/all-pages",                 label: "Full Page Directory" },
                { href: "/methodology",               label: "Methodology" },
                { href: "/about",                     label: "About" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="text-xs text-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Authority */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Learn &amp; Research</h3>
            <ul className="space-y-1.5">
              {[
                { href: "/guides",                                           label: "Salary & Tax Guides" },
                { href: "/guides/how-taxes-affect-take-home-pay",            label: "How Taxes Affect Pay" },
                { href: "/guides/understanding-cost-of-living-differences",  label: "Cost-of-Living Guide" },
                { href: "/guides/how-much-salary-do-you-need-to-live-comfortably", label: "Comfortable Salary Guide" },
                { href: "/faq",                                              label: "Salary & Tax FAQ" },
                { href: "/reports/best-cities-for-100k-salary",             label: "Best Cities for $100k" },
                { href: "/reports/worst-cities-for-rent-affordability",     label: "Worst Cities for Rent" },
                { href: "/is-salary-good/100000/austin",                    label: "Is $100k Good in Austin?" },
                { href: "/is-salary-good/80000/new-york-city",              label: "Is $80k Good in NYC?" },
                { href: "/authors/finance-editor",                          label: "Our Finance Editor" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <a href={href} className="text-xs text-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* State salary guides bar */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">State Salary Guides</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {TOP_STATES.map(({ slug }) => (
              <a key={slug} href={`/${slug}-salary-guide`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                {toTitle(slug)}
              </a>
            ))}
          </div>
        </div>

        {/* Comfortable salary bar */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">Comfortable Salary By City</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              "austin","denver","seattle","chicago","miami","boston",
              "atlanta","dallas","phoenix","san-francisco","los-angeles","new-york-city",
            ].map((city) => (
              <a key={city} href={`/comfortable-salary/${city}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                {toTitle(city)}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {year} Know Your Pay · Tax data updated for {year} · Not financial advice
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <a href="/methodology" className="hover:text-gray-300 transition-colors">Methodology</a>
            <a href="/faq"         className="hover:text-gray-300 transition-colors">FAQ</a>
            <a href="/guides"      className="hover:text-gray-300 transition-colors">Guides</a>
            <a href="/disclaimer"  className="hover:text-gray-300 transition-colors">Disclaimer</a>
            <a href="/about"       className="hover:text-gray-300 transition-colors">About</a>
            <a href="/contact"     className="hover:text-gray-300 transition-colors">Contact</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
